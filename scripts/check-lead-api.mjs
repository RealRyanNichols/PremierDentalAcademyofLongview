// check:lead-api — drives the real /api/lead handler with Supabase + Resend mocked.
// Proves the "a lead never silently vanishes" contract:
//   1. normal insert → 200 via db (row shaped: utm.submission_id, no unknown columns)
//   2. same submission_id again → 200 via duplicate, no second insert
//   3. insert fails + RESEND_API_KEY → 200 via email (Amanda still gets the lead)
//   4. insert fails + LEAD_NOTIFY_SECRET only → 200 via email through lead-notify
//   5. insert fails + no email path → 502 ok:false (browser shows the honest error)
//   6. honeypot → 200, nothing stored; 7. no contact → 400; 8. GET → 405
//   9. no service key → falls back to the public anon-key insert
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
let calls = [];
let mode = { insertOk: true, dupFound: false, resendOk: true, notifyOk: true };
globalThis.fetch = async (url, opts = {}) => {
  const u = String(url);
  const method = opts.method || 'GET';
  const headers = opts.headers || {};
  const body = opts.body ? JSON.parse(opts.body) : null;
  calls.push({ url: u, method, headers, body });
  const ok = (json, status = 200) => ({ ok: true, status, text: async () => JSON.stringify(json), json: async () => json });
  const bad = (status, msg) => ({ ok: false, status, text: async () => JSON.stringify({ message: msg }), json: async () => ({ message: msg }) });
  if (u.includes('/rest/v1/leads') && mode.authStatus) return bad(mode.authStatus, 'credential rejected (test)');
  if (u.includes('/rest/v1/leads') && method === 'GET') return ok(mode.dupFound ? [{ id: 'dup' }] : []);
  if (u.includes('/rest/v1/leads') && method === 'POST') return mode.insertOk ? ok([], 201) : bad(500, 'db down (test)');
  if (u.includes('api.resend.com')) return mode.resendOk ? ok({ id: 'email_1' }) : bad(500, 'resend down');
  if (u.includes('/functions/v1/lead-notify')) return mode.notifyOk ? ok({ ok: true }) : bad(500, 'fn down');
  return bad(404, 'unmocked ' + u);
};

const { default: handler, cleanLead } = await import(join(root, 'api/lead.js'));

let fails = 0, n = 0;
const ok = (cond, msg) => { if (!cond) { fails++; console.error('✗ ' + msg); } };
function mkRes() { return { code: 0, body: null, headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(c) { this.code = c; return this; }, json(o) { this.body = o; } }; }
async function call(body, { method = 'POST', ip } = {}) {
  n++;
  const req = { method, body, headers: { 'x-forwarded-for': ip || `10.0.0.${n}`, 'user-agent': 'check-lead-api' }, socket: {} };
  const res = mkRes();
  await handler(req, res);
  return res;
}
const LEAD = { first_name: 'Test', last_name: 'Lead', email: 'Test.Lead@Example.com', phone: '(903) 555-0100', interest_path: 'In-Person', message: 'hello', source: 'check-lead-api', utm: { utm_source: 'facebook', utm_campaign: 'fb_apply', submission_id: 'sub-1' }, landing_page: '/apply', bogus_column: 'x' };

// cleanLead
const c = cleanLead(LEAD);
ok(c.email === 'test.lead@example.com', 'email lower-cased');
ok(!('bogus_column' in c), 'unknown columns dropped');
ok(c.utm && c.utm.submission_id === 'sub-1', 'utm object kept');
ok(cleanLead({ email: 'not-an-email', phone: '12' }).email === undefined, 'invalid email dropped');
ok(cleanLead({ phone: '12' }).phone === undefined, 'too-short phone dropped');

