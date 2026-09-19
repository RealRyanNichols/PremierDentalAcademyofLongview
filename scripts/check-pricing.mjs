// check:pricing — fail the build if any live page contradicts the payment
// engine. site-facts.js is the single source for prices; the cohorts table is
// the single source for dates/seats. This tripwire catches hardcoded strays.
//
// Forbidden on PUBLIC pages (root/blog/tools/go/employers html + assets js):
//   - "$1,997" / "$2,120" / "$200 down"   → pre-July-1 pricing
//   - "paid in full by graduation"        → dead policy (certificate-when-paid)
//   - old plan installments "$640/mo" or "$160/wk" phrasing
// Allowed exceptions: api/enroll.js + assets/pda-nav.js + index.html carry the
// intentional date-aware cutover values (numeric 1997 without "$1,997"), and
// docs/ + design-reference/ + marketing/ + db/ are not the live site.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const SCAN_DIRS = ['.', 'blog', 'tools', 'go', 'employers', 'skills-lab', 'assets'];
// pda-nav.js: date-aware pre/post cutover literals. site-facts.js: it is the registry
// of RETIRED values (retired.prices) that check:claims scans other pages for.
const SKIP = new Set(['assets/pda-nav.js', 'assets/site-facts.js']);

const FORBIDDEN = [
  [/\$1,997/, 'old in-person price $1,997'],
  [/\$2,120/, 'old plan total $2,120'],
  [/\$200 down/i, 'old down payment "$200 down"'],
  [/paid in full by graduation/i, 'dead policy "paid in full by graduation"'],
  [/\$640\s*\/?\s*mo/i, 'old monthly installment $640/mo'],
  [/\$160\s*\/?\s*wk/i, 'old weekly installment $160/wk'],
];

let failures = 0;
for (const dir of SCAN_DIRS) {
  const abs = join(ROOT, dir);
  let entries;
  try { entries = readdirSync(abs); } catch { continue; }
  for (const name of entries) {
    const rel = dir === '.' ? name : `${dir}/${name}`;
    if (SKIP.has(rel)) continue;
    const p = join(abs, name);
    if (statSync(p).isDirectory()) continue;
    if (!/\.(html|js)$/.test(name)) continue;
    const text = readFileSync(p, 'utf8');
    for (const [re, why] of FORBIDDEN) {
      if (re.test(text)) { console.error(`✗ ${rel} — ${why}`); failures++; }
    }
  }
}

// ── Engine ↔ source-of-truth equality ────────────────────────────────────────
// assets/site-facts.js is the ONE place prices live. api/enroll.js (Square) and
// enroll.html (the buyer's preview) carry the same integers; if they drift the
// site would promise one number and charge another.
(0, eval)(readFileSync(join(ROOT, 'assets/site-facts.js'), 'utf8'));
const F = globalThis.PDA_FACTS;
const ip = F.pricing.inPerson, on = F.pricing.online;
const num = (src, re, label) => { const m = re.exec(src); if (!m) { console.error(`✗ could not find ${label}`); failures++; return NaN; } return Number(m[1]); };
const api = readFileSync(join(ROOT, 'api/enroll.js'), 'utf8');
const page = readFileSync(join(ROOT, 'enroll.html'), 'utf8');
const expect = (label, got, want) => { if (got !== want) { console.error(`✗ ${label}: ${got} ≠ site-facts ${want}`); failures++; } };
expect('api/enroll.js pifCents',       num(api, /NEW_IN_PERSON\s*=\s*\{[^}]*pifCents:\s*(\d+)/, 'NEW_IN_PERSON.pifCents'),       ip.totalCents);
expect('api/enroll.js planTotalCents', num(api, /NEW_IN_PERSON\s*=\s*\{[^}]*planTotalCents:\s*(\d+)/, 'NEW_IN_PERSON.planTotalCents'), ip.planTotalCents);
expect('api/enroll.js downCents',      num(api, /NEW_IN_PERSON\s*=\s*\{[^}]*downCents:\s*(\d+)/, 'NEW_IN_PERSON.downCents'),      ip.downCents);
expect('api/enroll.js balanceCents',   num(api, /NEW_IN_PERSON\s*=\s*\{[^}]*balanceCents:\s*(\d+)/, 'NEW_IN_PERSON.balanceCents'),   ip.balanceCents);
expect('api/enroll.js onlineCents',    num(api, /onlineCents\s*=\s*\(\)\s*=>\s*(\d+)/, 'onlineCents'),                          on.priceCents);
expect('enroll.html NEW.pif',          num(page, /NEW\s*=\s*\{[^}]*pif:\s*(\d+)/, 'NEW.pif'),             ip.totalCents);
expect('enroll.html NEW.planTotal',    num(page, /NEW\s*=\s*\{[^}]*planTotal:\s*(\d+)/, 'NEW.planTotal'), ip.planTotalCents);
expect('enroll.html NEW.down',         num(page, /NEW\s*=\s*\{[^}]*down:\s*(\d+)/, 'NEW.down'),           ip.downCents);
expect('enroll.html NEW.balance',      num(page, /NEW\s*=\s*\{[^}]*balance:\s*(\d+)/, 'NEW.balance'),     ip.balanceCents);
expect('enroll.html online total',     num(page, /'online':\s*\{[^}]*total:\s*(\d+)/, 'PLAN_DEFS.online.total'), on.priceCents);
// Internal arithmetic of the source itself.
if (ip.downCents + ip.balanceCents !== ip.planTotalCents) { console.error('✗ site-facts: down + balance ≠ planTotal'); failures++; }
if (ip.totalCents !== 300000 || ip.planTotalCents !== 350000 || ip.downCents !== 50000) { console.error('✗ site-facts: in-person prices are not $3,000 / $3,500 / $500 — an owner-approved price change must update this check too'); failures++; }
if (on.sale && on.priceCents !== on.saleCents) { console.error('✗ site-facts: online sale is on but priceCents ≠ saleCents'); failures++; }
if (!on.sale && on.priceCents !== on.regularCents) { console.error('✗ site-facts: online sale is off but priceCents ≠ regularCents'); failures++; }

// ── "$500 down" must never appear without the "$3,500" plan total nearby ─────
// The audit found pages saying "$500 down" next to "$3,000", which reads as
// $500 + $3,000 = $3,000. Public HTML at the root, /go and /tools must carry
// both numbers whenever the down payment is mentioned.
for (const dir of ['.', 'go', 'tools']) {
  const abs = join(ROOT, dir);
  let entries; try { entries = readdirSync(abs); } catch { continue; }
  for (const name of entries) {
    if (!/\.html$/.test(name)) continue;
    const p = join(abs, name);
    if (statSync(p).isDirectory()) continue;
    const rel = dir === '.' ? name : `${dir}/${name}`;
    const text = readFileSync(p, 'utf8');
    if (/\$500 (down|deposit|holds|reserves)/i.test(text) && !/\$3,500/.test(text)) {
      console.error(`✗ ${rel} — mentions "$500 down" but never states the $3,500 plan total`); failures++;
    }
  }
}

console.log(failures === 0
  ? '✓ pricing tripwire: no page contradicts the payment engine; engine = site-facts'
  : `✗ pricing tripwire: ${failures} contradiction(s) — fix before deploying`);
process.exit(failures ? 1 : 0);
