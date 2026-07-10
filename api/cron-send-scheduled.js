// Broadcast sender — Vercel Cron hits this every 15 min (see vercel.json).
// Dispatches any email_campaigns that are status='scheduled' AND scheduled_at<=now,
// one send per subscriber, deduped through email_sends. Batched so a big list drains
// over several ticks within the serverless time limit.
//
// SAFETY: sends ONLY campaigns an admin has flipped to 'scheduled'. Imported
// campaigns stay 'draft' and are never touched. Requires RESEND_API_KEY + CRON_SECRET.

import { sb, resendSend, unsubHeaders, checkSecret, json } from './_common.mjs';

const BATCH = 120; // sends per tick — keeps each invocation well under the time limit

function targetsQuery(audience) {
  // 'all' → everyone still subscribed. Otherwise treat audience as a tag.
  const q = { select: 'id,email,first_name,unsubscribe_token,status,tags', limit: '2000', status: 'neq.unsubscribed' };
  if (audience && audience !== 'all') q.tags = `cs.{"${audience}"}`;
  return q;
}

export default async function handler(req, res) {
  if (!checkSecret(req)) return json(res, 401, { error: 'unauthorized' });
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return json(res, 500, { error: 'SUPABASE_SERVICE_ROLE_KEY not set' });

  const nowIso = new Date().toISOString();
  let due;
  try {
    due = await sb('email_campaigns', {
      query: { status: 'eq.scheduled', scheduled_at: `lte.${nowIso}`, order: 'scheduled_at.asc', select: '*' },
    });
  } catch (e) {
    return json(res, 500, { error: e.message });
  }
  if (!Array.isArray(due) || due.length === 0) return json(res, 200, { ok: true, due: 0, sent: 0 });

  if (!process.env.RESEND_API_KEY) return json(res, 200, { ok: true, due: due.length, sent: 0, note: 'RESEND_API_KEY not set — nothing sent' });

  const summary = [];
  let totalSent = 0, totalFailed = 0;

  for (const c of due) {
    let targets = await sb('subscribers', { query: targetsQuery(c.audience) });
    targets = Array.isArray(targets) ? targets : [];
    const already = await sb('email_sends', { query: { campaign_id: `eq.${c.id}`, select: 'email', limit: '5000' } });
    const sentSet = new Set((already || []).map((r) => String(r.email).toLowerCase()));

    const remaining = targets.filter((t) => !sentSet.has(String(t.email).toLowerCase()));
    const batch = remaining.slice(0, BATCH);
    let sent = 0, failed = 0;

    for (const s of batch) {
      let row = { campaign_id: c.id, subscriber_id: s.id, email: s.email, status: 'sent' };
      try {
        // Merge tags: {{FIRST_NAME}} + {{UNSUB_URL}} (visible unsubscribe link in the body).
        const unsubUrl = s.unsubscribe_token
          ? `https://www.premierdentalacademyoflongview.com/unsubscribe?token=${encodeURIComponent(s.unsubscribe_token)}`
          : 'https://www.premierdentalacademyoflongview.com/unsubscribe';
        const html = String(c.html)
          .replaceAll('{{FIRST_NAME}}', s.first_name || s.email.split('@')[0])
          .replaceAll('{{UNSUB_URL}}', unsubUrl);
        const r = await resendSend({
          to: s.email,
          subject: c.subject,
          html,
          headers: unsubHeaders(s.unsubscribe_token),
        });
        row.resend_id = r?.id || null;
        row.sent_at = new Date().toISOString();
        sent++;
      } catch (e) {
        row.status = 'failed';
        row.error = String(e.message).slice(0, 500);
        failed++;
      }
      await sb('email_sends', { method: 'POST', body: [row] }).catch(() => {});
    }

    const doneNow = remaining.length - batch.length === 0;
    await sb(`email_campaigns?id=eq.${c.id}`, {
      method: 'PATCH',
      body: { sent_count: (c.sent_count || 0) + sent, ...(doneNow ? { status: 'sent' } : {}) },
    }).catch(() => {});

    totalSent += sent; totalFailed += failed;
    summary.push({ campaign: c.internal_title, targeted: targets.length, sent, failed, remaining: remaining.length - batch.length });
  }

  return json(res, 200, { ok: true, due: due.length, sent: totalSent, failed: totalFailed, campaigns: summary });
}
