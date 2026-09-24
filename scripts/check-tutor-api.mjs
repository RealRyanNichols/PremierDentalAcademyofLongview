// Real handler, synthetic identities and fully intercepted fetch. No provider calls.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

process.env.SUPABASE_URL = 'https://pda-test.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-public-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_' + 'synthetic_only_'.repeat(3);
delete process.env.ANTHROPIC_API_KEY;
delete process.env.PDA_TUTOR_ENABLED;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
let fixture, calls = [], nextUser = 0, checks = 0, modelGate = null;
function reset(overrides = {}) {
  fixture = {
    userId: `synthetic-user-${++nextUser}`, authStatus: 200, started: true,
    access: { enrolled: true, is_admin: false, portal_status: 'active' },
    profile: { career_vault: false, is_admin: false, is_instructor: false },
    lesson: { id: 'lesson-1', title: 'Authorized lesson', content_html: '<p>Authorized lesson content.</p>', active: true, course_modules: { courses: { entitlement_flag: 'online_program', active: true } } },
    secret: true, providerStatus: 200, providerBody: { content: [{ type: 'text', text: 'Synthetic answer.' }] },
    ...overrides,
  };
  calls = [];
}
const response = (body, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => body, text: async () => JSON.stringify(body) });
globalThis.fetch = async (url, opts = {}) => {
  const u = new URL(url);
  calls.push({ url: u, opts });
  if (u.pathname === '/auth/v1/user') return response({ id: fixture.userId }, fixture.authStatus);
  if (u.pathname === '/rest/v1/course_lessons') return response(fixture.lesson ? [fixture.lesson] : []);
  if (u.pathname === '/rest/v1/rpc/my_portal_access') return response(fixture.access ? [fixture.access] : []);
  if (u.pathname === '/rest/v1/profiles') return response(fixture.profile ? [fixture.profile] : []);
  if (u.pathname === '/rest/v1/rpc/pda_class_started') return response(fixture.started);
  if (u.pathname === '/rest/v1/app_secrets') return response(fixture.secret ? [{ value: 'synthetic-model-key' }] : []);
  if (u.host === 'api.anthropic.com') {
    if (modelGate) await modelGate;
    return response(fixture.providerBody, fixture.providerStatus);
  }
  throw new Error('Unexpected mocked request');
};
const { default: handler } = await import('../api/tutor.js');
const { takeTutorBudget, TUTOR_LIMITS } = await import('../api/_tutor-access.mjs');
function res() { return { code: 0, body: null, headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(n) { this.code = n; return this; }, json(body) { this.body = body; } }; }
async function call({ token = 'synthetic-caller-token', body = { question: 'Explain this lesson.', lessonId: 'lesson-1' }, method = 'POST' } = {}) {
  const out = res();
  await handler({ method, headers: token ? { authorization: `Bearer ${token}` } : {}, body }, out);
  return out;
}
function check(condition, message) { assert.ok(condition, message); checks++; }
const modelCalls = () => calls.filter(c => c.url.host === 'api.anthropic.com');
const secretCalls = () => calls.filter(c => c.url.pathname.endsWith('/app_secrets'));
function noAI() { check(modelCalls().length === 0 && secretCalls().length === 0, 'denial must precede secret/model access'); }

