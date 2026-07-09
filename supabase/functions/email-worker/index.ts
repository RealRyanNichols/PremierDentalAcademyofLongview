// email-worker — native broadcast + drip engine (replaces Kajabi email)
// Triggered by pg_cron (or manually) with ?secret=CRON_SECRET.
// HARD SAFETY: bulk sends nothing unless app_secrets.EMAIL_SENDER_ENABLED='on'.
// Modes:
//   (cron, needs CRON secret)          process due scheduled campaigns + due sequence steps
//   test_to + campaign_id (secret OR admin JWT)   send ONE preview to an address
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SB_URL = Deno.env.get('SUPABASE_URL')!;
const SB_SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const sb = createClient(SB_URL, SB_SERVICE, { auth: { persistSession: false } });

async function secret(name: string): Promise<string | null> {
  const env = Deno.env.get(name);
  if (env) return env;
  const { data } = await sb.from('app_secrets').select('value').eq('key', name).maybeSingle();
  return data?.value ?? null;
}
const j = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization,content-type,apikey,x-cron-secret' } });
function personalize(t: string, first: string | null) { return (t || '').replaceAll('{{first_name}}', first || 'there').replaceAll('{{ first_name }}', first || 'there'); }

async function resolveAudience(audience: string | null) {
  // Send to everyone who has NOT opted out. subscribers.status defaults to 'subscribed';
  // the unsubscribe flow sets it to 'unsubscribed'. (Older code filtered status='active',
  // which matched 0 real rows — every live subscriber is 'subscribed'.)
  let q = sb.from('subscribers').select('id,email,first_name,unsubscribe_token,tags,status').in('status', ['subscribed', 'active']);
  if (audience && audience.startsWith('tag:')) q = q.contains('tags', [audience.slice(4)]);
  const { data } = await q;
  return data || [];
}

