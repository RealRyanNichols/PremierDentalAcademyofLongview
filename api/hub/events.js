// Office Hub — analytics ingest. One route for public + product events.
//
// POST { event_name, props?, idempotency_key, anon_id?, org_id? }
// - event_name must be on the shared allowlist (assets/hub/hub-events.mjs)
// - membership is resolved SERVER-SIDE from the caller's Supabase token —
//   the client can never claim someone else's membership
// - idempotency_key dedupes: a unique violation is a silent success
// - PII-shaped prop keys are stripped; props are size-capped
// - no third-party analytics scripts are involved anywhere in the hub

import { sb, authUser, json } from '../_common.mjs';
import { HUB_EVENT_NAMES, PII_PROP_KEYS } from '../../assets/hub/hub-events.mjs';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function handler(req, res) {
  if (req.method !== 'POST') { json(res, 405, { ok: false, error: 'POST only' }); return; }
  const b = req.body || {};

  const eventName = String(b.event_name || '');
  if (!HUB_EVENT_NAMES.includes(eventName)) {
    json(res, 400, { ok: false, error: 'unknown event_name' }); return;
  }
  const idem = String(b.idempotency_key || '').slice(0, 200);
  if (idem.length < 8) { json(res, 400, { ok: false, error: 'idempotency_key required' }); return; }
  const anonId = typeof b.anon_id === 'string' ? b.anon_id.slice(0, 64) : null;
  const orgId = UUID_RE.test(String(b.org_id || '')) ? b.org_id : null;

  // Props: object only, PII keys stripped, capped at 2KB serialized.
  let props = {};
  if (b.props && typeof b.props === 'object' && !Array.isArray(b.props)) {
    for (const [k, v] of Object.entries(b.props)) {
      if (PII_PROP_KEYS.includes(k.toLowerCase())) continue;
      if (['string', 'number', 'boolean'].includes(typeof v)) props[k] = typeof v === 'string' ? v.slice(0, 300) : v;
    }
    if (JSON.stringify(props).length > 2048) props = {};
  }

  // Resolve membership from the auth token (never trusted from the client).
  let membershipId = null;
  try {
    const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    if (token && orgId) {
      const user = await authUser(token);
      if (user?.id) {
        const rows = await sb('hub_org_memberships', {
          query: { select: 'id', org_id: `eq.${orgId}`, profile_id: `eq.${user.id}`, status: 'eq.active', limit: '1' },
        });
        membershipId = rows?.[0]?.id || null;
      }
    }
  } catch { /* anonymous events are fine */ }

  // Crude anon flood guard: 60 events/min per anon_id.
  try {
    if (!membershipId && anonId) {
      const since = new Date(Date.now() - 60_000).toISOString();
      const recent = await sb('hub_analytics_events', {
        query: { select: 'id', anon_id: `eq.${anonId}`, at: `gte.${since}`, limit: '61' },
      });
      if (Array.isArray(recent) && recent.length >= 60) {
        json(res, 429, { ok: false, error: 'rate_limited' }); return;
      }
    }
  } catch { /* table missing pre-migration — fall through to insert attempt */ }

  try {
    await sb('hub_analytics_events', {
      method: 'POST',
      prefer: 'resolution=ignore-duplicates,return=minimal',
      query: { on_conflict: 'idempotency_key' },
      body: [{
        event_name: eventName, props,
        org_id: orgId, membership_id: membershipId, anon_id: anonId,
        idempotency_key: idem,
      }],
    });
  } catch (e) {
    // Duplicate key (without ignore-duplicates support) = success by contract.
    if (e?.status === 409) { json(res, 200, { ok: true, deduped: true }); return; }
    json(res, 503, { ok: false, error: 'unavailable' }); return;
  }
  json(res, 200, { ok: true });
}
