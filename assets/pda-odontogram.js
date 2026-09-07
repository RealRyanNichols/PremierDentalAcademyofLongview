/* ============================================================
 * PDA odontogram — the shared anatomical tooth chart.
 *
 * Draws the same two-arch chart students already use in Practice Pro
 * (tools/practice-pro.html), as a reusable library so the Charting Drills,
 * ChairSide and the course lessons render ONE chart, not three. Geometry
 * comes from /assets/tooth-shapes.js (window.PDA_TOOTH_SHAPES) — load it first.
 *
 *   <script src="/assets/tooth-shapes.js"></script>
 *   <script src="/assets/pda-odontogram.js"></script>
 *
 *   var O = window.PDA_ODONTOGRAM;
 *   O.mount(el, chart, { width: 1000 });            // draws the SVG into el
 *   O.bind(el, {                                     // click / keyboard handling
 *     onSurface: function (tooth, surface, ev) {},   // 'M' 'O' 'I' 'D' 'B' 'L'
 *     onTooth:   function (tooth, ev) {}             // whole-tooth tap (number label / crown)
 *   });
 *
 * Chart data (identical to Practice Pro):
 *   { 'T-3':  { M: 'amalgam:existing', O: 'amalgam:existing' },
 *     'T-19': { whole: 'missing:existing' },
 *     bridges: [{ start: 3, end: 5, status: 'existing' }],
 *     diastemas: [{ a: 8, b: 9, status: 'existing' }] }
 * A value is "<type>" or "<type>:<status>"; status is existing (blue) or needed (red).
 *
 * Universal numbering; the chart is drawn facing the patient (their right on
 * the viewer's left). No build step, no framework.
 * ============================================================ */
