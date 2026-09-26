// mux-upload — admin creates a Mux direct-upload URL for a course lesson.
// Admin-only (checks profiles.is_admin). Inert until MUX_TOKEN_ID/SECRET set.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const SB_URL = Deno.env.get('SUPABASE_URL')!, SVC = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const sb = createClient(SB_URL, SVC, { auth: { persistSession: false } });
async function secret(n: string) { const e = Deno.env.get(n); if (e) return e; const { data } = await sb.from('app_secrets').select('value').eq('key', n).maybeSingle(); return data?.value ?? null; }
const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization,content-type', 'access-control-allow-methods': 'POST,OPTIONS' };
const j = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { 'content-type': 'application/json', ...CORS } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  const jwt = (req.headers.get('Authorization') || '').replace('Bearer ', '');
  const { data: u } = await sb.auth.getUser(jwt);
  if (!u?.user) return j({ error: 'unauthorized' }, 401);
  const { data: prof } = await sb.from('profiles').select('is_admin').eq('id', u.user.id).maybeSingle();
  if (!prof?.is_admin) return j({ error: 'admin only' }, 403);
  const ID = await secret('MUX_TOKEN_ID'), SEC = await secret('MUX_TOKEN_SECRET');
  if (!ID || !SEC) return j({ error: 'MUX not configured', need: ['MUX_TOKEN_ID', 'MUX_TOKEN_SECRET'] }, 400);
  let body: any = {}; try { body = await req.json(); } catch {}
  const lesson_id = body.lesson_id || null, cors = body.cors_origin || '*';
  const r = await fetch('https://api.mux.com/video/v1/uploads', {
    method: 'POST', headers: { Authorization: 'Basic ' + btoa(`${ID}:${SEC}`), 'content-type': 'application/json' },
    body: JSON.stringify({ cors_origin: cors, new_asset_settings: { playback_policy: ['public'], ...(lesson_id ? { passthrough: lesson_id } : {}) } }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) return j({ error: 'mux_error', detail: data }, 502);
  if (lesson_id) await sb.from('course_lessons').update({ video_status: 'uploading' }).eq('id', lesson_id);
  return j({ upload_url: data?.data?.url, upload_id: data?.data?.id });
});
