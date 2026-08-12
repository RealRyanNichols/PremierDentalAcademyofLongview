// check:compliance — advertising-compliance tripwire, enforced by the build.
//
// PDA is a vocational school running Meta ads, so two rulebooks apply at once:
//   • Meta's advertising policy prohibits targeting or addressing people by personal
//     attributes ("race, ethnicity, color, national origin, religion, age, sex, sexual
//     orientation, gender identity, family status, disability, medical or genetic
//     condition"). Copy that says "single mom" or "Are you a young mother?" is the ad
//     account's problem even when it appears on the landing page.
//   • The FTC Vocational and Distance Education Rule, 16 CFR 254. §254.7(a) names
//     "Men/women wanted to train for…" as a caption to avoid; §254.4(e) forbids
//     unsubstantiated outcome claims; §254.7(b)–(c) and §254.4(c) require cost, refund
//     policy and completion requirements up front, and require distance education to be
//     clearly identified as such.
//
// Two scopes:
//   SITE-WIDE   — hard factual errors and obsolete contact details. These are wrong
//                 everywhere, so they fail everywhere.
//   NEW ROUTES  — the toolbox pages authored in this build. Superlatives and guarantee
//                 language are banned outright here. That is deliberately stricter than
//                 the rest of the site: this copy is new, so it can simply be written
//                 without them, and a strict rule is one nobody has to argue about later.
//
// Run: node scripts/check-compliance.mjs
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/* ── Which files are "new routes" (strict scope) ──────────────────────────── */
const NEW_ROUTES = [
  "toolbox.html",
  "tools/cost-of-training.html",
  "tools/hours-check.html",
  "tools/healthcare-careers.html",
  "tools/paying-for-training.html",
  "tools/finish-plan.html",
  "tools/rda-practice-exam.html",
  "tools/dental-bill-decoder.html",
  "tools/tooth-numbering.html",
  "tools/texas-rda-timeline.html",
  "skills-lab/abbreviation-drill.html",
  "skills-lab/instrument-id.html",
  "skills-lab/tray-setup.html",
];

/* ── Site-wide bans ────────────────────────────────────────────────────────
 * Only claims that are affirmatively FALSE no matter where they appear. The
 * "75% to pass" line is called out for replacement "anywhere it appears", so it is
 * enforced site-wide; the obsolete-contact strings are new-route-scoped (below),
 * because the third-party office directory legitimately lists other businesses whose
 * real address happens to be on McCann Rd. */
const SITEWIDE = [
  [/Most state exams require about 75% to pass/i,
    'the false "75% to pass" claim — DANB reports a scaled score (400 to pass, 100–900), not a percent'],
  [/\b(about|roughly|around|approximately)\s*75%\s*(is\s+)?(required\s+)?to\s+pass\b/i,
    'a "75% to pass" variant — DANB reports a scaled score, not a percent correct'],
  [/\b75%\s*(is\s+)?(required\s+)?to\s+pass\b/i,
    'a "75% to pass" variant — DANB reports a scaled score, not a percent correct'],
  [/\bPremiere\s+Dental\s+Academy\b/i, 'the misspelling "Premiere Dental Academy" (the school is "Premier")'],
];

/* ── New-route bans: obsolete PDA facts (§6). Scoped to pages this build owns. ── */
const OBSOLETE = [
  [/85%\+/, 'the unverified "85%+" outcome statistic'],
  [/\b406\+/, 'the unverified "406+" graduate count'],
  [/1405\s+McCann/i, 'the obsolete 1405 McCann Rd address'],
  [/\(903\)\s*230-6444/, 'the obsolete (903) 230-6444 phone number'],
];

/* ── New-route bans: identity framing (Meta + FTC 16 CFR 254.7(a)) ────────── */
const IDENTITY = [
  [/\bsingle\s+mom(s|my|mies)?\b/i, 'identity framing "single mom"'],
  [/\byoung\s+mother(s)?\b/i, 'identity framing "young mother"'],
  [/\byoung\s+wom[ae]n\b/i, 'identity framing "young women"'],
  [/\byoung\s+m[ae]n\b/i, 'identity framing "young men"'],
  [/\bfor\s+wom[ae]n\b/i, 'identity framing "for women"'],
  [/\bfor\s+moms\b/i, 'identity framing "for moms"'],
  [/\bwom[ae]n\s+wanted\b/i, 'FTC 254.7(a) prohibited caption "women wanted"'],
  [/\bm[ae]n\s+wanted\b/i, 'FTC 254.7(a) prohibited caption "men wanted"'],
  // "Are you a [personal characteristic]" — second-person attribute assertion.
  [/\bAre\s+you\s+an?\s+(single|young|older|divorced|unemployed|stay-at-home|teen|retired|disabled|pregnant|minority|immigrant)\b/i,
    'second-person personal-attribute assertion ("Are you a …")'],
];

/* ── New-route bans: superlatives and guarantees (FTC 254.4(e)) ───────────── */
const SUPERLATIVES = [
  [/\bguarantee[sd]?\b/i, '"guarantee" — an outcome promise a school cannot make'],
  [/\bonly\b/i, '"only" — reword; superlatives are banned on toolbox pages'],
  [/\bbest\b/i, '"best" — reword; superlatives are banned on toolbox pages'],
  [/\blowest\b/i, '"lowest" — reword; superlatives are banned on toolbox pages'],
];

