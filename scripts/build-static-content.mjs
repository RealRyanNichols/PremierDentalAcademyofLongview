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

  /* ── /tools/tooth-numbering — the full cross-reference, generated so it can't be
        mistyped and so search engines can read the whole chart. ── */
  toothChart: () => {
    const T = loadGlobal("assets/tools/tooth-numbering.js", "PDA_TEETH");
    if (!T) return "";
    const row = (t) =>
      `<tr class="border-b border-slate-100 last:border-0">` +
      `<td class="py-2 pr-3 font-mono font-bold text-navy-900">${esc(t.universal)}</td>` +
      `<td class="py-2 pr-3 font-mono text-teal-700">${esc(t.fdi)}</td>` +
      `<td class="py-2 pr-3 font-mono text-slate-700">${esc(t.palmer)}</td>` +
      `<td class="py-2 pr-3 text-slate-700">${esc(t.quadrant.name)}</td>` +
      `<td class="py-2 text-slate-700">${esc(t.name)}</td></tr>`;
    const head =
      `<thead><tr class="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200">` +
      `<th class="py-2 pr-3">Universal</th><th class="py-2 pr-3">FDI</th><th class="py-2 pr-3">Palmer</th>` +
      `<th class="py-2 pr-3">Quadrant</th><th class="py-2">Tooth</th></tr></thead>`;
    return (
      `<h3 class="font-bold text-navy-900 mt-2">Permanent teeth (adult)</h3>` +
      `<div class="overflow-x-auto mt-2"><table class="w-full text-sm min-w-[520px]">${head}<tbody>` +
      T.allPermanent().map(row).join("") +
      `</tbody></table></div>` +
      `<h3 class="font-bold text-navy-900 mt-6">Primary teeth (baby)</h3>` +
      `<div class="overflow-x-auto mt-2"><table class="w-full text-sm min-w-[520px]">${head}<tbody>` +
      T.allPrimary().map(row).join("") +
      `</tbody></table></div>`
    );
  },

  /* ── /tools/texas-rda-timeline ── */
  rdaTimeline: () => {
    const T = loadGlobal("assets/data/texas-rda-timeline.js", "PDA_RDA_TIMELINE");
    if (!T) return "";
    return T.STEPS.map((s, i) =>
      `<li id="${esc(s.id)}" class="bg-white rounded-2xl border ${s.ours ? "border-teal-400" : "border-slate-200"} shadow-sm p-5 scroll-mt-24">` +
      `<div class="flex items-start gap-3">` +
      `<span class="shrink-0 w-9 h-9 rounded-full bg-navy-900 text-white font-bold grid place-items-center" aria-hidden="true">${i + 1}</span>` +
      `<div class="flex-1">` +
      `<h3 class="display text-lg font-bold text-navy-900">${esc(s.title)}` +
      (s.ours ? ` <span class="text-[11px] align-middle bg-teal-600 text-white rounded-full px-2 py-0.5">This part is us</span>` : "") +
      `</h3>` +
      `<p class="text-sm text-slate-700 mt-1">${esc(s.what)}</p>` +
      `<p class="text-sm mt-3"><span class="font-semibold text-navy-900">What to have ready:</span> ${s.bring.map(esc).join(" · ")}</p>` +
      `<p class="text-sm text-slate-600 mt-2">${esc(s.note)}</p>` +
      `<p class="text-xs text-teal-800 bg-teal-50 border border-teal-100 rounded-lg p-2 mt-3"><strong>Who decides:</strong> ${esc(s.whoDecides)}</p>` +
      `</div></div></li>`
    ).join("\n        ");
  },

  rdaTimelineSource: () => {
    const T = loadGlobal("assets/data/texas-rda-timeline.js", "PDA_RDA_TIMELINE");
    if (!T) return "";
    return `${esc(T.SOURCE.caveat)} Requirements are set by the ${esc(T.SOURCE.authority)} and were checked on ${esc(T.SOURCE.checked)}.`;
  },

  /* ── /tools/dental-bill-decoder ──
     Generated so the whole glossary is in the HTML: this page's audience arrives from search
     with a bill in their hand, and the terms ARE the page. */
  billingTerms: () => {
    const B = loadGlobal("assets/data/dental-billing.js", "PDA_BILLING");
    if (!B) return "";
    return B.TERMS.map((t) =>
      `<article id="${esc(t.id)}" class="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 scroll-mt-24">` +
      `<h3 class="display text-lg font-bold text-navy-900">${esc(t.term)}</h3>` +
      `<p class="text-sm font-semibold text-teal-800 mt-1">${esc(t.short)}</p>` +
      `<p class="text-sm text-slate-700 mt-2">${esc(t.long)}</p>` +
      `<p class="text-sm text-slate-600 mt-2"><span class="font-semibold text-navy-900">For example:</span> ${esc(t.example)}</p>` +
      `<p class="text-sm bg-teal-50 border border-teal-100 rounded-lg p-3 mt-3"><span class="font-semibold text-teal-900">Ask the office:</span> &ldquo;${esc(t.ask)}&rdquo;</p>` +
      `<p class="text-sm bg-amber-50 border border-amber-100 rounded-lg p-3 mt-2"><span class="font-semibold text-amber-900">Where people get caught:</span> ${esc(t.gotcha)}</p>` +
      `</article>`
    ).join("\n        ");
  },

  billingTermJumpLinks: () => {
    const B = loadGlobal("assets/data/dental-billing.js", "PDA_BILLING");
    if (!B) return "";
    return B.TERMS.map((t) =>
      `<a href="#${esc(t.id)}" class="bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-700 rounded-full px-3 py-1.5 text-xs font-semibold">${esc(t.term)}</a>`
    ).join("\n        ");
  },

  /* ── /skills-lab/tray-setup ── */
  trayRules: () =>
    (TRAYS?.RULES || [])
      .map(
        (r) =>
          `<li><span class="font-semibold text-navy-900">${esc(r.rule)}</span>` +
          (r.why ? `<span class="block text-sm text-slate-600 mt-0.5">${esc(r.why)}</span>` : "") +
          `</li>`
      )
      .join("\n        "),

  trayProcedureOptions: () =>
    (TRAYS?.SETUPS || [])
      .map((s) => `<option value="${esc(s.id)}">${esc(s.procedure)}</option>`)
      .join("\n          "),

  traySetupList: () =>
    (TRAYS?.SETUPS || [])
      .map(
        (s) =>
          `<article class="bg-slate-50 rounded-xl border border-slate-200 p-4">` +
          `<h3 class="font-bold text-navy-900 text-sm">${esc(s.procedure)}</h3>` +
          (s.blurb ? `<p class="text-sm text-slate-600 mt-1">${esc(s.blurb)}</p>` : "") +
          `<p class="text-xs text-slate-500 mt-2">${(s.instrumentIds || []).length} items on the tray</p>` +
          `</article>`
      )
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

  /* ── /toolbox — the hub, and the main landing page from search ──
     Generated in full so every tool name and description is in the initial HTML. The filter
     chips are progressive enhancement on top: with JavaScript off you get every tool, grouped
     by situation, which is a perfectly good page. */
  toolboxShelves: () => {
    const T = loadGlobal("assets/data/toolbox.js", "PDA_TOOLBOX");
    if (!T) return "";
    const badge = (t) => {
      if (t.cost === "paid") return `<span class="shrink-0 bg-amber-100 text-amber-800 text-[11px] font-bold rounded-full px-2.5 py-1">Paid · free when enrolled</span>`;
      if (t.cost === "gated") return `<span class="shrink-0 bg-slate-100 text-slate-600 text-[11px] font-bold rounded-full px-2.5 py-1">Free · quick signup</span>`;
      return `<span class="shrink-0 bg-teal-50 text-teal-700 text-[11px] font-bold rounded-full px-2.5 py-1">Free · no signup</span>`;
    };
    return T.SITUATIONS.map((s) => {
      const tools = T.published().filter((t) => t.situation === s.id);
      if (!tools.length) return "";
      const cards = tools
        .map(
          (t) =>
            `<a href="${esc(t.href)}" class="tool-card bg-white rounded-2xl border border-slate-200 p-5 block hover:border-teal-300 transition" data-type="${esc(t.type)}" data-cost="${esc(t.cost)}">` +
            `<div class="flex items-start justify-between gap-2"><span class="text-2xl" aria-hidden="true">${t.emoji}</span>${badge(t)}</div>` +
            `<h3 class="font-bold text-navy-900 mt-2">${esc(t.name)}${t.isNew ? ` <span class="text-[10px] align-middle bg-teal-600 text-white rounded-full px-2 py-0.5">New</span>` : ""}</h3>` +
            `<p class="text-sm text-slate-600 mt-1">${esc(t.blurb)}</p></a>`
        )
        .join("");
      return `<section class="shelf" data-situation="${esc(s.id)}">` +
        `<h2 class="display text-2xl font-bold text-navy-900">${esc(s.title)}</h2>` +
        `<p class="text-slate-600 mt-1">${esc(s.blurb)}</p>` +
        `<div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">${cards}</div>` +
        `<p class="shelf-empty hidden text-slate-500 text-sm mt-4">Nothing in this group matches that filter.</p>` +
        `</section>`;
    }).join("\n        ");
  },

  toolboxCount: () => {
    const T = loadGlobal("assets/data/toolbox.js", "PDA_TOOLBOX");
    return String(T ? T.published().length : 0);
  },

  toolboxFilters: () => {
    const T = loadGlobal("assets/data/toolbox.js", "PDA_TOOLBOX");
    if (!T) return "";
    return [`<button type="button" class="filter-chip is-on" data-filter="all">Everything</button>`]
      .concat(
        T.TYPES.filter((ty) => T.published().some((t) => t.type === ty.id)).map(
          (ty) => `<button type="button" class="filter-chip" data-filter="${esc(ty.id)}">${esc(ty.label)}</button>`
        )
      )
      .join("\n          ");
  },

  /* ── /tools/healthcare-careers ──
     Every wage on this page is an outcome claim, so the source line and the "as of" date are
     generated right next to the figures rather than trusted to stay in sync by hand. */
  careerTable: () => {
    const C = loadGlobal("assets/data/healthcare-careers.js", "PDA_CAREERS");
    if (!C) return "";
    const usd = (v) => "$" + v.toLocaleString("en-US");
    return C.CAREERS.map(
      (c) =>
        `<article id="${esc(c.id)}" class="bg-white rounded-2xl border ${c.ours ? "border-teal-400" : "border-slate-200"} shadow-sm p-5 scroll-mt-24">` +
        `<div class="flex items-start justify-between gap-3">` +
        `<h3 class="display text-lg font-bold text-navy-900"><span aria-hidden="true">${c.emoji}</span> ${esc(c.name)}</h3>` +
        (c.ours ? `<span class="shrink-0 bg-teal-600 text-white text-[11px] font-bold rounded-full px-2.5 py-1">What we teach</span>` : "") +
        `</div>` +
        `<p class="text-sm text-slate-700 mt-2">${esc(c.what)}</p>` +
        `<dl class="grid grid-cols-2 gap-3 mt-4 text-sm">` +
        `<div><dt class="text-slate-500">Median pay</dt><dd class="font-bold text-navy-900">${usd(c.medianAnnual)}<span class="font-normal text-slate-500"> a year</span></dd></div>` +
        `<div><dt class="text-slate-500">Projected growth</dt><dd class="font-bold text-navy-900">${c.growthPct}%</dd></div>` +
        `<div><dt class="text-slate-500">Usual training</dt><dd class="font-semibold text-navy-900">${esc(c.typicalMonths)}</dd></div>` +
        `<div><dt class="text-slate-500">Entry education</dt><dd class="font-semibold text-navy-900">${esc(c.education)}</dd></div>` +
        `</dl>` +
        `<p class="text-sm text-slate-600 mt-3"><span class="font-semibold text-navy-900">Getting in:</span> ${esc(c.path)}</p>` +
        (c.note ? `<p class="text-xs text-slate-500 mt-2">${esc(c.note)}</p>` : "") +
        `<p class="text-xs mt-3"><a class="font-semibold text-teal-700 underline" href="${c.url}" target="_blank" rel="noopener">Check these figures at the BLS →</a></p>` +
        `</article>`
    ).join("\n        ");
  },

  careerSourceLine: () => {
    const C = loadGlobal("assets/data/healthcare-careers.js", "PDA_CAREERS");
    if (!C) return "";
    const s = C.SOURCE;
    return `Pay figures are median annual wages from the ${esc(s.wages)}, ${esc(s.wagesAsOf)}. ` +
      `Growth figures are from ${esc(s.growth)}, ${esc(s.growthAsOf)}. For comparison, the median annual wage ` +
      `across all occupations was $${s.allOccupationsMedian.toLocaleString("en-US")} and average projected growth ` +
      `was ${s.allOccupationsGrowth}%. Figures last checked ${esc(s.checked)}.`;
  },

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
  "skills-lab/tray-setup.html",
  "tools/healthcare-careers.html",
  "tools/paying-for-training.html",
  "tools/tooth-numbering.html",
  "tools/texas-rda-timeline.html",
  "tools/dental-bill-decoder.html",
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
