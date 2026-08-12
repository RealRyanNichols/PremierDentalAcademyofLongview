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

// Load any browser-global data module the same way a <script> tag would.
function loadGlobal(relPath, globalName) {
  const p = join(root, relPath);
  if (!existsSync(p)) return null;
  const win = {};
  new Function("window", readFileSync(p, "utf8"))(win);
  return win[globalName] || null;
}

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const D = loadSkillsLabData();
const COHORTS = loadCohorts();
const VO = loadGlobal("assets/skills-lab/data/virtual-office.js", "SL_VO_DATA") || {};
const FIRST30 = loadGlobal("assets/data/first-30-days.js", "PDA_FIRST30");
const RESOURCES = loadGlobal("assets/data/resource-hub.js", "PDA_RESOURCES");
// The expanded banks are authored separately; fall back to the virtual-office data until
// they land so this script keeps working either way.
const ABBREV = loadGlobal("assets/skills-lab/abbreviations-data.js", "SL_ABBREV");
const INSTR = loadGlobal("assets/skills-lab/instruments-data.js", "SL_INSTRUMENTS");
const TRAYS = loadGlobal("assets/skills-lab/trays-data.js", "SL_TRAYS");

const instrumentItems = INSTR ? INSTR.ITEMS : (VO.INSTRUMENTS || []);
const trayItems = TRAYS ? TRAYS.SETUPS : (VO.TRAYS || []);

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

  // /classes — the upcoming class dates are the whole point of the page and used to be
  // invisible to search. The rich interactive cards still come from live Supabase data;
  // this list is the durable, crawlable version underneath them.
  upcomingClassList: () => {
    const upcoming = COHORTS.filter((c) => c.start_date >= today && c.status !== "cancelled")
      .sort((a, b) => a.start_date.localeCompare(b.start_date));
    if (!upcoming.length) {
      return `<li class="text-slate-600">No upcoming classes are scheduled right now — call <a class="font-semibold text-teal-700 underline" href="tel:+19039136444">(903) 913-6444</a> and we'll tell you what's next.</li>`;
    }
    return upcoming
      .map((c) => {
        const seats = Math.max(0, (c.capacity || 0) - (c.enrolled_count || 0));
        const seatText = seats === 0 ? "Full — ask about the waitlist"
          : seats === 1 ? "1 seat left" : `${seats} seats left`;
        return `<li class="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-slate-100 py-2 last:border-0">` +
          `<span class="font-semibold text-navy-900">${fmtDate(c.start_date)}</span>` +
          `<span class="text-sm text-slate-600">In-person · Longview campus</span>` +
          `<span class="text-xs font-semibold text-teal-700">${seatText}</span></li>`;
      })
      .join("\n        ");
  },

  /* ── Skills Lab reference pages. These shipped as empty <div>s before: the entire
        reference existed only after JavaScript ran, so search saw nothing at all. ── */

  instrumentCount: () => String(instrumentItems.length),

  instrumentGrid: () =>
    instrumentItems
      .map((it) => {
        const use = it.use || it.description || it.desc || "";
        const tell = it.recognise || it.recognize || "";
        return `<article class="bg-white rounded-xl border border-slate-200 p-4">` +
          `<h3 class="font-bold text-navy-900 text-sm">${esc(it.name)}</h3>` +
          (use ? `<p class="text-sm text-slate-600 mt-1">${esc(use)}</p>` : "") +
          (tell ? `<p class="text-xs text-slate-500 mt-2"><span class="font-semibold text-teal-700">Tell it apart:</span> ${esc(tell)}</p>` : "") +
          `</article>`;
      })
      .join("\n        "),

  trayCount: () => String(trayItems.length),

  trayCards: () =>
    trayItems
      .map((t) => {
        const n = (t.instrumentIds || t.requiredInstrumentIds || []).length;
        return `<article class="bg-white rounded-xl border border-slate-200 p-4">` +
          `<h3 class="font-bold text-navy-900 text-sm">${esc(t.procedure)}</h3>` +
          (t.blurb ? `<p class="text-sm text-slate-600 mt-1">${esc(t.blurb)}</p>` : "") +
          `<p class="text-xs text-slate-500 mt-2">${n} instrument${n === 1 ? "" : "s"} on the tray</p>` +
          `</article>`;
      })
      .join("\n        "),

  procedureCount: () => String((VO.SCENARIOS || []).length),

  procedureCards: () =>
    (VO.SCENARIOS || [])
      .map((s) => {
        const steps = (s.steps || []).length;
        return `<article class="bg-white rounded-2xl border border-slate-200 p-5">` +
          `<h3 class="font-bold text-navy-900">${esc(s.title || s.procedure || s.id)}</h3>` +
          (s.blurb ? `<p class="text-sm text-slate-600 mt-1">${esc(s.blurb)}</p>` : "") +
          (steps ? `<p class="text-xs text-slate-500 mt-2">${steps} steps</p>` : "") +
          `</article>`;
      })
      .join("\n        "),

  dayShiftCount: () => String((VO.DAY_SHIFT || []).length),

  // Emits exactly the card markup the page used to build in JavaScript, so the static version
  // is visually identical to what students already saw — the difference is that search engines
  // can now read it.
  abbreviationGroups: () => {
    if (!ABBREV) return `<p class="text-slate-600">Call (903) 913-6444 for the charting reference.</p>`;
    return ABBREV.GROUPS.map((g) => {
      const rows = g.items
        .map(
          (it) =>
            `<div class="rounded-xl border border-slate-100 bg-slate-50/60 p-3 sm:p-4 flex flex-col">` +
            `<div class="abbr-key display text-lg sm:text-xl font-bold text-teal-700 leading-none">${esc(it.a)}</div>` +
            `<div class="font-semibold text-navy-900 text-sm mt-1.5">${esc(it.m)}</div>` +
            (it.note ? `<div class="text-xs text-slate-500 mt-0.5 leading-snug">${esc(it.note)}</div>` : "") +
            `</div>`
        )
        .join("");
      return `<section id="${esc(g.id)}" class="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 sm:p-6 sl-fade scroll-mt-24">` +
        `<div class="flex items-start gap-3">` +
        `<span class="text-2xl select-none" aria-hidden="true">${g.icon || ""}</span>` +
        `<div><h2 class="display text-xl font-bold text-navy-900">${esc(g.title)}</h2>` +
        `<p class="text-slate-500 text-sm mt-0.5">${esc(g.blurb || "")}</p></div></div>` +
        `<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 mt-4">${rows}</div>` +
        `</section>`;
    }).join("\n        ");
  },

  abbreviationCount: () =>
    String(ABBREV ? ABBREV.GROUPS.reduce((n, g) => n + g.items.length, 0) : 0),

  abbreviationNote: () =>
    esc(ABBREV?.NOTE ||
      "Charting symbols and colours are not standardised nationally — they vary from office to office. Learn the convention your office uses."),

  /* ── /tools/first-30-days and /tools/resource-hub ── */

  first30Weeks: () =>
    (FIRST30?.WEEKS || [])
      .map(
        (w) =>
          `<section class="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">` +
          `<h2 class="display text-lg font-bold text-navy-900">${esc(w.t)}</h2>` +
          `<ul class="mt-3 space-y-2 list-disc pl-5 text-slate-700">` +
          w.items.map((i) => `<li>${esc(i)}</li>`).join("") +
          `</ul></section>`
      )
      .join("\n        "),

  first30Total: () => String(FIRST30?.TOTAL || 0),

  resourceCards: () =>
    (RESOURCES?.RESOURCES || [])
      .map(
        (r) =>
          `<article class="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">` +
          `<div class="flex items-start gap-3"><div class="text-2xl" aria-hidden="true">${r.icon}</div><div>` +
          `<h3 class="display text-lg font-bold text-navy-900">${esc(r.title)}</h3>` +
          `<p class="text-sm text-slate-600 mt-1">${r.body}</p>` +
          `</div></div></article>`
      )
      .join("\n        "),

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
  "classes.html",
  "calendar.html",
  "tools/index.html",
  "tools/flashcards.html",
  "tools/first-30-days.html",
  "tools/resource-hub.html",
  "tools/practice-exam.html",
  "skills-lab/abbreviations.html",
  "skills-lab/instruments.html",
  "skills-lab/procedures.html",
  "skills-lab/tray-builder.html",
  "skills-lab/day-shift.html",
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
