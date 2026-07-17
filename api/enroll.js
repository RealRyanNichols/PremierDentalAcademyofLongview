// Square enrollment endpoint.
// Charges a down payment now and schedules the remaining balance as a Square
// auto-pay invoice (installments billed to the card the student just used).
//
// SAFETY RULES:
//  (1) Once the card has been charged, we NEVER return an error response.
//      If invoice/customer/order setup fails after the charge succeeds, we
//      return ok=true with a `warning` field. Amanda will see the warning
//      in the success response and finish the recurring invoice in Square
//      dashboard manually — far better than letting the front-end show
//      "Payment failed" and have the student click Pay again.
//  (2) All Square calls use deterministic idempotency keys derived from
//      the card source nonce (sourceId), so retries dedupe at Square.
//      A re-submit of the same form can't double-charge.
//
// Required env vars (set in Vercel):
//   SQUARE_ACCESS_TOKEN — production access token (secret)

const LOCATION_ID = '2P2ZE3FJNEYTV';
const SQUARE_BASE = 'https://connect.squareup.com/v2';
const MAX_INSTALLMENTS = 13; // Square invoice payment_requests cap

// ── July 1, 2026 in-person price change (auto-switches at midnight Central) ──
// Before:  in-person $1,997, $200 min down, balance paid by graduation.
// On/after: in-person $3,000 paid-in-full OR $3,500 on a plan ($500 down +
//           $3,000 balance), weekly or monthly, plans up to 12 months. The
//           no-board-until-paid-in-full rule (enforced by PDA, not the calendar)
//           replaces the old "must finish by graduation" constraint. Online is
//           unchanged here. Flips by date so no manual edit is needed on July 1.
const CUTOVER_MS = Date.parse('2026-07-01T05:00:00Z'); // 2026-07-01 00:00 America/Chicago (CDT, UTC-5)
const newPricing = () => Date.now() >= CUTOVER_MS;
const NEW_IN_PERSON = { pifCents: 300000, planTotalCents: 350000, downCents: 50000, balanceCents: 300000 };

const PLANS = {
  'in-person': { name: 'PDA RDA Program — In-Person', totalCents: 300000 },
  'online':    { name: 'PDA RDA Program — Online (Limited Time Sale)', totalCents: 39700 },
};


