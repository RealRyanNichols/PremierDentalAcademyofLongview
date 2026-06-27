/* ============================================================================
   SKILLS LAB · TRAY BUILDER  (window.SL_TRAY)
   ----------------------------------------------------------------------------
   Drag (or tap) instruments from the shelf onto the tray for a given
   procedure, then grade it: correct / missing / doesn't-belong. Reads trays +
   instruments from window.SL_VO_DATA. Building a tray correctly credits the
   matching competency toward the First Day Ready Score.
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
      '.tb-zone{border:2px dashed #cbd5e1;border-radius:1rem;background:#f8fafc;min-height:130px;padding:.6rem;transition:.15s;display:grid;grid-template-columns:repeat(auto-fill,minmax(76px,1fr));gap:.5rem;align-content:start}',
      '.tb-zone.over{border-color:#0d9488;background:#f0fdfa}',
      '.tb-zone .empty{grid-column:1/-1;color:#94a3b8;font-size:.85rem;text-align:center;align-self:center;padding:1.5rem .5rem}',
      '.tb-card{display:flex;flex-direction:column;align-items:center;gap:.3rem;border:1.5px solid #e2e8f0;background:#fff;border-radius:.8rem;padding:.55rem .35rem;cursor:pointer;transition:.12s;text-align:center;position:relative}',
      '.tb-card:hover{border-color:#5eead4;box-shadow:0 2px 8px rgba(13,148,136,.15)}',
      '.tb-card .thumb{width:46px;height:46px;border-radius:.5rem;background:#f1f5f9;display:grid;place-items:center;overflow:hidden}',
      '.tb-card .thumb img{width:100%;height:100%;object-fit:contain}',
      '.tb-card .nm{font-size:10.5px;font-weight:600;color:#0f172a;line-height:1.1}',
      '.tb-card.placed{border-color:#0d9488;background:#f0fdfa}',
      '.tb-card .rm{position:absolute;top:-7px;right:-7px;width:20px;height:20px;border-radius:9999px;background:#ef4444;color:#fff;font-size:12px;font-weight:800;display:grid;place-items:center;border:2px solid #fff}',
      '.tb-card.correct{border-color:#16a34a;background:#f0fdf4}.tb-card.extra{border-color:#f59e0b;background:#fffbeb}'
    ].join('');
    document.head.appendChild(c);
  }

  function thumb(item) {
    var fb = (window.SL_ICON_FOR ? SL_ICON_FOR(item) : '<span style="font-size:22px">' + ((item && item.emoji) || '🦷') + '</span>');
    if (item && item.image) {
      return '<div class="thumb"><img src="' + item.image + '" alt="" loading="lazy" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'\'"><span class="fb" style="display:none">' + fb + '</span></div>';
    }
    return '<div class="thumb">' + fb + '</div>';
  }

  function doneMap() { return S.get(DONE_KEY, {}); }
  function isDone(id) { return !!doneMap()[id]; }
  function markDone(id) { var d = doneMap(); d[id] = new Date().toISOString(); S.set(DONE_KEY, d); }

  function run(opts) {
    injectStyles();
    var D = window.SL_VO_DATA, tray = opts.tray, mount = opts.mount;
    var INSTR = D.INSTRUMENTS;
    var byId = D.INSTRUMENT_BY_ID;
    var required = tray.requiredInstrumentIds.slice();
    var placed = [];
    var locked = false;   // only true after a perfect tray

    mount.innerHTML =
      '<div class="sl-fade">' +
      '<div class="flex items-center justify-between gap-3">' +
      (opts.onExit ? '<button id="tbExit" class="inline-flex items-center gap-1 text-sm font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-full px-3 py-1.5">&larr; ' + esc(opts.exitLabel || 'All trays') + '</button>' : '<span></span>') +
      '<div class="text-xs text-slate-500">' + required.length + ' instruments needed</div></div>' +
      '<h2 class="display text-xl sm:text-2xl font-bold text-navy-900 mt-2">Build the ' + esc(tray.procedure) + ' tray</h2>' +
      '<p class="text-slate-500 text-sm">Tap an instrument to add it (or drag it onto the tray). Tap a placed one to take it off. Set the tray, then check it.</p>' +
      '<div class="grid lg:grid-cols-5 gap-4 mt-4">' +
      '  <div class="lg:col-span-2">' +
      '    <div class="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Your tray</div>' +
      '    <div id="tbZone" class="tb-zone"></div>' +
      '    <div class="mt-3 flex flex-wrap gap-2">' +
      '      <button id="tbCheck" class="rounded-xl bg-teal-600 text-white font-semibold px-5 py-2.5 text-sm hover:opacity-90 transition disabled:opacity-40" disabled>Check my tray</button>' +
      '      <button id="tbClear" class="rounded-xl bg-white border border-slate-200 text-navy-900 font-semibold px-4 py-2.5 text-sm hover:border-slate-300 transition">Clear</button>' +
      '    </div>' +
      '    <div id="tbFb" class="mt-3 hidden rounded-xl p-4 text-sm"></div>' +
      '    <div id="tbDone" class="mt-3 hidden"></div>' +
      '  </div>' +
      '  <div class="lg:col-span-3">' +
      '    <div class="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Instrument shelf</div>' +
      '    <div id="tbPalette" class="grid grid-cols-3 sm:grid-cols-4 gap-2"></div>' +
      '  </div>' +
      '</div></div>';

    var zone = mount.querySelector('#tbZone');
    var palette = mount.querySelector('#tbPalette');
    var checkBtn = mount.querySelector('#tbCheck');
    if (opts.onExit) mount.querySelector('#tbExit').addEventListener('click', opts.onExit);

    zone.addEventListener('dragover', function (e) { e.preventDefault(); zone.classList.add('over'); });
    zone.addEventListener('dragleave', function () { zone.classList.remove('over'); });
    zone.addEventListener('drop', function (e) { e.preventDefault(); zone.classList.remove('over'); var id = e.dataTransfer.getData('text/plain'); if (id) add(id); });

    function add(id) { if (locked) return; if (placed.indexOf(id) < 0) { placed.push(id); reset(); renderAll(); } }
    function remove(id) { if (locked) return; placed = placed.filter(function (x) { return x !== id; }); reset(); renderAll(); }
    function reset() { mount.querySelector('#tbFb').classList.add('hidden'); mount.querySelector('#tbDone').classList.add('hidden'); }

    function card(item, inTray) {
      var b = document.createElement('button');
      b.className = 'tb-card' + (inTray ? ' placed' : '');
      b.dataset.id = item.id;
      b.draggable = !inTray;
      b.innerHTML = (inTray ? '<span class="rm">&times;</span>' : '') + thumb(item) + '<span class="nm">' + esc(item.name) + '</span>';
      if (inTray) b.addEventListener('click', function () { remove(item.id); });
      else {
        b.addEventListener('click', function () { add(item.id); });
        b.addEventListener('dragstart', function (e) { e.dataTransfer.setData('text/plain', item.id); });
      }
      return b;
    }

    function renderAll() {
      zone.innerHTML = '';
      if (!placed.length) { var h = document.createElement('div'); h.className = 'empty'; h.textContent = 'Empty tray — add the instruments this procedure needs.'; zone.appendChild(h); }
      else placed.forEach(function (id) { zone.appendChild(card(byId[id], true)); });
      palette.innerHTML = '';
      INSTR.forEach(function (it) { if (placed.indexOf(it.id) < 0) palette.appendChild(card(it, false)); });
      checkBtn.disabled = placed.length === 0;
    }

    mount.querySelector('#tbClear').addEventListener('click', function () { placed = []; locked = false; reset(); renderAll(); });

    checkBtn.addEventListener('click', function () {
      var missing = required.filter(function (id) { return placed.indexOf(id) < 0; });
      var extra = placed.filter(function (id) { return required.indexOf(id) < 0; });
      var correct = required.filter(function (id) { return placed.indexOf(id) >= 0; });
      // colour the placed cards
      zone.querySelectorAll('.tb-card').forEach(function (c) {
        c.classList.add(required.indexOf(c.dataset.id) >= 0 ? 'correct' : 'extra');
      });
      var pass = missing.length === 0 && extra.length === 0;
      var fb = mount.querySelector('#tbFb');
      fb.classList.remove('hidden');

      if (pass) {
        locked = true;
        fb.className = 'mt-3 rounded-xl p-4 text-sm border bg-emerald-50 border-emerald-200 text-emerald-900';
        fb.innerHTML = '<div class="font-bold">✓ Perfect tray!</div>You set up the ' + esc(tray.procedure) + ' tray exactly right.';
        (TRAY_COMP[tray.id] || []).forEach(function (cid) { S.setCompetency(cid, 'completed', { note: 'Built the ' + tray.procedure + ' tray in the Skills Lab' }); });
        markDone(tray.id);
        var done = mount.querySelector('#tbDone');
        done.classList.remove('hidden');
        done.innerHTML = '<div id="tbCtas" class="flex flex-wrap items-center gap-3"></div>';
        if (typeof opts.onFinish === 'function') opts.onFinish({ trayId: tray.id, ctas: done.querySelector('#tbCtas') });
      } else {
        fb.className = 'mt-3 rounded-xl p-4 text-sm border bg-amber-50 border-amber-200 text-amber-900';
        var parts = ['<div class="font-bold mb-1">Almost — adjust the tray.</div>'];
        parts.push('<div>' + correct.length + ' of ' + required.length + ' required instruments placed.</div>');
        if (missing.length) parts.push('<div class="mt-1"><span class="font-semibold">Missing:</span> ' + missing.map(function (id) { return esc(byId[id].name); }).join(', ') + '</div>');
        if (extra.length) parts.push('<div class="mt-1"><span class="font-semibold">Doesn\'t belong on this tray:</span> ' + extra.map(function (id) { return esc(byId[id].name); }).join(', ') + '</div>');
        parts.push('<div class="mt-2 text-amber-700">Fix it and check again.</div>');
        fb.innerHTML = parts.join('');
      }
    });

    renderAll();
  }

  window.SL_TRAY = { run: run, doneMap: doneMap, isDone: isDone, TRAY_COMP: TRAY_COMP };
})();
