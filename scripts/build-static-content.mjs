// build:static — bake real content into the static HTML.
//
// WHY THIS EXISTS
// This site is static HTML on Vercel with no build step and no SSR, so several pages
// used to ship their content only after JavaScript ran. Googlebot and any no-JS visitor
// saw the pre-hydration state: "0 questions in the bank", "Loading…", "0 of 0". The
// content was real; it was invisible to search. Amanda's traffic comes mostly from
// Google, so that was the single most expensive bug on the site.
//
// This script is the static-site equivalent of server rendering: it reads the same data
// modules the browser reads and writes the resulting markup straight into the HTML,
// between marker comments. The browser still hydrates on top (personal progress, live
// Supabase counts) — but the meaningful content is in the initial HTML either way, and
// it cannot drift from the data because the generator is the only thing that writes it.
//
// Markers:  <!--PDA:GEN name-->  ...generated...  <!--/PDA:GEN name-->
// Anything between the markers is owned by this script and will be overwritten.
//
// Run:  npm run build:static          (rewrites in place)
//       npm run check:static          (verifies HTML matches the data; exits 1 on drift)
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CHECK = process.argv.includes("--check");

/* ── Load the skills-lab data module the same way the browser does ─────────── */
function loadSkillsLabData() {
  const sandbox = { window: {} };
  const src = readFileSync(join(root, "assets/skills-lab/data.js"), "utf8");
  new Function("window", src)(sandbox.window);
  return sandbox.window.SL_DATA;
}

/* ── Cohort snapshot (checked in, mirrors the Supabase `cohorts` table) ────── */
function loadCohorts() {
  const p = join(root, "data/cohorts.json");
  if (!existsSync(p)) return [];
  return JSON.parse(readFileSync(p, "utf8")).cohorts || [];
}

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const D = loadSkillsLabData();
const COHORTS = loadCohorts();

/* ── Derived, crawlable facts ─────────────────────────────────────────────── */
const bankSize = D.QUIZ_BANK.length;
const catCounts = D.QUIZ_CATEGORIES.map((c) => ({
  name: c,
  n: D.QUIZ_BANK.filter((q) => q.category === c).length,
})).sort((a, b) => b.n - a.n || a.name.localeCompare(b.name));
const diffCounts = D.QUIZ_DIFFICULTIES.map((d) => ({
  name: d,
  label: d.charAt(0).toUpperCase() + d.slice(1),
  n: D.QUIZ_BANK.filter((q) => q.difficulty === d).length,
})).filter((d) => d.n > 0);
const skillCount = D.COMPETENCIES.length;
const passportCount = D.PASSPORT_CATEGORIES.length;
const badgeCount = D.BADGES.length;

// Next cohort that has not started yet, from the checked-in snapshot. The countdown
// itself is time-relative so it stays a JS job, but the DATE is a durable fact and
// belongs in the HTML — that is what was going stale before.
const today = new Date().toISOString().slice(0, 10);
const nextCohort = COHORTS
  .filter((c) => c.start_date >= today && ["current", "upcoming", "open"].includes(c.status))
  .sort((a, b) => a.start_date.localeCompare(b.start_date))[0] || null;

const fmtDate = (iso) =>
  new Date(iso + "T12:00:00Z").toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric", timeZone: "UTC",
  });

/* ── Generated blocks ─────────────────────────────────────────────────────── */
const blocks = {
  // /skills-lab/quizzes — the flagship case. Was "0 questions in the bank".
  quizBankCount: () => String(bankSize),

  quizCategoryList: () =>
    catCounts
      .map(
        (c) =>
          `<li class="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 rounded-full px-3 py-1 text-xs font-semibold">` +
          `<a href="/skills-lab/quizzes?cat=${encodeURIComponent(c.name)}" class="hover:text-teal-700">${esc(c.name)}</a>` +
          `<span class="text-slate-500 font-normal">${c.n}</span></li>`
      )
      .join("\n        "),

  quizCategoryOptions: () =>
    [`<option value="__mixed__">Mixed practice (random)</option>`]
      .concat(catCounts.map((c) => `<option value="${esc(c.name)}">${esc(c.name)} (${c.n})</option>`))
      .join("\n          "),

  quizDifficultyOptions: () =>
    [`<option value="__all__">All levels</option>`]
      .concat(diffCounts.map((d) => `<option value="${esc(d.name)}">${esc(d.label)} (${d.n})</option>`))
      .join("\n          "),

  quizIntroSentence: () =>
    `${bankSize} practice questions across ${catCounts.length} categories — ` +
    catCounts.slice(0, 5).map((c) => esc(c.name)).join(", ") +
    `, and more. Unlimited retakes, and every question explains its answer.`,

  // /skills-lab hub
  skillsLabTotals: () => String(skillCount),
  skillsLabQuizTotal: () => String(bankSize),
  skillsLabPassportTotal: () => String(passportCount),
  skillsLabBadgeTotal: () => String(badgeCount),

  skillsLabIntro: () =>
    `${skillCount} chairside competencies, ${bankSize} practice questions across ` +
    `${catCounts.length} categories, ${passportCount} skill-passport areas, and ${badgeCount} badges to earn.`,

  // Homepage cohort banner — the date is a fact and ships in the HTML; only the
  // relative countdown is left to JS, so nothing can go stale in the source.
  cohortDate: () => (nextCohort ? fmtDate(nextCohort.start_date) : "— call (903) 913-6444"),

  cohortBannerText: () =>
    nextCohort
      ? `Next cohort starts <span id="cohort-date" class="underline decoration-amber-900/40">${fmtDate(nextCohort.start_date)}</span>`
      : `Call <a href="tel:+19039136444" class="underline">(903) 913-6444</a> for the next class date`,
};

/* ── Apply ────────────────────────────────────────────────────────────────── */
const TARGETS = [
  "skills-lab/quizzes.html",
  "skills-lab/index.html",
  "index.html",
  "tools/index.html",
  "tools/flashcards.html",
  "toolbox.html",
];

let changed = 0, drift = [], seen = new Set();

for (const rel of TARGETS) {
  const p = join(root, rel);
  if (!existsSync(p)) continue;
  const before = readFileSync(p, "utf8");
  let after = before;

  after = after.replace(
    /(<!--PDA:GEN ([a-zA-Z0-9_]+)-->)([\s\S]*?)(<!--\/PDA:GEN \2-->)/g,
    (full, open, name, body, close) => {
      seen.add(name);
      const fn = blocks[name];
      if (!fn) {
        drift.push(`${rel}: unknown generated block "${name}"`);
        return full;
      }
      return open + "\n        " + fn() + "\n        " + close;
    }
  );

  if (after !== before) {
    if (CHECK) drift.push(`${rel}: generated content is stale — run \`npm run build:static\``);
    else { writeFileSync(p, after); changed++; }
  }
}

const unused = Object.keys(blocks).filter((k) => !seen.has(k));

console.log(`Static content build: ${TARGETS.length} target page(s)`);
console.log(`  quiz bank ${bankSize} q · ${catCounts.length} categories · ${diffCounts.length} levels`);
console.log(`  next cohort: ${nextCohort ? nextCohort.start_date : "none scheduled"}`);
if (unused.length) console.log(`  (unreferenced blocks: ${unused.join(", ")})`);

if (drift.length) {
  drift.forEach((d) => console.error("  ✗ " + d));
  process.exit(1);
}
console.log(CHECK ? "✓ generated content is in sync with the data" : `✓ ${changed} file(s) written`);
