// AI tutor for lessons. The student asks a question; Claude answers grounded in
// the lesson text + Texas RDA context. The browser logs the Q&A to tutor_questions
// (RLS: students insert their own), so this function only needs the Anthropic key.
// Explicit operator opt-in: PDA_TUTOR_ENABLED=true. Restoring another credential
// must never implicitly activate billable AI. Optional: ANTHROPIC_API_KEY/MODEL.
import { serviceKey, SUPABASE_URL } from './_common.mjs';
import { authorizedLesson, takeTutorBudget } from './_tutor-access.mjs';

async function getKey() {
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY;
  // Fallback: read from the app_secrets table (service role) so the key can be
  // added in one place without touching Vercel. Requires SUPABASE_SERVICE_ROLE_KEY.
  try {
    const svc = serviceKey();
    const r = await fetch(SUPABASE_URL + '/rest/v1/app_secrets?key=eq.ANTHROPIC_API_KEY&select=value', {
      headers: { apikey: svc, Authorization: 'Bearer ' + svc },
      signal: AbortSignal.timeout(10_000),
      redirect: 'error',
    });
    if (!r.ok) return null;
    const rows = await r.json().catch(() => []);
    return (Array.isArray(rows) && rows[0] && rows[0].value) ? rows[0].value : null;
  } catch { return null; }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  if (process.env.PDA_TUTOR_ENABLED !== 'true') {
    res.status(503).json({ error: 'tutor_disabled', answer: "The Ask-a-question tutor isn't switched on yet. Please ask your instructor at the weekly Q&A, or text (903) 913-6444." });
    return;
  }
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  if (!body || typeof body !== 'object' || Array.isArray(body) || 'lessonText' in body || 'lessonTitle' in body) {
    res.status(400).json({ error: 'invalid_request' }); return;
  }
  const question = typeof body.question === 'string' ? body.question.trim() : '';
  const lessonId = String(body.lessonId ?? '');
  if (!question || question.length > 1000 || !/^[A-Za-z0-9_-]{1,80}$/.test(lessonId)) {
    res.status(400).json({ error: 'invalid_request' }); return;
  }
  const access = await authorizedLesson(req, lessonId);
  if (access.status !== 200) {
    res.status(access.status).json({ error: access.status === 401 ? 'sign_in_required' : access.status === 403 ? 'lesson_access_required' : 'access_unavailable' });
    return;
  }
  const budget = takeTutorBudget(access.userId);
  if (!budget.release) {
    res.setHeader('Retry-After', String(budget.retryAfter));
    res.status(429).json({ error: 'rate_limited' }); return;
  }
  // Context comes only from the authorized database lesson, not client claims.
  const lessonTitle = String(access.lesson.title || 'this lesson').slice(0, 200);
  const lessonText = String(access.lesson.content_html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 4000);

  const system =
    "You are a warm, encouraging tutor for Premier Dental Academy of Longview, a Texas Registered Dental Assistant (RDA) program. " +
    "Answer the student's question clearly and simply, around a high-school reading level, grounded in the lesson below and accurate Texas RDA practice. " +
    "Use short paragraphs and concrete examples. If the question is outside dental assisting, gently steer back. " +
    "If it's a clinical-judgment or medical question beyond an assistant's scope, say so and point them to their instructor. " +
    "Never invent Texas Board rules — if unsure, tell them to confirm at tsbde.texas.gov. Keep it under ~180 words.\n\n" +
    'LESSON: "' + lessonTitle + '"\n' + lessonText;

  try {
    // No secret lookup or billable provider call until auth, entitlement and budget.
    const key = await getKey();
    if (!key) {
      res.status(503).json({ error: 'tutor_unavailable', answer: "The Ask-a-question tutor isn't switched on yet. Please ask your instructor at the weekly Q&A, or text (903) 913-6444." });
      return;
    }
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5',
        max_tokens: 500,
        system,
        messages: [{ role: 'user', content: question }],
      }),
      signal: AbortSignal.timeout(20_000),
      redirect: 'error',
    });
    if (!r.ok) throw new Error('Tutor provider unavailable');
    const data = await r.json().catch(() => ({}));
    const answer = data?.content?.find((part) => typeof part.text === 'string' && part.text.trim())?.text;
    if (!answer) throw new Error('Tutor provider returned no answer');
    res.status(200).json({ answer });
  } catch (e) {
    res.status(503).json({ error: 'tutor_unavailable', answer: "I couldn't reach the tutor just now — please try again, or ask your instructor at the weekly Q&A." });
  } finally {
    budget.release();
  }
}
