// POST /api/buy-product — the one checkout for every item in public.products (Study Pack,
// Exam Pro for guests, Career Vault, the exam-prep course, and the $997 online program).
// Runs in pda-api on the DigitalOcean droplet.
//
// Droplet port of the Supabase function buy-product v6 (Sep 28, 2026). Same flow: charge the
// card with Square -> find or create the buyer's login -> unlock the product (the online
// program also unlocks Exam Pro, the Study Pack and the exam-prep course) -> record the
// purchase -> email the access link.
//
// Guarantees:
//  - The Square idempotency key is built exactly like v6's (product + email + card nonce), so
//    a re-submit, even one that lands on the old endpoint, can never charge twice.
//  - Once the card is charged this NEVER answers with an error: problems after the charge come
//    back as ok:true with a `warning`, and the purchase is still recorded.
// Changes from v6:
//  - Kajabi grants are gone (retired Aug 16, 2026).
//  - The one-tap sign-in link is only returned to the browser when this purchase created the
//    login. v6 returned it for ANY email, so paying for a $19 item with someone else's email
//    handed over a sign-in link to their existing account. Existing buyers get it by email.
//  - A dropped connection to Square is reported as "couldn't confirm" instead of "no charge".
import { sb, SITE_URL, SUPABASE_URL, serviceKey, resendSend } from './_common.mjs';
import { sq, squareToken, idemKey, LOCATION_ID } from './_square.mjs';
import { findOrCreateUser, signInLink } from './_accounts.mjs';

const FROM = 'Amanda at Premier Dental Academy <hello@premierdentalacademyoflongview.com>';
const BUNDLE_FLAGS = { online_program: ['exam_pro', 'study_pack', 'exam_prep'] };
const COLUMN = /^[a-z][a-z0-9_]{0,62}$/;
const esc = (x) => String(x ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clip = (v, max) => String(v == null ? '' : v).trim().slice(0, max);

async function signedDownload(storagePath) {
  const sp = String(storagePath || '');
  const slash = sp.indexOf('/');
  if (slash < 1) return null;
  try {
    const key = serviceKey();
    const r = await fetch(`${SUPABASE_URL}/storage/v1/object/sign/${sp.slice(0, slash)}/${sp.slice(slash + 1).split('/').map(encodeURIComponent).join('/')}`, {
      method: 'POST',
      headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ expiresIn: 60 * 60 * 24 * 7 }),
      signal: AbortSignal.timeout(15_000),
    });
    const d = await r.json().catch(() => ({}));
    const rel = d.signedURL || d.signedUrl;
    return r.ok && rel ? `${SUPABASE_URL}/storage/v1${rel.startsWith('/') ? '' : '/'}${rel}` : null;
  } catch { return null; }
}

