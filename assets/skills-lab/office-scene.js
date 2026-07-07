/* ============================================================================
   PREMIER DENTAL ACADEMY — SKILLS LAB · OFFICE SCENE  (window.SL_SCENE)
   ----------------------------------------------------------------------------
   The illustrated Virtual Dental Office: a layered-SVG operatory drawn in
   one-point perspective (patient chair, dentist, assistant, delivery unit,
   op light, x-ray arm, rear cabinetry + charting monitor) plus a separate
   sterilization room, all in ONE master composition. "Camera" moves are
   animated viewBox transitions.

     SL_SCENE.mount(el, opts) -> ctrl
       opts: { mode:'room'|'chairside'|'steri', patientId, onStation(key),
               locked(key)->bool }
       ctrl.setMode(mode, {patientId})   animated camera move
       ctrl.setPatient(patientId|null)   swap who's in the chair
       ctrl.setSpeaker(key|null)         highlight dentist|patient|assistant
       ctrl.repaintPins(exploredMap)     green "done" pins
       ctrl.repaintLocks(lockedFn)       amber locked pins
       ctrl.destroy()

   Plain ES5 global script, no dependencies. Degrades to nothing if unused.
   ============================================================================ */
(function (g) {
  'use strict';

  /* ---------------- camera framings (viewBox) ---------------- */
  var VIEWS = {
    room:      [0, 0, 1600, 1000],
    chairside: [668, 412, 760, 475],
    steri:     [1700, 0, 1600, 1000]
  };

  /* ---------------- station pin anchors (scene coords) ---------------- */
  var ANCHORS = {
    dentist:   [1252, 468],
    patient:   [870, 655],
    assistant: [1130, 800],
    light:     [1014, 352],
    tray:      [828, 528],
    suction:   [1222, 892],
    xray:      [330, 452],
    computer:  [1237, 350],
    steri:     [138, 400]
  };

  /* ---------------- palettes ---------------- */
  var SKIN = {
    porcelain: { base:'#f2d4bf', hi:'#fbe8da', sh:'#d8a488', ln:'#a2634a' },
    fair:      { base:'#efc7a5', hi:'#f8dfc4', sh:'#d29b70', ln:'#935e3b' },
    golden:    { base:'#eabf92', hi:'#f5d8b1', sh:'#c9925f', ln:'#855834' },
    olive:     { base:'#dfb083', hi:'#eecaa3', sh:'#ba8455', ln:'#7a522f' },
    tan:       { base:'#cd9a69', hi:'#e1b786', sh:'#a56f3e', ln:'#694322' },
    brown:     { base:'#a7724a', hi:'#bf8c60', sh:'#7c5131', ln:'#482c17' },
    deep:      { base:'#7e5133', hi:'#976742', sh:'#5c3721', ln:'#301c0e' }
  };

  /* per-persona looks for the reclined patient — derived from the people-art
     CAST so the person in the chair matches their dialogue bust */
  var PSTYLE = {
    p_crown: { skin:'tan',       hair:'#4a3629', style:'bob',   gray:true, shirt:'#a8623e' }, /* Maria: gray-streaked bob */
    p_comp:  { skin:'brown',     hair:'#15100c', style:'crop',  shirt:'#4c5b45' },            /* Darnell */
    p_ext:   { skin:'porcelain', hair:'#d7d9dc', style:'curls', shirt:'#7386a5' },            /* Joyce: silver curl cap */
    p_emerg: { skin:'golden',    hair:'#131110', style:'crop',  shirt:'#41546e' },            /* Tyler */
    p_exam:  { skin:'tan',       hair:'#1c1310', style:'long',  shirt:'#b0813a' },            /* Priya */
    p_hyg:   { skin:'fair',      hair:'#95897b', style:'recede',shirt:'#5e7261' },            /* Frank */
    p_pedo:  { skin:'porcelain', hair:'#7a5330', style:'pig',   shirt:'#e8766a', child:true },/* Emma */
    p_endo:  { skin:'brown',     hair:'#1d1510', style:'curls', shirt:'#68498a' },            /* Gloria */
    'default': { skin:'fair',    hair:'#5b4632', style:'crop',  shirt:'#61708a' }
  };

  function shade(hex, f) {
    var m = /^#([0-9a-f]{6})$/i.exec(hex); if (!m) return hex;
    var v = parseInt(m[1], 16), r = (v >> 16) & 255, gg = (v >> 8) & 255, b = v & 255;
    function c(x) { x = f > 1 ? x + (255 - x) * (f - 1) : x * f; return Math.max(0, Math.min(255, Math.round(x))); }
    function h(x) { x = x.toString(16); return x.length < 2 ? '0' + x : x; }
    return '#' + h(c(r)) + h(c(gg)) + h(c(b));
  }

  /* ---------------- tiny svg builders ---------------- */
  function P(d, fill, extra) { return '<path d="' + d + '" fill="' + fill + '"' + (extra ? ' ' + extra : '') + '/>'; }
  function LN(d, stroke, w, extra) { return '<path d="' + d + '" fill="none" stroke="' + stroke + '" stroke-width="' + w + '"' + (extra ? ' ' + extra : '') + '/>'; }
  function RR(x, y, w, h, r, fill, extra) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + r + '" fill="' + fill + '"' + (extra ? ' ' + extra : '') + '/>'; }
  function EL(cx, cy, rx, ry, fill, extra) { return '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" fill="' + fill + '"' + (extra ? ' ' + extra : '') + '/>'; }
  function CR(cx, cy, r, fill, extra) { return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + fill + '"' + (extra ? ' ' + extra : '') + '/>'; }
  function TXT(x, y, s, size, fill, extra) {
    return '<text x="' + x + '" y="' + y + '" font-size="' + size + '" fill="' + fill + '" font-family="Inter,system-ui,sans-serif"' + (extra ? ' ' + extra : '') + '>' + s + '</text>';
  }
  function poly(pts, fill, extra) {
    var d = 'M' + pts.map(function (p) { return p[0] + ' ' + p[1]; }).join('L') + 'Z';
    return P(d, fill, extra);
  }

  /* one-point perspective: floor line through the vanishing point */
  var VPX = 800, VPY = 430;
  function floorX(xb, y) { /* x at depth y for a plank edge that hits the back floor line (y=640) at xb */
    return VPX + (xb - VPX) * (y - VPY) / (640 - VPY);
  }

  /* ==========================================================================
     DEFS — gradients & filters shared by the whole composition
     ========================================================================== */
  function defs() {
    var s = '<defs>';
    function lg(id, stops, x1, y1, x2, y2) {
      s += '<linearGradient id="' + id + '" x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '">';
      stops.forEach(function (st) { s += '<stop offset="' + st[0] + '" stop-color="' + st[1] + '"' + (st[2] != null ? ' stop-opacity="' + st[2] + '"' : '') + '/>'; });
      s += '</linearGradient>';
    }
    function rg(id, stops) {
      s += '<radialGradient id="' + id + '">';
      stops.forEach(function (st) { s += '<stop offset="' + st[0] + '" stop-color="' + st[1] + '"' + (st[2] != null ? ' stop-opacity="' + st[2] + '"' : '') + '/>'; });
      s += '</radialGradient>';
    }
    lg('voWallB', [[0, '#f6f3ec'], [0.7, '#ece8dd'], [1, '#e2ddd0']], 0, 0, 0, 1);
    lg('voWallL', [[0, '#eae6d9'], [1, '#d8d3c3']], 0, 0, 1, 0);
    lg('voWallR', [[0, '#d8d3c3'], [1, '#eae6d9']], 0, 0, 1, 0);
    lg('voCeil', [[0, '#fcfbf8'], [1, '#e9e6de']], 0, 0, 0, 1);
    lg('voFloor', [[0, '#cdb18b'], [0.5, '#c0a076'], [1, '#a8875d']], 0, 0, 0, 1);
    lg('voUph', [[0, '#1cae9f'], [0.45, '#0f9187'], [1, '#0a6c62']], 0, 0, 0, 1);
    lg('voUphD', [[0, '#0f8579'], [1, '#085248']], 0, 0, 0, 1);
    lg('voChrome', [[0, '#f4f7f9'], [0.35, '#c8d1d7'], [0.6, '#96a3ac'], [0.8, '#d9e0e4'], [1, '#aeb9c0']], 0, 0, 0, 1);
    lg('voChromeH', [[0, '#f4f7f9'], [0.35, '#c8d1d7'], [0.6, '#96a3ac'], [0.8, '#d9e0e4'], [1, '#aeb9c0']], 0, 0, 1, 0);
    lg('voSteel', [[0, '#f0f3f4'], [1, '#c2cbd1']], 0, 0, 0, 1);
    lg('voCab', [[0, '#f7f5f0'], [1, '#e6e2d8']], 0, 0, 0, 1);
    lg('voCabLow', [[0, '#e9e5db'], [1, '#d6d1c3']], 0, 0, 0, 1);
    lg('voCounter', [[0, '#fbfaf7'], [1, '#dedacf']], 0, 0, 0, 1);
    lg('voWin', [[0, '#cfe8f7'], [0.6, '#e6f4fc'], [1, '#f7fbf4']], 0, 0, 0, 1);
    lg('voScreen', [[0, '#12283f'], [1, '#0a1626']], 0, 0, 0, 1);
    lg('voCone', [[0, '#fff8e1', 0.45], [1, '#fff8e1', 0.02]], 0, 0, 0, 1);
    lg('voHose', [[0, '#aab6bd'], [0.5, '#8b979e'], [1, '#aab6bd']], 0, 0, 1, 0);
    lg('voAuto', [[0, '#f2f4f5'], [0.6, '#d7dde0'], [1, '#b9c2c7']], 0, 0, 0, 1);
    rg('voAO', [[0, '#1f2937', 0.4], [1, '#1f2937', 0]]);
    rg('voGlow', [[0, '#fff7e0', 0.95], [1, '#fff7e0', 0]]);
    rg('voVign', [[0.62, '#0f172a', 0], [1, '#0f172a', 0.16]]);
    /* skin gradients */
    Object.keys(SKIN).forEach(function (k) {
      lg('voSk_' + k, [[0, SKIN[k].hi], [0.5, SKIN[k].base], [1, SKIN[k].sh]], 0, 0, 0.6, 1);
    });
    s += '<filter id="voSpeak" x="-40%" y="-40%" width="180%" height="180%">' +
      '<feDropShadow dx="0" dy="0" stdDeviation="10" flood-color="#2dd4bf" flood-opacity="0.9"/>' +
      '<feDropShadow dx="0" dy="0" stdDeviation="3" flood-color="#99f6e4" flood-opacity="0.9"/></filter>';
    s += '<filter id="voBlur6"><feGaussianBlur stdDeviation="6"/></filter>';
    s += '</defs>';
    return s;
  }

  /* ==========================================================================
     ROOM SHELL — walls, ceiling, floor in one-point perspective
     ========================================================================== */
  function roomShell() {
    var s = '';
    /* ceiling / walls / floor */
    s += poly([[0, 0], [1600, 0], [1360, 120], [240, 120]], 'url(#voCeil)');
    s += poly([[0, 0], [240, 120], [240, 640], [0, 1000]], 'url(#voWallL)');
    s += poly([[1600, 0], [1360, 120], [1360, 640], [1600, 1000]], 'url(#voWallR)');
    s += RR(240, 120, 1120, 520, 0, 'url(#voWallB)');
    /* wall/ceiling seams */
    s += LN('M240 120L1360 120', '#d3cec0', 2);
    s += LN('M0 0L240 120M1600 0L1360 120', '#ddd8ca', 2);
    /* teal accent band low on the back wall */
    s += RR(240, 560, 1120, 16, 0, '#0f766e', 'opacity="0.16"');
    /* baseboard */
    s += RR(240, 626, 1120, 14, 0, '#cfc9b9');
    s += LN('M240 640L0 1000M1360 640L1600 1000', '#cfc9b9', 10);

    /* floor */
    s += poly([[0, 1000], [1600, 1000], [1360, 640], [240, 640]], 'url(#voFloor)');
    /* wood planks: converging joints + horizontal seams, clipped to the floor */
    s += '<clipPath id="voFloorC"><path d="M0 1000L1600 1000L1360 640L240 640Z"/></clipPath>';
    s += '<g clip-path="url(#voFloorC)">';
    var xb;
    for (xb = 40; xb < 1600; xb += 110) {
      s += LN('M' + floorX(xb, 640) + ' 640L' + floorX(xb, 1000) + ' 1000', '#96794f', 1.6, 'opacity="0.5"');
    }
    [664, 696, 738, 792, 860, 936].forEach(function (y, i) {
      s += LN('M0 ' + y + 'L1600 ' + y, '#8d7148', 1.4, 'opacity="' + (0.35 + i * 0.04) + '"');
    });
    s += '</g>';
    /* soft sheen on the floor */
    s += poly([[540, 1000], [1240, 1000], [1120, 700], [700, 700]], '#fff6dd', 'opacity="0.10" filter="url(#voBlur6)"');
    return s;
  }

  /* recessed ceiling lights */
  function ceilingLights() {
    var s = '';
    [[560, 34, 250], [980, 34, 250]].forEach(function (l) {
      s += poly([[l[0], l[1]], [l[0] + l[2], l[1]], [l[0] + l[2] - 26, l[1] + 40], [l[0] + 26, l[1] + 40]], '#e2dfd6');
      s += poly([[l[0] + 8, l[1] + 5], [l[0] + l[2] - 8, l[1] + 5], [l[0] + l[2] - 30, l[1] + 34], [l[0] + 30, l[1] + 34]], '#fefdf6', 'class="vo-panel"');
    });
    return s;
  }

  /* ==========================================================================
     BACK WALL FURNISHINGS
     ========================================================================== */
  function windowArt() {
    var s = '';
    /* window frame + daylight + blinds */
    s += RR(288, 168, 288, 262, 6, '#dcd6c6');
    s += RR(300, 180, 264, 238, 4, 'url(#voWin)');
    /* soft outside greenery, clipped to the glass */
    s += '<clipPath id="voWinC"><rect x="300" y="180" width="264" height="238" rx="4"/></clipPath>';
    s += '<g clip-path="url(#voWinC)">';
    s += EL(360, 408, 90, 46, '#a9c99a', 'opacity="0.8"');
    s += EL(480, 404, 110, 52, '#8fb884', 'opacity="0.75"');
    s += EL(430, 364, 60, 30, '#bcd8ae', 'opacity="0.7"');
    s += '</g>';
    /* blinds: slats over the top 60% */
    var y;
    for (y = 186; y < 322; y += 13) {
      s += RR(300, y, 264, 7, 2, '#f3efe4', 'opacity="0.96"');
      s += RR(300, y + 7, 264, 2.4, 1, '#cfc8b4', 'opacity="0.8"');
    }
    s += RR(300, 322, 264, 8, 2, '#e8e2d2');
    s += LN('M540 186L540 330', '#b9b19c', 2);
    /* mullions */
    s += LN('M432 330L432 418', '#cfc9b8', 4);
    s += RR(288, 424, 288, 10, 3, '#cfc9b8');
    /* light spill from the window onto the wall */
    s += poly([[300, 180], [564, 180], [620, 560], [260, 560]], '#fffbe8', 'opacity="0.07"');
    /* framed diploma + art between window and cabinets */
    s += RR(622, 196, 96, 122, 3, '#8a6d3b');
    s += RR(630, 204, 80, 106, 2, '#f8f6ef');
    s += LN('M640 236h60M640 252h60M640 268h44', '#b9b3a2', 4, 'stroke-linecap="round"');
    s += CR(670, 292, 9, '#c9a94e'); /* seal */
    s += LN('M666 300l-5 12M674 300l5 12', '#b23a48', 3);
    /* wall clock */
    s += CR(688, 152, 25, '#fbfaf6', 'stroke="#c6c0b0" stroke-width="4"');
    s += LN('M688 152L688 136M688 152L699 158', '#334155', 3, 'stroke-linecap="round"');
    s += CR(688, 152, 2.6, '#334155');
    return s;
  }

  function cabinetry() {
    var s = '';
    /* upper cabinets */
    s += RR(756, 148, 588, 140, 4, 'url(#voCab)');
    [758, 905, 1052, 1199].forEach(function (x) {
      s += RR(x + 4, 154, 139, 128, 3, '#f2efe7', 'stroke="#d8d3c5" stroke-width="2"');
      s += RR(x + 14, 210, 4, 42, 2, '#9aa2a8'); /* handle */
    });
    s += RR(756, 286, 588, 8, 2, '#d8d2c2');
    /* under-cabinet task light glow */
    s += RR(766, 294, 568, 5, 2, '#fff3c9', 'opacity="0.8"');
    s += poly([[766, 299], [1334, 299], [1310, 360], [790, 360]], '#fff3c9', 'opacity="0.10"');

    /* lower cabinets + counter */
    s += RR(756, 468, 588, 158, 3, 'url(#voCabLow)');
    /* drawer/door fronts */
    [[760, 100], [864, 100], [968, 140], [1112, 112], [1228, 112]].forEach(function (c) {
      s += RR(c[0] + 3, 474, c[1] - 6, 44, 3, '#efece2', 'stroke="#d2ccbc" stroke-width="2"');
      s += RR(c[0] + 3, 522, c[1] - 6, 98, 3, '#efece2', 'stroke="#d2ccbc" stroke-width="2"');
      s += RR(c[0] + c[1] / 2 - 16, 480, 32, 4, 2, '#9aa2a8');
      s += RR(c[0] + c[1] / 2 - 16, 528, 32, 4, 2, '#9aa2a8');
    });
    s += RR(756, 620, 588, 8, 0, '#b6b0a0'); /* kick */
    /* counter top with a lip */
    s += RR(748, 444, 604, 26, 5, 'url(#voCounter)');
    s += RR(748, 462, 604, 8, 3, '#c9c3b3');

    /* sink + gooseneck faucet */
    s += EL(846, 452, 52, 12, '#c3cdd2');
    s += EL(846, 451, 44, 9, '#8fa0a9');
    s += LN('M886 446C886 408 872 402 852 404', 'url(#voChrome)', 8, 'stroke-linecap="round"');
    s += LN('M852 404l0 10', '#7d8b93', 5, 'stroke-linecap="round"');
    s += RR(880, 436, 12, 12, 3, '#b9c3c9');
    /* soap + towel */
    s += RR(920, 424, 16, 30, 4, '#cfe3ea');
    s += RR(923, 416, 10, 10, 2, '#9db7c1');

    /* wall-mounted glove boxes (S/M/L) */
    [[978, '#e0e7ff', '#6272a8'], [1052, '#d6f0ec', '#0f766e'], [1126, '#fce7f3', '#a85a80']].forEach(function (b) {
      s += RR(b[0], 318, 64, 40, 4, b[1], 'stroke="#c9c3b5" stroke-width="2"');
      s += EL(b[0] + 32, 338, 16, 8, '#ffffff');
      s += EL(b[0] + 32, 338, 16, 8, b[2], 'opacity="0.35"');
      s += RR(b[0] + 8, 324, 20, 5, 2, b[2], 'opacity="0.6"');
    });
    /* sharps container */
    s += RR(1210, 314, 52, 48, 5, '#d33131');
    s += RR(1210, 314, 52, 12, 5, '#a62222');
    s += RR(1222, 310, 28, 8, 3, '#7e1a1a');
    s += TXT(1219, 348, '&#9763;', 16, '#fff');
    /* cotton jars with amber lids */
    s += RR(1288, 414, 22, 40, 6, '#f4f7f8', 'opacity="0.92" stroke="#c9d2d6" stroke-width="1.5"');
    s += RR(1286, 408, 26, 10, 4, '#e0a72e');
    s += RR(1316, 422, 20, 32, 5, '#f4f7f8', 'opacity="0.92" stroke="#c9d2d6" stroke-width="1.5"');
    s += RR(1314, 416, 24, 9, 4, '#0f766e');
    return s;
  }

  /* the charting monitor above the counter */
  function monitor() {
    var s = '';
    /* arm from wall */
    s += RR(1160, 342, 14, 40, 4, '#8f9aa2');
    s += LN('M1167 360L1200 356', '#8f9aa2', 10, 'stroke-linecap="round"');
    /* screen */
    s += RR(1176, 296, 160, 112, 6, '#1e293b');
    s += RR(1181, 301, 150, 96, 3, 'url(#voScreen)');
    /* charting UI */
    s += RR(1181, 301, 150, 14, 3, '#0d9488');
    s += TXT(1186, 311.5, 'PATIENT CHART', 8.6, '#ffffff', 'font-weight="700"');
    /* two arches of teeth (neutral — the chart follows whoever is seated) */
    var i, x;
    for (i = 0; i < 14; i++) {
      x = 1188 + i * 9.8;
      s += RR(x, 324, 7.4, 11, 2, '#e7edf3');
      s += RR(x, 352, 7.4, 11, 2, '#e7edf3');
    }
    s += TXT(1186, 322, 'UPPER', 5.5, '#7ba3b8');
    s += TXT(1186, 350, 'LOWER', 5.5, '#7ba3b8');
    s += LN('M1186 372h140', '#155e75', 1.5);
    s += RR(1186, 377, 62, 8, 2, '#123a52');
    s += RR(1252, 377, 44, 8, 2, '#123a52');
    s += TXT(1189, 383.4, 'Tx plan', 5.6, '#7dd3fc');
    s += TXT(1255, 383.4, 'Next visit', 5.6, '#7dd3fc');
    s += P('M1181 301L1231 301L1196 397L1181 397Z', '#bfe9ff', 'opacity="0.06"');
    /* keyboard on counter */
    s += RR(1198, 430, 96, 14, 4, '#d7dce0');
    s += LN('M1206 437h80', '#aab3b9', 4, 'stroke-dasharray="5 3"');
    return s;
  }

  /* sterilization pass-through door on the LEFT wall (perspective quad) */
  function steriDoor() {
    var s = '';
    s += poly([[74, 236], [206, 296], [206, 610], [74, 700]], '#e3ded0', 'stroke="#c8c2b1" stroke-width="3"');
    s += poly([[88, 254], [192, 306], [192, 596], [88, 678]], '#efeadd');
    /* small window in the door, below the sign */
    s += poly([[112, 346], [176, 372], [176, 458], [112, 444]], '#cfe0e6', 'stroke="#aebfc6" stroke-width="2"');
    s += CR(178, 486, 6, '#8f9aa2');
    /* sign — fully on the door leaf, following the door's perspective */
    s += poly([[94, 264], [186, 306], [186, 340], [94, 302]], '#0f766e');
    s += TXT(0, 0, 'STERILIZATION', 11, '#ffffff', 'font-weight="800" transform="translate(100,286) rotate(24.5)"');
    s += TXT(0, 0, 'DIRTY &#8594; CLEAN', 8, '#99f6e4', 'font-weight="700" transform="translate(100,299) rotate(24.5)"');
    return s;
  }

  /* x-ray tube head on its folding arm — mounted to the WALL between the
     door frame and the window, never to the door leaf */
  function xrayArm() {
    var s = '';
    s += poly([[212, 298], [238, 306], [238, 360], [212, 354]], '#d8d3c4', 'stroke="#bcb6a4" stroke-width="2"');
    s += LN('M232 328L300 306', '#b9c1c7', 12, 'stroke-linecap="round"');
    s += LN('M232 328L300 306', '#e6ebee', 4, 'stroke-linecap="round"');
    s += CR(300, 306, 10, 'url(#voChrome)');
    s += LN('M300 306L292 452', '#b9c1c7', 11, 'stroke-linecap="round"');
    s += LN('M300 306L292 452', '#e6ebee', 3.6, 'stroke-linecap="round"');
    s += CR(292, 452, 9, 'url(#voChrome)');
    /* tube head: rounded body + BID cone aimed toward the chair */
    s += '<g transform="rotate(26 330 470)">';
    s += RR(288, 448, 84, 46, 20, 'url(#voSteel)', 'stroke="#a9b3ba" stroke-width="2"');
    s += RR(294, 454, 30, 34, 12, '#ffffff', 'opacity="0.5"');
    s += RR(366, 458, 34, 26, 6, '#cdd6db', 'stroke="#a9b3ba" stroke-width="2"');
    s += EL(400, 471, 6, 13, '#8fa0a9');
    s += CR(304, 486, 4, '#f59e0b');
    s += '</g>';
    s += LN('M300 490C290 520 310 548 298 578', '#9aa5ac', 4);
    return s;
  }

  /* corner plant */
  function plant() {
    var s = '';
    s += EL(158, 856, 66, 16, 'url(#voAO)');
    s += P('M120 790L196 790L188 860L128 860Z', '#a98f6d');
    s += RR(120, 782, 76, 12, 4, '#8a7052');
    var leaves = [[158, 700, -18], [138, 716, -40], [180, 712, 16], [158, 672, 0], [122, 744, -58], [194, 740, 46]];
    leaves.forEach(function (l) {
      s += P('M158 788C' + (l[0] - 16) + ' ' + (l[1] + 40) + ' ' + (l[0] - 14) + ' ' + (l[1] + 12) + ' ' + l[0] + ' ' + l[1] +
        'C' + (l[0] + 16) + ' ' + (l[1] + 14) + ' ' + (l[0] + 12) + ' ' + (l[1] + 44) + ' 158 788Z', l[2] % 2 ? '#3e7a52' : '#4f9163');
      s += LN('M158 786Q' + (l[0] + (l[2] > 0 ? 4 : -4)) + ' ' + (l[1] + 46) + ' ' + l[0] + ' ' + (l[1] + 8), '#2f5e40', 2, 'opacity="0.6"');
    });
    return s;
  }

  /* ==========================================================================
     DELIVERY UNIT — cart with handpieces + curly hoses, feeds the tray arm
     ========================================================================== */
  function deliveryUnit() {
    var s = '';
    /* console */
    s += RR(506, 528, 160, 58, 14, 'url(#voSteel)', 'stroke="#aab4bb" stroke-width="2"');
    s += RR(514, 536, 144, 12, 6, '#dfe6e9');
    s += CR(648, 560, 7, '#0d9488');
    s += CR(648, 560, 3, '#083f39');
    /* handpiece holders + hanging handpieces with curly hoses */
    [[528, '#c9d2d8'], [560, '#c9d2d8'], [592, '#c9d2d8']].forEach(function (hp, i) {
      var x = hp[0];
      s += RR(x - 7, 584, 14, 12, 4, '#7d8b93');
      /* handpiece: tapered chrome pen */
      s += P('M' + (x - 4) + ' 594L' + (x + 4) + ' 594L' + (x + 2.6) + ' 636L' + (x - 2.6) + ' 636Z', 'url(#voChromeH)', 'stroke="#8b979e" stroke-width="1"');
      s += RR(x - 4.6, 598, 9.2, 5, 2, i === 1 ? '#0f766e' : '#4b5563');
      /* curly hose */
      var d = 'M' + x + ' 636', y;
      for (y = 644; y <= 700; y += 14) d += ' C ' + (x - 13) + ' ' + (y - 4) + ' ' + (x - 13) + ' ' + (y + 6) + ' ' + x + ' ' + (y + 3) + ' C ' + (x + 13) + ' ' + y + ' ' + (x + 13) + ' ' + (y + 10) + ' ' + x + ' ' + (y + 8);
      s += LN(d, '#8b979e', 5, 'stroke-linecap="round" opacity="0.95"');
    });
    /* air-water syringe on the end holder */
    s += RR(617, 584, 14, 12, 4, '#7d8b93');
    s += LN('M624 596L624 622', 'url(#voChromeH)', 8, 'stroke-linecap="round"');
    s += LN('M624 600L638 590', '#9aa5ac', 6, 'stroke-linecap="round"');
    s += CR(621, 604, 2.4, '#0d9488'); s += CR(628, 604, 2.4, '#38bdf8');
    s += LN('M624 622C616 648 632 668 624 690', '#8b979e', 4);
    return s;
  }

  /* the cart's pole + caster base, drawn AFTER the chair/patient so the unit
     visibly stands on the floor in front of the chair's foot end */
  function deliveryBase() {
    var s = '';
    s += EL(586, 736, 78, 15, 'url(#voAO)');
    /* pole from the console down to the base */
    s += RR(578, 580, 14, 146, 6, 'url(#voChromeH)');
    /* caster base */
    s += P('M528 722L644 722L636 740L536 740Z', '#9aa5ac');
    s += P('M528 722L644 722L642 727L531 727Z', '#c3ced4');
    [540, 586, 632].forEach(function (x) { s += CR(x, 742, 8, '#4b5563'); s += CR(x, 742, 3.4, '#9aa5ac'); });
    return s;
  }

  /* tray arm + stainless tray WITH instruments, positioned over the chest.
     Contents vary a little with the procedure so the setup matches the visit. */
  function trayArm(pid) {
    var s = '';
    /* arm from the delivery pole to under the tray */
    s += LN('M592 588L742 566', '#aab4bb', 10, 'stroke-linecap="round"');
    s += LN('M742 566L800 560', '#aab4bb', 9, 'stroke-linecap="round"');
    s += CR(742, 566, 8, 'url(#voChrome)');
    /* stainless tray in perspective */
    s += poly([[742, 546], [918, 528], [936, 566], [758, 586]], 'url(#voSteel)', 'stroke="#96a3ac" stroke-width="2.5"');
    s += poly([[754, 549], [910, 534], [924, 562], [766, 578]], '#cfe0e8'); /* paper liner */
    s += poly([[754, 549], [910, 534], [913, 540], [757, 555]], '#ffffff', 'opacity="0.55"');
    /* instruments: mirror, explorer, cotton pliers, gauze */
    /* mirror */
    s += LN('M778 572L836 545', '#4b5563', 3.8, 'stroke-linecap="round"');
    s += CR(841, 543, 7, 'url(#voChrome)', 'stroke="#475569" stroke-width="1.8"');
    s += CR(841, 543, 4.2, '#dcedf3');
    /* explorer with curved tip */
    s += LN('M792 576L852 550', '#4b5563', 3.2, 'stroke-linecap="round"');
    s += LN('M852 550C860 546 862 540 857 537', '#334155', 2.6, 'stroke-linecap="round"');
    /* cotton pliers */
    s += LN('M806 580L868 556M809 582L870 559', '#4b5563', 2.8, 'stroke-linecap="round"');
    /* gauze stack */
    s += RR(878, 548, 26, 18, 2, '#ffffff', 'transform="rotate(-8 891 557)" stroke="#b6c4cc" stroke-width="2"');
    s += LN('M880 553h22M880 558h22', '#d3dfe5', 2, 'transform="rotate(-8 891 557)"');
    /* procedure-specific additions */
    if (pid === 'p_ext') {
      /* extraction forceps: hinged handles + curved beaks */
      s += LN('M824 582L878 562M830 585L882 566', '#475569', 3.6, 'stroke-linecap="round"');
      s += CR(852, 572, 3.2, '#334155');
      s += LN('M878 562C886 558 890 552 887 547M882 566C890 563 895 558 893 552', '#334155', 2.8, 'stroke-linecap="round"');
    } else if (pid === 'p_crown' || pid === 'p_comp') {
      /* high-speed handpiece resting on the tray */
      s += LN('M818 584L866 566', '#7d8b93', 6, 'stroke-linecap="round"');
      s += LN('M866 566L878 559', '#aab4bb', 5, 'stroke-linecap="round"');
      s += LN('M878 559L878 552', '#475569', 3.4, 'stroke-linecap="round"');
    } else if (pid === 'p_endo') {
      /* endo file organizer block */
      s += RR(824, 574, 22, 12, 2, '#e7ecef', 'transform="rotate(-8 835 580)" stroke="#9aa5ac" stroke-width="1.6"');
      [828, 834, 840].forEach(function (fx) { s += LN('M' + fx + ' 574L' + fx + ' 566', '#475569', 1.8, 'transform="rotate(-8 835 580)"'); });
    }
    return s;
  }

  /* ==========================================================================
     OP LIGHT — ceiling arm, LED head, warm cone aimed at the mouth
     ========================================================================== */
  function opLight() {
    var s = '';
    /* light cone first, under the hardware — aimed at the patient's MOUTH */
    s += poly([[958, 390], [1078, 382], [1132, 588], [1002, 612]], 'url(#voCone)');
    /* ceiling mount + articulated arm reaching down over the chair */
    s += EL(886, 44, 34, 12, '#d8d4c8');
    s += RR(878, 44, 16, 78, 6, '#e7e4da', 'stroke="#c9c4b4" stroke-width="2"');
    s += CR(886, 128, 11, 'url(#voChrome)');
    s += LN('M886 128L968 240', '#dfdcd2', 13, 'stroke-linecap="round"');
    s += LN('M886 128L968 240', '#b9b4a3', 3, 'stroke-linecap="round" opacity="0.5"');
    s += CR(968, 240, 10, 'url(#voChrome)');
    s += LN('M968 240L1004 326', '#dfdcd2', 11, 'stroke-linecap="round"');
    /* yoke */
    s += LN('M996 326C984 348 992 362 1004 368M1036 322C1052 342 1050 358 1038 366', '#c3beae', 6, 'stroke-linecap="round"');
    /* LED head, hovering over the patient's upper chest, tilted toward the mouth */
    s += '<g transform="rotate(-10 1016 368)">';
    s += RR(931, 340, 170, 56, 28, '#f2f0e9', 'stroke="#c9c4b4" stroke-width="3"');
    s += RR(941, 350, 150, 36, 18, '#fefaf0');
    s += RR(951, 356, 58, 24, 12, '#ffe9a8', 'class="vo-lamp"');
    s += RR(1023, 356, 58, 24, 12, '#ffe9a8', 'class="vo-lamp"');
    /* handles */
    s += LN('M927 368L903 374', '#9aa5ac', 8, 'stroke-linecap="round"');
    s += LN('M1105 364L1129 358', '#9aa5ac', 8, 'stroke-linecap="round"');
    s += '</g>';
    s += EL(1016, 368, 60, 22, 'url(#voGlow)', 'opacity="0.55" class="vo-lampglow"');
    return s;
  }

  /* ==========================================================================
     DENTAL CHAIR
     ========================================================================== */
  function chair() {
    var s = '';
    /* AO shadow */
    s += EL(790, 892, 300, 40, 'url(#voAO)');
    /* pedestal base */
    s += P('M648 862C648 842 700 830 775 830C850 830 902 842 902 862L892 886C892 898 850 906 775 906C700 906 658 898 658 886Z', '#aeb8be');
    s += P('M648 862C648 842 700 830 775 830C850 830 902 842 902 862C902 874 850 884 775 884C700 884 648 874 648 862Z', '#cfd6da');
    /* hydraulic column */
    s += RR(748, 742, 60, 100, 12, 'url(#voChromeH)');
    s += RR(738, 726, 80, 30, 12, '#8f9aa2');
    /* foot control pedal, cabled to the base */
    s += LN('M886 890C904 896 918 900 930 902', '#6b7780', 3.5);
    s += EL(946, 906, 28, 11, '#7d8b93');
    s += EL(946, 901, 24, 9, '#aab4bb');
    s += EL(946, 899, 12, 5, '#cfd6da');

    /* legrest + footrest (down-left, slightly dropped) */
    s += '<g>';
    s += P('M428 716C420 700 430 688 452 686L618 672C640 670 652 680 652 696L652 742C652 758 640 768 620 770L466 780C444 782 430 772 428 756Z', 'url(#voUphD)');
    s += P('M436 712C430 700 438 692 454 690L614 677C632 676 642 684 642 696L642 736C642 748 632 756 616 758L470 768C452 770 440 762 438 750Z', 'url(#voUph)');
    s += LN('M446 700Q540 688 634 682', '#063f38', 2, 'opacity="0.5" stroke-dasharray="6 5"');
    s += LN('M444 748Q540 740 636 732', '#063f38', 2, 'opacity="0.5" stroke-dasharray="6 5"');
    s += P('M436 712C430 700 438 692 454 690L560 681L560 700L470 708Z', '#ffffff', 'opacity="0.14"');
    /* chrome footrest edge */
    s += LN('M430 700C420 712 420 744 432 758', 'url(#voChrome)', 10, 'stroke-linecap="round"');
    s += '</g>';

    /* seat cushion */
    s += P('M598 690C596 672 610 660 636 658L850 646C880 644 898 656 900 676L904 726C906 748 892 762 864 764L646 774C618 776 602 764 600 744Z', 'url(#voUphD)');
    s += P('M608 690C606 676 618 668 640 666L846 654C870 652 884 662 886 678L888 718C890 736 878 748 854 750L652 760C630 762 616 752 614 736Z', 'url(#voUph)');
    s += LN('M622 684Q750 672 878 664', '#063f38', 2, 'opacity="0.5" stroke-dasharray="6 5"');
    s += P('M608 690C606 676 618 668 640 666L846 654C858 653 868 656 874 662L620 678Z', '#ffffff', 'opacity="0.16"');

    /* backrest (reclined nearly flat, rises to the right) */
    s += P('M842 700C836 682 846 668 870 664L1046 640C1072 636 1088 646 1092 664L1098 692C1102 712 1090 726 1064 730L878 752C852 756 836 746 834 726Z', 'url(#voUphD)');
    s += P('M852 698C848 684 856 674 876 671L1042 648C1062 645 1076 653 1079 667L1083 688C1086 704 1076 714 1056 717L882 738C862 741 850 733 848 719Z', 'url(#voUph)');
    s += LN('M866 686Q970 670 1076 660', '#063f38', 2, 'opacity="0.5" stroke-dasharray="6 5"');
    s += P('M852 698C848 684 856 674 876 671L1042 648C1052 646.5 1060 648 1066 652L858 682Z', '#ffffff', 'opacity="0.16"');

    /* articulated headrest */
    s += LN('M1088 682L1114 676', '#8f9aa2', 10, 'stroke-linecap="round"');
    s += P('M1100 664C1096 648 1104 636 1124 632L1168 626C1188 623 1200 632 1202 648L1204 664C1206 680 1196 690 1178 693L1132 699C1114 702 1102 694 1100 680Z', 'url(#voUphD)');
    s += P('M1108 662C1105 650 1111 642 1126 639L1164 634C1178 632 1188 638 1190 650L1191 660C1192 671 1185 678 1172 680L1134 685C1121 687 1112 681 1110 671Z', 'url(#voUph)');

    /* far armrest, mostly hidden behind the patient */
    s += LN('M746 674L750 700', '#0a5048', 8, 'stroke-linecap="round"');
    s += LN('M898 668L900 690', '#0a5048', 8, 'stroke-linecap="round"');
    s += P('M724 664C724 657 731 652 743 651L902 643C914 642 921 647 921 654L921 658C921 665 914 670 902 671L743 679C731 680 724 675 724 670Z', '#0a6157');
    return s;
  }

  /* near armrest drawn AFTER the patient so it overlaps the body */
  function chairNearArm() {
    var s = '';
    s += P('M672 742C672 730 684 722 704 721L900 710C918 709 930 716 930 728L930 736C930 748 918 756 900 757L704 768C684 769 672 761 672 750Z', 'url(#voUphD)');
    s += P('M680 742C680 733 690 727 706 726L896 715.5C910 715 920 721 920 730L920 735C920 744 910 750 896 751L706 762C690 763 680 757 680 748Z', '#0f8b7f');
    s += P('M680 742C680 733 690 727 706 726L896 715.5C902 715.3 907 716.5 911 719L688 734Z', '#ffffff', 'opacity="0.14"');
    /* chair touch-pad on the armrest */
    s += RR(716, 730, 44, 16, 6, '#0a5048');
    [724, 736, 748].forEach(function (x) { s += CR(x, 738, 3.2, '#67e8f9', 'opacity="0.85"'); });
    return s;
  }

  /* ==========================================================================
     PEOPLE
     ========================================================================== */

  /* --- the reclined PATIENT (parametric per persona) --- */
  function patientArt(pid) {
    if (pid === null) return emptyChairArt();
    var st = PSTYLE[pid] || PSTYLE['default'];
    var sk = SKIN[st.skin], skin = 'url(#voSk_' + st.skin + ')';
    var child = !!st.child;
    var s = '<g' + (child ? ' transform="translate(178 100) scale(0.84)"' : '') + '>';
    var pant = st.pant || '#4a5568';

    /* ------ legs lying along the seat + legrest, feet up at the footrest ------ */
    /* far leg (slightly behind, darker) */
    s += P('M824 686C756 690 692 686 642 676L648 700C700 708 762 710 826 708Z', shade(pant, 0.72));
    s += P('M648 678C610 672 566 674 528 684L534 702C570 694 612 694 652 700Z', shade(pant, 0.66));
    s += P('M536 700C530 686 531 670 537 660C541 653 550 653 553 660C558 671 557 688 552 702C546 708 539 708 536 700Z', '#242b36');
    /* near thigh: hip → knee (knee sits a touch proud of the seat) */
    s += P('M840 694C776 700 706 698 652 688C646 690 642 696 643 702C644 708 649 712 656 713C712 720 780 724 842 726Z', pant);
    /* near shin: knee → ankle down the legrest */
    s += P('M660 690C616 684 566 688 518 700C512 702 509 708 511 714C513 720 519 723 526 721C570 711 618 710 660 714Z', pant);
    s += LN('M652 690Q648 700 654 712', shade(pant, 0.7), 3, 'opacity="0.8"');
    s += LN('M760 722Q706 718 662 712', shade(pant, 0.8), 2.5, 'opacity="0.5"');
    /* near shoe: toes up, heel resting on the legrest */
    s += P('M512 716C505 702 505 684 512 672C517 664 528 664 532 672C538 683 537 702 531 716C525 724 516 724 512 716Z', '#333a46');
    s += P('M511 676C509 669 513 662 520 661C527 660 532 665 533 672L533 678C526 671 517 671 511 676Z', '#4b5563');
    s += LN('M514 710C519 714 526 714 531 710', '#ffffff', 2.2, 'opacity="0.3" stroke-linecap="round"');

    /* ------ torso along the backrest ------ */
    s += P('M846 706C840 688 850 672 874 667L1032 646C1054 643 1068 652 1072 668L1076 690C1080 708 1068 722 1044 726L880 746C858 750 848 740 846 724Z', st.shirt);
    s += P('M846 706C842 694 850 680 870 674L1000 656L1006 700L884 724C864 728 852 720 848 712Z', shade(st.shirt, 0.85));
    s += LN('M900 668Q950 690 1000 702', shade(st.shirt, 0.72), 2.5, 'opacity="0.5"');

    /* near arm resting along the side */
    s += P('M1016 668C990 676 950 690 916 700C892 706 872 716 862 724C854 732 858 744 870 746C900 742 946 734 986 722L1024 710Z', shade(st.shirt, 0.92));
    s += P('M872 724C860 726 848 732 844 740C842 748 850 754 860 752C872 750 884 742 888 734C890 726 882 722 872 724Z', skin);
    s += LN('M856 740l10 -4M860 746l10 -4', sk.sh, 1.6, 'opacity="0.7" stroke-linecap="round"');

    /* ------ head + neck in supine profile (face up, crown to the right) ------ */
    s += P('M1046 598' +
      'C1048 592 1050 588 1053 586' +
      'L1057 583C1055 580 1056 577 1059 575' +
      'L1063 572C1061 569 1062 566 1066 564' +
      'L1069 562C1064 556 1066 548 1072 545' +
      'C1077 542.5 1083 544 1086 549' +
      'L1090 547C1094 544 1099 543 1104 544' +
      'C1114 532 1132 530 1144 540' +
      'C1158 551 1162 572 1154 588' +
      'C1150 604 1141 617 1128 624' +
      'C1123 634 1114 643 1102 648' +
      'L1074 660' +
      'C1072 646 1067 628 1058 612' +
      'C1052 606 1046 602 1046 598Z', skin);
    /* forehead highlight + jaw/throat shading */
    s += P('M1104 544C1114 532 1132 530 1144 540C1150 545 1154 552 1155 560L1112 570Z', sk.hi, 'opacity="0.4"');
    s += P('M1062 620C1070 634 1082 642 1096 638L1120 628C1114 637 1108 643 1100 646L1074 658C1072 644 1068 630 1062 620Z', sk.sh, 'opacity="0.4"');
    /* jawline hint */
    s += LN('M1054 606C1064 616 1080 621 1096 617', sk.sh, 2, 'opacity="0.55" stroke-linecap="round"');
    /* mouth: clearly OPEN for treatment — dark oval, hint of upper teeth, tongue */
    s += EL(1058, 577, 8, 5.4, '#4f1f1c', 'transform="rotate(-33 1058 577)"');
    s += RR(1055, 568.8, 12, 3.4, 1.7, '#f6f1e8', 'transform="rotate(-33 1061 570.5)"');
    s += EL(1054.5, 580, 3.6, 2.1, '#8a4340', 'transform="rotate(-33 1054.5 580)"');
    s += LN('M1049 583C1053 586.5 1058 587.5 1063 585.5', '#8e4a42', 1.6, 'opacity="0.8" stroke-linecap="round"');
    /* nostril, closed-eye lashes, brow */
    s += EL(1073, 556, 2, 1.4, sk.sh, 'transform="rotate(-32 1073 556)"');
    s += LN('M1090 557C1093 554.6 1097 554 1100 555', sk.ln, 2, 'stroke-linecap="round"');
    s += LN('M1087 546C1091 543.5 1096 543 1100 544', sk.ln, 1.7, 'stroke-linecap="round" opacity="0.7"');
    /* ear — under the hair; only shown for styles that leave it uncovered */
    if (st.style === 'long' || st.style === 'recede') {
      s += EL(1112, 592, 6, 8.5, sk.base, 'transform="rotate(-22 1112 592)" stroke="' + sk.sh + '" stroke-width="1.3"');
    }

    /* ------ hair (per style) ------ */
    var hc = st.hair, hd = shade(hc, 0.78), hl = shade(hc, 1.55);
    if (st.style === 'long') {
      s += P('M1100 546C1110 530 1134 528 1148 540C1163 553 1168 574 1160 592C1172 604 1177 622 1172 638C1167 652 1152 658 1140 651C1130 657 1117 654 1112 644C1117 634 1120 622 1118 610C1105 595 1096 570 1100 546Z', hc);
      s += LN('M1114 550Q1136 546 1148 564M1136 644Q1152 644 1162 632', hl, 2.6, 'opacity="0.6" stroke-linecap="round"');
    } else if (st.style === 'bob') {
      /* bob falls BACK toward the headrest when supine — keeps the jaw clear */
      s += P('M1102 546C1112 530 1136 528 1149 541C1163 554 1166 578 1157 592C1162 602 1160 613 1150 618C1139 623 1127 618 1122 608C1113 597 1107 581 1106 567C1102 559 1100 552 1102 546Z', hc);
      s += LN('M1116 552Q1138 548 1148 564', hl, 2.6, 'opacity="0.7" stroke-linecap="round"');
      if (st.gray) s += LN('M1114 545C1126 539 1140 540 1150 549M1120 610C1130 616 1140 615 1148 608', '#b9b1a7', 1.8, 'opacity="0.8" stroke-linecap="round"');
    } else if (st.style === 'recede') {
      s += P('M1124 534C1134 530 1144 534 1151 542C1159 552 1161 568 1155 580C1148 573 1143 560 1141 548C1136 542 1130 537 1124 534Z', hc);
      s += LN('M1108 540Q1116 534 1126 533', hc, 3.4, 'opacity="0.55" stroke-linecap="round"');
    } else if (st.style === 'pig') {
      s += P('M1102 546C1111 530 1135 528 1148 541C1160 552 1164 572 1156 586C1147 592 1134 590 1126 582C1114 572 1102 560 1102 546Z', hc);
      s += CR(1156, 606, 13, hc); s += CR(1146, 622, 9, hc);
      s += RR(1144, 592, 7, 12, 3.5, '#e8766a', 'transform="rotate(30 1147 598)"');
      s += LN('M1148 600a10 10 0 0 1 12 7', hd, 2.2, 'opacity="0.7"');
    } else if (st.style === 'curls') {
      /* scalloped curl cap hugging the crown, same footprint as the bob */
      s += P('M1103 549' +
        'C1100 542 1105 535 1112 535' +
        'C1113 528 1122 524 1129 528' +
        'C1134 522 1144 522 1148 529' +
        'C1155 527 1162 533 1160 540' +
        'C1167 544 1169 552 1164 558' +
        'C1169 564 1168 573 1161 577' +
        'C1163 585 1156 592 1148 590' +
        'C1145 597 1135 598 1130 592' +
        'C1119 583 1110 570 1106 559' +
        'C1104 555 1103 552 1103 549Z', hc);
      s += LN('M1116 540c3 -4 8 -4 11 -1M1136 533c3 -3 8 -3 11 0M1152 543c3 -3 7 -1 8 3M1156 564c3 -2 6 0 7 4', shade(hc, 0.8), 1.8, 'opacity="0.8" stroke-linecap="round"');
    } else { /* crop */
      s += P('M1100 546C1109 530 1134 527 1148 540C1160 550 1164 570 1157 586C1150 592 1140 592 1133 585C1121 574 1107 560 1100 546Z', hc);
      s += LN('M1112 548Q1130 542 1144 552', hl, 2.2, 'opacity="0.6" stroke-linecap="round"');
    }

    /* ------ safety glasses: small, lightly tinted, riding the closed eyes ------ */
    s += P('M1083 554L1097 548C1101 546 1105 548 1106 552C1107 556 1105 559.5 1101 561.5L1088 567C1084 569 1080 567.5 1079 563.5C1078.2 560 1080 556 1083 554Z', '#f8c14d', 'opacity="0.4" stroke="#b98418" stroke-width="2"');
    s += LN('M1085 554L1095 549.5', '#ffffff', 1.6, 'opacity="0.75" stroke-linecap="round"');
    /* temple arm tucks back along the head toward the ear */
    s += LN('M1106 552C1110 556 1112 561 1113 566', '#b98418', 1.8, 'stroke-linecap="round"');

    /* shoulder seam + sleeve line so the top reads as clothing, not upholstery */
    s += LN('M1026 650C1018 664 1017 680 1024 696', shade(st.shirt, 0.68), 2.6, 'opacity="0.85" stroke-linecap="round"');
    s += LN('M1040 649C1052 654 1060 662 1064 672', shade(st.shirt, 0.68), 2.2, 'opacity="0.7" stroke-linecap="round"');
    /* ------ bib napkin clipped over the chest (corners tucked inside the torso) ------ */
    s += P('M956 670L1036 654L1050 690L972 710C960 712 952 706 950 698Z', '#cfe6ec');
    s += P('M956 670L1036 654L1039 663L960 681Z', '#ffffff', 'opacity="0.5"');
    s += LN('M972 681L1040 666M978 695L1044 680', '#a8c8d2', 2, 'opacity="0.8"');
    s += LN('M1036 656C1044 650 1052 647 1060 648', '#8f9aa2', 2.6);
    s += CR(1036, 657, 3, '#c5ced4');

    s += '</g>';
    return s;
  }

  /* empty chair: folded bib + headrest cover ready for the next patient */
  function emptyChairArt() {
    var s = '';
    s += P('M950 668L1046 652L1056 692L962 710C952 712 946 706 946 696Z', '#cfe6ec', 'stroke="#a8c8d2" stroke-width="2"');
    s += LN('M958 678L1048 662M962 692L1052 676', '#a8c8d2', 2);
    s += RR(1112, 636, 84, 40, 14, '#e8f1f4', 'transform="rotate(-8 1154 656)" stroke="#c3d6dc" stroke-width="2" opacity="0.9"');
    return s;
  }

  /* --- the DENTIST, seated at 12 o'clock behind the headrest --- */
  function dentistStool() {
    var s = '';
    s += EL(1300, 876, 84, 18, 'url(#voAO)');
    [[1248, 872], [1300, 884], [1352, 872]].forEach(function (c) {
      s += LN('M1300 828L' + c[0] + ' ' + c[1], '#8f9aa2', 8, 'stroke-linecap="round"');
      s += CR(c[0], c[1] + 6, 8, '#4b5563'); s += CR(c[0], c[1] + 6, 3, '#9aa5ac');
    });
    s += RR(1292, 786, 16, 46, 6, 'url(#voChromeH)');
    s += EL(1300, 782, 52, 18, '#1f2937');
    s += EL(1300, 776, 52, 16, '#374151');
    return s;
  }

  function dentistArt(hasPatient) {
    /* matches the people-art Dr. Williams bust: deep skin, near-black hair, gray temples */
    var sk = SKIN.deep, skin = 'url(#voSk_deep)';
    var scrub = '#155e75', scrubD = shade(scrub, 0.72), scrubL = shade(scrub, 1.3);
    var s = '';
    /* legs (seated, angled toward the chair) */
    s += P('M1268 758C1240 764 1212 776 1196 790C1186 800 1190 814 1204 816C1228 812 1258 800 1282 786Z', scrubD);
    s += P('M1196 792L1168 800C1154 804 1152 822 1166 828L1204 818Z', '#2b3442'); /* clog */

    /* torso leaning toward the patient */
    s += P('M1330 774C1344 726 1330 660 1300 610C1286 588 1258 580 1236 592C1214 604 1204 630 1212 656C1224 696 1252 744 1272 776C1290 788 1316 788 1330 774Z', scrub);
    s += P('M1236 592C1222 600 1214 614 1212 630L1270 700C1284 716 1300 728 1316 734L1330 774C1316 788 1290 788 1272 776C1252 744 1224 696 1212 656C1206 632 1216 604 1236 592Z', scrubD, 'opacity="0.55"');
    /* v-neck */
    s += P('M1236 606L1252 630L1264 602Z', shade(scrub, 0.5));
    s += LN('M1246 640Q1268 690 1292 738', scrubD, 3, 'opacity="0.7"');

    /* near arm reaching over the headrest — kept HIGH so the gloved hand and
       the instrument stay fully visible in front of the assistant */
    if (hasPatient) {
      s += LN('M1256 652C1230 638 1206 618 1192 600', scrub, 20, 'stroke-linecap="round"');
      /* mirror: handle first, then the gloved hand gripping it beside the crown */
      s += LN('M1066 578L1160 591', '#8b979e', 3.6, 'stroke-linecap="round"');
      s += CR(1061, 577, 5.2, 'url(#voChrome)', 'stroke="#7d8b93" stroke-width="1.5"');
      s += CR(1061, 577, 3, '#eef7fa');
      /* gloved hand: palm + curled fingers wrapping the handle, thumb on top */
      s += P('M1176 580C1168 578 1160 580 1155 585C1150 591 1151 599 1157 603C1163 607 1172 606 1178 601C1184 596 1183 584 1176 580Z', '#9db4d4');
      s += LN('M1158 586C1160 590 1160 595 1158 599M1164 585C1166 590 1166 596 1164 600M1170 585C1172 590 1172 596 1170 601', '#7d97bd', 1.8, 'stroke-linecap="round"');
      s += P('M1160 583C1164 579 1170 578 1175 580C1178 582 1178 585 1175 586C1170 588 1164 587 1160 583Z', '#b4c7e0');
      s += LN('M1180 594L1191 596', '#8b979e', 3.2, 'stroke-linecap="round"'); /* handle butt past the hand */
    } else {
      /* held ready, raised above the empty chair while reviewing setup */
      s += LN('M1240 628C1220 618 1204 606 1192 592', scrub, 21, 'stroke-linecap="round"');
      s += LN('M1150 543L1184 583', '#8b979e', 3.6, 'stroke-linecap="round"');
      s += CR(1146, 539, 5.6, 'url(#voChrome)', 'stroke="#7d8b93" stroke-width="1.5"');
      s += CR(1146, 539, 3.2, '#eef7fa');
      s += P('M1194 574C1184 570 1174 572 1169 578C1164 585 1167 594 1175 597C1183 600 1193 597 1198 590C1202 584 1200 577 1194 574Z', '#8ea8c9');
      s += LN('M1173 581l15 5M1171 588l16 4', '#6f8cb0', 1.7, 'stroke-linecap="round"');
    }

    /* neck + head, tilted down toward the field */
    s += P('M1238 588L1268 578L1276 606L1248 616Z', skin);
    s += '<g transform="rotate(18 1246 548)">';
    s += EL(1246, 548, 34, 38, skin);
    /* hair — short, near-black, grayed at the temples */
    s += P('M1212 542C1210 516 1228 500 1250 502C1272 504 1284 520 1282 542C1276 534 1266 528 1254 528C1240 526 1224 532 1212 542Z', '#181310');
    s += P('M1214 552C1210 546 1210 538 1214 532L1220 546Z', '#181310');
    s += LN('M1215 541C1219 535 1224 531 1230 528', '#8e8e94', 2.6, 'opacity="0.9" stroke-linecap="round"');
    s += LN('M1279 538C1276 532 1271 527 1265 524', '#8e8e94', 2.4, 'opacity="0.85" stroke-linecap="round"');
    /* mask covering nose→chin */
    s += P('M1216 556C1218 580 1236 592 1252 590C1268 588 1278 574 1276 554C1258 546 1232 546 1216 556Z', '#cfe7ea', 'stroke="#9cc4ca" stroke-width="2"');
    s += LN('M1220 566Q1246 576 1274 562M1224 576Q1246 584 1270 572', '#9cc4ca', 1.6, 'opacity="0.85"');
    s += LN('M1216 556L1206 546M1276 554L1284 542', '#b7d6da', 2.4);
    /* eyes looking down at the mouth + brows */
    s += EL(1233, 542, 3.4, 2.4, '#241a12');
    s += EL(1259, 540, 3.4, 2.4, '#241a12');
    s += CR(1232, 541, 0.9, '#fff'); s += CR(1258, 539, 0.9, '#fff');
    s += LN('M1226 533Q1233 529 1240 532M1252 531Q1259 527 1266 530', '#3d2f22', 2.4, 'stroke-linecap="round"');
    /* safety glasses */
    s += LN('M1222 540h22M1250 538h22', '#64748b', 1.6, 'opacity="0.7"');
    s += RR(1221, 533, 24, 14, 6, '#dbeafe', 'opacity="0.32" stroke="#64748b" stroke-width="1.8"');
    s += RR(1249, 531, 24, 14, 6, '#dbeafe', 'opacity="0.32" stroke="#64748b" stroke-width="1.8"');
    s += LN('M1245 538L1249 538', '#64748b', 1.8);
    s += '</g>';
    return s;
  }

  /* --- the ASSISTANT ("you"), foreground, back three-quarter view ---
     Matches the people-art "You" bust: olive skin, short crop, teal scrubs.
     Includes her own stool so the whole tableau shifts beside the chair when
     the room is being set up between patients. */
  function assistantArt(hasPatient) {
    var sk = SKIN.olive, skin = 'url(#voSk_olive)';
    var scrub = '#0d9488', scrubD = shade(scrub, 0.62), scrubL = shade(scrub, 1.22);
    var s = '<g' + (hasPatient ? '' : ' transform="translate(-70 6)"') + '>';
    /* stool */
    s += EL(1128, 968, 120, 22, 'url(#voAO)');
    s += EL(1124, 938, 66, 20, '#1f2937');
    s += EL(1124, 932, 66, 18, '#374151');
    /* torso from behind (widens down, cropped low) */
    s += P('M1064 946C1050 878 1058 796 1088 742C1102 716 1140 708 1164 726C1192 748 1204 806 1200 872C1198 906 1192 934 1184 952C1148 966 1096 964 1064 946Z', scrub);
    /* back yoke seam + side shading */
    s += P('M1090 742C1104 718 1140 710 1162 726C1170 732 1176 742 1180 754C1152 744 1114 744 1092 756C1090 752 1089 747 1090 742Z', scrubD, 'opacity="0.6"');
    s += P('M1064 946C1054 890 1058 812 1082 756L1094 760C1076 812 1072 886 1080 946Z', scrubD, 'opacity="0.5"');
    s += LN('M1100 760Q1136 750 1172 762', scrubD, 3, 'opacity="0.7"');
    s += LN('M1132 764L1130 950', scrubD, 3, 'opacity="0.4"');

    /* left arm: bent at the elbow, breaking the torso outline, hand in her lap */
    s += LN('M1092 770C1062 786 1046 810 1048 840', scrubD, 18, 'stroke-linecap="round"');
    s += LN('M1092 770C1062 786 1046 810 1048 840', scrub, 11, 'stroke-linecap="round"');
    s += EL(1052, 850, 9.5, 7.5, '#9db4d4', 'transform="rotate(-18 1052 850)"');

    /* right arm: reaches ACROSS toward the patient's chin — the middle passes
       behind her head (drawn later), elbow bows out past the torso edge */
    s += LN('M1178 752C1212 726 1216 692 1190 668C1164 646 1120 640 1084 650', scrubD, 20, 'stroke-linecap="round"');
    s += LN('M1178 752C1212 726 1216 692 1190 668C1164 646 1120 640 1084 650', shade(scrub, 1.1), 13, 'stroke-linecap="round"');

    /* HVE at the lower corner of the mouth: gray handle + chrome tip */
    if (hasPatient) {
      s += LN('M1074 646L1062 606', '#5b6771', 6.5, 'stroke-linecap="round"');
      s += LN('M1062 606L1053 585', 'url(#voChrome)', 5.5, 'stroke-linecap="round"');
    } else {
      s += LN('M1074 646L1066 614', '#5b6771', 6.5, 'stroke-linecap="round"');
      s += LN('M1066 614L1060 596', 'url(#voChrome)', 5.5, 'stroke-linecap="round"');
    }
    /* gloved hand gripping the HVE handle (drawn over the handle) */
    s += P('M1084 634C1076 632 1068 635 1065 641C1062 648 1065 656 1072 659C1079 662 1088 659 1092 652C1095 645 1091 636 1084 634Z', '#9db4d4');
    s += LN('M1070 642C1073 644 1077 645 1081 644M1069 649C1073 651 1078 652 1082 650', '#7d97bd', 1.8, 'stroke-linecap="round"');
    /* ribbed hose drapes from the HVE across her lap and down to the floor */
    s += LN('M1078 658C1068 700 1074 758 1096 806C1120 858 1168 912 1206 952', '#8b979e', 8, 'opacity="0.95"');
    s += LN('M1078 658C1068 700 1074 758 1096 806C1120 858 1168 912 1206 952', '#5f6b74', 8, 'opacity="0.5" stroke-dasharray="2.5 5"');

    /* neck + head from behind-left, looking toward the patient */
    s += P('M1112 740L1146 734L1144 710L1116 714Z', skin);
    s += '<g transform="translate(0 22) rotate(-6 1120 668)">';
    s += EL(1120, 668, 34, 38, skin);
    /* visible right-cheek edge + jaw hint */
    s += P('M1088 664C1086 684 1096 702 1112 706L1116 690C1104 686 1094 676 1088 664Z', sk.sh, 'opacity="0.5"');
    /* mask: we see the strap + the edge of the cup on the far cheek */
    s += P('M1086 668C1082 684 1090 700 1104 706L1110 688C1098 684 1090 678 1086 668Z', '#cfe7ea', 'stroke="#9cc4ca" stroke-width="1.6"');
    s += LN('M1090 662C1096 656 1104 652 1112 650', '#b7d6da', 2.4);
    /* hair: short dark crop hugging the skull, nape visible */
    s += P('M1087 660C1085 634 1101 615 1122 616C1144 617 1157 635 1154 659C1152 676 1145 690 1133 698C1127 702 1119 702 1115 697C1121 687 1124 673 1121 661C1111 649 1097 650 1087 660Z', '#33241a');
    s += LN('M1097 638Q1119 624 1142 632M1134 686Q1141 692 1147 697', '#4e3a2b', 2, 'opacity="0.8" stroke-linecap="round"');
    /* ear + mask loop + small stud */
    s += EL(1106, 678, 5.5, 8, sk.base, 'stroke="' + sk.sh + '" stroke-width="1.2"');
    s += LN('M1104 672C1098 668 1094 662 1094 656', '#b7d6da', 2);
    s += CR(1106, 683, 1.6, '#d9a441');
    s += '</g>';
    s += '</g>';
    return s;
  }

  /* ==========================================================================
     STERILIZATION ROOM (second composition, x offset +1700)
     ========================================================================== */
  function steriRoom() {
    var X = 1700;
    var s = '<g>';
    /* shell */
    s += RR(X, 0, 1600, 700, 0, 'url(#voWallB)');
    s += RR(X, 0, 1600, 70, 0, 'url(#voCeil)');
    s += LN('M' + X + ' 70L' + (X + 1600) + ' 70', '#d8d3c5', 2);
    s += poly([[X, 1000], [X + 1600, 1000], [X + 1600, 700], [X, 700]], 'url(#voFloor)');
    var i;
    for (i = 0; i <= 8; i++) {
      var xx = X + i * 200; var xf = X + 800 + (xx - (X + 800)) * 1.35;
      s += LN('M' + xx + ' 700L' + xf + ' 1000', '#96794f', 1.6, 'opacity="0.4"');
    }
    [730, 775, 835, 910].forEach(function (y, j) { s += LN('M' + X + ' ' + y + 'L' + (X + 1600) + ' ' + y, '#8d7148', 1.4, 'opacity="' + (0.3 + j * 0.05) + '"'); });
    s += RR(X, 686, 1600, 14, 0, '#cfc9b9');
    /* ceiling light (framed panel so a partial crop still reads as a fixture) */
    s += RR(X + 552, 16, 496, 34, 10, '#e2dfd6');
    s += RR(X + 560, 22, 480, 22, 8, '#fefdf6', 'class="vo-panel"');

    /* ---- zone header signs: DIRTY (red) → arrows → CLEAN (green) ---- */
    s += RR(X + 90, 96, 520, 64, 10, '#fdeaea', 'stroke="#e2b6b6" stroke-width="2.5"');
    s += CR(X + 130, 128, 18, '#d33131');
    s += TXT(X + 122, 135, '!', 24, '#ffffff', 'font-weight="800"');
    s += TXT(X + 162, 124, 'DIRTY SIDE', 26, '#a62222', 'font-weight="800"');
    s += TXT(X + 162, 148, 'Receiving · rinse · ultrasonic cleaning', 15, '#7c4a4a');
    s += RR(X + 990, 96, 520, 64, 10, '#e8f7ee', 'stroke="#b2dcc2" stroke-width="2.5"');
    s += CR(X + 1030, 128, 18, '#16a34a');
    s += TXT(X + 1022, 135, '&#10003;', 20, '#ffffff', 'font-weight="800"');
    s += TXT(X + 1062, 124, 'CLEAN SIDE', 26, '#166534', 'font-weight="800"');
    s += TXT(X + 1062, 148, 'Autoclave · sealed pouches · sterile storage', 15, '#3d6b4c');
    /* one-way arrows between */
    [0, 1, 2].forEach(function (k) {
      var ax = X + 660 + k * 100;
      s += P('M' + ax + ' 112L' + (ax + 52) + ' 128L' + ax + ' 144L' + (ax + 14) + ' 128Z', '#0d9488', 'opacity="' + (0.45 + k * 0.25) + '"');
    });
    s += TXT(X + 652, 172, 'ONE-WAY WORKFLOW — NEVER BACKWARDS', 14, '#0f766e', 'font-weight="700"');

    /* ---- upper cabinets ---- */
    s += RR(X + 80, 200, 560, 96, 4, 'url(#voCab)');
    s += RR(X + 960, 200, 560, 96, 4, 'url(#voCab)');
    [X + 84, X + 224, X + 364, X + 504].forEach(function (x) { s += RR(x + 3, 205, 134, 86, 3, '#f2efe7', 'stroke="#d8d3c5" stroke-width="2"'); s += RR(x + 12, 240, 4, 30, 2, '#9aa2a8'); });
    [X + 964, X + 1104, X + 1244, X + 1384].forEach(function (x) { s += RR(x + 3, 205, 134, 86, 3, '#f2efe7', 'stroke="#d8d3c5" stroke-width="2"'); s += RR(x + 12, 240, 4, 30, 2, '#9aa2a8'); });
    s += TXT(X + 130, 316, 'CONTAMINATED &#8594;', 15, '#a62222', 'font-weight="700"');
    s += TXT(X + 1310, 316, 'STERILE STORAGE', 15, '#166534', 'font-weight="700"');

    /* ---- counter + lower cabinets, physically split by a divider ---- */
    s += RR(X + 70, 466, 1460, 26, 5, 'url(#voCounter)');
    s += RR(X + 70, 484, 1460, 8, 3, '#c9c3b3');
    s += RR(X + 70, 492, 1460, 194, 3, 'url(#voCabLow)');
    var dx;
    for (dx = X + 76; dx < X + 1510; dx += 146) {
      s += RR(dx, 500, 138, 82, 3, '#efece2', 'stroke="#d2ccbc" stroke-width="2"');
      s += RR(dx, 588, 138, 88, 3, '#efece2', 'stroke="#d2ccbc" stroke-width="2"');
      s += RR(dx + 52, 508, 34, 4, 2, '#9aa2a8');
    }
    s += RR(X + 70, 678, 1460, 8, 0, '#b6b0a0');
    /* red / green counter edge strips marking the zones */
    s += RR(X + 70, 462, 660, 7, 3, '#d33131', 'opacity="0.75"');
    s += RR(X + 870, 462, 660, 7, 3, '#16a34a', 'opacity="0.75"');
    /* physical divider between zones */
    s += RR(X + 770, 330, 16, 356, 5, '#cfd6da', 'stroke="#aab4bb" stroke-width="2"');
    s += TXT(X + 745, 320, 'PASS', 12, '#64748b', 'font-weight="700"');

    /* ---- DIRTY side: receiving tub, sink, ultrasonic ---- */
    /* receiving bin with used instruments */
    s += RR(X + 108, 420, 170, 52, 10, '#94a3ad', 'stroke="#75828c" stroke-width="2.5"');
    s += RR(X + 118, 428, 150, 36, 7, '#7c8a94');
    /* used instruments waiting in the bin: mirror, explorer, cotton pliers */
    s += LN('M' + (X + 134) + ' 450L' + (X + 158) + ' 414', '#c8d2d8', 4, 'stroke-linecap="round"');
    s += CR(X + 160, 411, 6.5, '#dde6ea', 'stroke="#9fadb5" stroke-width="1.8"');
    s += LN('M' + (X + 176) + ' 452L' + (X + 198) + ' 416', '#c8d2d8', 3.6, 'stroke-linecap="round"');
    s += LN('M' + (X + 198) + ' 416C' + (X + 202) + ' 410 ' + (X + 208) + ' 410 ' + (X + 210) + ' 415', '#9fadb5', 2.6, 'stroke-linecap="round"');
    s += LN('M' + (X + 216) + ' 452L' + (X + 238) + ' 418M' + (X + 222) + ' 454L' + (X + 243) + ' 421', '#c8d2d8', 3, 'stroke-linecap="round"');
    s += TXT(X + 128, 496, 'RECEIVING', 13, '#7c4a4a', 'font-weight="700"');
    /* biohazard roundel on the bin face */
    s += CR(X + 138, 452, 10, '#d33131', 'stroke="#a62222" stroke-width="2"');
    s += TXT(X + 131, 458, '&#9763;', 13, '#ffffff');
    /* sink */
    s += EL(X + 380, 470, 62, 13, '#c3cdd2');
    s += EL(X + 380, 469, 53, 10, '#8fa0a9');
    s += LN('M' + (X + 426) + ' 464C' + (X + 426) + ' 420 ' + (X + 410) + ' 414 ' + (X + 388) + ' 416', 'url(#voChrome)', 8, 'stroke-linecap="round"');
    /* ultrasonic cleaner */
    s += RR(X + 500, 388, 220, 84, 12, 'url(#voSteel)', 'stroke="#a9b3ba" stroke-width="2.5"');
    s += RR(X + 512, 376, 196, 22, 9, '#dfe6e9', 'stroke="#a9b3ba" stroke-width="2"'); /* lid */
    s += RR(X + 520, 404, 120, 40, 6, '#123a52');
    s += TXT(X + 530, 430, '8:00', 24, '#5eead4', 'font-weight="700" font-family="ui-monospace,monospace"');
    s += TXT(X + 594, 430, 'CYCLE', 9, '#7dd3fc', 'font-weight="700"');
    s += CR(X + 672, 424, 13, '#7d8b93'); s += CR(X + 672, 424, 5, '#37424a');
    s += TXT(X + 540, 496, 'ULTRASONIC CLEANER', 13, '#475569', 'font-weight="700"');
    /* utility glove hanging on a wall hook, dirty side — cuff, palm and thumb */
    s += RR(X + 30, 330, 64, 116, 8, '#e3ded0', 'stroke="#c8c2b1" stroke-width="2"');
    s += CR(X + 62, 346, 5, '#8f9aa2');
    /* cuff */
    s += P('M' + (X + 48) + ' 352L' + (X + 78) + ' 352L' + (X + 76) + ' 372L' + (X + 50) + ' 372Z', '#92400e');
    /* palm tapering down + thumb out to the right */
    s += P('M' + (X + 50) + ' 372C' + (X + 48) + ' 392 ' + (X + 50) + ' 412 ' + (X + 56) + ' 424C' + (X + 60) + ' 431 ' + (X + 70) + ' 431 ' + (X + 74) + ' 424C' + (X + 79) + ' 412 ' + (X + 79) + ' 392 ' + (X + 76) + ' 372Z', '#b45309');
    s += P('M' + (X + 75) + ' 380C' + (X + 83) + ' 384 ' + (X + 88) + ' 392 ' + (X + 88) + ' 400C' + (X + 88) + ' 405 ' + (X + 83) + ' 406 ' + (X + 80) + ' 402C' + (X + 76) + ' 396 ' + (X + 74) + ' 388 ' + (X + 75) + ' 380Z', '#b45309');
    s += LN('M' + (X + 56) + ' 380C' + (X + 56) + ' 396 ' + (X + 57) + ' 410 ' + (X + 60) + ' 420', '#92400e', 2, 'opacity="0.7"');
    s += TXT(X + 34, 460, 'UTILITY PPE', 10, '#7c4a4a', 'font-weight="700"');
    /* spore-test log clipboard between the zones (clipboard-sized) */
    s += RR(X + 692, 244, 116, 146, 7, '#a9855c');
    s += RR(X + 700, 256, 100, 128, 3, '#fdfcf8');
    s += RR(X + 730, 238, 40, 14, 5, '#8f9aa2');
    s += TXT(X + 708, 276, 'SPORE TEST', 12, '#334155', 'font-weight="800"');
    s += TXT(X + 708, 290, 'LOG · weekly', 9.5, '#64748b');
    [308, 328, 348, 368].forEach(function (ly, li) {
      s += RR(X + 708, ly - 9, 10, 10, 2, '#ffffff', 'stroke="#94a3b8" stroke-width="1.4"');
      if (li < 3) s += LN('M' + (X + 710) + ' ' + (ly - 4) + 'l2.5 3.5 5 -7', '#16a34a', 2.2, 'stroke-linecap="round" fill="none"');
      s += LN('M' + (X + 726) + ' ' + (ly - 3) + 'h64', '#cbd5e1', 2);
    });

    /* ---- middle: wrap / packaging station ---- */
    s += RR(X + 812, 414, 120, 54, 8, '#e7ecef', 'stroke="#c3ccd2" stroke-width="2"');
    s += RR(X + 822, 402, 100, 18, 8, '#d3dbdf');
    s += RR(X + 826, 424, 92, 10, 3, '#f6fafb');
    s += RR(X + 826, 438, 92, 10, 3, '#f6fafb');
    s += TXT(X + 812, 496, 'WRAP &amp; SEAL', 13, '#475569', 'font-weight="700"');

    /* ---- CLEAN side: autoclave with round door + pouch rack ---- */
    s += RR(X + 980, 306, 300, 166, 20, 'url(#voAuto)', 'stroke="#a9b3ba" stroke-width="3"');
    s += RR(X + 992, 318, 276, 20, 8, '#eef2f4');
    /* round door */
    s += CR(X + 1078, 402, 62, '#c7d0d5', 'stroke="#96a3ac" stroke-width="4"');
    s += CR(X + 1078, 402, 46, '#e7edf0', 'stroke="#aab4bb" stroke-width="3"');
    s += CR(X + 1078, 402, 28, '#9fb2bb');
    s += CR(X + 1064, 390, 10, '#ffffff', 'opacity="0.5"');
    var a; for (a = 0; a < 8; a++) {
      var ang = a * Math.PI / 4;
      s += CR(X + 1078 + Math.cos(ang) * 54, 402 + Math.sin(ang) * 54, 4, '#7d8b93');
    }
    s += RR(X + 1130, 392, 34, 20, 6, '#7d8b93'); /* latch handle */
    /* control panel + gauge */
    s += RR(X + 1190, 352, 74, 96, 10, '#123a52');
    s += CR(X + 1227, 380, 18, '#e7edf0', 'stroke="#aab4bb" stroke-width="2"');
    s += LN('M' + (X + 1227) + ' 380L' + (X + 1236) + ' 370', '#d33131', 2.4, 'stroke-linecap="round"');
    s += CR(X + 1210, 416, 5, '#22c55e', 'class="vo-panel"'); s += CR(X + 1227, 416, 5, '#f59e0b'); s += CR(X + 1244, 416, 5, '#475569');
    s += TXT(X + 1198, 440, 'STERILIZE', 9, '#7dd3fc', 'font-weight="700"');
    s += TXT(X + 1035, 496, 'AUTOCLAVE (STEAM STERILIZER)', 13, '#166534', 'font-weight="700"');
    /* rack of sealed pouches */
    s += RR(X + 1320, 330, 190, 142, 8, '#d3dbdf', 'stroke="#aab4bb" stroke-width="2.5"');
    [352, 396, 440].forEach(function (ry) {
      s += RR(X + 1328, ry, 174, 6, 3, '#aab4bb');
      [0, 1, 2, 3].forEach(function (k) {
        var px = X + 1334 + k * 43;
        s += RR(px, ry - 30, 36, 30, 3, '#fbfdfe', 'stroke="#bcd4de" stroke-width="1.6"');
        s += RR(px, ry - 30, 36, 8, 3, '#bfe3f2', 'opacity="0.9"');
        s += RR(px + 5, ry - 12, 26, 4, 2, '#8a6d3b', 'opacity="0.75"'); /* indicator strip turned */
      });
    });
    s += TXT(X + 1330, 496, 'STERILE POUCHES', 13, '#166534', 'font-weight="700"');

    /* ---- floor flow decal (modest scale) ---- */
    [0, 1, 2, 3].forEach(function (k) {
      var ax = X + 460 + k * 190;
      s += P('M' + ax + ' 812L' + (ax + 58) + ' 832L' + ax + ' 852L' + (ax + 18) + ' 832Z', '#0d9488', 'opacity="' + (0.28 + k * 0.13) + '"');
    });
    s += TXT(X + 350, 840, 'DIRTY', 19, '#a62222', 'font-weight="800" opacity="0.6"');
    s += TXT(X + 1300, 840, 'CLEAN', 19, '#166534', 'font-weight="800" opacity="0.6"');
    /* vignette */
    s += RR(X, 0, 1600, 1000, 0, 'url(#voVign)', 'pointer-events="none"');
    s += '</g>';
    return s;
  }

  /* ==========================================================================
     HOTSPOT REGIONS (transparent, hover outline, clickable)
     ========================================================================== */
  var HOTSHAPES = {
    dentist:   '<ellipse cx="1262" cy="640" rx="105" ry="160"/>',
    patient:   '<ellipse cx="850" cy="690" rx="200" ry="80"/>',
    assistant: '<ellipse cx="1130" cy="820" rx="95" ry="140"/>',
    light:     '<ellipse cx="1016" cy="368" rx="110" ry="55"/>',
    tray:      '<ellipse cx="838" cy="558" rx="105" ry="42"/>',
    suction:   '<ellipse cx="1198" cy="880" rx="55" ry="80"/>',
    xray:      '<ellipse cx="330" cy="470" rx="80" ry="55"/>',
    computer:  '<rect x="1176" y="296" width="160" height="150" rx="10"/>',
    steri:     '<path d="M74 236L206 296L206 610L74 700Z"/>'
  };

  /* ==========================================================================
     MOUNT
     ========================================================================== */
  function mount(el, opts) {
    opts = opts || {};
    var mode = opts.mode || 'room';
    var patientId = ('patientId' in opts) ? opts.patientId : 'p_exam';
    var lockedFn = opts.locked || function () { return false; };
    var onStation = opts.onStation || function () {};
    var destroyed = false;

    var KEYS = ['dentist', 'patient', 'assistant', 'light', 'tray', 'suction', 'xray', 'computer', 'steri'];
    var LABELS = { dentist:'Dentist', patient:'Patient', assistant:'You', light:'Op light', tray:'Setup tray', suction:'Suction', xray:'X-ray', computer:'Charting', steri:'Sterilization' };

    /* build the SVG */
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', VIEWS[mode].join(' '));
    svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    svg.setAttribute('aria-label', 'Illustrated dental operatory');
    svg.setAttribute('role', 'img');
    svg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';

    var html = '';
    html += '<style>' +
      '.vo-lamp{animation:voLampPulse 5s ease-in-out infinite}' +
      '.vo-lampglow{animation:voLampPulse 5s ease-in-out infinite}' +
      '.vo-panel{animation:voPanel 7s ease-in-out infinite}' +
      '@keyframes voLampPulse{0%,100%{opacity:1}50%{opacity:0.82}}' +
      '@keyframes voPanel{0%,100%{opacity:1}50%{opacity:0.88}}' +
      '.vo-hs{fill:transparent;stroke:transparent;stroke-width:4;cursor:pointer;pointer-events:auto}' +
      '.vo-hs:hover{fill:rgba(45,212,191,0.10);stroke:#2dd4bf;stroke-dasharray:10 7}' +
      '.vo-person{transition:filter .25s}' +
      '.vo-person.vo-speaking{filter:url(#voSpeak)}' +
      '</style>';
    html += defs();

    /* -------- room composition -------- */
    html += '<g id="voRoom">';
    html += roomShell();
    html += ceilingLights();
    html += windowArt();
    html += cabinetry();
    html += monitor();
    html += steriDoor();
    html += xrayArm();
    html += plant();
    html += deliveryUnit();
    html += chair();
    html += '<g id="voPatient" class="vo-person">' + patientArt(patientId) + '</g>';
    html += chairNearArm();
    html += deliveryBase();
    html += '<g id="voTray">' + trayArm(patientId) + '</g>';
    html += dentistStool();
    html += '<g id="voDentist" class="vo-person">' + dentistArt(patientId != null) + '</g>';
    html += opLight();
    html += '<g id="voAssistant" class="vo-person">' + assistantArt(patientId != null) + '</g>';
    html += RR(0, 0, 1600, 1000, 0, 'url(#voVign)', 'pointer-events="none"');
    /* hotspots on top */
    html += '<g id="voHots">';
    KEYS.forEach(function (k) {
      html += '<g class="vo-hs" data-hs="' + k + '"><title>' + LABELS[k] + '</title>' + HOTSHAPES[k] + '</g>';
    });
    html += '</g>';
    html += '</g>';

    /* -------- sterilization room composition -------- */
    html += steriRoom();

    svg.innerHTML = html;
    el.appendChild(svg);

    /* pins overlay */
    var pinsEl = el.querySelector('#pins');
    if (!pinsEl) {
      pinsEl = document.createElement('div');
      pinsEl.id = 'pins';
      el.appendChild(pinsEl);
    }
    pinsEl.innerHTML = '';
    var pinEls = [];
    KEYS.forEach(function (k, i) {
      var b = document.createElement('button');
      b.className = 'hot';
      b.dataset.st = k;
      b.type = 'button';
      b.innerHTML = (i + 1) + '<span class="pinlabel">' + LABELS[k] + '</span>';
      b.addEventListener('click', function () { onStation(k); });
      pinsEl.appendChild(b);
      pinEls.push(b);
    });

    /* hotspot clicks */
    svg.querySelectorAll('.vo-hs').forEach(function (hs) {
      hs.addEventListener('click', function () { onStation(hs.getAttribute('data-hs')); });
    });

    /* ---- camera (animated viewBox) ---- */
    var cur = VIEWS[mode].slice();
    var anim = null;
    function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
    function applyVB(vb) {
      svg.setAttribute('viewBox', vb[0] + ' ' + vb[1] + ' ' + vb[2] + ' ' + vb[3]);
      positionPins();
    }
    function flyTo(target, ms) {
      if (anim) cancelAnimationFrame(anim.raf);
      var from = cur.slice(), t0 = null;
      anim = {};
      function step(ts) {
        if (destroyed) return;
        if (t0 === null) t0 = ts;
        var t = Math.min(1, (ts - t0) / (ms || 700));
        var e = ease(t);
        cur = from.map(function (v, i) { return v + (target[i] - v) * e; });
        applyVB(cur);
        if (t < 1) anim.raf = requestAnimationFrame(step);
        else { anim = null; }
      }
      anim.raf = requestAnimationFrame(step);
    }

    /* ---- pin projection (accounts for preserveAspectRatio=slice) ---- */
    function positionPins() {
      var w = el.clientWidth, h = el.clientHeight;
      if (!w || !h) return;
      var scale = Math.max(w / cur[2], h / cur[3]);
      var ox = (w - cur[2] * scale) / 2, oy = (h - cur[3] * scale) / 2;
      var show = (mode === 'room');
      pinEls.forEach(function (p) {
        var a = ANCHORS[p.dataset.st];
        if (!a || !show) { p.style.display = 'none'; return; }
        var x = (a[0] - cur[0]) * scale + ox;
        var y = (a[1] - cur[1]) * scale + oy;
        /* keep pins clearly inside the visible crop (slice can cut the edges) */
        if (x > 16 && x < w - 16 && y > 16 && y < h - 16) {
          p.style.display = '';
          p.style.left = x + 'px';
          p.style.top = y + 'px';
        } else p.style.display = 'none';
      });
    }
    var ro = null;
    if (window.ResizeObserver) { ro = new ResizeObserver(positionPins); ro.observe(el); }
    window.addEventListener('resize', positionPins);

    /* ---- subtle pointer parallax (room mode only) ---- */
    var gRoom = svg.querySelector('#voRoom');
    function onMove(e) {
      if (mode !== 'room' || !gRoom) return;
      var r = el.getBoundingClientRect();
      var nx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      var ny = ((e.clientY - r.top) / r.height - 0.5) * 2;
      gRoom.style.transform = 'translate(' + (-nx * 5) + 'px,' + (-ny * 3) + 'px)';
    }
    function onLeave() { if (gRoom) gRoom.style.transform = ''; }
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);

    /* ---- ctrl ---- */
    function setPatient(pid) {
      patientId = pid;
      var gp = svg.querySelector('#voPatient');
      if (gp) gp.innerHTML = patientArt(pid);
      var gd = svg.querySelector('#voDentist');
      if (gd) gd.innerHTML = dentistArt(pid != null);
      var ga = svg.querySelector('#voAssistant');
      if (ga) ga.innerHTML = assistantArt(pid != null);
      var gt = svg.querySelector('#voTray');
      if (gt) gt.innerHTML = trayArm(pid);
    }
    function applyModeClass() {
      if (el.classList) el.classList.toggle('vo-mode-room', mode === 'room');
    }
    var ctrl = {
      setMode: function (m, o) {
        if (!VIEWS[m]) m = 'room';
        mode = m;
        if (o && 'patientId' in o) setPatient(o.patientId);
        if (gRoom) gRoom.style.transform = '';
        svg.querySelector('#voHots').style.display = (m === 'room') ? '' : 'none';
        applyModeClass();
        flyTo(VIEWS[m], 750);
      },
      setPatient: setPatient,
      setSpeaker: function (key) {
        ['voDentist', 'voPatient', 'voAssistant'].forEach(function (id) {
          var n = svg.querySelector('#' + id);
          if (n) n.classList.remove('vo-speaking');
        });
        var map = { dentist:'voDentist', patient:'voPatient', assistant:'voAssistant' };
        if (key && map[key]) {
          var n2 = svg.querySelector('#' + map[key]);
          if (n2) n2.classList.add('vo-speaking');
        }
      },
      repaintPins: function (explored) {
        explored = explored || {};
        pinEls.forEach(function (p) { p.classList.toggle('done', !!explored[p.dataset.st]); });
      },
      repaintLocks: function (fn) {
        lockedFn = fn || lockedFn;
        pinEls.forEach(function (p) { p.classList.toggle('locked', !!(lockedFn && lockedFn(p.dataset.st))); });
      },
      destroy: function () {
        destroyed = true;
        if (anim) cancelAnimationFrame(anim.raf);
        if (ro) ro.disconnect();
        window.removeEventListener('resize', positionPins);
        el.removeEventListener('pointermove', onMove);
        el.removeEventListener('pointerleave', onLeave);
        if (svg.parentNode) svg.parentNode.removeChild(svg);
        if (el.classList) el.classList.remove('vo-mode-room');
        pinsEl.innerHTML = '';
      }
    };
    applyModeClass();
    positionPins();
    return ctrl;
  }

  g.SL_SCENE = { mount: mount };
})(window);
