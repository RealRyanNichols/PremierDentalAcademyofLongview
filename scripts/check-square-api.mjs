// check:square-api — drives the real droplet Square handlers with Square, Supabase (a small
// in-memory PostgREST + Auth stand-in) and Resend mocked. Fictional data only; nothing leaves
// this process. Covers:
//   /api/square-webhook  signature (raw body, stream, re-serialized, bad), self-test, tuition
//                        payment -> welcome + enrollment + purchase, duplicates and bursts,
//                        product/service purchases skipped, Square test events, no email /
//                        no account flags (once), invoices, errors -> 500 for Square to retry
//   /api/buy-product     validation, inactive product, no token, login system down (no
//                        charge), new vs existing login (the sign-in link is only returned
//                        for a new login), already owned,
//                        decline, lost connection, bundle, failed unlock -> warning + task
//   /api/buy-exam-pro    sign-in required, already Pro, pending marker, happy, decline, lost
//   assets/pda-pay.js    new route first, old function only on 404 / no connection
//   checkout pages       all six load pda-pay.js and never call the old functions directly
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync } from 'node:fs';
import { createHash, createHmac } from 'node:crypto';
import { Readable } from 'node:stream';
import { runInNewContext } from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SB = 'https://lmbsuwslsycukynzpzik.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_' + 'synthetic_test_only_'.repeat(2);
process.env.SQUARE_ACCESS_TOKEN = 'EAAA' + 'synthetic-test-token-'.repeat(3);
process.env.RESEND_API_KEY = 're_synthetic_test';
const HOOK_KEY = 'synthetic-signature-key-for-tests';
const HOOK_URL = 'https://www.premierdentalacademyoflongview.com/api/square-webhook';

let fails = 0;
let checks = 0;
const ok = (cond, msg) => { checks++; if (!cond) { fails++; console.error('✗ ' + msg); } };

// ---------------------------------------------------------------- world (fake services)
let W;
function freshWorld() {
  W = {
    tables: {
      welcome_log: [], cohorts: [{ id: 'co-1', name: 'Test Cohort — In-Person (T/Th)', start_date: '2026-10-20', delivery_mode: 'in_person' }],
      leads: [], profiles: [], enrollments: [], purchases: [], admin_tasks: [], communications: [],
      products: [
        { key: 'study_pack', name: 'Test Study Pack', price_cents: 1900, active: true, entitlement_flag: 'study_pack', delivery: 'website_entitlement', storage_path: null },
        { key: 'online_program', name: 'PDA RDA Program — Online (12-Week)', price_cents: 99700, active: true, entitlement_flag: 'online_program', delivery: 'website_entitlement', storage_path: null },
        { key: 'exam_pro', name: 'Test Exam Pro', price_cents: 2900, active: true, entitlement_flag: 'exam_pro', delivery: 'website_entitlement', storage_path: null },
        { key: 'money_plan', name: 'Test Workbook', price_cents: 1900, active: false, entitlement_flag: 'money_plan', delivery: 'website_entitlement', storage_path: 'bucket/file.pdf' },
      ],
    },
    users: [],
    sessions: {},
    square: { payments: {}, customers: {}, orders: {}, invoices: {}, charges: [], chargeMode: 'ok' },
    resend: [],
    calls: [],
    failTable: null,
    grantFails: false,
  };
}

