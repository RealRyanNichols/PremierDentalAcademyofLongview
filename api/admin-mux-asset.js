// Poll a Mux direct upload until its asset is ready, then return the playback id.
// The /admin/courses editor calls this after the browser finishes PUTting the file,
// then writes mux_playback_id / mux_asset_id / duration_seconds onto the lesson.
// Admin-only.  GET ?upload=<uploadId>

import { requireAdmin, json } from './_common.mjs';

function muxAuth() {
  const id = process.env.MUX_TOKEN_ID, secret = process.env.MUX_TOKEN_SECRET;
  if (!id || !secret) return null;
  return 'Basic ' + Buffer.from(`${id}:${secret}`).toString('base64');
}

async function mux(path, auth) {
  const r = await fetch(`https://api.mux.com/video/v1/${path}`, { headers: { Authorization: auth } });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data?.error?.messages?.[0] || `Mux ${path} ${r.status}`);
  return data.data;
}

export default async function handler(req, res) {
  if (!(await requireAdmin(req))) return json(res, 401, { error: 'admin only' });
  const auth = muxAuth();
  if (!auth) return json(res, 200, { configured: false });

  const uploadId = req.query?.upload;
  if (!uploadId) return json(res, 400, { error: 'upload id required' });

  try {
    const upload = await mux(`uploads/${uploadId}`, auth);
    if (upload.status !== 'asset_created' || !upload.asset_id) {
      return json(res, 200, { status: upload.status, ready: false });
    }
    const asset = await mux(`assets/${upload.asset_id}`, auth);
    const playback = (asset.playback_ids || [])[0];
    return json(res, 200, {
      status: asset.status, // 'preparing' | 'ready'
      ready: asset.status === 'ready',
      asset_id: asset.id,
      playback_id: playback?.id || null,
      playback_policy: playback?.policy || null,
      duration_seconds: asset.duration ? Math.round(asset.duration) : null,
    });
  } catch (e) {
    return json(res, 500, { error: e.message });
  }
}
