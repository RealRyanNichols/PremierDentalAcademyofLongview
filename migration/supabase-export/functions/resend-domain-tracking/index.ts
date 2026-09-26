// resend-domain-tracking — one-purpose admin helper. v2 2026-08-12.
// Resend disables open/click tracking by default, which is why email_events had
// thousands of 'delivered' rows and zero opens/clicks. pg_net cannot issue PATCH,
// so this function does it, reading the API key from app_secrets (never exposed).
//
// v2 FIX: v1 searched for the domain literally named
// 'premierdentalacademyoflongview.com'. The account has no such domain — the real
// verified sending domain is 'updates.premierdentalacademyoflongview.com'
// (From: amanda@updates....). So v1 always returned 'production domain not found'
// and never applied the patch. v2 matches any verified domain under the brand
// apex, preferring an exact match, and reports exactly what it chose.
//
// Auth: KAJABI_PULL_SECRET via ?secret= query param OR x-admin-secret header
// (header form lets pg_net call this without the secret landing in a URL).
// GET  -> report current tracking flags (no mutation)
// POST -> enable open + click tracking on the resolved domain
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const APEX = 'premierdentalacademyoflongview.com';
const j = (o: unknown, s = 200) => new Response(JSON.stringify(o, null, 2), { status: s, headers: { 'content-type': 'application/json' } });

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let out = 0; for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

function pickDomain(all: any[]) {
  const brand = all.filter((d: any) => typeof d?.name === 'string' && d.name.endsWith(APEX));
  if (!brand.length) return null;
  const verified = brand.filter((d: any) => d.status === 'verified');
  const pool = verified.length ? verified : brand;
  // Prefer the subdomain actually used to send, then the apex, then whatever is left.
  return pool.find((d: any) => d.name === 'updates.' + APEX)
      || pool.find((d: any) => d.name === APEX)
      || pool[0];
}

Deno.serve(async (req) => {
  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
  const { data: rows } = await sb.from('app_secrets').select('key,value').in('key', ['RESEND_API_KEY', 'KAJABI_PULL_SECRET']);
  const cfg: Record<string, string> = {}; (rows || []).forEach((r: any) => cfg[r.key] = r.value);

  const url = new URL(req.url);
  const provided = url.searchParams.get('secret') || req.headers.get('x-admin-secret') || '';
  if (!cfg.KAJABI_PULL_SECRET || !safeEqual(provided, cfg.KAJABI_PULL_SECRET)) return j({ error: 'unauthorized' }, 401);

  const key = cfg.RESEND_API_KEY;
  if (!key) return j({ error: 'no resend key' }, 200);
  const H = { Authorization: 'Bearer ' + key, 'content-type': 'application/json' };

  const listRes = await fetch('https://api.resend.com/domains', { headers: H });
  const list = await listRes.json().catch(() => ({}));
  const all = list?.data || [];
  const target = pickDomain(all);
  if (!target) return j({ error: 'no brand domain found', names: all.map((d: any) => d.name) }, 200);

  const detailOf = async () => {
    const r = await fetch(`https://api.resend.com/domains/${target.id}`, { headers: H });
    const d = await r.json().catch(() => ({}));
    return { name: d?.name, status: d?.status, open_tracking: d?.open_tracking, click_tracking: d?.click_tracking };
  };

  if (req.method === 'GET') {
    return j({ ok: true, chose: target.name, candidates: all.map((d: any) => d.name), tracking: await detailOf() });
  }

  const before = await detailOf();
  const patch = await fetch(`https://api.resend.com/domains/${target.id}`, {
    method: 'PATCH', headers: H,
    body: JSON.stringify({ open_tracking: true, click_tracking: true }),
  });
  const body = await patch.json().catch(() => ({}));
  const after = await detailOf();
  return j({
    ok: patch.ok && after.open_tracking === true && after.click_tracking === true,
    http_status: patch.status,
    chose: target.name,
    before, after, patch_response: body,
  });
});
