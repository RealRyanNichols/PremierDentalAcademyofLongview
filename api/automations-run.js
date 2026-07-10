// Automation trigger endpoint.
// POST { trigger_type, trigger_value, email, first_name?, source? }
// Runs the automations engine (see api/_automations.mjs) for that event.
//
// Auth: server-to-server via a shared secret (Authorization: Bearer <INTERNAL_SECRET>
// or CRON_SECRET), OR an admin's Supabase access token. This keeps the endpoint from
// being used to spam arbitrary people into drip sequences.
//
// Call sites (wire as follow-ups — see docs/kajabi-migration-phase1.md):
//   - Square purchase (buy-product / enroll): trigger_type='purchase',
//     trigger_value = products.entitlement_flag (e.g. 'online_program','career_vault')
//   - Site lead forms: trigger_type='form_submitted', trigger_value = the form key
//   - Tag changes on subscribers: trigger_type='tag_added' | 'tag_removed'

import { checkSecret, requireAdmin, json } from './_common.mjs';
import { runAutomations } from './_automations.mjs';

const VALID = new Set(['form_submitted', 'tag_added', 'tag_removed', 'purchase']);

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'method not allowed' });

  const authed = checkSecret(req, 'INTERNAL_SECRET') || checkSecret(req, 'CRON_SECRET') || (await requireAdmin(req));
  if (!authed) return json(res, 401, { error: 'unauthorized' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  const { trigger_type, trigger_value, email, first_name, source } = body || {};

  if (!VALID.has(trigger_type)) return json(res, 400, { error: 'invalid trigger_type' });
  if (!email) return json(res, 400, { error: 'email required' });

  try {
    const result = await runAutomations(trigger_type, trigger_value ?? null, email, { first_name, source });
    return json(res, 200, { ok: true, ...result });
  } catch (e) {
    return json(res, 500, { error: e.message });
  }
}
