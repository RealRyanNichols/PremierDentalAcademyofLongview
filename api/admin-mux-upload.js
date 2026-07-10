// Create a Mux direct-upload URL for the /admin/courses lesson editor.
// The browser PUTs the video file straight to Mux (never through our server).
// Admin-only. Requires MUX_TOKEN_ID + MUX_TOKEN_SECRET (else returns configured:false
// so the UI can fall back to a YouTube URL / paste-a-playback-id field).
//
// Playback policy: pass { signed:true } to mint a signed asset (paid courses —
// requires a Mux signing key + a token on playback). Default is 'public' (faster to
// ship; anyone with the playback id can stream). See docs/kajabi-migration-phase1.md.

import { requireAdmin, json } from './_common.mjs';

function muxAuth() {
  const id = process.env.MUX_TOKEN_ID, secret = process.env.MUX_TOKEN_SECRET;
  if (!id || !secret) return null;
  return 'Basic ' + Buffer.from(`${id}:${secret}`).toString('base64');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'method not allowed' });
  if (!(await requireAdmin(req))) return json(res, 401, { error: 'admin only' });

  const auth = muxAuth();
  if (!auth) return json(res, 200, { configured: false, note: 'MUX_TOKEN_ID / MUX_TOKEN_SECRET not set' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  const signed = !!(body && body.signed);
  const corsOrigin = (body && body.cors_origin) || '*';

  try {
    const r = await fetch('https://api.mux.com/video/v1/uploads', {
      method: 'POST',
      headers: { Authorization: auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cors_origin: corsOrigin,
        new_asset_settings: { playback_policy: [signed ? 'signed' : 'public'], mp4_support: 'none' },
      }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) return json(res, 502, { error: data?.error?.messages?.[0] || `Mux ${r.status}` });
    return json(res, 200, { configured: true, upload_id: data.data.id, url: data.data.url });
  } catch (e) {
    return json(res, 500, { error: e.message });
  }
}