const resp = (status, obj) => ({ ok: status >= 200 && status < 300, status, text: async () => (obj == null ? '' : JSON.stringify(obj)), json: async () => obj });
const unq = (v) => (v.startsWith('"') && v.endsWith('"') ? v.slice(1, -1) : v);
function matchFilter(row, col, expr) {
  const [op, ...rest] = expr.split('.');
  const val = unq(rest.join('.'));
  const cell = row[col];
  if (op === 'eq') return String(cell) === val || (val === 'true' && cell === true) || (val === 'false' && cell === false);
  if (op === 'neq') return cell != null && String(cell) !== val;
  if (op === 'ilike') { const needle = val.replace(/^\*|\*$/g, '').toLowerCase(); return String(cell || '').toLowerCase().includes(needle); }
  throw new Error('unsupported filter ' + expr);
}
function rowsFor(table, params) {
  let rows = W.tables[table];
  for (const [k, v] of params) {
    if (['select', 'limit', 'order', 'on_conflict'].includes(k)) continue;
    if (k === 'or') {
      const parts = v.replace(/^\(|\)$/g, '').split(',');
      rows = rows.filter((r) => parts.some((p) => { const i = p.indexOf('.'); return matchFilter(r, p.slice(0, i), p.slice(i + 1)); }));
      continue;
    }
    rows = rows.filter((r) => matchFilter(r, k, v));
  }
  return rows;
}
function conflict(table, row) {
  if (table === 'welcome_log') return W.tables.welcome_log.some((r) => r.email === row.email);
  if (table === 'purchases') return row.external_payment_id != null && W.tables.purchases.some((r) => r.external_payment_id === row.external_payment_id);
  if (table === 'profiles') return W.tables.profiles.some((r) => r.id === row.id);
  return false;
}
let idSeq = 0;
function rest(u, method, headers, body) {
  const url = new URL(u);
  const table = url.pathname.replace('/rest/v1/', '');
  if (!W.tables[table]) return resp(404, { message: 'no table ' + table });
  if (W.failTable === table) return resp(500, { message: 'db down (test)' });
  const params = [...url.searchParams.entries()];
  const prefer = headers.Prefer || headers.prefer || '';
  if (method === 'GET') {
    let rows = rowsFor(table, params);
    const lim = url.searchParams.get('limit'); if (lim) rows = rows.slice(0, Number(lim));
    return resp(200, rows.map((r) => ({ ...r })));
  }
  if (method === 'POST') {
    const list = Array.isArray(body) ? body : [body];
    const out = [];
    for (const row of list) {
      if (conflict(table, row)) {
        if (/merge-duplicates/.test(prefer)) { Object.assign(W.tables[table].find((r) => (table === 'welcome_log' ? r.email === row.email : r.id === row.id)), row); continue; }
        if (/ignore-duplicates/.test(prefer)) continue;
        return resp(409, { code: '23505', message: 'duplicate key value violates unique constraint' });
      }
      const r = { id: row.id || `${table}-${++idSeq}`, created_at: new Date().toISOString(), ...row };
      W.tables[table].push(r); out.push(r);
    }
    return resp(201, /return=representation/.test(prefer) ? out : null);
  }
  if (method === 'PATCH') {
    if (table === 'profiles' && W.grantFails) return resp(200, []);
    const rows = rowsFor(table, params);
    rows.forEach((r) => Object.assign(r, body));
    return resp(200, /return=representation/.test(prefer) ? rows : null);
  }
  if (method === 'DELETE') {
    const rows = rowsFor(table, params);
    W.tables[table] = W.tables[table].filter((r) => !rows.includes(r));
    return resp(204, null);
  }
  return resp(405, {});
}
function auth(u, method, headers, body) {
  const url = new URL(u);
  const p = url.pathname.replace('/auth/v1', '');
  if (p === '/user') {
    const tok = String(headers.Authorization || '').replace(/^Bearer /, '');
    const uid = W.sessions[tok];
    return uid ? resp(200, W.users.find((x) => x.id === uid)) : resp(401, { message: 'bad token' });
  }
  if (W.authDown && p.startsWith('/admin/')) return resp(500, { msg: 'auth down (test)' });
  if (p === '/admin/users' && method === 'GET') return resp(200, { users: W.users.map((x) => ({ ...x })) });
  if (p === '/admin/users' && method === 'POST') {
    if (W.users.some((x) => x.email === body.email)) return resp(422, { msg: 'already registered' });
    const user = { id: 'user-' + (++idSeq), email: body.email, user_metadata: body.user_metadata };
    W.users.push(user);
    return resp(200, user);
  }
  if (p === '/admin/generate_link') {
    if (!W.users.some((x) => x.email === body.email)) return resp(404, { msg: 'User not found' });
    return resp(200, { action_link: `${SB}/auth/v1/verify?token=synthetic&type=magiclink`, email: body.email });
  }
  return resp(404, {});
}
function square(u, method, body) {
  const p = new URL(u).pathname.replace('/v2', '');
  const S = W.square;
  let m;
  if (p === '/payments' && method === 'POST') {
    S.charges.push(body);
    if (S.chargeMode === 'decline') return resp(402, { errors: [{ code: 'GENERIC_DECLINE', detail: 'Authorization error: GENERIC_DECLINE' }] });
    if (S.chargeMode === 'lost') throw new TypeError('fetch failed');
    const id = 'pay-' + (++idSeq);
    const pay = { id, status: 'COMPLETED', amount_money: body.amount_money, buyer_email_address: body.buyer_email_address, note: body.note, receipt_url: 'https://squareup.com/receipt/preview/' + id };
    S.payments[id] = pay;
    return resp(200, { payment: pay });
  }
  if ((m = p.match(/^\/payments\/(.+)$/))) return S.payments[m[1]] ? resp(200, { payment: S.payments[m[1]] }) : resp(404, { errors: [{ code: 'NOT_FOUND' }] });
  if ((m = p.match(/^\/customers\/(.+)$/))) return S.customers[m[1]] ? resp(200, { customer: S.customers[m[1]] }) : resp(404, { errors: [{ code: 'NOT_FOUND' }] });
  if ((m = p.match(/^\/orders\/(.+)$/))) return S.orders[m[1]] ? resp(200, { order: S.orders[m[1]] }) : resp(404, { errors: [{ code: 'NOT_FOUND' }] });
  if ((m = p.match(/^\/invoices\/(.+)$/))) return S.invoices[decodeURIComponent(m[1])] ? resp(200, { invoice: S.invoices[decodeURIComponent(m[1])] }) : resp(404, { errors: [{ code: 'NOT_FOUND' }] });
  return resp(404, { errors: [{ code: 'NOT_FOUND', detail: 'unmocked ' + p }] });
}
globalThis.fetch = async (url, opts = {}) => {
  const u = String(url);
  const method = opts.method || 'GET';
  const headers = opts.headers || {};
  let body = null;
  if (opts.body) { try { body = JSON.parse(opts.body); } catch { body = opts.body; } }
  W.calls.push({ u, method, body });
  await new Promise((r) => setTimeout(r, 1)); // let concurrent requests interleave
  if (u.startsWith(SB + '/rest/v1/')) return rest(u, method, headers, body);
  if (u.startsWith(SB + '/auth/v1/')) return auth(u, method, headers, body);
  if (u.startsWith(SB + '/storage/v1/object/sign/')) return resp(200, { signedURL: '/object/sign/bucket/file.pdf?token=synthetic' });
  if (u.startsWith('https://connect.squareup.com/v2/')) return square(u, method, body);
  if (u === 'https://api.resend.com/emails') { W.resend.push(body); return resp(200, { id: 'email-' + W.resend.length }); }
  return resp(404, { message: 'unmocked ' + u });
};

