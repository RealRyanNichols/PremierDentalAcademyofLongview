// site-uploader — writes a batch of base64 files into the public 'site' storage bucket.
//
// 2026-08-22 security fix. Two problems:
//   1. The secret had a hardcoded fallback baked into this source file, so if
//      PDA_UPLOAD_SECRET was not set the function happily accepted the literal that anyone
//      reading the deployed source could see. That fallback is deleted; the function now
//      refuses to run (500) when PDA_UPLOAD_SECRET is absent rather than silently accepting
//      a known value.
//   2. verify_jwt was false, so the x-pda-secret header was the only thing standing between
//      the internet and service-role writes of arbitrary files into a public bucket.
//      verify_jwt is now true; the secret header stays as a second factor.
// NOTE: the old hardcoded value should be considered burned — set PDA_UPLOAD_SECRET to a
// fresh random value and update whatever deploy script calls this.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const SECRET = Deno.env.get('PDA_UPLOAD_SECRET');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const BUCKET = 'site';

type FileSpec = { path: string; mime: string; b64: string };

Deno.serve(async (req: Request) => {
  // No configured secret means no way to authenticate the second factor — refuse to run.
  if (!SECRET) {
    return new Response(JSON.stringify({ ok: false, error: 'not configured', message: 'PDA_UPLOAD_SECRET is not set. site-uploader refuses to run without it — set the secret on the function and retry.' }), { status: 500, headers: { 'content-type': 'application/json' } });
  }
  const url = new URL(req.url);
  if (req.method === 'GET') {
    return new Response(JSON.stringify({ ok: true, hint: 'POST manifest with X-PDA-Secret header' }), { headers: { 'content-type': 'application/json' } });
  }
  if (req.method !== 'POST') return new Response('method not allowed', { status: 405 });
  if (req.headers.get('x-pda-secret') !== SECRET) return new Response('unauthorized', { status: 401 });

  const sb = createClient(SUPABASE_URL, SERVICE_ROLE);
  const body = await req.json() as FileSpec[];

  const results: Array<{ path: string; ok: boolean; error?: string }> = [];
  for (const f of body) {
    try {
      const bytes = Uint8Array.from(atob(f.b64), c => c.charCodeAt(0));
      const { error } = await sb.storage
        .from(BUCKET)
        .upload(f.path, bytes, { contentType: f.mime, upsert: true });
      if (error) {
        results.push({ path: f.path, ok: false, error: error.message });
      } else {
        results.push({ path: f.path, ok: true });
      }
    } catch (e) {
      results.push({ path: f.path, ok: false, error: (e as Error).message });
    }
  }

  return new Response(JSON.stringify({ ok: true, count: results.length, results }, null, 2), {
    headers: { 'content-type': 'application/json' }
  });
});
