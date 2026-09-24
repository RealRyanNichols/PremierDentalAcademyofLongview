// check:edge-behavior — runs the REAL source of the lead-path edge functions under Node
// (TypeScript types stripped by Node itself) against a recording Supabase mock and a
// fetch mock. Fictional data only; nothing leaves the machine.
//
// It tests the deployable text (the file with its DRIFT-STATUS block removed, exactly what
// `check-edge-drift.mjs --body` prints), and it pins the protections that live fixes added,
// so a stale copy cannot quietly undo them:
//   quo-inbound-webhook — never looks a lead up without a real 10-digit number (the old
//     `ilike '%%'` bug), skips The LeadFlow Pro line, never creates a lead from an outbound
//     text, drops duplicate deliveries, rejects a bad secret; a completed call or an outbound
//     text moves a lead out of "new", a missed call does not, an enrolled lead is never moved.
//   lead-notify — sender + reply-to come from app_secrets (a hardcoded sender drew a Resend
//     403), both ?secret= and x-lead-secret work, attribution rows render escaped and only
//     when present, the Text button exists, Quo leads are skipped, a wrong secret sends nothing.
import { writeFileSync, mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { splitBlock } from './check-edge-drift.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
if (!process.features || !process.features.typescript) {
  console.log('check:edge-behavior — SKIPPED: this Node cannot strip TypeScript types (needs Node ≥ 22.18). Run it on a newer Node before any edge-function deploy.');
  process.exit(0);
}

let fails = 0, passes = 0;
const ok = (c, m) => { if (c) passes++; else { fails++; console.error('✗ ' + m); } };
const tmp = mkdtempSync(join(tmpdir(), 'pda-edge-'));
const quiet = { log: console.log, error: console.error };

function makeDb(seed) {
  const db = JSON.parse(JSON.stringify(seed));
  const log = [];
  function builder(table) {
    const st = { table, op: 'select', filters: [], fdesc: [], payload: null };
    const rows = () => (db[table] || []).filter((r) => st.filters.every((f) => f(r)));
    const exec = () => {
      log.push({ table: st.table, op: st.op, payload: st.payload, fdesc: st.fdesc });
      if (st.op === 'insert') {
        const k = st.table === 'communications' && st.payload?.metadata?.msg_id;
        if (k && (db.communications || []).some((r) => r.metadata?.msg_id === k)) return { data: null, error: { code: '23505', message: 'duplicate key' } };
        const row = { id: 'id-' + Math.random().toString(36).slice(2, 8), ...st.payload };
        (db[st.table] ||= []).push(row);
        return { data: st.one ? row : [row], error: null };
      }
      if (st.op === 'update') { const rs = rows(); rs.forEach((r) => Object.assign(r, st.payload)); return { data: rs, error: null }; }
      if (st.op === 'delete') { const rs = rows(); db[st.table] = (db[st.table] || []).filter((r) => !rs.includes(r)); return { data: rs, error: null }; }
      let rs = rows();
      if (st.order) rs = rs.slice().sort((a, b) => String(a[st.order]).localeCompare(String(b[st.order])));
      if (st.limit != null) rs = rs.slice(0, st.limit);
      return st.one ? { data: rs[0] || null, error: null } : { data: rs, error: null };
    };
    const b = {
      select() { return b; },
      insert(p) { st.op = 'insert'; st.payload = p; return b; },
      upsert(p) { st.op = 'insert'; st.payload = p; return b; },
      update(p) { st.op = 'update'; st.payload = p; return b; },
      delete() { st.op = 'delete'; return b; },
      eq(k, v) { st.filters.push((r) => r[k] === v); return b; },
      in(k, vs) { st.filters.push((r) => vs.includes(r[k])); return b; },
      is(k, v) { st.filters.push((r) => (r[k] ?? null) === v); return b; },
      ilike(k, pat) { st.fdesc.push(`ilike ${k} ${pat}`); const n = pat.replace(/%/g, '').toLowerCase(); st.filters.push((r) => String(r[k] || '').toLowerCase().includes(n)); return b; },
      filter(path, _op, v) { const key = path.split('->>')[1]; st.filters.push((r) => String(r.metadata?.[key]) === String(v)); return b; },
      order(k) { st.order = k; return b; },
      limit(n) { st.limit = n; return b; },
      single() { st.one = true; return Promise.resolve(exec()); },
      maybeSingle() { st.one = true; return Promise.resolve(exec()); },
      then(res, rej) { return Promise.resolve(exec()).then(res, rej); },
    };
    return b;
  }
  const client = {
    from: builder,
    rpc: async (name, args) => { log.push({ rpc: name, args }); return { data: { tied: true, created: true, lead_id: args.p_lead }, error: null }; },
    auth: { admin: { generateLink: async () => ({ data: { properties: { action_link: 'https://example.test/magic' } } }) } },
  };
  return { db, log, client };
}

async function load(slug, seed) {
  const mock = makeDb(seed);
  let handler = null;
  globalThis.Deno = { env: { get: (k) => ({ SUPABASE_URL: 'https://mock.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'mock-service' })[k] }, serve: (h) => { handler = h; } };
  globalThis.__pdaMock = { createClient: () => mock.client };
  const sent = [];
  globalThis.fetch = async (url, init) => { sent.push({ url: String(url), body: init?.body ? JSON.parse(init.body) : null }); return { ok: true, status: 200, json: async () => ({ id: 'mock' }), text: async () => '' }; };
  const src = splitBlock(readFileSync(join(root, 'supabase/functions', slug, 'index.ts'), 'utf8')).body
    .replace(/^import "jsr:[^"]+";\s*$/m, '')
    .replace(/^import \{ createClient \} from "npm:@supabase\/supabase-js@2";\s*$/m, 'const { createClient } = globalThis.__pdaMock;');
  const f = join(tmp, `${slug}-${Math.random().toString(36).slice(2)}.ts`);
  writeFileSync(f, src);
  await import(pathToFileURL(f).href);
  const call = async (url, body, headers = {}) => {
    console.log = () => {}; console.error = () => {};
    try {
      const r = await handler(new Request(url, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) }));
      return { status: r.status, json: await r.json() };
    } finally { console.log = quiet.log; console.error = quiet.error; }
  };
  return { ...mock, sent, call };
}
const stageWrites = (log) => log.filter((e) => e.table === 'leads' && e.op === 'update' && e.payload && 'pipeline_stage' in e.payload);

// ---------------- quo-inbound-webhook ----------------
{
  const Q = 'https://mock.supabase.co/functions/v1/quo-inbound-webhook?secret=pda-quo-2026';
  const PDA = '+19039136444', PN = 'PNhV3szhHa';
  const seed = () => ({
    leads: [
      { id: 'L-new', phone: '+19035550101', first_name: 'Testnew', pipeline_stage: 'new', created_at: '2026-01-01' },
      { id: 'L-enr', phone: '9035550102', first_name: 'Testenrolled', pipeline_stage: 'enrolled', created_at: '2026-01-02' },
    ],
    communications: [], admin_tasks: [], quo_webhook_events: [], app_secrets: [{ key: 'QUO_AUTOREPLY_ENABLED', value: 'off' }],
  });
  const stage = (t, id) => t.db.leads.find((l) => l.id === id).pipeline_stage;
  const call = (id, o) => ({ id: 'EV-' + id, type: 'call.completed', data: { object: { id: 'AC-' + id, phoneNumberId: PN, ...o } } });
  const text = (id, to, extra = {}) => ({ id: 'EV-' + id, type: 'message.delivered', data: { object: { id: 'MSG-' + id, direction: 'outgoing', from: PDA, to: [to], body: 'Hi from the office', phoneNumberId: PN, ...extra } } });

  let t = await load('quo-inbound-webhook', seed());
  await t.call(Q, call(1, { direction: 'outgoing', status: 'completed', from: PDA, to: '+19035550101' }));
  ok(stage(t, 'L-new') === 'contacted', 'quo: a completed outbound call with no summary moves the lead to contacted');

  t = await load('quo-inbound-webhook', seed());
  await t.call(Q, call(2, { direction: 'incoming', status: '', answeredAt: '2026-09-20T15:00:00Z', completedAt: '2026-09-20T15:03:00Z', from: '+19035550101', to: PDA }));
  ok(stage(t, 'L-new') === 'contacted', 'quo: an answered inbound call moves the lead to contacted');

  t = await load('quo-inbound-webhook', seed());
  await t.call(Q, call(3, { direction: 'incoming', status: 'missed', from: '+19035550101', to: PDA }));
  ok(stage(t, 'L-new') === 'new' && stageWrites(t.log).length === 0, 'quo: a missed call leaves the lead as new');

  t = await load('quo-inbound-webhook', seed());
  await t.call(Q, call(4, { direction: 'outgoing', status: 'completed', from: PDA, to: '+19035550102' }));
  ok(stage(t, 'L-enr') === 'enrolled', 'quo: a call never moves an enrolled lead');

  t = await load('quo-inbound-webhook', seed());
  let r = await t.call(Q, call(5, { direction: 'incoming', status: 'completed', from: '+19035550199', to: '+19035008898', phoneNumberId: 'PNotherLine' }));
  ok(r.json.skipped === 'not the PDA line' && t.db.leads.length === 2 && stageWrites(t.log).length === 0, 'quo: The LeadFlow Pro line is skipped, no lead touched');

  t = await load('quo-inbound-webhook', seed());
  await t.call(Q, { id: 'EV-6', type: 'call.summary.completed', data: { object: { callId: 'AC-6', summary: ['Caller asked about classes'] } } });
  ok(!t.log.some((e) => (e.fdesc || []).includes('ilike phone %%')), 'quo: a party-less summary never runs ilike %% (the 166-rows bug)');
  ok(stageWrites(t.log).length === 0, 'quo: a party-less summary changes no lead');

  t = await load('quo-inbound-webhook', seed());
  r = await t.call(Q, text(7, '+19035550101'));
  ok(r.json.logged === 'outbound sms' && stage(t, 'L-new') === 'contacted' && t.db.communications.length === 1, 'quo: an outbound text is logged once and moves a new lead to contacted');

  t = await load('quo-inbound-webhook', seed());
  await t.call(Q, text(8, '+19035550102'));
  ok(stageWrites(t.log).length === 0, 'quo: an outbound text to an enrolled lead writes no stage');

  t = await load('quo-inbound-webhook', seed());
  await t.call(Q, text(9, '+19035550177'));
  ok(t.db.leads.length === 2, 'quo: an outbound text never creates a lead');

  const s10 = seed(); s10.communications.push({ id: 'c0', channel: 'sms', metadata: { msg_id: 'MSG-10' } });
  t = await load('quo-inbound-webhook', s10);
  r = await t.call(Q, text(10, '+19035550101'));
  ok(r.json.skipped === 'already logged' && stageWrites(t.log).length === 0, 'quo: a duplicate text is skipped before any write');

  t = await load('quo-inbound-webhook', seed());
  r = await t.call(Q.replace('pda-quo-2026', 'wrong'), call(11, {}));
  ok(r.status === 403, 'quo: a bad secret is rejected');
}

// ---------------- lead-notify ----------------
{
  const U = 'https://mock.supabase.co/functions/v1/lead-notify';
  const HELLO = 'hello@premierdentalacademyoflongview.com';
  const secrets = [{ key: 'LEAD_NOTIFY_SECRET', value: 's3cret' }, { key: 'RESEND_API_KEY', value: 'mock-key' }, { key: 'EMAIL_FROM', value: 'PDA Test <sender@example.test>' }, { key: 'EMAIL_REPLY_TO', value: 'reply@example.test' }];
  const lead = { first_name: 'Testy', last_name: 'Lead', email: 'testy@example.test', phone: '9035550101', source: 'apply', interest_path: 'in_person', message: 'hi', created_at: '2026-09-22T00:00:00Z',
    utm: { utm_source: 'facebook', utm_medium: 'social', utm_campaign: 'fb_apply', first_touch: { utm_source: 'google', utm_campaign: 'brand', landing_path: '/' } }, landing_page: '/apply' };
  const alert = (t) => t.sent.find((s) => s.body?.to === HELLO);

  let t = await load('lead-notify', { app_secrets: secrets });
  let r = await t.call(U + '?secret=s3cret', { record: lead });
  const a = alert(t);
  ok(r.status === 200 && r.json.admin === true && !!a, 'lead-notify: ?secret= accepted, alert sent to hello@');
  ok(a && a.body.from === 'PDA Test <sender@example.test>' && a.body.reply_to === 'reply@example.test', 'lead-notify: sender and reply-to come from app_secrets');
  ok(a && a.body.html.includes('facebook / social / fb_apply') && a.body.html.includes('>Landing page<') && a.body.html.includes('google / brand / /'), 'lead-notify: campaign, landing page and first-visit rows render');
  ok(a && a.body.html.includes('href="sms:9035550101"') && a.body.html.includes('>Text</a>'), 'lead-notify: Text button present');

  t = await load('lead-notify', { app_secrets: secrets });
  r = await t.call(U, { record: lead }, { 'x-lead-secret': 's3cret' });
  ok(r.status === 200 && r.json.admin === true, 'lead-notify: x-lead-secret header accepted');

  t = await load('lead-notify', { app_secrets: secrets });
  const plain = { ...lead }; delete plain.utm; delete plain.landing_page;
  await t.call(U + '?secret=s3cret', { record: plain });
  ok(alert(t) && !alert(t).body.html.includes('>Campaign<') && !alert(t).body.html.includes('>Landing page<'), 'lead-notify: a lead without attribution renders no extra rows');

  t = await load('lead-notify', { app_secrets: secrets });
  await t.call(U + '?secret=s3cret', { record: { ...lead, utm: { utm_campaign: '<script>x</script>' } } });
  ok(alert(t) && !alert(t).body.html.includes('<script>') && alert(t).body.html.includes('&lt;script&gt;'), 'lead-notify: attribution values are escaped');

  t = await load('lead-notify', { app_secrets: secrets });
  r = await t.call(U + '?secret=wrong', { record: lead });
  ok(r.status === 401 && t.sent.length === 0, 'lead-notify: a wrong secret sends nothing');

  t = await load('lead-notify', { app_secrets: secrets });
  r = await t.call(U + '?secret=s3cret', { record: { ...lead, source: 'quo_sms' } });
  ok(r.json.skipped === 'quo notifies separately' && t.sent.length === 0, 'lead-notify: Quo leads are skipped');

  t = await load('lead-notify', { app_secrets: [{ key: 'LEAD_NOTIFY_SECRET', value: 's3cret' }, { key: 'RESEND_API_KEY', value: 'k' }] });
  await t.call(U + '?secret=s3cret', { record: lead });
  ok(alert(t) && alert(t).body.from === `Premier Dental Academy of Longview <${HELLO}>`, 'lead-notify: falls back to the verified root-domain sender');
  const srcText = readFileSync(join(root, 'supabase/functions/lead-notify/index.ts'), 'utf8');
  ok(!/updates\.premierdentalacademyoflongview\.com/.test(srcText), 'lead-notify: no updates.* sender (unverified at Resend → 403)');
}

rmSync(tmp, { recursive: true, force: true });
if (fails) { console.error(`check:edge-behavior — ${fails} failed, ${passes} passed`); process.exit(1); }
console.log(`check:edge-behavior — ${passes} checks passed (quo-inbound-webhook, lead-notify; fictional data)`);