// ---------------------------------------------------------------- helpers
function mkRes() { return { code: 0, body: null, headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(c) { this.code = c; return this; }, json(o) { this.body = o; return this; }, end() { return this; } }; }
const sign = (raw, key = HOOK_KEY, url = HOOK_URL) => createHmac('sha256', key).update(url + raw).digest('base64');
async function hook(evt, { mode = 'rawBody', sig, raw } = {}) {
  const text = raw || JSON.stringify(evt);
  const signature = sig || sign(text);
  let req;
  if (mode === 'stream') { req = Readable.from([Buffer.from(text)]); req.method = 'POST'; req.headers = { 'x-square-hmacsha256-signature': signature }; }
  else if (mode === 'parsed') req = { method: 'POST', headers: { 'x-square-hmacsha256-signature': signature }, body: JSON.parse(text) };
  else req = { method: 'POST', headers: { 'x-square-hmacsha256-signature': signature }, body: JSON.parse(text), rawBody: text };
  const res = mkRes();
  await webhook(req, res);
  return res;
}
const writes = (table) => W.calls.filter((c) => c.u.includes('/rest/v1/' + table) && c.method !== 'GET');
const payEvent = (id, eventId, type = 'payment.updated') => ({ merchant_id: 'SYNTH', type, event_id: eventId, created_at: '2026-09-28T18:00:00Z', data: { type: 'payment', id, object: { payment: { id, status: 'COMPLETED' } } } });

const { default: webhook, isNonTuition } = await import(join(root, 'api/square-webhook.js'));
const { default: buyProduct } = await import(join(root, 'api/buy-product.js'));
const { default: buyExamPro } = await import(join(root, 'api/buy-exam-pro.js'));

// ================================================================ /api/square-webhook
freshWorld();
delete process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;
let r = mkRes(); await webhook({ method: 'GET', headers: {} }, r);
ok(r.code === 200 && r.body.service === 'square-webhook' && r.body.configured === false, 'webhook GET answers and says not configured');
r = await hook(payEvent('x', 'e0'));
ok(r.code === 503, `no signature key -> 503 so Square retries (got ${r.code})`);
process.env.SQUARE_WEBHOOK_SIGNATURE_KEY = HOOK_KEY;

