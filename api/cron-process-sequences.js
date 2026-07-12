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
  if (!Array.isArray(due)) due = [];
  if (due.length && !process.env.RESEND_API_KEY) return json(res, 200, { ok: true, due: due.length, sent: 0, note: 'RESEND_API_KEY not set — nothing sent' });

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

  // ── Quiz-fail alerts → email Amanda (best-effort; each alert emails once). ──
  let alertsEmailed = 0;
  try {
    const alerts = await sb('admin_alerts', {
      query: { kind: 'eq.quiz_failed', resolved: 'eq.false', emailed_at: 'is.null', order: 'created_at.asc', select: 'id,title,detail,created_at', limit: '20' },
    });
    if (Array.isArray(alerts) && alerts.length && process.env.RESEND_API_KEY) {
      const rows = alerts.map((a) =>
        `<tr><td style="padding:8px 10px;border-bottom:1px solid #e6edf6;font-size:14px;color:#16294a;"><strong>${String(a.title || 'Quiz failed').replace(/</g, '&lt;')}</strong><br><span style="color:#64748b;font-size:12px;">${String(a.detail || '').replace(/</g, '&lt;')}</span></td></tr>`
      ).join('');
      const html = `<!doctype html><html><body style="font-family:-apple-system,Segoe UI,sans-serif;background:#f4f7fb;margin:0;padding:24px;color:#16294a;"><div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e6edf6;border-radius:14px;padding:24px;"><h2 style="font-family:Georgia,serif;margin:0 0 6px;">Quiz alert${alerts.length > 1 ? 's' : ''} — ${alerts.length} student${alerts.length > 1 ? 's' : ''} need${alerts.length > 1 ? '' : 's'} you</h2><p style="font-size:14px;color:#475569;margin:0 0 14px;">A failed Knowledge Check locks until you reopen it. Review and reopen from the admin gradebook.</p><table style="width:100%;border-collapse:collapse;">${rows}</table><p style="margin:16px 0 0;"><a href="https://www.premierdentalacademyoflongview.com/admin/insights" style="background:#0f766e;color:#fff;text-decoration:none;padding:10px 18px;border-radius:999px;font-weight:700;font-size:14px;">Open admin insights →</a></p></div></body></html>`;
      await resendSend({ to: 'hello@premierdentalacademyoflongview.com', subject: `PDA: ${alerts.length} quiz alert${alerts.length > 1 ? 's' : ''} waiting`, html });
      const nowIso2 = new Date().toISOString();
      for (const a of alerts) {
        await sb(`admin_alerts?id=eq.${a.id}`, { method: 'PATCH', body: { emailed_at: nowIso2 } }).catch(() => {});
      }
      alertsEmailed = alerts.length;
    }
  } catch (_) { /* alert email is best-effort — never fail the cron */ }

  return json(res, 200, { ok: true, due: due.length, sent, completed, stopped, failed, alertsEmailed });
}
