// translate-course — batch translator for the online RDA course into Mexican Spanish.
// 2026-08-11.
//
// Design notes:
//  * Everything it writes lands as status='draft'. RLS only lets students read
//    'published', so a machine draft can never reach a paying student. A human
//    promotes drafts to 'published' after review.
//  * Runs in small batches and is resumable: it skips lessons whose stored
//    source_hash still matches the English source, so re-running is cheap and
//    an edited English lesson is automatically re-queued.
//  * Auth: ?key= must match app_secrets.TRANSLATION_JOB_KEY.
//  * Model key: app_secrets.ANTHROPIC_API_KEY. Absent -> reports not-configured
//    and writes nothing.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const j = (o: unknown, s = 200) =>
  new Response(JSON.stringify(o, null, 2), { status: s, headers: { 'content-type': 'application/json' } });

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

async function sha256(s: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Terms that must not drift. Dental Spanish varies by country; East Texas is
// overwhelmingly Mexican-origin, so this is Mexican usage.
const GLOSSARY = `
dental assistant = asistente dental
Registered Dental Assistant (RDA) = Asistente Dental Registrado (RDA) — keep the English term and RDA in parentheses on first use
Texas State Board of Dental Examiners = Consejo Estatal de Examinadores Dentales de Texas (TSBDE)
chairside = al lado del sillón
operatory = operatorio
tray setup = preparación de la charola
suction / evacuator = succión / eyector
radiograph / x-ray = radiografía
sterilization = esterilización
autoclave = autoclave
infection control = control de infecciones
charting = registro clínico / odontograma
typodont = typodont (keep the English term)
sealant = sellador
prophy = profilaxis
impression = impresión
curing light = lámpara de fotocurado
high-volume evacuator (HVE) = eyector de alta succión (HVE)
PPE = equipo de protección personal (EPP)
scaling and root planing = raspado y alisado radicular
`;

const SYSTEM = `You are translating a dental assisting course from English into Spanish for adult students in East Texas, USA. The audience is overwhelmingly of Mexican origin.

Rules:
- Use Mexican Spanish. Use "usted", never "tú".
- Translate meaning, not word-for-word. It must read as though written by a Mexican dental educator, not translated.
- Preserve ALL HTML tags, attributes, structure and inline formatting exactly. Translate only human-readable text between tags, and translate alt/title attribute text.
- Never translate: brand names (Premier Dental Academy of Longview), phone numbers, addresses, URLs, email addresses, prices, or the credential abbreviations RDA, DANB, CDA, TSBDE, OSHA, CDC, BLS, CPR, NPDB, HVE, PPE.
- Keep clinical terminology precise. This is regulated healthcare education; an imprecise term is a safety problem, not a style problem.
- On first use of an English clinical term that Texas students will meet in an English-speaking office, give the Spanish then the English in parentheses. Students must be able to function in an English-speaking workplace.
- Do not add, remove, soften or embellish any claim. Never introduce a promise about jobs, wages, licensure or outcomes that is not in the source.
- Output ONLY the translated text. No preamble, no explanation, no code fences.

Glossary (use these exact renderings):
${GLOSSARY}`;

async function translate(apiKey: string, text: string, kind: string): Promise<string> {
  if (!text || !text.trim()) return text;
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: 16000,
      system: SYSTEM,
      messages: [{ role: 'user', content: `Translate this ${kind} into Mexican Spanish.\n\n${text}` }],
    }),
  });
  if (!res.ok) throw new Error(`anthropic ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const body = await res.json();
  const out = (body?.content ?? []).map((c: any) => c?.text ?? '').join('').trim();
  if (!out) throw new Error('empty translation');
  return out;
}

Deno.serve(async (req) => {
  const sb = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  );

  const { data: rows } = await sb.from('app_secrets').select('key,value')
    .in('key', ['ANTHROPIC_API_KEY', 'TRANSLATION_JOB_KEY', 'TRANSLATION_ENABLED']);
  const cfg: Record<string, string> = {};
  (rows || []).forEach((r: any) => (cfg[r.key] = r.value));

  const url = new URL(req.url);
  const provided = url.searchParams.get('key') || '';
  if (!cfg.TRANSLATION_JOB_KEY || !safeEqual(provided, cfg.TRANSLATION_JOB_KEY)) {
    return j({ error: 'unauthorized' }, 401);
  }

  const courseSlug = url.searchParams.get('course') || 'online-rda-12-week';
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '3', 10), 10);
  const moduleNum = url.searchParams.get('module');
  const dryRun = url.searchParams.get('dry') === '1';

  // Status probe: what is left to do?
  if (req.method === 'GET') {
    const { data: cov } = await sb.from('translation_coverage').select('*').eq('course_slug', courseSlug);
    return j({
      ok: true,
      configured: Boolean(cfg.ANTHROPIC_API_KEY),
      enabled: cfg.TRANSLATION_ENABLED === 'on',
      coverage: cov,
      note: 'POST with ?key=&limit=N to translate the next N lessons. Everything lands as draft.',
    });
  }

  if (cfg.TRANSLATION_ENABLED !== 'on') {
    return j({ ok: false, skipped: 'TRANSLATION_ENABLED is not "on"' });
  }
  if (!cfg.ANTHROPIC_API_KEY) {
    return j({ ok: false, skipped: 'no ANTHROPIC_API_KEY in app_secrets — nothing written' });
  }

  // Pull the course -> modules -> lessons, ordered so we translate in teaching order.
  const { data: course } = await sb.from('courses').select('id').eq('slug', courseSlug).maybeSingle();
  if (!course) return j({ error: 'course not found', courseSlug }, 404);

  let mq = sb.from('course_modules').select('id, module_number, sort').eq('course_id', course.id);
  if (moduleNum) mq = mq.eq('module_number', Number(moduleNum));
  const { data: modules } = await mq;
  const moduleIds = (modules || []).map((m: any) => m.id);
  if (!moduleIds.length) return j({ error: 'no modules', courseSlug });

  const { data: lessons } = await sb
    .from('course_lessons')
    .select('id, title, overview, content_html, quiz_json, sort, module_id')
    .in('module_id', moduleIds)
    .eq('active', true)
    .order('sort', { ascending: true });

  const { data: existing } = await sb
    .from('course_lesson_translations')
    .select('lesson_id, source_hash, status')
    .eq('locale', 'es');
  const seen = new Map((existing || []).map((r: any) => [r.lesson_id, r]));

  const done: any[] = [];
  const errors: any[] = [];

  for (const l of lessons || []) {
    if (done.length >= limit) break;
    const src = `${l.title || ''}\n${l.overview || ''}\n${l.content_html || ''}\n${JSON.stringify(l.quiz_json ?? null)}`;
    const hash = await sha256(src);
    const prev = seen.get(l.id);
    if (prev && prev.source_hash === hash) continue; // already current

    if (dryRun) { done.push({ lesson: l.title, would_translate: true }); continue; }

    try {
      const title = l.title ? await translate(cfg.ANTHROPIC_API_KEY, l.title, 'lesson title') : null;
      const overview = l.overview ? await translate(cfg.ANTHROPIC_API_KEY, l.overview, 'lesson overview') : null;
      const content = l.content_html ? await translate(cfg.ANTHROPIC_API_KEY, l.content_html, 'lesson body (HTML)') : null;

      let quiz = null;
      if (l.quiz_json) {
        const q = await translate(cfg.ANTHROPIC_API_KEY, JSON.stringify(l.quiz_json), 'quiz JSON — return valid JSON with the identical shape and keys, translating only the human-readable string values');
        try { quiz = JSON.parse(q); } catch { quiz = null; errors.push({ lesson: l.title, warn: 'quiz JSON did not parse; left untranslated' }); }
      }

      const { error } = await sb.from('course_lesson_translations').upsert({
        lesson_id: l.id, locale: 'es',
        title, overview, content_html: content, quiz_json: quiz,
        status: 'draft', source_hash: hash,
        translated_at: new Date().toISOString(),
        translated_by: 'translate-course/claude-sonnet-4-5',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'lesson_id,locale' });
      if (error) throw new Error(error.message);

      done.push({ lesson: l.title, chars: (l.content_html || '').length });
    } catch (e) {
      errors.push({ lesson: l.title, error: String(e).slice(0, 300) });
    }
  }

  const { data: cov } = await sb.from('translation_coverage').select('*').eq('course_slug', courseSlug);
  return j({ ok: true, translated: done.length, done, errors, coverage: cov, note: 'All rows written as draft — a human must review and set status=published before students see them.' });
});