r = await hook(payEvent('x', 'e1'), { sig: sign('{"tampered":true}') });
ok(r.code === 401, 'wrong signature -> 401');
r = await hook(payEvent('x', 'e1'), { sig: sign(JSON.stringify(payEvent('x', 'e1')), 'another-key') });
ok(r.code === 401, 'signature made with another key -> 401');

const selfRaw = '{"type":"pda.self_test","event_id":"st-1","data":{"note":"self-test \\u2014 check \\/ path"}}';
r = await hook(null, { raw: selfRaw });
ok(r.code === 200 && r.body.selfTest && r.body.rawSource === 'rawBody', 'self-test verifies from req.rawBody');
r = await hook(null, { raw: selfRaw, mode: 'stream' });
ok(r.code === 200 && r.body.selfTest && r.body.rawSource === 'stream', 'self-test verifies from the unread request stream');
r = await hook(null, { raw: selfRaw, mode: 'parsed' });
ok(r.code === 401, 'escaped body with no raw copy cannot be verified (self-test exposes a server that drops the raw body)');
const plainSelf = '{"type":"pda.self_test","event_id":"st-2"}';
r = await hook(null, { raw: plainSelf, mode: 'parsed' });
ok(r.code === 200 && r.body.rawSource === 'reserialized', 'plain body verifies after re-serializing, and says so');

// Tuition payment: in-person deposit through /api/enroll.
freshWorld();
W.square.customers['cust-1'] = { note: 'Cohort: Test Cohort — In-Person (T/Th)', email_address: 'Student.One@Example.com', given_name: 'Sam', family_name: 'Student' };
W.square.payments['pay-A'] = { id: 'pay-A', status: 'COMPLETED', amount_money: { amount: 50000, currency: 'USD' }, buyer_email_address: 'student.one@example.com', customer_id: 'cust-1', order_id: 'ord-1', note: 'PDA RDA Program — In-Person — Down payment (Test Cohort — In-Person (T/Th))' };
W.tables.profiles.push({ id: 'prof-1', email: 'student.one@example.com', program: 'preview', portal_status: 'pending', online_program: false, first_name: 'Sam', last_name: 'Student' });
W.users.push({ id: 'prof-1', email: 'student.one@example.com' });
W.tables.leads.push({ id: 'lead-1', email: 'student.one@example.com', first_name: 'Sam', last_name: 'Student', phone: '903-555-0101', pipeline_stage: 'new', status: 'new', created_at: '2026-09-01' });
r = await hook(payEvent('pay-A', 'evt-1'));
ok(r.code === 200 && r.body.ok && r.body.welcome === 'sent' && r.body.enrolled === true, `tuition payment -> welcome sent + enrolled (got ${JSON.stringify(r.body)})`);
ok(!JSON.stringify(r.body).includes('@'), 'webhook response carries no email address');
const prof1 = W.tables.profiles[0];
ok(prof1.program === 'foundation' && prof1.portal_status === 'active' && prof1.enrolled_at, 'profile switched to in-person program and activated');
ok(W.tables.enrollments.length === 1 && W.tables.enrollments[0].cohort_id === 'co-1' && W.tables.enrollments[0].delivery === 'in_person', 'enrollment created in the right class');
ok(W.tables.purchases.length === 1 && W.tables.purchases[0].external_payment_id === 'pay-A' && W.tables.purchases[0].amount_cents === 50000, 'purchase recorded with the Square payment id');
ok(W.tables.leads[0].pipeline_stage === 'enrolled' && W.tables.leads[0].status === 'converted', 'lead marked enrolled');
ok(W.tables.welcome_log.length === 1, 'welcome claimed once');
const studentMail = W.resend.find((m) => m.to[0] === 'student.one@example.com');
ok(studentMail && /Sign in to my Student Hub/.test(studentMail.html) && /\/learn/.test(studentMail.html) && !/kajabi/i.test(studentMail.html), 'welcome email: sign-in button + /learn, no Kajabi');
ok(studentMail && studentMail.attachments && studentMail.attachments[0].path === 'https://www.premierdentalacademyoflongview.com/assets/docs/PDA-School-Supply-List.pdf', 'in-person welcome attaches the supply list from the site');
ok(studentMail && /October 20, 2026/.test(studentMail.html), 'welcome shows the class start date');
ok(W.resend.some((m) => m.to[0] === 'hello@premierdentalacademyoflongview.com'), 'hello@ notified');

