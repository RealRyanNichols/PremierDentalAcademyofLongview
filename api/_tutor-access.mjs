import { authUser, bearer, PUBLISHABLE_KEY, SUPABASE_URL } from './_common.mjs';

const first = (value) => Array.isArray(value) ? value[0] : value;

// Always use the verified caller's token, never the service role, for access checks.
async function callerRest(token, path, { query, method = 'GET', body } = {}) {
  const qs = query ? '?' + new URLSearchParams(query).toString() : '';
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}${qs}`, {
    method,
    headers: { apikey: PUBLISHABLE_KEY, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
    redirect: 'error',
  });
  if (!r.ok) throw new Error('Tutor access check unavailable');
  return r.json();
}

// Use existing course entitlements and the authoritative caller-scoped class gate.
// The lesson read enforces RLS; missing rows/fields/access checks fail closed.
export async function authorizedLesson(req, lessonId) {
  const token = bearer(req);
  const user = await authUser(token);
  if (!user?.id) return { status: 401 };
  try {
    const lesson = first(await callerRest(token, 'course_lessons', { query: {
      id: `eq.${lessonId}`, limit: '1',
      select: 'id,title,content_html,active,course_modules(courses(entitlement_flag,active))',
    } }));
    const course = first(first(lesson?.course_modules)?.courses);
    if (!lesson || String(lesson.id) !== lessonId || !course) return { status: 403 };
    const access = first(await callerRest(token, 'rpc/my_portal_access', { method: 'POST', body: {} }));
    if (!access) return { status: 403 };
    const profile = first(await callerRest(token, 'profiles', { query: {
      id: `eq.${user.id}`, select: 'career_vault,is_admin,is_instructor', limit: '1',
    } }));
    if (!profile) return { status: 403 };
    const admin = access.is_admin === true;
    // Suspended/pending members cannot use paid AI, including Career Vault.
    if (!admin && access.portal_status !== 'active') return { status: 403 };
    const entitled = admin || (course.entitlement_flag === 'career_vault' && profile.career_vault === true) ||
      (course.entitlement_flag === 'online_program' && access.enrolled === true);
    if (!entitled || (!admin && (lesson.active !== true || course.active !== true))) return { status: 403 };

    // Existing caller-scoped DB policy gate; excludes online/canceled cohorts.
    // Staff bypass this date lock, not the course entitlement/RLS checks above.
    if (!profile.is_admin && !profile.is_instructor) {
      const started = await callerRest(token, 'rpc/pda_class_started', { method: 'POST', body: {} });
      if (started !== true) return { status: 403 };
    }
    return { status: 200, userId: user.id, lesson };
  } catch {
    return { status: 503 };
  }
}

export const TUTOR_LIMITS = Object.freeze({ perMinute: 6, perUserConcurrent: 1, totalConcurrent: 20, retainedUsers: 5000 });
const budgets = new Map();
let totalInFlight = 0;

// Best effort, process-local, reset on restart; NOT a durable quota or billing cap.
// Only user IDs, counters and timestamps are retained, never question/lesson text.
export function takeTutorBudget(userId) {
  const now = Date.now();
  for (const [id, entry] of budgets) {
    if (!entry.inFlight && now - entry.windowStart >= 60_000) budgets.delete(id);
  }
  let entry = budgets.get(userId);
  if (!entry) {
    if (budgets.size >= TUTOR_LIMITS.retainedUsers) return { retryAfter: 60 };
    entry = { windowStart: now, count: 0, inFlight: 0 };
    budgets.set(userId, entry);
  }
  if (entry.inFlight >= TUTOR_LIMITS.perUserConcurrent || totalInFlight >= TUTOR_LIMITS.totalConcurrent) return { retryAfter: 1 };
  if (entry.count >= TUTOR_LIMITS.perMinute) return { retryAfter: Math.max(1, Math.ceil((60_000 - (now - entry.windowStart)) / 1000)) };
  entry.count++;
  entry.inFlight++;
  totalInFlight++;
  let released = false;
  return { release() {
    if (released) return;
    released = true;
    entry.inFlight--;
    totalInFlight--;
  } };
}
