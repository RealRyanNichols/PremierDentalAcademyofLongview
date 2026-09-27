import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};
function j(body: unknown, status = 200){
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
}

// Kajabi Public API — OAuth 2.0 client_credentials
const KAJABI_TOKEN_URL = 'https://app.kajabi.com/oauth/token';
const KAJABI_API_BASE = 'https://api.kajabi.com/v1';

async function getAccessToken(clientId: string, clientSecret: string){
  const body = new URLSearchParams();
  body.set('grant_type', 'client_credentials');
  body.set('client_id', clientId);
  body.set('client_secret', clientSecret);
  const res = await fetch(KAJABI_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
    body
  });
  const txt = await res.text();
  let data: any = null;
  try { data = JSON.parse(txt); } catch {}
  if(!res.ok){
    return { ok: false, status: res.status, error: data?.error_description || data?.error || txt.slice(0, 500) };
  }
  return { ok: true, access_token: data.access_token, expires_in: data.expires_in };
}

async function kajabiGet(url: string, token: string){
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } });
  if(!res.ok){
    const txt = await res.text();
    throw new Error(`Kajabi GET ${url} → ${res.status}: ${txt.slice(0, 300)}`);
  }
  return await res.json();
}

Deno.serve(async (req) => {
  if(req.method === 'OPTIONS') return new Response(null, { headers: CORS });
  if(req.method !== 'POST') return j({ error: 'POST only' }, 405);

  const url = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

  // Verify caller is admin OR a service-role call (for cron)
  const auth = req.headers.get('Authorization') || '';
  if(!auth.startsWith('Bearer ')) return j({ error: 'Missing auth' }, 401);
  const token = auth.slice(7);
  const isService = token === serviceKey;
  if(!isService){
    const userClient = createClient(url, anonKey, { global: { headers: { Authorization: 'Bearer ' + token } } });
    const { data: { user }, error: uerr } = await userClient.auth.getUser();
    if(uerr || !user) return j({ error: 'Invalid session' }, 401);
    const admin0 = createClient(url, serviceKey);
    const { data: prof } = await admin0.from('profiles').select('is_admin').eq('id', user.id).single();
    if(!prof?.is_admin) return j({ error: 'Admin only' }, 403);
  }
  const admin = createClient(url, serviceKey);

  // Parse mode
  let payload: any = {};
  try { payload = await req.json(); } catch {}
  const mode = payload?.mode || 'sync'; // 'test' | 'sync' | 'preview'
  const limit = Math.min(payload?.limit || 5000, 5000);

  // Load creds from app_secrets
  const { data: secrets } = await admin.from('app_secrets').select('key,value').in('key', ['KAJABI_CLIENT_ID','KAJABI_CLIENT_SECRET']);
  const sm = Object.fromEntries((secrets || []).map((r: any) => [r.key, r.value]));
  const clientId = sm['KAJABI_CLIENT_ID'];
  const clientSecret = sm['KAJABI_CLIENT_SECRET'];
  if(!clientId || !clientSecret){
    return j({ ok: false, error: 'KAJABI_CLIENT_ID and KAJABI_CLIENT_SECRET must be set in app_secrets. Generate them in Kajabi → Settings → Settings → API → Add new application.', missing_secrets: true }, 400);
  }

  // 1) Get a fresh access token
  const tok = await getAccessToken(clientId, clientSecret);
  if(!tok.ok){
    return j({ ok: false, step: 'oauth', error: tok.error, status: tok.status, hint: 'Kajabi returned an OAuth error. Common causes: (a) wrong client_id/secret, (b) API not enabled on your Kajabi plan (Growth+ required), (c) keys were revoked. Try regenerating them.' }, 502);
  }
  const access = tok.access_token;

  if(mode === 'test'){
    return j({ ok: true, message: 'Kajabi OAuth handshake successful', expires_in: tok.expires_in });
  }

  // 2) Paginate /contacts
  let pageUrl: string | null = `${KAJABI_API_BASE}/contacts?page%5Bsize%5D=200`;
  const contacts: any[] = [];
  let pages = 0;
  while(pageUrl && contacts.length < limit && pages < 50){
    pages++;
    let resp: any;
    try { resp = await kajabiGet(pageUrl, access); }
    catch (e: any) { return j({ ok: false, step: 'contacts_list', page: pages, error: e?.message || String(e) }, 502); }
    const data: any[] = resp.data || [];
    contacts.push(...data);
    pageUrl = resp.links?.next || null;
  }

  if(mode === 'preview'){
    const sample = contacts.slice(0, 10).map((c: any) => ({
      id: c.id,
      email: c.attributes?.email,
      name: c.attributes?.name,
      tag_ids: (c.relationships?.tags?.data || []).map((t: any) => t.id)
    }));
    return j({ ok: true, total_found: contacts.length, sample });
  }

  // 3) Fetch tag list once so we can resolve tag IDs → names
  let tagsMap: Record<string,string> = {};
  try {
    let tagsUrl: string | null = `${KAJABI_API_BASE}/tags?page%5Bsize%5D=200`;
    while(tagsUrl){
      const r: any = await kajabiGet(tagsUrl, access);
      (r.data || []).forEach((t: any) => { tagsMap[t.id] = t.attributes?.name || t.attributes?.title || t.id; });
      tagsUrl = r.links?.next || null;
    }
  } catch {}

  // 4) Upsert into profiles
  const summary = { total: contacts.length, created: 0, updated: 0, errors: [] as any[] };
  for(const c of contacts){
    try {
      const email = (c.attributes?.email || '').toLowerCase();
      if(!email || !email.includes('@')) { continue; }
      const fullName = (c.attributes?.name || '').trim();
      const parts = fullName.split(/\s+/);
      const first_name = c.attributes?.first_name || parts[0] || null;
      const last_name = c.attributes?.last_name || parts.slice(1).join(' ') || null;
      const tagIds: string[] = (c.relationships?.tags?.data || []).map((t: any) => t.id);
      const tagNames = tagIds.map(id => tagsMap[id]).filter(Boolean);

      const { data: existing } = await admin.from('profiles').select('id, tags').eq('email', email).maybeSingle();
      if(existing){
        const merged = Array.from(new Set([...(existing.tags || []), ...tagNames]));
        await admin.from('profiles').update({
          first_name: first_name || undefined,
          last_name: last_name || undefined,
          kajabi_id: String(c.id),
          tags: merged,
          imported_at: new Date().toISOString()
        }).eq('id', existing.id);
        summary.updated++;
      } else {
        const tempPwd = crypto.randomUUID() + crypto.randomUUID();
        const { data: newUser, error: aErr } = await admin.auth.admin.createUser({
          email,
          password: tempPwd,
          email_confirm: true,
          user_metadata: { source: 'kajabi_api_sync', kajabi_id: c.id, first_name, last_name }
        });
        if(aErr){
          // If user exists in auth, look it up
          const { data: list } = await admin.auth.admin.listUsers();
          const existingAuth = (list?.users || []).find((u: any) => (u.email||'').toLowerCase() === email);
          if(existingAuth){
            await admin.from('profiles').upsert({
              id: existingAuth.id,
              email,
              first_name,
              last_name,
              kajabi_id: String(c.id),
              tags: tagNames,
              needs_password_setup: true,
              imported_at: new Date().toISOString()
            }, { onConflict: 'id' });
            summary.updated++;
          } else {
            summary.errors.push({ email, error: aErr.message });
          }
          continue;
        }
        await admin.from('profiles').upsert({
          id: newUser.user.id,
          email,
          first_name,
          last_name,
          kajabi_id: String(c.id),
          tags: tagNames,
          is_admin: false,
          needs_password_setup: true,
          imported_at: new Date().toISOString()
        }, { onConflict: 'id' });
        summary.created++;
      }
    } catch(e: any) {
      summary.errors.push({ kajabi_id: c.id, error: e?.message || String(e) });
    }
  }

  // 5) Record the run
  try {
    await admin.from('app_secrets').upsert({ key: 'KAJABI_LAST_SYNC_AT', value: new Date().toISOString() });
    await admin.from('app_secrets').upsert({ key: 'KAJABI_LAST_SYNC_RESULT', value: JSON.stringify(summary) });
  } catch {}

  return j({ ok: true, summary, pages, tag_dictionary_size: Object.keys(tagsMap).length });
});
