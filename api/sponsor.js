// Sponsor-a-Student online payment endpoint (/sponsor-a-student → Square).
// A business (or individual) sponsors part or all of a student's tuition with
// a card, right on the page — no waiting for an invoice. Any amount from $25
// up to a full $3,000 seat, optionally directed at one student on the board.
//
// SAFETY RULES (same as api/enroll.js):
//  (1) Once the card has been charged, we NEVER return an error response.
//      If recording/notification fails after the charge succeeds, we return
//      ok=true with a `warning` field so the sponsor never sees "failed" and
//      pays twice.
//  (2) All Square calls use deterministic idempotency keys derived from the
//      card source nonce (sourceId), so a re-submit can't double-charge, and
//      sponsorships.square_payment_id is UNIQUE so a re-record is a no-op.
//
// After a successful charge this endpoint:
//   - inserts a `paid` row into public.sponsorships (service role). The DB
//     trigger rolls the amount into sponsor_profiles.raised_cents and flips
//     the student to "sponsored" automatically when her goal is met.
//   - emails Amanda an alert + the sponsor a thank-you/receipt via Resend.
//     The key comes from Vercel env RESEND_API_KEY, falling back to the
//     public.app_secrets key the lead-notify function already uses.
//
// Required env vars (set in Vercel):
//   SQUARE_ACCESS_TOKEN        — production access token (secret)
//   SUPABASE_SERVICE_ROLE_KEY  — records the sponsorship row
//   RESEND_API_KEY             — optional (falls back to app_secrets)

import { sb, SITE_URL } from './_common.mjs';

const LOCATION_ID = '2P2ZE3FJNEYTV';
const SQUARE_BASE = 'https://connect.squareup.com/v2';
const MIN_CENTS = 2500;      // $25 — keeps card fees sensible
const MAX_CENTS = 1000000;   // $10,000 per transaction; bigger = call Amanda
const ADMIN_EMAIL = 'hello@premierdentalacademyoflongview.com';
const FROM = process.env.RESEND_FROM || 'Amanda at Premier Dental Academy <hello@premierdentalacademyoflongview.com>';

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
    const err = new Error(data?.errors?.[0]?.detail || data?.errors?.[0]?.code || `Square ${path} ${res.status}`);
    err.squareErrors = data?.errors;
    throw err;
  }
  return data;
}

async function idemKey(step, sourceId) {
  const seed = `sponsor::${step}::${sourceId}`;
  if (globalThis.crypto?.subtle) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(seed));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 45);
  }
  return seed.replace(/[^a-zA-Z0-9]/g, '').slice(0, 45);
}

const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const money = c => '$' + (c / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

// Resend key: Vercel env first, else the key lead-notify already keeps in
// public.app_secrets (service-role read — never leaves the server).
async function resendKey() {
  if (process.env.RESEND_API_KEY) return process.env.RESEND_API_KEY;
  try {
    const rows = await sb('app_secrets', { query: { key: 'eq.RESEND_API_KEY', select: 'value' } });
    return rows?.[0]?.value || null;
  } catch { return null; }
}

async function sendEmail(key, to, subject, html) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to: [to], subject, html }),
  });
  if (!res.ok) console.error('[sponsor] Resend error', res.status, await res.text().catch(() => ''));
  return res.ok;
}

