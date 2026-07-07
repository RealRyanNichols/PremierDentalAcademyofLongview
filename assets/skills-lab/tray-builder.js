/* ============================================================================
   SKILLS LAB · TRAY BUILDER  (window.SL_TRAY)
   ----------------------------------------------------------------------------
   Drag (or tap) instruments from the supply drawer onto a stainless-steel
   procedure tray, then grade it: correct / missing / doesn't-belong. Reads
   trays + instruments from window.SL_VO_DATA. Building a tray correctly
   credits the matching competency toward the First Day Ready Score.

   Visual layer: a photoreal counter + steel tray + paper liner drawn in CSS,
   with full-length instrument renderings from window.SL_ART when available
   (instrument-art.js is lazy-loaded; everything degrades to the classic
   thumbnail cards if it never arrives).
   ============================================================================ */
(function () {
  'use strict';
  var U = window.SL_UI, S = window.SL_STORE, esc = U.escapeHTML;
  var DONE_KEY = 'vo_trays_done';

  // tray id -> competencies to credit when built correctly
  var TRAY_COMP = {
    exam: ['tray_exam'], restorative: ['tray_amalgam'], crown: ['tray_amalgam', 'proc_crown'],
    extraction: ['proc_extraction'], endo: []
  };

  function injectStyles() {
    if (document.getElementById('sl-tray-css')) return;
    var c = document.createElement('style'); c.id = 'sl-tray-css';
    c.textContent = [
      /* ---- counter top the tray sits on ---- */
      '.tb-counter{position:relative;border-radius:1.4rem;padding:clamp(12px,3vw,26px);background:linear-gradient(180deg,#edeae3 0%,#e0dcd2 55%,#d3cec2 100%);box-shadow:inset 0 1px 0 rgba(255,255,255,.75),inset 0 -3px 8px rgba(87,83,74,.28),0 1px 2px rgba(15,23,42,.08);overflow:hidden}',
      '.tb-counter::before{content:"";position:absolute;inset:0;background:repeating-linear-gradient(93deg,rgba(255,255,255,.015) 0 6px,rgba(120,113,98,.015) 6px 13px);pointer-events:none}',
      '.tb-counter::after{content:"";position:absolute;left:-20%;top:-60%;width:70%;height:160%;background:linear-gradient(115deg,rgba(255,255,255,.35),rgba(255,255,255,0) 60%);transform:rotate(3deg);pointer-events:none}',

      /* ---- the stainless-steel tray (rolled rim + brushed face) ---- */
      '.tb-tray{position:relative;margin:0 auto;transition:max-width .25s ease;border-radius:26px;padding:clamp(10px,1.8vw,16px);border:1px solid rgba(71,85,105,.4);background:linear-gradient(158deg,#fbfcfe 0%,#c3cbd5 30%,#edf1f5 52%,#a9b3bf 78%,#d7dde4 100%),#c3cbd5;background-blend-mode:normal;box-shadow:0 22px 34px -18px rgba(15,23,42,.5),0 8px 14px -8px rgba(15,23,42,.35),inset 0 2px 3px rgba(255,255,255,.95),inset 0 -3px 6px rgba(30,41,59,.38),inset 3px 0 5px rgba(255,255,255,.4),inset -3px 0 6px rgba(30,41,59,.22)}',
      '.tb-tray::before{content:"";position:absolute;inset:5px;border-radius:21px;pointer-events:none;box-shadow:inset 0 1.5px 2px rgba(255,255,255,.85),inset 0 -1.5px 3px rgba(51,65,85,.45),inset 2px 0 3px rgba(255,255,255,.5),inset -2px 0 3px rgba(51,65,85,.28)}',
      '.tb-tray::after{content:"";position:absolute;inset:0;border-radius:26px;background:repeating-linear-gradient(100deg,rgba(255,255,255,.035) 0 2px,rgba(15,23,42,.022) 2px 4px);pointer-events:none}',

      /* ---- disposable paper liner ---- */
      '.tb-liner{position:relative;z-index:1;border-radius:14px;min-height:210px;padding:14px 12px 12px;background:linear-gradient(133deg,#e6f6f2 0%,#cfece5 45%,#def2ed 70%,#c8e9e1 100%);box-shadow:inset 0 0 0 1px rgba(13,148,136,.2),inset 0 4px 12px rgba(15,66,60,.14),inset 0 -2px 5px rgba(15,66,60,.08),0 1px 0 rgba(255,255,255,.55);transition:box-shadow .15s}',
      '.tb-liner::before{content:"";position:absolute;inset:0;border-radius:14px;background-image:radial-gradient(rgba(13,148,136,.08) 1px,transparent 1.3px);background-size:11px 11px;pointer-events:none}',
      '.tb-tray.over .tb-liner{box-shadow:inset 0 0 0 3px rgba(13,148,136,.6),inset 0 4px 12px rgba(15,66,60,.16)}',
      '.tb-empty{position:relative;z-index:1;display:grid;place-items:center;min-height:170px;color:#0f766e;opacity:.7;font-size:.85rem;font-weight:600;text-align:center;padding:1rem}',

      /* ---- instruments laid on the liner ---- */
      '.tb-row{position:relative;display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:flex-start;gap:2px 4px;padding:2px 4px 0}',
      '.tb-supplies{position:relative;display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:flex-start;gap:2px 8px;margin-top:12px;padding:12px 4px 0;border-top:1.5px dashed rgba(13,148,136,.35)}',
      '.tb-supplies:first-child{border-top:0;margin-top:0;padding-top:2px}',
      '.tb-zone-tag{position:absolute;top:-8px;left:10px;font-size:8.5px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#0f766e;background:#cdeee7;padding:1px 7px;border-radius:999px;border:1px solid rgba(13,148,136,.25)}',
      '.tb-item{position:relative;display:flex;flex-direction:column;align-items:center;gap:4px;border:0;background:transparent;padding:3px 1px 2px;cursor:pointer;width:74px;-webkit-tap-highlight-color:transparent}',
      '.tb-item .art{position:relative;z-index:1;display:flex;align-items:flex-end;justify-content:center;filter:drop-shadow(0 6px 5px rgba(15,23,42,.32))}',
      '.tb-long .art{height:168px}.tb-long .art svg{height:100%;width:auto}',
      '.tb-flat .art{width:58px;height:58px}.tb-flat .art svg{width:100%;height:100%}',
      '.tb-item .chip{position:relative;z-index:1;font-size:9px;font-weight:700;color:#134e4a;background:rgba(255,255,255,.8);border:1px solid rgba(13,148,136,.28);border-radius:6px;padding:2px 4px;line-height:1.15;max-width:76px;text-align:center;box-shadow:0 1px 2px rgba(15,66,60,.15)}',
      '.tb-item .chip .t{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}',
      '.tb-item .rm{position:absolute;top:-4px;right:2px;z-index:2;width:18px;height:18px;border-radius:9999px;background:#ef4444;color:#fff;font-size:11px;font-weight:800;display:grid;place-items:center;border:2px solid #fff;opacity:0;transition:opacity .12s;box-shadow:0 2px 4px rgba(15,23,42,.3)}',
      '.tb-item.tb-long .rm{top:auto;bottom:30px;right:-2px;z-index:4}',
      '.tb-item:hover .rm{opacity:1}@media (hover:none){.tb-item .rm{display:none}}',
      '.tb-tray.locked .tb-item{cursor:default}.tb-tray.locked .tb-item .rm{display:none}',

      /* grading: green glow under correct pieces, amber tag on strays */
      '.tb-item.ok::before{content:"";position:absolute;left:4%;right:4%;bottom:24px;height:30px;border-radius:50%;background:radial-gradient(closest-side,rgba(16,185,129,.55),rgba(16,185,129,0));filter:blur(2px);z-index:0;pointer-events:none}',
      '.tb-item.ok .chip{background:#dcfce7;border-color:#6ee7b7;color:#065f46}',
      '.tb-item.ok .chip .t::before{content:"✓ ";font-weight:800}',
      '.tb-item.extra .chip{background:#fef3c7;border-color:#fcd34d;color:#78350f}',
      '.tb-item.extra::after{content:"doesn’t belong";position:absolute;top:-7px;left:50%;transform:translateX(-50%);z-index:3;background:#f59e0b;color:#fff;font-size:8.5px;font-weight:800;letter-spacing:.02em;padding:2px 6px;border-radius:8px;max-width:70px;white-space:normal;line-height:1.15;text-align:center;box-shadow:0 2px 4px rgba(120,53,15,.35)}',
      '.tb-item.tb-long.extra::after{top:auto;bottom:34px}',

      /* fallback card look (no SL_ART yet) */
      '.tb-item .thumb,.tb-bin .thumb{width:46px;height:46px;border-radius:.55rem;background:#f8fafc;display:grid;place-items:center;overflow:hidden;box-shadow:inset 0 0 0 1px rgba(148,163,184,.4)}',
      '.tb-item .thumb img,.tb-bin .thumb img{width:100%;height:100%;object-fit:contain}',
      '.tb-item.tb-card .thumb{box-shadow:0 3px 8px rgba(15,23,42,.22),inset 0 0 0 1px rgba(148,163,184,.4)}',

      /* ---- the supply drawer (palette) ---- */
      '.tb-cabinet{margin-top:1.25rem;border-radius:1.15rem;border:1px solid #b3bcc6;background:linear-gradient(180deg,#e2e7ec 0%,#cfd6dd 78%,#bfc7d0 100%);box-shadow:inset 0 1px 0 rgba(255,255,255,.8),inset 0 -2px 5px rgba(51,65,85,.18),0 12px 24px -16px rgba(15,23,42,.45);padding:11px 12px 14px}',
      '.tb-cab-rail{display:flex;align-items:center;gap:12px;margin-bottom:11px;padding:0 2px}',
      '.tb-handle{flex:0 0 auto;width:76px;height:9px;border-radius:999px;background:linear-gradient(180deg,#fbfdfe,#98a4b0 70%,#c3ccd5);box-shadow:0 1.5px 3px rgba(15,23,42,.4),inset 0 1px 1px rgba(255,255,255,.9)}',
      '.tb-cab-label{font-size:10px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#475569}',
      '.tb-cab-hint{margin-left:auto;font-size:10.5px;color:#64748b;font-weight:600}',
      '.tb-bins{display:grid;grid-template-columns:repeat(auto-fill,minmax(98px,1fr));gap:8px}',
      '.tb-bin{position:relative;display:flex;flex-direction:column;align-items:center;gap:5px;padding:9px 5px 8px;border-radius:10px;border:1px solid rgba(148,163,184,.45);background:linear-gradient(180deg,#f8fafb,#e8edf1 80%,#dfe5ea);box-shadow:inset 0 2px 6px rgba(15,23,42,.15),inset 0 -1px 0 rgba(255,255,255,.85),0 1px 0 rgba(255,255,255,.6);cursor:grab;text-align:center;transition:box-shadow .12s,transform .12s;-webkit-tap-highlight-color:transparent}',
      '.tb-bin:hover{box-shadow:inset 0 2px 6px rgba(15,23,42,.12),0 0 0 2px rgba(13,148,136,.55),0 3px 8px rgba(13,148,136,.2);transform:translateY(-1px)}',
      '.tb-bin:active{cursor:grabbing}',
      '.tb-bin .nm{font-size:10px;font-weight:600;color:#334155;line-height:1.15;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}',
      '.tb-bin.used{cursor:default;filter:saturate(.4);opacity:.55;transform:none}',
      '.tb-bin.used:hover{box-shadow:inset 0 2px 6px rgba(15,23,42,.15),inset 0 -1px 0 rgba(255,255,255,.85);transform:none}',
      '.tb-bin .ontray{position:absolute;top:4px;right:5px;font-size:8px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:#0f766e;background:#ccfbf1;border:1px solid #5eead4;border-radius:999px;padding:1px 5px}',

      /* small screens: shorter instruments, tighter bins */
      '@media (max-width:480px){.tb-item{width:58px}.tb-long .art{height:116px}.tb-flat .art{width:48px;height:48px}.tb-item .chip{font-size:8.5px;max-width:64px}.tb-item.extra::after{font-size:8px;max-width:58px;padding:2px 5px}.tb-item.tb-long.extra::after{bottom:30px}.tb-item.tb-long .rm{bottom:26px}.tb-liner{min-height:170px;padding:12px 8px 10px}.tb-bins{grid-template-columns:repeat(auto-fill,minmax(86px,1fr));gap:6px}.tb-empty{min-height:140px}}'
    ].join('');
    document.head.appendChild(c);
  }

  function thumb(item) {
    var fb = (window.SL_ICON_FOR ? SL_ICON_FOR(item) : '<span style="font-size:22px">' + ((item && item.emoji) || '🦷') + '</span>');
    if (item && item.image) {
      return '<div class="thumb"><img src="' + item.image + '" alt="" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'\'"><span class="fb" style="display:none">' + fb + '</span></div>';
    }
    return '<div class="thumb">' + fb + '</div>';
  }

  // Pull in the realistic instrument renderings if the page didn't load them.
  var artLoading = false;
  function ensureArt(onReady) {
    if (window.SL_ART || artLoading) return;
    artLoading = true;
    var s = document.createElement('script');
    s.src = '/assets/skills-lab/instrument-art.js';
    s.onload = function () { if (window.SL_ART && typeof onReady === 'function') onReady(); };
    s.onerror = function () { /* fine — thumbnail fallback stays */ };
    document.head.appendChild(s);
  }

  function doneMap() { return S.get(DONE_KEY, {}); }
  function isDone(id) { return !!doneMap()[id]; }
  function markDone(id) { var d = doneMap(); d[id] = new Date().toISOString(); S.set(DONE_KEY, d); }

  function run(opts) {
    injectStyles();
    var D = window.SL_VO_DATA, tray = opts.tray, mount = opts.mount;
    var INSTR = D.INSTRUMENTS;
    var SHELF = INSTR.slice();
    for (var _i = SHELF.length - 1; _i > 0; _i--) { var _j = Math.floor(Math.random() * (_i + 1)); var _t = SHELF[_i]; SHELF[_i] = SHELF[_j]; SHELF[_j] = _t; }
    var byId = D.INSTRUMENT_BY_ID;
    var required = tray.requiredInstrumentIds.slice();
    var placed = [];
    var locked = false;   // only true after a perfect tray
    var marks = null;     // id -> 'ok' | 'extra' after a check

    mount.innerHTML =
      '<div class="sl-fade">' +
      '<div class="flex items-center justify-between gap-3">' +
      (opts.onExit ? '<button id="tbExit" class="inline-flex items-center gap-1 text-sm font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-full px-3 py-1.5">&larr; ' + esc(opts.exitLabel || 'All trays') + '</button>' : '<span></span>') +
      '<div class="text-xs text-slate-500">' + required.length + ' instruments needed</div></div>' +
      '<h2 class="display text-xl sm:text-2xl font-bold text-navy-900 mt-2">Build the ' + esc(tray.procedure) + ' tray</h2>' +
      '<p class="text-slate-500 text-sm">Tap an instrument in the drawer to lay it on the tray (or drag it over). Tap a placed one to take it back off. Set the tray, then check it.</p>' +
      '<div class="mt-4">' +
      '  <div class="tb-counter">' +
      '    <div id="tbZone" class="tb-tray" aria-label="Your instrument tray">' +
      '      <div class="tb-liner"><div id="tbLiner"></div></div>' +
      '    </div>' +
      '  </div>' +
      '  <div class="mt-3 flex flex-wrap gap-2">' +
      '    <button id="tbCheck" class="rounded-xl bg-teal-600 text-white font-semibold px-5 py-2.5 text-sm hover:opacity-90 transition disabled:opacity-40" disabled>Check my tray</button>' +
      '    <button id="tbClear" class="rounded-xl bg-white border border-slate-200 text-navy-900 font-semibold px-4 py-2.5 text-sm hover:border-slate-300 transition">Clear</button>' +
      '  </div>' +
      '  <div id="tbFb" class="mt-3 hidden rounded-xl p-4 text-sm"></div>' +
      '  <div id="tbDone" class="mt-3 hidden"></div>' +
      '  <div class="tb-cabinet mt-5">' +
      '    <div class="tb-cab-rail"><span class="tb-handle"></span><span class="tb-cab-label">Supply drawer</span><span class="tb-cab-hint hidden sm:inline">Tap or drag onto the tray</span></div>' +
      '    <div id="tbPalette" class="tb-bins"></div>' +
      '  </div>' +
      '</div></div>';

    var zone = mount.querySelector('#tbZone');
    var liner = mount.querySelector('#tbLiner');
    var palette = mount.querySelector('#tbPalette');
    var checkBtn = mount.querySelector('#tbCheck');
    if (opts.onExit) mount.querySelector('#tbExit').addEventListener('click', opts.onExit);

    zone.addEventListener('dragover', function (e) { e.preventDefault(); zone.classList.add('over'); });
    zone.addEventListener('dragleave', function () { zone.classList.remove('over'); });
    zone.addEventListener('drop', function (e) { e.preventDefault(); zone.classList.remove('over'); var id = e.dataTransfer.getData('text/plain'); if (id) add(id); });

    function add(id) { if (locked) return; if (placed.indexOf(id) < 0) { placed.push(id); reset(); renderAll(); } }
    function remove(id) { if (locked) return; placed = placed.filter(function (x) { return x !== id; }); reset(); renderAll(); }
    function reset() { marks = null; mount.querySelector('#tbFb').classList.add('hidden'); mount.querySelector('#tbDone').classList.add('hidden'); }

    var A = function () { return window.SL_ART; };

    function placedEl(item) {
      var b = document.createElement('button');
      b.dataset.id = item.id;
      var art = A() && A().has(item.id) ? A().svg(item.id) : null;
      var kind = art ? A().kindOf(item.id) : 'fb';
      b.className = 'tb-item ' + (kind === 'long' ? 'tb-long' : kind === 'flat' ? 'tb-flat' : 'tb-card');
      b.innerHTML = '<span class="rm" aria-hidden="true">&times;</span>' +
        (art ? '<span class="art">' + art + '</span>' : thumb(item)) +
        '<span class="chip"><span class="t">' + esc(item.name) + '</span></span>';
      b.title = 'Tap to take ' + item.name + ' off the tray';
      b.addEventListener('click', function () { remove(item.id); });
      return b;
    }

    function binEl(item, used) {
      var b = document.createElement('button');
      b.className = 'tb-bin' + (used ? ' used' : '');
      b.dataset.id = item.id;
      b.draggable = !used;
      b.innerHTML = (used ? '<span class="ontray">On tray</span>' : '') + thumb(item) + '<span class="nm">' + esc(item.name) + '</span>';
      if (!used) {
        b.addEventListener('click', function () { add(item.id); });
        b.addEventListener('dragstart', function (e) { e.dataTransfer.setData('text/plain', item.id); });
      }
      return b;
    }

    function applyMarks() {
      if (!marks) return;
      liner.querySelectorAll('.tb-item').forEach(function (c) {
        var m = marks[c.dataset.id];
        if (m) c.classList.add(m);
      });
    }

    function renderAll() {
      zone.classList.toggle('locked', locked);
      liner.innerHTML = '';
      if (!placed.length) {
        zone.style.maxWidth = '';
        var h = document.createElement('div'); h.className = 'tb-empty';
        h.textContent = 'Empty tray — lay out every instrument this procedure needs.';
        liner.appendChild(h);
      } else {
        var longs = [], flats = [];
        placed.forEach(function (id) {
          var item = byId[id];
          var isFlat = A() && A().has(id) && A().kindOf(id) === 'flat';
          (isFlat ? flats : longs).push(item);
        });
        if (longs.length) {
          var row = document.createElement('div'); row.className = 'tb-row';
          longs.forEach(function (it) { row.appendChild(placedEl(it)); });
          liner.appendChild(row);
        }
        if (flats.length) {
          var sup = document.createElement('div'); sup.className = 'tb-supplies';
          if (longs.length) { var tag = document.createElement('span'); tag.className = 'tb-zone-tag'; tag.textContent = 'Supplies'; sup.appendChild(tag); }
          flats.forEach(function (it) { sup.appendChild(placedEl(it)); });
          liner.appendChild(sup);
        }
        // Size the tray to the setup: a 3-instrument exam tray reads as a compact
        // tray on the counter, not a vast empty one. Wide setups get full width.
        var rowMax = Math.max(longs.length, flats.length);
        zone.style.maxWidth = Math.max(350, rowMax * 84 + 96) + 'px';
      }
      palette.innerHTML = '';
      SHELF.forEach(function (it) { palette.appendChild(binEl(it, placed.indexOf(it.id) >= 0)); });
      checkBtn.disabled = placed.length === 0;
      applyMarks();
    }

    mount.querySelector('#tbClear').addEventListener('click', function () { placed = []; locked = false; reset(); renderAll(); });

    checkBtn.addEventListener('click', function () {
      var missing = required.filter(function (id) { return placed.indexOf(id) < 0; });
      var extra = placed.filter(function (id) { return required.indexOf(id) < 0; });
      var correct = required.filter(function (id) { return placed.indexOf(id) >= 0; });
      marks = {};
      placed.forEach(function (id) { marks[id] = required.indexOf(id) >= 0 ? 'ok' : 'extra'; });
      var pass = missing.length === 0 && extra.length === 0;
      var fb = mount.querySelector('#tbFb');
      fb.classList.remove('hidden');

      if (pass) {
        locked = true;
        fb.className = 'mt-3 rounded-xl p-4 text-sm border bg-emerald-50 border-emerald-200 text-emerald-900';
        fb.innerHTML = '<div class="font-bold">✓ Perfect tray!</div>You set up the ' + esc(tray.procedure) + ' tray exactly right.';
        (TRAY_COMP[tray.id] || []).forEach(function (cid) { S.setCompetency(cid, 'completed', { note: 'Built the ' + tray.procedure + ' tray in the Skills Lab' }); });
        markDone(tray.id);
        // Lock the perfect tray in sequence-of-use order, like a real setup.
        placed = required.slice();
        var done = mount.querySelector('#tbDone');
        done.classList.remove('hidden');
        done.innerHTML = '<div id="tbCtas" class="flex flex-wrap items-center gap-3"></div>';
        renderAll();
        if (typeof opts.onFinish === 'function') opts.onFinish({ trayId: tray.id, ctas: done.querySelector('#tbCtas') });
      } else {
        fb.className = 'mt-3 rounded-xl p-4 text-sm border bg-amber-50 border-amber-200 text-amber-900';
        var parts = ['<div class="font-bold mb-1">Almost — adjust the tray.</div>'];
        parts.push('<div>' + correct.length + ' of ' + required.length + ' required instruments placed.</div>');
        if (missing.length) parts.push('<div class="mt-1"><span class="font-semibold">Missing:</span> ' + missing.map(function (id) { return esc(byId[id].name); }).join(', ') + '</div>');
        if (extra.length) parts.push('<div class="mt-1"><span class="font-semibold">Doesn\'t belong on this tray:</span> ' + extra.map(function (id) { return esc(byId[id].name); }).join(', ') + '</div>');
        parts.push('<div class="mt-2 text-amber-700">Fix it and check again.</div>');
        fb.innerHTML = parts.join('');
        applyMarks();
      }
    });

    ensureArt(function () { renderAll(); });
    renderAll();
  }

  window.SL_TRAY = { run: run, doneMap: doneMap, isDone: isDone, TRAY_COMP: TRAY_COMP };
})();
