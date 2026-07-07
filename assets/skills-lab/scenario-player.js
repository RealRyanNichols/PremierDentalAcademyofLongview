/* ============================================================================
   SKILLS LAB · SCENARIO PLAYER  (window.SL_SCENARIO)
   ----------------------------------------------------------------------------
   The single, reusable engine that walks a student through a dialogue-driven
   scenario (Dr. Williams / the patient ask questions; the student answers).
   Used by BOTH /skills-lab/procedures and the 3D Virtual Office, reading the
   same content from window.SL_VO_DATA.

   Step types: 'choose' (single), 'multi' (select-all), 'order' (sequence),
               'identify' (pick the right one), 'instrument' (pick the right
               instrument off a tray — options are instrument ids from
               SL_VO_DATA.INSTRUMENTS; answer is an index or index array).

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
      '.sl-opt .mk{flex:0 0 auto;width:22px;height:22px;border-radius:6px;border:1.5px solid #cbd5e1;display:grid;place-items:center;font-size:12px;font-weight:800;color:#94a3b8}',
      '.sl-opt.sel .mk{background:#0d9488;border-color:#0d9488;color:#fff}',
      '.sl-opt.correct .mk{background:#16a34a;border-color:#16a34a;color:#fff}.sl-opt.wrong .mk{background:#dc2626;border-color:#dc2626;color:#fff}',
      '#slCheck:disabled{background:#e2e8f0;color:#94a3b8;opacity:1;cursor:not-allowed}',
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
      /* ---- conversation layer: portraits + speech bubbles ---- */
      '.sl-say{display:flex;gap:.85rem;align-items:flex-start}',
      '.sl-port{flex:0 0 auto;width:62px;height:62px;border-radius:1rem;overflow:hidden;background:linear-gradient(180deg,#f0fdfa,#ccfbf1);border:1px solid rgba(13,148,136,.28);box-shadow:0 2px 8px rgba(15,23,42,.14)}',
      '@media (min-width:640px){.sl-port{width:74px;height:74px}}',
      '.sl-port svg{width:100%;height:100%;display:block}',
      '.sl-who{font-size:.75rem;font-weight:800;color:#0f766e;margin-bottom:.3rem}',
      '.sl-who .rl{color:#94a3b8;font-weight:600}',
      '.sl-saybody{min-width:0;flex:1}',
      '.sl-bub{position:relative;border-radius:1.1rem;border-top-left-radius:.35rem;padding:.85rem 1rem;box-shadow:0 6px 18px rgba(15,23,42,.07)}',
      '.sl-bub p.say{font-size:.98rem;line-height:1.55;font-weight:600;color:#0a1226;margin:0}',
      '.sl-bub .hint{font-size:.72rem;font-weight:700;color:#0f766e;margin:.4rem 0 0}',
      '.sl-bub:before{content:"";position:absolute;left:-7px;top:15px;width:13px;height:13px;transform:rotate(45deg);border-radius:2px}',
      '.sl-bub-dds{background:#ffffff;border:1.5px solid #99f6e4;box-shadow:0 6px 18px rgba(13,148,136,.10)}',
      '.sl-bub-dds:before{background:#ffffff;border-left:1.5px solid #99f6e4;border-bottom:1.5px solid #99f6e4}',
      '.sl-bub-pat{background:#fff8ef;border:1.5px solid #fde3c0}',
      '.sl-bub-pat:before{background:#fff8ef;border-left:1.5px solid #fde3c0;border-bottom:1.5px solid #fde3c0}',
      '.sl-bub-staff{background:#f8fafc;border:1.5px solid #e2e8f0}',
      '.sl-bub-staff:before{background:#f8fafc;border-left:1.5px solid #e2e8f0;border-bottom:1.5px solid #e2e8f0}',
      '.sl-note{background:#f1f5f9;border:1px dashed #cbd5e1;border-radius:.9rem;padding:.8rem 1rem;color:#334155}',
      '.sl-note .tag{display:inline-flex;align-items:center;gap:.4rem;font-size:.66rem;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:#64748b;margin-bottom:.35rem}',
      '.sl-note p.say{font-size:.95rem;line-height:1.55;font-weight:500;color:#1e293b;margin:0}',
      '.sl-note .hint{font-size:.72rem;font-weight:700;color:#0f766e;margin:.4rem 0 0}',
      /* ---- instrument tray strip ---- */
      '.sl-tray-cap{font-size:.68rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#64748b;margin:0 0 .45rem .15rem}',
      '.sl-tray{position:relative;display:flex;flex-wrap:wrap;gap:.4rem;justify-content:space-evenly;align-items:stretch;border-radius:16px;padding:.95rem .8rem .7rem;background:linear-gradient(175deg,#eef2f6 0%,#d4dde5 38%,#c2cdd7 62%,#dae2e9 100%);border:1px solid #aebbc7;box-shadow:inset 0 2px 3px rgba(255,255,255,.9),inset 0 -6px 14px rgba(51,65,85,.16),inset 0 -1px 0 rgba(255,255,255,.55),0 8px 18px rgba(15,23,42,.10)}',
      '.sl-tray:before{content:"";position:absolute;inset:5px;border-radius:12px;border:1px solid rgba(255,255,255,.55);pointer-events:none}',
      '.sl-tri{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:.45rem;flex:1 1 100px;min-width:96px;max-width:180px;border:1.5px solid transparent;border-radius:12px;padding:.55rem .4rem .5rem;cursor:pointer;background:transparent;transition:.12s;text-align:center}',
      '.sl-tri:hover{background:rgba(255,255,255,.5);border-color:rgba(94,234,212,.9)}',
      '.sl-tri.sel{background:rgba(240,253,250,.92);border-color:#0d9488;box-shadow:0 0 0 3px rgba(13,148,136,.15)}',
      '.sl-tri.correct{background:rgba(240,253,244,.95);border-color:#16a34a}',
      '.sl-tri.wrong{background:rgba(254,242,242,.95);border-color:#dc2626}',
      '.sl-tri .art{height:96px;display:flex;align-items:flex-end;justify-content:center;width:100%}',
      '.sl-tri .art.art-long{height:172px;filter:drop-shadow(0 4px 3px rgba(15,23,42,.25))}',
      '.sl-tri .art.art-long.art-lay{height:110px}',
      '.sl-tri .art>span{display:flex;align-items:center;justify-content:center;width:100%;height:100%}',
      '.sl-tri .art svg{max-height:100%;max-width:100%;height:100%;width:auto}',
      '.sl-tri .art>span svg{height:64%}',
      '.sl-tri .art .fbx{font-size:34px;line-height:1}',
      '.sl-tri .sl-loupe{position:absolute;top:.4rem;right:.4rem;width:48px;height:48px;border-radius:9999px;border:1px solid #cbd5e1;background:#fff;box-shadow:0 2px 6px rgba(15,23,42,.15);display:flex;align-items:center;justify-content:center;overflow:hidden;pointer-events:none}',
      '.sl-tri .sl-loupe svg{width:76%;height:76%}',
      '.sl-tri .nm{font-size:.7rem;font-weight:700;color:#1e293b;line-height:1.3;background:rgba(255,255,255,.85);border:1px solid rgba(148,163,184,.35);padding:.15rem .45rem;border-radius:.45rem;max-width:100%;min-height:2.2em;display:flex;align-items:center;justify-content:center}',
      '.sl-fade{animation:slFade .25s ease both}@keyframes slFade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}'
    ].join('');
    document.head.appendChild(css);
  }

  /* ---- optional art modules (people-art / instrument-art) ----
     Pages that include them get illustrated portraits & instrument art right
     away; on pages that don't, we lazy-load them and quietly upgrade. If the
     files are missing entirely, everything below falls back to photos/emoji. */
  var artRepaint = null;      // set by render(); called when late art arrives
  function ensureArtModules() {
    if (ensureArtModules._did) return;
    ensureArtModules._did = true;
    try {
      [['SL_PEOPLE', '/assets/skills-lab/people-art.js'],
       ['SL_ART', '/assets/skills-lab/instrument-art.js']].forEach(function (pair) {
        if (window[pair[0]]) return;
        if (document.querySelector('script[src*="' + pair[1].split('/').pop() + '"]')) return;
        var s = document.createElement('script');
        s.src = pair[1]; s.async = false;
        s.onload = function () { if (artRepaint) { try { artRepaint(); } catch (e) {} } };
        document.head.appendChild(s);
      });
    } catch (e) { /* never let optional art break the player */ }
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

  /* ---- portrait: illustrated bust when people-art is present, else the
     existing photo/emoji avatar (unchanged behavior) ---- */
  function portraitHTML(person) {
    var P = window.SL_PEOPLE;
    if (P && typeof P.bust === 'function') {
      try {
        if (P.has(person)) return '<div class="sl-port">' + P.bust(person) + '</div>';
      } catch (e) { /* fall through to avatar */ }
    }
    return avatarHTML(person);
  }

  /* ---- one conversation moment: portrait + name/role + speech bubble.
     Narrator steps render as a quiet "shift note" instead (no tail). ---- */

  /* The bubble is already headed by the speaker's name + role, so a prompt
     that opens with a redundant "Carla:" / "Tyler, anxious:" narration prefix
     drops it — the word box holds only what the person actually says. Only
     strips when actual quoted speech follows, so plain prompts are untouched. */
  function spokenPrompt(step, speaker) {
    var t = String(step.prompt || '');
    try {
      if (speaker && speaker.name) {
        var names = [speaker.name].concat(speaker.name.split(/\s+/));
        for (var i = 0; i < names.length; i++) {
          if (!names[i] || names[i].length < 3) continue;
          var n = names[i].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          var re = new RegExp('^\\s*' + n + '[^"“]{0,40}?[,:]\\s*(?=["“])');
          if (re.test(t)) { t = t.replace(re, ''); break; }
        }
      }
    } catch (e) { /* never let cleanup break the bubble */ }
    return t;
  }

  function speakerBlockHTML(step, speaker, hintHTML) {
    var isNarrator = step.speaker === 'narrator' || !speaker || speaker.id === 'narrator';
    if (isNarrator) {
      return '<div class="sl-note">' +
        '<span class="tag">📋 Shift note</span>' +
        '<p class="say">' + esc(step.prompt) + '</p>' + hintHTML + '</div>';
    }
    var tone = step.speaker === 'dentist' ? 'sl-bub-dds' : (step.speaker === 'patient' ? 'sl-bub-pat' : 'sl-bub-staff');
    var role = speaker.role || (step.speaker === 'patient' ? 'Patient' : '');
    return '<div class="sl-say">' + portraitHTML(speaker) +
      '<div class="sl-saybody">' +
      '<div class="sl-who">' + esc(speaker.name) + (role ? ' <span class="rl">· ' + esc(role) + '</span>' : '') + '</div>' +
      '<div class="sl-bub ' + tone + '"><p class="say">' + esc(spokenPrompt(step, speaker)) + '</p>' + hintHTML + '</div>' +
      '</div></div>';
  }

  /* ---- one instrument sitting on the tray strip ----
     Long instruments lie down on the tray when the art module supports the
     {lay:1} pose (detected once, so older art still renders upright), and get
     a small circular "loupe" badge showing the working end close up — the tip
     detail is what tells same-family instruments apart. ---- */
  var laySupported = null;
  function instrumentArtHTML(item) {
    var A = window.SL_ART;
    if (A && item && item.id && A.has(item.id)) {
      try {
        var kind = (typeof A.kindOf === 'function') ? A.kindOf(item.id) : 'flat';
        if (kind === 'long') {
          if (laySupported === null) {
            try { laySupported = A.svg(item.id, { lay: 1 }) !== A.svg(item.id); } catch (e2) { laySupported = false; }
          }
          var main = laySupported ? A.svg(item.id, { lay: 1 }) : A.svg(item.id);
          var loupe = '';
          try { loupe = '<span class="sl-loupe" aria-hidden="true">' + A.svg(item.id, { crop: 1 }) + '</span>'; } catch (e3) {}
          return '<span class="art art-long' + (laySupported ? ' art-lay' : '') + '">' + main + '</span>' + loupe;
        }
        return '<span class="art art-flat">' + A.svg(item.id) + '</span>';
      } catch (e) {}
    }
    var fb = window.SL_ICON_FOR ? SL_ICON_FOR(item) : '<span class="fbx">' + ((item && item.emoji) || '🦷') + '</span>';
    return '<span class="art">' + fb + '</span>';
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
    ensureArtModules();
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

      var isInstrument = step.type === 'instrument';
      var multi = step.type === 'multi' || (isInstrument && Array.isArray(step.answer));
      var pct = Math.round(idx / total * 100);
      var hintHTML = '';
      if (step.hint) hintHTML = '<p class="hint">' + esc(step.hint) + '</p>';
      else if (step.type === 'multi') hintHTML = /select (all|every)/i.test(step.prompt) ? '' : '<p class="hint">Select all that apply.</p>';
      else if (step.type === 'order') hintHTML = '<p class="hint">Put them in the right order (drag, or use the arrows).</p>';
      else if (isInstrument) {
        if (multi) hintHTML = '<p class="hint">Pick every instrument that belongs, straight off the tray.</p>';
        else hintHTML = '<p class="hint">' + (step.speaker === 'narrator' ? 'Pick it up off the tray below.' : 'Pick it off the tray below and pass it over.') + '</p>';
      }
      mount.innerHTML =
        '<div class="sl-fade">' +
        '<div class="flex items-center justify-between gap-3">' +
        (opts.onExit ? '<button id="slExit" class="text-sm text-slate-500 hover:text-slate-700 font-semibold">&larr; ' + esc(opts.exitLabel || 'Back') + '</button>' : '<span></span>') +
        '<div class="text-xs text-slate-500">Step ' + (idx + 1) + ' of ' + total + '</div></div>' +
        '<div class="h-2 w-full bg-slate-100 rounded-full overflow-hidden mt-2"><div class="h-full bg-gradient-to-r from-teal-500 to-cyan-500 transition-all" style="width:' + pct + '%"></div></div>' +
        '<div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-6 mt-4">' +
        speakerBlockHTML(step, speaker, hintHTML) +
        '  <div id="slBody" class="mt-4"></div>' +
        '  <div id="slFb" class="mt-4 hidden rounded-xl p-4 text-sm"></div>' +
        '  <div class="mt-4 flex flex-wrap items-center gap-3">' +
        '    <button id="slCheck" class="rounded-xl bg-teal-600 text-white font-semibold px-5 py-2.5 text-sm hover:opacity-90 transition disabled:opacity-40" disabled>' +
        (isInstrument ? (multi ? 'Hand them over' : 'Hand it over') : 'Check') + '</button>' +
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
      } else if (isInstrument) {
        renderInstrument();
      } else {
        renderChoose();
      }

      // late-loading art modules: quietly repaint this step once art arrives,
      // but only while the student hasn't touched anything yet
      artRepaint = (step.type === 'order') ? null : function () {
        if (!answered && sel.length === 0 && scenario.steps[idx] === step) render();
      };

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

      function renderInstrument() {
        var D2 = window.SL_VO_DATA;
        var cap = document.createElement('p');
        cap.className = 'sl-tray-cap';
        cap.textContent = 'Your tray';
        body.appendChild(cap);
        var tray = document.createElement('div'); tray.className = 'sl-tray';
        view.labels.forEach(function (id, vi) {
          var item = (D2 && D2.INSTRUMENT_BY_ID && D2.INSTRUMENT_BY_ID[id]) || { id: id, name: id, emoji: '🦷' };
          var t = document.createElement('button');
          t.type = 'button'; t.className = 'sl-tri'; t.dataset.v = vi;
          t.innerHTML = instrumentArtHTML(item) + '<span class="nm">' + esc(item.name) + '</span>';
          t.addEventListener('click', function () {
            if (answered) return;
            if (multi) {
              var p = sel.indexOf(vi);
              if (p >= 0) { sel.splice(p, 1); t.classList.remove('sel'); }
              else { sel.push(vi); t.classList.add('sel'); }
            } else {
              sel = [vi];
              tray.querySelectorAll('.sl-tri').forEach(function (o) { o.classList.remove('sel'); });
              t.classList.add('sel');
            }
            checkBtn.disabled = sel.length === 0;
          });
          tray.appendChild(t);
        });
        body.appendChild(tray);
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
          var nodes = body.querySelectorAll('.sl-opt, .sl-idc, .sl-tri');
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
      artRepaint = null;
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
      // Hero: the patient you just cared for (illustrated bust), else a drawn
      // check medallion — keeps the finish screen in the illustrated language.
      var heroHTML;
      var P2 = window.SL_PEOPLE;
      var pat = (scenario.patientId && D && D.PATIENT_BY_ID) ? D.PATIENT_BY_ID[scenario.patientId] : null;
      if (pat && P2 && typeof P2.bust === 'function' && P2.has(pat)) {
        heroHTML = '<div style="width:78px;height:78px;border-radius:9999px;overflow:hidden;margin:0 auto;border:3px solid rgba(255,255,255,.85);box-shadow:0 6px 18px rgba(15,23,42,.28);background:linear-gradient(180deg,#f0fdfa,#ccfbf1)">' + P2.bust(pat) + '</div>';
      } else {
        heroHTML = '<div style="width:66px;height:66px;border-radius:9999px;background:#fff;margin:0 auto;display:grid;place-items:center;box-shadow:0 6px 18px rgba(15,23,42,.28)">' +
          '<svg viewBox="0 0 48 48" width="34" height="34" aria-hidden="true" focusable="false"><path d="M10 25l10 10 18-21" fill="none" stroke="#0d9488" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg></div>';
      }
      mount.innerHTML =
        '<div class="sl-fade">' +
        '<div class="rounded-2xl bg-gradient-to-br from-teal-700 to-cyan-700 text-white p-6 sm:p-8 shadow-xl text-center">' +
        heroHTML +
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

  window.SL_SCENARIO = { run: run, doneMap: doneMap, isDone: isDone, avatarHTML: avatarHTML, thumbHTML: thumbHTML, portraitHTML: portraitHTML };
})();
