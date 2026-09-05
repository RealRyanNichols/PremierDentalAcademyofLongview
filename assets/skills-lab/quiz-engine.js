/* ============================================================================
   SKILLS LAB · REUSABLE QUIZ / EXERCISE ENGINE  (window.SL_QUIZ)
   ----------------------------------------------------------------------------
   ONE engine drives every practice surface (quiz hub, virtual-office tray
   quiz, scenarios). Give it a mount element and a question pool; it renders,
   scores, explains, saves the attempt, and offers a retake plus a remediation
   run of only the questions that were missed.
   Supports types: mc, multi, tf, scenario, missing (text-only — there is no
   image type; every question stands on its wording alone).

     SL_QUIZ.run({ mount, questions, category, difficulty, onFinish, onRetake,
                   remediation })

   Each question: { id, category, type, prompt, options[], answer, explanation,
                    reviewLesson, difficulty? }

   `difficulty` (optional) narrows the pool to questions of that level before
   running — e.g. 'beginner' | 'intermediate' | 'advanced' | 'expert'. Omit it
   (or pass a falsy/"all" value) to use the questions exactly as given. The
   filter is a no-op if no question matches, so a quiz set is never empty.

   Saved attempt: { id, kind:'quiz', date, category, score, correct, total,
                    byCategory, missed:[questionId], remediation? }
   A remediation run (only the missed questions) is saved with
   remediation:true so it shows in history but never inflates averages.
   ============================================================================ */
