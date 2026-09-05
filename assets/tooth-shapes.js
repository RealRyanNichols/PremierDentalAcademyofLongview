/* ============================================================
 * PDA tooth shapes — original SVG geometry for the Practice Pro
 * anatomical odontogram (tools/practice-pro.html, Chart module).
 *
 * Everything here is hand-written path math (no traced images):
 *   facial(num, U)   → facial-view crown + root paths for one tooth
 *   occlusal(num, …) → chewing-surface silhouette + 5 surface zones
 *   layout(opts)     → two elliptical arches (upper ∩ / lower ∪) with a
 *                      straight row of occlusal views inside each arch
 *
 * Universal numbering: #1 = upper RIGHT third molar … #16 = upper LEFT
 * third molar, #17 = lower LEFT third molar … #32 = lower RIGHT third
 * molar. Charts are drawn facing the patient, so #1/#32 sit at the
 * viewer's LEFT.
 *
 * Canonical local coordinates for facial(): 1 unit ≈ 1 mm, MESIAL at
 * −x, incisal/occlusal edge on y = 0, root apex toward −y (root "up").
 * The caller mirrors (scale −1) for the patient's right quadrants and
 * flips (scale y −1) for the lower arch, then rotates onto the arch.
 *
 * ES5 only (no arrow functions / template strings) — loaded as a plain
 * <script> with no build step.
 * ============================================================ */