let before = W.calls.length;
r = await hook(payEvent('pay-A', 'evt-1'));
ok(r.code === 200 && r.body.ignored === 'duplicate delivery' && W.calls.length === before, 'same event re-delivered -> no work');
r = await hook(payEvent('pay-A', 'evt-2'));
ok(r.code === 200 && r.body.ignored === 'already handled' && W.calls.length === before, 'later update for a handled payment -> no work');

// Burst: two different events for a new payment at the same time.
W.square.payments['pay-B'] = { ...W.square.payments['pay-A'], id: 'pay-B', amount_money: { amount: 60000, currency: 'USD' }, note: '' };
const [b1, b2] = await Promise.all([hook(payEvent('pay-B', 'evt-3')), hook(payEvent('pay-B', 'evt-4', 'payment.created'))]);
ok(b1.code === 200 && b2.code === 200, 'burst answered 200');
ok(W.tables.purchases.filter((p) => p.external_payment_id === 'pay-B').length === 1, 'burst -> exactly one purchase row');
ok(W.tables.enrollments.length === 1, 'burst -> no second enrollment');
ok(W.resend.filter((m) => m.to[0] === 'student.one@example.com').length === 1, 'second payment -> no second welcome');

// Website product + service purchases are not tuition.
ok(isNonTuition('Test Study Pack — website') && isNonTuition('Exam Pro (one-time $29) — someone') && isNonTuition('1-on-1 State Board Prep - Amanda - 60 min') && isNonTuition('', 'One Hour Tutoring Session'), 'product, Exam Pro and service notes are not tuition');
ok(!isNonTuition('PDA RDA Program — Online (12-Week) — website') && !isNonTuition('PDA RDA Program — In-Person — Paid in full') && !isNonTuition('') && !isNonTuition('RDA Tuition — Week 7 of 12'), 'RDA program, blank and tuition notes are tuition');
freshWorld();
W.square.payments['pay-S'] = { id: 'pay-S', status: 'COMPLETED', amount_money: { amount: 1900 }, buyer_email_address: 'buyer@example.com', note: 'Test Study Pack — website' };
W.tables.profiles.push({ id: 'prof-9', email: 'buyer@example.com', program: 'preview' });
r = await hook(payEvent('pay-S', 'evt-5'));
ok(r.code === 200 && r.body.ignored === 'not tuition', 'study pack purchase -> ignored as not tuition');
ok(!W.resend.length && !W.tables.enrollments.length && !W.tables.purchases.length && W.tables.profiles[0].program === 'preview', 'product buyer gets no welcome, enrollment, purchase row or program change');

// Square test event (sample id that doesn't exist).
before = W.calls.length;
r = await hook(payEvent('sample-payment-id', 'evt-6'));
ok(r.code === 200 && /test event/.test(r.body.ignored || '') && !writes('admin_tasks').length, 'Square test event -> ignored, no task');

// No email anywhere -> one admin task, even across repeated events.
W.square.payments['pay-N'] = { id: 'pay-N', status: 'COMPLETED', amount_money: { amount: 60000 }, note: '' };
r = await hook(payEvent('pay-N', 'evt-7'));
ok(r.code === 200 && r.body.flagged === true && W.tables.admin_tasks.length === 1 && /NO email/.test(W.tables.admin_tasks[0].title), 'payment with no email -> admin task');
ok(/Square ref: pay-N/.test(W.tables.admin_tasks[0].notes), 'task carries the Square reference');
const { default: webhook2 } = await import(join(root, 'api/square-webhook.js') + '?fresh=1');
const req2 = { method: 'POST', headers: { 'x-square-hmacsha256-signature': sign(JSON.stringify(payEvent('pay-N', 'evt-8'))) }, rawBody: JSON.stringify(payEvent('pay-N', 'evt-8')), body: payEvent('pay-N', 'evt-8') };
const res2 = mkRes(); await webhook2(req2, res2);
ok(res2.code === 200 && W.tables.admin_tasks.length === 1, 'restarted server + same payment -> still one task');

// Paid but no website account -> task.
W.square.payments['pay-P'] = { id: 'pay-P', status: 'COMPLETED', amount_money: { amount: 300000 }, buyer_email_address: 'new.person@example.com', note: 'PDA RDA Program — In-Person — Paid in full' };
r = await hook(payEvent('pay-P', 'evt-9'));
ok(r.code === 200 && W.tables.admin_tasks.some((t) => /NO website account/.test(t.title)), 'paid student without an account -> admin task');

