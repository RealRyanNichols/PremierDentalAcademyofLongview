/* ============================================================================
   SKILLS LAB · SHARED UI + METRICS  (window.SL_UI)
   ----------------------------------------------------------------------------
   Helpers, the single computeMetrics() (First Day Ready Score), scoreboard +
   "where to go next", and reusable chrome (header, sub-nav, footer, preview
   strip, enroll card, loading / error states) shared by every Skills Lab page.
   Depends on SL_DATA + SL_STORE — and degrades to a plain error card when
   either is missing instead of throwing.

   Visual language: navy header (navy-900), teal-700 primary actions, slate
   neutrals. Amber is reserved for the ONE primary conversion CTA (the header
   "Enroll" button shown to non-students).
   ============================================================================ */
(function () {
  'use strict';
  var D = window.SL_DATA || null, S = window.SL_STORE || null;
  var OK = !!(D && S && Array.isArray(D.COMPETENCIES));

  var $  = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var todayISO = function () { return new Date().toISOString(); };
  function fmtDate(iso) {
    if (!iso) return '—';
    var d = new Date(iso);
    if (isNaN(d)) return String(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  function fmtSec(sec) {
    if (sec == null || isNaN(sec)) return '—';
    sec = Math.round(sec);
    if (sec < 60) return sec + 's';
    return Math.floor(sec / 60) + 'm ' + (sec % 60) + 's';
  }
  function escapeHTML(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function localDay(iso) {
    var d = new Date(iso);
    if (isNaN(d)) return null;
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  /* ---- attempts ----
     "Scored" attempts are the ones that count toward averages and best scores:
     not a remediation re-run of missed items, not a roll-up summary row. */
  function allAttempts() { return OK ? S.getAttempts() : []; }
  function scoredAttempts() {
    return allAttempts().filter(function (a) { return a && !a.remediation && !a.summary && typeof a.score === 'number'; });
  }
  var KIND_LABEL = { quiz: 'Quiz', scenario: 'Procedure', tray: 'Tray setup', shift: 'Day shift' };
  function kindLabel(a) {
    if (!a) return 'Practice';
    if (a.kind && KIND_LABEL[a.kind]) return KIND_LABEL[a.kind];
    if (/^Virtual Office/i.test(a.category || '')) return 'Procedure';
    return 'Quiz';
  }

  /* ---- THE shared metric: First Day Ready Score + everything derived ----
     Denominators use only the skills a Skills Lab activity can credit
     (AUTO). Instructor-only skills still appear on the passport and count
     when an instructor has verified them. Verification comes ONLY from the
     database mirror (SL_STORE.getVerified) — never from self-marked status. */
  function computeMetrics() {
    if (!OK) {
      return { attempts: [], scored: [], quizAvg: 0, skillsDone: 0, verified: 0, practiced: 0, needPractice: 0, fdr: 0, coursePct: 0,
        byCat: {}, verifiedMap: {}, TOTAL: 0, TOTAL_ALL: 0, instructorOnly: [] };
    }
    var comp = S.getCompetencies();
    var verifiedMap = S.getVerified();
    var attempts = allAttempts();
    var scored = scoredAttempts();
    var AUTO = D.AUTO_COMPETENCIES || D.COMPETENCIES.filter(function (c) { return !c.instructorOnly; });
    var TOTAL = AUTO.length;

    var quizAvg = 0;
    if (scored.length) {
      quizAvg = Math.round(scored.reduce(function (s, a) { return s + (a.score || 0); }, 0) / scored.length);
    }

    function selfStatus(id) {
      var st = (comp[id] && comp[id].status) || 'not_started';
      if (st === 'verified') st = 'completed';   // legacy self-mark; sign-off is DB-only now
      return st;
    }
    function isDone(id) { return selfStatus(id) === 'completed' || !!verifiedMap[id]; }

    var skillsDone = 0, practiced = 0, needPractice = 0, verified = 0;
    AUTO.forEach(function (s) {
      var st = selfStatus(s.id);
      var done = isDone(s.id);
      if (done) skillsDone++;
      if (done || st === 'practicing') practiced++;
      if (!done) needPractice++;
    });
    D.COMPETENCIES.forEach(function (s) { if (verifiedMap[s.id]) verified++; });

    // 40% practice average + 40% completed + 20% practiced (of creditable skills)
    var fdr = TOTAL ? Math.round(0.40 * quizAvg + 0.40 * (skillsDone / TOTAL) * 100 + 0.20 * (practiced / TOTAL) * 100) : 0;

    var byCat = {};
    D.PASSPORT_CATEGORIES.forEach(function (cat) { byCat[cat] = { total: 0, done: 0, practicing: 0, verified: 0, instructorOnly: 0, all: 0 }; });
    D.COMPETENCIES.forEach(function (s) {
      var c = byCat[s.cat]; if (!c) return;
      c.all++;
      if (verifiedMap[s.id]) c.verified++;
      if (s.instructorOnly) { c.instructorOnly++; return; }
      c.total++;
      if (isDone(s.id)) c.done++;
      else if (selfStatus(s.id) === 'practicing') c.practicing++;
    });

    return {
      attempts: attempts, scored: scored, quizAvg: quizAvg, skillsDone: skillsDone, verified: verified,
      practiced: practiced, needPractice: needPractice,
      fdr: Math.max(0, Math.min(100, fdr)),
      coursePct: TOTAL ? Math.round((skillsDone / TOTAL) * 100) : 0,
      byCat: byCat, verifiedMap: verifiedMap,
      TOTAL: TOTAL, TOTAL_ALL: D.COMPETENCIES.length,
      instructorOnly: D.COMPETENCIES.filter(function (c) { return c.instructorOnly; }),
      selfStatus: selfStatus, isDone: isDone
    };
  }

  function fdrLabel(score) {
    if (score >= 85) return { text: 'First Day Ready &#9989;', cls: 'bg-teal-700 text-white' };
    if (score >= 65) return { text: 'Almost first-day ready', cls: 'bg-teal-50 text-teal-800 border border-teal-200' };
    if (score >= 35) return { text: 'Getting there', cls: 'bg-slate-100 text-slate-700' };
    if (score > 0)   return { text: 'Building your foundation', cls: 'bg-slate-100 text-slate-700' };
    return { text: 'Just getting started', cls: 'bg-slate-100 text-slate-700' };
  }

  /* ---- Scoreboard: streak, this week, best scores ---- */
  function scoreboard() {
    var attempts = allAttempts();
    var scored = scoredAttempts();
    var days = {};
    attempts.forEach(function (a) { var d = localDay(a && a.date); if (d) days[d] = true; });
    // streak: consecutive practice days ending today (or yesterday, so a
    // morning visit doesn't show 0 before today's first attempt)
    var streak = 0;
    var cursor = new Date();
    var todayKey = localDay(cursor.toISOString());
    if (!days[todayKey]) cursor.setDate(cursor.getDate() - 1);
    while (days[localDay(cursor.toISOString())]) { streak++; cursor.setDate(cursor.getDate() - 1); if (streak > 3660) break; }
    var weekAgo = Date.now() - 7 * 24 * 3600 * 1000;
    var weekAttempts = attempts.filter(function (a) { var t = Date.parse(a && a.date); return !isNaN(t) && t >= weekAgo; }).length;
    var best = {};
    scored.forEach(function (a) {
      var key = a.category || 'Practice';
      if (!best[key] || a.score > best[key].score) best[key] = { category: key, score: a.score, date: a.date, kind: kindLabel(a) };
    });
    var bestList = Object.keys(best).map(function (k) { return best[k]; }).sort(function (x, y) { return y.score - x.score || String(y.date).localeCompare(String(x.date)); });
    var last = attempts.length ? attempts[attempts.length - 1] : null;
    return { streak: streak, daysPracticed: Object.keys(days).length, weekAttempts: weekAttempts, best: bestList, totalAttempts: attempts.length, last: last };
  }

  /* ---- Where to go next: data-driven suggestions ----
     1. Weakest quiz category by accuracy (≥ 3 questions answered) → that
        category's quiz + the hands-on activity that trains it (NEXT_MAP).
     2. A procedure scored under 80% → run it again for credit.
     3. Nothing tried yet → the starter path. */
  function whereNext(limit) {
    limit = limit || 3;
    var out = [];
    if (!OK) return out;
    var VO = window.SL_VO_DATA || null;
    var scored = scoredAttempts();
    var seen = {};
    function push(item) { if (out.length >= limit || seen[item.href]) return; seen[item.href] = true; out.push(item); }
    function scenarioTitle(id) { var s = VO && VO.SCENARIO_BY_ID && VO.SCENARIO_BY_ID[id]; return s ? s.title : null; }
    function trayName(id) { var t = VO && VO.TRAYS ? VO.TRAYS.filter(function (x) { return x.id === id; })[0] : null; return t ? t.procedure : null; }

    // 1. weakest quiz category
    var acc = {};
    scored.forEach(function (a) {
      if (kindLabel(a) !== 'Quiz' || !a.byCategory) return;
      Object.keys(a.byCategory).forEach(function (cat) {
        var v = a.byCategory[cat]; if (!v || !v.total) return;
        acc[cat] = acc[cat] || { correct: 0, total: 0 };
        acc[cat].correct += v.correct || 0; acc[cat].total += v.total;
      });
    });
    var weakest = null, weakestPct = 101;
    Object.keys(acc).forEach(function (cat) {
      if (acc[cat].total < 3 || D.QUIZ_CATEGORIES.indexOf(cat) < 0) return;
      var pct = Math.round(acc[cat].correct / acc[cat].total * 100);
      if (pct < weakestPct) { weakestPct = pct; weakest = cat; }
    });
    if (weakest && weakestPct < 100) {
      push({ tag: 'Weakest area', title: weakest + ' quiz', why: 'You are at ' + weakestPct + '% in this category so far. A focused set moves it fastest.', href: '/skills-lab/quizzes?cat=' + encodeURIComponent(weakest), label: 'Practice ' + weakest });
      var nm = D.NEXT_MAP[weakest] || {};
      if (nm.scenario) push({ tag: 'Hands-on', title: scenarioTitle(nm.scenario) || 'Procedure practice', why: 'The procedure that uses what ' + weakest + ' tests.', href: '/skills-lab/procedures?proc=' + encodeURIComponent(nm.scenario), label: 'Run the procedure' });
      if (nm.tray) push({ tag: 'Tray', title: (trayName(nm.tray) || 'Procedure') + ' tray', why: 'Build the setup that goes with it.', href: '/skills-lab/tray-builder?tray=' + encodeURIComponent(nm.tray), label: 'Build the tray' });
      if (nm.page) push({ tag: 'Reference', title: nm.pageLabel || 'Reference', why: 'Read it once, then retake the quiz.', href: nm.page, label: 'Open reference' });
    }

    // 2. a procedure under 80% → run again for credit
    var lowest = null;
    scored.forEach(function (a) {
      if (kindLabel(a) !== 'Procedure' || a.score >= 80 || !a.scenarioId) return;
      if (!lowest || a.score < lowest.score) lowest = a;
    });
    if (lowest) {
      var t = scenarioTitle(lowest.scenarioId) || String(lowest.category || '').replace(/^Virtual Office — /, '');
      push({ tag: 'Earn credit', title: t, why: 'Your best run is ' + lowest.score + '%. Score 80% or better to credit its skills to your passport.', href: '/skills-lab/procedures?proc=' + encodeURIComponent(lowest.scenarioId), label: 'Run it again' });
    }

    // 3. starter path / not tried yet
    var kinds = {};
    allAttempts().forEach(function (a) { kinds[kindLabel(a)] = true; });
    if (!kinds['Tray setup']) push({ tag: 'Start here', title: 'Basic exam tray', why: 'Three instruments. The fastest first win in the lab.', href: '/skills-lab/tray-builder?tray=exam', label: 'Build the tray' });
    if (!kinds['Procedure']) push({ tag: 'Start here', title: scenarioTitle('morning-setup') || 'Morning operatory setup', why: 'Open the office before the first patient, step by step.', href: '/skills-lab/procedures?proc=morning-setup', label: 'Start the procedure' });
    if (!kinds['Quiz']) push({ tag: 'Start here', title: 'Mixed practice quiz', why: 'A short spread across every category shows where to focus.', href: '/skills-lab/quizzes?cat=__mixed__', label: 'Take the quiz' });
    if (!kinds['Day shift']) push({ tag: 'Level up', title: 'Work a full shift', why: 'Four patients back to back — charts, allergies, trays.', href: '/skills-lab/day-shift', label: 'Clock in' });
    return out;
  }

  /* ---- Verified / rubric fragments ---- */
  function verifiedChipHTML(skillId) {
    var v = OK ? S.getVerified()[skillId] : null;
    if (!v) return '';
    var by = v.by_name ? ' by ' + escapeHTML(v.by_name) : '';
    var at = v.at ? ' &middot; ' + escapeHTML(fmtDate(v.at)) : '';
    return '<span data-verified="' + escapeHTML(skillId) + '" class="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-teal-700 text-white" title="' + escapeHTML(v.note || 'Verified by an instructor') + '">Verified &#10003;' + by + at + '</span>';
  }
  function notVerifiedHTML() {
    return '<span class="inline-flex items-center text-[11px] text-slate-400">Not yet verified by an instructor</span>';
  }
  function rubricHTML(skill) {
    if (!skill || !Array.isArray(skill.rubric) || !skill.rubric.length) return '';
    return '<details class="mt-2 group"><summary class="text-[11px] font-semibold text-teal-700 hover:text-teal-800 select-none cursor-pointer">What good looks like</summary>' +
      '<ul class="mt-1.5 space-y-1 text-xs text-slate-600">' +
      skill.rubric.map(function (c) { return '<li class="flex gap-2"><span class="text-teal-600 shrink-0">&#10003;</span><span>' + escapeHTML(c) + '</span></li>'; }).join('') +
      '</ul></details>';
  }

  /* ---- Access ---- */
  // Resolves 'student' | 'preview'. Never hangs: falls back to preview after
  // the timeout so a slow network can't leave a page on its loading state.
  function resolveAccess(timeoutMs) {
    var p = (window.PDA_ACCESS && typeof window.PDA_ACCESS.get === 'function') ? window.PDA_ACCESS.get() : Promise.resolve('preview');
    var timer = new Promise(function (res) { setTimeout(function () { res('preview'); }, timeoutMs || 8000); });
    return Promise.race([p.catch(function () { return 'preview'; }), timer]).then(function (a) { return a === 'student' ? 'student' : 'preview'; });
  }

  /* ---- Shared chrome for standalone Skills Lab pages ---- */
  var NAV = [
    { href: '/skills-lab', label: 'Dashboard', key: 'dashboard' },
    { href: '/skills-lab/virtual-office', label: 'Virtual Office', key: 'office' },
    { href: '/skills-lab/procedures', label: 'Procedures', key: 'procedures' },
    { href: '/skills-lab/day-shift', label: 'Day Shift', key: 'dayshift' },
    { href: '/skills-lab/tray-builder', label: 'Tray Builder', key: 'trays' },
    { href: '/skills-lab/quizzes', label: 'Quizzes', key: 'quizzes' },
    { href: '/skills-lab/instruments', label: 'Instruments', key: 'instruments' },
    { href: '/skills-lab/abbreviations', label: 'Abbreviations', key: 'abbreviations' },
    { href: '/skills-lab#passport', label: 'Passport', key: 'passport' },
    { href: '/skills-lab#record', label: 'Progress record', key: 'record' }
  ];
  // active: nav key. access: 'student' | 'preview' | undefined (unknown → CTA shown).
  function headerHTML(active, access) {
    try { setTimeout(function () { if (window.PDA && window.PDA.track) window.PDA.track('tool_start', { tool: active || 'skills-lab' }); }, 600); } catch (e) {}
    var student = access === 'student';
    return '' +
      '<style>.sl-subnav{display:flex;flex-wrap:wrap;gap:.25rem;row-gap:.125rem}.sl-subnav>a{flex:0 0 auto;white-space:nowrap}</style>' +
      '<header data-sl-header class="bg-navy-900 text-white" style="background:#0a1226">' +
      '  <div class="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">' +
      '    <a href="/skills-lab" class="flex items-center gap-3 min-w-0 group">' +
      '      <div class="h-9 w-9 rounded-lg bg-teal-700 grid place-items-center font-extrabold text-white shadow shrink-0" style="background:#0f766e">P</div>' +
      '      <div class="min-w-0"><div class="font-bold leading-tight truncate">Premier Dental Academy <span class="text-teal-300">— Skills Lab</span></div>' +
      '      <div class="text-[11px] text-slate-400 leading-tight">First Day Ready Dental Assistant Training</div></div>' +
      '    </a>' +
      '    <nav class="ml-auto flex items-center gap-1 sm:gap-2 text-sm" aria-label="Skills Lab">' +
      '      <a href="/" class="hidden sm:inline-flex px-2 sm:px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition whitespace-nowrap">&larr; Main site</a>' +
      (student
        ? '      <a href="/dashboard" class="px-3 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition whitespace-nowrap">My dashboard</a>'
        : '      <a href="/enroll" data-event="enroll_click" class="px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold transition whitespace-nowrap" style="background:#f59e0b">Enroll</a>') +
      '    </nav>' +
      '  </div>' +
      '  <div class="border-t border-white/10"><div class="max-w-6xl mx-auto px-2 sm:px-6 sl-subnav">' +
      NAV.map(function (n) {
        var on = n.key === active;
        return '<a href="' + n.href + '" data-nav-key="' + n.key + '" ' + (on ? 'aria-current="page" ' : '') + 'class="shrink-0 whitespace-nowrap px-3 sm:px-4 py-3 text-sm font-semibold border-b-2 transition ' +
          (on ? 'text-teal-300 border-teal-400' : 'text-slate-400 border-transparent hover:text-white') + '">' + n.label + '</a>';
      }).join('') +
      '  </div></div>' +
      '</header>';
  }
  function footerHTML(access) {
    var student = access === 'student';
    var cta = student ? '' :
      '<div class="mt-10 border-t border-slate-200 bg-white"><div class="max-w-6xl mx-auto px-4 sm:px-6 py-8 text-center">' +
      '<div class="display text-xl font-bold text-navy-900">Ready to make it official?</div>' +
      '<p class="text-slate-500 text-sm mt-1">The Skills Lab is your practice ground. Enrolled students get every procedure, tray and quiz, and their progress saved to their account.</p>' +
      '<div class="mt-4 flex flex-wrap gap-2 justify-center">' +
      '<a href="/enroll" data-event="enroll_click" class="rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold px-5 py-2.5 text-sm transition">See enrollment</a>' +
      '<a href="/apply" data-event="apply_click" class="rounded-xl border border-slate-300 hover:border-teal-700 text-slate-700 font-semibold px-5 py-2.5 text-sm transition">Apply free &rarr;</a>' +
      '<a href="/tools/practice-exam" data-event="practice_exam_click" class="rounded-xl border border-slate-300 hover:border-teal-700 text-slate-700 font-semibold px-5 py-2.5 text-sm transition">Free practice exam</a>' +
      '</div></div></div>';
    var saved = student ? 'Your progress is saved to your account and follows you to any device.' : 'Your progress is saved on this device. Sign in to keep it on your account.';
    return cta + '<footer class="border-t border-slate-200 py-6 text-center text-xs text-slate-400 px-4">' +
      'Premier Dental Academy of Longview &middot; Skills Lab &middot; ' + saved + '</footer>';
  }

  // Preview strip: what the sample includes + the single enroll action.
  function previewStripHTML(text) {
    return '<div data-sl-preview class="flex flex-wrap items-center gap-3 rounded-xl bg-white border border-teal-200 p-3 sm:p-4 shadow-sm">' +
      '<span class="bg-teal-700 text-white text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded">Preview</span>' +
      '<span class="text-sm text-slate-700 flex-1 min-w-[220px]">' + text + '</span>' +
      '<a href="/enroll" data-event="enroll_click" class="rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold px-4 py-2 transition">Enroll to unlock &rarr;</a>' +
      '<a href="/login" class="text-sm font-semibold text-teal-800 hover:text-teal-900 underline">Sign in</a>' +
      '</div>';
  }
  function enrollCardHTML(title, body) {
    return '<div data-sl-locked class="bg-white rounded-2xl shadow-sm border border-teal-200 p-5 sm:p-6 text-center">' +
      '<div class="text-3xl" aria-hidden="true">&#128274;</div>' +
      '<h2 class="display text-xl sm:text-2xl font-bold text-navy-900 mt-1">' + escapeHTML(title) + '</h2>' +
      '<p class="text-slate-600 mt-1 text-sm max-w-md mx-auto">' + escapeHTML(body) + '</p>' +
      '<div class="mt-4 flex flex-wrap items-center justify-center gap-3">' +
      '<a href="/enroll" data-event="enroll_click" class="rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold px-5 py-2.5 text-sm transition">Enroll to unlock &rarr;</a>' +
      '<a href="/login" class="rounded-xl bg-navy-900 text-white font-semibold px-5 py-2.5 text-sm hover:opacity-90" style="background:#0a1226">I&#39;m a student &mdash; sign in</a>' +
      '</div></div>';
  }
  function loadingHTML(text) {
    return '<div data-sl-loading class="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 text-center" role="status" aria-live="polite">' +
      '<div class="mx-auto h-8 w-8 rounded-full border-4 border-slate-200 border-t-teal-700 animate-spin" aria-hidden="true"></div>' +
      '<p class="text-sm text-slate-500 mt-3">' + escapeHTML(text || 'Loading your Skills Lab…') + '</p></div>';
  }
  function errorCardHTML(msg) {
    return '<div data-sl-error class="bg-white rounded-2xl shadow-sm border border-rose-200 p-6 text-center" role="alert">' +
      '<div class="font-bold text-navy-900">This page could not load its content.</div>' +
      '<p class="text-sm text-slate-600 mt-1">' + escapeHTML(msg || 'A required file did not load. Check your connection and reload the page.') + '</p>' +
      '<div class="mt-3 flex flex-wrap justify-center gap-2"><button type="button" onclick="location.reload()" class="rounded-xl bg-teal-700 text-white font-semibold px-4 py-2 text-sm">Reload</button>' +
      '<a href="/skills-lab" class="rounded-xl border border-slate-300 text-slate-700 font-semibold px-4 py-2 text-sm">Skills Lab home</a></div></div>';
  }
  function emptyHTML(text, href, label) {
    return '<div data-sl-empty class="text-center py-8 px-4 rounded-xl bg-slate-50 border border-dashed border-slate-200">' +
      '<p class="text-sm text-slate-500">' + escapeHTML(text) + '</p>' +
      (href ? '<a href="' + escapeHTML(href) + '" class="inline-flex mt-3 items-center gap-1 text-sm font-semibold px-4 py-2 rounded-lg bg-teal-700 text-white hover:bg-teal-800 transition">' + escapeHTML(label || 'Start') + ' &rarr;</a>' : '') +
      '</div>';
  }

  window.SL_UI = {
    ok: OK,
    $: $, $$: $$, todayISO: todayISO, fmtDate: fmtDate, fmtSec: fmtSec, escapeHTML: escapeHTML, shuffle: shuffle, localDay: localDay,
    computeMetrics: computeMetrics, fdrLabel: fdrLabel, scoreboard: scoreboard, whereNext: whereNext,
    allAttempts: allAttempts, scoredAttempts: scoredAttempts, kindLabel: kindLabel,
    verifiedChipHTML: verifiedChipHTML, notVerifiedHTML: notVerifiedHTML, rubricHTML: rubricHTML,
    resolveAccess: resolveAccess,
    NAV: NAV, headerHTML: headerHTML, footerHTML: footerHTML,
    previewStripHTML: previewStripHTML, enrollCardHTML: enrollCardHTML, loadingHTML: loadingHTML, errorCardHTML: errorCardHTML, emptyHTML: emptyHTML
  };
})();
