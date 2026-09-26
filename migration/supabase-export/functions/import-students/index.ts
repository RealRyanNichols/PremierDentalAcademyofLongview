import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

function j(body, status = 200){
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
}

function randomPwd(){
  return crypto.randomUUID() + crypto.randomUUID();
}

// Normalize a program label to the canonical value the portal gate expects
// (profiles.program via my_portal_access). In-person => 'foundation',
// Online => 'career_track'. Mirrors the kajabi-webhook mapping.
function normProgram(v){
  if(!v) return null;
  const s = String(v).trim().toLowerCase().replace(/[\s-]+/g,'_');
  if(['in_person','inperson','foundation','onsite','in_person_rda'].includes(s)) return 'foundation';
  if(['online','career_track','online_rda','online_program'].includes(s)) return 'career_track';
  if(s === 'staff') return 'staff';
  if(s === 'admin') return 'admin';
  if(s === 'preview') return 'preview';
  return 'career_track';
}

Deno.serve(async (req) => {
  if(req.method === 'OPTIONS') return new Response(null, { headers: CORS });
  if(req.method !== 'POST') return j({ error: 'POST only' }, 405);

  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');

  const auth = req.headers.get('Authorization') || '';
  if(!auth.startsWith('Bearer ')) return j({ error: 'Missing auth' }, 401);
  const token = auth.slice(7);
  const userClient = createClient(url, anonKey, { global: { headers: { Authorization: 'Bearer ' + token } } });
  const { data: { user }, error: uerr } = await userClient.auth.getUser();
  if(uerr || !user) return j({ error: 'Invalid session' }, 401);
  const admin = createClient(url, serviceKey);
  const { data: prof } = await admin.from('profiles').select('is_admin').eq('id', user.id).single();
  if(!prof?.is_admin) return j({ error: 'Admin only' }, 403);

  let payload;
  try { payload = await req.json(); } catch { return j({ error: 'Bad JSON' }, 400); }
  const rows = Array.isArray(payload?.rows) ? payload.rows : null;
  if(!rows) return j({ error: 'Pass { rows: [...] } where each row has at minimum an email' }, 400);

  const batchProgram = normProgram(payload?.program);
  const batchCohort = payload?.cohort ? String(payload.cohort).trim() : null;
  const batchCareerVault = payload?.career_vault === true;
  const grantAccess = payload?.grant_access !== false;
  const nowIso = new Date().toISOString();

  const normalized = rows.map((r) => {
    const get = (...keys) => {
      for(const k of keys){ const v = r[k] ?? r[k.toLowerCase()] ?? r[k.replace(/[\s_]/g,'').toLowerCase()]; if(v != null && v !== '') return String(v).trim(); }
      return null;
    };
    const tagsRaw = get('tags','tag','kajabi_tags','member_tags');
    const tags = tagsRaw ? tagsRaw.split(/[,;|]/).map((t) => t.trim()).filter(Boolean) : [];
    const rowProgram = normProgram(get('program','Program','plan','product'));
    return {
      email: (get('email','Email','email_address','Email Address','member_email') || '').toLowerCase(),
      first_name: get('first_name','First Name','firstname','given_name'),
      last_name: get('last_name','Last Name','lastname','family_name'),
      phone: get('phone','Phone','phone_number','mobile'),
      city: get('city','City'),
      state: get('state','State'),
      kajabi_id: get('kajabi_id','member_id','id','user_id'),
      program: rowProgram || batchProgram,
      cohort: get('cohort','Cohort') || batchCohort,
      tags
    };
  }).filter((r) => r.email && r.email.includes('@'));

  const summary = { total: normalized.length, created: 0, updated: 0, granted: 0, skipped: 0, errors: [] };

  for(const r of normalized){
    try {
      const { data: existing } = await admin.from('profiles').select('id, tags, enrolled_at, program, is_admin').eq('email', r.email).maybeSingle();

      if(existing){
        const merged = Array.from(new Set([...(existing.tags || []), ...r.tags]));
        const upd = {
          first_name: r.first_name || undefined,
          last_name: r.last_name || undefined,
          phone: r.phone || undefined,
          city: r.city || undefined,
          state: r.state || undefined,
          kajabi_id: r.kajabi_id || undefined,
          tags: merged,
          imported_at: nowIso
        };
        if(grantAccess && !existing.is_admin){
          upd.portal_status = 'active';
          upd.program = r.program || existing.program || 'career_track';
          upd.enrolled_at = existing.enrolled_at || nowIso;
          if(r.cohort) upd.cohort = r.cohort;
          if(batchCareerVault) upd.career_vault = true;
        }
        await admin.from('profiles').update(upd).eq('id', existing.id);
        summary.updated++;
        if(grantAccess && !existing.is_admin) summary.granted++;
      } else {
        const { data: authUser, error: authErr } = await admin.auth.admin.createUser({
          email: r.email,
          password: randomPwd(),
          email_confirm: true,
          user_metadata: { first_name: r.first_name, last_name: r.last_name, source: 'kajabi_import', kajabi_id: r.kajabi_id }
        });
        if(authErr){
          if((authErr.message||'').toLowerCase().includes('already')){
            const { data: list } = await admin.auth.admin.listUsers();
            const existingAuth = (list?.users || []).find((u) => (u.email||'').toLowerCase() === r.email);
            if(existingAuth){
              await admin.from('profiles').upsert({
                id: existingAuth.id,
                email: r.email,
                first_name: r.first_name,
                last_name: r.last_name,
                phone: r.phone,
                city: r.city,
                state: r.state || 'TX',
                kajabi_id: r.kajabi_id,
                tags: r.tags,
                needs_password_setup: true,
                imported_at: nowIso,
                ...(grantAccess ? { program: r.program || 'career_track', portal_status: 'active', enrolled_at: nowIso, cohort: r.cohort || undefined, career_vault: batchCareerVault ? true : undefined } : {})
              }, { onConflict: 'id' });
              summary.created++;
              if(grantAccess) summary.granted++;
              continue;
            }
          }
          summary.errors.push({ email: r.email, error: authErr.message });
          continue;
        }
        const newId = authUser.user.id;
        await admin.from('profiles').upsert({
          id: newId,
          email: r.email,
          first_name: r.first_name,
          last_name: r.last_name,
          phone: r.phone,
          city: r.city,
          state: r.state || 'TX',
          kajabi_id: r.kajabi_id,
          tags: r.tags,
          needs_password_setup: true,
          is_admin: false,
          imported_at: nowIso,
          ...(grantAccess ? { program: r.program || 'career_track', portal_status: 'active', enrolled_at: nowIso, cohort: r.cohort || undefined, career_vault: batchCareerVault ? true : undefined } : {})
        }, { onConflict: 'id' });
        summary.created++;
        if(grantAccess) summary.granted++;
      }
    } catch (e) {
      summary.errors.push({ email: r.email, error: e?.message || String(e) });
    }
  }

  return j({ ok: true, summary });
});
