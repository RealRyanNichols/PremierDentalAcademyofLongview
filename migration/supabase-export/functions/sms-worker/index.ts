// sms-worker — SMS drip engine (parallel to email-worker). Sends via Quo/OpenPhone API.
// HARD SAFETY: sends nothing unless app_secrets.SMS_SENDER_ENABLED='on'. STOP-aware.
// QUIET HOURS: only sends 9am-8pm America/Chicago (TCPA-friendly). Hour-based cadence.
// Triggered by pg_cron with ?secret=CRON_SECRET. Logs every DELIVERED send to communications.
//
// v5 fixes (Aug 7 2026) — audit after enrolled students received prospect texts:
//   - NEVER texts a current or past student, instructor, or admin. Checked against
//     v_do_not_market by phone AND by the lead's email, immediately before every send.
//     Evaluated at send time, not subscribe time, so a lead who enrolls mid-sequence
//     is caught on their very next scheduled message.
//   - Stops the moment someone replies. The drip is for people who haven't answered;
//     once they text back it is Amanda's conversation, not a campaign.
//   - Stops if Amanda has texted them by hand. The automation never talks over her.
//   - STOP matching is word-boundary, so "I stopped by the office" no longer opts
//     someone out, while stop/unsubscribe/quit/cancel/remove me still do.
//   - Honors the marketing_suppressions list (wrong numbers, do-not-contact).
//
// v4 fixes (Aug 2 2026):
//   - A failed send no longer advances the sequence.
//   - HTTP 402 (Quo prepaid credits exhausted) halts the whole batch.
//   - Real error status/body is recorded on the subscription (last_error).
//   - communications now only records messages that actually left the building.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const SB_URL = Deno.env.get('SUPABASE_URL')!;
const SB_SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const sb = createClient(SB_URL, SB_SERVICE, { auth: { persistSession: false } });
async function secret(name: string): Promise<string | null> {
  const e = Deno.env.get(name); if (e) return e;
  const { data } = await sb.from('app_secrets').select('value').eq('key', name).maybeSingle();
  return data?.value ?? null;
}
const j = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { 'content-type': 'application/json' } });
const digits10 = (p: string) => (p || '').replace(/\D/g, '').slice(-10);
const normEmail = (e: string | null | undefined) => (e || '').trim().toLowerCase();
function inSendWindow(): boolean {
  const h = parseInt(new Intl.DateTimeFormat('en-US', { timeZone: 'America/Chicago', hour: 'numeric', hour12: false }).format(new Date()), 10);
  return h >= 9 && h < 20; // 9:00am-7:59pm Central
}
const MAX_FAILS = 6; // after this many consecutive failures a subscription parks itself

