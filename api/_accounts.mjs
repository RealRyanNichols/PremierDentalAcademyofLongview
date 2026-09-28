// Student login accounts for the droplet API: find or create a login and make a one-tap
// sign-in link. Import-only.
//
// Logins still live in Supabase Auth until Amanda and Ryan decide where they move (see
// CLAUDE.md, PLATFORM SWITCHOVER). Everything that touches the login system is in this one
// file, so that move changes this file and nothing else.
import { SUPABASE_URL, SITE_URL, serviceKey } from './_common.mjs';

async function authAdmin(path, { method = 'GET', body, timeoutMs = 15_000 } = {}) {
  const key = serviceKey();
  const res = await fetch(`${SUPABASE_URL}/auth/v1${path}`, {
    method,
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: body != null ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(timeoutMs),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

// Login id for an email, or null. Pages through the admin user list (83 logins in Sept 2026).
export async function findUserIdByEmail(email) {
  const want = String(email || '').toLowerCase().trim();
  if (!want) return null;
  for (let page = 1; page <= 20; page++) {
    const r = await authAdmin(`/admin/users?page=${page}&per_page=1000`);
    if (!r.ok) return null;
    const users = (r.data && r.data.users) || [];
    const hit = users.find((u) => String(u.email || '').toLowerCase() === want);
    if (hit) return hit.id;
    if (users.length < 1000) return null;
  }
  return null;
}

// Returns { id, created } or { id: null } when the login could not be found or made.
export async function findOrCreateUser(email, metadata = {}) {
  const existing = await findUserIdByEmail(email);
  if (existing) return { id: existing, created: false };
  const r = await authAdmin('/admin/users', {
    method: 'POST',
    body: { email: String(email).toLowerCase().trim(), email_confirm: true, user_metadata: metadata },
  });
  const id = r.ok ? (r.data && (r.data.id || (r.data.user && r.data.user.id))) : null;
  if (id) return { id, created: true };
  // Another request may have created it a moment ago.
  const again = await findUserIdByEmail(email);
  return { id: again, created: false };
}

// One-tap sign-in link for an existing login, or the plain login page when that fails.
export async function signInLink(email, redirectPath = '/dashboard') {
  const redirect = SITE_URL + redirectPath;
  try {
    const r = await authAdmin(`/admin/generate_link?redirect_to=${encodeURIComponent(redirect)}`, {
      method: 'POST',
      body: { type: 'magiclink', email: String(email || '').toLowerCase().trim(), redirect_to: redirect },
    });
    const link = r.ok && r.data && (r.data.action_link || (r.data.properties && r.data.properties.action_link));
    if (link) return link;
  } catch { /* fall through to the login page */ }
  return SITE_URL + '/login';
}