// 1. normal insert with service key
const TEST_SERVICE_KEY = 'sb_secret_' + 'synthetic_test_only_'.repeat(2);
process.env.SUPABASE_SERVICE_ROLE_KEY = TEST_SERVICE_KEY; delete process.env.RESEND_API_KEY; delete process.env.LEAD_NOTIFY_SECRET;
calls = []; mode = { insertOk: true, dupFound: false, resendOk: true, notifyOk: true };
let r = await call({ lead: LEAD, submission_id: 'sub-1' });
ok(r.code === 200 && r.body.ok && r.body.via === 'db', `1: expected 200 via db, got ${r.code} ${JSON.stringify(r.body)}`);
const ins = calls.find((x) => x.url.includes('/rest/v1/leads') && x.method === 'POST');
ok(!!ins && ins.headers.apikey === TEST_SERVICE_KEY && r.body.persisted === true, '1: insert used the service key and reports database persistence');
ok(ins && ins.body.utm.submission_id === 'sub-1' && ins.body.utm.received_at && ins.body.landing_page === '/apply', '1: row carries submission_id, received_at, landing_page');
ok(ins && !('bogus_column' in ins.body), '1: unknown column not sent');
const dup = calls.find((x) => x.url.includes('/rest/v1/leads') && x.method === 'GET');
ok(!!dup && decodeURIComponent(dup.url).includes('utm->>submission_id=eq.sub-1'), '1: duplicate check queried by submission_id');

// 2. duplicate
calls = []; mode.dupFound = true;
r = await call({ lead: LEAD, submission_id: 'sub-1' });
ok(r.code === 200 && r.body.via === 'duplicate', `2: expected duplicate, got ${JSON.stringify(r.body)}`);
ok(!calls.some((x) => x.method === 'POST'), '2: no second insert');

// 3. insert fails + Resend
calls = []; mode = { insertOk: false, dupFound: false, resendOk: true, notifyOk: true }; process.env.RESEND_API_KEY = 're_test';
r = await call({ lead: LEAD, submission_id: 'sub-3' });
ok(r.code === 200 && r.body.via === 'email', `3: expected via email, got ${r.code} ${JSON.stringify(r.body)}`);
ok(r.body.persisted === false && r.body.delivery === 'email', '3: email-only receipt does not claim database persistence');
const mail = calls.find((x) => x.url.includes('api.resend.com'));
ok(!!mail && mail.body.to[0] === 'hello@premierdentalacademyoflongview.com' && /saved by email only/i.test(mail.body.subject), '3: Amanda emailed with the saved-by-email-only subject');
ok(mail && /fb_apply/.test(mail.body.html) && /\/apply/.test(mail.body.html), '3: email carries campaign + landing page');

// 4. insert fails + lead-notify secret only
calls = []; delete process.env.RESEND_API_KEY; process.env.LEAD_NOTIFY_SECRET = 'lns-test';
r = await call({ lead: LEAD, submission_id: 'sub-4' });
ok(r.code === 200 && r.body.via === 'email', `4: expected via email (lead-notify), got ${r.code}`);
const fn = calls.find((x) => x.url.includes('/functions/v1/lead-notify'));
ok(!!fn && fn.headers['x-lead-secret'] === 'lns-test' && /NOT SAVED TO DATABASE/.test(fn.body.record.message), '4: lead-notify called with the secret header and a not-saved flag');

// 5. everything fails
calls = []; delete process.env.LEAD_NOTIFY_SECRET;
r = await call({ lead: LEAD, submission_id: 'sub-5' });
ok(r.code === 502 && r.body.ok === false && /913-6444/.test(r.body.message), `5: expected honest 502, got ${r.code} ${JSON.stringify(r.body)}`);

// 6. honeypot
calls = []; mode.insertOk = true;
r = await call({ lead: LEAD, honeypot: 'Acme Inc' });
ok(r.code === 200 && r.body.via === 'honeypot' && calls.length === 0, '6: honeypot → 200, nothing stored');

// 7. no contact info
r = await call({ lead: { first_name: 'Nobody', source: 'x' } });
ok(r.code === 400 && r.body.error === 'contact_required', '7: no email/phone → 400');

// 8. GET
r = await call(null, { method: 'GET' });
ok(r.code === 405, '8: GET → 405');

// 9. no service key → anon insert
calls = []; delete process.env.SUPABASE_SERVICE_ROLE_KEY;
r = await call({ lead: LEAD, submission_id: 'sub-9' });
const anon = calls.find((x) => x.url.includes('/rest/v1/leads') && x.method === 'POST');
ok(r.code === 200 && r.body.via === 'db' && anon && anon.headers.apikey && anon.headers.apikey.startsWith('sb_publishable_'), '9: without a service key the public anon insert is used');
ok(!calls.some((x) => x.method === 'GET'), '9: duplicate check skipped without a service key');