function adminAlertHtml(s, studentLabel) {
  return `<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;color:#0f172a">
  <div style="background:#0d9488;color:#fff;padding:18px 24px;border-radius:12px 12px 0 0">
    <h1 style="margin:0;font-size:18px">🤝 Sponsorship PAID — ${esc(money(s.amount_cents))}</h1>
    <p style="margin:4px 0 0;font-size:13px;opacity:.9">${esc(s.business_name || s.contact_name)} · online card payment</p>
  </div>
  <div style="border:1px solid #e2e8f0;border-top:0;border-radius:0 0 12px 12px;padding:24px">
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <tr><td style="padding:6px 0;color:#64748b;width:130px">Sponsor</td><td style="padding:6px 0">${esc(s.business_name || '')} — ${esc(s.contact_name || '')}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b">Contact</td><td style="padding:6px 0"><a href="mailto:${esc(s.email)}" style="color:#0d9488">${esc(s.email)}</a>${s.phone ? ' · ' + esc(s.phone) : ''}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b">For student</td><td style="padding:6px 0">${esc(studentLabel)}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b">Amount</td><td style="padding:6px 0;font-weight:700">${esc(money(s.amount_cents))}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b">Public thanks</td><td style="padding:6px 0">${s.public_thanks ? 'YES — credit as "' + esc(s.recognition_name) + '"' : 'no'}</td></tr>
      ${s.notes ? `<tr><td style="padding:6px 0;color:#64748b;vertical-align:top">Notes</td><td style="padding:6px 0;white-space:pre-wrap">${esc(s.notes)}</td></tr>` : ''}
    </table>
    <div style="margin-top:20px;text-align:center">
      <a href="${SITE_URL}/admin/sponsors" style="display:inline-block;background:#0f172a;color:#fff;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:10px">Open sponsor console</a>
    </div>
  </div>
</div>`;
}