// Payment not completed -> ignored.
W.square.payments['pay-Q'] = { id: 'pay-Q', status: 'APPROVED', amount_money: { amount: 50000 }, buyer_email_address: 'x@example.com' };
r = await hook(payEvent('pay-Q', 'evt-10'));
ok(r.code === 200 && r.body.ignored === 'payment not completed', 'not completed -> ignored');

// Online program bought on the website -> online path.
W.square.payments['pay-O'] = { id: 'pay-O', status: 'COMPLETED', amount_money: { amount: 99700 }, buyer_email_address: 'online@example.com', note: 'PDA RDA Program — Online (12-Week) — website' };
W.tables.profiles.push({ id: 'prof-O', email: 'online@example.com', program: null, online_program: false });
W.users.push({ id: 'prof-O', email: 'online@example.com' });
r = await hook(payEvent('pay-O', 'evt-11'));
const po = W.tables.profiles.find((p) => p.id === 'prof-O');
ok(r.code === 200 && r.body.path === 'online' && po.program === 'career_track' && po.online_program === true, 'online program -> online path + access');
const onlineMail = W.resend.find((m) => m.to[0] === 'online@example.com');
ok(onlineMail && !onlineMail.attachments, 'online welcome has no supply list');

// Invoice installment paid -> handled, no purchase from the invoice event itself.
W.square.invoices['inv:0-synthetic'] = { id: 'inv:0-synthetic', status: 'PARTIALLY_PAID', primary_recipient: { email_address: 'online@example.com', customer_id: '' }, title: 'RDA Tuition — Week 7 of 12', payment_requests: [{ total_completed_amount_money: { amount: 25000 } }] };
const purchasesBefore = W.tables.purchases.length;
r = await hook({ type: 'invoice.payment_made', event_id: 'evt-12', data: { object: { invoice: { id: 'inv:0-synthetic' } } } });
ok(r.code === 200 && r.body.ok && W.tables.purchases.length === purchasesBefore, 'invoice payment -> processed, purchase comes from its payment event');

// Database down -> 500 so Square retries.
W.square.payments['pay-D'] = { id: 'pay-D', status: 'COMPLETED', amount_money: { amount: 50000 }, buyer_email_address: 'online@example.com', note: 'PDA RDA Program — In-Person — Down payment' };
W.failTable = 'welcome_log';
r = await hook(payEvent('pay-D', 'evt-13'));
ok(r.code === 500, `database error -> 500 for a Square retry (got ${r.code})`);
W.failTable = null;
r = await hook(payEvent('pay-D', 'evt-14'));
ok(r.code === 200 && r.body.ok, 'retry after the database is back -> 200');

// ================================================================ /api/buy-product
async function buy(body, method = 'POST') { const res = mkRes(); await buyProduct({ method, headers: {}, body }, res); return res; }
freshWorld();
r = await buy({}, 'GET');
ok(r.code === 405, 'buy-product GET -> 405');
r = await buy({ product_key: 'study_pack', sourceId: 'cnon:1' });
ok(r.code === 400, 'no name/email -> 400');
r = await buy({ product_key: 'study_pack', sourceId: 'cnon:1', name: 'Casey Buyer', email: 'not-an-email' });
ok(r.code === 400 && /No charge/.test(r.body.error), 'bad email -> 400, no charge');
r = await buy({ product_key: 'money_plan', sourceId: 'cnon:1', name: 'Casey Buyer', email: 'buyer@example.com' });
ok(r.code === 404 && !W.square.charges.length, 'inactive product -> 404, no charge');
const tok = process.env.SQUARE_ACCESS_TOKEN; delete process.env.SQUARE_ACCESS_TOKEN;
r = await buy({ product_key: 'study_pack', sourceId: 'cnon:1', name: 'Casey Buyer', email: 'buyer@example.com' });
ok(r.code === 503 && /No charge/.test(r.body.error) && !W.square.charges.length, 'no Square token -> 503, no charge');
process.env.SQUARE_ACCESS_TOKEN = tok;