export function accessEmailHtml({ productName, downloadUrl, link, bundle }) {
  const bundleLine = bundle
    ? '<p style="font-size:13px;color:#0f766e;margin:10px 0 0;"><strong>Also unlocked with your enrollment:</strong> RDA Exam Pro, the Study Pack, and the Exam-Prep Mini-Course — find them in your member area.</p>'
    : '';
  const accessLine = downloadUrl
    ? '<a href="' + esc(downloadUrl) + '" style="display:inline-block;background:#0d9488;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600;font-size:14px;">Download now →</a><p style="font-size:12px;color:#64748b;margin:8px 0 0;">It’s also saved in your member area.</p>'
    : '<a href="' + esc(link) + '" style="display:inline-block;background:#16294a;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600;font-size:14px;">Open my member area →</a>';
  return '<!doctype html><html><body style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;background:#f4f7fb;margin:0;padding:0;color:#16294a;"><div style="max-width:560px;margin:0 auto;padding:32px 24px;"><div style="text-align:center;padding:18px;background:#16294a;border-radius:14px 14px 0 0;"><h1 style="color:#fff;font-family:Georgia,serif;font-size:22px;margin:0;">Premier Dental Academy of Longview</h1></div><div style="background:#fff;padding:32px 28px;border-radius:0 0 14px 14px;border:1px solid #e6edf6;border-top:0;"><h2 style="font-family:Georgia,serif;color:#16294a;font-size:26px;margin:0 0 12px;">You’re in! 🎉</h2><p style="font-size:16px;line-height:1.6;margin:0 0 16px;">Thank you for your purchase of <strong>' + esc(productName) + '</strong>.</p><div style="background:#f4f7fb;border-radius:10px;padding:18px;margin-bottom:14px;border-left:4px solid #c9a961;">' + accessLine + bundleLine + '</div><p style="font-size:14px;line-height:1.6;margin:18px 0 0;color:#475569;">Questions? Text Amanda at <strong>(903) 913-6444</strong>.</p></div></div></body></html>';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  body = body && typeof body === 'object' ? body : {};
  const productKey = clip(body.product_key, 64);
  const sourceId = clip(body.sourceId, 512);
  const email = clip(body.email, 200).toLowerCase();
  const name = clip(body.name, 120);
  const phone = clip(body.phone, 40);
  if (!productKey || !COLUMN.test(productKey)) { res.status(400).json({ error: 'Missing product.' }); return; }
  if (!email || !name) { res.status(400).json({ error: 'Name and email are required.' }); return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { res.status(400).json({ error: 'Please check your email address. No charge was made.' }); return; }
  if (!sourceId) { res.status(400).json({ error: 'Missing card details.' }); return; }

  let product;
  try {
    const rows = await sb('products', { query: { key: 'eq.' + productKey, active: 'eq.true', select: '*', limit: '1' } });
    product = Array.isArray(rows) ? rows[0] : null;
  } catch {
    res.status(503).json({ error: 'Checkout is having trouble right now. No charge was made — please try again in a minute.' });
    return;
  }
  if (!product) { res.status(404).json({ error: "That product isn't available." }); return; }
  if (!squareToken()) { res.status(503).json({ error: 'Payments are not configured yet. No charge was made.' }); return; }

  const [firstName, ...rest] = name.split(/\s+/);
  const lastName = rest.join(' ');
  const flag = product.entitlement_flag && COLUMN.test(product.entitlement_flag) ? product.entitlement_flag : null;
  const grantFlags = flag ? [flag, ...(BUNDLE_FLAGS[productKey] || [])] : [];

  // Find or create the buyer's login so the purchase lands in their member area. Without a
  // login the product can't be delivered, so fail closed BEFORE touching the card (v6 charged
  // anyway and left the buyer with nothing to open).
  let user = { id: null, created: false };
  try {
    user = await findOrCreateUser(email, { first_name: firstName, last_name: lastName, phone, source: 'buy-product' });
  } catch { user = { id: null, created: false }; }
  if (!user.id) {
    res.status(503).json({ error: "We couldn't set up your account just now. No charge was made — please try again in a minute or text (903) 913-6444." });
    return;
  }

  // Already owns it? Don't charge again.
  if (user.id && flag) {
    try {
      const rows = await sb('profiles', { query: { id: 'eq.' + user.id, select: `${flag},is_admin`, limit: '1' } });
      const prof = Array.isArray(rows) ? rows[0] : null;
      if (prof && (prof[flag] === true || prof.is_admin === true)) {
        res.status(200).json({ ok: true, alreadyOwned: true, product: product.name, message: 'You already own this — no charge made.' });
        return;
      }
    } catch { /* unknown ownership: fall through and let Square's idempotency protect */ }
  }

  let payment;
  try {
    payment = (await sq('/payments', {
      method: 'POST',
      timeoutMs: 60_000,
      body: {
        idempotency_key: idemKey('buy', productKey, email, sourceId),
        source_id: sourceId,
        amount_money: { amount: product.price_cents, currency: 'USD' },
        location_id: LOCATION_ID,
        autocomplete: true,
        buyer_email_address: email,
        note: `${product.name} — website`,
      },
    })).payment;
  } catch (err) {
    if (err.uncertain) {
      res.status(502).json({ error: "We couldn't confirm your payment. Please don't pay again — text Amanda at (903) 913-6444 and she'll check it in Square.", uncertain: true });
      return;
    }
    res.status(402).json({ error: err.message || 'Your card was declined. No charge was made.' });
    return;
  }

  // CHARGED. Never return an error past this point.
  let warning = null;
  let granted = false;
  const bundleGranted = [];
  if (user.id && grantFlags.length) {
    try {
      await sb('profiles', { method: 'POST', query: { on_conflict: 'id' }, prefer: 'resolution=ignore-duplicates,return=minimal', body: { id: user.id, email } });
    } catch { /* best effort */ }
    for (const f of grantFlags) {
      try {
        const upd = await sb('profiles', { method: 'PATCH', query: { id: 'eq.' + user.id, select: 'id' }, prefer: 'return=representation', body: { [f]: true } });
        const ok = Array.isArray(upd) && upd.length > 0;
        if (f === flag) granted = ok; else if (ok) bundleGranted.push(f);
      } catch { /* one failed flag never sinks the others */ }
    }
  }
  if (grantFlags.length && !granted) {
    warning = "Your payment went through, but we couldn't auto-unlock it. Amanda has been notified and will enable it within 1 business day.";
    try {
      await sb('admin_tasks', { method: 'POST', prefer: 'return=minimal', body: { title: `Grant ${product.name}: paid but auto-unlock failed (payment ${payment.id})`, priority: 1, status: 'open', notes: `Buyer: ${email}\nTurn on profiles.${flag} for this buyer, then close this task.` } });
    } catch { /* best effort */ }
  }

  const downloadUrl = product.storage_path ? await signedDownload(product.storage_path) : null;

  try {
    await sb('purchases', {
      method: 'POST',
      prefer: 'return=minimal',
      body: {
        student_id: user.id || null, product_key: productKey, product_label: product.name, amount_cents: product.price_cents,
        payment_type: 'one_time', square_payment_id: payment.id, external_payment_id: payment.id, contact_email: email,
        source: 'website', status: 'completed',
        metadata: { receipt_url: payment.receipt_url || null, granted, bundle: bundleGranted, delivery: product.delivery, via: 'droplet' },
      },
    });
  } catch { /* the ledger is best effort; the Square webhook can still see the payment */ }

  const link = user.id ? await signInLink(email, '/dashboard') : SITE_URL + '/login';
  let emailed = false;
  try {
    await resendSend({ from: FROM, to: email, subject: 'Your ' + product.name + ' is ready 🎉', html: accessEmailHtml({ productName: product.name, downloadUrl, link, bundle: bundleGranted.length > 0 }) });
    emailed = true;
  } catch { /* reported below */ }

  try {
    await sb('communications', {
      method: 'POST', prefer: 'return=minimal',
      body: { contact_email: email, contact_name: name, channel: 'email', direction: 'outbound', body: '[AUTO] Purchased ' + product.name + ' ($' + (product.price_cents / 100).toFixed(2) + '). Granted: ' + granted + (bundleGranted.length ? ' + bundle: ' + bundleGranted.join('/') : '') + '. Email ' + (emailed ? 'sent' : 'not sent') + '.', source: 'buy-product', metadata: { payment_id: payment.id, product: productKey, via: 'droplet' } },
    });
  } catch { /* best effort */ }

  res.status(200).json({
    ok: true,
    product: product.name,
    granted,
    bundle: bundleGranted,
    downloadUrl,
    receiptUrl: payment.receipt_url || null,
    // Only a login this purchase just created; never a link into an existing account.
    magicLink: user.created && link.includes('/auth/v1/') ? link : null,
    emailed,
    warning,
  });
}