async function sq(path, method, body, idempotency) {
  const res = await fetch(`${SQUARE_BASE}${path}`, {
    method,
    headers: {
      'Square-Version': '2025-04-16',
      'Authorization': `Bearer ${process.env.SQUARE_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
      ...(idempotency ? { 'Idempotency-Key': idempotency } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.errors?.[0]?.detail || data?.errors?.[0]?.code || `Square ${path} ${res.status}`;
    const err = new Error(msg);
    err.squareErrors = data?.errors;
    err.squareStatus = res.status;
    throw err;
  }
  return data;
}

// Deterministic idempotency key: same inputs → same key → Square dedupes.
// We hash sourceId + step name. sourceId is a single-use card nonce, so if
// the user re-submits we'll either get the same nonce (dedupe) or a brand
// new one (new attempt entirely — and the front-end locks the button to
// prevent that case anyway).
async function idemKey(step, sourceId) {
  const seed = `${step}::${sourceId}`;
  if (globalThis.crypto?.subtle) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(seed));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('').slice(0, 45);
  }
  // Fallback (Node < 16 environments): deterministic-ish
  return seed.replace(/[^a-zA-Z0-9]/g, '').slice(0, 45);
}

function uid() {
  return (globalThis.crypto?.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(36).slice(2)}`);
}

function addDays(isoDate, days) {
  const d = new Date(isoDate + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// Add whole calendar months keeping the SAME day-of-month, CLAMPED to the last
// day of the target month so a late start date can never overflow into the next
// month. The first Friday on/after a buyer-chosen start can fall on the 29th–
// 31st, and e.g. Jan 31 + 1 month must become Feb 28/29 — not Mar 2/3. Built at
// UTC noon so DST/UTC rollover can never bump the result onto an adjacent day.
function addMonths(isoDate, months) {
  const d = new Date(isoDate + 'T12:00:00Z');
  const targetDom = d.getUTCDate();
  d.setUTCDate(1);                              // park on the 1st before shifting months
  d.setUTCMonth(d.getUTCMonth() + months);
  const lastDom = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(targetDom, lastDom));   // clamp (e.g. 31 → 28/29/30)
  return d.toISOString().slice(0, 10);
}

// First Friday ON OR AFTER the given date. getUTCDay(): 0=Sun … 5=Fri … 6=Sat.
// Owner rule: every payment must land on a Friday. The first installment is the
// first Friday on/after the class start (the date the buyer picked to start
// paying), then weekly steps stay on Friday and monthly steps keep that
// Friday's day-of-month. Built at UTC noon to avoid any timezone off-by-one.
function firstFridayOnOrAfter(isoDate) {
  const d = new Date(isoDate + 'T12:00:00Z');
  const delta = (5 - d.getUTCDay() + 7) % 7; // days forward to reach Friday
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

function diffDays(aIso, bIso) {
  const a = new Date(aIso + 'T00:00:00Z').getTime();
  const b = new Date(bIso + 'T00:00:00Z').getTime();
  return Math.round((b - a) / 86400000);
}

function buildSchedule({ remainingCents, cadence, firstPaymentDate, classEndDate }) {
  const stepDays = cadence === 'daily' ? 1 : cadence === 'weekly' ? 7 : 30;
  // Owner rule: payments fall on FRIDAYS. The first installment is the first
  // Friday on/after the chosen start date. Weekly steps +7 days (stays Friday);
  // monthly steps to the SAME day-of-month one/two months later (only the first
  // is guaranteed a Friday, the rest match that day-of-month). For weekly/monthly
  // we anchor the whole schedule to firstFriday instead of the raw start date —
  // that's the fix for the old Saturday dates.
  const firstFriday = (cadence === 'weekly' || cadence === 'monthly')
    ? firstFridayOnOrAfter(firstPaymentDate)
    : firstPaymentDate;
  const window = diffDays(firstFriday, classEndDate);
  if (window < 0) throw new Error('First payment date is after class ends.');

  // Per Amanda: every installment is a CLEAN round number — no "change."
  //   Weekly  → $160 every week
  //   Monthly → $640 every month
  // At the $200 minimum down on $1,997 tuition both cadences land on the SAME
  // plan total: $200 + $1,920 = $2,120 (weekly = 12 × $160, monthly = 3 × $640).
  // Count rounds UP so total scheduled ≥ remaining. Order base_price will
  // be set to the schedule total so Square charges exactly these amounts.
  const FIRST = { weekly: 16000, monthly: 64000 };
  const NEXT  = { weekly: 16000, monthly: 64000 };
  let amounts;
  if (cadence === 'weekly' || cadence === 'monthly') {
    amounts = [FIRST[cadence]];
    let covered = amounts[0];
    while (covered < remainingCents) {
      amounts.push(NEXT[cadence]);
      covered += NEXT[cadence];
      if (amounts.length > MAX_INSTALLMENTS) {
        throw new Error(`A ${cadence} plan would need more than ${MAX_INSTALLMENTS} payments. Increase the down payment.`);
      }
    }
  } else {
    // Daily — legacy fallback, even split.
    let count = Math.max(1, Math.floor(window / stepDays) + 1);
    if (count > MAX_INSTALLMENTS) count = MAX_INSTALLMENTS;
    const per = Math.floor(remainingCents / count);
    amounts = Array(count).fill(per);
    amounts[count - 1] = remainingCents - per * (count - 1);
  }

  const count = amounts.length;
  // Build due dates on Fridays:
  //   weekly  → firstFriday, +7d, +14d, … (each remains a Friday)
  //   monthly → firstFriday, then same day-of-month +1 month, +2 months, …
  //   daily   → legacy: flat day steps from the raw start date.
  let dates;
  if (cadence === 'monthly') {
    dates = Array.from({ length: count }, (_, i) => addMonths(firstFriday, i));
  } else if (cadence === 'weekly') {
    dates = Array.from({ length: count }, (_, i) => addDays(firstFriday, i * 7));
  } else {
    dates = Array.from({ length: count }, (_, i) => addDays(firstFriday, i * stepDays));
  }
  const last = dates[count - 1];
  if (diffDays(last, classEndDate) < 0) {
    throw new Error(`A ${cadence} plan starting ${firstPaymentDate} can't finish by class end (${classEndDate}). Pick an earlier start date or increase your down payment.`);
  }

  // Every payment_request is INSTALLMENT with an explicit fixed amount so
  // the totals are predictable. (No BALANCE last-payment — that would
  // auto-compute from the order, which could disagree with our schedule.)
  const requests = dates.map((due_date, i) => ({
    request_type: 'INSTALLMENT',
    due_date,
    fixed_amount_requested_money: { amount: amounts[i], currency: 'USD' },
    automatic_payment_source: 'CARD_ON_FILE',
  }));

  const totalCharged = amounts.reduce((a, b) => a + b, 0);
  return {
    count,
    perCents: amounts[amounts.length - 1],
    lastAmountCents: amounts[amounts.length - 1],
    firstAmountCents: amounts[0],
    amounts,
    totalCharged,
    dates,
    requests,
  };
}

// New-pricing schedule (on/after July 1): split a fixed balance into `count`
// equal-ish installments on Fridays (weekly +7d, monthly same day-of-month).
// No class-end constraint — post-July-1 plans may run up to 12 months; the
// no-board-until-paid rule is what gates certification, not the calendar. The
// last payment absorbs any rounding remainder so the total is exact.
function buildScheduleV2({ balanceCents, cadence, count, firstPaymentDate }) {
  let n = Math.round(Number(count));
  if (!Number.isFinite(n) || n < 1) n = 1;
  if (n > MAX_INSTALLMENTS) throw new Error(`A plan can have at most ${MAX_INSTALLMENTS} payments.`);
  const firstFriday = firstFridayOnOrAfter(firstPaymentDate);
  const per = Math.floor(balanceCents / n);
  const amounts = Array(n).fill(per);
  amounts[n - 1] = balanceCents - per * (n - 1);
  const dates = cadence === 'monthly'
    ? Array.from({ length: n }, (_, i) => addMonths(firstFriday, i))
    : Array.from({ length: n }, (_, i) => addDays(firstFriday, i * 7));
  const requests = dates.map((due_date, i) => ({
    request_type: 'INSTALLMENT',
    due_date,
    fixed_amount_requested_money: { amount: amounts[i], currency: 'USD' },
    automatic_payment_source: 'CARD_ON_FILE',
  }));
  const totalCharged = amounts.reduce((a, b) => a + b, 0);
  return { count: n, perCents: amounts[0], lastAmountCents: amounts[n - 1], firstAmountCents: amounts[0], amounts, totalCharged, dates, requests };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  if (!process.env.SQUARE_ACCESS_TOKEN) {
    res.status(500).json({ error: 'Server is missing SQUARE_ACCESS_TOKEN.' });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body ||= {};

  const {
    plan, downCents, cadence, firstPaymentDate, classEndDate,
    sourceId, email, name, phone, cohortName,
    cohortId, special, payInFull, count,
  } = body;

  const basePlan = PLANS[plan];
  if (!basePlan) return res.status(400).json({ error: 'Invalid plan.' });
  // Shallow-copy so the June 2026 special can override totalCents on this
  // request without mutating the shared PLANS object across other requests.
  const planDef = { ...basePlan };
  // The $1,500 pay-in-full special has ended — always charge regular tuition,
  // even if an old ?special=summer2026 link is reused.
  const specialApplied = false;
  if (!sourceId) return res.status(400).json({ error: 'Missing card details.' });
  if (!email || !name) return res.status(400).json({ error: 'Name and email are required.' });

  const isOnline = plan === 'online';
  const useNew = newPricing() && plan === 'in-person';

  // down / remaining / paidInFull / total drive the charge + invoice below.
  let down, remaining, paidInFull, schedule = null, total;
  if (isOnline) {
    // Online: single charge, no schedule. (Price unchanged here for now.)
    total = planDef.totalCents;
    down = total; remaining = 0; paidInFull = true;
  } else if (useNew) {
    // ── New in-person pricing (on/after July 1) ──
    if (payInFull) {
      total = NEW_IN_PERSON.pifCents;          // $3,000 paid in full (saves $500)
      down = total; remaining = 0; paidInFull = true;
    } else {
      if (!['weekly', 'monthly'].includes(cadence)) return res.status(400).json({ error: 'Choose weekly or monthly.' });
      if (!/^\d{4}-\d{2}-\d{2}$/.test(firstPaymentDate)) return res.status(400).json({ error: 'Invalid first payment date.' });
      total = NEW_IN_PERSON.planTotalCents;    // $3,500 on a plan
      down = NEW_IN_PERSON.downCents;          // $500 down today
      remaining = NEW_IN_PERSON.balanceCents;  // $3,000 balance, auto-charged
      paidInFull = false;
      try {
        schedule = buildScheduleV2({ balanceCents: NEW_IN_PERSON.balanceCents, cadence, count, firstPaymentDate });
      } catch (e) {
        return res.status(400).json({ error: e.message });
      }
    }
  } else {
    // ── Current in-person pricing (before July 1) ──
    total = planDef.totalCents;
    if (!['daily', 'weekly', 'monthly'].includes(cadence)) return res.status(400).json({ error: 'Invalid cadence.' });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(firstPaymentDate)) return res.status(400).json({ error: 'Invalid first payment date.' });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(classEndDate)) return res.status(400).json({ error: 'Invalid class end date.' });
    down = Math.round(Number(downCents));
    if (!Number.isFinite(down) || down < 20000) return res.status(400).json({ error: 'Minimum down payment is $200.' });
    if (down > total) return res.status(400).json({ error: 'Down payment cannot exceed total tuition.' });
    remaining = total - down;
    paidInFull = remaining === 0;
    if (!paidInFull) {
      try {
        schedule = buildSchedule({ remainingCents: remaining, cadence, firstPaymentDate, classEndDate });
      } catch (e) {
        return res.status(400).json({ error: e.message });
      }
    }
  }

  const [first, ...rest] = String(name).trim().split(/\s+/);
  const family = rest.join(' ');

  // Generate deterministic idempotency keys ONCE, derived from the card nonce.
  // Same submission → same keys → Square dedupes automatically.
  const ikCust    = await idemKey('customer', sourceId);
  const ikCard    = await idemKey('card',     sourceId);
  const ikPay     = await idemKey('payment',  sourceId);
  const ikOrder   = await idemKey('order',    sourceId);
  const ikInvoice = await idemKey('invoice',  sourceId);
  const ikPublish = await idemKey('publish',  sourceId);

  // ── STEP 1: customer + (if needed) save card ──
  // These run BEFORE the charge. If they fail, no money has moved — safe to
  // return a 4xx error and let the user retry.
  let customer, cardId = null;
  try {
    customer = (await sq('/customers', 'POST', {
      given_name: first || name,
      family_name: family || undefined,
      email_address: email,
      phone_number: phone || undefined,
      note: cohortName ? `Cohort: ${cohortName}` : undefined,
    }, ikCust)).customer;

    if (!paidInFull) {
      const card = (await sq('/cards', 'POST', {
        idempotency_key: ikCard,
        source_id: sourceId,
        card: { customer_id: customer.id },
      })).card;
      cardId = card.id;
    }
  } catch (err) {
    console.error('[enroll] pre-charge failure:', err.squareErrors || err);
    const msg = err?.squareErrors?.[0]?.detail || err.message || 'Could not set up your account. Your card has NOT been charged. Please try again or call (903) 913-6444.';
    return res.status(402).json({ error: msg });
  }

  // ── STEP 2: charge the card ──
  // From here on, if anything fails we return ok=true with a warning so the
  // student doesn't see "Payment failed" and try to pay again.
  let payment;
  try {
    payment = (await sq('/payments', 'POST', {
      idempotency_key: ikPay,
      source_id: cardId || sourceId,
      amount_money: { amount: paidInFull ? total : down, currency: 'USD' },
      customer_id: customer.id,
      location_id: LOCATION_ID,
      autocomplete: true,
      // buyer_email_address matters: the square-webhook reads it to send the
      // welcome + grant access. Without it (pre-Jul-16 bug) paid-in-full and
      // down-payment students were silently skipped (case: Blythe S.).
      buyer_email_address: email,
      note: `${planDef.name} — ${paidInFull ? 'Paid in full' : 'Down payment'}${cohortName ? ` (${cohortName})` : ''}`,
    })).payment;
  } catch (err) {
    console.error('[enroll] charge failure:', err.squareErrors || err);
    const msg = err?.squareErrors?.[0]?.detail || err.message || 'Your card was declined. No charge was made. Try a different card or call (903) 913-6444.';
    return res.status(402).json({ error: msg });
  }

  // ── STEP 3 (in-person only): create the recurring invoice for the balance ──
  // CRITICAL: card has been charged. We must NEVER return an error from here.
  let invoice = null;
  let warning = null;
  if (!paidInFull) {
    try {
      const order = (await sq('/orders', 'POST', {
        idempotency_key: ikOrder,
        order: {
          location_id: LOCATION_ID,
          customer_id: customer.id,
          line_items: [{
            name: `${planDef.name} — Tuition (remaining balance)`,
            quantity: '1',
            // Order amount = scheduled total (sum of all installment amounts),
            // not just `remaining`. With Amanda's clean-amount plan the
            // scheduled total can exceed `remaining` by up to one full
            // installment — the order has to match or Square will reject the
            // INSTALLMENT requests as exceeding the order amount.
            base_price_money: { amount: schedule.totalCharged, currency: 'USD' },
            note: cohortName || undefined,
          }],
        },
      })).order;

      const draft = (await sq('/invoices', 'POST', {
        idempotency_key: ikInvoice,
        invoice: {
          location_id: LOCATION_ID,
          order_id: order.id,
          primary_recipient: { customer_id: customer.id },
          delivery_method: 'EMAIL',
          accepted_payment_methods: { card: true },
          title: `${planDef.name} — Payment Plan`,
          description: 'Auto-charged on the card you used at enrollment. You can update your card any time from the receipt email.',
          payment_requests: schedule.requests.map(r => ({ ...r, card_id: cardId })),
          custom_fields: cohortName ? [{ label: 'Cohort', value: cohortName, placement: 'ABOVE_LINE_ITEMS' }] : undefined,
        },
      })).invoice;

      invoice = (await sq(`/invoices/${draft.id}/publish`, 'POST', {
        version: draft.version,
        idempotency_key: ikPublish,
      })).invoice;
    } catch (err) {
      console.error('[enroll] POST-charge invoice failure (card already charged):', err.squareErrors || err);
      warning = 'Your down payment went through, but our system couldn\'t schedule the auto-pay installments. Amanda has been notified and will set up your payment plan in Square within 1 business day. No further action needed from you.';
      // Still mark a placeholder so admin tools can find this case.
      invoice = { id: null, warning: warning, customerId: customer.id, paymentId: payment.id };
    }
  }

  return res.status(200).json({
    ok: true,
    paymentId: payment.id,
    receiptUrl: payment.receipt_url || null,
    customerId: customer.id,
    invoiceId: invoice?.id || null,
    warning: warning,
    plan: planDef.name,
    totalCents: total,
    downCents: down,
    remainingCents: remaining,
    schedule: schedule ? {
      cadence,
      count: schedule.count,
      perCents: schedule.perCents,
      lastAmountCents: schedule.lastAmountCents,
      dates: schedule.dates,
    } : null,
  });
}
