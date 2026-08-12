// Office Hub static gates. Enforces the Deliverable-7 non-negotiables that can
// be checked without a browser or database:
//   1. every /hub/* app page is noindex,nofollow
//   2. robots.txt disallows /hub/ and sitemap.xml contains no /hub/ URLs
//      (public office-hub pages ARE in the sitemap)
//   3. NO pricing anywhere on hub surfaces (public or app) — dollar amounts fail
//   4. NO unverified-claim patterns on the public hub pages (counts/percent
//      stats, testimonials markers) and no dead schedule copy
//   5. "Premiere" misspelling never appears; contact facts match site-facts.js
//   6. HUB_DISPLAY_NAME stays in sync between hub-config.mjs and hub-app.js
//   7. every analytics event name used by hub pages is on the shared allowlist
//   8. seeds reference only fictional @example.com people
// Run: node scripts/check-hub.mjs   (part of npm test)
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');
let failures = 0;
const fail = (msg) => { console.error('✗ ' + msg); failures++; };
const ok = (msg) => console.log('✓ ' + msg);

const hubAppPages = readdirSync(join(root, 'hub')).filter((f) => f.endsWith('.html')).map((f) => 'hub/' + f);
const publicHubPages = ['office-hub.html', 'tools/onboarding-plan-generator.html', 'office-hub/tutorials.html',
  ...readdirSync(join(root, 'office-hub/tutorials')).filter((f) => f.endsWith('.html')).map((f) => 'office-hub/tutorials/' + f)];
const hubCode = ['assets/hub/hub-app.js', 'assets/hub/hub-config.mjs', 'assets/hub/plan-builder.mjs',
  'assets/hub/hub-events.mjs', 'api/hub/plan.js', 'api/hub/lead.js', 'api/hub/events.js', 'scripts/hub-seed.mjs'];

// 1. noindex on every app page
for (const p of hubAppPages) {
  if (!/<meta name="robots" content="noindex,nofollow"/.test(read(p))) fail(`${p}: missing noindex,nofollow meta`);
}
ok(`${hubAppPages.length} /hub app pages carry noindex,nofollow`);

// 2. robots + sitemap
if (!/Disallow: \/hub\//.test(read('robots.txt'))) fail('robots.txt: missing Disallow: /hub/');
const sitemap = read('sitemap.xml');
if (/premierdentalacademyoflongview\.com\/hub(\/|<)/.test(sitemap)) fail('sitemap.xml: contains a private /hub/ URL');
for (const u of ['/office-hub<', '/tools/onboarding-plan-generator<', '/office-hub/tutorials<']) {
  if (!sitemap.includes(u.replace('<', '</loc>').replace('</loc>', '') + '</loc>')) fail(`sitemap.xml: missing public hub page ${u.replace('<', '')}`);
}
ok('robots blocks /hub/; sitemap lists public pages only');

// 3. no pricing on any hub surface (public pages, app pages, hub code)
for (const p of [...hubAppPages, ...publicHubPages, ...hubCode]) {
  const matches = read(p).match(/\$\s?\d[\d,]*/g);
  if (matches) fail(`${p}: pricing-like text found (${matches.slice(0, 3).join(', ')}) — the hub shows no prices`);
}
ok('no dollar amounts anywhere on hub surfaces');

// 4. claim patterns + dead schedule copy on PUBLIC pages
const CLAIM_RE = /(\d+\s?%|\d+\+?\s+(graduates|students|offices|practices|partners|hires)\b|placement rate|hiring partners|weeks? saved)/i;
const DEAD_SCHEDULE_RE = /(5:30|Tue\/Thu|MWF|night class|evening class)/i;
for (const p of publicHubPages) {
  const h = read(p);
  const claim = h.match(CLAIM_RE);
  if (claim) fail(`${p}: unverified-claim pattern "${claim[0]}" — public hub pages ship with ZERO claims`);
  if (DEAD_SCHEDULE_RE.test(h)) fail(`${p}: dead schedule copy — never reuse old class-time strings`);
}
ok(`${publicHubPages.length} public hub pages carry zero claim patterns`);

// 5. spelling + contact facts parity with site-facts.js
const facts = read('assets/site-facts.js');
const phone = (facts.match(/display: "(\(\d{3}\) \d{3}-\d{4})"/) || [])[1];
const street = (facts.match(/street: "([^"]+)"/) || [])[1];
for (const p of [...hubAppPages, ...publicHubPages, ...hubCode, 'docs/hub/REPO-NOTES.md']) {
  if (/premiere dental/i.test(read(p))) fail(`${p}: "Premiere" misspelling`);
}
const cfg = read('assets/hub/hub-config.mjs');
if (phone && !cfg.includes(phone)) fail(`hub-config.mjs phone doesn't match site-facts.js (${phone})`);
if (street && !cfg.includes(street)) fail(`hub-config.mjs address doesn't match site-facts.js (${street})`);
ok('spelling clean; hub-config contact matches site-facts.js');

// 6. display-name parity (classic script mirrors the ESM constant)
const nameCfg = (cfg.match(/HUB_DISPLAY_NAME = '([^']+)'/) || [])[1];
const nameApp = (read('assets/hub/hub-app.js').match(/HUB_DISPLAY_NAME = '([^']+)'/) || [])[1];
if (!nameCfg || nameCfg !== nameApp) fail(`HUB_DISPLAY_NAME mismatch: hub-config="${nameCfg}" hub-app="${nameApp}"`);
else ok(`HUB_DISPLAY_NAME consistent ("${nameCfg}")`);

// 7. analytics event names used in pages ⊆ shared allowlist
const allow = new Set([...read('assets/hub/hub-events.mjs').matchAll(/'([a-z_]+)',/g)].map((m) => m[1]));
const used = new Set();
for (const p of [...hubAppPages, ...publicHubPages, 'api/hub/plan.js']) {
  for (const m of read(p).matchAll(/(?:track|HUB\.track)\('([a-z_]+)'/g)) used.add(m[1]);
  for (const m of read(p).matchAll(/event_name: '([a-z_]+)'/g)) used.add(m[1]);
}
for (const e of used) if (!allow.has(e)) fail(`event "${e}" fired but not in hub-events.mjs allowlist`);
ok(`${used.size} analytics event names all on the allowlist`);

// 8. fictional seeds only
const seed = read('scripts/hub-seed.mjs');
for (const m of seed.matchAll(/['"]([\w.+-]+@[\w.-]+)['"]/g)) {
  if (!m[1].endsWith('@example.com')) fail(`hub-seed.mjs: non-fictional email ${m[1]}`);
}
if (!/NODE_ENV === 'production'/.test(seed) || !/lmbsuwslsycukynzpzik/.test(seed)) {
  fail('hub-seed.mjs: production guards missing');
}
ok('seeds are fictional (@example.com) with production guards');

if (failures) { console.error(`\ncheck:hub FAILED (${failures})`); process.exit(1); }
console.log('\ncheck:hub passed');