(function (global) {
  'use strict';

  function r2(n) { return Math.round(n * 100) / 100; }

  // Tooth dimensions (mm-ish). md = mesiodistal crown width (facial),
  // bl = buccolingual (height of the occlusal view), crown = crown
  // height, root = root length (about 80% of textbook length so the
  // chart stays compact — proportions between teeth are preserved).
  var TYPES = {
    maxCentral:  { name: 'central incisor', md: 8.5, bl: 7,    crown: 10.5, root: 11,   shape: 'incisorMax',  roots: 'single' },
    maxLateral:  { name: 'lateral incisor', md: 6.5, bl: 6,    crown: 9,    root: 11,   shape: 'incisorMax',  roots: 'single', lateral: true },
    maxCanine:   { name: 'canine',          md: 7.5, bl: 8,    crown: 10,   root: 13.5, shape: 'canine',      roots: 'single' },
    maxPM1:      { name: '1st premolar',    md: 7,   bl: 9,    crown: 8.5,  root: 11.5, shape: 'premolar',    roots: 'bifid' },
    maxPM2:      { name: '2nd premolar',    md: 7,   bl: 9,    crown: 8.5,  root: 11.5, shape: 'premolar',    roots: 'single', round: true },
    maxM1:       { name: '1st molar',       md: 10,  bl: 11,   crown: 7.5,  root: 11,   shape: 'molar2',      roots: 'tri' },
    maxM2:       { name: '2nd molar',       md: 9.5, bl: 10.5, crown: 7,    root: 10.5, shape: 'molar2',      roots: 'tri', tight: true },
    maxM3:       { name: '3rd molar',       md: 8.5, bl: 9.5,  crown: 6.5,  root: 9,    shape: 'molar2',      roots: 'fused', third: true },
    mandCentral: { name: 'central incisor', md: 5,   bl: 6,    crown: 9,    root: 11,   shape: 'incisorMand', roots: 'single' },
    mandLateral: { name: 'lateral incisor', md: 5.5, bl: 6.5,  crown: 9.5,  root: 11.5, shape: 'incisorMand', roots: 'single', lateral: true },
    mandCanine:  { name: 'canine',          md: 7,   bl: 7.5,  crown: 11,   root: 13,   shape: 'canine',      roots: 'single', mand: true },
    mandPM1:     { name: '1st premolar',    md: 7,   bl: 8,    crown: 8.5,  root: 11.5, shape: 'premolar',    roots: 'single', mand: true },
    mandPM2:     { name: '2nd premolar',    md: 7,   bl: 8.5,  crown: 8,    root: 11.5, shape: 'premolar',    roots: 'single', mand: true, round: true },
    mandM1:      { name: '1st molar',       md: 11,  bl: 10.5, crown: 7.5,  root: 11.5, shape: 'molar3',      roots: 'bi' },
    mandM2:      { name: '2nd molar',       md: 10.5,bl: 10,   crown: 7,    root: 11,   shape: 'molar2',      roots: 'bi', tight: true, mand: true },
    mandM3:      { name: '3rd molar',       md: 10,  bl: 9.5,  crown: 6.5,  root: 9,    shape: 'molar2',      roots: 'fused', third: true, mand: true }
  };
  var UPPER = ['maxM3', 'maxM2', 'maxM1', 'maxPM2', 'maxPM1', 'maxCanine', 'maxLateral', 'maxCentral'];
  var LOWER = ['mandM3', 'mandM2', 'mandM1', 'mandPM2', 'mandPM1', 'mandCanine', 'mandLateral', 'mandCentral'];

  function typeOf(num) {
    num = +num;
    if (num >= 1 && num <= 8) return UPPER[num - 1];
    if (num >= 9 && num <= 16) return UPPER[16 - num];
    if (num >= 17 && num <= 24) return LOWER[num - 17];
    if (num >= 25 && num <= 32) return LOWER[32 - num];
    return 'maxM1';
  }
  function spec(num) { return TYPES[typeOf(num)]; }
  function isUpper(num) { return +num <= 16; }
  // Patient's right quadrants (1–8, 25–32) sit on the viewer's left, so
  // their mesial surface faces the viewer's RIGHT (toward the midline).
  function mesialRight(num) { num = +num; return num <= 8 || num >= 25; }
  function isAnterior(num) { num = +num; return (num >= 6 && num <= 11) || (num >= 22 && num <= 27); }
  function kindOf(num) {
    var s = spec(num).shape;
    if (s === 'molar2' || s === 'molar3') return 'molar';
    if (s === 'premolar') return 'premolar';
    return 'anterior';
  }

  // ── Facial-view crowns (canonical coords, see header) ──────────
  // Each builder returns { d, cw, bow }: the outline, the cervical
  // half-width and how far the CEJ bows apically (the pink gingival
  // band and the roots are drawn from the same numbers).
  function crownIncisorMax(t, p) {
    var hw = t.md / 2, Hc = t.crown, cw = hw * 0.6, bow = 0.9;
    var rm = t.lateral ? 0.8 : 0.35;   // mesio-incisal corner (central = sharp)
    var rd = t.lateral ? 1.5 : 1.1;    // disto-incisal corner (rounded)
    var d = 'M' + p(-hw + rm, 0) +
      ' Q' + p(0, 0.25) + ' ' + p(hw - rd, 0) +                                        // incisal edge (faint convexity)
      ' C' + p(hw - rd * 0.25, 0) + ' ' + p(hw, -rd * 0.35) + ' ' + p(hw, -rd) +
      ' C' + p(hw + 0.1, -Hc * 0.45) + ' ' + p(cw + 0.9, -Hc * 0.82) + ' ' + p(cw, -Hc) +
      ' Q' + p(0, -Hc - bow) + ' ' + p(-cw, -Hc) +
      ' C' + p(-cw - 0.9, -Hc * 0.82) + ' ' + p(-hw - 0.05, -Hc * 0.45) + ' ' + p(-hw, -rm) +
      ' Q' + p(-hw, -rm * 0.3) + ' ' + p(-hw + rm, 0) + ' Z';
    return { d: d, cw: cw, bow: bow };
  }
  function crownIncisorMand(t, p) {
    var hw = t.md / 2, Hc = t.crown, cw = hw * 0.66, bow = 0.7, rc = 0.45;
    var d = 'M' + p(-hw + rc, 0) +
      ' L' + p(hw - rc, 0) +
      ' Q' + p(hw, 0) + ' ' + p(hw, -rc) +
      ' C' + p(hw + 0.05, -Hc * 0.4) + ' ' + p(cw + 0.5, -Hc * 0.8) + ' ' + p(cw, -Hc) +
      ' Q' + p(0, -Hc - bow) + ' ' + p(-cw, -Hc) +
      ' C' + p(-cw - 0.5, -Hc * 0.8) + ' ' + p(-hw - 0.05, -Hc * 0.4) + ' ' + p(-hw, -rc) +
      ' Q' + p(-hw, 0) + ' ' + p(-hw + rc, 0) + ' Z';
    return { d: d, cw: cw, bow: bow };
  }
  function crownCanine(t, p) {
    var hw = t.md / 2, Hc = t.crown, cw = hw * 0.62, bow = 1.0;
    var tipX = -0.35;                        // cusp tip slightly mesial
    var mc = -Hc * 0.3, dc = -Hc * 0.42;     // mesial contact incisal, distal contact more cervical
    var d = 'M' + p(tipX, 0) +
      ' C' + p(tipX - hw * 0.45, -0.35) + ' ' + p(-hw * 0.92, mc * 0.6) + ' ' + p(-hw, mc) +
      ' C' + p(-hw - 0.15, mc - 2) + ' ' + p(-cw - 0.7, -Hc * 0.82) + ' ' + p(-cw, -Hc) +
      ' Q' + p(0, -Hc - bow) + ' ' + p(cw, -Hc) +
      ' C' + p(cw + 0.7, -Hc * 0.82) + ' ' + p(hw + 0.15, dc - 2) + ' ' + p(hw, dc) +
      ' C' + p(hw * 0.92, dc * 0.55) + ' ' + p(tipX + hw * 0.5, -0.4) + ' ' + p(tipX, 0) + ' Z';
    return { d: d, cw: cw, bow: bow };
  }
  function crownPremolar(t, p) {
    var hw = t.md / 2, Hc = t.crown, cw = hw * 0.66, bow = 0.8;
    // Facial view of a premolar reads like a short canine: one pointed
    // buccal cusp with two sloping cusp ridges (rounder on 2nd premolars).
    var c = -Hc * 0.3, tipY = 0, k = t.round ? 0.55 : 0.35;
    var d = 'M' + p(0, tipY) +
      ' C' + p(-hw * k, -0.7 * k) + ' ' + p(-hw * 0.92, c * 0.72) + ' ' + p(-hw, c) +
      ' C' + p(-hw - 0.1, c - 1.5) + ' ' + p(-cw - 0.7, -Hc * 0.85) + ' ' + p(-cw, -Hc) +
      ' Q' + p(0, -Hc - bow) + ' ' + p(cw, -Hc) +
      ' C' + p(cw + 0.7, -Hc * 0.85) + ' ' + p(hw + 0.1, c - 1.5) + ' ' + p(hw, c) +
      ' C' + p(hw * 0.92, c * 0.72) + ' ' + p(hw * k, -0.7 * k) + ' ' + p(0, tipY) + ' Z';
    return { d: d, cw: cw, bow: bow };
  }
  // Two buccal cusps (upper molars, lower 2nd/3rd molars).
  function crownMolar2(t, p) {
    var hw = t.md / 2, Hc = t.crown, cw = hw * (t.third ? 0.78 : 0.8), bow = 0.8;
    var c = -Hc * 0.38;
    var mb = [-hw * 0.5, 0], db = [hw * 0.48, -0.2], n = [-0.02, -1.0];
    var d = 'M' + p(-hw, c) +
      ' C' + p(-hw + 0.05, c + 1.6) + ' ' + p(mb[0] - 1.3, -0.35) + ' ' + p(mb[0], mb[1]) +
      ' C' + p(mb[0] + 1.1, 0.05) + ' ' + p(n[0] - 0.7, n[1] + 0.35) + ' ' + p(n[0], n[1]) +
      ' C' + p(n[0] + 0.7, n[1] + 0.35) + ' ' + p(db[0] - 1.1, db[1] + 0.05) + ' ' + p(db[0], db[1]) +
      ' C' + p(db[0] + 1.2, db[1] - 0.3) + ' ' + p(hw - 0.05, c + 1.5) + ' ' + p(hw, c) +
      ' C' + p(hw + 0.1, c - 1.5) + ' ' + p(cw + 0.6, -Hc * 0.86) + ' ' + p(cw, -Hc) +
      ' Q' + p(0, -Hc - bow) + ' ' + p(-cw, -Hc) +
      ' C' + p(-cw - 0.6, -Hc * 0.86) + ' ' + p(-hw - 0.1, c - 1.5) + ' ' + p(-hw, c) + ' Z';
    return { d: d, cw: cw, bow: bow, grooves: [n] };
  }
  // Three buccal cusps (lower first molar: mesiobuccal, distobuccal, distal).
  function crownMolar3(t, p) {
    var hw = t.md / 2, Hc = t.crown, cw = hw * 0.82, bow = 0.8;
    var c = -Hc * 0.4;
    var mb = [-hw * 0.6, 0], db = [-hw * 0.02, -0.15], dd = [hw * 0.6, -0.55];
    var n1 = [-hw * 0.31, -0.95], n2 = [hw * 0.3, -1.05];
    var d = 'M' + p(-hw, c) +
      ' C' + p(-hw + 0.05, c + 1.5) + ' ' + p(mb[0] - 1.2, -0.3) + ' ' + p(mb[0], mb[1]) +
      ' C' + p(mb[0] + 0.9, 0.05) + ' ' + p(n1[0] - 0.6, n1[1] + 0.3) + ' ' + p(n1[0], n1[1]) +
      ' C' + p(n1[0] + 0.5, n1[1] + 0.3) + ' ' + p(db[0] - 0.9, db[1] + 0.05) + ' ' + p(db[0], db[1]) +
      ' C' + p(db[0] + 0.8, db[1] + 0.02) + ' ' + p(n2[0] - 0.5, n2[1] + 0.3) + ' ' + p(n2[0], n2[1]) +
      ' C' + p(n2[0] + 0.5, n2[1] + 0.25) + ' ' + p(dd[0] - 0.7, dd[1] + 0.05) + ' ' + p(dd[0], dd[1]) +
      ' C' + p(dd[0] + 0.9, dd[1] - 0.1) + ' ' + p(hw - 0.05, c + 1.4) + ' ' + p(hw, c) +
      ' C' + p(hw + 0.1, c - 1.4) + ' ' + p(cw + 0.5, -Hc * 0.86) + ' ' + p(cw, -Hc) +
      ' Q' + p(0, -Hc - bow) + ' ' + p(-cw, -Hc) +
      ' C' + p(-cw - 0.5, -Hc * 0.86) + ' ' + p(-hw - 0.1, c - 1.4) + ' ' + p(-hw, c) + ' Z';
    return { d: d, cw: cw, bow: bow, grooves: [n1, n2] };
  }

  // ── Roots (canonical coords) ───────────────────────────────────
  // Each root: { d, back, apex:[x,y], canal:[x1,y1,x2,y2] }. `back`
  // roots (palatal) are drawn first, behind the buccal roots.
  // Rounded apex: the two sides stop just short of the tip and a tiny
  // quadratic arc closes them (real apices are blunt, not needles).
  function tip(p, ax, ya, w) {
    w = w || 0.32;
    return ' Q' + p(ax, ya - w * 0.55) + ' ' + p(ax + w, ya + w * 1.1);
  }
  function rootSingle(t, p, cw, ax, lenF, back, shift) {
    var Hc = t.crown, L = t.root * (lenF || 1), y0 = -Hc, ya = -Hc - L, sx = shift || 0, tw = 0.32;
    ax = (ax || 0) + sx;
    var d = 'M' + p(-cw + sx, y0) +
      ' C' + p(-cw + sx, y0 - L * 0.4) + ' ' + p(ax - 0.9, ya + L * 0.16) + ' ' + p(ax - tw, ya + tw * 1.1) +
      tip(p, ax, ya, tw) +
      ' C' + p(ax + 0.9, ya + L * 0.16) + ' ' + p(cw + sx, y0 - L * 0.4) + ' ' + p(cw + sx, y0) + ' Z';
    return { d: d, back: !!back, apex: [ax, ya], canal: [sx + (ax - sx) * 0.15, y0 - 0.6, ax - (ax - sx) * 0.1, ya + L * 0.12] };
  }
  // Mesial + distal roots joined by a root trunk (lower molars; buccal pair of upper molars).
  function rootPair(t, p, cw, opt) {
    opt = opt || {};
    var Hc = t.crown, L = t.root * (opt.lenF || 1), y0 = -Hc, ya = -Hc - L;
    var spread = opt.spread || 0.9, fy = y0 - L * (opt.trunk || 0.3);
    var mx = -cw * spread, dx = cw * (spread - 0.1), dya = ya + L * 0.1, tw = 0.3;
    var d = 'M' + p(-cw, y0) +
      ' C' + p(-cw - 0.2, y0 - L * 0.35) + ' ' + p(mx - 1.0, ya + L * 0.22) + ' ' + p(mx - tw, ya + tw * 1.1) +
      tip(p, mx, ya, tw) +
      ' C' + p(mx + 1.0, ya + L * 0.14) + ' ' + p(-cw * 0.3, y0 - L * 0.58) + ' ' + p(-0.05, fy) +
      ' C' + p(cw * 0.25, y0 - L * 0.58) + ' ' + p(dx - 0.9, dya + L * 0.18) + ' ' + p(dx - tw, dya + tw * 1.1) +
      tip(p, dx, dya, tw) +
      ' C' + p(dx + 0.9, dya + L * 0.24) + ' ' + p(cw + 0.1, y0 - L * 0.35) + ' ' + p(cw, y0) + ' Z';
    return [
      { d: d, back: false, apex: [mx, ya], canal: [-cw * 0.5, y0 - 0.6, mx * 0.9, ya + L * 0.16] },
      { d: '', back: false, apex: [dx, dya], canal: [cw * 0.45, y0 - 0.6, dx * 0.9, dya + L * 0.2] }
    ];
  }
  function rootFused(t, p, cw) {
    var Hc = t.crown, L = t.root, y0 = -Hc, ya = -Hc - L, ax = 0.5, tw = 0.6;
    var d = 'M' + p(-cw, y0) +
      ' C' + p(-cw - 0.1, y0 - L * 0.45) + ' ' + p(ax - 1.8, ya + L * 0.14) + ' ' + p(ax - tw, ya + tw * 0.9) +
      tip(p, ax, ya, tw) +
      ' C' + p(ax + 1.6, ya + L * 0.16) + ' ' + p(cw + 0.05, y0 - L * 0.45) + ' ' + p(cw, y0) + ' Z';
    var groove = 'M' + p(0.1, y0 - L * 0.2) + ' Q' + p(0.4, y0 - L * 0.55) + ' ' + p(ax, ya + L * 0.2);
    return [{ d: d, back: false, apex: [ax, ya], canal: [-0.6, y0 - 0.6, ax * 0.8 - 0.5, ya + L * 0.18], groove: groove },
            { d: '', back: false, apex: [ax + 0.2, ya + 0.1], canal: [1.1, y0 - 0.6, ax * 0.8 + 0.9, ya + L * 0.22] }];
  }

  function rootsFor(t, p, cw) {
    var Hc = t.crown, L = t.root;
    switch (t.roots) {
      case 'single':
        return [rootSingle(t, p, cw, t.shape === 'canine' ? 0.25 : 0.3)];
      case 'bifid': { // upper 1st premolar: buccal root in front, palatal root behind (bifurcation visible)
        var pal = rootSingle(t, p, cw * 0.62, 0.9, 0.96, true, 1.0);
        var buc = 'M' + p(-cw, -Hc) +
          ' C' + p(-cw - 0.05, -Hc - L * 0.42) + ' ' + p(-1.4, -Hc - L * 0.84) + ' ' + p(-0.9, -Hc - L + 0.35) +
          tip(p, -0.6, -Hc - L, 0.3) +
          ' C' + p(0.2, -Hc - L * 0.84) + ' ' + p(0.35, -Hc - L * 0.6) + ' ' + p(0.5, -Hc - L * 0.42) +
          ' C' + p(0.75, -Hc - L * 0.28) + ' ' + p(cw - 0.05, -Hc - L * 0.14) + ' ' + p(cw, -Hc) + ' Z';
        return [pal, { d: buc, back: false, apex: [-0.6, -Hc - L], canal: [-0.5, -Hc - 0.6, -0.6, -Hc - L * 0.88] }];
      }
      case 'bi':
        return rootPair(t, p, cw, { spread: t.tight ? 0.8 : 0.92, trunk: t.tight ? 0.34 : 0.28 });
      case 'tri': { // upper molars: two buccal roots + palatal root peeking between/behind
        var palRoot = rootSingle(t, p, cw * 0.5, 0.6, 1.04, true, 0.2);
        var pair = rootPair(t, p, cw, { spread: t.tight ? 0.78 : 0.9, trunk: t.tight ? 0.36 : 0.3, lenF: 0.93 });
        return [palRoot, pair[0], pair[1]];
      }
      case 'fused':
      default:
        return rootFused(t, p, cw);
    }
  }

  // ── facial(num, U) ─────────────────────────────────────────────
  // Returns px-scaled paths in canonical orientation (see header).
  function facial(num, U) {
    U = U || 6;
    var t = spec(num);
    function p(x, y) { return r2(x * U) + ' ' + r2(y * U); }
    var crown;
    switch (t.shape) {
      case 'incisorMax': crown = crownIncisorMax(t, p); break;
      case 'incisorMand': crown = crownIncisorMand(t, p); break;
      case 'canine': crown = crownCanine(t, p); break;
      case 'premolar': crown = crownPremolar(t, p); break;
      case 'molar3': crown = crownMolar3(t, p); break;
      default: crown = crownMolar2(t, p);
    }
    var cw = crown.cw, Hc = t.crown, hw = t.md / 2;
    var cej = 'M' + p(-cw, -Hc) + ' Q' + p(0, -Hc - crown.bow) + ' ' + p(cw, -Hc);
    var roots = rootsFor(t, p, cw);
    // Subtle developmental lines: lobe grooves, labial/buccal ridges, buccal grooves.
    var details = [];
    if (t.shape === 'incisorMax') {
      details.push('M' + p(-hw * 0.3, -1.3) + ' Q' + p(-hw * 0.34, -Hc * 0.45) + ' ' + p(-hw * 0.26, -Hc * 0.75));
      details.push('M' + p(hw * 0.3, -1.3) + ' Q' + p(hw * 0.34, -Hc * 0.45) + ' ' + p(hw * 0.26, -Hc * 0.75));
    } else if (t.shape === 'incisorMand') {
      details.push('M' + p(0, -1.2) + ' L' + p(0, -Hc * 0.55));
    } else if (t.shape === 'canine') {
      details.push('M' + p(-0.35, -0.9) + ' Q' + p(-0.1, -Hc * 0.4) + ' ' + p(0.2, -Hc * 0.72));
    } else if (t.shape === 'premolar') {
      details.push('M' + p(0, -0.9) + ' Q' + p(0.05, -Hc * 0.35) + ' ' + p(0.1, -Hc * 0.62));
    } else if (crown.grooves) {
      for (var g = 0; g < crown.grooves.length; g++) {
        var n = crown.grooves[g], len = g === 0 ? 0.6 : 0.42;
        details.push('M' + p(n[0], n[1] - 0.2) + ' Q' + p(n[0] + 0.15, -Hc * 0.35) + ' ' + p(n[0] + 0.1, -Hc * len));
      }
    }
    var rootPaths = [], canals = [], apices = [];
    for (var i = 0; i < roots.length; i++) {
      var rt = roots[i];
      if (rt.d) rootPaths.push({ d: rt.d, back: rt.back });
      if (rt.groove) details.push(rt.groove);
      canals.push([r2(rt.canal[0] * U), r2(rt.canal[1] * U), r2(rt.canal[2] * U), r2(rt.canal[3] * U)]);
      apices.push([r2(rt.apex[0] * U), r2(rt.apex[1] * U)]);
    }
    var total = (t.crown + t.root) * U;
    return {
      num: +num, type: typeOf(num), w: r2(t.md * U), crownH: r2(Hc * U), rootH: r2(t.root * U), totalH: r2(total),
      crown: crown.d, cej: cej, roots: rootPaths, details: details, canals: canals, apices: apices,
      crownCenter: [0, r2(-Hc * U * 0.5)], rootCenter: [0, r2(-(Hc + t.root * 0.5) * U)]
    };
  }

  // ── occlusal(num, w, h, opts) ──────────────────────────────────
  // Chewing-surface (incisal for anteriors) silhouette centred on 0,0,
  // w px wide (mesiodistal) and h px tall (buccolingual), plus the five
  // surface zones. opts.flip = buccal at the BOTTOM (lower arch);
  // opts.mesialRight = mesial cap on the right (patient's right side).
  function superellipse(a, bTop, bBot, n, steps) {
    var pts = [];
    for (var i = 0; i < steps; i++) {
      var th = (Math.PI * 2 * i) / steps, c = Math.cos(th), s = Math.sin(th);
      var b = s < 0 ? bTop : bBot; // y negative = top
      var x = a * (c < 0 ? -1 : 1) * Math.pow(Math.abs(c), 2 / n);
      var y = b * (s < 0 ? -1 : 1) * Math.pow(Math.abs(s), 2 / n);
      pts.push([r2(x), r2(y)]);
    }
    return pts;
  }
  function poly(pts) {
    var s = 'M' + pts[0][0] + ' ' + pts[0][1];
    for (var i = 1; i < pts.length; i++) s += ' L' + r2(pts[i][0]) + ' ' + r2(pts[i][1]);
    return s + ' Z';
  }
  function occlusal(num, w, h, opts) {
    opts = opts || {};
    var kind = kindOf(num), a = w / 2, b = h / 2, flip = !!opts.flip, mr = !!opts.mesialRight;
    var n = kind === 'molar' ? 2.9 : kind === 'premolar' ? 2.3 : 2.0;
    var bTop = b, bBot = b;
    if (kind === 'anterior') { bTop = b * 1.08; bBot = b * 0.92; if (flip) { bTop = b * 0.92; bBot = b * 1.08; } }
    var outline = poly(superellipse(a, bTop, bBot, n, 64));
    var zones = {}, details = [];
    var top, bot, left, right;
    if (kind === 'anterior') {
      var xi = a * 0.34, yi = b * 0.17, P = 1.5;
      left  = poly([[-a - P, -b - P], [-xi, -b - P], [-xi, b + P], [-a - P, b + P]]);
      right = poly([[xi, -b - P], [a + P, -b - P], [a + P, b + P], [xi, b + P]]);
      top   = poly([[-xi, -b - P], [xi, -b - P], [xi, -yi], [-xi, -yi]]);
      bot   = poly([[-xi, yi], [xi, yi], [xi, b + P], [-xi, b + P]]);
      zones.I = poly([[-xi, -yi], [xi, -yi], [xi, yi], [-xi, yi]]);
    } else {
      var xo = a * 0.42, yo = b * 0.4, Q = 1.5;
      zones.O = poly([[-xo, -yo], [xo, -yo], [xo, yo], [-xo, yo]]);
      top   = poly([[-a - Q, -b - Q], [a + Q, -b - Q], [xo, -yo], [-xo, -yo]]);
      bot   = poly([[-a - Q, b + Q], [a + Q, b + Q], [xo, yo], [-xo, yo]]);
      left  = poly([[-a - Q, -b - Q], [-xo, -yo], [-xo, yo], [-a - Q, b + Q]]);
      right = poly([[a + Q, -b - Q], [xo, -yo], [xo, yo], [a + Q, b + Q]]);
      // central groove (mesiodistal) + a short buccolingual groove for molars
      details.push('M' + r2(-xo * 0.75) + ' 0 L' + r2(xo * 0.75) + ' 0');
      if (kind === 'molar') details.push('M0 ' + r2(-yo * 0.7) + ' L0 ' + r2(yo * 0.7));
    }
    zones.B = flip ? bot : top;
    zones.L = flip ? top : bot;
    zones.M = mr ? right : left;
    zones.D = mr ? left : right;
    return { outline: outline, zones: zones, details: details, kind: kind, w: r2(w), h: r2(h) };
  }

  // ── layout(opts) ───────────────────────────────────────────────
  // Positions all 32 teeth: facial views along two elliptical arcs
  // (upper ∩ above, lower ∪ below), each tooth rotated so its roots
  // point outward, plus a straight row of occlusal views just inside
  // each arch, aligned by x with its facial tooth.
  function layout(opts) {
    opts = opts || {};
    var U = opts.unit || 6, W = opts.width || 1000, cx = W / 2;
    var gap = opts.gap != null ? opts.gap : 2.5;
    var a = opts.a || 640, b = opts.b || 330;
    var topPad = opts.topPad || 46, botPad = opts.botPad || 46, rowGap = opts.rowGap || 12, midGap = opts.midGap || 34;

    // arc-length table for the quarter ellipse x = a sin t, y = b (1 - cos t)
    var N = 2000, ts = [], ss = [], acc = 0, px = 0, py = 0;
    for (var i = 0; i <= N; i++) {
      var t = (Math.PI / 2) * i / N, x = a * Math.sin(t), y = b * (1 - Math.cos(t));
      if (i) acc += Math.sqrt((x - px) * (x - px) + (y - py) * (y - py));
      ts.push(t); ss.push(acc); px = x; py = y;
    }
    function tAt(arc) {
      var lo = 0, hi = N;
      while (lo < hi) { var mid = (lo + hi) >> 1; if (ss[mid] < arc) lo = mid + 1; else hi = mid; }
      if (lo === 0) return 0;
      var s0 = ss[lo - 1], s1 = ss[lo], f = s1 === s0 ? 0 : (arc - s0) / (s1 - s0);
      return ts[lo - 1] + (ts[lo] - ts[lo - 1]) * f;
    }
    // walk one half-arch from the midline outward
    function half(nums, side) {
      var out = [], s = gap / 2, prevW = 0;
      for (var i = 0; i < nums.length; i++) {
        var sp = spec(nums[i]), wpx = sp.md * U;
        s += (i ? prevW / 2 + gap : 0) + wpx / 2;
        var t = tAt(s), dx = a * Math.sin(t), dy = b * (1 - Math.cos(t));
        var deg = Math.atan2(b * Math.sin(t), a * Math.cos(t)) * 180 / Math.PI;
        out.push({ num: nums[i], w: r2(wpx), dx: dx, dy: dy, deg: deg * side, side: side });
        prevW = wpx;
      }
      return out;
    }
    function rotBox(w, hTot, deg) { // vertical extent of a w × hTot rect (y from -hTot to 0) rotated by deg
      var rad = deg * Math.PI / 180, c = Math.cos(rad), s = Math.sin(rad), minY = 1e9, maxY = -1e9, minX = 1e9, maxX = -1e9;
      var corners = [[-w / 2, 0], [w / 2, 0], [-w / 2, -hTot], [w / 2, -hTot]];
      for (var i = 0; i < 4; i++) {
        var X = corners[i][0] * c - corners[i][1] * s, Y = corners[i][0] * s + corners[i][1] * c;
        if (Y < minY) minY = Y; if (Y > maxY) maxY = Y; if (X < minX) minX = X; if (X > maxX) maxX = X;
      }
      return { minY: minY, maxY: maxY, minX: minX, maxX: maxX };
    }
    function arch(upper) {
      var leftNums = upper ? [8, 7, 6, 5, 4, 3, 2, 1] : [25, 26, 27, 28, 29, 30, 31, 32];
      var rightNums = upper ? [9, 10, 11, 12, 13, 14, 15, 16] : [24, 23, 22, 21, 20, 19, 18, 17];
      // rotation sign: upper viewer-right = +deg (clockwise); lower is mirrored vertically
      var L = half(leftNums, upper ? -1 : 1), R = half(rightNums, upper ? 1 : -1);
      var teeth = [];
      for (var i = L.length - 1; i >= 0; i--) teeth.push({ num: L[i].num, w: L[i].w, x: cx - L[i].dx, dy: L[i].dy, deg: L[i].deg });
      for (var j = 0; j < R.length; j++) teeth.push({ num: R[j].num, w: R[j].w, x: cx + R[j].dx, dy: R[j].dy, deg: R[j].deg });
      var hTop = -1e9, hBot = -1e9; // how far the drawing extends beyond the arc point (toward the roots / toward the crowns)
      for (var k = 0; k < teeth.length; k++) {
        var sp = spec(teeth[k].num), tot = (sp.crown + sp.root) * U, box = rotBox(teeth[k].w, tot, teeth[k].deg);
        teeth[k].sx = mesialRight(teeth[k].num) ? -1 : 1;
        teeth[k].sy = upper ? 1 : -1;
        teeth[k].rootUp = upper ? (-box.minY - teeth[k].dy) : (-box.minY - teeth[k].dy);
        // extents relative to the arc APEX line (dy added): root side and crown side
        var rootExt = -box.minY - teeth[k].dy;  // above the apex line (upper) — larger for the anteriors
        var crownExt = box.maxY + teeth[k].dy;   // below the apex line (upper)
        if (rootExt > hTop) hTop = rootExt;
        if (crownExt > hBot) hBot = crownExt;
        teeth[k].rootExt = rootExt; teeth[k].crownExt = crownExt;
      }
      return { teeth: teeth, rootExt: hTop, crownExt: hBot };
    }
    var up = arch(true), lo = arch(false);
    // picker sizes: as wide as the tooth, but never wider than the room between neighbours
    function pickers(list) {
      var maxH = 0;
      for (var i = 0; i < list.length; i++) {
        var sp = spec(list[i].num), room = 1e9;
        if (i > 0) room = Math.min(room, list[i].x - list[i - 1].x);
        if (i < list.length - 1) room = Math.min(room, list[i + 1].x - list[i].x);
        var w = Math.min(sp.md * U, room - 4), h = sp.bl * U * (w / (sp.md * U));
        list[i].pw = r2(w); list[i].ph = r2(h);
        if (h > maxH) maxH = h;
      }
      return maxH;
    }
    var phU = pickers(up.teeth), phL = pickers(lo.teeth);
    // vertical stacking
    var yApexU = topPad + up.rootExt;                 // upper arch apex line (centrals' incisal edge)
    var yPickU = yApexU + up.crownExt + rowGap + phU / 2;
    var yNumU = yPickU + phU / 2 + 13;
    var yNumL = yNumU + midGap;
    var yPickL = yNumL + 9 + phL / 2;
    var yApexL = yPickL + phL / 2 + rowGap + lo.crownExt; // lower arch apex line (centrals' incisal edge)
    var H = Math.ceil(yApexL + lo.rootExt + botPad);
    for (var u = 0; u < up.teeth.length; u++) { var T = up.teeth[u]; T.y = r2(yApexU + T.dy); T.x = r2(T.x); T.deg = r2(T.deg); T.py = r2(yPickU); T.ny = r2(yNumU); T.upper = true; }
    for (var l = 0; l < lo.teeth.length; l++) { var S = lo.teeth[l]; S.y = r2(yApexL - S.dy); S.x = r2(S.x); S.deg = r2(S.deg); S.py = r2(yPickL); S.ny = r2(yNumL); S.upper = false; }
    return {
      W: W, H: H, U: U, cx: cx,
      upper: up.teeth, lower: lo.teeth,
      yApexU: r2(yApexU), yApexL: r2(yApexL), yPickU: r2(yPickU), yPickL: r2(yPickL), yNumU: r2(yNumU), yNumL: r2(yNumL),
      pickH: { upper: r2(phU), lower: r2(phL) }, yMid: r2((yNumU + yNumL) / 2)
    };
  }

  // world position of a local facial-view point for a placed tooth
  function toWorld(T, lx, ly) {
    var x = lx * T.sx, y = ly * T.sy, rad = T.deg * Math.PI / 180, c = Math.cos(rad), s = Math.sin(rad);
    return [r2(T.x + x * c - y * s), r2(T.y + x * s + y * c)];
  }
  function transformOf(T) {
    return 'translate(' + T.x + ' ' + T.y + ') rotate(' + T.deg + ') scale(' + T.sx + ' ' + T.sy + ')';
  }

  global.PDA_TOOTH_SHAPES = {
    version: 1,
    TYPES: TYPES,
    typeOf: typeOf, spec: spec, isUpper: isUpper, isAnterior: isAnterior, mesialRight: mesialRight, kindOf: kindOf,
    facial: facial, occlusal: occlusal, layout: layout, toWorld: toWorld, transformOf: transformOf
  };
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
