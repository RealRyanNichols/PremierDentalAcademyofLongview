// kajabi-pull v2 — READ-ONLY contact puller. 2026-08-08.
// v2 fix: correct OAuth token endpoint per Kajabi API docs — https://api.kajabi.com/v1/oauth/token
// (the never-run kajabi-sync used app.kajabi.com/oauth/token, which 404s).
// Pulls all Kajabi contacts into public.kajabi_contacts_staging. Creates NO auth users.
// Auth: ?secret= must match app_secrets.KAJABI_PULL_SECRET.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

function j(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

const KAJABI_TOKEN_URL = 'https://api.kajabi.com/v1/oauth/token';
const KAJABI_API_BASE = 'https://api.kajabi.com/v1';

Deno.serve(async (req) => {
  if (req.method !== 'POST') return j({ error: 'POST only' }, 405);

  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: rows } = await sb.from('app_secrets').select('key,value')
    .in('key', ['KAJABI_PULL_SECRET', 'KAJABI_CLIENT_ID', 'KAJABI_CLIENT_SECRET']);
  const cfg: Record<string, string> = {};
  (rows || []).forEach((r: any) => (cfg[r.key] = r.value));

  const SECRET = cfg['KAJABI_PULL_SECRET'] || '';
  const url = new URL(req.url);
  const provided = url.searchParams.get('secret') || '';
  if (!SECRET || !safeEqual(provided, SECRET)) return j({ error: 'unauthorized' }, 401);

  const clientId = cfg['KAJABI_CLIENT_ID'];
  const clientSecret = cfg['KAJABI_CLIENT_SECRET'];
  if (!clientId || !clientSecret) return j({ ok: false, error: 'missing kajabi credentials' }, 200);

  const body = new URLSearchParams();
  body.set('grant_type', 'client_credentials');
  body.set('client_id', clientId);
  body.set('client_secret', clientSecret);
  const tokRes = await fetch(KAJABI_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body,
  });
  if (!tokRes.ok) {
    const txt = await tokRes.text().catch(() => '');
    return j({ ok: false, step: 'oauth', status: tokRes.status, error: txt.slice(0, 300) }, 200);
  }
  const tok = await tokRes.json();
  const access = tok.access_token;
  const hdrs = { Authorization: 'Bearer ' + access, Accept: 'application/json' };

  const tagsMap: Record<string, string> = {};
  try {
    let tagsUrl: string | null = `${KAJABI_API_BASE}/tags?page%5Bsize%5D=200`;
    let guard = 0;
    while (tagsUrl && guard++ < 20) {
      const r = await fetch(tagsUrl, { headers: hdrs });
      if (!r.ok) break;
      const jd = await r.json();
      (jd.data || []).forEach((t: any) => { tagsMap[t.id] = t.attributes?.name || t.attributes?.title || String(t.id); });
      tagsUrl = jd.links?.next || null;
    }
  } catch (_) { /* tags optional */ }

  let pageUrl: string | null = `${KAJABI_API_BASE}/contacts?page%5Bsize%5D=200`;
  let pages = 0, total = 0, upserted = 0, errors = 0;
  let firstError: string | null = null;
  while (pageUrl && pages < 50) {
    pages++;
    const r = await fetch(pageUrl, { headers: hdrs });
    if (!r.ok) {
      const txt = await r.text().catch(() => '');
      return j({ ok: false, step: 'contacts', page: pages, status: r.status, error: txt.slice(0, 300), total, upserted }, 200);
    }
    const jd = await r.json();
    const data: any[] = jd.data || [];
    total += data.length;
    const rows2 = data.map((c: any) => {
      const fullName = (c.attributes?.name || '').trim();
      const parts = fullName.split(/\s+/);
      const tagIds: string[] = (c.relationships?.tags?.data || []).map((t: any) => String(t.id));
      return {
        kajabi_id: String(c.id),
        email: (c.attributes?.email || '').toLowerCase() || null,
        name: fullName || null,
        first_name: c.attributes?.first_name || parts[0] || null,
        last_name: c.attributes?.last_name || parts.slice(1).join(' ') || null,
        tags: tagIds.map((id) => tagsMap[id]).filter(Boolean),
        raw: c,
        pulled_at: new Date().toISOString(),
      };
    });
    if (rows2.length) {
      const { error, count } = await sb.from('kajabi_contacts_staging')
        .upsert(rows2, { onConflict: 'kajabi_id', count: 'exact' });
      if (error) { errors++; if (!firstError) firstError = error.message; } else { upserted += count ?? rows2.length; }
    }
    pageUrl = jd.links?.next || null;
  }

  return j({ ok: true, pages, total, upserted, errors, first_error: firstError, tag_dictionary_size: Object.keys(tagsMap).length });
});
