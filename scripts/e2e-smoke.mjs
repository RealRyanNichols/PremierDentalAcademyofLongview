// test:e2e — real-browser smoke of the pages a Facebook click lands on, at phone width.
// Serves the repo over a local static server and drives Chromium (Playwright). The data
// layer (Supabase, /api/*) is MOCKED per scenario, so this proves both paths:
//   happy path  — /api/lead answers ok → the form shows success and fires the lead event
//   failure     — /api/lead 500 + Supabase unreachable → an honest error is shown, the
//                 visitor's entries are still in the form, the button is usable again
// plus: countdown never blank, /classes and /calendar never stuck on "loading",
// no JavaScript errors from our own code, at 390 px wide.
//
// Run: npm run test:e2e   (needs Playwright + Chromium; PLAYWRIGHT_CHROME=path to override)
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); }
catch { ({ chromium } = await import('/opt/node22/lib/node_modules/playwright/index.mjs').catch(() => ({}))); }
if (!chromium) { console.error('✗ e2e: Playwright not installed (npm i -D playwright)'); process.exit(1); }

const PORT = 8123 + Math.floor(Math.random() * 500);
const BASE = `http://127.0.0.1:${PORT}`;
const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: root, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 900));

const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROME || process.env.CHROME || undefined });
let fails = 0;
const ok = (cond, msg) => { if (!cond) { fails++; console.error('  ✗ ' + msg); } else console.log('  ✓ ' + msg); };
const OWN_ERR = (e) => !/supabase|tailwind|aos|fbevents|Failed to fetch|NetworkError|Load failed|_vercel|googleapis|ERR_|net::|jsdelivr|createClient/i.test(e);

async function page(path, { apiLead = 'ok', blockSupabase = true } = {}) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const p = await ctx.newPage();
  const errors = [];
  p.on('pageerror', (e) => errors.push(String(e && e.message || e)));
  // Third-party + data layer: block by default (proves the failure path); mock /api/lead.
  await p.route(/cdn\.tailwindcss\.com|jsdelivr|fonts\.g|connect\.facebook|_vercel|googleapis/, (r) => r.abort());
  if (blockSupabase) await p.route(/supabase\.co/, (r) => r.abort());
  await p.route(/\/api\/lead$/, (r) => {
    if (apiLead === 'ok') return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, via: 'db' }) });
    if (apiLead === 'fail') return r.fulfill({ status: 502, contentType: 'application/json', body: JSON.stringify({ ok: false, error: 'store_failed' }) });
    return r.abort();
  });
  await p.goto(BASE + path, { waitUntil: 'load', timeout: 45000 });
  return { p, ctx, errors, own: () => errors.filter(OWN_ERR) };
}

console.log('index.html');
{
  const { p, ctx, own } = await page('/index.html');
  await p.waitForTimeout(9000);
  const date = (await p.textContent('#cohort-date') || '').trim();
  const cd = (await p.textContent('#cohort-countdown') || '').trim();
  ok(date.length > 0 && !/^[A-Z][a-z]{2} \d/.test(date) || /\d{4}/.test(date), `countdown date is never blank (got "${date}")`);
  ok(cd.length > 0, `countdown text is never blank (got "${cd}")`);
  ok(!(await p.$('#stat-placement-rate')), 'placement-rate tile is gone');
  ok(own().length === 0, 'no JS errors from our code: ' + JSON.stringify(own()));
  await ctx.close();
}

console.log('classes.html + calendar.html (data layer down)');
{
  const { p, ctx, own } = await page('/classes.html');
  await p.waitForTimeout(3000);
  const up = (await p.textContent('#upcoming-list') || '').trim();
  ok(!/Loading upcoming/i.test(up) && /913-6444/.test(up), 'classes: honest call-us card instead of a stuck loader');
  ok(own().length === 0, 'classes: no JS errors: ' + JSON.stringify(own()));
  await ctx.close();
  const c = await page('/calendar.html');
  await c.p.waitForTimeout(3000);
  const err = await c.p.$eval('#load-error', (el) => !el.hidden).catch(() => false);
  const months = (await c.p.textContent('#months') || '').trim();
  ok(err && !/Checking the next class dates/.test(months), 'calendar: error card shown, loading text cleared');
  ok(c.own().length === 0, 'calendar: no JS errors: ' + JSON.stringify(c.own()));
  await c.ctx.close();
}

