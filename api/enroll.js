// Square enrollment endpoint.
// Charges a down payment now and schedules the remaining balance as a Square
// auto-pay invoice (installments billed to the card the student just used).
//
// Required env vars (set in Vercel):
//   SQUARE_ACCESS_TOKEN — production access token (secret)
// Hard-coded (public values):
//   LOCATION_ID — your Longview Square location

const LOCATION_ID = '2P2ZE3FJNEYTV';
const SQUARE_BASE = 'https://connect.squareup.com/v2';
const MAX_INSTALLMENTS = 13; // Square invoice payment_requests cap

const PLANS = {
  'in-person': { name: 'PDA RDA Program — In-Person', totalCents: 199700 },
  'online':    { name: 'PDA RDA Program — Online',    totalCents:  99700 },
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
    throw err;
  }
  return data;
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

  let count = Math.floor(window / stepDays) + 1;
  if (count < 1) count = 1;
  if (count > MAX_INSTALLMENTS) count = MAX_INSTALLMENTS;

  const per = Math.floor(remainingCents / count);
  const dates = [];
  for (let i = 0; i < count; i++) dates.push(addDays(firstPaymentDate, i * stepDays));

  const last = dates[dates.length - 1];
  if (diffDays(last, classEndDate) < 0) {
    throw new Error(`A ${cadence} plan starting ${firstPaymentDate} can't finish by class end (${classEndDate}). Pick an earlier start date or a faster cadence.`);
  }

  // First N-1 are INSTALLMENT with fixed amount; last is BALANCE (Square fills the remainder).
  const requests = dates.map((due_date, i) => {
    const isLast = i === dates.length - 1;
    if (isLast) {
      return { request_type: 'BALANCE', due_date, automatic_payment_source: 'CARD_ON_FILE' };
    }
    return {
      request_type: 'INSTALLMENT',
      due_date,
      fixed_amount_requested_money: { amount: per, currency: 'USD' },
      automatic_payment_source: 'CARD_ON_FILE',
    };
  });

  const lastAmount = remainingCents - per * (count - 1);
  return { count, perCents: per, lastAmountCents: lastAmount, dates, requests };
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
    sourceId, // card nonce from Web Payments SDK
    email, name, phone, cohortName,
  } = body;

  // Validate
  const planDef = PLANS[plan];
  if (!planDef) return res.status(400).json({ error: 'Invalid plan.' });
  if (!sourceId) return res.status(400).json({ error: 'Missing card details.' });
  if (!email || !name) return res.status(400).json({ error: 'Name and email are required.' });
  if (!['daily', 'weekly', 'monthly'].includes(cadence)) return res.status(400).json({ error: 'Invalid cadence.' });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(firstPaymentDate)) return res.status(400).json({ error: 'Invalid first payment date.' });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(classEndDate)) return res.status(400).json({ error: 'Invalid class end date.' });

  const total = planDef.totalCents;
  const down  = Math.round(Number(downCents));
  if (!Number.isFinite(down) || down < 20000) return res.status(400).json({ error: 'Minimum down payment is $200.' });
  if (down > total) return res.status(400).json({ error: 'Down payment cannot exceed total tuition.' });

  const remaining = total - down;
  const paidInFull = remaining === 0;

  // Build schedule first so we can fail fast if the cadence/start-date combo is invalid.
  let schedule = null;
  if (!paidInFull) {
    try {
      schedule = buildSchedule({ remainingCents: remaining, cadence, firstPaymentDate, classEndDate });
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }
  }

  const [first, ...rest] = String(name).trim().split(/\s+/);
  const family = rest.join(' ');

  try {
    // 1. Customer
    const customer = (await sq('/customers', 'POST', {
      given_name: first || name,
      family_name: family || undefined,
      email_address: email,
      phone_number: phone || undefined,
      note: cohortName ? `Cohort: ${cohortName}` : undefined,
    }, uid())).customer;

    // 2. Save card on file (so we can auto-bill installments later)
    let cardId = null;
    if (!paidInFull) {
      const card = (await sq('/cards', 'POST', {
        idempotency_key: uid(),
        source_id: sourceId,
        card: { customer_id: customer.id },
      })).card;
      cardId = card.id;
    }

    // 3. Charge the down payment.
    //    If we saved the card, charge against card_id (the saved card).
    //    If paid in full, charge against the original sourceId (no need to save).
    const payment = (await sq('/payments', 'POST', {
      idempotency_key: uid(),
      source_id: cardId || sourceId,
      amount_money: { amount: paidInFull ? total : down, currency: 'USD' },
      customer_id: customer.id,
      location_id: LOCATION_ID,
      autocomplete: true,
      note: `${planDef.name} — ${paidInFull ? 'Paid in full' : 'Down payment'}${cohortName ? ` (${cohortName})` : ''}`,
    })).payment;

    let invoice = null;
    if (!paidInFull) {
      // 4. Order for remaining balance
      const order = (await sq('/orders', 'POST', {
        idempotency_key: uid(),
        order: {
          location_id: LOCATION_ID,
          customer_id: customer.id,
          line_items: [{
            name: `${planDef.name} — Tuition (remaining balance)`,
            quantity: '1',
            base_price_money: { amount: remaining, currency: 'USD' },
            note: cohortName || undefined,
          }],
        },
      })).order;

      // 5. Invoice with auto-pay installments
      const draft = (await sq('/invoices', 'POST', {
        idempotency_key: uid(),
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

      // 6. Publish so Square starts auto-billing
      invoice = (await sq(`/invoices/${draft.id}/publish`, 'POST', {
        version: draft.version,
        idempotency_key: uid(),
      })).invoice;
    }

    return res.status(200).json({
      ok: true,
      paymentId: payment.id,
      receiptUrl: payment.receipt_url || null,
      customerId: customer.id,
      invoiceId: invoice?.id || null,
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
  } catch (err) {
    console.error('[enroll] Square error:', err.squareErrors || err);
    const msg = err?.squareErrors?.[0]?.detail || err.message || 'Payment failed.';
    return res.status(402).json({ error: msg });
  }
}
