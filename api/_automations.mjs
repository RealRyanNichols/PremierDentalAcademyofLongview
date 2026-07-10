// PDA automation engine (Kajabi-replica). Import-only (underscore-prefixed).
//
// runAutomations(trigger_type, trigger_value, email, opts) evaluates the rules in
// public.automations and performs their action against subscribers / sequences.
//
// Rule vocabulary (matches the 10 seeded rows):
//   trigger_type : form_submitted | tag_added | tag_removed | purchase
//   action_type  : add_tag | subscribe_sequence | unsubscribe_sequence
//   action_value : a tag string, or an email_sequences.key
//
// Cascades: add_tag fires tag_added rules (e.g. homepage form → tag → 30-day drip),
// remove_tag fires tag_removed rules. Depth-guarded so tags can't loop forever.

import { sb } from './_common.mjs';

const MAX_DEPTH = 6;

async function ensureSubscriber(email, { first_name, source } = {}) {
  const norm = String(email || '').trim().toLowerCase();
  if (!norm) return null;
  const found = await sb('subscribers', {
    query: { email: `eq.${norm}`, select: 'id,email,tags,status,unsubscribe_token', limit: '1' },
  });
  if (Array.isArray(found) && found[0]) return found[0];
  const inserted = await sb('subscribers', {
    method: 'POST',
    prefer: 'return=representation',
    body: [{ email: norm, first_name: first_name || null, source: source || 'automation' }],
  });
  return Array.isArray(inserted) ? inserted[0] : inserted;
}

async function addTag(sub, tag) {
  const tags = Array.isArray(sub.tags) ? sub.tags : [];
  if (tags.includes(tag)) return false;
  await sb(`subscribers?id=eq.${sub.id}`, {
    method: 'PATCH',
    body: { tags: [...tags, tag] },
  });
  sub.tags = [...tags, tag];
  return true;
}

async function removeTag(sub, tag) {
  const tags = Array.isArray(sub.tags) ? sub.tags : [];
  if (!tags.includes(tag)) return false;
  const next = tags.filter((t) => t !== tag);
  await sb(`subscribers?id=eq.${sub.id}`, { method: 'PATCH', body: { tags: next } });
  sub.tags = next;
  return true;
}

async function subscribeSequence(sub, seqKey) {
  const seqs = await sb('email_sequences', {
    query: { key: `eq.${seqKey}`, select: 'id,key,active', limit: '1' },
  });
  const seq = Array.isArray(seqs) ? seqs[0] : null;
  if (!seq) return { skipped: `no sequence ${seqKey}` };

  // Already actively subscribed? Don't double-enroll.
  const existing = await sb('sequence_subscriptions', {
    query: {
      sequence_id: `eq.${seq.id}`,
      email: `eq.${sub.email}`,
      status: 'eq.active',
      select: 'id',
      limit: '1',
    },
  });
  if (Array.isArray(existing) && existing[0]) return { skipped: `already in ${seqKey}` };

  // First email's delay decides the initial send time.
  const first = await sb('sequence_emails', {
    query: { sequence_id: `eq.${seq.id}`, active: 'eq.true', order: 'position.asc', select: 'delay_days', limit: '1' },
  });
  const delayDays = Array.isArray(first) && first[0] ? Number(first[0].delay_days || 0) : 0;
  const nextSend = new Date(Date.now() + delayDays * 86400000).toISOString();

  await sb('sequence_subscriptions', {
    method: 'POST',
    body: [{
      sequence_id: seq.id,
      subscriber_id: sub.id,
      email: sub.email,
      current_position: 0,
      status: 'active',
      next_send_at: nextSend,
    }],
  });
  return { subscribed: seqKey, next_send_at: nextSend };
}

async function unsubscribeSequence(sub, seqKey) {
  const seqs = await sb('email_sequences', { query: { key: `eq.${seqKey}`, select: 'id', limit: '1' } });
  const seq = Array.isArray(seqs) ? seqs[0] : null;
  if (!seq) return { skipped: `no sequence ${seqKey}` };
  await sb(`sequence_subscriptions?sequence_id=eq.${seq.id}&email=eq.${encodeURIComponent(sub.email)}&status=eq.active`, {
    method: 'PATCH',
    body: { status: 'stopped' },
  });
  return { stopped: seqKey };
}

export async function runAutomations(trigger_type, trigger_value, email, opts = {}) {
  const depth = opts.depth || 0;
  if (depth > MAX_DEPTH) return { skipped: 'max depth' };
  const sub = await ensureSubscriber(email, opts);
  if (!sub) return { error: 'no email' };

  const rules = await sb('automations', {
    query: {
      active: 'eq.true',
      trigger_type: `eq.${trigger_type}`,
      select: 'id,name,trigger_value,action_type,action_value,runs',
    },
  });
  const matched = (Array.isArray(rules) ? rules : []).filter(
    (r) => r.trigger_value == null || r.trigger_value === trigger_value
  );

  const done = [];
  for (const rule of matched) {
    try {
      if (rule.action_type === 'add_tag') {
        const changed = await addTag(sub, rule.action_value);
        done.push({ rule: rule.name, add_tag: rule.action_value, changed });
        if (changed) {
          const casc = await runAutomations('tag_added', rule.action_value, sub.email, { ...opts, depth: depth + 1 });
          done.push({ cascade: 'tag_added', of: rule.action_value, result: casc });
        }
      } else if (rule.action_type === 'remove_tag') {
        const changed = await removeTag(sub, rule.action_value);
        done.push({ rule: rule.name, remove_tag: rule.action_value, changed });
        if (changed) {
          const casc = await runAutomations('tag_removed', rule.action_value, sub.email, { ...opts, depth: depth + 1 });
          done.push({ cascade: 'tag_removed', of: rule.action_value, result: casc });
        }
      } else if (rule.action_type === 'subscribe_sequence') {
        done.push({ rule: rule.name, ...(await subscribeSequence(sub, rule.action_value)) });
      } else if (rule.action_type === 'unsubscribe_sequence') {
        done.push({ rule: rule.name, ...(await unsubscribeSequence(sub, rule.action_value)) });
      } else {
        done.push({ rule: rule.name, skipped: `unknown action ${rule.action_type}` });
      }
      // best-effort run counter
      sb(`automations?id=eq.${rule.id}`, { method: 'PATCH', body: { runs: (rule.runs || 0) + 1 } }).catch(() => {});
    } catch (e) {
      done.push({ rule: rule.name, error: e.message });
    }
  }
  return { trigger_type, trigger_value, email: sub.email, actions: done };
}