reset();
process.env.ANTHROPIC_API_KEY = 'synthetic-direct-key';
let r = await call();
check(r.code === 503 && r.body.error === 'tutor_disabled' && calls.length === 0, 'restored/direct keys alone cannot activate tutor');
process.env.PDA_TUTOR_ENABLED = 'TRUE';
r = await call(); check(r.code === 503 && calls.length === 0, 'only exact operator opt-in enables tutor');
process.env.PDA_TUTOR_ENABLED = 'true'; delete process.env.ANTHROPIC_API_KEY;
reset(); r = await call({ method: 'GET' }); check(r.code === 405 && calls.length === 0, 'POST only');
reset(); r = await call({ token: null }); check(r.code === 401 && calls.length === 0, 'anonymous caller denied without requests');
reset({ authStatus: 401 }); r = await call(); check(r.code === 401 && calls.length === 1, 'invalid session denied'); noAI();
for (const body of [null, [], {}, { question: 'x'.repeat(1001), lessonId: 'lesson-1' }, { question: 'x', lessonId: 'a'.repeat(81) }, { question: 'x', lessonId: '1),id.gt.0' }, { question: 'x', lessonId: 'lesson-1', lessonText: 'Injected' }, { question: 'x', lessonId: 'lesson-1', lessonTitle: 'Injected' }]) {
  reset(); r = await call({ body }); check(r.code === 400 && calls.length === 0, 'bounded input and client lesson context rejected');
}
reset({ lesson: null }); r = await call(); check(r.code === 403, 'RLS-hidden lesson denied'); noAI();
reset(); fixture.lesson.id = 'different-lesson'; r = await call(); check(r.code === 403, 'exact lesson ID enforced'); noAI();
reset({ access: null }); r = await call(); check(r.code === 403, 'missing access row denied'); noAI();
reset({ profile: null }); r = await call(); check(r.code === 403, 'missing own profile denied'); noAI();
reset(); fixture.access.enrolled = false; r = await call(); check(r.code === 403, 'preview user denied online program'); noAI();
reset(); fixture.lesson.active = false; r = await call(); check(r.code === 403, 'inactive lesson denied non-admin'); noAI();
reset(); delete fixture.lesson.active; r = await call(); check(r.code === 403, 'missing active field denied non-admin'); noAI();
reset(); fixture.lesson.course_modules.courses.active = false; r = await call(); check(r.code === 403, 'inactive course denied non-admin'); noAI();
reset(); fixture.lesson.course_modules.courses.entitlement_flag = 'future_paid_tier'; r = await call(); check(r.code === 403, 'unknown future entitlement fails closed'); noAI();
reset({ started: false }); r = await call(); check(r.code === 403, 'authoritative class-date gate enforced'); noAI();
for (const portal_status of ['suspended', 'pending']) {
  reset(); fixture.access = { enrolled: false, is_admin: false, portal_status }; fixture.profile.career_vault = true;
  fixture.lesson.course_modules.courses.entitlement_flag = 'career_vault';
  r = await call(); check(r.code === 403, 'suspension/pending blocks paid tutor even with Career Vault flag'); noAI();
}
reset(); fixture.access.enrolled = false; fixture.profile.career_vault = true; fixture.lesson.course_modules.courses.entitlement_flag = 'career_vault';
r = await call(); check(r.code === 200 && modelCalls().length === 1, 'existing Career Vault-only access preserved when active');
reset({ started: false }); fixture.profile.is_instructor = true;
r = await call(); check(r.code === 200 && !calls.some(c => c.url.pathname.endsWith('pda_class_started')), 'existing staff date-lock exception preserved');
reset({ started: false }); fixture.profile.is_admin = true; fixture.access = { enrolled: false, is_admin: true, portal_status: 'suspended' };
r = await call(); check(r.code === 200, 'existing verified admin exception preserved');

reset(); r = await call();
check(r.code === 200 && r.headers['Cache-Control'] === 'no-store' && modelCalls().length === 1, 'authorized student request succeeds');
const accessCalls = calls.filter(c => c.url.pathname.startsWith('/rest/v1/') && !c.url.pathname.endsWith('/app_secrets'));
check(accessCalls.every(c => c.opts.headers.apikey === 'test-public-key' && c.opts.headers.Authorization === 'Bearer synthetic-caller-token'), 'every permission/lesson check uses caller RLS, never service key');
check(accessCalls.find(c => c.url.pathname.endsWith('/profiles')).url.searchParams.get('id') === `eq.${fixture.userId}`, 'profile check scoped to verified user');
check(JSON.parse(accessCalls.find(c => c.url.pathname.endsWith('pda_class_started')).opts.body) && accessCalls.find(c => c.url.pathname.endsWith('pda_class_started')).opts.body === '{}', 'class-start RPC accepts no caller-controlled identity');
check(secretCalls()[0].opts.headers.apikey === serviceKey && calls.indexOf(secretCalls()[0]) > calls.indexOf(accessCalls.at(-1)), 'secret lookup only after complete access checks');
const modelBody = JSON.parse(modelCalls()[0].opts.body);
check(modelBody.system.includes('Authorized lesson content.') && modelBody.max_tokens === 500, 'canonical lesson context and output cap');
check(calls.every(c => c.opts.signal), 'all auth/access/secret/model requests are time-bounded');
check(calls.every(c => c.opts.redirect === 'error'), 'credential-bearing tutor calls never follow redirects');

