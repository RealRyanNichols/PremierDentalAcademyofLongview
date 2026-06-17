/* ============================================================================
   SKILLS LAB · REUSABLE QUIZ / EXERCISE ENGINE  (window.SL_QUIZ)
   ----------------------------------------------------------------------------
   ONE engine drives every practice surface (quiz hub, x-ray lab, charting,
   scheduling, instruments, patient-comm, scenarios). Give it a mount element
   and a question pool; it renders, scores, explains, saves the attempt, and
   shows a retake. Supports types: mc, multi, tf, scenario, image, missing
   (and any single-correct or multi-correct variant).

     SL_QUIZ.run({ mount, questions, category, onFinish, onRetake })

   Each question: { id, category, type, prompt, options[], answer, explanation,
                    reviewLesson, placeholder? }
   ============================================================================ */
(function () {
  'use strict';
  var U = window.SL_UI, S = window.SL_STORE;
  var esc = U.escapeHTML;

  var TYPE_LABEL = {
    mc: 'Multiple choice', multi: 'Select all that apply', tf: 'True / False',
    scenario: 'Scenario — what next?', image: 'Image identification', missing: 'What is missing?',
    ordered: 'Put in order', match: 'Match'
  };

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
    var questions = opts.questions || [];
    var category = opts.category || 'Practice';
    var onFinish = opts.onFinish || function () {};
    var onRetake = opts.onRetake || null;
    if (!mount || !questions.length) { if (mount) mount.innerHTML = '<p class="text-sm text-slate-500">No questions available.</p>'; return; }

    var state = { idx: 0, answers: {} };

    mount.innerHTML =
      '<div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 sm:p-6">' +
      '  <div class="flex items-center justify-between gap-3 mb-4">' +
      '    <div><div class="text-xs font-semibold uppercase tracking-wide text-teal-700">' + esc(category) + '</div>' +
      '    <div class="text-sm text-slate-500">Question <span data-q="idx">1</span> of <span data-q="total">' + questions.length + '</span></div></div>' +
      '    <button type="button" data-q="quit" class="text-sm text-slate-400 hover:text-slate-600">Quit</button>' +
      '  </div>' +
      '  <div class="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mb-5"><div data-q="progress" class="h-full bg-gradient-to-r from-teal-500 to-cyan-500 transition-all" style="width:0%"></div></div>' +
      '  <div data-q="area" aria-live="polite"></div>' +
      '  <div class="mt-6 flex items-center justify-between gap-3">' +
      '    <div data-q="hint" class="text-xs text-slate-400"></div>' +
      '    <button type="button" data-q="submit" class="rounded-xl bg-navy-900 text-white font-semibold px-6 py-2.5 text-sm hover:opacity-90 transition disabled:opacity-40" disabled>Submit</button>' +
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

      var imageBlock = '';
      if (q.type === 'image' || q.placeholder) {
        imageBlock = '<div class="mb-4 rounded-xl bg-slate-100 border border-dashed border-slate-300 p-6 text-center">' +
          '<div class="text-4xl">&#129463;</div><div class="text-xs text-slate-500 mt-2 font-medium">[clinical image]</div>' +
          '<div class="text-[10px] text-amber-600 mt-1">Placeholder — replace with a licensed clinical photo</div></div>';
      }

      var saved = state.answers[q.id];
      var opts = q.options.map(function (opt, i) {
        var checked = isMulti ? (Array.isArray(saved) && saved.indexOf(i) !== -1) : (saved === i);
        var inputType = isMulti ? 'checkbox' : 'radio';
        return '<label class="optRow flex items-start gap-3 rounded-xl border-2 p-3.5 cursor-pointer transition ' +
          (checked ? 'border-teal-500 bg-teal-50' : 'border-slate-200 hover:border-teal-300 hover:bg-slate-50') + '">' +
          '<input type="' + inputType + '" name="opt" value="' + i + '" ' + (checked ? 'checked' : '') + ' class="mt-1 accent-teal-600 h-4 w-4">' +
          '<span class="text-sm text-navy-900">' + esc(opt) + '</span></label>';
      }).join('');

      elArea.innerHTML =
        '<div class="flex items-center gap-2 mb-3">' +
        '<span class="text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded bg-teal-50 text-teal-700">' + esc(q.category) + '</span>' +
        '<span class="text-[11px] text-slate-400">' + typeBadge + '</span></div>' +
        imageBlock +
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
            row.className = 'optRow flex items-start gap-3 rounded-xl border-2 p-3.5 cursor-pointer transition ' +
              (ck ? 'border-teal-500 bg-teal-50' : 'border-slate-200 hover:border-teal-300 hover:bg-slate-50');
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
      var correct = 0, byCategory = {};
      questions.forEach(function (q) {
        var ok = isCorrect(q, state.answers[q.id]);
        if (ok) correct++;
        byCategory[q.category] = byCategory[q.category] || { correct: 0, total: 0 };
        byCategory[q.category].total++;
        if (ok) byCategory[q.category].correct++;
      });
      var score = Math.round((correct / questions.length) * 100);
      var attempt = {
        id: 'a_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
        date: U.todayISO(), category: category, score: score, correct: correct,
        total: questions.length, byCategory: byCategory
      };
      S.saveAttempt(attempt);
      renderResults(attempt);
      onFinish(attempt);
    }

    function renderResults(attempt) {
      var score = attempt.score, pass = score >= 80;
      var ringCls = pass ? 'text-teal-600' : (score >= 50 ? 'text-amber-500' : 'text-rose-500');

      var catBreak = Object.keys(attempt.byCategory).map(function (cat) {
        var v = attempt.byCategory[cat], pct = Math.round(v.correct / v.total * 100);
        return '<div class="flex items-center gap-3"><div class="w-40 shrink-0 text-xs text-slate-600 truncate">' + esc(cat) + '</div>' +
          '<div class="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden"><div class="h-full ' + (pct >= 80 ? 'bg-teal-500' : 'bg-amber-400') + '" style="width:' + pct + '%"></div></div>' +
          '<div class="w-12 text-right text-xs font-semibold text-slate-700">' + v.correct + '/' + v.total + '</div></div>';
      }).join('');

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
          '<span class="shrink-0 mt-0.5 h-5 w-5 grid place-items-center rounded-full text-white text-xs font-bold ' + (ok ? 'bg-teal-600' : 'bg-rose-500') + '">' + (ok ? '&#10003;' : '&#10007;') + '</span>' +
          '<div class="min-w-0"><div class="text-sm font-semibold text-navy-900">' + (i + 1) + '. ' + esc(q.prompt) + '</div>' +
          '<div class="mt-2 text-xs space-y-1">' +
          '<div><span class="text-slate-500">Your answer:</span> <span class="' + (ok ? 'text-teal-700' : 'text-rose-600') + ' font-medium">' + fmtAns(a) + '</span></div>' +
          (ok ? '' : '<div><span class="text-slate-500">Correct answer:</span> <span class="text-teal-700 font-medium">' + correctAns + '</span></div>') +
          '<div class="text-slate-600 pt-1">' + esc(q.explanation) + '</div>' +
          '<div class="flex flex-wrap gap-2 pt-1.5"><span class="inline-flex items-center text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-600">' + esc(q.category) + '</span>' +
          (q.reviewLesson ? '<span class="inline-flex items-center text-[11px] px-2 py-0.5 rounded bg-cyan-50 text-cyan-700">Review: ' + esc(q.reviewLesson) + '</span>' : '') +
          '</div></div></div></div>';
      }).join('');

      mount.innerHTML =
        '<div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 sm:p-6">' +
        '  <div class="flex flex-col sm:flex-row items-center gap-5 pb-5 border-b border-slate-100">' +
        '    <div class="display text-6xl font-bold ' + ringCls + '">' + score + '%</div>' +
        '    <div class="text-center sm:text-left"><div class="font-bold text-navy-900 text-lg">' + (pass ? 'Nice work — that is a passing score.' : 'Good practice — review the misses and retake.') + '</div>' +
        '    <div class="text-sm text-slate-500">' + attempt.correct + ' of ' + attempt.total + ' correct &middot; saved to your dashboard</div></div>' +
        '    <div class="sm:ml-auto flex gap-2">' +
        (onRetake ? '<button type="button" data-q="retake" class="rounded-xl bg-teal-600 text-white font-semibold px-5 py-2.5 text-sm hover:bg-teal-700 transition">Practice again</button>' : '') +
        '    <a href="/skills-lab" class="rounded-xl bg-white border border-slate-300 text-slate-700 font-semibold px-5 py-2.5 text-sm hover:bg-slate-50 transition">Dashboard</a></div>' +
        '  </div>' +
        (catBreak ? '<div class="py-5 border-b border-slate-100 space-y-2"><div class="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">By category</div>' + catBreak + '</div>' : '') +
        '  <div class="pt-5"><div class="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">Review every question</div><div class="space-y-3">' + review + '</div></div>' +
        '</div>';

      var rt = mount.querySelector('[data-q="retake"]');
      if (rt && onRetake) rt.addEventListener('click', onRetake);
      window.scrollTo({ top: mount.offsetTop - 80, behavior: 'smooth' });
    }

    elSubmit.addEventListener('click', function () {
      if (state.idx < questions.length - 1) {
        state.idx++; renderQuestion();
        window.scrollTo({ top: mount.offsetTop - 80, behavior: 'smooth' });
      } else { finish(); }
    });
    elQuit.addEventListener('click', function () {
      if (confirm('Quit this quiz? Your progress on it will not be saved.')) { if (onRetake) onRetake(); }
    });

    renderQuestion();
  }

  window.SL_QUIZ = { run: run, isCorrect: isCorrect };
})();