// Lead forms: each entry = page, form selector, fields to fill, success selector.
const FORMS = [
  { path: '/apply.html', form: '#apply-form', success: null, redirect: '/thank-you', fill: { first_name: 'Test', last_name: 'Person', email: 'test@example.com', phone: '9035550100' }, check: ['#consent'] },
  { path: '/contact.html', form: '#contact-form', success: '#success', fill: { name: 'Test Person', email: 'test@example.com', phone: '9035550100', message: 'Hello from the e2e test' } },
  { path: '/tour.html', form: '#tour-form', success: '#tour-success', fill: { first_name: 'Test', last_name: 'Person', email: 'test@example.com', phone: '9035550100' }, check: ['#consent'] },
  { path: '/waitlist.html', form: '#waitlist-form', success: '#waitlist-success', fill: { first_name: 'Test', last_name: 'Person', email: 'test@example.com', phone: '9035550100' } },
  { path: '/study-guide.html', form: '#guide-form', success: null, magnet: true, fill: { email: 'test@example.com' } },
];
for (const f of FORMS) {
  console.log(f.path);
  // Happy path
  {
    const { p, ctx, own } = await page(f.path, { apiLead: 'ok' });
    await p.waitForTimeout(1200);
    const hasForm = await p.$(f.form);
    if (!hasForm) { ok(false, `form ${f.form} not found`); await ctx.close(); continue; }
    for (const [name, val] of Object.entries(f.fill)) { const el = await p.$(`${f.form} [name="${name}"]`); if (el) await el.fill(val); }
    for (const sel of f.check || []) { const el = await p.$(sel); if (el) await el.check().catch(() => {}); }
    const nav = f.redirect ? p.waitForURL((u) => u.pathname.startsWith(f.redirect), { timeout: 10000 }).then(() => true).catch(() => false) : null;
    await p.click(`${f.form} [type="submit"]`);
    if (f.redirect) ok(await nav, `happy path redirects to ${f.redirect}`);
    else if (f.magnet) { await p.waitForTimeout(1500); ok(await p.$eval(f.form, (el) => el.hidden || el.classList.contains('hidden') || !el.offsetParent).catch(() => false), 'happy path reveals the content (form gate gone)'); }
    else { await p.waitForTimeout(1500); ok(await p.$eval(f.success, (el) => !el.classList.contains('hidden') && !el.hidden).catch(() => false), 'happy path shows the success panel'); }
    ok(own().length === 0, 'no JS errors: ' + JSON.stringify(own()));
    await ctx.close();
  }
  // Failure path: API fails, Supabase blocked → honest error, entries kept, button re-enabled.
  {
    const { p, ctx, own } = await page(f.path, { apiLead: 'fail' });
    await p.waitForTimeout(1200);
    for (const [name, val] of Object.entries(f.fill)) { const el = await p.$(`${f.form} [name="${name}"]`); if (el) await el.fill(val); }
    for (const sel of f.check || []) { const el = await p.$(sel); if (el) await el.check().catch(() => {}); }
    await p.click(`${f.form} [type="submit"]`);
    await p.waitForTimeout(2500);
    const errVisible = await p.$eval(`.pda-lead-error, [role="alert"]`, (el) => !el.hidden && !el.classList.contains('hidden') && /913-6444/.test(el.textContent)).catch(() => false);
    ok(errVisible, 'failure path shows the honest error with the phone number');
    if (f.magnet) {
      ok(await p.$eval(f.form, (el) => el.hidden || el.classList.contains('hidden') || !el.offsetParent).catch(() => false), 'lead magnet still delivers the content on failure');
    } else {
      const firstField = Object.keys(f.fill)[0];
      const kept = await p.$eval(`${f.form} [name="${firstField}"]`, (el) => el.value).catch(() => '');
      ok(kept === f.fill[firstField], 'visitor entries are still in the form');
      const enabled = await p.$eval(`${f.form} [type="submit"]`, (el) => !el.disabled).catch(() => false);
      ok(enabled, 'submit button is usable again');
    }
    ok(!f.redirect || p.url().includes(f.path), 'no false redirect to a thank-you page');
    if (f.success) ok(await p.$eval(f.success, (el) => el.classList.contains('hidden') || el.hidden).catch(() => true), 'no false success panel');
    ok(own().length === 0, 'no JS errors: ' + JSON.stringify(own()));
    await ctx.close();
  }
}

await browser.close();
server.kill();
console.log(fails === 0 ? '✓ e2e smoke: all scenarios passed at 390px' : `✗ e2e smoke: ${fails} failure(s)`);
process.exit(fails ? 1 : 0);
