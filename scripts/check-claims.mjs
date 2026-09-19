// check:claims — fail the build if a RETIRED or UNAPPROVED claim reappears on a
// public page. The list of retired values lives in assets/site-facts.js (claims,
// testimonials, retired); this script adds a few exact phrasings that were found
// on live pages in the Sep 2026 conversion audit (docs/CONVERSION-AUDIT-2026-09-17.md).
//
// Why: Amanda's rule — never show graduate counts, placement rates, testimonials,
// salary/payback promises, superlatives (only/best/lowest/guaranteed), the old
// 1405 McCann address / 230-6444 phone, or "live video" online copy unless a dated,
// approved record backs it. A retired figure on one page makes every Facebook click
// that lands there a contradiction.
//
// Scope: public HTML + shared JS. Not scanned: docs/, marketing/, design-reference/,
// db/, admin/, templates/, scripts/, node_modules/, the trainers' fictional sample
// data (assets/pda-seed-patients.js), and site-facts.js itself (it lists the values).
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const SCAN_DIRS = ['.', 'blog', 'tools', 'go', 'employers', 'skills-lab', 'assets']; // directory/ = third-party dentist listings (their own addresses), not PDA claims
const SKIP_FILES = new Set(['assets/site-facts.js', 'assets/pda-seed-patients.js']);

(0, eval)(readFileSync(join(ROOT, 'assets/site-facts.js'), 'utf8'));
const F = globalThis.PDA_FACTS;
if (!F || !F.claims || !F.retired) { console.error('✗ check:claims — PDA_FACTS.claims / retired missing'); process.exit(1); }

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const FORBIDDEN = [];
// Guard: the register must still list these claims as unapproved. If Amanda approves
// one (status:"approved" + display), the matching pattern below stops being enforced.
const unapproved = (key) => !(F.claims[key] && F.claims[key].status === 'approved' && F.claims[key].display);
if (unapproved('placementRate'))   FORBIDDEN.push([/\b85%\+/, 'claims.placementRate retired value "85%+"']);
if (unapproved('graduateCount'))   FORBIDDEN.push([/\b40[06]\+ (graduates|grads|students)/i, 'claims.graduateCount retired value "406+"']);
if (unapproved('noExperiencePct')) FORBIDDEN.push([/\b70% of (our|PDA) students/i, 'claims.noExperiencePct retired value "70%"']);
if (unapproved('salaryPayback'))   FORBIDDEN.push(
  [/(tuition|investment|PDA|training) pays (for itself|back)/i, 'claims.salaryPayback retired payback promise'],
  [/pays for itself in \d/i, 'claims.salaryPayback retired payback promise'],
  [/\$36,000 – \$44,000/, 'claims.salaryPayback retired salary range'],
  [/\$42k\+/, 'claims.salaryPayback retired "$42k+"']);
if (unapproved('superlatives'))    FORBIDDEN.push(
  [/\b(the )?only RDA program/i, 'claims.superlatives retired "only RDA program"'],
  [/lowest tuition/i, 'claims.superlatives retired "lowest tuition"'],
  [/\b(PDA|Premier( Dental Academy)?|we)('s| is| are|'re) the best\b/i, 'claims.superlatives retired "we are the best"'],
  [/guaranteed (job|placement|hire|employment)/i, 'claims.superlatives retired "guaranteed job/placement"']);
if (unapproved('partnerOffices'))  FORBIDDEN.push([/\b17 partner/i, 'claims.partnerOffices typed count "17 partner"']);
if (unapproved('seatCap'))         FORBIDDEN.push([/8 seats each/i, 'claims.seatCap typed "8 seats each" — seats come from the cohorts table']);
// Retired testimonials (consent + approval date not on file). "Dr. Williams" alone is also a
// fictional provider in the trainers, so the employer quote is matched by its practice line.
FORBIDDEN.push([/Jasmine M\./, 'retired testimonial "Jasmine M."'], [/Aisha C\./, 'retired testimonial "Aisha C."'], [/Family Dental of Longview/, 'retired testimonial "Dr. Williams, Family Dental of Longview"']);
for (const a of F.retired.addresses || []) FORBIDDEN.push([new RegExp(esc(a), 'i'), `old address "${a}"`]);
for (const p of F.retired.phones || []) FORBIDDEN.push([new RegExp(esc(p)), `old phone "${p}"`]);
for (const s of F.retired.spellings || []) FORBIDDEN.push([new RegExp(esc(s), 'i'), `misspelling "${s}"`]);
// Exact phrasings found on live pages (Sep 2026 audit).
FORBIDDEN.push(
  [/interviewing in week 10/i, 'unverified interview-timing claim'],
  [/offers within 2 weeks/i, 'unverified offer-timing claim'],
  [/live video/i, 'online program is self-paced — never "live video"'],
  [/regular price price/i, 'copy typo "regular price price"'],
  [/paid off before class ends/i, 'dead plan policy "paid off before class ends"'],
  [/\b17 partner/i, 'unverified "17 partner offices" count'],
  [/onboarding (time )?in half/i, 'unverified employer testimonial claim'],
  [/8 seats each/i, 'typed seat cap — seats come from the cohorts table'],
  [/Texas TDLR/i, 'wrong regulator — RDA registration is TSBDE, not TDLR'],
);

// A hard-coded "Sep 29"-style date inside the homepage countdown is a stale-date bug.
const COUNTDOWN_LITERAL = /id="cohort-date"[^>]*>\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.? \d{1,2}/;

const seen = new Set();
let failures = 0;
for (const dir of SCAN_DIRS) {
  const abs = join(ROOT, dir);
  let entries; try { entries = readdirSync(abs); } catch { continue; }
  for (const name of entries) {
    const p = join(abs, name);
    if (statSync(p).isDirectory()) continue;
    if (!/\.(html|js)$/.test(name)) continue;
    const rel = relative(ROOT, p);
    if (SKIP_FILES.has(rel) || seen.has(rel)) continue;
    seen.add(rel);
    const text = readFileSync(p, 'utf8');
    for (const [re, why] of FORBIDDEN) {
      const m = re.exec(text);
      if (m) { console.error(`✗ ${rel} — ${why} (found "${m[0]}")`); failures++; }
    }
    if (rel === 'index.html' && COUNTDOWN_LITERAL.test(text)) { console.error('✗ index.html — countdown has a typed date; it must come from the cohorts table'); failures++; }
  }
}

console.log(failures === 0
  ? `✓ claims tripwire: ${seen.size} public files carry no retired or unapproved claim`
  : `✗ claims tripwire: ${failures} violation(s) — fix the copy or get the claim approved in site-facts.js`);
process.exit(failures ? 1 : 0);