(function () {
  'use strict';
  var U = window.SL_UI, S = window.SL_STORE;
  var esc = U.escapeHTML;

  var TYPE_LABEL = {
    mc: 'Multiple choice', multi: 'Select all that apply', tf: 'True / False',
    scenario: 'Scenario — what next?', missing: 'What is missing?',
    ordered: 'Put in order', match: 'Match'
  };
  var PASS = 80;

  function isCorrect(q, a) {
    if (q.type === 'multi') {
      if (!Array.isArray(a)) return false;
      var want = q.answer.slice().sort().join(',');
      var got = a.slice().sort().join(',');
      return want === got;
    }
    return a === q.answer;
  }

  function run(opts) {
    var mount = opts.mount;
    var questions = (opts.questions || []).filter(function (q) { return q && Array.isArray(q.options) && q.options.length; });
    var category = opts.category || 'Practice';
    var difficulty = opts.difficulty || null;   // optional level filter ('beginner'...'expert')
    var onFinish = opts.onFinish || function () {};
    var onRetake = opts.onRetake || null;
    var remediation = !!opts.remediation;
    if (difficulty && difficulty !== 'all' && difficulty !== '__all__') {
      var leveled = questions.filter(function (q) { return q.difficulty === difficulty; });
      if (leveled.length) questions = leveled;   // never narrow to an empty set
    }
    if (!mount) return;
    if (!questions.length) { mount.innerHTML = U.emptyHTML('No questions are available for this selection yet. Pick another category or level.'); return; }

    var state = { idx: 0, answers: {} };

    mount.innerHTML =
      '<div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 sm:p-6">' +
      '  <div class="flex items-center justify-between gap-3 mb-4">' +
      '    <div><div class="text-xs font-semibold uppercase tracking-wide text-teal-700">' + esc(category) + (remediation ? ' &middot; missed questions' : '') + '</div>' +
      '    <div class="text-sm text-slate-500">Question <span data-q="idx">1</span> of <span data-q="total">' + questions.length + '</span></div></div>' +
      '    <button type="button" data-q="quit" class="text-sm text-slate-400 hover:text-slate-600 min-h-[44px] px-2">Quit</button>' +
      '  </div>' +
      '  <div class="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mb-5"><div data-q="progress" class="h-full bg-teal-600 transition-all" style="width:0%"></div></div>' +
      '  <div data-q="area" aria-live="polite"></div>' +
      '  <div class="mt-6 flex items-center justify-between gap-3">' +
      '    <div data-q="hint" class="text-xs text-slate-400"></div>' +
      '    <button type="button" data-q="submit" class="rounded-xl bg-navy-900 text-white font-semibold px-6 py-2.5 text-sm hover:opacity-90 transition disabled:opacity-40 min-h-[44px]" style="background:#0a1226" disabled>Submit</button>' +
      '  </div>' +
      '</div>';

    var elArea = mount.querySelector('[data-q="area"]');
    var elIdx = mount.querySelector('[data-q="idx"]');
    var elProg = mount.querySelector('[data-q="progress"]');
    var elHint = mount.querySelector('[data-q="hint"]');
    var elSubmit = mount.querySelector('[data-q="submit"]');
    var elQuit = mount.querySelector('[data-q="quit"]');

    function renderQuestion() {
      var q = questions[state.idx];
      elIdx.textContent = state.idx + 1;
      elProg.style.width = (state.idx / questions.length * 100) + '%';
      var isMulti = q.type === 'multi';
      var typeBadge = TYPE_LABEL[q.type] || 'Question';

      var saved = state.answers[q.id];
      var opts = q.options.map(function (opt, i) {
        var checked = isMulti ? (Array.isArray(saved) && saved.indexOf(i) !== -1) : (saved === i);
        var inputType = isMulti ? 'checkbox' : 'radio';
        return '<label class="optRow flex items-start gap-3 rounded-xl border-2 p-3.5 cursor-pointer transition min-h-[44px] ' +
          (checked ? 'border-teal-600 bg-teal-50' : 'border-slate-200 hover:border-teal-300 hover:bg-slate-50') + '">' +
          '<input type="' + inputType + '" name="opt" value="' + i + '" ' + (checked ? 'checked' : '') + ' class="mt-1 accent-teal-700 h-4 w-4">' +
          '<span class="text-sm text-navy-900">' + esc(opt) + '</span></label>';
      }).join('');

      elArea.innerHTML =
        '<div class="flex items-center gap-2 mb-3">' +
        '<span class="text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded bg-teal-50 text-teal-700">' + esc(q.category) + '</span>' +
        '<span class="text-[11px] text-slate-400">' + typeBadge + '</span></div>' +
        '<p class="text-base sm:text-lg font-semibold text-navy-900 leading-snug mb-4">' + esc(q.prompt) + '</p>' +
        '<div class="space-y-2.5" data-q="optlist">' + opts + '</div>';

      elHint.textContent = isMulti ? 'Select all that apply' : '';
      U.$$('[data-q="optlist"] input', elArea).forEach(function (inp) {
        inp.addEventListener('change', function () {
          if (isMulti) {
            state.answers[q.id] = U.$$('[data-q="optlist"] input:checked', elArea).map(function (x) { return parseInt(x.value, 10); });
          } else {
            state.answers[q.id] = parseInt(inp.value, 10);
          }
          U.$$('[data-q="optlist"] .optRow', elArea).forEach(function (row) {
            var ck = row.querySelector('input').checked;
            row.className = 'optRow flex items-start gap-3 rounded-xl border-2 p-3.5 cursor-pointer transition min-h-[44px] ' +
              (ck ? 'border-teal-600 bg-teal-50' : 'border-slate-200 hover:border-teal-300 hover:bg-slate-50');
          });
          updateSubmit();
        });
      });
      updateSubmit();
      elSubmit.textContent = (state.idx === questions.length - 1) ? 'Finish & see results' : 'Next question';
    }

    function updateSubmit() {
      var q = questions[state.idx];
      var a = state.answers[q.id];
      var answered = (q.type === 'multi') ? (Array.isArray(a) && a.length > 0) : (typeof a === 'number');
      elSubmit.disabled = !answered;
    }

    function finish() {
      var correct = 0, byCategory = {}, missed = [];
      questions.forEach(function (q) {
        var ok = isCorrect(q, state.answers[q.id]);
        if (ok) correct++; else missed.push(q.id);
        byCategory[q.category] = byCategory[q.category] || { correct: 0, total: 0 };
        byCategory[q.category].total++;
        if (ok) byCategory[q.category].correct++;
      });
      var score = Math.round((correct / questions.length) * 100);
      var attempt = {
        id: S.newId(), kind: 'quiz',
        date: U.todayISO(), category: category, score: score, correct: correct,
        total: questions.length, byCategory: byCategory, missed: missed
      };
      if (remediation) attempt.remediation = true;
      S.saveAttempt(attempt);
      renderResults(attempt);
      onFinish(attempt);
    }

    function renderResults(attempt) {
      var score = attempt.score, pass = score >= PASS;
      var ringCls = pass ? 'text-teal-700' : (score >= 50 ? 'text-amber-600' : 'text-rose-600');
      var missedQs = questions.filter(function (q) { return attempt.missed.indexOf(q.id) >= 0; });

      var catBreak = Object.keys(attempt.byCategory).map(function (cat) {
        var v = attempt.byCategory[cat], pct = Math.round(v.correct / v.total * 100);
        return '<div class="flex items-center gap-3"><div class="w-40 shrink-0 text-xs text-slate-600 truncate">' + esc(cat) + '</div>' +
          '<div class="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden"><div class="h-full ' + (pct >= PASS ? 'bg-teal-600' : 'bg-amber-400') + '" style="width:' + pct + '%"></div></div>' +
          '<div class="w-12 text-right text-xs font-semibold text-slate-700">' + v.correct + '/' + v.total + '</div></div>';
      }).join('');

      // Where to go next for this category (hands-on activity that trains it)
      var nextHTML = '';
      try {
        var D = window.SL_DATA, nm = D && D.NEXT_MAP && D.NEXT_MAP[String(category).split(' · ')[0]];
        if (nm) {
          var links = [];
          if (nm.scenario) links.push('<a href="/skills-lab/procedures?proc=' + encodeURIComponent(nm.scenario) + '" class="rounded-lg border border-teal-200 bg-teal-50 text-teal-800 font-semibold px-3 py-2 text-xs">Run the matching procedure &rarr;</a>');
          if (nm.tray) links.push('<a href="/skills-lab/tray-builder?tray=' + encodeURIComponent(nm.tray) + '" class="rounded-lg border border-teal-200 bg-teal-50 text-teal-800 font-semibold px-3 py-2 text-xs">Build the matching tray &rarr;</a>');
          if (nm.page) links.push('<a href="' + esc(nm.page) + '" class="rounded-lg border border-slate-200 text-slate-700 font-semibold px-3 py-2 text-xs">' + esc(nm.pageLabel || 'Reference') + ' &rarr;</a>');
          if (links.length) nextHTML = '<div class="py-4 border-b border-slate-100"><div class="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Where to go next</div><div class="flex flex-wrap gap-2">' + links.join('') + '</div></div>';
        }
      } catch (e) { nextHTML = ''; }

      var review = questions.map(function (q, i) {
        var a = state.answers[q.id], ok = isCorrect(q, a);
        function fmtAns(val) {
          if (q.type === 'multi') {
            if (!Array.isArray(val) || !val.length) return '<em class="text-slate-400">No answer</em>';
            return val.map(function (ix) { return esc(q.options[ix]); }).join(', ');
          }
          if (typeof val !== 'number') return '<em class="text-slate-400">No answer</em>';
          return esc(q.options[val]);
        }
        var correctAns = q.type === 'multi'
          ? q.answer.map(function (ix) { return esc(q.options[ix]); }).join(', ')
          : esc(q.options[q.answer]);
        return '<div class="rounded-xl border ' + (ok ? 'border-teal-100 bg-teal-50/40' : 'border-rose-100 bg-rose-50/40') + ' p-4">' +
          '<div class="flex items-start gap-2">' +
          '<span class="shrink-0 mt-0.5 h-5 w-5 grid place-items-center rounded-full text-white text-xs font-bold ' + (ok ? 'bg-teal-700' : 'bg-rose-500') + '">' + (ok ? '&#10003;' : '&#10007;') + '</span>' +
          '<div class="min-w-0"><div class="text-sm font-semibold text-navy-900">' + (i + 1) + '. ' + esc(q.prompt) + '</div>' +
          '<div class="mt-2 text-xs space-y-1">' +
          '<div><span class="text-slate-500">Your answer:</span> <span class="' + (ok ? 'text-teal-700' : 'text-rose-600') + ' font-medium">' + fmtAns(a) + '</span></div>' +
          (ok ? '' : '<div><span class="text-slate-500">Correct answer:</span> <span class="text-teal-700 font-medium">' + correctAns + '</span></div>') +
          '<div class="text-slate-600 pt-1">' + esc(q.explanation) + '</div>' +
          '<div class="flex flex-wrap gap-2 pt-1.5"><span class="inline-flex items-center text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-600">' + esc(q.category) + '</span>' +
          (q.reviewLesson ? '<span class="inline-flex items-center text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-600">Review: ' + esc(q.reviewLesson) + '</span>' : '') +
          '</div></div></div></div>';
      }).join('');

      var headline = pass ? 'Nice work — that is a passing score.' : 'Good practice — review the misses and retake.';
      if (remediation) headline = pass ? 'Missed questions locked in.' : 'Keep going — a couple still need work.';

      mount.innerHTML =
        '<div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 sm:p-6">' +
        '  <div class="flex flex-col sm:flex-row items-center gap-5 pb-5 border-b border-slate-100">' +
        '    <div class="display text-6xl font-bold ' + ringCls + '">' + score + '%</div>' +
        '    <div class="text-center sm:text-left"><div class="font-bold text-navy-900 text-lg">' + headline + '</div>' +
        '    <div class="text-sm text-slate-500">' + attempt.correct + ' of ' + attempt.total + ' correct &middot; ' + (remediation ? 'practice run (not counted in your average)' : 'saved to your dashboard') + '</div></div>' +
        '    <div class="sm:ml-auto flex flex-wrap gap-2 justify-center">' +
        (missedQs.length && missedQs.length < questions.length ? '<button type="button" data-q="remediate" class="rounded-xl bg-teal-700 text-white font-semibold px-5 py-2.5 text-sm hover:bg-teal-800 transition min-h-[44px]">Practice the ' + missedQs.length + ' you missed</button>' : '') +
        (onRetake ? '<button type="button" data-q="retake" class="rounded-xl bg-white border border-slate-300 text-slate-700 font-semibold px-5 py-2.5 text-sm hover:bg-slate-50 transition min-h-[44px]">' + (missedQs.length ? 'New set' : 'Practice again') + '</button>' : '') +
        '    <a href="/skills-lab" class="rounded-xl bg-white border border-slate-300 text-slate-700 font-semibold px-5 py-2.5 text-sm hover:bg-slate-50 transition inline-flex items-center">Dashboard</a></div>' +
        '  </div>' +
        (catBreak ? '<div class="py-5 border-b border-slate-100 space-y-2"><div class="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">By category</div>' + catBreak + '</div>' : '') +
        nextHTML +
        '  <div class="pt-5"><div class="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">Review every question</div><div class="space-y-3">' + review + '</div></div>' +
        '</div>';

      var rt = mount.querySelector('[data-q="retake"]');
      if (rt && onRetake) rt.addEventListener('click', onRetake);
      var rm = mount.querySelector('[data-q="remediate"]');
      if (rm) rm.addEventListener('click', function () {
        run({ mount: mount, questions: U.shuffle(missedQs), category: String(category), onFinish: onFinish, onRetake: onRetake, remediation: true });
        window.scrollTo({ top: Math.max(0, mount.offsetTop - 80), behavior: 'smooth' });
      });
      window.scrollTo({ top: Math.max(0, mount.offsetTop - 80), behavior: 'smooth' });
    }

    elSubmit.addEventListener('click', function () {
      if (state.idx < questions.length - 1) {
        state.idx++; renderQuestion();
        window.scrollTo({ top: Math.max(0, mount.offsetTop - 80), behavior: 'smooth' });
      } else { finish(); }
    });
    elQuit.addEventListener('click', function () {
      if (confirm('Quit this quiz? Your progress on it will not be saved.')) { if (onRetake) onRetake(); }
    });

    renderQuestion();
  }

  window.SL_QUIZ = { run: run, isCorrect: isCorrect, PASS: PASS };
})();
