/* ============================================================================
   SKILLS LAB · SCENARIO PLAYER  (window.SL_SCENARIO)
   ----------------------------------------------------------------------------
   The single, reusable engine that walks a student through a dialogue-driven
   scenario (Dr. Williams / the patient ask questions; the student answers).
   Used by BOTH /skills-lab/procedures and the 3D Virtual Office, reading the
   same content from window.SL_VO_DATA.

   Step types: 'choose' (single), 'multi' (select-all), 'order' (sequence),
               'identify' (pick the right one).

   *** Options are SHUFFLED on every render *** so the correct answer is never
   always in the same position. Completing a scenario credits its competencies
   and saves an attempt — feeding the dashboard's First Day Ready Score.
   ============================================================================ */
(function () {
  'use strict';
  var U = window.SL_UI, S = window.SL_STORE, esc = U.escapeHTML;
  var DONE_KEY = 'vo_scenarios_done';

  // ---- one-time styles (both pages load Tailwind for the rest) ----
  function injectStyles() {
    if (document.getElementById('sl-scenario-css')) return;
    var css = document.createElement('style');
    css.id = 'sl-scenario-css';
    css.textContent = [
      '.sl-ava{flex:0 0 auto;width:48px;height:48px;border-radius:9999px;overflow:hidden;background:#0f766e;display:grid;place-items:center;box-shadow:0 2px 8px rgba(15,23,42,.2)}',
      '.sl-ava img{width:100%;height:100%;object-fit:cover;display:block}',
      '.sl-ava .fb{font-size:24px;line-height:1}',
      '.sl-opt{display:flex;gap:.7rem;align-items:flex-start;width:100%;text-align:left;border:1.5px solid #e2e8f0;background:#fff;border-radius:.85rem;padding:.8rem .9rem;font-size:.92rem;transition:.12s;cursor:pointer}',
      '.sl-opt:hover{border-color:#5eead4;background:#f0fdfa}',
      '.sl-opt.sel{border-color:#0d9488;background:#f0fdfa;box-shadow:0 0 0 3px rgba(13,148,136,.12)}',
      '.sl-opt.correct{border-color:#16a34a;background:#f0fdf4}',
      '.sl-opt.wrong{border-color:#dc2626;background:#fef2f2}',
      '.sl-opt .mk{flex:0 0 auto;width:22px;height:22px;border-radius:6px;border:1.5px solid #cbd5e1;display:grid;place-items:center;font-size:12px;font-weight:800;color:#fff}',
      '.sl-opt.sel .mk{background:#0d9488;border-color:#0d9488}',
      '.sl-opt.correct .mk{background:#16a34a;border-color:#16a34a}.sl-opt.wrong .mk{background:#dc2626;border-color:#dc2626}',
      '.sl-ord{display:flex;align-items:center;gap:.6rem;border:1.5px solid #e2e8f0;background:#fff;border-radius:.7rem;padding:.6rem .7rem;font-size:.9rem;margin-bottom:.4rem}',
      '.sl-ord.correct{border-color:#16a34a;background:#f0fdf4}.sl-ord.wrong{border-color:#dc2626;background:#fef2f2}',
      '.sl-ord .grip{cursor:grab;color:#94a3b8;font-weight:700}',
      '.sl-ord .ordnum{flex:0 0 auto;width:22px;height:22px;border-radius:6px;background:#0f766e;color:#fff;display:grid;place-items:center;font-size:12px;font-weight:800}',
      '.sl-ord .ardbtn{border:1px solid #e2e8f0;border-radius:6px;width:26px;height:26px;display:grid;place-items:center;cursor:pointer;background:#fff;color:#475569}',
      '.sl-ord .ardbtn:hover{border-color:#5eead4;color:#0f766e}',
      '.sl-idc{display:flex;flex-direction:column;align-items:center;gap:.35rem;border:1.5px solid #e2e8f0;background:#fff;border-radius:.85rem;padding:.7rem;cursor:pointer;transition:.12s;text-align:center}',
      '.sl-idc:hover{border-color:#5eead4}.sl-idc.sel{border-color:#0d9488;box-shadow:0 0 0 3px rgba(13,148,136,.12)}',
      '.sl-idc.correct{border-color:#16a34a;background:#f0fdf4}.sl-idc.wrong{border-color:#dc2626;background:#fef2f2}',
      '.sl-idc .thumb{width:56px;height:56px;border-radius:.6rem;background:#f1f5f9;display:grid;place-items:center;overflow:hidden}',
      '.sl-idc .thumb img{width:100%;height:100%;object-fit:contain}',
      '.sl-fade{animation:slFade .25s ease both}@keyframes slFade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}'
    ].join('');
    document.head.appendChild(css);
  }

  // ---- avatar / thumbnail with graceful image fallback to emoji ----
  // Render an <img> with a hidden emoji sibling. onerror only toggles display
  // (no quotes-in-quotes), so a missing/blocked image cleanly shows the emoji.
  function avatarHTML(person) {
    var emoji = (person && person.emoji) || '🦷';
    if (person && person.photo) {
      return '<div class="sl-ava">' +
        '<img src="' + person.photo + '" alt="" loading="lazy" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'\'">' +
        '<span class="fb" style="display:none">' + emoji + '</span></div>';
    }
    return '<div class="sl-ava"><span class="fb">' + emoji + '</span></div>';
  }
  function thumbHTML(item) {
    var fb = (window.SL_ICON_FOR ? SL_ICON_FOR(item) : '<span style="font-size:24px">' + ((item && item.emoji) || '🦷') + '</span>');
    if (item && item.image) {
      return '<div class="thumb">' +
        '<img src="' + item.image + '" alt="" loading="lazy" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'\'">' +
        '<span class="fb" style="display:none">' + fb + '</span></div>';
    }
    return '<div class="thumb"><span class="fb">' + fb + '</span></div>';
  }

  function doneMap() { return S.get(DONE_KEY, {}); }
  function isDone(id) { return !!doneMap()[id]; }
  function markDone(id) { var d = doneMap(); d[id] = new Date().toISOString(); S.set(DONE_KEY, d); }

  /* ---- build a shuffled view of a step's options (correct ≠ always first) ---- */
  function prepareView(step) {
    var n = step.options.length;
    var order = U.shuffle(rangeArr(n));                  // view position -> original index
    var answerSet = Array.isArray(step.answer) ? step.answer.slice() : [step.answer];
    var view = {
      type: step.type,
      labels: order.map(function (oi) { return step.options[oi]; }),
      orig: order,                                       // orig[viewIdx] = original index
      correctView: []
    };
    order.forEach(function (oi, vi) { if (answerSet.indexOf(oi) >= 0) view.correctView.push(vi); });
    view.correctView.sort(function (a, b) { return a - b; });
    if (step.type === 'order') {
      // present a scrambled starting arrangement (never already correct)
      var arrange = U.shuffle(rangeArr(n));
      var canonical = answerSet.join(',');               // correct sequence of original indices
      var guard = 0;
      while (arrange.join(',') === canonical && guard++ < 12) arrange = U.shuffle(rangeArr(n));
      view.arrange = arrange;                            // array of original indices, mutated as user reorders
      view.canonical = answerSet;                        // correct order of original indices
    }
    return view;
  }
  function rangeArr(n) { var a = []; for (var i = 0; i < n; i++) a.push(i); return a; }

  /* ============================ RUN ============================ */
  function run(opts) {
    injectStyles();
    var D = window.SL_VO_DATA;
    var mount = opts.mount, scenario = opts.scenario;
    var total = scenario.steps.length;
    var idx = 0, correctCount = 0, byCat = {};

    function render() {
      var step = scenario.steps[idx];
      var speaker = D.resolveSpeaker(step.speaker, scenario);
      var view = prepareView(step);
      var answered = false;
      var sel = [];                                      // view indices (choose/identify/multi)
      if (typeof opts.onStep === 'function') opts.onStep({ step: step, speaker: speaker, idx: idx, total: total });

      var multi = step.type === 'multi';
      var pct = Math.round(idx / total * 100);
      mount.innerHTML =
        '<div class="sl-fade">' +
        '<div class="flex items-center justify-between gap-3">' +
        (opts.onExit ? '<button id="slExit" class="text-sm text-slate-500 hover:text-slate-700 font-semibold">&larr; ' + esc(opts.exitLabel || 'Back') + '</button>' : '<span></span>') +
        '<div class="text-xs text-slate-500">Step ' + (idx + 1) + ' of ' + total + '</div></div>' +
        '<div class="h-2 w-full bg-slate-100 rounded-full overflow-hidden mt-2"><div class="h-full bg-gradient-to-r from-teal-500 to-cyan-500 transition-all" style="width:' + pct + '%"></div></div>' +
        '<div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-6 mt-4">' +
        '  <div class="flex items-start gap-3">' + avatarHTML(speaker) +
        '    <div class="min-w-0 flex-1">' +
        '      <div class="text-xs font-bold text-teal-700">' + esc(speaker.name) + (speaker.role ? ' <span class="text-slate-400 font-medium">· ' + esc(speaker.role) + '</span>' : '') + '</div>' +
        '      <p class="font-semibold text-navy-900 mt-0.5">' + esc(step.prompt) + '</p>' +
        (multi ? '<p class="text-xs text-teal-700 font-semibold mt-1">Select all that apply.</p>' : '') +
        (step.type === 'order' ? '<p class="text-xs text-teal-700 font-semibold mt-1">Put them in the right order (drag, or use the arrows).</p>' : '') +
        '    </div>' +
        '  </div>' +
        '  <div id="slBody" class="mt-4"></div>' +
        '  <div id="slFb" class="mt-4 hidden rounded-xl p-4 text-sm"></div>' +
        '  <div class="mt-4 flex flex-wrap items-center gap-3">' +
        '    <button id="slCheck" class="rounded-xl bg-teal-600 text-white font-semibold px-5 py-2.5 text-sm hover:opacity-90 transition disabled:opacity-40" disabled>Check</button>' +
        '    <button id="slNext" class="rounded-xl bg-navy-900 text-white font-semibold px-5 py-2.5 text-sm hover:opacity-90 transition hidden">Next &rarr;</button>' +
        '  </div>' +
        '</div></div>';

      var body = mount.querySelector('#slBody');
      var checkBtn = mount.querySelector('#slCheck');
      if (opts.onExit) mount.querySelector('#slExit').addEventListener('click', opts.onExit);

      // -------- render controls per type --------
      if (step.type === 'order') {
        renderOrder();
      } else if (step.type === 'identify') {
        renderIdentify();
      } else {
        renderChoose();
      }

      function renderChoose() {
        var wrap = document.createElement('div'); wrap.className = 'grid gap-2.5';
        view.labels.forEach(function (label, vi) {
          var b = document.createElement('button'); b.className = 'sl-opt'; b.dataset.v = vi;
          b.innerHTML = '<span class="mk">' + (multi ? '' : String.fromCharCode(65 + vi)) + '</span><span>' + esc(label) + '</span>';
          b.addEventListener('click', function () {
            if (answered) return;
            if (multi) {
              var p = sel.indexOf(vi);
              if (p >= 0) { sel.splice(p, 1); b.classList.remove('sel'); b.querySelector('.mk').textContent = ''; }
              else { sel.push(vi); b.classList.add('sel'); b.querySelector('.mk').textContent = '✓'; }
            } else {
              sel = [vi]; wrap.querySelectorAll('.sl-opt').forEach(function (o) { o.classList.remove('sel'); }); b.classList.add('sel');
            }
            checkBtn.disabled = sel.length === 0;
          });
          wrap.appendChild(b);
        });
        body.appendChild(wrap);
      }

      function renderIdentify() {
        var grid = document.createElement('div'); grid.className = 'grid grid-cols-2 sm:grid-cols-3 gap-2.5';
        var D2 = window.SL_VO_DATA;
        view.labels.forEach(function (label, vi) {
          var item = D2.INSTRUMENT_BY_ID[label] || { name: label, emoji: '🦷' };
          var c = document.createElement('button'); c.className = 'sl-idc'; c.dataset.v = vi;
          c.innerHTML = thumbHTML(item) + '<span class="text-xs font-semibold text-navy-900">' + esc(item.name) + '</span>';
          c.addEventListener('click', function () {
            if (answered) return;
            sel = [vi]; grid.querySelectorAll('.sl-idc').forEach(function (o) { o.classList.remove('sel'); }); c.classList.add('sel');
            checkBtn.disabled = false;
          });
          grid.appendChild(c);
        });
        body.appendChild(grid);
        checkBtn.disabled = true;
      }

      function renderOrder() {
        checkBtn.disabled = false;                       // an order is always "submittable"
        var list = document.createElement('div');
        function paint() {
          list.innerHTML = '';
          view.arrange.forEach(function (oi, pos) {
            var row = document.createElement('div'); row.className = 'sl-ord'; row.draggable = !answered; row.dataset.pos = pos;
            row.innerHTML = '<span class="ordnum">' + (pos + 1) + '</span>' +
              '<span class="grip" aria-hidden="true">⠿</span>' +
              '<span class="flex-1">' + esc(step.options[oi]) + '</span>' +
              '<span class="flex gap-1"><button class="ardbtn up" ' + (pos === 0 ? 'disabled style="opacity:.3"' : '') + ' aria-label="Move up">▲</button>' +
              '<button class="ardbtn dn" ' + (pos === view.arrange.length - 1 ? 'disabled style="opacity:.3"' : '') + ' aria-label="Move down">▼</button></span>';
            if (!answered) {
              row.querySelector('.up').addEventListener('click', function () { if (pos > 0) { swap(pos, pos - 1); } });
              row.querySelector('.dn').addEventListener('click', function () { if (pos < view.arrange.length - 1) { swap(pos, pos + 1); } });
              row.addEventListener('dragstart', function (e) { e.dataTransfer.setData('text/plain', pos); });
              row.addEventListener('dragover', function (e) { e.preventDefault(); });
              row.addEventListener('drop', function (e) { e.preventDefault(); var from = +e.dataTransfer.getData('text/plain'); move(from, pos); });
            }
            list.appendChild(row);
          });
        }
        function swap(a, b) { var t = view.arrange[a]; view.arrange[a] = view.arrange[b]; view.arrange[b] = t; paint(); }
        function move(from, to) { var it = view.arrange.splice(from, 1)[0]; view.arrange.splice(to, 0, it); paint(); }
        view._paintOrder = paint;
        paint();
        body.appendChild(list);
      }

      // -------- grade --------
      checkBtn.addEventListener('click', function () {
        if (answered) return; answered = true;
        var correct;
        if (step.type === 'order') {
          correct = view.arrange.join(',') === view.canonical.join(',');
          if (view._paintOrder) view._paintOrder();
          body.querySelectorAll('.sl-ord').forEach(function (row, pos) {
            row.classList.add(view.arrange[pos] === view.canonical[pos] ? 'correct' : 'wrong');
          });
        } else {
          var selSorted = sel.slice().sort(function (a, b) { return a - b; });
          correct = selSorted.length === view.correctView.length && selSorted.every(function (v, k) { return v === view.correctView[k]; });
          var nodes = body.querySelectorAll('.sl-opt, .sl-idc');
          nodes.forEach(function (o) {
            var v = +o.dataset.v;
            if (view.correctView.indexOf(v) >= 0) { o.classList.add('correct'); var mk = o.querySelector('.mk'); if (mk) mk.textContent = '✓'; }
            else if (sel.indexOf(v) >= 0) { o.classList.add('wrong'); var mk2 = o.querySelector('.mk'); if (mk2) mk2.textContent = '✕'; }
          });
        }

        if (correct) correctCount++;
        var cat = step.category || scenario.title;
        byCat[cat] = byCat[cat] || { correct: 0, total: 0 };
        byCat[cat].total++; if (correct) byCat[cat].correct++;

        var fb = mount.querySelector('#slFb');
        fb.classList.remove('hidden');
        fb.className = 'mt-4 rounded-xl p-4 text-sm border ' + (correct ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-amber-50 border-amber-200 text-amber-900');
        fb.innerHTML = '<div class="font-bold mb-1">' + (correct ? '✓ Exactly right' : 'Here’s the right answer') + '</div>' + esc(step.explanation);

        checkBtn.classList.add('hidden');
        var nextBtn = mount.querySelector('#slNext');
        nextBtn.classList.remove('hidden');
        nextBtn.textContent = (idx + 1 < total) ? 'Next →' : 'Finish →';
        nextBtn.addEventListener('click', function () {
          if (idx + 1 < total) { idx++; render(); }
          else finish();
        });
      });
    }

    function finish() {
      var score = Math.round(correctCount / total * 100);
      (scenario.competencies || []).forEach(function (cid) {
        S.setCompetency(cid, 'completed', { note: 'Practiced in Virtual Office: ' + scenario.title });
      });
      S.saveAttempt({
        date: U.todayISO(), category: 'Virtual Office — ' + scenario.title,
        score: score, correct: correctCount, total: total, byCategory: byCat
      });
      markDone(scenario.id);

      var recap = scenario.steps.map(function (s) {
        return '<li class="flex gap-2 items-start"><span class="text-emerald-600 mt-0.5">✓</span><span>' + esc(s.prompt) + '</span></li>';
      }).join('');
      var skillNames = (scenario.competencies || []).map(function (cid) {
        var c = (window.SL_DATA.COMPETENCIES || []).find(function (x) { return x.id === cid; });
        return c ? c.name : cid;
      });
      mount.innerHTML =
        '<div class="sl-fade">' +
        '<div class="rounded-2xl bg-gradient-to-br from-teal-700 to-cyan-700 text-white p-6 sm:p-8 shadow-xl text-center">' +
        '<div class="text-5xl">' + (scenario.icon || '✅') + '</div>' +
        '<h2 class="display text-2xl sm:text-3xl font-bold mt-2">Visit complete!</h2>' +
        '<p class="text-teal-100 mt-1">You scored <strong>' + score + '%</strong> on ' + esc(scenario.title.toLowerCase()) + '.</p>' +
        '</div>' +
        '<div class="grid sm:grid-cols-2 gap-4 mt-5">' +
        '<div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-5"><div class="text-xs font-bold uppercase tracking-wide text-teal-700">What you handled</div><ul class="mt-2 space-y-1.5 text-sm text-navy-900">' + recap + '</ul></div>' +
        '<div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-5"><div class="text-xs font-bold uppercase tracking-wide text-emerald-700">Skills credited to your passport</div><ul class="mt-2 space-y-1.5 text-sm text-navy-900">' +
        skillNames.map(function (n) { return '<li class="flex gap-2 items-start"><span class="text-emerald-600 mt-0.5">+</span><span>' + esc(n) + '</span></li>'; }).join('') +
        '</ul><p class="text-[11px] text-slate-400 mt-3">These count toward your First Day Ready Score.</p></div></div>' +
        '<div id="slFinishCtas" class="mt-6 flex flex-wrap items-center gap-3"></div></div>';

      var ctas = mount.querySelector('#slFinishCtas');
      var again = document.createElement('button');
      again.className = 'rounded-xl bg-white border border-slate-200 text-navy-900 font-semibold px-5 py-2.5 text-sm hover:border-teal-300 transition';
      again.textContent = 'Run it again';
      again.addEventListener('click', function () { idx = 0; correctCount = 0; byCat = {}; render(); });
      ctas.appendChild(again);

      if (typeof opts.onFinish === 'function') opts.onFinish({ scenarioId: scenario.id, score: score, ctas: ctas });
    }

    render();
  }

  window.SL_SCENARIO = { run: run, doneMap: doneMap, isDone: isDone, avatarHTML: avatarHTML, thumbHTML: thumbHTML };
})();
