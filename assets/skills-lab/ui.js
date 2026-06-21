/* ============================================================================
   SKILLS LAB · SHARED UI + METRICS  (window.SL_UI)
   ----------------------------------------------------------------------------
   Helpers, the single computeMetrics() (First Day Ready Score), and reusable
   chrome (header, sub-nav, footer, score gauge, badges, progress bar, states)
   shared by every Skills Lab page. Depends on SL_DATA + SL_STORE.
   ============================================================================ */
(function () {
  'use strict';
  var D = window.SL_DATA, S = window.SL_STORE;

  var $  = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var todayISO = function () { return new Date().toISOString(); };
  function fmtDate(iso) {
    if (!iso) return '—';
    var d = new Date(iso);
    if (isNaN(d)) return iso;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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

  /* ---- THE shared metric: First Day Ready Score + everything derived ---- */
  function computeMetrics() {
    var comp = S.getCompetencies();
    var attempts = S.getAttempts();
    var TOTAL = D.TOTAL_SKILLS;

    var quizAvg = 0;
    if (attempts.length) {
      quizAvg = Math.round(attempts.reduce(function (s, a) { return s + (a.score || 0); }, 0) / attempts.length);
    }

    var skillsDone = 0, verified = 0, practiced = 0, needPractice = 0;
    D.COMPETENCIES.forEach(function (s) {
      var st = (comp[s.id] && comp[s.id].status) || 'not_started';
      if (st === 'completed' || st === 'verified') skillsDone++;
      if (st === 'verified') verified++;
      if (st === 'practicing' || st === 'completed' || st === 'verified') practiced++;
      if (st === 'not_started' || st === 'practicing') needPractice++;
    });

    // 40% quiz average + 40% completed + 20% practiced
    var fdr = Math.round(0.40 * quizAvg + 0.40 * (skillsDone / TOTAL) * 100 + 0.20 * (practiced / TOTAL) * 100);

    var byCat = {};
    D.PASSPORT_CATEGORIES.forEach(function (cat) { byCat[cat] = { total: 0, done: 0, practicing: 0, verified: 0 }; });
    D.COMPETENCIES.forEach(function (s) {
      var st = (comp[s.id] && comp[s.id].status) || 'not_started';
      byCat[s.cat].total++;
      if (st === 'completed' || st === 'verified') byCat[s.cat].done++;
      if (st === 'verified') byCat[s.cat].verified++;
      if (st === 'practicing') byCat[s.cat].practicing++;
    });

    return {
      attempts: attempts, quizAvg: quizAvg, skillsDone: skillsDone, verified: verified,
      practiced: practiced, needPractice: needPractice,
      fdr: Math.max(0, Math.min(100, fdr)),
      coursePct: Math.round((skillsDone / TOTAL) * 100),
      byCat: byCat
    };
  }

  function fdrLabel(score) {
    if (score >= 85) return { text: 'First Day Ready &#9989;', cls: 'bg-teal-600 text-white' };
    if (score >= 65) return { text: 'Almost first-day ready!', cls: 'bg-teal-100 text-teal-800' };
    if (score >= 35) return { text: 'Getting there', cls: 'bg-amber-100 text-amber-800' };
    if (score > 0)   return { text: 'Building your foundation', cls: 'bg-slate-100 text-slate-700' };
    return { text: 'Just getting started', cls: 'bg-slate-100 text-slate-700' };
  }

  /* ---- Shared chrome for standalone Skills Lab pages ---- */
  // Sub-nav links (the Skills Lab sections). `active` highlights the current one.
  var NAV = [
    { href: '/skills-lab', label: 'Dashboard', key: 'dashboard' },
    { href: '/skills-lab/virtual-office', label: 'Virtual Office', key: 'office' },
    { href: '/skills-lab/procedures', label: 'Procedures', key: 'procedures' },
    { href: '/skills-lab/tray-builder', label: 'Tray Builder', key: 'trays' },
    { href: '/skills-lab/quizzes', label: 'Quizzes', key: 'quizzes' },
    { href: '/skills-lab#passport', label: 'Passport', key: 'passport' },
    { href: '/skills-lab#transcript', label: 'Transcript', key: 'transcript' }
  ];
  function headerHTML(active) {
    // Fire a tool_start once analytics is available (pda-analytics loads deferred).
    try { setTimeout(function () { if (window.PDA && window.PDA.track) window.PDA.track('tool_start', { tool: active || 'skills-lab' }); }, 600); } catch (e) {}
    return '' +
      '<style>.sl-subnav{display:flex;gap:.25rem;overflow-x:auto;scrollbar-width:none;-ms-overflow-style:none}.sl-subnav::-webkit-scrollbar{display:none}.sl-subnav>a{flex:0 0 auto;white-space:nowrap}</style>' +
      '<header class="bg-navy-900 text-white">' +
      '  <div class="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">' +
      '    <a href="/skills-lab" class="flex items-center gap-3 min-w-0 group">' +
      '      <div class="h-9 w-9 rounded-lg bg-gradient-to-br from-teal-600 to-cyan-600 grid place-items-center font-extrabold text-white shadow-lg shrink-0">P</div>' +
      '      <div class="min-w-0"><div class="font-bold leading-tight truncate">Premier Dental Academy <span class="text-teal-300">— Skills Lab</span></div>' +
      '      <div class="text-[11px] text-slate-400 leading-tight">First Day Ready Dental Assistant Training</div></div>' +
      '    </a>' +
      '    <nav class="ml-auto flex items-center gap-1 sm:gap-3 text-sm">' +
      '      <a href="https://www.premierdentalacademyoflongview.com/" class="px-2 sm:px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition whitespace-nowrap">&larr; Main site</a>' +
      '      <a href="/employers" data-event="employer_click" class="hidden sm:inline-flex px-3 py-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 transition whitespace-nowrap">For Dental Offices</a>' +
      '      <a href="/enroll" data-event="enroll_click" class="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold transition whitespace-nowrap">Enroll</a>' +
      '    </nav>' +
      '  </div>' +
      '  <div class="border-t border-white/10"><div class="max-w-6xl mx-auto px-2 sm:px-6 flex gap-1 overflow-x-auto sl-subnav">' +
      NAV.map(function (n) {
        var on = n.key === active;
        return '<a href="' + n.href + '" class="shrink-0 whitespace-nowrap px-3 sm:px-4 py-2.5 text-sm font-semibold border-b-2 transition ' +
          (on ? 'text-teal-300 border-teal-400' : 'text-slate-400 border-transparent hover:text-white') + '">' + n.label + '</a>';
      }).join('') +
      '  </div></div>' +
      '</header>';
  }
  function footerHTML() {
    return '' +
      '<div class="mt-10 border-t border-slate-200 bg-white"><div class="max-w-6xl mx-auto px-4 sm:px-6 py-8 text-center">' +
      '<div class="display text-xl font-bold text-navy-900">Ready to make it official?</div>' +
      '<p class="text-slate-500 text-sm mt-1">The Skills Lab is your practice ground — our program turns it into a credential and a job.</p>' +
      '<div class="mt-4 flex flex-wrap gap-2 justify-center">' +
      '<a href="/apply" data-event="apply_click" class="rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold px-5 py-2.5 text-sm transition">Apply free &rarr;</a>' +
      '<a href="/enroll" data-event="enroll_click" class="rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold px-5 py-2.5 text-sm transition">See enrollment</a>' +
      '<a href="/tools/practice-exam" data-event="practice_exam_click" class="rounded-xl border border-slate-300 hover:border-teal-600 text-slate-700 font-semibold px-5 py-2.5 text-sm transition">Free practice exam</a>' +
      '</div></div></div>' +
      '<footer class="border-t border-slate-200 py-6 text-center text-xs text-slate-400">' +
      'Premier Dental Academy of Longview &middot; Skills Lab &middot; Your progress is saved on this device.</footer>';
  }

  window.SL_UI = {
    $: $, $$: $$, todayISO: todayISO, fmtDate: fmtDate, escapeHTML: escapeHTML, shuffle: shuffle,
    computeMetrics: computeMetrics, fdrLabel: fdrLabel,
    headerHTML: headerHTML, footerHTML: footerHTML
  };
})();