// Word-boundary opt-out. Deliberately narrow: "I stopped by yesterday" must NOT opt out,
// but every real opt-out phrasing must.
const OPT_OUT_RE = /\b(stop|stopall|unsubscribe|unsub|cancel|quit|end|optout|opt\s?out|remove me|take me off|leave me alone|do not (text|contact)|don'?t (text|contact) me)\b/i;

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const given = url.searchParams.get('secret') || req.headers.get('x-cron-secret');
  const CRON = await secret('CRON_SECRET');
  if (!CRON || given !== CRON) return j({ error: 'unauthorized' }, 401);

  // dryRun=1 simulates the whole batch and reports what WOULD happen. Sends nothing,
  // writes nothing. Used to verify a change before it goes live.
  const dryRun = url.searchParams.get('dryRun') === '1';

  const on = (await secret('SMS_SENDER_ENABLED')) === 'on';
  const nowIso = new Date().toISOString();
  if (!on && !dryRun) return j({ sms_enabled: false, processed: 0, note: 'SMS kill switch off — nothing sent' });
  if (!inSendWindow() && !dryRun) return j({ sms_enabled: true, processed: 0, note: 'outside 9am-8pm CT send window — deferring' });

  const QUO = await secret('QUO_API_KEY');
  if (!QUO && !dryRun) return j({ error: 'QUO_API_KEY not set' }, 500);
  let phoneId = await secret('QUO_PHONE_NUMBER_ID');
  if (!phoneId && !dryRun) {
    const r = await fetch('https://api.openphone.com/v1/phone-numbers', { headers: { Authorization: QUO! } });
    const d = await r.json().catch(() => ({} as any));
    phoneId = (d?.data || [])[0]?.id || null;
    if (phoneId) await sb.from('app_secrets').upsert({ key: 'QUO_PHONE_NUMBER_ID', value: phoneId, updated_at: new Date().toISOString() });
  }
  if (!phoneId && !dryRun) return j({ error: 'no Quo phone number' }, 500);

  // ---- Load the do-not-market list once per run (students, staff, suppressions) ----
  const { data: dnmRows, error: dnmErr } = await sb.from('v_do_not_market').select('phone10,email,reason');
  if (dnmErr) {
    // Fail CLOSED. If we cannot prove someone is not a student, we do not text them.
    return j({ error: 'could not load v_do_not_market — refusing to send', detail: dnmErr.message }, 500);
  }
  const dnmPhone = new Map<string, string>();
  const dnmEmail = new Map<string, string>();
  for (const r of dnmRows || []) {
    if (r.phone10) dnmPhone.set(String(r.phone10), String(r.reason));
    if (r.email) dnmEmail.set(normEmail(r.email), String(r.reason));
  }

  const { data: subs } = await sb.from('sms_subscriptions')
    .select('id,sequence_id,lead_id,phone,current_position,fail_count,subscribed_at, sms_sequences!inner(active,key)')
    .eq('status', 'active').lte('next_send_at', nowIso).limit(60);

  let processed = 0, stopped = 0, failed = 0, excluded = 0, replied = 0, handedOff = 0;
  let creditsExhausted = false;
  const wouldSend: any[] = [];
  const wouldSkip: any[] = [];

  for (const s of subs || []) {
    if (!(s as any).sms_sequences?.active) continue;
    const clean = digits10(s.phone);

    // Lead record gives us the email, which is how we catch students whose profile
    // has no phone number on file (that was 25 of 48 at the time of the audit).
    let leadEmail = '', name = 'there';
    if (s.lead_id) {
      const { data: lead } = await sb.from('leads').select('first_name,email').eq('id', s.lead_id).maybeSingle();
      if (lead?.first_name) name = lead.first_name;
      leadEmail = normEmail(lead?.email);
    }

    // ---- GATE 1: current or past student, staff, or suppressed number ----
    const dnmReason = dnmPhone.get(clean) || (leadEmail ? dnmEmail.get(leadEmail) : undefined);
    if (dnmReason) {
      excluded++;
      wouldSkip.push({ phone: s.phone, gate: 'do_not_market', reason: dnmReason, position: s.current_position });
      if (!dryRun) {
        await sb.from('sms_subscriptions').update({
          status: 'excluded',
          last_error: `do-not-market: ${dnmReason}`,
        }).eq('id', s.id);
      }
      continue;
    }

    // ---- GATE 2: they have replied, or Amanda has replied to them ----
    // Anything inbound after they were subscribed means this is a conversation now.
    const since = s.subscribed_at || '1970-01-01T00:00:00Z';
    const { data: msgs } = await sb.from('communications')
      .select('direction,body,source,occurred_at,created_at')
      .eq('channel', 'sms')
      .ilike('contact_phone', `%${clean}%`)
      .gte('created_at', since)
      .limit(200);

    const inbound = (msgs || []).filter((m: any) => m.direction === 'inbound');
    const optedOut = inbound.some((m: any) => OPT_OUT_RE.test(String(m.body || '')));
    if (optedOut) {
      stopped++;
      wouldSkip.push({ phone: s.phone, gate: 'opted_out', position: s.current_position });
      if (!dryRun) await sb.from('sms_subscriptions').update({ status: 'stopped', last_error: 'opted out' }).eq('id', s.id);
      continue;
    }
    if (inbound.length > 0) {
      replied++;
      wouldSkip.push({ phone: s.phone, gate: 'replied', position: s.current_position });
      if (!dryRun) {
        await sb.from('sms_subscriptions').update({
          status: 'replied',
          last_error: `stopped: contact replied ${inbound.length}x — handed to Amanda`,
        }).eq('id', s.id);
      }
      continue;
    }
    // A human-sent outbound (anything not from this drip) means Amanda is handling it.
    const manual = (msgs || []).some((m: any) => m.direction === 'outbound' && m.source !== 'sms-drip');
    if (manual) {
      handedOff++;
      wouldSkip.push({ phone: s.phone, gate: 'amanda_replied', position: s.current_position });
      if (!dryRun) {
        await sb.from('sms_subscriptions').update({
          status: 'handed_off', last_error: 'stopped: Amanda texted this contact personally',
        }).eq('id', s.id);
      }
      continue;
    }

    // ---- Resolve the next step ----
    const nextPos = (s.current_position || 0) + 1;
    const { data: step } = await sb.from('sms_steps').select('body,position').eq('sequence_id', s.sequence_id).eq('position', nextPos).eq('active', true).maybeSingle();
    if (!step) {
      if (!dryRun) await sb.from('sms_subscriptions').update({ status: 'completed' }).eq('id', s.id);
      continue;
    }

    const content = String(step.body).replaceAll('{name}', name);

    if (dryRun) { wouldSend.push({ phone: s.phone, position: nextPos, preview: content.slice(0, 60) }); processed++; continue; }

    let ok = false, status = 0, errText = '';
    try {
      const r = await fetch('https://api.openphone.com/v1/messages', {
        method: 'POST',
        headers: { Authorization: QUO!, 'content-type': 'application/json' },
        body: JSON.stringify({ from: phoneId, to: [s.phone], content }),
      });
      ok = r.ok; status = r.status;
      if (!ok) errText = (await r.text().catch(() => '')).slice(0, 400);
    } catch (e) { ok = false; errText = String(e).slice(0, 400); }

    // ---- FAILURE PATH: hold position, never pretend it sent ----
    if (!ok) {
      failed++;
      const fails = (s.fail_count || 0) + 1;
      if (status === 402) {
        creditsExhausted = true;
        await sb.from('sms_subscriptions').update({
          fail_count: fails,
          last_error: `402 out of Quo credits @ ${nowIso}`,
          next_send_at: new Date(Date.now() + 3600000).toISOString(),
        }).eq('id', s.id);
        break;
      }
      const parked = fails >= MAX_FAILS;
      await sb.from('sms_subscriptions').update({
        fail_count: fails,
        last_error: `${status || 'network'}: ${errText}`.slice(0, 500),
        status: parked ? 'failed' : 'active',
        next_send_at: new Date(Date.now() + 3600000 * Math.min(fails, 6)).toISOString(),
      }).eq('id', s.id);
      continue;
    }

    // ---- SUCCESS PATH ----
    await sb.from('communications').insert({
      contact_phone: s.phone, channel: 'sms', direction: 'outbound', body: content,
      source: 'sms-drip', related_lead_id: s.lead_id || null,
      metadata: { sequence: (s as any).sms_sequences?.key, position: nextPos, ok: true },
    });

    const { data: after } = await sb.from('sms_steps').select('delay_hours,delay_days').eq('sequence_id', s.sequence_id).eq('position', nextPos + 1).eq('active', true).maybeSingle();
    if (after) {
      const hrs = (after.delay_hours != null) ? Number(after.delay_hours) : (Number(after.delay_days || 1) * 24);
      const nxt = new Date(Date.now() + Math.max(1, hrs) * 3600000).toISOString();
      await sb.from('sms_subscriptions').update({ current_position: nextPos, next_send_at: nxt, fail_count: 0, last_error: null }).eq('id', s.id);
    } else {
      await sb.from('sms_subscriptions').update({ current_position: nextPos, status: 'completed', fail_count: 0, last_error: null }).eq('id', s.id);
    }
    processed++;
  }

  return j({
    sms_enabled: true, dry_run: dryRun,
    processed, excluded, replied, handed_off: handedOff, stopped, failed,
    credits_exhausted: creditsExhausted,
    ...(dryRun ? { would_send: wouldSend, would_skip: wouldSkip } : {}),
  });
});