reset({ secret: false }); r = await call(); check(r.code === 503 && modelCalls().length === 0, 'missing model key fails unavailable without model call');
reset({ providerStatus: 429 }); r = await call(); check(r.code === 503, 'provider errors not reported as successful tutoring');
reset({ providerBody: { content: [] } }); r = await call(); check(r.code === 503, 'empty provider answer not reported as successful tutoring');
reset(); process.env.SUPABASE_SERVICE_ROLE_KEY = 'placeholder';
r = await call(); check(r.code === 503 && secretCalls().length === 0 && modelCalls().length === 0, 'malformed service credential fails before privileged secret lookup');
process.env.SUPABASE_SERVICE_ROLE_KEY = serviceKey;

reset({ userId: 'rate-limited-synthetic-user' });
for (let i = 0; i < TUTOR_LIMITS.perMinute; i++) { r = await call(); check(r.code === 200, 'bounded initial per-user budget allowed'); }
const spentSecrets = secretCalls().length, spentModels = modelCalls().length;
r = await call(); check(r.code === 429 && Number(r.headers['Retry-After']) > 0 && secretCalls().length === spentSecrets && modelCalls().length === spentModels, 'rate denial precedes secret/provider call');

reset({ userId: 'concurrent-synthetic-user' });
let unblock;
modelGate = new Promise(resolve => { unblock = resolve; });
const firstRequest = call();
for (let i = 0; i < 50 && !modelCalls().length; i++) await Promise.resolve();
check(modelCalls().length === 1, 'first request reached mocked provider');
r = await call(); check(r.code === 429 && secretCalls().length === 1 && modelCalls().length === 1, 'concurrent same-user request denied before secret/provider');
unblock(); await firstRequest; modelGate = null;
r = await call(); check(r.code === 200, 'finally releases concurrency budget');
const held = [];
for (let i = 0; i < TUTOR_LIMITS.totalConcurrent; i++) held.push(takeTutorBudget(`global-test-${i}`));
check(held.every(b => b.release) && !takeTutorBudget('global-test-overflow').release, 'process-wide model concurrency also bounded');
for (const b of held) { b.release(); b.release(); }
const released = takeTutorBudget('global-test-overflow'); check(Boolean(released.release), 'release is idempotent'); released.release();

// Execute the actual browser tutor renderer with a tiny DOM + mocked session/fetch.
const html = readFileSync(new URL('../learn.html', import.meta.url), 'utf8');
const renderSource = html.slice(html.indexOf('  function renderTutor('), html.indexOf('\n  // Saves progress', html.indexOf('  function renderTutor(')));
for (const status of [400, 401, 403, 429, 503, 200]) {
  const nodes = { '#tutor-q': { value: 'Question' }, '#tutor-ask': {}, '#tutor-a': { classList: { remove() {} } } };
  nodes['#tutor-q'].addEventListener = () => {};
  nodes['#tutor-q'].setAttribute = (key, value) => { nodes['#tutor-q'][key] = value; };
  const host = { querySelector: id => nodes[id] };
  let requested, inserted = 0;
  const sandbox = { sb: { auth: { getSession: async () => ({ data: { session: { access_token: 'synthetic-session-token' } } }) }, from: () => ({ insert: () => { inserted++; } }) }, uid: 'synthetic-user',
    fetch: async (url, opts) => { requested = { url, opts }; return { ok: status === 200, status, json: async () => ({ answer: 'Synthetic answer' }) }; },
  };
  runInNewContext(renderSource + '\nthis.renderTutor = renderTutor;', sandbox);
  sandbox.renderTutor(host, { id: 'lesson-1', title: 'Client title', content_html: 'Client text' });
  check(nodes['#tutor-q'].maxLength === 1000 && nodes['#tutor-q']['aria-label'], 'browser question input bounded and accessibly labeled');
  await nodes['#tutor-ask'].onclick();
  check(requested.opts.headers.Authorization === 'Bearer synthetic-session-token' && Object.keys(JSON.parse(requested.opts.body)).sort().join() === 'lessonId,question', 'browser sends session + lesson ID, no client lesson context');
  check(nodes['#tutor-ask'].disabled === false && Boolean(nodes['#tutor-a'].textContent), 'browser shows status and re-enables input');
  check(inserted === (status === 200 ? 1 : 0), 'browser does not record failed/denied tutor calls as answered');
}
console.log(`✓ tutor API: ${checks} synthetic assertions; disabled-by-default, auth/RLS, entitlement/date gates, budgets, browser errors; no real network`);