r = await buy({ product_key: 'study_pack', sourceId: 'cnon:new', name: 'Casey Buyer', email: 'New.Buyer@Example.com' });
const expectKey = createHash('sha256').update('buy::study_pack::new.buyer@example.com::cnon:new').digest('hex').slice(0, 45);
ok(r.code === 200 && r.body.ok && r.body.granted === true, `new buyer -> charged + unlocked (got ${JSON.stringify(r.body)})`);
ok(W.square.charges[0].idempotency_key === expectKey, 'idempotency key matches the old Supabase function exactly');
ok(W.square.charges[0].amount_money.amount === 1900 && W.square.charges[0].location_id === '2P2ZE3FJNEYTV', 'charges the product price at the school location');
ok(W.users.length === 1 && W.tables.profiles.some((p) => p.study_pack === true), 'login created and product unlocked');
const newPayId = Object.keys(W.square.payments)[0];
ok(W.tables.purchases.length === 1 && W.tables.purchases[0].external_payment_id === newPayId && W.tables.purchases[0].square_payment_id === newPayId, 'purchase recorded with the Square payment id');
ok(typeof r.body.magicLink === 'string' && r.body.magicLink.includes('/auth/v1/verify'), 'brand-new login -> one-tap sign-in link returned');
ok(W.resend.length === 1 && /You’re in!/.test(W.resend[0].html), 'access email sent');

W.square.charges = [];
W.tables.profiles.find((p) => p.email === 'new.buyer@example.com').study_pack = false; // pretend they don't own it yet
r = await buy({ product_key: 'study_pack', sourceId: 'cnon:second', name: 'Someone Else', email: 'new.buyer@example.com' });
ok(r.code === 200 && r.body.magicLink === null, 'existing login -> NO sign-in link in the response (it goes by email only)');

r = await buy({ product_key: 'study_pack', sourceId: 'cnon:third', name: 'Casey Buyer', email: 'new.buyer@example.com' });
ok(r.code === 200 && r.body.alreadyOwned === true && W.square.charges.length === 1, 'already owned -> no charge');

W.authDown = true;
r = await buy({ product_key: 'study_pack', sourceId: 'cnon:auth', name: 'Casey Buyer', email: 'auth.down@example.com' });
ok(r.code === 503 && /No charge was made/.test(r.body.error) && W.square.charges.length === 1, 'login system down -> 503 before any charge (fail closed)');
W.authDown = false;

