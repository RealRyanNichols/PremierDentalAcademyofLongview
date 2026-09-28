// POST /api/buy-exam-pro — Exam Pro checkout for a signed-in student (guests use
// /api/buy-product with product_key 'exam_pro'). Runs in pda-api on the droplet.
//
// Droplet port of the Supabase function buy-exam-pro v5 (Sep 28, 2026). Same safety rules:
//  (1) The caller must be signed in; Pro is granted to that exact login, never a client id.
//  (2) Already Pro / enrolled / admin, or a completed Exam Pro purchase exists -> no charge.
//  (3) A pending purchase row is written BEFORE the charge. A retry after a lost response
//      finds it and reconciles instead of charging again. The Square idempotency key
//      (login id + card nonce) is built exactly like v5's, so re-submits dedupe at Square.
//  (4) Once charged, never an error: a failed unlock returns ok:true with a warning, and an
//      urgent admin task makes "Amanda has been notified" true.
// Change from v5: the price is read from public.products ('exam_pro'), the same row the guest
// checkout charges, instead of a second hard-coded $29.
import { sb, authUser, bearer } from './_common.mjs';
import { sq, squareToken, idemKey, LOCATION_ID } from './_square.mjs';

const first = (rows) => (Array.isArray(rows) && rows.length ? rows[0] : null);

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

  const user = await authUser(bearer(req));
  if (!user || !user.id) { res.status(401).json({ error: 'Please sign in before purchasing.' }); return; }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  body = body && typeof body === 'object' ? body : {};

  let product, prof, completed, pending;
  try {
    product = first(await sb('products', { query: { key: 'eq.exam_pro', active: 'eq.true', select: 'name,price_cents', limit: '1' } }));
    prof = first(await sb('profiles', { query: { id: 'eq.' + user.id, select: 'exam_pro,program,is_admin', limit: '1' } }));
    completed = first(await sb('purchases', { query: { student_id: 'eq.' + user.id, product_key: 'eq.exam_pro', status: 'eq.completed', select: 'id', limit: '1' } }));
    pending = first(await sb('purchases', { query: { student_id: 'eq.' + user.id, product_key: 'eq.exam_pro', status: 'eq.pending', select: 'id', limit: '1' } }));
  } catch {
    res.status(503).json({ error: 'Checkout is having trouble right now. No charge was made — please try again in a minute.' });
    return;
  }
  if (!product || !(product.price_cents > 0)) { res.status(404).json({ error: "Exam Pro isn't available right now. No charge was made." }); return; }

  // (2) Already entitled? Don't charge.
  if (prof && (prof.exam_pro === true || prof.is_admin === true || (prof.program && prof.program !== 'preview'))) {
    res.status(200).json({ ok: true, alreadyPro: true, message: 'You already have Exam Pro — no charge made.' });
    return;
  }
  // (2b) Paid before but the unlock failed: the purchase row is the receipt.
  if (completed) {
    res.status(200).json({ ok: true, alreadyPro: true, message: "You already paid for Exam Pro — no new charge was made. If it isn't unlocked yet, text Amanda at (903) 913-6444." });
    return;
  }
  // (2c) A prior attempt left a pending marker: reconcile, never charge again.
  if (pending) {
    let g = false;
    try { const u2 = await sb('profiles', { method: 'PATCH', query: { id: 'eq.' + user.id, select: 'id' }, prefer: 'return=representation', body: { exam_pro: true } }); g = Array.isArray(u2) && u2.length > 0; } catch { /* best effort */ }
    try {
      await sb('admin_tasks', { method: 'POST', prefer: 'return=minimal', body: { title: `Reconcile Exam Pro: ${user.email || user.id} has a pending purchase (payment response was lost). Verify exactly one Square charge; refund any duplicate.`, priority: 2, status: 'open', notes: 'A pre-charge marker exists with no completed record. The student was granted access to avoid blocking them — confirm one Square charge landed.' } });
    } catch { /* best effort */ }
    res.status(200).json({ ok: true, alreadyPro: true, granted: g, message: "Your payment is already being processed — no new charge was made. If Exam Pro isn't unlocked, text Amanda at (903) 913-6444." });
    return;
  }

  const sourceId = String(body.sourceId || '').trim().slice(0, 512);
  if (!sourceId) { res.status(400).json({ error: 'Missing card details.' }); return; }
  if (!squareToken()) { res.status(503).json({ error: 'Payments are not configured yet. No charge was made.' }); return; }

  // Pre-charge marker. If we can't write it, fail closed: never touch the card without a record.
  let pendingId = null;
  try {
    const rows = await sb('purchases', {
      method: 'POST', prefer: 'return=representation', query: { select: 'id' },
      body: { student_id: user.id, product_key: 'exam_pro', product_label: 'Exam Pro', amount_cents: product.price_cents, payment_type: 'one_time', status: 'pending', contact_email: user.email, source: 'site', metadata: { stage: 'pre_charge', via: 'droplet' } },
    });
    pendingId = first(rows) && first(rows).id;
  } catch { pendingId = null; }
  if (!pendingId) { res.status(500).json({ error: "We couldn't start checkout. No charge was made — please try again." }); return; }

  let payment;
  try {
    payment = (await sq('/payments', {
      method: 'POST',
      timeoutMs: 60_000,
      body: {
        idempotency_key: idemKey('exam-pro', user.id, sourceId),
        source_id: sourceId,
        amount_money: { amount: product.price_cents, currency: 'USD' },
        location_id: LOCATION_ID,
        autocomplete: true,
        buyer_email_address: user.email || undefined,
        note: `Exam Pro (one-time $${(product.price_cents / 100).toFixed(0)}) — ${user.email || user.id}`,
      },
    })).payment;
  } catch (err) {
    if (err.uncertain) {
      // Keep the pending marker: a retry reconciles through (2c) instead of charging again.
      res.status(502).json({ error: "We couldn't confirm your payment. Please don't pay again — text Amanda at (903) 913-6444 and she'll check it in Square.", uncertain: true });
      return;
    }
    // No charge landed: clear the marker so another card can be tried.
    try { await sb('purchases', { method: 'DELETE', query: { id: 'eq.' + pendingId }, prefer: 'return=minimal' }); } catch { /* best effort */ }
    res.status(402).json({ error: err.message || 'Your card was declined. No charge was made.' });
    return;
  }

  // CHARGED. Never return an error past this point.
  let granted = false;
  try {
    const upd = await sb('profiles', { method: 'PATCH', query: { id: 'eq.' + user.id, select: 'id' }, prefer: 'return=representation', body: { exam_pro: true } });
    granted = Array.isArray(upd) && upd.length > 0;
    if (!granted) {
      await sb('profiles', { method: 'POST', prefer: 'return=minimal', body: { id: user.id, email: user.email, exam_pro: true } });
      granted = true;
    }
  } catch { /* reported below */ }
  const warning = granted ? null : "Your payment went through, but we couldn't unlock Pro automatically. Amanda has been notified and will enable it within 1 business day.";

  try {
    await sb('purchases', { method: 'PATCH', query: { id: 'eq.' + pendingId }, prefer: 'return=minimal', body: { status: 'completed', external_payment_id: payment.id, metadata: { receipt_url: payment.receipt_url || null, granted, via: 'droplet' } } });
  } catch { /* the pending row still blocks a second charge */ }

  if (!granted) {
    try {
      await sb('admin_tasks', { method: 'POST', prefer: 'return=minimal', body: { title: `Grant Exam Pro: ${user.email || user.id} paid but auto-grant failed (payment ${payment.id})`, priority: 1, status: 'open', notes: 'Set profiles.exam_pro = true for this student, then close this task.' } });
    } catch { /* best effort */ }
  }

  try {
    await sb('communications', { method: 'POST', prefer: 'return=minimal', body: { contact_email: user.email, contact_name: user.email, channel: 'system', direction: 'inbound', body: `[AUTO] Exam Pro purchased ($${(product.price_cents / 100).toFixed(2)}). Payment ${payment.id}. Granted: ${granted}${warning ? ' — ' + warning : ''}`, source: 'square', metadata: { payment_id: payment.id, receipt_url: payment.receipt_url || null, user_id: user.id, via: 'droplet' } } });
  } catch { /* best effort */ }

  res.status(200).json({ ok: true, granted, paymentId: payment.id, receiptUrl: payment.receipt_url || null, warning });
}