/* ── New-route rule: outcome claims need a dated source on the same page ──── */
const OUTCOME_CLAIM = [
  /\b\d{1,3}(\.\d+)?%\s*(of\s+(our\s+)?(graduates|students)|placement|job\s+placement|graduation|hired|employed)/i,
  /\bplacement\s+rate\b/i,
  /\bgraduation\s+rate\b/i,
  /\bin[-\s]demand\b/i,
  /\bhigh\s+demand\b/i,
];
// A dated authoritative source rendered on the same page satisfies FTC 254.4(e).
const DATED_SOURCE =
  /(Bureau of Labor Statistics|\bBLS\b|\bDANB\b|\bTSBDE\b|Texas Workforce Commission|\bTWC\b|O\*NET|Source:)[\s\S]{0,200}?\b(19|20)\d{2}\b/i;

/* ── Walk ─────────────────────────────────────────────────────────────────── */
const SKIP_DIRS = [".git", "node_modules", "scripts", "assets", "db", "supabase", ".vercel",
  "marketing", "templates", "design-reference", "kajabi-weeks-7-12", "admin", "api", "docs", "data"];

function walk(dir) {
  let out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.includes(e.name)) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) out = out.concat(walk(p));
    else if (e.name.endsWith(".html")) out.push(p);
  }
  return out;
}

function visibleText(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

const files = walk(root);
let fail = 0;

for (const f of files) {
  const rel = f.replace(root + "/", "");
  const raw = readFileSync(f, "utf8");
  const text = visibleText(raw);
  const problems = [];

  for (const [re, why] of SITEWIDE) if (re.test(text) || re.test(raw)) problems.push(why);

  if (NEW_ROUTES.includes(rel)) {
    for (const [re, why] of IDENTITY) if (re.test(text)) problems.push(why);
    for (const [re, why] of SUPERLATIVES) if (re.test(text)) problems.push(why);
    for (const [re, why] of OBSOLETE) if (re.test(text) || re.test(raw)) problems.push(why);
    const claims = OUTCOME_CLAIM.filter((re) => re.test(text));
    if (claims.length && !DATED_SOURCE.test(text)) {
      problems.push(`outcome claim with no dated authoritative source on the page (FTC 16 CFR 254.4(e)) — matched ${claims[0]}`);
    }
  }

  if (problems.length) {
    console.error(`  ✗ ${rel}`);
    problems.forEach((p) => console.error(`      ${p}`));
    fail += problems.length;
  }
}

// Every new route that exists must also carry the required disclosures.
const missingDisclosure = [];
for (const rel of NEW_ROUTES) {
  const p = join(root, rel);
  if (!existsSync(p)) continue;
  const text = visibleText(readFileSync(p, "utf8"));
  const mentionsProgram = /\$3,000|\$3,500|\$397|enroll/i.test(text);
  if (!mentionsProgram) continue;
  // FTC 254.7(b)-(c): cost + refund/cancellation policy reachable before enrolling.
  if (!/\$3,000/.test(text)) missingDisclosure.push(`${rel}: quotes program pricing without the $3,000 total cost`);
  if (!/refund|cancel|Terms/i.test(text)) missingDisclosure.push(`${rel}: no refund/cancellation policy reference`);
}
missingDisclosure.forEach((m) => { console.error("  ✗ " + m); fail++; });

/* ── Advisory: pre-existing marketing claims elsewhere on the site ──────────
 * These do NOT fail the build — they are Amanda's existing marketing copy, outside the
 * scope of this build, and rewriting the homepage unasked is not this script's job.
 * They are surfaced because check-facts.mjs already flags both numbers as unverified,
 * and FTC 16 CFR 254.4(e) wants a dated substantiating source on the same page. */
const advisories = [];
for (const f of files) {
  const rel = f.replace(root + "/", "");
  if (NEW_ROUTES.includes(rel) || rel.startsWith("directory/")) continue;
  const text = visibleText(readFileSync(f, "utf8"));
  const hits = [];
  if (/85%\+/.test(text)) hits.push('"85%+" placement statistic');
  if (/\b406\+/.test(text)) hits.push('"406+" graduate count');
  if (hits.length) advisories.push(`${rel} — ${hits.join(", ")}`);
}
if (advisories.length) {
  console.log(`\n  ⚠ ${advisories.length} existing page(s) carry unverified outcome statistics (advisory, not blocking):`);
  advisories.forEach((a) => console.log("      " + a));
  console.log("      Both are flagged unverified in assets/site-facts.js. Either substantiate them");
  console.log("      with a dated source on the page or remove them — Amanda's call.\n");
}

console.log(`Compliance check: ${files.length} pages scanned (${NEW_ROUTES.filter((r) => existsSync(join(root, r))).length} under the strict new-route rules)`);
console.log(fail
  ? `✗ ${fail} compliance problem(s) — these block the build`
  : "✓ no identity framing, unsourced outcome claims, superlatives, or obsolete facts");
process.exit(fail ? 1 : 0);
