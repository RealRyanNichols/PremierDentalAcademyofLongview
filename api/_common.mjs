// Shared helpers for PDA Vercel serverless functions (Kajabi migration).
// Zero-dependency: uses global fetch (Node 18+ on Vercel). Underscore-prefixed
// files are NOT routed by Vercel, so this is import-only.
//
// Secrets are read from process.env (set in Vercel):
//   SUPABASE_SERVICE_ROLE_KEY  — server-side DB writes (bypasses RLS)
//   RESEND_API_KEY, RESEND_FROM — transactional/marketing email
//   CRON_SECRET                 — shared secret Vercel Cron sends as Bearer
//   INTERNAL_SECRET             — optional: server-to-server automation trigger

export const SUPABASE_URL =
  process.env.SUPABASE_URL || 'https://lmbsuwslsycukynzpzik.supabase.co';

// Public publishable (anon) key — safe to ship; used only for auth token checks.
export const PUBLISHABLE_KEY =
  process.env.SUPABASE_ANON_KEY || 'sb_publishable_vzuQZbkmj-UsYZVs5Zqw9w_c8PiOfbh';

export const SITE_URL =
  process.env.SITE_URL || 'https://www.premierdentalacademyoflongview.com';

function serviceKey() {
  const k = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!k) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  return k;
}

// PostgREST call with the service-role key (bypasses RLS — server only).
export async function sb(path, { method = 'GET', body, prefer, query } = {}) {
  const key = serviceKey();
  const qs = query ? '?' + new URLSearchParams(query).toString() : '';
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}${qs}`, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      ...(prefer ? { Prefer: prefer } : {}),
    },
    body: body != null ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    const msg = (data && data.message) || `Supabase ${method} ${path} ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.detail = data;
    throw err;
  }
  return data;
}

// Verify the caller's Supabase access token and return the auth user (or null).
export async function authUser(token) {
  if (!token) return null;
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: PUBLISHABLE_KEY, Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// Bearer token out of an incoming request.
export function bearer(req) {
  const h = req.headers?.authorization || req.headers?.Authorization || '';
  const m = /^Bearer\s+(.+)$/i.exec(h);
  return m ? m[1].trim() : null;
}

// Require the caller be an admin (profiles.is_admin). Returns the user or null.
export async function requireAdmin(req) {
  const user = await authUser(bearer(req));
  if (!user?.id) return null;
  const rows = await sb('profiles', {
    query: { id: `eq.${user.id}`, select: 'id,is_admin' },
  });
  if (Array.isArray(rows) && rows[0]?.is_admin) return user;
  return null;
}

// Constant-time-ish secret compare for cron / internal endpoints.
export function checkSecret(req, envName = 'CRON_SECRET') {
  const expected = process.env[envName];
  if (!expected) return false;
  const provided =
    bearer(req) ||
    (req.query && (req.query.secret || req.query.key)) ||
    req.headers?.['x-cron-secret'] ||
    '';
  if (typeof provided !== 'string' || provided.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= provided.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

// Send one email through Resend. Returns { id } or throws.
export async function resendSend({ to, subject, html, headers = {}, from }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY is not set');
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: from || process.env.RESEND_FROM || 'Premier Dental Academy <hello@premierdentalacademyoflongview.com>',
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      headers,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data?.message || `Resend ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return data; // { id }
}

// One-click unsubscribe headers for a given subscriber token.
export function unsubHeaders(token) {
  if (!token) return {};
  const url = `${SITE_URL}/unsubscribe?token=${encodeURIComponent(token)}`;
  return {
    'List-Unsubscribe': `<${url}>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
  };
}

export function json(res, code, obj) {
  res.status(code).json(obj);
}
