// Drip-sequence processor — Vercel Cron hits this hourly (see vercel.json).
// For each sequence_subscriptions row that is active and due (next_send_at<=now),
// sends the next sequence_emails entry, advances current_position, and schedules
// the following email by its delay_days. Stops if the subscriber globally
// unsubscribed. Completes when no more emails remain.
//
// SAFETY: only 'active' subscriptions are touched; a sequence with no emails simply
// completes. Requires RESEND_API_KEY + CRON_SECRET.

import { sb, resendSend, unsubHeaders, checkSecret, json } from './_common.mjs';

const BATCH = 200;

export default async function handler(req, res) {
  if (!checkSecret(req)) return json(res, 401, { error: 'unauthorized' });
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return json(res, 500, { error: 'SUPABASE_SERVICE_ROLE_KEY not set' });

  const nowIso = new Date().toISOString();
  let due;
  try {
    due = await sb('sequence_subscriptions', {
      query: { status: 'eq.active', next_send_at: `lte.${nowIso}`, order: 'next_send_at.asc', select: '*', limit: String(BATCH) },
    });
  } catch (e) {
    return json(res, 500, { error: e.message });
  }
  if (!Array.isArray(due) || due.length === 0) return json(res, 200, { ok: true, due: 0, sent: 0 });

  if (!process.env.RESEND_API_KEY) return json(res, 200, { ok: true, due: due.length, sent: 0, note: 'RESEND_API_KEY not set — nothing sent' });

  let sent = 0, completed = 0, stopped = 0, failed = 0;

  for (const sub of due) {
    try {
      // Global unsubscribe / missing subscriber → stop the drip.
      const people = await sb('subscribers', { query: { email: `eq.${encodeURIComponent(sub.email)}`, select: 'status,unsubscribe_token,first_name', limit: '1' } });
      const person = Array.isArray(people) ? people[0] : null;
      if (person && person.status === 'unsubscribed') {
        await sb(`sequence_subscriptions?id=eq.${sub.id}`, { method: 'PATCH', body: { status: 'stopped' } });
        stopped++; continue;
      }

      const emails = await sb('sequence_emails', {
        query: { sequence_id: `eq.${sub.sequence_id}`, active: 'eq.true', order: 'position.asc', select: 'position,delay_days,subject,html' },
      });
      const list = Array.isArray(emails) ? emails : [];
      const idx = sub.current_position || 0;
      if (idx >= list.length) {
        await sb(`sequence_subscriptions?id=eq.${sub.id}`, { method: 'PATCH', body: { status: 'completed' } });
        completed++; continue;
      }

      const email = list[idx];
      // Merge tags: {{FIRST_NAME}} and {{UNSUB_URL}} (visible unsubscribe link in the body).
      const firstName = (person && person.first_name) || sub.email.split('@')[0];
      const unsubUrl = person?.unsubscribe_token
        ? `https://www.premierdentalacademyoflongview.com/unsubscribe?token=${encodeURIComponent(person.unsubscribe_token)}`
        : 'https://www.premierdentalacademyoflongview.com/unsubscribe';
      const html = String(email.html)
        .replaceAll('{{FIRST_NAME}}', firstName)
        .replaceAll('{{UNSUB_URL}}', unsubUrl);
      await resendSend({ to: sub.email, subject: email.subject, html, headers: unsubHeaders(person?.unsubscribe_token) });
      sent++;

      const nextIdx = idx + 1;
      if (nextIdx >= list.length) {
        await sb(`sequence_subscriptions?id=eq.${sub.id}`, { method: 'PATCH', body: { current_position: nextIdx, status: 'completed', next_send_at: null } });
        completed++;
      } else {
        const nextSend = new Date(Date.now() + Number(list[nextIdx].delay_days || 1) * 86400000).toISOString();
        await sb(`sequence_subscriptions?id=eq.${sub.id}`, { method: 'PATCH', body: { current_position: nextIdx, next_send_at: nextSend } });
      }
    } catch (e) {
      failed++;
      // retry in ~1h, don't advance position
      await sb(`sequence_subscriptions?id=eq.${sub.id}`, { method: 'PATCH', body: { next_send_at: new Date(Date.now() + 3600000).toISOString() } }).catch(() => {});
    }
  }

  return json(res, 200, { ok: true, due: due.length, sent, completed, stopped, failed });
}