W.square.chargeMode = 'decline';
r = await buy({ product_key: 'study_pack', sourceId: 'cnon:dec', name: 'Casey Buyer', email: 'decline@example.com' });
ok(r.code === 402 && /DECLINE/.test(r.body.error), 'declined card -> 402 with Square\'s reason');
W.square.chargeMode = 'lost';
r = await buy({ product_key: 'study_pack', sourceId: 'cnon:lost', name: 'Casey Buyer', email: 'lost@example.com' });
ok(r.code === 502 && r.body.uncertain === true && /don't pay again/i.test(r.body.error), 'lost connection to Square -> 502 "couldn\'t confirm", not "no charge"');
W.square.chargeMode = 'ok';

r = await buy({ product_key: 'online_program', sourceId: 'cnon:online', name: 'Olive Online', email: 'olive@example.com' });
const olive = W.tables.profiles.find((p) => p.email === 'olive@example.com');
ok(r.code === 200 && olive.online_program && olive.exam_pro && olive.study_pack && olive.exam_prep && r.body.bundle.length === 3, 'online program unlocks the exam-prep bundle');

W.grantFails = true;
r = await buy({ product_key: 'study_pack', sourceId: 'cnon:gf', name: 'Gina Grant', email: 'gina@example.com' });
ok(r.code === 200 && r.body.ok && /couldn't auto-unlock/.test(r.body.warning || '') && W.tables.admin_tasks.some((t) => /auto-unlock failed/.test(t.title)), 'failed unlock after charge -> 200 + warning + admin task');
W.grantFails = false;

// ================================================================ /api/buy-exam-pro
async function examPro(body, token) { const res = mkRes(); await buyExamPro({ method: 'POST', headers: token ? { authorization: 'Bearer ' + token } : {}, body }, res); return res; }
freshWorld();
W.users.push({ id: 'u-1', email: 'learner@example.com' });
W.sessions['sess-1'] = 'u-1';
W.tables.profiles.push({ id: 'u-1', email: 'learner@example.com', exam_pro: false, program: 'preview', is_admin: false });
r = await examPro({ sourceId: 'cnon:1' });
ok(r.code === 401, 'Exam Pro without sign-in -> 401');
r = await examPro({ sourceId: 'cnon:ep' }, 'sess-1');
const epKey = createHash('sha256').update('exam-pro::u-1::cnon:ep').digest('hex').slice(0, 45);
ok(r.code === 200 && r.body.granted === true && W.square.charges.length === 1 && W.square.charges[0].idempotency_key === epKey, 'signed-in Exam Pro -> charged with the old key recipe + unlocked');
ok(W.square.charges[0].amount_money.amount === 2900, 'price comes from the products table');
ok(W.tables.purchases.length === 1 && W.tables.purchases[0].status === 'completed' && W.tables.purchases[0].external_payment_id, 'pending marker finalized to completed');
r = await examPro({ sourceId: 'cnon:again' }, 'sess-1');
ok(r.code === 200 && r.body.alreadyPro && W.square.charges.length === 1, 'already Pro -> no second charge');

freshWorld();
W.users.push({ id: 'u-2', email: 'second@example.com' }); W.sessions['sess-2'] = 'u-2';
W.tables.profiles.push({ id: 'u-2', email: 'second@example.com', exam_pro: false, program: 'preview' });
W.tables.purchases.push({ id: 'p-pend', student_id: 'u-2', product_key: 'exam_pro', status: 'pending' });
r = await examPro({ sourceId: 'cnon:x' }, 'sess-2');
ok(r.code === 200 && r.body.alreadyPro && !W.square.charges.length && W.tables.admin_tasks.length === 1, 'pending marker -> reconcile, no charge, audit task');

freshWorld();
W.users.push({ id: 'u-3', email: 'third@example.com' }); W.sessions['sess-3'] = 'u-3';
W.tables.profiles.push({ id: 'u-3', email: 'third@example.com', exam_pro: false, program: 'preview' });
W.square.chargeMode = 'decline';
r = await examPro({ sourceId: 'cnon:d' }, 'sess-3');
ok(r.code === 402 && !W.tables.purchases.length, 'declined -> 402 and the pending marker is cleared');
W.square.chargeMode = 'lost';
r = await examPro({ sourceId: 'cnon:l' }, 'sess-3');
ok(r.code === 502 && W.tables.purchases.length === 1 && W.tables.purchases[0].status === 'pending', 'lost connection -> 502 and the marker stays (a retry cannot charge twice)');
W.square.chargeMode = 'ok';

// ================================================================ assets/pda-pay.js
const payJs = readFileSync(join(root, 'assets/pda-pay.js'), 'utf8');
async function payTry(primary) {
  const seenCalls = [];
  const ctx = { window: {}, fetch: async (u, init) => { seenCalls.push({ u, init }); if (String(u).startsWith('/api/')) { if (primary === 'down') throw new TypeError('offline'); return { status: primary, ok: primary === 200 }; } return { status: 200, ok: true }; } };
  runInNewContext(payJs, ctx);
  const out = await ctx.window.pdaPay('buy-product', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
  return { out, seenCalls };
}
let t = await payTry(200);
ok(t.seenCalls.length === 1 && t.seenCalls[0].u === '/api/buy-product' && t.out.status === 200, 'pdaPay uses the droplet API when it answers');
t = await payTry(402);
ok(t.seenCalls.length === 1 && t.out.status === 402, 'pdaPay does not fall back on a real answer (402)');
t = await payTry(404);
ok(t.seenCalls.length === 2 && t.seenCalls[1].u.endsWith('/functions/v1/buy-product') && t.seenCalls[1].init.headers.apikey, 'pdaPay falls back to the old function only on 404');
t = await payTry('down');
ok(t.seenCalls.length === 2 && t.seenCalls[1].u.endsWith('/functions/v1/buy-product'), 'pdaPay falls back when the request never reached a server');

// ================================================================ checkout pages
for (const page of ['enroll.html', 'exam-pro.html', 'exam-prep-course.html', 'study-pack.html', 'career-vault.html', 'career-plan.html']) {
  const html = readFileSync(join(root, page), 'utf8');
  ok(html.includes('<script src="/assets/pda-pay.js"></script>'), `${page} loads pda-pay.js`);
  ok(/pdaPay\(/.test(html), `${page} pays through pdaPay`);
  ok(!/functions\/v1\/buy-(product|exam-pro)/.test(html), `${page} never calls the old Supabase checkout directly`);
}

if (fails) { console.error(`check:square-api — ${fails} of ${checks} checks failed`); process.exit(1); }
console.log(`check:square-api ✓ ${checks} checks (webhook, buy-product, buy-exam-pro, pda-pay, pages)`);