// 10. rate limit
calls = []; let last;
for (let i = 0; i < 32; i++) last = await call({ lead: LEAD }, { ip: '203.0.113.9' });
ok(last.code === 429, '10: 31st submission from one IP in a minute → 429');

// 11. Malformed/expired/wrong-project/public credentials fail before any fetch.
const { serviceKey, SUPABASE_URL } = await import(join(root, 'api/_common.mjs'));
const jwt = (payload, header = { alg: 'HS256', typ: 'JWT' }, signature = Buffer.alloc(32, 1).toString('base64url')) =>
  [Buffer.from(JSON.stringify(header)).toString('base64url'), Buffer.from(JSON.stringify(payload)).toString('base64url'), signature].join('.');
const claims = { role: 'service_role', ref: new URL(SUPABASE_URL).hostname.split('.')[0], exp: Math.floor(Date.now() / 1000) + 3600 };
const badKeys = ['placeholder', ' ', 'sb_secret_short', 'sb_publishable_public', 'x'.repeat(4097), jwt({ ...claims, role: 'authenticated' }), jwt({ ...claims, exp: 1 }), jwt({ ...claims, ref: 'wrong-project' }), jwt(claims, { alg: 'none', typ: 'JWT' }), jwt(claims, undefined, 'bad')];
process.env.RESEND_API_KEY = 're_test';
for (const key of badKeys) {
  process.env.SUPABASE_SERVICE_ROLE_KEY = key;
  calls = [];
  r = await call({ lead: LEAD });
  ok(r.code === 503 && r.body.error === 'service_configuration_error' && r.body.persisted === false && calls.length === 0, '11: invalid configured key → explicit503 without DB/email requests');
  ok(!JSON.stringify(r.body).includes(key.trim()) || !key.trim(), '11: response does not contain the key');
}
process.env.SUPABASE_SERVICE_ROLE_KEY = jwt(claims);
ok(serviceKey() === process.env.SUPABASE_SERVICE_ROLE_KEY, '11: supported legacy service-role shape accepted, not cryptographically verified');

// 12. Revoked/auth-rejected credentials never become email-only success either.
process.env.SUPABASE_SERVICE_ROLE_KEY = TEST_SERVICE_KEY;
for (const authStatus of [401, 403]) {
  calls = []; mode = { authStatus };
  r = await call({ lead: LEAD, submission_id: 'rejected' });
  ok(r.code === 503 && r.body.error === 'service_configuration_error' && !calls.some(x => x.url.includes('resend')), '12: provider auth rejection during duplicate read fails closed without email');
  calls = [];
  r = await call({ lead: { email: 'synthetic@example.com' } });
  ok(r.code === 503 && calls.length === 1 && calls[0].method === 'POST', '12: provider auth rejection during insertion is explicit');
}

// 13. The real browser helper propagates email-only provenance without retries;
// config503 still takes its existing direct-REST path. No real DOM/network used.
let browserCalls = [], apiStatus = 200;
const browser = { PDA: { attribution: () => ({}) } };
const sandbox = {
  window: browser, document: { readyState: 'loading', addEventListener() {}, referrer: '' },
  location: { pathname: '/apply', search: '' }, localStorage: { getItem: () => null, setItem() {} },
  URLSearchParams, console, setTimeout, clearTimeout,
  fetch: async (url) => { browserCalls.push(String(url)); return { ok: !String(url).startsWith('/api') || apiStatus === 200, status: apiStatus, json: async () => ({ ok: apiStatus === 200, via: 'email', persisted: false, delivery: 'email' }) }; },
};
runInNewContext(readFileSync(join(root, 'assets/pda-lead.js'), 'utf8'), sandbox);
let br = await browser.PDALead.submit(LEAD);
ok(br.ok && br.via === 'email' && br.persisted === false && br.delivery === 'email' && browserCalls.length === 1, '13: email-only success retains explicit provenance and does not duplicate-submit');
browserCalls = []; apiStatus = 503;
br = await browser.PDALead.submit(LEAD);
ok(br.ok && br.via === 'db-direct' && br.persisted === true && browserCalls.length === 2, '13: configuration503 retains browser direct-database fallback');

console.log(fails === 0 ? '✓ lead API: DB/email provenance, browser fallback, credential failure, validation, rate limit' : `✗ lead API: ${fails} failure(s)`);
process.exit(fails ? 1 : 0);