async function resendBatch(apiKey: string, from: string, replyTo: string, siteUrl: string, subject: string, html: string, people: any[]) {
  const out: { email: string; id: string | null; error: string | null }[] = [];
  for (let i = 0; i < people.length; i += 100) {
    const chunk = people.slice(i, i + 100);
    const payload = chunk.map((p) => {
      const unsub = `${siteUrl}/unsubscribe?token=${encodeURIComponent(p.unsubscribe_token || '')}`;
      // Native replacement for the legacy Kajabi {{ unsubscribe_link }} body token, so
      // repo/Kajabi-authored emails render a working per-recipient unsubscribe link.
      const bodyHtml = personalize(html, p.first_name).replaceAll('{{ unsubscribe_link }}', unsub).replaceAll('{{unsubscribe_link}}', unsub);
      return { from, reply_to: replyTo, to: [p.email], subject: personalize(subject, p.first_name), html: bodyHtml, headers: { 'List-Unsubscribe': `<${unsub}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' } };
    });
    const r = await fetch('https://api.resend.com/emails/batch', { method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' }, body: JSON.stringify(payload) });
    const body = await r.json().catch(() => ({}));
    chunk.forEach((p, idx) => { const id = body?.data?.[idx]?.id ?? null; out.push({ email: p.email, id, error: r.ok ? null : (body?.message || `http_${r.status}`) }); });
  }
  return out;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return j({ ok: true });
  const url = new URL(req.url);
  let body: any = {}; try { body = await req.json(); } catch {}
  const given = url.searchParams.get('secret') || req.headers.get('x-cron-secret');
  const CRON = await secret('CRON_SECRET');
  const secretOk = !!CRON && given === CRON;

  // admin via JWT (used only to authorize the single test-send path)
  let isAdmin = false;
  const authz = req.headers.get('Authorization') || '';
  if (authz.startsWith('Bearer ')) {
    try { const { data: u } = await sb.auth.getUser(authz.slice(7)); if (u?.user) { const { data: p } = await sb.from('profiles').select('is_admin').eq('id', u.user.id).maybeSingle(); isAdmin = !!p?.is_admin; } } catch {}
  }

  const RESEND = await secret('RESEND_API_KEY');
  const FROM = (await secret('EMAIL_FROM')) || 'Premier Dental Academy <hello@premierdentalacademyoflongview.com>';
  const REPLY = (await secret('EMAIL_REPLY_TO')) || 'hello@premierdentalacademyoflongview.com';
  const SITE = (await secret('SITE_URL')) || 'https://www.premierdentalacademyoflongview.com';

  // ---- Preview / test mode (single recipient) ----
  const testTo = url.searchParams.get('test_to') || body.test_to;
  const testCampaign = url.searchParams.get('campaign_id') || body.campaign_id;
  if (testTo && testCampaign) {
    if (!secretOk && !isAdmin) return j({ error: 'unauthorized' }, 401);
    if (!RESEND) return j({ error: 'RESEND_API_KEY not set' }, 500);
    const { data: c } = await sb.from('email_campaigns').select('*').eq('id', testCampaign).maybeSingle();
    if (!c) return j({ error: 'campaign not found' }, 404);
    const res = await resendBatch(RESEND, FROM, REPLY, SITE, `[TEST] ${c.subject}`, c.html, [{ email: testTo, first_name: 'Amanda', unsubscribe_token: '' }]);
    return j({ mode: 'test', result: res });
  }

  // ---- Cron processing requires the CRON secret ----
  if (!secretOk) return j({ error: 'unauthorized' }, 401);
  if (!RESEND) return j({ error: 'RESEND_API_KEY not set' }, 500);
  const senderOn = (await secret('EMAIL_SENDER_ENABLED')) === 'on';
  const seqOn = (await secret('SEQUENCES_ENABLED')) === 'on';
  const nowIso = new Date().toISOString();
  const report: Record<string, unknown> = { sender_enabled: senderOn, sequences_enabled: seqOn, campaigns: [], sequences_processed: 0 };
  if (!senderOn && !seqOn) return j({ ...report, note: 'kill switches off — nothing sent' });

  if (senderOn) {
    const { data: due } = await sb.from('email_campaigns').select('*').eq('status', 'scheduled').lte('scheduled_at', nowIso).limit(5);
    for (const c of due || []) {
      await sb.from('email_campaigns').update({ status: 'sending' }).eq('id', c.id);
      const people = await resolveAudience(c.audience);
      const results = await resendBatch(RESEND, FROM, REPLY, SITE, c.subject, c.html, people);
      const rows = results.map((r, i) => ({ campaign_id: c.id, subscriber_id: people[i]?.id ?? null, email: r.email, status: r.error ? 'failed' : 'sent', resend_id: r.id, error: r.error, sent_at: r.error ? null : new Date().toISOString() }));
      if (rows.length) await sb.from('email_sends').insert(rows);
      const ok = rows.filter((r) => r.status === 'sent').length;
      await sb.from('email_campaigns').update({ status: 'sent', sent_count: ok }).eq('id', c.id);
      (report.campaigns as unknown[]).push({ id: c.id, subject: c.subject, recipients: people.length, sent: ok });
    }
  }

  if (seqOn) {
    const { data: enr } = await sb.from('email_sequence_enrollments').select('*, email_sequences!inner(active,id)').eq('status', 'active').lte('next_send_at', nowIso).limit(200);
    let processed = 0;
    for (const e of enr || []) {
      if (!e.email_sequences?.active) continue;
      const nextNo = (e.current_step || 0) + 1;
      const { data: step } = await sb.from('email_sequence_steps').select('*').eq('sequence_id', e.sequence_id).eq('step_number', nextNo).eq('active', true).maybeSingle();
      if (!step) { await sb.from('email_sequence_enrollments').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', e.id); continue; }
      const res = await resendBatch(RESEND, FROM, REPLY, SITE, step.subject, step.html, [{ email: e.email, first_name: null, unsubscribe_token: '' }]);
      await sb.from('email_sends').insert([{ email: e.email, status: res[0]?.error ? 'failed' : 'sent', resend_id: res[0]?.id, error: res[0]?.error, sent_at: new Date().toISOString() }]);
      const { data: after } = await sb.from('email_sequence_steps').select('delay_hours').eq('sequence_id', e.sequence_id).eq('step_number', nextNo + 1).eq('active', true).maybeSingle();
      if (after) { const nxt = new Date(Date.now() + (after.delay_hours || 24) * 3600e3).toISOString(); await sb.from('email_sequence_enrollments').update({ current_step: nextNo, next_send_at: nxt }).eq('id', e.id); }
      else { await sb.from('email_sequence_enrollments').update({ current_step: nextNo, status: 'completed', completed_at: new Date().toISOString() }).eq('id', e.id); }
      processed++;
    }
    report.sequences_processed = processed;
  }
  return j(report);
});
