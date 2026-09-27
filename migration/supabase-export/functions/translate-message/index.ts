// translate-message — two-way translation for lead conversations, so language
// is never the reason someone gets held back. 2026-08-11.
//
// Two jobs:
//   detect  — given inbound text, work out the language, stamp the lead's
//             preferred_language, and return an English rendering for Amanda.
//   outbound— given Amanda's English reply and a target language, return the
//             translated text ready to send.
//
// IMPORTANT: this function NEVER sends anything. It returns text. Sending stays
// with the existing Quo/Resend paths that already have their own consent and
// approval checks, so nothing can go out to a real person from here.
//
// Auth: ?key= must match app_secrets.TRANSLATION_JOB_KEY.
// Model key: app_secrets.ANTHROPIC_API_KEY.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const j = (o: unknown, s = 200) =>
  new Response(JSON.stringify(o, null, 2), { status: s, headers: { 'content-type': 'application/json' } });

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

// Cheap pre-filter so obviously-English messages never cost a model call.
function looksSpanish(t: string) {
  const s = ' ' + t.toLowerCase() + ' ';
  if (/[áéíóúñ¿¡ü]/.test(s)) return true;
  const words = [' que ', ' para ', ' clases ', ' cuánto ', ' cuanto ', ' cuesta ', ' quiero ', ' hola ',
    ' gracias ', ' información ', ' informacion ', ' curso ', ' escuela ', ' trabajo ', ' puedo ',
    ' necesito ', ' cuándo ', ' cuando ', ' dónde ', ' donde ', ' precio ', ' pagos ', ' inglés ', ' ingles '];
  return words.filter((w) => s.includes(w)).length >= 2;
}

const OUTBOUND_SYSTEM = `You translate messages from a small dental assisting school in Longview, Texas, for prospective students. The audience is overwhelmingly of Mexican origin.

Rules:
- Mexican Spanish. Use "usted", never "tú". Warm, plain, direct — the way a local school owner talks, not corporate marketing.
- Never translate: Premier Dental Academy of Longview, phone numbers, addresses, URLs, prices, or RDA/TSBDE/DANB/CDA/BLS/CPR.
- Translate meaning, not word-for-word.
- CRITICAL: do not add, strengthen or soften any claim. Never introduce a promise about a job, a wage, a seat, funding, or licensure that is not in the source text. If the English hedges, the Spanish hedges identically.
- Output ONLY the translated message. No preamble, no notes, no quotes around it.`;

const INBOUND_SYSTEM = `You translate inbound messages from prospective dental assisting students into clear English for the school owner to read.

Rules:
- Translate faithfully, including tone and any urgency or worry.
- Do not answer the message, do not advise, do not editorialise.
- Preserve names, numbers, dates and place names exactly.
- Output ONLY the English translation.`;

async function ask(apiKey: string, system: string, user: string) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: 'claude-sonnet-4-5', max_tokens: 2000, system, messages: [{ role: 'user', content: user }] }),
  });
  if (!res.ok) throw new Error(`anthropic ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const b = await res.json();
  return (b?.content ?? []).map((c: any) => c?.text ?? '').join('').trim();
}

Deno.serve(async (req) => {
  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
  const { data: rows } = await sb.from('app_secrets').select('key,value')
    .in('key', ['ANTHROPIC_API_KEY', 'TRANSLATION_JOB_KEY']);
  const cfg: Record<string, string> = {};
  (rows || []).forEach((r: any) => (cfg[r.key] = r.value));

  const url = new URL(req.url);
  if (!cfg.TRANSLATION_JOB_KEY || !safeEqual(url.searchParams.get('key') || '', cfg.TRANSLATION_JOB_KEY)) {
    return j({ error: 'unauthorized' }, 401);
  }

  let body: any = {};
  try { body = await req.json(); } catch { /* GET / empty body is fine */ }
  const mode = String(body.mode || url.searchParams.get('mode') || 'detect');
  const text = String(body.text || '');
  const leadId = body.lead_id || null;

  if (!text.trim()) {
    return j({ ok: true, configured: Boolean(cfg.ANTHROPIC_API_KEY),
      usage: 'POST {mode:"detect"|"outbound", text, lead_id?, target?}' });
  }

  // ---- detect: inbound from a prospect ------------------------------------
  if (mode === 'detect') {
    const spanish = looksSpanish(text);
    const lang = spanish ? 'es' : 'en';

    if (leadId) {
      await sb.from('leads').update({ preferred_language: lang }).eq('id', leadId);
    }
    if (!spanish) return j({ ok: true, language: 'en', english: text, translated: false });
    if (!cfg.ANTHROPIC_API_KEY) {
      return j({ ok: true, language: 'es', translated: false,
        note: 'Spanish detected and flagged on the lead, but no ANTHROPIC_API_KEY is set so no translation was produced.' });
    }
    const english = await ask(cfg.ANTHROPIC_API_KEY, INBOUND_SYSTEM, text);
    return j({ ok: true, language: 'es', english, original: text, translated: true, lead_flagged: Boolean(leadId) });
  }

  // ---- outbound: Amanda's reply, ready to send ----------------------------
  if (mode === 'outbound') {
    const target = String(body.target || 'es');
    if (target === 'en') return j({ ok: true, target: 'en', text, translated: false });
    if (!cfg.ANTHROPIC_API_KEY) return j({ ok: false, error: 'no ANTHROPIC_API_KEY set' }, 200);
    const out = await ask(cfg.ANTHROPIC_API_KEY, OUTBOUND_SYSTEM, text);
    return j({ ok: true, target, text: out, original: text, translated: true,
      reminder: 'This function does not send. Pass the text to the existing Quo/Resend path, which enforces consent and approval.' });
  }

  return j({ error: 'unknown mode', mode }, 400);
});
