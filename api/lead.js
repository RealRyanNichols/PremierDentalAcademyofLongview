// POST /api/lead — server-side lead capture. Called by assets/pda-lead.js for every lead
// form; the browser falls back to a direct Supabase insert if this endpoint is down.
//
// Guarantees (why this exists — "a lead must never silently vanish"):
//   1. Validates + caps every field; drops anything not a real leads column.
//   2. De-duplicates on utm.submission_id, so a retried submit can't create two leads.
//   3. Inserts into public.leads. The DB trigger (notify_new_lead → lead-notify edge
//      function) emails hello@ + the autoresponder exactly as it does today.
//   4. If the insert FAILS, emails the lead to hello@ directly (Resend, or the
//      lead-notify function) so Amanda still gets it within seconds. Only when both
//      the database and every email path fail does it answer 502 — and the browser then
//      shows the visitor an honest error with call/text/email links.
//   Configuration exception: a malformed/rejected privileged key returns an explicit
//   503 without sending a fallback email. The browser can try its direct anon insert.
//
// Secrets (Vercel env, all optional — each one adds a layer):
//   SUPABASE_SERVICE_ROLE_KEY  insert + duplicate check bypassing RLS. Absent → the
//                              insert uses the public anon key (public INSERT policy).
//   RESEND_API_KEY / RESEND_FROM  direct email fallback when the insert fails.
//   LEAD_NOTIFY_SECRET         alternative fallback: call the lead-notify edge function.
// Logs contain fixed failure codes/status only, never submitted fields/provider text.
import { sb, serviceKey, resendSend, json, SUPABASE_URL, PUBLISHABLE_KEY, SITE_URL } from './_common.mjs';

const ADMIN_EMAIL = 'hello@premierdentalacademyoflongview.com';
const LIMITS = { first_name: 120, last_name: 120, email: 200, phone: 40, interest_path: 200, message: 4000, source: 120, landing_page: 300,
  pipeline_stage: 40, status: 40, last_contact_at: 40, preferred_language: 20, pay_intent: 80, pay_when: 80, path_preference: 80, ready_timeline: 80 };
const UTM_MAX_JSON = 6000;
const RATE_PER_MIN = 30;

// Best-effort per-instance rate limit (serverless instances are short-lived; this only
// blunts a runaway script, it is not a security boundary).
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < 60_000);
  arr.push(now);
  hits.set(ip, arr);
  if (hits.size > 5000) hits.clear();
  return arr.length > RATE_PER_MIN;
}

const str = (v, max) => (v == null ? '' : String(v)).trim().slice(0, max);

export function cleanLead(input) {
  const src = (input && typeof input === 'object') ? input : {};
  const out = {};
  for (const [k, max] of Object.entries(LIMITS)) {
    const v = str(src[k], max);
    if (v) out[k] = v;
  }
  if (out.email) {
    out.email = out.email.toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(out.email)) delete out.email;
  }
  if (out.phone && out.phone.replace(/\D/g, '').length < 7) delete out.phone;
  let utm = src.utm;
  if (utm && typeof utm === 'string') { try { utm = JSON.parse(utm); } catch { utm = null; } }
  if (utm && typeof utm === 'object' && !Array.isArray(utm)) {
    const s = JSON.stringify(utm);
    out.utm = s.length > UTM_MAX_JSON ? { truncated: true, submission_id: utm.submission_id } : utm;
  }
  if (!out.source) out.source = 'website';
  return out;
}

async function alreadyStored(submissionId) {
  if (!submissionId || !process.env.SUPABASE_SERVICE_ROLE_KEY) return false;
  try {
    const rows = await sb('leads', { query: { select: 'id', 'utm->>submission_id': `eq.${submissionId}`, limit: '1' } });
    return Array.isArray(rows) && rows.length > 0;
  } catch (e) {
    if (e.code === 'SUPABASE_SERVICE_CONFIGURATION_ERROR') throw e;
    return false;
  }
}

