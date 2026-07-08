// check:pricing — fail the build if any live page contradicts the payment
// engine. site-facts.js is the single source for prices; the cohorts table is
// the single source for dates/seats. This tripwire catches hardcoded strays.
//
// Forbidden on PUBLIC pages (root/blog/tools/go/employers html + assets js):
//   - "$1,997" / "$2,120" / "$200 down"   → pre-July-1 pricing
//   - "$1,497"                            → HELD night-class offer (do not ship)
//   - "paid in full by graduation"        → dead policy (certificate-when-paid)
//   - old plan installments "$640/mo" or "$160/wk" phrasing
// Allowed exceptions: api/enroll.js + assets/pda-nav.js + index.html carry the
// intentional date-aware cutover values (numeric 1997 without "$1,997"), and
// docs/ + design-reference/ + marketing/ + db/ are not the live site.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const SCAN_DIRS = ['.', 'blog', 'tools', 'go', 'employers', 'skills-lab', 'assets'];
const SKIP = new Set(['assets/pda-nav.js']); // date-aware pre/post cutover literals

const FORBIDDEN = [
  [/\$1,997/, 'old in-person price $1,997'],
  [/\$2,120/, 'old plan total $2,120'],
  [/\$200 down/i, 'old down payment "$200 down"'],
  [/\$1,?497/, 'HELD night-class $1,497 offer — must not ship until a real checkout link exists'],
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

console.log(failures === 0
  ? '✓ pricing tripwire: no page contradicts the payment engine'
  : `✗ pricing tripwire: ${failures} contradiction(s) — fix before deploying`);
process.exit(failures ? 1 : 0);
