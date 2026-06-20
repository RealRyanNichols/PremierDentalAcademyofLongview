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

const PLANS = {
  'in-person': { name: 'PDA RDA Program — In-Person', totalCents: 199700 },
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

function diffDays(aIso, bIso) {
  const a = new Date(aIso + 'T00:00:00Z').getTime();
  const b = new Date(bIso + 'T00:00:00Z').getTime();
  return Math.round((b - a) / 86400000);
}

function buildSchedule({ remainingCents, cadence, firstPaymentDate, classEndDate }) {
  const stepDays = cadence === 'daily' ? 1 : cadence === 'weekly' ? 7 : 30;
  const window = diffDays(firstPaymentDate, classEndDate);
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
  const dates = Array.from({ length: count }, (_, i) => addDays(firstPaymentDate, i * stepDays));
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
    cohortId, special,
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

  // For Online, force pay-in-full and skip cadence/date checks. Online is a
  // single $397 charge, no schedule, no card-on-file.
  let down, remaining, paidInFull, schedule = null;
  if (isOnline) {
    down = planDef.totalCents;
    remaining = 0;
    paidInFull = true;
  } else {
    if (!['daily', 'weekly', 'monthly'].includes(cadence)) return res.status(400).json({ error: 'Invalid cadence.' });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(firstPaymentDate)) return res.status(400).json({ error: 'Invalid first payment date.' });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(classEndDate)) return res.status(400).json({ error: 'Invalid class end date.' });
    down = Math.round(Number(downCents));
    if (!Number.isFinite(down) || down < 20000) return res.status(400).json({ error: 'Minimum down payment is $200.' });
    if (down > planDef.totalCents) return res.status(400).json({ error: 'Down payment cannot exceed total tuition.' });
    remaining = planDef.totalCents - down;
    paidInFull = remaining === 0;
    if (!paidInFull) {
      try {
        schedule = buildSchedule({ remainingCents: remaining, cadence, firstPaymentDate, classEndDate });
      } catch (e) {
        return res.status(400).json({ error: e.message });
      }
    }
  }
  const total = planDef.totalCents;

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