async function insertLead(row) {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    await sb('leads', { method: 'POST', body: row, prefer: 'return=minimal' });
    return;
  }
  // No service key on this deployment: use the same public INSERT policy the browser uses.
  const r = await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
    method: 'POST',
    headers: { apikey: PUBLISHABLE_KEY, Authorization: `Bearer ${PUBLISHABLE_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify(row),
  });
  if (!r.ok) throw new Error(`leads insert ${r.status}: ${(await r.text().catch(() => '')).slice(0, 200)}`);
}

const esc = (x) => String(x ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function fallbackHtml(row, reason) {
  const name = esc(`${row.first_name || ''} ${row.last_name || ''}`.trim() || '(no name)');
  const u = row.utm || {};
  const camp = [u.utm_source, u.utm_medium, u.utm_campaign, u.utm_content].filter(Boolean).join(' / ');
  return `<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;color:#0f172a">
  <div style="background:#b45309;color:#fff;padding:18px 24px;border-radius:12px 12px 0 0">
    <h1 style="margin:0;font-size:18px">🦷 New lead — ${name}</h1>
    <p style="margin:4px 0 0;font-size:13px;opacity:.95">via ${esc(row.source)} · <strong>saved by email only</strong> — the database insert failed (${esc(reason)}). Please add this lead in /admin/leads.</p>
  </div>
  <div style="border:1px solid #e2e8f0;border-top:0;border-radius:0 0 12px 12px;padding:24px">
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <tr><td style="padding:6px 0;color:#64748b;width:120px">Phone</td><td style="padding:6px 0"><a href="tel:${esc(row.phone)}" style="color:#0d9488;font-weight:600">${esc(row.phone || '—')}</a></td></tr>
      <tr><td style="padding:6px 0;color:#64748b">Email</td><td style="padding:6px 0"><a href="mailto:${esc(row.email)}" style="color:#0d9488">${esc(row.email || '—')}</a></td></tr>
      <tr><td style="padding:6px 0;color:#64748b">Interest</td><td style="padding:6px 0">${esc(row.interest_path || '—')}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b">Campaign</td><td style="padding:6px 0">${esc(camp || '—')}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b">Landing page</td><td style="padding:6px 0">${esc(row.landing_page || '—')}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b;vertical-align:top">Details</td><td style="padding:6px 0;color:#334155;white-space:pre-wrap">${esc(row.message || '—')}</td></tr>
    </table>
    <div style="margin-top:20px;text-align:center">
      <a href="tel:${esc(row.phone)}" style="display:inline-block;background:#f59e0b;color:#fff;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:10px;margin:0 4px">📞 Call now</a>
      <a href="${SITE_URL}/admin/leads" style="display:inline-block;background:#0f172a;color:#fff;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:10px;margin:0 4px">Open admin</a>
    </div>
  </div>
</div>`;
}

async function emailFallback(row, reason) {
  const subject = `New lead (saved by email only): ${`${row.first_name || ''} ${row.last_name || ''}`.trim() || 'no name'} (${row.source || 'website'})`;
  if (process.env.RESEND_API_KEY) {
    await resendSend({ to: ADMIN_EMAIL, subject, html: fallbackHtml(row, reason) });
    return 'email';
  }
  if (process.env.LEAD_NOTIFY_SECRET) {
    const r = await fetch(`${SUPABASE_URL}/functions/v1/lead-notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-lead-secret': process.env.LEAD_NOTIFY_SECRET },
      body: JSON.stringify({ record: { ...row, created_at: new Date().toISOString(), message: `[NOT SAVED TO DATABASE — ${reason}] ${row.message || ''}`.slice(0, 4000) } }),
    });
    if (!r.ok) throw new Error(`lead-notify ${r.status}`);
    return 'email';
  }
  throw new Error('no email fallback configured (RESEND_API_KEY or LEAD_NOTIFY_SECRET)');
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'method_not_allowed' });

  const ip = String(req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  if (rateLimited(ip)) return json(res, 429, { ok: false, error: 'rate_limited', message: 'Too many submissions. Please call or text (903) 913-6444.' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = null; } }
  if (!body || typeof body !== 'object') return json(res, 400, { ok: false, error: 'bad_json' });

  // Honeypot: bots fill hidden fields. Pretend success, store nothing.
  if (str(body.honeypot ?? body.company, 200)) return json(res, 200, { ok: true, via: 'honeypot' });

  const lead = cleanLead(body.lead && typeof body.lead === 'object' ? body.lead : body);
  if (!lead.email && !lead.phone) return json(res, 400, { ok: false, error: 'contact_required', message: 'Please include an email address or phone number.' });

  const submissionId = str(body.submission_id || lead.utm?.submission_id, 80) || null;
  lead.utm = { ...(lead.utm || {}), ...(submissionId ? { submission_id: submissionId } : {}), received_at: new Date().toISOString(), ua: str(req.headers['user-agent'], 160) || undefined };
  try {
    // A nonempty placeholder must not silently turn every lead into email-only
    // success. An absent key deliberately retains the existing public insert path.
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) serviceKey();
    if (submissionId && await alreadyStored(submissionId)) return json(res, 200, { ok: true, via: 'duplicate', persisted: true, delivery: 'database' });
    await insertLead(lead);
    return json(res, 200, { ok: true, via: 'db', persisted: true, delivery: 'database' });
  } catch (e) {
    if (e.code === 'SUPABASE_SERVICE_CONFIGURATION_ERROR') {
      return json(res, 503, { ok: false, error: 'service_configuration_error', persisted: false, message: 'The server could not save your info. Please try again or call or text (903) 913-6444.' });
    }
    const status = Number.isInteger(e?.status) ? e.status : null;
    const reason = status ? `database_write_failed (${status})` : 'database_write_failed';
    console.error('[api/lead] insert failed', { code: 'database_write_failed', status });
    try {
      const via = await emailFallback(lead, reason);
      return json(res, 200, { ok: true, via, persisted: false, delivery: 'email' });
    } catch (e2) {
      console.error('[api/lead] email fallback failed', { code: 'email_fallback_failed', status: Number.isInteger(e2?.status) ? e2.status : null });
      return json(res, 502, { ok: false, error: 'store_failed', message: 'We could not save your info right now. Please call or text (903) 913-6444.' });
    }
  }
}
