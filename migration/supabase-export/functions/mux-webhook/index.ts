// mux-webhook — Mux calls this when a video finishes processing.
// Set the Mux webhook URL to /functions/v1/mux-webhook?secret=<MUX_WEBHOOK_SECRET>.
// On asset.ready: writes mux_playback_id + duration onto the course lesson (matched by passthrough=lesson_id).
//
// 2026-08-22 security fix — this guard was fail-OPEN. The check read
// `if (guard && given !== guard)`, so whenever MUX_WEBHOOK_SECRET was unset the whole check
// was skipped. It was unset, which meant this endpoint authenticated nobody: anyone who knew
// (or guessed) a lesson id could POST here and overwrite that lesson's video fields.
// It now fails CLOSED — a missing secret rejects every request, same as a wrong secret.
// verify_jwt stays false on purpose: Mux is a third-party webhook caller and cannot present a
// Supabase JWT, so this query-string secret is the only authentication this function has.
// ACTION REQUIRED: set MUX_WEBHOOK_SECRET (function env var, or a row in app_secrets) and put
// the same value in the Mux webhook URL — until then this function rejects everything,
// including real Mux callbacks, and lesson video status will not update.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
async function secret(n: string) { const e = Deno.env.get(n); if (e) return e; const { data } = await sb.from('app_secrets').select('value').eq('key', n).maybeSingle(); return data?.value ?? null; }
const j = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { 'content-type': 'application/json' } });

Deno.serve(async (req) => {
  const guard = await secret('MUX_WEBHOOK_SECRET');
  const given = new URL(req.url).searchParams.get('secret');
  // Fail closed: no configured secret means nothing can authenticate, so reject.
  if (!guard) return j({ error: 'unauthorized', detail: 'MUX_WEBHOOK_SECRET not configured' }, 401);
  if (given !== guard) return j({ error: 'unauthorized' }, 401);
  let p: any; try { p = await req.json(); } catch { return j({ error: 'bad json' }, 400); }
  const type = p?.type || ''; const d = p?.data || {};
  const lesson = d?.passthrough || null;
  if (type === 'video.asset.ready' && lesson) {
    const pb = Array.isArray(d.playback_ids) && d.playback_ids[0] ? d.playback_ids[0].id : null;
    await sb.from('course_lessons').update({ mux_playback_id: pb, mux_asset_id: d.id, duration_seconds: Math.round(d.duration || 0), video_status: 'ready' }).eq('id', lesson);
  } else if (type === 'video.asset.errored' && lesson) {
    await sb.from('course_lessons').update({ video_status: 'errored' }).eq('id', lesson);
  }
  return j({ ok: true, type });
});
