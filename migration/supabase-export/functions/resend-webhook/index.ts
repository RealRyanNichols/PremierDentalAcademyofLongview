// resend-webhook — email tracking + auto-suppression
// Point Resend > Webhooks at: /functions/v1/resend-webhook
// Logs delivered/opened/clicked/bounced/complained to email_events.
// On bounce/complaint: suppress the subscriber + cancel their sequences.
//
// v3 (2026-08-08): bounce/complaint now cancels sequence_subscriptions (the LIVE drip
// table the email-worker reads) — v2 cancelled email_sequence_enrollments, a dead table
// the worker never touches, so bounced addresses kept receiving the drip.
//
// v4 (2026-08-22): SECURITY — verify the Svix signature before trusting anything.
// Until now this endpoint accepted any unauthenticated POST. Because a "bounced" or
// "complained" event marks a subscriber dead AND cancels their running drip, anyone
// who found this URL could have looped over the subscriber list with forged bounce
// events and silently shut off every email the school sends — with no error anywhere.
// The signing secret was already stored as RESEND_WEBHOOK_SECRET; the code just never
// read it. verify_jwt stays false because Resend cannot present a Supabase JWT — the
// signature IS the authentication.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
const j = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { 'content-type': 'application/json' } });

// Tolerate this much clock skew on the signed timestamp, in seconds. Svix's own default.
const TOLERANCE_SECONDS = 60 * 5;

let cachedSecret: string | null = null;
async function getSigningSecret(): Promise<string | null> {
  if (cachedSecret) return cachedSecret;
  const fromEnv = Deno.env.get('RESEND_WEBHOOK_SECRET');
  if (fromEnv) { cachedSecret = fromEnv; return cachedSecret; }
  const { data } = await sb.from('app_secrets').select('value').eq('key', 'RESEND_WEBHOOK_SECRET').maybeSingle();
  if (data?.value) { cachedSecret = data.value as string; return cachedSecret; }
  return null;
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

// Svix scheme: HMAC-SHA256 over `${id}.${timestamp}.${rawBody}`, keyed by the base64
// portion of a `whsec_...` secret, result base64. The svix-signature header carries a
// space-delimited list of `v1,<sig>` — any one matching is a pass (supports key rotation).
async function verifySvix(rawBody: string, headers: Headers, secret: string): Promise<{ ok: boolean; reason?: string }> {
  const id = headers.get('svix-id') ?? headers.get('webhook-id');
  const ts = headers.get('svix-timestamp') ?? headers.get('webhook-timestamp');
  const sigHeader = headers.get('svix-signature') ?? headers.get('webhook-signature');
  if (!id || !ts || !sigHeader) return { ok: false, reason: 'missing signature headers' };

  const tsNum = Number(ts);
  if (!Number.isFinite(tsNum)) return { ok: false, reason: 'bad timestamp' };
  const skew = Math.abs(Math.floor(Date.now() / 1000) - tsNum);
  if (skew > TOLERANCE_SECONDS) return { ok: false, reason: 'timestamp outside tolerance' };

  const keyB64 = secret.startsWith('whsec_') ? secret.slice(6) : secret;
  let keyBytes: Uint8Array;
  try { keyBytes = b64ToBytes(keyB64); } catch { return { ok: false, reason: 'malformed signing secret' }; }

  const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signed = new TextEncoder().encode(`${id}.${ts}.${rawBody}`);
  const macBuf = await crypto.subtle.sign('HMAC', key, signed);
  const expected = new Uint8Array(macBuf);

  for (const part of sigHeader.split(' ')) {
    const [version, value] = part.split(',');
    if (version !== 'v1' || !value) continue;
    let given: Uint8Array;
    try { given = b64ToBytes(value); } catch { continue; }
    if (timingSafeEqual(expected, given)) return { ok: true };
  }
  return { ok: false, reason: 'signature mismatch' };
}

Deno.serve(async (req) => {
  const raw = await req.text();

  const secret = await getSigningSecret();
  if (!secret) {
    // Fail CLOSED. An unverifiable webhook that can suppress subscribers is worse than
    // a webhook that is temporarily down — a missing secret is a config error, not a
    // reason to trust the caller.
    console.error('resend-webhook: RESEND_WEBHOOK_SECRET is not set; rejecting request');
    return j({ error: 'webhook signing secret not configured' }, 500);
  }

  const verdict = await verifySvix(raw, req.headers, secret);
  if (!verdict.ok) {
    console.warn('resend-webhook: rejected unverified request:', verdict.reason);
    return j({ error: 'invalid signature' }, 401);
  }

  let p: any;
  try { p = JSON.parse(raw); } catch { return j({ error: 'bad json' }, 400); }

  const type = String(p?.type || '').replace('email.', '');
  const d = p?.data || {};
  const email = Array.isArray(d.to) ? d.to[0] : (d.to || d.email || null);
  const rid = d.email_id || d.id || null;
  const url = d?.click?.link || d?.link || null;
  const map: Record<string, string> = { delivered: 'delivered', opened: 'opened', clicked: 'clicked', bounced: 'bounced', complained: 'complained', delivery_delayed: 'deferred' };
  const t = map[type] || type || 'event';

  await sb.from('email_events').insert([{ email, type: t, url, resend_id: rid }]);

  if ((t === 'bounced' || t === 'complained') && email) {
    await sb.from('subscribers').update({ status: t === 'bounced' ? 'bounced' : 'complained' }).eq('email', email);
    await sb.from('sequence_subscriptions').update({ status: 'cancelled' }).eq('email', email).eq('status', 'active');
    await sb.from('email_sequence_enrollments').update({ status: 'cancelled' }).eq('email', email).eq('status', 'active');
  }

  return j({ ok: true, type: t });
});