(function (global) {
  'use strict';

  var MARKERS = [
    { id: '',          label: 'Erase',      color: '#ffffff' },
    { id: 'caries',    label: 'Caries',     color: '#ef4444' },
    { id: 'composite', label: 'Composite',  color: '#0d9488' },
    { id: 'amalgam',   label: 'Amalgam',    color: '#475569' },
    { id: 'sealant',   label: 'Sealant',    color: '#a3e635' },
    { id: 'fracture',  label: 'Fracture',   color: '#be185d' },
    { id: 'watch',     label: 'Watch',      color: '#f97316' },
    { id: 'pfm',       label: 'PFM crown',  color: '#7c3aed', whole: true },
    { id: 'fgc',       label: 'FGC (gold)', color: '#d97706', whole: true },
    { id: 'ssc',       label: 'SSC',        color: '#64748b', whole: true },
    { id: 'rct',       label: 'RCT',        color: '#9333ea', whole: true },
    { id: 'implant',   label: 'Implant',    color: '#0ea5e9', whole: true },
    { id: 'missing',   label: 'Missing',    color: '#1e293b', whole: true },
    { id: 'extract',   label: 'Extract',    color: '#dc2626', whole: true },
    { id: 'impacted',  label: 'Impacted',   color: '#9333ea', whole: true },
    { id: 'abscess',   label: 'Abscess',    color: '#be185d', whole: true },
    { id: 'drift_m',   label: 'Drift M',    color: '#64748b', whole: true },
    { id: 'drift_d',   label: 'Drift D',    color: '#64748b', whole: true },
    { id: 'bridge',    label: 'Bridge',     color: '#0f766e', bridge: true },
    { id: 'diastema',  label: 'Diastema',   color: '#0f766e', diastema: true }
  ];
  var STATUS_COLORS = { existing: '#2563eb', needed: '#dc2626' };
  var TOOTH_INK = { enamel: '#fbfaf6', enamelLine: '#5b6b7c', rootLine: '#b48c6a', gum: '#f0a2b1', zoneLine: '#94a3b8' };
  var SURF_NAMES = { M: 'mesial', O: 'occlusal', I: 'incisal', D: 'distal', B: 'buccal / facial', L: 'lingual' };
  var WHOLE_TYPES = ['crown', 'pfm', 'fgc', 'ssc', 'rct', 'implant', 'missing', 'extract', 'impacted', 'drift_m', 'drift_d'];
  var SURF_TYPES = ['caries', 'composite', 'amalgam', 'watch'];
  var CROWN_TYPES = ['crown', 'pfm', 'fgc', 'ssc'];
  var NSS = 'vector-effect="non-scaling-stroke"';

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function n1(v) { return (Math.round(v * 10) / 10).toString(); }
  function parseMarker(val) {
    if (!val) return { type: '', status: '' };
    var s = String(val), i = s.indexOf(':');
    if (i < 0) return { type: s, status: 'existing' };
    return { type: s.slice(0, i), status: s.slice(i + 1) || 'existing' };
  }
  function statusColor(status) { return STATUS_COLORS[status] || STATUS_COLORS.existing; }
  function isAnterior(n) { n = +n; return (n >= 6 && n <= 11) || (n >= 22 && n <= 27); }
  function centerSurface(n) { return isAnterior(n) ? 'I' : 'O'; }
  function toothClass(n) {
    if ([1, 2, 3, 14, 15, 16, 17, 18, 19, 30, 31, 32].indexOf(n) > -1) return 'molar';
    if ([4, 5, 12, 13, 20, 21, 28, 29].indexOf(n) > -1) return 'premolar';
    if ([6, 11, 22, 27].indexOf(n) > -1) return 'canine';
    if ([8, 9, 24, 25].indexOf(n) > -1) return 'central';
    return 'lateral';
  }
  var IDX = { 1: '3M', 2: '2M', 3: '1M', 4: '2PM', 5: '1PM', 6: 'C', 7: 'LI', 8: 'CI', 9: 'CI', 10: 'LI', 11: 'C', 12: '1PM', 13: '2PM', 14: '1M', 15: '2M', 16: '3M', 17: '3M', 18: '2M', 19: '1M', 20: '2PM', 21: '1PM', 22: 'C', 23: 'LI', 24: 'CI', 25: 'CI', 26: 'LI', 27: 'C', 28: '1PM', 29: '2PM', 30: '1M', 31: '2M', 32: '3M' };
  var NAMES = { '3M': '3rd molar', '2M': '2nd molar', '1M': '1st molar', '2PM': '2nd premolar', '1PM': '1st premolar', 'C': 'canine', 'LI': 'lateral incisor', 'CI': 'central incisor' };
  var PLAIN = { '3M': 'third molar', '2M': 'second molar', '1M': 'first molar', '2PM': 'second premolar', '1PM': 'first premolar', 'C': 'canine', 'LI': 'lateral incisor', 'CI': 'central incisor' };
  function toothLabel(num, plain) {
    num = +num;
    var isUpper = num <= 16, isRight = (num <= 8) || (num >= 25 && num <= 32), idx = IDX[num] || '';
    if (plain) return (isUpper ? 'upper' : 'lower') + ' ' + (isRight ? 'right' : 'left') + ' ' + (PLAIN[idx] || toothClass(num));
    return (isUpper ? 'Maxillary' : 'Mandibular') + ' ' + (isRight ? 'right' : 'left') + ' ' + (NAMES[idx] || toothClass(num));
  }
  function surfaceName(num, k) {
    if (k === 'O' || k === 'I') return centerSurface(num) === 'I' ? 'incisal' : 'occlusal';
    return SURF_NAMES[k] || k;
  }

  var layoutCache = {};
  function chartLayout(width) {
    var TS = global.PDA_TOOTH_SHAPES;
    if (!TS) return null;
    var W = width || 1000;
    if (!layoutCache[W]) layoutCache[W] = TS.layout({ unit: 6 * (W / 1000), width: W });
    return layoutCache[W];
  }

  function renderTooth(num, marks, T, L, opts) {
    var TS = global.PDA_TOOTH_SHAPES;
    var m = marks || {};
    var center = centerSurface(num);
    var swapMD = (num <= 8) || (num >= 25 && num <= 32);
    var wholeRaw = m.whole || Object.keys(m).map(function (k) { return m[k]; }).filter(function (v) { return WHOLE_TYPES.indexOf(parseMarker(v).type) > -1; })[0];
    var pw = parseMarker(wholeRaw), wType = pw.type, wStatus = pw.status;
    var wCol = wType ? statusColor(wStatus) : '#475569';
    var hideSurf = ['pfm', 'fgc', 'ssc', 'missing', 'crown'].indexOf(wType) > -1;
    var ghost = wType === 'missing';
    var crowned = CROWN_TYPES.indexOf(wType) > -1;
    var all = Object.keys(m).map(function (k) { var p = parseMarker(m[k]); return { k: k, type: p.type, status: p.status }; });
    var seal = all.filter(function (p) { return p.type === 'sealant'; })[0];
    var frac = all.filter(function (p) { return p.type === 'fracture'; })[0];
    var absc = all.filter(function (p) { return p.type === 'abscess'; })[0];
    var dash = 'stroke-dasharray="3 2.5"';
    var highlight = opts && opts.highlight && opts.highlight.indexOf(num) > -1;

    // Facial view
    var f = TS.facial(num, L.U);
    var w = f.w, Hc = f.crownH, Hr = f.rootH, Ht = f.totalH;
    var fac = '';
    if (wType === 'implant') {
      var cw = w * 0.2, top = -Hc + 1.5, len = Hr * 0.82;
      fac += '<path d="M' + n1(-cw) + ' ' + n1(top) + ' L' + n1(cw) + ' ' + n1(top) + ' L' + n1(cw * 0.62) + ' ' + n1(top - len) + ' Q0 ' + n1(top - len - 3) + ' ' + n1(-cw * 0.62) + ' ' + n1(top - len) + ' Z" fill="' + wCol + '" stroke="#fff" stroke-width="0.8" pointer-events="none"/>';
      for (var y = top - 4.5; y > top - len + 3; y -= 4.5) { var k = (top - y) / len, hw = cw * (1 - 0.35 * k); fac += '<line x1="' + n1(-hw) + '" y1="' + n1(y) + '" x2="' + n1(hw) + '" y2="' + n1(y - 1.8) + '" stroke="#fff" stroke-width="1.1" pointer-events="none"/>'; }
      fac += '<rect x="' + n1(-cw * 0.7) + '" y="' + n1(-Hc - 1) + '" width="' + n1(cw * 1.4) + '" height="3.2" fill="' + wCol + '" pointer-events="none"/>';
    } else {
      f.roots.forEach(function (rt) {
        fac += '<path d="' + rt.d + '" fill="' + (ghost ? 'none' : (rt.back ? 'url(#pda-root-back)' : 'url(#pda-root)')) + '" stroke="' + (ghost ? wCol : TOOTH_INK.rootLine) + '" stroke-width="1" ' + (ghost ? dash + ' opacity=".55"' : '') + ' stroke-linejoin="round" ' + NSS + '/>';
      });
    }
    var crownAttrs;
    if (ghost) crownAttrs = 'fill="none" stroke="' + wCol + '" stroke-width="1.2" ' + dash + ' opacity=".6"';
    else if (crowned) crownAttrs = 'fill="' + wCol + '" fill-opacity=".82" stroke="' + wCol + '" stroke-width="2"';
    else if (wType === 'implant') crownAttrs = 'fill="' + TOOTH_INK.enamel + '" stroke="' + wCol + '" stroke-width="1.6"';
    else crownAttrs = 'fill="url(#pda-enamel)" stroke="' + (highlight ? '#0d9488' : TOOTH_INK.enamelLine) + '" stroke-width="' + (highlight ? 2.4 : 1.2) + '"';
    fac += '<path d="' + f.crown + '" class="tooth-shape" ' + crownAttrs + ' stroke-linejoin="round" ' + NSS + '/>';
    if (wType === 'fgc') {
      fac += '<clipPath id="crn-' + num + '"><path d="' + f.crown + '"/></clipPath><g clip-path="url(#crn-' + num + ')" pointer-events="none">';
      for (var yy = -Hc - w; yy < w; yy += 6) fac += '<line x1="' + n1(-w) + '" y1="' + n1(yy) + '" x2="' + n1(w) + '" y2="' + n1(yy + w * 0.9) + '" stroke="#fff" stroke-width="1" opacity=".7"/>';
      fac += '</g>';
    }
    if (!ghost && !crowned) f.details.forEach(function (d) { fac += '<path d="' + d + '" fill="none" stroke="#9aa8b8" stroke-width="0.9" stroke-linecap="round" opacity=".8" ' + NSS + ' pointer-events="none"/>'; });
    if (!ghost && wType !== 'implant') fac += '<path d="' + f.cej + '" fill="none" stroke="' + TOOTH_INK.gum + '" stroke-width="2.4" stroke-linecap="round" ' + NSS + ' pointer-events="none"/>';
    if (wType === 'rct') f.canals.forEach(function (c) { fac += '<line x1="' + c[0] + '" y1="' + c[1] + '" x2="' + c[2] + '" y2="' + c[3] + '" stroke="' + wCol + '" stroke-width="2.4" stroke-linecap="round" pointer-events="none"/>'; });
    if (absc) f.apices.forEach(function (a) { fac += '<circle cx="' + a[0] + '" cy="' + a[1] + '" r="4.2" fill="' + statusColor(absc.status) + '" stroke="#fff" stroke-width="0.9" pointer-events="none"/>'; });
    if (wType === 'missing' || wType === 'extract') {
      var x1 = -w * 0.42, x2 = w * 0.42, yTop = wType === 'extract' ? -(Hc + Hr * 0.35) : -Hc * 0.92, yBot = -Hc * 0.08;
      fac += '<path d="M' + n1(x1) + ' ' + n1(yTop) + ' L' + n1(x2) + ' ' + n1(yBot) + ' M' + n1(x2) + ' ' + n1(yTop) + ' L' + n1(x1) + ' ' + n1(yBot) + '" stroke="' + wCol + '" stroke-width="2.6" stroke-linecap="round" fill="none" ' + NSS + ' pointer-events="none"/>';
    }
    if (wType === 'impacted') fac += '<ellipse cx="0" cy="' + n1(-Ht / 2) + '" rx="' + n1(w * 0.64) + '" ry="' + n1(Ht * 0.56) + '" fill="none" stroke="' + wCol + '" stroke-width="2" ' + dash + ' ' + NSS + ' pointer-events="none"/>';
    if (wType === 'drift_m' || wType === 'drift_d') {
      var dir = wType === 'drift_m' ? -1 : 1, ax = w * 0.38, ay = -Hc * 0.5, hd = w * 0.16;
      fac += '<path d="M' + n1(-dir * ax) + ' ' + n1(ay) + ' L' + n1(dir * ax) + ' ' + n1(ay) + ' M' + n1(dir * (ax - hd)) + ' ' + n1(ay - hd) + ' L' + n1(dir * ax) + ' ' + n1(ay) + ' L' + n1(dir * (ax - hd)) + ' ' + n1(ay + hd) + '" stroke="' + wCol + '" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round" pointer-events="none"/>';
    }
    if (frac) {
      var b = [[0.06, -0.92], [-0.1, -0.5], [0.02, -0.5], [-0.14, -0.08], [0.16, -0.58], [0.02, -0.58]].map(function (p) { return n1(p[0] * w * 0.9) + ' ' + n1(p[1] * Hc); });
      fac += '<path d="M' + b.join(' L') + ' Z" fill="' + statusColor(frac.status) + '" stroke="#fff" stroke-width="0.6" stroke-linejoin="round" pointer-events="none"/>';
    }

    // Chewing-surface picker
    var o = TS.occlusal(num, T.pw, T.ph, { flip: !T.upper, mesialRight: swapMD });
    var pid = 'pk-' + num;
    var pk = '<clipPath id="' + pid + '"><path d="' + o.outline + '"/></clipPath>';
    if (ghost) pk += '<path d="' + o.outline + '" fill="none" stroke="' + wCol + '" stroke-width="1.2" ' + dash + ' opacity=".6" ' + NSS + ' pointer-events="none"/>';
    else if (hideSurf) pk += '<path d="' + o.outline + '" class="tooth-shape" fill="' + wCol + '" fill-opacity=".85" stroke="' + wCol + '" stroke-width="1.4" ' + NSS + ' pointer-events="none"/>';
    else {
      pk += '<g clip-path="url(#' + pid + ')">';
      ['B', 'L', 'M', 'D', center].forEach(function (k) {
        var pm = parseMarker(m[k] || '');
        var style = 'fill:' + TOOTH_INK.enamel + ';stroke:' + TOOTH_INK.zoneLine + ';stroke-width:0.8';
        if (SURF_TYPES.indexOf(pm.type) > -1) {
          var c = pm.type === 'watch' ? '#facc15' : statusColor(pm.status);
          style = pm.type === 'composite' ? 'fill:' + c + ';fill-opacity:.2;stroke:' + c + ';stroke-width:2.2' : 'fill:' + c + ';fill-opacity:.85;stroke:' + TOOTH_INK.zoneLine + ';stroke-width:0.8';
        } else if (pm.type === 'sealant') style = 'fill:#ecfccb;stroke:' + TOOTH_INK.zoneLine + ';stroke-width:0.8';
        pk += '<path d="' + o.zones[k] + '" class="surface' + (pm.type ? ' s-' + pm.type : '') + '" style="' + style + '" ' + NSS + ' data-surface="' + k + '"><title>#' + num + ' ' + surfaceName(num, k) + ' (' + k + ')</title></path>';
      });
      o.details.forEach(function (d) { pk += '<path d="' + d + '" fill="none" stroke="#b7c2cf" stroke-width="1" stroke-linecap="round" ' + NSS + ' pointer-events="none"/>'; });
      pk += '</g><path d="' + o.outline + '" class="tooth-shape" fill="none" stroke="' + (highlight ? '#0d9488' : TOOTH_INK.enamelLine) + '" stroke-width="' + (highlight ? 2.4 : 1.2) + '" ' + NSS + ' pointer-events="none"/>';
    }
    if (wType === 'fgc') { pk += '<g clip-path="url(#' + pid + ')" pointer-events="none">'; for (var y2 = -T.ph; y2 < T.ph; y2 += 6) pk += '<line x1="' + n1(-T.pw) + '" y1="' + n1(y2) + '" x2="' + n1(T.pw) + '" y2="' + n1(y2 + T.pw * 0.9) + '" stroke="#fff" stroke-width="1" opacity=".7"/>'; pk += '</g>'; }
    if (wType === 'missing' || wType === 'extract') { var hx = T.pw * 0.34, hy = T.ph * 0.34; pk += '<path d="M' + n1(-hx) + ' ' + n1(-hy) + ' L' + n1(hx) + ' ' + n1(hy) + ' M' + n1(hx) + ' ' + n1(-hy) + ' L' + n1(-hx) + ' ' + n1(hy) + '" stroke="' + wCol + '" stroke-width="2.6" stroke-linecap="round" fill="none" pointer-events="none"/>'; }
    var label = wType === 'ssc' ? 'SSC' : wType === 'pfm' ? 'PFM' : wType === 'fgc' ? 'FGC' : '';
    var txt = '';
    if (label) txt += '<text x="0" y="3.5" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="10" font-weight="800" fill="#fff" stroke="' + wCol + '" stroke-width="2" paint-order="stroke" pointer-events="none">' + label + '</text>';
    if (seal) txt += '<text x="0" y="4.5" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="13" font-weight="800" fill="' + statusColor(seal.status) + '" stroke="#fff" stroke-width="2.5" paint-order="stroke" pointer-events="none">S</text>';

    var numSvg = (highlight ? '<circle cx="' + T.x + '" cy="' + n1(T.ny - 3.5) + '" r="9" fill="none" stroke="#0d9488" stroke-width="1.5"/>' : '') +
      '<text x="' + T.x + '" y="' + T.ny + '" text-anchor="middle" font-family="SFMono-Regular, Menlo, Consolas, monospace" font-size="10.5" fill="#64748b" pointer-events="none">' + num + '</text>';
    var plain = toothLabel(num, true);
    var mk = MARKERS.filter(function (x) { return x.id === wType; })[0];
    var aria = 'Tooth ' + num + ', ' + plain + (wType ? ', ' + (mk ? mk.label : wType).toLowerCase() : '');
    return '<g class="tooth" data-tooth="' + num + '"' + (wType ? ' data-whole="' + wType + '"' : '') + ' role="button" tabindex="0" aria-label="' + esc(aria) + '">' +
      '<title>#' + num + ' — ' + toothLabel(num) + ' (' + plain + ')</title>' +
      '<g class="tooth-facial"' + (hideSurf ? '' : ' data-facial="B"') + ' transform="' + TS.transformOf(T) + '">' + fac + '</g>' +
      '<g class="tooth-occ" data-occ="1" transform="translate(' + T.x + ' ' + T.py + ')">' + pk + txt + '</g>' +
      numSvg + '</g>';
  }

  function renderArch(chart, isUpper, L, opts) {
    var teeth = isUpper ? L.upper : L.lower, byNum = {};
    teeth.forEach(function (t) { byNum[t.num] = t; });
    var s = teeth.map(function (T) { return renderTooth(T.num, chart['T-' + T.num] || {}, T, L, opts); }).join('');
    (chart.bridges || []).filter(function (b) { return (b.start <= 16) === isUpper; }).forEach(function (b) {
      var A = byNum[b.start], B = byNum[b.end]; if (!A || !B) return;
      var x1 = Math.min(A.x, B.x) - 8, x2 = Math.max(A.x, B.x) + 8, y = isUpper ? A.ny + 8 : A.ny - 14, leg = isUpper ? -5 : 5, color = statusColor(b.status || 'existing');
      s += '<path d="M' + n1(x1) + ' ' + n1(y + leg) + ' L' + n1(x1) + ' ' + n1(y) + ' L' + n1(x2) + ' ' + n1(y) + ' L' + n1(x2) + ' ' + n1(y + leg) + '" fill="none" stroke="' + color + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" pointer-events="none"/>';
    });
    (chart.diastemas || []).filter(function (d) { return (d.a <= 16) === isUpper; }).forEach(function (d) {
      var A = byNum[d.a], B = byNum[d.b]; if (!A || !B || Math.abs(d.a - d.b) !== 1) return;
      var x = (A.x + B.x) / 2, h = Math.max(A.ph, B.ph) / 2 + 3, y = A.py, color = statusColor(d.status || 'existing');
      s += '<path d="M' + n1(x - 2.5) + ' ' + n1(y - h) + ' V' + n1(y + h) + ' M' + n1(x + 2.5) + ' ' + n1(y - h) + ' V' + n1(y + h) + '" stroke="' + color + '" stroke-width="2" stroke-linecap="round" fill="none" pointer-events="none"/>';
    });
    return s;
  }

  function render(chart, opts) {
    opts = opts || {};
    chart = chart || {};
    var L = chartLayout(opts.width);
    if (!L) return '<div style="color:#be123c;font-size:12px;padding:12px">The tooth chart art (assets/tooth-shapes.js) did not load. Reload the page.</div>';
    var W = L.W, H = L.H, cx = L.cx, yMid = L.yMid;
    var lab = 'font-family="Inter, system-ui, sans-serif" font-size="10.5" font-weight="700" letter-spacing="1.2" fill="#64748b" text-anchor="middle" pointer-events="none"';
    var edge = 'font-family="Inter, system-ui, sans-serif" font-size="9.5" font-weight="700" letter-spacing="1" fill="#475569" text-anchor="middle" pointer-events="none"';
    var labels = opts.labels !== false;
    return '<svg class="pda-odontogram" viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="display:block;height:auto;max-width:' + W + 'px;margin:0 auto" role="group" aria-label="Tooth chart. You are facing the patient, so their right is on your left." oncontextmenu="return false">' +
      '<defs>' +
        '<linearGradient id="pda-enamel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f1ebdf"/><stop offset=".45" stop-color="#fbfaf6"/><stop offset="1" stop-color="#ffffff"/></linearGradient>' +
        '<linearGradient id="pda-root" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e6c9a6"/><stop offset="1" stop-color="#f4e5d2"/></linearGradient>' +
        '<linearGradient id="pda-root-back" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d6b590"/><stop offset="1" stop-color="#e8cfb2"/></linearGradient>' +
      '</defs>' +
      '<line x1="' + cx + '" y1="8" x2="' + cx + '" y2="' + (H - 8) + '" stroke="#cbd5e1" stroke-width="1" stroke-dasharray="5 4" pointer-events="none"/>' +
      (labels ? '<text x="' + cx + '" y="' + n1(yMid + 3.5) + '" ' + lab + ' font-size="8" fill="#94a3b8" stroke="#fff" stroke-width="4" paint-order="stroke">MIDLINE</text>' +
        '<text x="' + (cx / 2) + '" y="20" ' + lab + '>UPPER RIGHT</text><text x="' + (cx * 1.5) + '" y="20" ' + lab + '>UPPER LEFT</text>' +
        '<text x="' + (cx / 2) + '" y="' + (H - 12) + '" ' + lab + '>LOWER RIGHT</text><text x="' + (cx * 1.5) + '" y="' + (H - 12) + '" ' + lab + '>LOWER LEFT</text>' +
        '<text x="52" y="' + n1(yMid - 2) + '" ' + edge + '><tspan x="52">PATIENT\'S </tspan><tspan x="52" dy="12">RIGHT</tspan></text>' +
        '<text x="' + (W - 52) + '" y="' + n1(yMid - 2) + '" ' + edge + '><tspan x="' + (W - 52) + '">PATIENT\'S </tspan><tspan x="' + (W - 52) + '" dy="12">LEFT</tspan></text>' : '') +
      '<g class="arch arch-upper">' + renderArch(chart, true, L, opts) + '</g>' +
      '<g class="arch arch-lower">' + renderArch(chart, false, L, opts) + '</g>' +
    '</svg>';
  }

  function mount(el, chart, opts) {
    el.innerHTML = render(chart, opts);
    return el.querySelector('svg');
  }

  // Click + keyboard: a chewing-surface zone carries data-surface; the facial
  // drawing carries data-facial="B"; the number/crown is a whole-tooth tap.
  function bind(el, handlers) {
    handlers = handlers || {};
    if (el.__pdaOdontoBound) return;
    el.__pdaOdontoBound = true;
    el.addEventListener('click', function (ev) {
      var t = ev.target.closest ? ev.target.closest('[data-tooth]') : null;
      if (!t) return;
      var tooth = +t.getAttribute('data-tooth');
      var surf = ev.target.closest('[data-surface],[data-facial]');
      if (surf && handlers.onSurface) {
        var k = surf.getAttribute('data-surface') || surf.getAttribute('data-facial');
        if (k === 'O' || k === 'I') k = centerSurface(tooth);
        handlers.onSurface(tooth, k, ev);
      } else if (handlers.onTooth) {
        handlers.onTooth(tooth, ev);
      }
    });
    el.addEventListener('keydown', function (ev) {
      if (ev.key !== 'Enter' && ev.key !== ' ') return;
      var t = ev.target.closest ? ev.target.closest('[data-tooth][role="button"]') : null;
      if (!t) return;
      ev.preventDefault();
      if (handlers.onTooth) handlers.onTooth(+t.getAttribute('data-tooth'), ev);
    });
  }

  global.PDA_ODONTOGRAM = {
    version: 1,
    MARKERS: MARKERS, SURF_NAMES: SURF_NAMES, WHOLE_TYPES: WHOLE_TYPES, SURF_TYPES: SURF_TYPES, STATUS_COLORS: STATUS_COLORS,
    parseMarker: parseMarker, statusColor: statusColor, isAnterior: isAnterior, centerSurface: centerSurface,
    toothLabel: toothLabel, surfaceName: surfaceName, layout: chartLayout,
    render: render, mount: mount, bind: bind
  };
})(typeof window !== 'undefined' ? window : globalThis);
