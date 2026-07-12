// AI tutor for lessons. The student asks a question; Claude answers grounded in
// the lesson text + Texas RDA context. The browser logs the Q&A to tutor_questions
// (RLS: students insert their own), so this function only needs the Anthropic key.
// Env (set in Vercel): ANTHROPIC_API_KEY.  Optional: ANTHROPIC_MODEL.
async function getKey() {
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY;
  // Fallback: read from the app_secrets table (service role) so the key can be
  // added in one place without touching Vercel. Requires SUPABASE_SERVICE_ROLE_KEY.
  try {
    const svc = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const url = process.env.SUPABASE_URL || 'https://lmbsuwslsycukynzpzik.supabase.co';
    if (!svc) return null;
    const r = await fetch(url + '/rest/v1/app_secrets?key=eq.ANTHROPIC_API_KEY&select=value', {
      headers: { apikey: svc, Authorization: 'Bearer ' + svc },
    });
    const rows = await r.json().catch(() => []);
    return (Array.isArray(rows) && rows[0] && rows[0].value) ? rows[0].value : null;
  } catch { return null; }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const key = await getKey();
  if (!key) {
    res.status(200).json({ answer: "The Ask-a-question tutor isn't switched on yet. Please ask your instructor at the weekly Q&A, or text (903) 913-6444." });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  const question = (body && body.question ? String(body.question) : '').slice(0, 1000).trim();
  const lessonTitle = (body && body.lessonTitle ? String(body.lessonTitle) : 'this lesson').slice(0, 200);
  const lessonText = (body && body.lessonText ? String(body.lessonText) : '').slice(0, 4000);
  if (!question) { res.status(400).json({ error: 'Empty question' }); return; }

  const system =
    "You are a warm, encouraging tutor for Premier Dental Academy of Longview, a Texas Registered Dental Assistant (RDA) program. " +
    "Answer the student's question clearly and simply, around a high-school reading level, grounded in the lesson below and accurate Texas RDA practice. " +
    "Use short paragraphs and concrete examples. If the question is outside dental assisting, gently steer back. " +
    "If it's a clinical-judgment or medical question beyond an assistant's scope, say so and point them to their instructor. " +
    "Never invent Texas Board rules — if unsure, tell them to confirm at tsbde.texas.gov. Keep it under ~180 words.\n\n" +
    'LESSON: "' + lessonTitle + '"\n' + lessonText;

  try {
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
    });
    const data = await r.json().catch(() => ({}));
    const answer = data && data.content && data.content[0] && data.content[0].text
      ? data.content[0].text
      : "I couldn't answer that one just now — please ask your instructor.";
    res.status(200).json({ answer });
  } catch (e) {
    res.status(200).json({ answer: "I couldn't reach the tutor just now — please try again, or ask your instructor at the weekly Q&A." });
  }
}