function sponsorThanksHtml(s, studentLabel, receiptUrl) {
  const first = String(s.contact_name || '').trim().split(/\s+/)[0] || 'there';
  return `<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;color:#0f172a">
  <div style="text-align:center;padding:24px 24px 8px">
    <img src="${SITE_URL}/assets/logo-mark.png" alt="Premier Dental Academy of Longview" width="48" height="48" style="border-radius:10px" />
  </div>
  <div style="border:1px solid #e2e8f0;border-radius:14px;padding:28px 26px;margin:8px">
    <h1 style="font-family:Georgia,serif;font-size:22px;margin:0 0 12px">Thank you, ${esc(first)}. This one matters. 🤝</h1>
    <p style="font-size:15px;line-height:1.6;color:#334155;margin:0 0 14px">
      Your <strong>${esc(money(s.amount_cents))}</strong> sponsorship${studentLabel ? ' for <strong>' + esc(studentLabel) + '</strong>' : ''} went through,
      and every dollar of it is applied to student tuition at Premier Dental Academy of Longview.
      This email is your record of the payment${receiptUrl ? ' — your Square receipt is <a href="' + esc(receiptUrl) + '" style="color:#0d9488">here</a>' : ''}.
    </p>
    <p style="font-size:15px;line-height:1.6;color:#334155;margin:0 0 14px">
      I'll follow up personally with your student's progress — you'll know how this story ends.
      If you need an invoice or any paperwork for your books, just reply to this email.
    </p>
    <p style="font-size:14px;line-height:1.6;color:#475569;margin:0">— Amanda · Premier Dental Academy of Longview · <a href="tel:+19039136444" style="color:#0d9488;font-weight:700">(903) 913-6444</a></p>
    <p style="font-size:13px;color:#94a3b8;margin:18px 0 0">2800 Gilmer Rd, Suite 106, Longview, TX 75604 · TWC Career School License #S5316</p>
  </div>
</div>`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.SQUARE_ACCESS_TOKEN) return res.status(500).json({ error: 'Server is missing SQUARE_ACCESS_TOKEN.' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  body ||= {};

  const { sourceId, business, contact, email, phone, profileId, publicThanks, recognitionName, notes } = body;
  const amount = Math.round(Number(body.amountCents));

  if (!sourceId) return res.status(400).json({ error: 'Missing card details.' });
  if (!contact || !email) return res.status(400).json({ error: 'Name and email are required.' });
  if (!Number.isFinite(amount) || amount < MIN_CENTS) return res.status(400).json({ error: 'Minimum online sponsorship is $25. Any amount helps — thank you!' });
  if (amount > MAX_CENTS) return res.status(400).json({ error: 'For sponsorships over $10,000, call Amanda at (903) 913-6444 and she\'ll set it up directly.' });
  if (profileId && !/^[0-9a-f-]{36}$/i.test(String(profileId))) return res.status(400).json({ error: 'Invalid student selection. Refresh the page and try again.' });

  // Resolve the chosen student BEFORE charging so a stale/bad pick fails safe.
  // A server-side lookup ERROR (e.g. missing service key) is not the sponsor's
  // fault — keep the chosen profile_id and generic label rather than blocking.
  let profile = null;
  let lookupOk = false;
  if (profileId) {
    try {
      const rows = await sb('sponsor_profiles', {
        query: { id: `eq.${profileId}`, select: 'id,display_name,status', limit: '1' },
      });
      lookupOk = true;
      profile = rows?.[0] || null;
    } catch (e) {
      console.error('[sponsor] profile lookup failed:', e.message);
    }
    if (lookupOk && !profile) return res.status(400).json({ error: 'That student is no longer on the board. Refresh the page and pick again, or sponsor the general fund.' });
  }
  const studentLabel = profile ? profile.display_name
    : profileId ? 'Selected student (see admin console)'
    : 'Next student in line (Amanda matches)';

  const [first, ...rest] = String(contact).trim().split(/\s+/);
  const ikCust = await idemKey('customer', sourceId);
  const ikPay = await idemKey('payment', sourceId);

  // ── STEP 1: Square customer (pre-charge — safe to error) ──
  let customer;
  try {
    customer = (await sq('/customers', 'POST', {
      given_name: first || contact,
      family_name: rest.join(' ') || undefined,
      company_name: business || undefined,
      email_address: email,
      phone_number: phone || undefined,
      note: 'Sponsor-a-Student',
    }, ikCust)).customer;
  } catch (err) {
    console.error('[sponsor] pre-charge failure:', err.squareErrors || err);
    return res.status(402).json({ error: err.message || 'Could not start the payment. Your card has NOT been charged — try again or call (903) 913-6444.' });
  }

  // ── STEP 2: charge the card ──
  let payment;
  try {
    payment = (await sq('/payments', 'POST', {
      idempotency_key: ikPay,
      source_id: sourceId,
      amount_money: { amount, currency: 'USD' },
      customer_id: customer.id,
      location_id: LOCATION_ID,
      autocomplete: true,
      buyer_email_address: email,
      note: `Sponsor-a-Student — ${studentLabel}${business ? ` (${business})` : ''}`.slice(0, 500),
    })).payment;
  } catch (err) {
    console.error('[sponsor] charge failure:', err.squareErrors || err);
    return res.status(402).json({ error: err.message || 'Your card was declined. No charge was made. Try a different card or call (903) 913-6444.' });
  }

  // ── STEP 3: record + notify. Card is charged — NEVER error from here. ──
  let warning = null;
  const row = {
    profile_id: profile?.id || profileId || null,
    business_name: business || null,
    contact_name: contact,
    email,
    phone: phone || null,
    amount_cents: amount,
    status: 'paid',
    method: 'square-online',
    square_payment_id: payment.id,
    square_receipt_url: payment.receipt_url || null,
    public_thanks: publicThanks === true,
    recognition_name: (publicThanks === true ? (recognitionName || business || contact) : null),
    notes: notes ? String(notes).slice(0, 1000) : null,
    paid_at: new Date().toISOString(),
  };
  try {
    await sb('sponsorships', {
      method: 'POST',
      body: row,
      prefer: 'resolution=ignore-duplicates',
      query: { on_conflict: 'square_payment_id' },
    });
  } catch (err) {
    console.error('[sponsor] POST-charge record failure (card already charged):', err.message);
    warning = 'Your payment went through, but our tracker hiccuped recording it. Amanda has the Square receipt and will apply it to your student within 1 business day — no action needed.';
  }

  try {
    const key = await resendKey();
    if (key) {
      await sendEmail(key, ADMIN_EMAIL, `Sponsorship PAID: ${money(amount)} — ${business || contact} → ${studentLabel}`, adminAlertHtml(row, studentLabel));
      await sendEmail(key, email, 'Thank you — your sponsorship went through 🤝', sponsorThanksHtml(row, profile ? profile.display_name : '', payment.receipt_url));
    }
  } catch (err) {
    console.error('[sponsor] POST-charge email failure:', err.message);
  }

  return res.status(200).json({
    ok: true,
    paymentId: payment.id,
    receiptUrl: payment.receipt_url || null,
    amountCents: amount,
    student: studentLabel,
    warning,
  });
}
