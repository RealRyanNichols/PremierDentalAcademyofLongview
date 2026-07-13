// Admin manual enrollment: grant a student access to a program/course without a
// purchase. Admin-only (verifies the caller's JWT -> profiles.is_admin), then uses
// the service role to find-or-create the student's account and grant the entitlement
// — the same grant buy-product applies after a paid checkout, minus the charge.
//
// POST body: { email, name?, action }
//   action = 'online'      -> program=career_track + active portal (unlocks online-rda-12-week)
//   action = 'in_person'   -> program=foundation   + active portal (unlocks rda-program)
//   action = 'career_vault'-> profiles.career_vault=true (unlocks /learn?c=career-vault)
//   action = 'remove'      -> portal_status='suspended' (revoke portal access)
// Returns a magic sign-in link so the student can log straight in (also emailed if
// RESEND_API_KEY is set). Never charges anything.

import { requireAdmin, sb, resendSend, json, SUPABASE_URL, PUBLISHABLE_KEY, SITE_URL } from './_common.mjs';

function serviceKey() {
  const k = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!k) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  return k;
}

async function authAdmin(path, { method = 'GET', body } = {}) {
  const key = serviceKey();
  const res = await fetch(`${SUPABASE_URL}/auth/v1/${path}`, {
    method,
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: body != null ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = null; try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) { const e = new Error((data && (data.msg || data.message)) || `auth ${path} ${res.status}`); e.status = res.status; throw e; }
  return data;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'method not allowed' });
  if (!(await requireAdmin(req))) return json(res, 401, { error: 'admin only' });
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return json(res, 500, { error: 'SUPABASE_SERVICE_ROLE_KEY not set' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  const email = String(body?.email || '').trim().toLowerCase();
  const name = String(body?.name || '').trim();
  const action = String(body?.action || 'online');
  if (!email || !email.includes('@')) return json(res, 400, { error: 'valid email required' });
  if (!['online', 'in_person', 'career_vault', 'remove'].includes(action)) return json(res, 400, { error: 'bad action' });

  try {
    // Find the existing account (by profile, then by auth listing), else create it.
    let userId = null;
    const prof = await sb('profiles', { query: { email: `eq.${encodeURIComponent(email)}`, select: 'id', limit: '1' } });
    if (Array.isArray(prof) && prof[0]) userId = prof[0].id;
    if (!userId) {
      const found = await authAdmin(`admin/users?filter=${encodeURIComponent('email eq "' + email + '"')}`).catch(() => null);
      const u = found && (found.users || found)[0];
      if (u?.id) userId = u.id;
    }
    let created = false;
    if (!userId) {
      const [first, ...rest] = name.split(/\s+/);
      const nu = await authAdmin('admin/users', { method: 'POST', body: { email, email_confirm: true, user_metadata: { first_name: first || null, last_name: rest.join(' ') || null, source: 'admin-enroll' } } });
      userId = nu?.id || nu?.user?.id;
      created = true;
      if (!userId) return json(res, 500, { error: 'could not create the student account' });
    }

    // Build the entitlement patch.
    let patch;
    if (action === 'career_vault') patch = { career_vault: true };
    else if (action === 'remove') patch = { portal_status: 'suspended' };
    else patch = { program: action === 'in_person' ? 'foundation' : 'career_track', portal_status: 'active', enrolled_at: new Date().toISOString() };
    if (name && created) { const [first, ...rest] = name.split(/\s+/); patch.first_name = first || null; patch.last_name = rest.join(' ') || null; }

    // Upsert the profile (insert if the account is brand new).
    const upd = await sb(`profiles?id=eq.${userId}`, { method: 'PATCH', prefer: 'return=representation', body: patch });
    if (!Array.isArray(upd) || !upd.length) {
      await sb('profiles', { method: 'POST', prefer: 'resolution=merge-duplicates', body: [{ id: userId, email, ...patch }] });
    }

    // Magic sign-in link so the student lands straight in /learn.
    let magicLink = SITE_URL + '/login';
    try {
      const link = await authAdmin('admin/generate_link', { method: 'POST', body: { type: 'magiclink', email, options: { redirect_to: SITE_URL + '/learn' } } });
      magicLink = link?.properties?.action_link || link?.action_link || magicLink;
    } catch (_) {}

    // Email it (best-effort; only if Resend is configured).
    let emailed = false;
    if (action !== 'remove' && process.env.RESEND_API_KEY) {
      const label = action === 'career_vault' ? 'PDA Career Vault' : action === 'in_person' ? 'the in-person RDA program' : 'the online RDA program';
      const html = `<!doctype html><html><body style="font-family:-apple-system,Segoe UI,sans-serif;background:#f4f7fb;padding:24px;color:#16294a;"><div style="max-width:520px;margin:0 auto;background:#fff;border:1px solid #e6edf6;border-radius:14px;padding:28px;"><h2 style="font-family:Georgia,serif;margin:0 0 10px;">You're in! 🎉</h2><p style="font-size:15px;line-height:1.6;">Amanda has set you up with <strong>${label}</strong> on the Premier Dental Academy website. Tap below to sign in and start — your progress saves automatically.</p><p style="margin:20px 0;"><a href="${magicLink}" style="background:#0d9488;color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:700;font-size:15px;">Open my course →</a></p><p style="font-size:13px;color:#64748b;">Questions? Text (903) 913-6444.</p></div></body></html>`;
      try { const r = await resendSend({ to: email, subject: 'Your Premier Dental Academy course is ready 🎉', html }); emailed = !!r?.id; } catch (_) {}
    }

    return json(res, 200, { ok: true, userId, email, action, created, emailed, magicLink });
  } catch (e) {
    return json(res, 500, { error: e.message });
  }
}
