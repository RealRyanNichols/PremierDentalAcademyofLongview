/* ============================================================================
   PREMIER DENTAL ACADEMY — SKILLS LAB · PEOPLE ART
   ----------------------------------------------------------------------------
   window.SL_PEOPLE — illustrated portrait busts for every Virtual Office
   speaker (staff + patients). Pure vector, layered shading, one shared
   drawing toolkit so the whole cast reads as a single set. No image assets.

     SL_PEOPLE.has(pOrKey)          -> bool
     SL_PEOPLE.bust(pOrKey, opts?)  -> square SVG string (viewBox 0 0 120 120)

   pOrKey: a STAFF/PATIENTS object from SL_VO_DATA, or its id string.
   opts:   { size: px number (default fills its box), title: aria label }

   Unknown people get a friendly generic visitor so callers never break.
   Plain ES5 global script — safe to load anywhere, no dependencies.
   ============================================================================ */
(function (g) {
  'use strict';

  var uid = 0;
  var CX = 60;

  /* ---------------- palettes ---------------- */
  var SKIN = {
    porcelain: { base:'#f2d4bf', hi:'#fbe8da', sh:'#d8a488', ln:'#a2634a', lip:'#c3746a' },
    fair:      { base:'#efc7a5', hi:'#f8dfc4', sh:'#d29b70', ln:'#935e3b', lip:'#ba695c' },
    golden:    { base:'#eabf92', hi:'#f5d8b1', sh:'#c9925f', ln:'#855834', lip:'#b06355' },
    olive:     { base:'#dfb083', hi:'#eecaa3', sh:'#ba8455', ln:'#7a522f', lip:'#aa5e51' },
    tan:       { base:'#cd9a69', hi:'#e1b786', sh:'#a56f3e', ln:'#694322', lip:'#9e5547' },
    brown:     { base:'#a7724a', hi:'#bf8c60', sh:'#7c5131', ln:'#482c17', lip:'#8a4a3e' },
    deep:      { base:'#7e5133', hi:'#976742', sh:'#5c3721', ln:'#301c0e', lip:'#7c4038' }
  };
  var BGS = ['#e3f1ee', '#e8eef6', '#f2ecdf', '#ece8f3', '#e9f1e4', '#f3e9e4'];

  function shade(hex, f) { /* f<1 darker, f>1 lighter */
    var m = /^#([0-9a-f]{6})$/i.exec(hex); if (!m) return hex;
    var v = parseInt(m[1], 16), r = (v >> 16) & 255, gg = (v >> 8) & 255, b = v & 255;
    function c(x) { x = f > 1 ? x + (255 - x) * (f - 1) : x * f; return Math.max(0, Math.min(255, Math.round(x))); }
    function h(x) { x = x.toString(16); return x.length < 2 ? '0' + x : x; }
    return '#' + h(c(r)) + h(c(gg)) + h(c(b));
  }

  /* ---------------- geometry ---------------- */
  var ADULT = { top:29, eye:52, chin:75, w:17, jaw:0.82, chinW:6.5, neckW:8, neckTop:63, neckBot:81.5, shY:82.5, edx:7.5, es:1 };
  var CHILD = { top:33, eye:55, chin:74, w:16.5, jaw:0.92, chinW:8.6, neckW:6.2, neckTop:65, neckBot:82.5, shY:84.5, edx:7, es:1.16 };

  function geoFor(cfg) {
    var base = cfg.child ? CHILD : ADULT, gg = {}, k;
    for (k in base) gg[k] = base[k];
    if (cfg.face) for (k in cfg.face) gg[k] = cfg.face[k];
    gg.noseY = gg.eye + (cfg.child ? 7.5 : 9);
    gg.mouthY = gg.eye + (cfg.child ? 12.5 : 15);
    gg.browY = gg.eye - (cfg.child ? 6 : 5.5);
    return gg;
  }

  function facePath(gg) {
    var w = gg.w, top = gg.top, eye = gg.eye, chin = gg.chin, jaw = gg.jaw, cw = gg.chinW;
    var t = eye - top, b = chin - eye;
    return 'M' + (CX - w) + ' ' + eye +
      'C' + (CX - w) + ' ' + (top + t * 0.32) + ' ' + (CX - w * 0.62) + ' ' + top + ' ' + CX + ' ' + top +
      'C' + (CX + w * 0.62) + ' ' + top + ' ' + (CX + w) + ' ' + (top + t * 0.32) + ' ' + (CX + w) + ' ' + eye +
      'C' + (CX + w) + ' ' + (eye + b * 0.34) + ' ' + (CX + w * jaw) + ' ' + (eye + b * 0.66) + ' ' + (CX + cw) + ' ' + (chin - b * 0.05) +
      'Q' + CX + ' ' + chin + ' ' + (CX - cw) + ' ' + (chin - b * 0.05) +
      'C' + (CX - w * jaw) + ' ' + (eye + b * 0.66) + ' ' + (CX - w) + ' ' + (eye + b * 0.34) + ' ' + (CX - w) + ' ' + eye + 'Z';
  }

  function neckPath(gg) {
    var nw = gg.neckW;
    return 'M' + (CX - nw) + ' ' + gg.neckTop + 'L' + (CX - nw) + ' ' + (gg.neckBot - 4) +
      'Q' + (CX - nw - 1) + ' ' + gg.neckBot + ' ' + (CX - nw - 7) + ' ' + (gg.neckBot + 3) +
      'L' + (CX + nw + 7) + ' ' + (gg.neckBot + 3) +
      'Q' + (CX + nw + 1) + ' ' + gg.neckBot + ' ' + (CX + nw) + ' ' + (gg.neckBot - 4) +
      'L' + (CX + nw) + ' ' + gg.neckTop + 'Z';
  }

  function shouldersPath(gg) {
    var y = gg.shY;
    return 'M6 122L6 110C7 ' + (y + 11) + ' 22 ' + (y + 3) + ' 42 ' + (y + 1) +
      'C50 ' + (y - 1.5) + ' 55 ' + (y - 2) + ' 60 ' + (y - 2) +
      'C65 ' + (y - 2) + ' 70 ' + (y - 1.5) + ' 78 ' + (y + 1) +
      'C98 ' + (y + 3) + ' 113 ' + (y + 11) + ' 114 110L114 122Z';
  }

  /* ---------------- feature painters ---------------- */
  function eyeSVG(x, y, cfg, gg, u, side) {
    var s = gg.es * (cfg.eyeScale || 1), sk = cfg.sk;
    var w = 3.5 * s, lift = 2.8 * s, drop = 2.1 * s;
    var cid = 'pa' + u + 'e' + side;
    var almond = 'M' + (x - w) + ' ' + y + 'Q' + x + ' ' + (y - lift) + ' ' + (x + w) + ' ' + y +
      'Q' + x + ' ' + (y + drop) + ' ' + (x - w) + ' ' + y + 'Z';
    var out = '';
    out += '<clipPath id="' + cid + '"><path d="' + almond + '"/></clipPath>';
    out += '<path d="' + almond + '" fill="#fbfaf8"/>';
    out += '<g clip-path="url(#' + cid + ')">' +
      '<circle cx="' + x + '" cy="' + (y - 0.2) + '" r="' + (2 * s) + '" fill="' + cfg.iris + '"/>' +
      '<circle cx="' + x + '" cy="' + (y - 0.2) + '" r="' + (1 * s) + '" fill="#1d130c"/>' +
      '<circle cx="' + (x - 0.7 * s) + '" cy="' + (y - 1 * s) + '" r="0.55" fill="#fff" opacity="0.95"/>' +
      '<path d="M' + (x - w) + ' ' + y + 'Q' + x + ' ' + (y - lift) + ' ' + (x + w) + ' ' + y + 'L' + (x + w) + ' ' + (y - lift - 1) + 'L' + (x - w) + ' ' + (y - lift - 1) + 'Z" fill="' + sk.sh + '" opacity="0.28"/>' +
      '</g>';
    /* upper lid line */
    out += '<path d="M' + (x - w - 0.2) + ' ' + y + 'Q' + x + ' ' + (y - lift - 0.4) + ' ' + (x + w + 0.2) + ' ' + (y - 0.1) + '" fill="none" stroke="' + sk.ln + '" stroke-width="1.15" stroke-linecap="round"/>';
    if (cfg.lashes) {
      var lx = x + (side === 'l' ? -1 : 1) * (w + 0.3);
      out += '<path d="M' + lx + ' ' + (y - 0.2) + ' l' + (side === 'l' ? -1.5 : 1.5) + ' -1.2" stroke="' + sk.ln + '" stroke-width="1.1" stroke-linecap="round"/>';
    }
    /* lower lid hint */
    out += '<path d="M' + (x - w * 0.75) + ' ' + (y + drop * 0.85) + 'Q' + x + ' ' + (y + drop + 0.5) + ' ' + (x + w * 0.75) + ' ' + (y + drop * 0.9) + '" fill="none" stroke="' + sk.sh + '" stroke-width="0.8" opacity="0.45"/>';
    if (cfg.age === 'older') {
      out += '<path d="M' + (x - w * 0.7) + ' ' + (y + drop + 2.2) + 'Q' + x + ' ' + (y + drop + 3.4) + ' ' + (x + w * 0.7) + ' ' + (y + drop + 2.3) + '" fill="none" stroke="' + sk.sh + '" stroke-width="0.8" opacity="0.5"/>';
    }
    return out;
  }

  function browSVG(x, y, cfg, side) {
    var m = side === 'l' ? -1 : 1;
    var wgt = cfg.browW || 1.5, col = cfg.browC;
    var raise = cfg.browRaise || 0; /* + = concerned inner-up */
    var x1 = x - m * 4.2, x2 = x + m * 4.2;
    var d;
    if (cfg.browArch) {
      d = 'M' + x1 + ' ' + (y + 1 - raise) + 'Q' + (x - m * 0.5) + ' ' + (y - 1.7) + ' ' + x2 + ' ' + (y + 0.1) + '';
    } else {
      d = 'M' + x1 + ' ' + (y + 0.7 - raise) + 'Q' + x + ' ' + (y - 0.9) + ' ' + x2 + ' ' + (y + 0.4) + '';
    }
    return '<path d="' + d + '" fill="none" stroke="' + col + '" stroke-width="' + wgt + '" stroke-linecap="round"/>';
  }

  function noseSVG(cfg, gg) {
    var sk = cfg.sk, ny = gg.noseY, s = cfg.child ? 0.8 : 1;
    return '<path d="M' + (CX - 0.6) + ' ' + (gg.eye + 1.5) +
      'C' + (CX - 1.7) + ' ' + (gg.eye + 4.5) + ' ' + (CX - 2.1 * s) + ' ' + (ny - 3) + ' ' + (CX - 2.3 * s) + ' ' + (ny - 1) +
      'Q' + (CX - 2.4 * s) + ' ' + (ny + 1.4 * s) + ' ' + (CX + 0.9) + ' ' + (ny + 1 * s) +
      '" fill="none" stroke="' + sk.ln + '" stroke-width="1.05" stroke-linecap="round" opacity="0.55"/>' +
      '<ellipse cx="' + (CX + 2.6 * s) + '" cy="' + (ny + 0.7) + '" rx="0.85" ry="0.6" fill="' + sk.sh + '" opacity="0.55"/>' +
      '<ellipse cx="' + (CX - 3 * s) + '" cy="' + (ny + 0.6) + '" rx="0.8" ry="0.55" fill="' + sk.sh + '" opacity="0.4"/>';
  }

  function mouthSVG(cfg, gg) {
    var sk = cfg.sk, my = gg.mouthY, out = '';
    var lip = cfg.lipstick || sk.lip;
    if (cfg.mouth === 'grin') {
      var w = cfg.child ? 5.4 : 5.2;
      out += '<path d="M' + (CX - w) + ' ' + my + 'Q' + CX + ' ' + (my + 1.4) + ' ' + (CX + w) + ' ' + my +
        'Q' + (CX + w - 1.2) + ' ' + (my + 4.6) + ' ' + CX + ' ' + (my + 5) +
        'Q' + (CX - w + 1.2) + ' ' + (my + 4.6) + ' ' + (CX - w) + ' ' + my + 'Z" fill="#8c4a44"/>';
      out += '<path d="M' + (CX - w + 1.3) + ' ' + (my + 0.8) + 'Q' + CX + ' ' + (my + 2) + ' ' + (CX + w - 1.3) + ' ' + (my + 0.8) +
        'L' + (CX + w - 1.8) + ' ' + (my + 2.6) + 'Q' + CX + ' ' + (my + 3.6) + ' ' + (CX - w + 1.8) + ' ' + (my + 2.6) + 'Z" fill="#fdfcf9"/>';
      out += '<path d="M' + (CX - w) + ' ' + my + 'Q' + CX + ' ' + (my + 1.6) + ' ' + (CX + w) + ' ' + my + '" fill="none" stroke="' + shade(lip, 0.72) + '" stroke-width="1" opacity="0.8"/>';
      out += '<path d="M' + (CX - w + 0.6) + ' ' + (my + 4.8) + 'Q' + CX + ' ' + (my + 6.6) + ' ' + (CX + w - 0.6) + ' ' + (my + 4.8) + '" fill="none" stroke="' + lip + '" stroke-width="1.6" opacity="0.85" stroke-linecap="round"/>';
    } else if (cfg.mouth === 'tense') { /* pained — corners pulled down, lips pressed */
      out += '<path d="M' + (CX - 4.4) + ' ' + (my + 0.9) + 'Q' + CX + ' ' + (my - 1.1) + ' ' + (CX + 4.4) + ' ' + (my + 0.9) + '" fill="none" stroke="' + shade(lip, 0.78) + '" stroke-width="1.5" stroke-linecap="round"/>' +
        '<path d="M' + (CX - 2.8) + ' ' + (my + 2.7) + 'Q' + CX + ' ' + (my + 1.5) + ' ' + (CX + 2.8) + ' ' + (my + 2.7) + '" fill="none" stroke="' + lip + '" stroke-width="1.4" opacity="0.55" stroke-linecap="round"/>';
    } else if (cfg.mouth === 'soft') { /* small, calm — closed, barely a smile */
      out += '<path d="M' + (CX - 4.2) + ' ' + my + 'Q' + CX + ' ' + (my + 1.5) + ' ' + (CX + 4.2) + ' ' + (my + 0.1) + '" fill="none" stroke="' + shade(lip, 0.8) + '" stroke-width="1.4" stroke-linecap="round"/>' +
        '<path d="M' + (CX - 3) + ' ' + (my + 2) + 'Q' + CX + ' ' + (my + 3.4) + ' ' + (CX + 3) + ' ' + (my + 2.1) + '" fill="none" stroke="' + lip + '" stroke-width="1.7" opacity="0.6" stroke-linecap="round"/>';
    } else { /* closed smile with lips */
      out += '<path d="M' + (CX - 5.2) + ' ' + (my - 0.2) + 'Q' + CX + ' ' + (my + 1.8) + ' ' + (CX + 5.2) + ' ' + (my - 0.2) +
        'Q' + CX + ' ' + (my + 4.4) + ' ' + (CX - 5.2) + ' ' + (my - 0.2) + 'Z" fill="' + lip + '" opacity="0.92"/>';
      out += '<path d="M' + (CX - 5.2) + ' ' + (my - 0.2) + 'Q' + CX + ' ' + (my + 1.8) + ' ' + (CX + 5.2) + ' ' + (my - 0.2) + '" fill="none" stroke="' + shade(lip, 0.68) + '" stroke-width="1.05"/>';
      out += '<path d="M' + (CX - 2.4) + ' ' + (my + 2.5) + 'Q' + CX + ' ' + (my + 3.2) + ' ' + (CX + 2.4) + ' ' + (my + 2.5) + '" fill="none" stroke="#fff" stroke-width="0.8" opacity="0.35"/>';
    }
    return out;
  }

  function ageSVG(cfg, gg) {
    var sk = cfg.sk, out = '', my = gg.mouthY, ny = gg.noseY;
    if (cfg.age === 'mid' || cfg.age === 'older') {
      var o = cfg.age === 'older' ? 0.5 : 0.32;
      out += '<path d="M' + (CX - 3.6) + ' ' + (ny + 1.4) + 'Q' + (CX - 6.4) + ' ' + (my - 1.6) + ' ' + (CX - 6.6) + ' ' + (my + 1) + '" fill="none" stroke="' + sk.sh + '" stroke-width="0.9" opacity="' + o + '"/>';
      out += '<path d="M' + (CX + 3.6) + ' ' + (ny + 1.4) + 'Q' + (CX + 6.4) + ' ' + (my - 1.6) + ' ' + (CX + 6.6) + ' ' + (my + 1) + '" fill="none" stroke="' + sk.sh + '" stroke-width="0.9" opacity="' + o + '"/>';
    }
    if (cfg.age === 'older' || cfg.foreheadLines) {
      out += '<path d="M' + (CX - 7) + ' ' + (gg.browY - 5.5) + 'Q' + CX + ' ' + (gg.browY - 7.2) + ' ' + (CX + 7) + ' ' + (gg.browY - 5.5) + '" fill="none" stroke="' + sk.sh + '" stroke-width="0.8" opacity="0.4"/>';
      if (cfg.age === 'older') {
        out += '<path d="M' + (CX - 5.5) + ' ' + (gg.browY - 8.6) + 'Q' + CX + ' ' + (gg.browY - 10) + ' ' + (CX + 5.5) + ' ' + (gg.browY - 8.6) + '" fill="none" stroke="' + sk.sh + '" stroke-width="0.8" opacity="0.32"/>';
      }
    }
    return out;
  }

  function frecklesSVG(cfg, gg) {
    var pts = [[-10, 5.6], [-8, 7], [-6.2, 5.4], [6.2, 5.4], [8, 7], [10, 5.6]];
    var out = '<g fill="' + cfg.sk.ln + '" opacity="0.3">', i;
    for (i = 0; i < pts.length; i++) {
      out += '<circle cx="' + (CX + pts[i][0]) + '" cy="' + (gg.eye + pts[i][1]) + '" r="0.45"/>';
    }
    return out + '</g>';
  }

  function glassesSVG(cfg, gg) {
    var y = gg.eye - 0.4, dx = gg.edx, col = cfg.glassesC || '#5b5147';
    var out = '<g fill="rgba(255,255,255,0.14)" stroke="' + col + '" stroke-width="1.4">';
    if (cfg.glasses === 'round') {
      out += '<circle cx="' + (CX - dx) + '" cy="' + y + '" r="5"/><circle cx="' + (CX + dx) + '" cy="' + y + '" r="5"/>';
      out += '<path d="M' + (CX - dx + 5) + ' ' + (y - 0.6) + 'Q' + CX + ' ' + (y - 2.6) + ' ' + (CX + dx - 5) + ' ' + (y - 0.6) + '" fill="none"/>';
      out += '<path d="M' + (CX - dx - 5) + ' ' + (y - 0.8) + 'L' + (CX - gg.w - 0.5) + ' ' + (y - 1.6) + '" fill="none"/>';
      out += '<path d="M' + (CX + dx + 5) + ' ' + (y - 0.8) + 'L' + (CX + gg.w + 0.5) + ' ' + (y - 1.6) + '" fill="none"/>';
    } else {
      out += '<rect x="' + (CX - dx - 4.9) + '" y="' + (y - 3.8) + '" width="9.8" height="7.8" rx="2.6"/>';
      out += '<rect x="' + (CX + dx - 4.9) + '" y="' + (y - 3.8) + '" width="9.8" height="7.8" rx="2.6"/>';
      out += '<path d="M' + (CX - dx + 4.9) + ' ' + (y - 1) + 'Q' + CX + ' ' + (y - 2.8) + ' ' + (CX + dx - 4.9) + ' ' + (y - 1) + '" fill="none"/>';
      out += '<path d="M' + (CX - dx - 4.9) + ' ' + (y - 1.2) + 'L' + (CX - gg.w - 0.5) + ' ' + (y - 2) + '" fill="none"/>';
      out += '<path d="M' + (CX + dx + 4.9) + ' ' + (y - 1.2) + 'L' + (CX + gg.w + 0.5) + ' ' + (y - 2) + '" fill="none"/>';
    }
    return out + '</g>';
  }

  function facialHairSVG(cfg, gg) {
    var out = '', my = gg.mouthY, ny = gg.noseY, w = gg.w, c = cfg.beardC || cfg.hairC;
    if (cfg.facial === 'mustache' || cfg.facial === 'beard') {
      if (cfg.mustBushy) {
        out += '<path d="M' + (CX - 7) + ' ' + (ny + 4.6) +
          'C' + (CX - 3.2) + ' ' + (ny + 0.9) + ' ' + (CX + 3.2) + ' ' + (ny + 0.9) + ' ' + (CX + 7) + ' ' + (ny + 4.6) +
          'C' + (CX + 4.6) + ' ' + (ny + 6.8) + ' ' + (CX + 1.5) + ' ' + (ny + 4.8) + ' ' + CX + ' ' + (ny + 4.5) +
          'C' + (CX - 1.5) + ' ' + (ny + 4.8) + ' ' + (CX - 4.6) + ' ' + (ny + 6.8) + ' ' + (CX - 7) + ' ' + (ny + 4.6) + 'Z" fill="' + c + '"/>' +
          '<path d="M' + (CX - 4.5) + ' ' + (ny + 2.6) + 'Q' + CX + ' ' + (ny + 1.6) + ' ' + (CX + 4.5) + ' ' + (ny + 2.6) + '" fill="none" stroke="' + shade(c, 0.8) + '" stroke-width="0.8" opacity="0.7"/>';
      } else {
        out += '<path d="M' + (CX - 5.2) + ' ' + (ny + 3.4) +
          'C' + (CX - 2.4) + ' ' + (ny + 1) + ' ' + (CX + 2.4) + ' ' + (ny + 1) + ' ' + (CX + 5.2) + ' ' + (ny + 3.4) +
          'C' + (CX + 3.4) + ' ' + (ny + 5.6) + ' ' + (CX + 1) + ' ' + (ny + 3.6) + ' ' + CX + ' ' + (ny + 3.4) +
          'C' + (CX - 1) + ' ' + (ny + 3.6) + ' ' + (CX - 3.4) + ' ' + (ny + 5.6) + ' ' + (CX - 5.2) + ' ' + (ny + 3.4) + 'Z" fill="' + c + '"/>';
      }
    }
    if (cfg.facial === 'beard' || cfg.facial === 'stubble') {
      var op = cfg.facial === 'stubble' ? 0.22 : 0.9;
      out += '<path d="M' + (CX - w) + ' ' + (gg.eye + 10) +
        'Q' + (CX - w * 0.85) + ' ' + (my - 1) + ' ' + (CX - 6) + ' ' + (my - 3.4) +
        'L' + (CX + 6) + ' ' + (my - 3.4) +
        'Q' + (CX + w * 0.85) + ' ' + (my - 1) + ' ' + (CX + w) + ' ' + (gg.eye + 10) +
        'L' + (CX + w) + ' ' + (gg.chin + 2) + 'L' + (CX - w) + ' ' + (gg.chin + 2) + 'Z" fill="' + c + '" opacity="' + op + '" clip-path="url(#paFC{U})"/>';
    }
    return out;
  }

  /* ---------------- hair styles ---------------- */
  /* Each returns { back:'', front:'' } using adult coords unless noted. */
  var HAIR = {
    none: function () { return { back: '', front: '' }; },

    crop: function (c, o) {
      o = o || {};
      var d = shade(c, 0.78), out;
      out = '<path d="M41.5 50C40.5 34 47 25.8 60 25.8C73 25.8 79.5 34 78.5 50L76.5 50C77.2 43.5 76.2 40.8 72.5 39.6C67 37.9 63 37.3 60 37.3C57 37.3 53 37.9 47.5 39.6C43.8 40.8 42.8 43.5 43.5 50Z" fill="' + c + '"/>';
      if (o.sideburns !== false) {
        out += '<path d="M42.9 49L45.7 49L45.3 55.5L43.4 54Z" fill="' + c + '"/><path d="M77.1 49L74.3 49L74.7 55.5L76.6 54Z" fill="' + c + '"/>';
      }
      out += '<path d="M49 31.5Q54 28.6 60 28.4" fill="none" stroke="' + d + '" stroke-width="1.1" opacity="0.55" stroke-linecap="round"/>' +
        '<path d="M64 28.8Q70 29.6 73.6 33" fill="none" stroke="' + d + '" stroke-width="1.1" opacity="0.45" stroke-linecap="round"/>';
      if (o.grayTemples) {
        out += '<g stroke="#a9adb3" stroke-width="0.9" opacity="0.75" stroke-linecap="round">' +
          '<path d="M43.7 50l0.8 3"/><path d="M44.9 49.6l0.5 2.2"/>' +
          '<path d="M76.3 50l-0.8 3"/><path d="M75.1 49.6l-0.5 2.2"/></g>';
      }
      if (o.flick) { /* soft side-swept fringe for a friendlier crop */
        out += '<path d="M47.5 39.6C52 37.4 58 36.9 63.5 37.8C61.5 40.2 57 41.8 52 41.9C49.6 41.9 48 41.2 47.5 39.6Z" fill="' + c + '"/>' +
          '<path d="M50 41.2Q55.5 40.6 60.5 38.6" fill="none" stroke="' + d + '" stroke-width="0.8" opacity="0.45" stroke-linecap="round"/>';
      }
      return { back: '', front: out };
    },

    fade: function (c) {
      var d = shade(c, 1.5);
      var out = '<path d="M42.8 50C42 33.4 48.5 26.6 60 26.6C71.5 26.6 78 33.4 77.2 50L75.6 50C76 42.5 75.4 40.6 71.5 39.4C66.5 37.9 63 37.4 60 37.4C57 37.4 53.5 37.9 48.5 39.4C44.6 40.6 44 42.5 44.4 50Z" fill="' + c + '"/>' +
        '<path d="M43.3 46.5Q43 48.4 43.3 50L44.4 50Q44.1 48 44.3 46.2Z" fill="' + d + '" opacity="0.5"/>' +
        '<path d="M76.7 46.5Q77 48.4 76.7 50L75.6 50Q75.9 48 75.7 46.2Z" fill="' + d + '" opacity="0.5"/>' +
        '<path d="M50 30.4Q55 28.5 60 28.5Q65 28.5 70 30.4" fill="none" stroke="' + d + '" stroke-width="0.9" opacity="0.5"/>';
      return { back: '', front: out };
    },

    curlcap: function (c) {
      var d = shade(c, 0.82), i, out = '';
      var dots = [[46, 34.5, 5.6], [53, 29.8, 5.8], [60, 28.2, 6], [67, 29.8, 5.8], [74, 34.5, 5.6], [78, 42, 5], [42, 42, 5], [77.5, 49, 4.4], [42.5, 49, 4.4]];
      for (i = 0; i < dots.length; i++) out += '<circle cx="' + dots[i][0] + '" cy="' + dots[i][1] + '" r="' + dots[i][2] + '" fill="' + c + '"/>';
      out += '<path d="M42 52C41 35 47.5 27.2 60 27.2C72.5 27.2 79 35 78 52L76.2 52C76.8 44 75.4 41.2 71.6 40C66.8 38.6 63 38.1 60 38.1C57 38.1 53.2 38.6 48.4 40C44.6 41.2 43.2 44 43.8 52Z" fill="' + c + '"/>';
      out += '<path d="M50.5 32.5a2.5 2.5 0 1 0 3.4-1.4" fill="none" stroke="' + d + '" stroke-width="1" opacity="0.6"/>' +
        '<path d="M63.5 30.6a2.5 2.5 0 1 0 3.4 1.2" fill="none" stroke="' + d + '" stroke-width="1" opacity="0.6"/>' +
        '<path d="M73 38a2.3 2.3 0 1 0 2.6 1.6" fill="none" stroke="' + d + '" stroke-width="1" opacity="0.55"/>';
      return { back: '', front: out };
    },

    coils: function (c) { /* fuller natural curls */
      var d = shade(c, 1.7), i, out = '', back = '';
      var dots = [[44, 36, 7], [51, 29, 7], [60, 26.5, 7.2], [69, 29, 7], [76, 36, 7], [80, 45, 6.4], [40, 45, 6.4], [79.5, 53, 5.6], [40.5, 53, 5.6]];
      back += '<path d="M37.5 56C35.5 32 45 22.5 60 22.5C75 22.5 84.5 32 82.5 56C82.5 60 80 62 77 61L43 61C40 62 37.5 60 37.5 56Z" fill="' + c + '"/>';
      for (i = 0; i < dots.length; i++) back += '<circle cx="' + dots[i][0] + '" cy="' + dots[i][1] + '" r="' + dots[i][2] + '" fill="' + c + '"/>';
      out += '<path d="M41.5 56C40.5 36 47 28.5 60 28.5C73 28.5 79.5 36 78.5 56L76.4 56C76.8 47 75.6 42.4 71.6 41C66.8 39.4 63 38.9 60 38.9C57 38.9 53.2 39.4 48.4 41C44.4 42.4 43.2 47 43.6 56Z" fill="' + c + '"/>';
      out += '<path d="M49 31a2.6 2.6 0 1 0 3.6-1.2" fill="none" stroke="' + d + '" stroke-width="1" opacity="0.32"/>' +
        '<path d="M62.5 28.6a2.6 2.6 0 1 0 3.4 1.4" fill="none" stroke="' + d + '" stroke-width="1" opacity="0.32"/>' +
        '<path d="M74 36.4a2.4 2.4 0 1 0 2.8 1.6" fill="none" stroke="' + d + '" stroke-width="1" opacity="0.3"/>' +
        '<path d="M42.5 44a2.4 2.4 0 1 0 3-1" fill="none" stroke="' + d + '" stroke-width="1" opacity="0.3"/>';
      return { back: back, front: out };
    },

    long: function (c, o) {
      o = o || {};
      var d = shade(c, o.dark === false ? 0.8 : 1.55), hu = ++uid;
      var back = '<path d="M40 93C37.5 85 38.6 76 39.5 66C38.5 38 46 26.5 60 26.5C74 26.5 81.5 38 80.5 66C81.4 76 82.5 85 80 93Q75 96.5 70 92.5Q65 96 60 92.5Q55 96 50 92.5Q45 96.5 40 93Z" fill="' + c + '"/>';
      var fp = 'M41 62C39.6 46 43 27.8 60 27.8C77 27.8 80.4 46 79 62L76 62C77 51 75.6 42.8 68.5 39.8C64.5 38.2 60.5 38.1 57.5 38.9C51 40.6 47 45 45.4 50.5C44.7 54.3 44.3 58 44.4 62Z';
      /* detail strokes clipped to the hair fill so they never touch skin */
      var front = '<path d="' + fp + '" fill="' + c + '"/>' +
        '<clipPath id="paHL' + hu + '"><path d="' + fp + '"/></clipPath>' +
        '<g clip-path="url(#paHL' + hu + ')">' +
        '<path d="M46.2 44Q48.8 39.6 53.4 38" fill="none" stroke="' + d + '" stroke-width="1.2" opacity="0.55" stroke-linecap="round"/>' +
        '<path d="M70.6 39Q74.8 41.6 76.3 46.6" fill="none" stroke="' + d + '" stroke-width="1.2" opacity="0.5" stroke-linecap="round"/>' +
        '</g>';
      return { back: back, front: front };
    },

    bob: function (c, o) {
      o = o || {};
      var d = shade(c, 1.5), hu = ++uid;
      var back = '<path d="M41 81C38 71 39 61 39.8 52C39 33 47 26 60 26C73 26 81 33 80.2 52C81 61 82 71 79 81Q74 84.6 69 80.8Q64.5 84 60 80.8Q55.5 84 51 80.8Q46 84.6 41 81Z" fill="' + c + '"/>';
      var fp = 'M41.6 56C39.8 42 44 27.6 60 27.6C76 27.6 80.2 42 78.4 56L76.2 56C77 47 75 40.8 68 38.2C63.5 36.8 59 36.9 55.6 37.8C50 39.4 46.6 43.6 45.4 49C44.9 51.5 44.6 53.8 44.6 56Z';
      /* detail strokes clipped to the hair fill so they never touch skin */
      var det = '<path d="M46.6 44.4Q49.2 40 54 38.4" fill="none" stroke="' + d + '" stroke-width="1.2" opacity="0.5" stroke-linecap="round"/>';
      if (o.gray) {
        det += '<path d="M69.8 38.2Q74.4 40.6 76.1 45.8" fill="none" stroke="#b5aca0" stroke-width="1.7" opacity="0.7" stroke-linecap="round"/>' +
          '<path d="M49.6 39Q46.4 41.4 45.3 45.2" fill="none" stroke="#b5aca0" stroke-width="1.4" opacity="0.6" stroke-linecap="round"/>' +
          '<path d="M55.5 31.8Q49.8 33.4 46 37.4" fill="none" stroke="#b5aca0" stroke-width="1.3" opacity="0.5" stroke-linecap="round"/>';
      }
      var front = '<path d="' + fp + '" fill="' + c + '"/>' +
        '<clipPath id="paHB' + hu + '"><path d="' + fp + '"/></clipPath>' +
        '<g clip-path="url(#paHB' + hu + ')">' + det + '</g>';
      return { back: back, front: front };
    },

    pony: function (c) {
      var d = shade(c, 0.78);
      var back = '<circle cx="76.5" cy="27" r="6" fill="' + c + '"/>' +
        '<path d="M75 21.6a5.4 5.4 0 0 1 6.4 6.6" fill="none" stroke="' + d + '" stroke-width="1.1" opacity="0.7"/>' +
        '<path d="M79 32.6Q82 38 80.5 44" fill="none" stroke="' + c + '" stroke-width="3.4" stroke-linecap="round"/>';
      var front = '<path d="M42 50C41 33.5 47.5 26.4 60 26.4C72.5 26.4 79 33.5 78 50L76.2 50C76.8 43 75.6 40.4 71.8 39.3C66.8 37.8 63 37.3 60 37.3C56 37.3 51.8 38 47.9 39.6C44.3 41 43.2 43.6 43.8 50Z" fill="' + c + '"/>' +
        '<path d="M50 38.6Q60 33 72 31" fill="none" stroke="' + d + '" stroke-width="1" opacity="0.6" stroke-linecap="round"/>' +
        '<path d="M46 41.4Q56 34.6 69 31.6" fill="none" stroke="' + d + '" stroke-width="1" opacity="0.45" stroke-linecap="round"/>';
      return { back: back, front: front };
    },

    recede: function (c) {
      var d = shade(c, 0.8);
      var front = '<path d="M41.8 52C41 42 42.3 36.2 46.2 33.4C48 36.4 47.2 44 47 52Z" fill="' + c + '"/>' +
        '<path d="M78.2 52C79 42 77.7 36.2 73.8 33.4C72 36.4 72.8 44 73 52Z" fill="' + c + '"/>' +
        '<path d="M46.4 33.2C50 30 55 28.4 60 28.4C65 28.4 70 30 73.6 33.2" fill="none" stroke="' + c + '" stroke-width="1.6" opacity="0.6" stroke-linecap="round"/>' +
        '<path d="M48.6 34.6C52.5 31.8 56 30.8 59.5 30.8" fill="none" stroke="' + d + '" stroke-width="0.9" opacity="0.4" stroke-linecap="round"/>';
      return { back: '', front: front };
    },

    pig: function (c, o) { /* child bangs + pigtails; child geometry */
      o = o || {};
      var tie = o.tie || '#e8766a', d = shade(c, 0.78);
      var back = '<circle cx="38.5" cy="45" r="7" fill="' + c + '"/><circle cx="81.5" cy="45" r="7" fill="' + c + '"/>' +
        '<path d="M36.5 50.5Q35.2 55.5 37.4 59.5" fill="none" stroke="' + c + '" stroke-width="4" stroke-linecap="round"/>' +
        '<path d="M83.5 50.5Q84.8 55.5 82.6 59.5" fill="none" stroke="' + c + '" stroke-width="4" stroke-linecap="round"/>' +
        '<path d="M35.6 42a4.6 4.6 0 0 1 5.4-1.8" fill="none" stroke="' + d + '" stroke-width="1" opacity="0.6"/>' +
        '<path d="M79 40.2a4.6 4.6 0 0 1 5.4 1.8" fill="none" stroke="' + d + '" stroke-width="1" opacity="0.6"/>' +
        '<rect x="42.6" y="40.6" width="3.2" height="7" rx="1.5" fill="' + tie + '" transform="rotate(20 44.2 44.1)"/>' +
        '<rect x="74.2" y="40.6" width="3.2" height="7" rx="1.5" fill="' + tie + '" transform="rotate(-20 75.8 44.1)"/>';
      var front = '<path d="M42.2 50C41 37.5 47 30.2 60 30.2C73 30.2 79 37.5 77.8 50L76 46C74.5 47.4 72 47.8 70 47C66.9 48.4 63.4 48.6 60 48.2C56.6 48.6 53.1 48.4 50 47C48 47.8 45.5 47.4 44 46L42.2 50Z" fill="' + c + '"/>' +
        '<path d="M49 34.4Q54.5 31.8 60 31.8" fill="none" stroke="' + d + '" stroke-width="1" opacity="0.55" stroke-linecap="round"/>' +
        '<path d="M54 47.4L53.4 44.6M60.5 48L60.5 45M66.6 47.2L67.2 44.4" stroke="' + d + '" stroke-width="0.7" opacity="0.4" stroke-linecap="round"/>';
      return { back: back, front: front };
    }
  };

  /* ---------------- clothing ---------------- */
  function clothingSVG(cfg, gg, u) {
    var t = cfg.cloth, col = cfg.clothC, sk = cfg.sk;
    var y = gg.shY, out = '';
    var grad = 'url(#paCL' + u + ')';
    out += '<path d="' + shouldersPath(gg) + '" fill="' + grad + '"/>';
    var dk = shade(col, 0.72), lt = shade(col, 1.25);

    if (t === 'scrubs' || t === 'coat') {
      if (t === 'coat') {
        /* inner scrub V under a white coat */
        out += '<path d="M' + (CX - 11.5) + ' ' + (y - 1) + 'L' + CX + ' ' + (y + 15) + 'L' + (CX + 11.5) + ' ' + (y - 1) + 'Z" fill="' + (cfg.innerC || '#1f4e5f') + '"/>';
        out += '<path d="M' + (CX - 5.5) + ' ' + (y - 1.5) + 'L' + CX + ' ' + (y + 5) + 'L' + (CX + 5.5) + ' ' + (y - 1.5) + 'Z" fill="' + sk.sh + '"/>';
        /* lapels — two clean white bands meeting at the sternum */
        out += '<path d="M' + (CX - 12.5) + ' ' + (y - 1) + 'L' + (CX - 2) + ' ' + (y + 13.5) + 'L' + (CX - 2) + ' 122" fill="none" stroke="#fbfdfe" stroke-width="5" stroke-linejoin="round"/>';
        out += '<path d="M' + (CX + 12.5) + ' ' + (y - 1) + 'L' + (CX + 2) + ' ' + (y + 13.5) + 'L' + (CX + 2) + ' 122" fill="none" stroke="#fbfdfe" stroke-width="5" stroke-linejoin="round"/>';
        out += '<path d="M' + (CX - 13.5) + ' ' + (y - 1.6) + 'L' + (CX - 4.2) + ' ' + (y + 11.5) + 'L' + (CX - 4.2) + ' 122" fill="none" stroke="#c9d4dc" stroke-width="1.1"/>';
        out += '<path d="M' + (CX + 13.5) + ' ' + (y - 1.6) + 'L' + (CX + 4.2) + ' ' + (y + 11.5) + 'L' + (CX + 4.2) + ' 122" fill="none" stroke="#c9d4dc" stroke-width="1.1"/>';
      } else {
        /* scrub v-neck */
        out += '<path d="M' + (CX - 6.5) + ' ' + (y - 1.8) + 'L' + CX + ' ' + (y + 6.5) + 'L' + (CX + 6.5) + ' ' + (y - 1.8) + 'Z" fill="' + sk.sh + '"/>';
        out += '<path d="M' + (CX - 7.5) + ' ' + (y - 2.2) + 'L' + CX + ' ' + (y + 7.5) + 'L' + (CX + 7.5) + ' ' + (y - 2.2) + '" fill="none" stroke="' + dk + '" stroke-width="2.2" stroke-linejoin="round"/>';
        out += '<path d="M' + (CX - 16) + ' ' + (y + 2.5) + 'Q' + (CX - 11) + ' ' + (y + 5) + ' ' + (CX - 8.5) + ' ' + (y + 10) + '" fill="none" stroke="' + dk + '" stroke-width="0.9" opacity="0.55"/>';
        out += '<path d="M' + (CX + 16) + ' ' + (y + 2.5) + 'Q' + (CX + 11) + ' ' + (y + 5) + ' ' + (CX + 8.5) + ' ' + (y + 10) + '" fill="none" stroke="' + dk + '" stroke-width="0.9" opacity="0.55"/>';
      }
    } else if (t === 'collar' || t === 'polo') {
      out += '<path d="M' + (CX - 8.8) + ' ' + (y - 2) + 'L' + (CX - 1) + ' ' + (y + 7.5) + 'L' + (CX - 11.5) + ' ' + (y + 6) + 'Z" fill="' + lt + '" stroke="' + dk + '" stroke-width="0.9"/>';
      out += '<path d="M' + (CX + 8.8) + ' ' + (y - 2) + 'L' + (CX + 1) + ' ' + (y + 7.5) + 'L' + (CX + 11.5) + ' ' + (y + 6) + 'Z" fill="' + lt + '" stroke="' + dk + '" stroke-width="0.9"/>';
      out += '<path d="M' + CX + ' ' + (y + 8) + 'L' + CX + ' 120" stroke="' + dk + '" stroke-width="1" opacity="0.6"/>';
      out += '<circle cx="' + CX + '" cy="' + (y + 12) + '" r="0.9" fill="' + dk + '"/><circle cx="' + CX + '" cy="' + (y + 18) + '" r="0.9" fill="' + dk + '"/>';
    } else if (t === 'cardigan') {
      var inner = cfg.innerC || '#e9e2d4';
      out += '<path d="M' + (CX - 9) + ' ' + (y - 1.5) + 'L' + (CX - 6) + ' 120L' + (CX + 6) + ' 120L' + (CX + 9) + ' ' + (y - 1.5) + 'Q' + CX + ' ' + (y + 2) + ' ' + (CX - 9) + ' ' + (y - 1.5) + 'Z" fill="' + inner + '"/>';
      out += '<path d="M' + (CX - 9.5) + ' ' + (y - 1.5) + 'L' + (CX - 6.5) + ' 120" fill="none" stroke="' + dk + '" stroke-width="2" opacity="0.9"/>';
      out += '<path d="M' + (CX + 9.5) + ' ' + (y - 1.5) + 'L' + (CX + 6.5) + ' 120" fill="none" stroke="' + dk + '" stroke-width="2" opacity="0.9"/>';
    } else if (t === 'jacket') {
      var jc = cfg.jacketC || shade(col, 0.55);
      out += '<path d="M' + (CX - 8) + ' ' + (y - 1) + 'Q' + CX + ' ' + (y + 4.5) + ' ' + (CX + 8) + ' ' + (y - 1) + '" fill="none" stroke="' + dk + '" stroke-width="2" opacity="0.85"/>';
      out += '<path d="M8 112C10 96 26 87 44 ' + (y + 0.6) + 'Q40 96 39 120L8 120Z" fill="' + jc + '"/>';
      out += '<path d="M112 112C110 96 94 87 76 ' + (y + 0.6) + 'Q80 96 81 120L112 120Z" fill="' + jc + '"/>';
      out += '<path d="M44 ' + (y + 0.8) + 'Q40.5 96 39.5 118" fill="none" stroke="' + shade(jc, 0.7) + '" stroke-width="1.1" opacity="0.8"/>';
      out += '<path d="M76 ' + (y + 0.8) + 'Q79.5 96 80.5 118" fill="none" stroke="' + shade(jc, 0.7) + '" stroke-width="1.1" opacity="0.8"/>';
    } else { /* tee / blouse */
      out += '<path d="M' + (CX - 8) + ' ' + (y - 1) + 'Q' + CX + ' ' + (y + 5) + ' ' + (CX + 8) + ' ' + (y - 1) + '" fill="none" stroke="' + dk + '" stroke-width="2.4" stroke-linecap="round"/>';
      if (cfg.stripes) {
        out += '<g stroke="' + (cfg.stripeC || '#fdf6ec') + '" stroke-width="4" opacity="0.9">' +
          '<path d="M14 100Q38 92 60 92Q82 92 106 100" fill="none"/>' +
          '<path d="M10 113Q36 104 60 104Q84 104 110 113" fill="none"/></g>';
      }
      if (cfg.scoop) {
        out += '<path d="M' + (CX - 9) + ' ' + (y - 1.5) + 'Q' + CX + ' ' + (y + 8) + ' ' + (CX + 9) + ' ' + (y - 1.5) + 'Q' + CX + ' ' + (y + 3) + ' ' + (CX - 9) + ' ' + (y - 1.5) + 'Z" fill="' + sk.sh + '" opacity="0.9"/>';
      }
    }
    if (cfg.necklace) {
      var i, out2 = '<g fill="' + (cfg.necklace === 'gold' ? '#d9a441' : '#f1ece1') +
        '" stroke="' + (cfg.necklace === 'gold' ? '#a97c2b' : '#b3a68c') + '" stroke-width="0.5">';
      for (i = -3; i <= 3; i++) {
        var nx = CX + i * 3.2, nyy = y + 4.2 + (3 - Math.abs(i)) * 1.05;
        out2 += '<circle cx="' + nx + '" cy="' + nyy + '" r="1.05"/>';
      }
      out += out2 + '</g>';
    }
    return out;
  }

  /* ---------------- accessories ---------------- */
  function accessoriesSVG(cfg, gg, u) {
    var out = '', a = cfg.acc || [], i, sk = cfg.sk, y = gg.shY;
    for (i = 0; i < a.length; i++) {
      if (a[i] === 'loupes') {
        /* flip-up loupe barrels resting on a slim band across the forehead */
        out += '<path d="M44.4 43.2Q60 38.4 75.6 43.2" fill="none" stroke="#54677d" stroke-width="2.2" stroke-linecap="round" opacity="0.95"/>' +
          '<g stroke="#2b3743" stroke-width="1"><circle cx="55" cy="41" r="2.7" fill="#46586c"/><circle cx="65" cy="41" r="2.7" fill="#46586c"/></g>' +
          '<circle cx="55" cy="41" r="1.55" fill="#8fd0c8" opacity="0.5"/><circle cx="65" cy="41" r="1.55" fill="#8fd0c8" opacity="0.5"/>' +
          '<circle cx="54.3" cy="40.2" r="0.55" fill="#d6e4f0" opacity="0.9"/><circle cx="64.3" cy="40.2" r="0.55" fill="#d6e4f0" opacity="0.9"/>';
      } else if (a[i] === 'maskChin') {
        out += '<path d="M' + (CX - 9.6) + ' ' + (gg.chin - 6) + 'C' + (CX - 9) + ' ' + (gg.chin + 6) + ' ' + (CX + 9) + ' ' + (gg.chin + 6) + ' ' + (CX + 9.6) + ' ' + (gg.chin - 6) +
          'C' + (CX + 6) + ' ' + (gg.chin - 2.5) + ' ' + (CX - 6) + ' ' + (gg.chin - 2.5) + ' ' + (CX - 9.6) + ' ' + (gg.chin - 6) + 'Z" fill="#cfe7ea" stroke="#9cc4ca" stroke-width="0.9"/>' +
          '<path d="M' + (CX - 8) + ' ' + (gg.chin - 1) + 'Q' + CX + ' ' + (gg.chin + 2.4) + ' ' + (CX + 8) + ' ' + (gg.chin - 1) + '" fill="none" stroke="#9cc4ca" stroke-width="0.8" opacity="0.8"/>' +
          '<path d="M' + (CX - 9.4) + ' ' + (gg.chin - 5.4) + 'Q' + (CX - gg.w - 1) + ' ' + (gg.eye + 8) + ' ' + (CX - gg.w - 0.5) + ' ' + (gg.eye + 4) + '" fill="none" stroke="#b7d6da" stroke-width="1.1"/>' +
          '<path d="M' + (CX + 9.4) + ' ' + (gg.chin - 5.4) + 'Q' + (CX + gg.w + 1) + ' ' + (gg.eye + 8) + ' ' + (CX + gg.w + 0.5) + ' ' + (gg.eye + 4) + '" fill="none" stroke="#b7d6da" stroke-width="1.1"/>';
      } else if (a[i] === 'lanyard') {
        out += '<path d="M' + (CX - 6.5) + ' ' + (y + 1) + 'L' + (CX - 3) + ' 106" fill="none" stroke="#0b5c55" stroke-width="2"/>' +
          '<path d="M' + (CX + 6.5) + ' ' + (y + 1) + 'L' + (CX + 3) + ' 106" fill="none" stroke="#0b5c55" stroke-width="2"/>' +
          '<rect x="' + (CX - 5.5) + '" y="105" width="11" height="13" rx="1.6" fill="#fbfdfd" stroke="#b8c6cc" stroke-width="0.8"/>' +
          '<rect x="' + (CX - 3.6) + '" y="107" width="4" height="4.6" rx="0.8" fill="' + sk.base + '"/>' +
          '<path d="M' + (CX + 1.4) + ' 108.4h2.4M' + (CX + 1.4) + ' 110.6h2.4" stroke="#9fb3ba" stroke-width="0.8"/>' +
          '<path d="M' + (CX - 3.4) + ' 114.4h6.8" stroke="#0d9488" stroke-width="1.4"/>';
      } else if (a[i] === 'headset') {
        out += '<path d="M40.5 46C40 31 48 25 60 25C72 25 80 31 79.5 46" fill="none" stroke="#31404f" stroke-width="2.6"/>' +
          '<ellipse cx="41.5" cy="52" rx="3" ry="4.2" fill="#31404f"/>' +
          '<path d="M42.5 56Q43.5 63.5 45.5 67" fill="none" stroke="#31404f" stroke-width="1.6"/>' +
          '<circle cx="46.6" cy="68.2" r="1.7" fill="#31404f"/><circle cx="46.1" cy="67.6" r="0.5" fill="#9db4c6"/>';
      } else if (a[i] === 'hoops') {
        out += '<circle cx="' + (CX - gg.w - 1.2) + '" cy="' + (gg.eye + 9.4) + '" r="2.1" fill="none" stroke="#d9a441" stroke-width="1.2"/>' +
          '<circle cx="' + (CX + gg.w + 1.2) + '" cy="' + (gg.eye + 9.4) + '" r="2.1" fill="none" stroke="#d9a441" stroke-width="1.2"/>';
      } else if (a[i] === 'studs') {
        out += '<circle cx="' + (CX - gg.w - 1) + '" cy="' + (gg.eye + 7.8) + '" r="1.15" fill="#d9a441"/>' +
          '<circle cx="' + (CX + gg.w + 1) + '" cy="' + (gg.eye + 7.8) + '" r="1.15" fill="#d9a441"/>';
      }
    }
    return out;
  }

  /* ---------------- the bust renderer ---------------- */
  function renderBust(cfg, opts) {
    opts = opts || {};
    var u = ++uid;
    var gg = geoFor(cfg);
    var sk = cfg.sk;
    var fp = facePath(gg);
    var hair = (HAIR[cfg.hair] || HAIR.none)(cfg.hairC || '#3a2a1c', cfg.hairOpts);
    var s = '';

    /* defs */
    s += '<defs>';
    s += '<radialGradient id="paBG' + u + '" cx="38%" cy="30%" r="85%">' +
      '<stop offset="0%" stop-color="' + shade(cfg.bg, 1.45) + '"/><stop offset="100%" stop-color="' + cfg.bg + '"/></radialGradient>';
    s += '<linearGradient id="paSK' + u + '" x1="0" y1="0" x2="0.65" y2="1">' +
      '<stop offset="0%" stop-color="' + sk.hi + '"/><stop offset="45%" stop-color="' + sk.base + '"/><stop offset="100%" stop-color="' + shade(sk.base, 0.9) + '"/></linearGradient>';
    var clTop = cfg.cloth === 'coat' ? shade(cfg.clothC, 1.08) : shade(cfg.clothC, 1.22);
    var clBot = cfg.cloth === 'coat' ? shade(cfg.clothC, 0.95) : shade(cfg.clothC, 0.86);
    s += '<linearGradient id="paCL' + u + '" x1="0" y1="0" x2="0.7" y2="1">' +
      '<stop offset="0%" stop-color="' + clTop + '"/><stop offset="100%" stop-color="' + clBot + '"/></linearGradient>';
    s += '<radialGradient id="paHI' + u + '"><stop offset="0%" stop-color="' + sk.hi + '" stop-opacity="0.7"/><stop offset="100%" stop-color="' + sk.hi + '" stop-opacity="0"/></radialGradient>';
    s += '<radialGradient id="paSH' + u + '"><stop offset="0%" stop-color="' + sk.sh + '" stop-opacity="0.32"/><stop offset="100%" stop-color="' + sk.sh + '" stop-opacity="0"/></radialGradient>';
    s += '<clipPath id="paCP' + u + '"><circle cx="60" cy="60" r="57"/></clipPath>';
    s += '<clipPath id="paFC' + u + '"><path d="' + fp + '"/></clipPath>';
    s += '</defs>';

    s += '<circle cx="60" cy="60" r="57" fill="url(#paBG' + u + ')"/>';
    s += '<g clip-path="url(#paCP' + u + ')">';

    /* back hair (behind neck + body) */
    s += hair.back;

    /* ears */
    s += '<ellipse cx="' + (CX - gg.w - 1) + '" cy="' + (gg.eye + 3) + '" rx="3" ry="4.6" fill="' + sk.base + '"/>' +
      '<ellipse cx="' + (CX + gg.w + 1) + '" cy="' + (gg.eye + 3) + '" rx="3" ry="4.6" fill="' + sk.base + '"/>' +
      '<path d="M' + (CX - gg.w - 1.8) + ' ' + (gg.eye + 1.5) + 'a2.2 2.6 0 0 1 1.6 3.4" fill="none" stroke="' + sk.sh + '" stroke-width="0.9" opacity="0.6"/>' +
      '<path d="M' + (CX + gg.w + 1.8) + ' ' + (gg.eye + 1.5) + 'a2.2 2.6 0 0 0 -1.6 3.4" fill="none" stroke="' + sk.sh + '" stroke-width="0.9" opacity="0.6"/>';

    /* neck + shadow cast by the chin */
    s += '<path d="' + neckPath(gg) + '" fill="url(#paSK' + u + ')"/>';
    s += '<clipPath id="paNK' + u + '"><path d="' + neckPath(gg) + '"/></clipPath>';
    s += '<rect x="' + (CX - gg.neckW - 8) + '" y="' + gg.neckTop + '" width="' + ((gg.neckW + 8) * 2) + '" height="7.5" fill="' + sk.sh + '" opacity="0.55" clip-path="url(#paNK' + u + ')"/>';

    /* clothing */
    s += clothingSVG(cfg, gg, u);

    /* head */
    s += '<path d="' + fp + '" fill="url(#paSK' + u + ')"/>';
    /* face shading — soft light from upper-left */
    s += '<g clip-path="url(#paFC' + u + ')">' +
      '<ellipse cx="' + (CX + gg.w * 0.86) + '" cy="' + (gg.eye + 7) + '" rx="10" ry="19" fill="url(#paSH' + u + ')"/>' +
      '<ellipse cx="' + (CX + gg.w * 0.55) + '" cy="' + (gg.top + 5) + '" rx="12" ry="10" fill="url(#paSH' + u + ')" opacity="0.6"/>' +
      '<ellipse cx="' + (CX - 8) + '" cy="' + (gg.eye - 10) + '" rx="11" ry="9.5" fill="url(#paHI' + u + ')"/>' +
      '<ellipse cx="' + (CX - 10) + '" cy="' + (gg.eye + 6) + '" rx="6.5" ry="5.5" fill="url(#paHI' + u + ')" opacity="0.6"/>' +
      '</g>';

    /* blush */
    if (cfg.blush) {
      s += '<ellipse cx="' + (CX - 10.5) + '" cy="' + (gg.eye + 7) + '" rx="3.6" ry="2.1" fill="#e06d5f" opacity="' + (0.14 * cfg.blush) + '"/>' +
        '<ellipse cx="' + (CX + 10.5) + '" cy="' + (gg.eye + 7) + '" rx="3.6" ry="2.1" fill="#e06d5f" opacity="' + (0.14 * cfg.blush) + '"/>';
    }
    if (cfg.freckles) s += frecklesSVG(cfg, gg);

    /* beard sits under the mouth */
    s += facialHairSVG(cfg, gg).replace(/\{U\}/g, String(u));

    /* features */
    s += ageSVG(cfg, gg);
    s += eyeSVG(CX - gg.edx, gg.eye, cfg, gg, u, 'l');
    s += eyeSVG(CX + gg.edx, gg.eye, cfg, gg, u, 'r');
    s += browSVG(CX - gg.edx, gg.browY, cfg, 'l');
    s += browSVG(CX + gg.edx, gg.browY, cfg, 'r');
    s += noseSVG(cfg, gg);
    s += mouthSVG(cfg, gg);

    /* front hair, glasses, accessories */
    s += hair.front;
    if (cfg.glasses) s += glassesSVG(cfg, gg);
    s += accessoriesSVG(cfg, gg, u);

    s += '</g>'; /* end circle clip */
    s += '<circle cx="60" cy="60" r="56.4" fill="none" stroke="rgba(15,118,110,0.14)" stroke-width="1.2"/>';

    return wrapSVG(s, opts, cfg.label);
  }

  function renderNarrator(opts) {
    var u = ++uid, s = '';
    s += '<defs><radialGradient id="paBG' + u + '" cx="38%" cy="30%" r="85%">' +
      '<stop offset="0%" stop-color="#14a89b"/><stop offset="100%" stop-color="#0c6b60"/></radialGradient></defs>';
    s += '<circle cx="60" cy="60" r="57" fill="url(#paBG' + u + ')"/>';
    s += '<path d="M43.5 46C43.5 33.5 53 29.5 60 34.5C67 29.5 76.5 33.5 76.5 46C76.5 55.5 72.6 58.5 71.6 68.5C71 74.6 67 76.6 65.4 70.4C64.3 65.6 63 62.5 60 62.5C57 62.5 55.7 65.6 54.6 70.4C53 76.6 49 74.6 48.4 68.5C47.4 58.5 43.5 55.5 43.5 46Z" fill="#fbfefd"/>';
    s += '<path d="M47 44.5C47 38 51 35.4 55 36.8" fill="none" stroke="#c4e8e2" stroke-width="2" stroke-linecap="round"/>';
    s += '<path d="M79 27l1.1 2.9 2.9 1.1-2.9 1.1-1.1 2.9-1.1-2.9-2.9-1.1 2.9-1.1z" fill="#a7e3da"/>';
    s += '<path d="M38 84h44" stroke="rgba(255,255,255,0.4)" stroke-width="1.4" stroke-linecap="round"/>';
    s += '<path d="M46 90h28" stroke="rgba(255,255,255,0.25)" stroke-width="1.4" stroke-linecap="round"/>';
    s += '<circle cx="60" cy="60" r="56.4" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="1.2"/>';
    return wrapSVG(s, opts, 'Premier Dental clinic');
  }

  function wrapSVG(inner, opts, label) {
    var size = opts && opts.size;
    var dim = size ? ' width="' + size + '" height="' + size + '"' : ' width="100%" height="100%"';
    var title = (opts && opts.title) || label || 'Portrait';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"' + dim +
      ' role="img" aria-label="' + String(title).replace(/"/g, '&quot;') + '" style="display:block">' + inner + '</svg>';
  }

  /* ---------------- the cast ---------------- */
  var CAST = {
    /* --- staff --- */
    dentist: {
      label: 'Dr. Williams, dentist', bg: BGS[1], sk: SKIN.deep,
      hair: 'crop', hairC: '#181310', hairOpts: { grayTemples: true },
      browC: '#181310', browW: 1.9, iris: '#3a2417',
      mouth: 'smile', age: 'mid', facial: 'stubble', beardC: '#181310',
      cloth: 'coat', clothC: '#f6f9fc', innerC: '#1e4e5f',
      acc: ['loupes']
    },
    assistant: {
      label: 'You, dental assistant', bg: BGS[0], sk: SKIN.olive,
      hair: 'crop', hairC: '#33241a', hairOpts: { flick: true, sideburns: false },
      browC: '#33241a', browW: 1.5, iris: '#5a3a22',
      mouth: 'grin', blush: 0.8,
      cloth: 'scrubs', clothC: '#0d9488',
      acc: ['lanyard']
    },
    hygienist: {
      label: 'Renee, hygienist', bg: BGS[4], sk: SKIN.fair,
      hair: 'pony', hairC: '#8a4b28',
      browC: '#71401f', browW: 1.3, browArch: true, iris: '#4f7a52', lashes: true,
      mouth: 'smile', blush: 1, freckles: false,
      cloth: 'scrubs', clothC: '#0e7490',
      acc: ['lanyard', 'studs']
    },
    frontdesk: {
      label: 'Carla, front desk', bg: BGS[3], sk: SKIN.tan,
      hair: 'bob', hairC: '#2c1d12',
      browC: '#2c1d12', browW: 1.4, browArch: true, iris: '#43290f', lashes: true,
      mouth: 'grin', blush: 0.7, lipstick: '#a4404a',
      cloth: 'tee', clothC: '#6d4a63', scoop: true,
      acc: ['headset']
    },

    /* --- patients --- */
    p_crown: { /* Maria Alvarez, 52 */
      label: 'Maria Alvarez', bg: BGS[2], sk: SKIN.tan,
      hair: 'bob', hairC: '#4a3629', hairOpts: { gray: true },
      browC: '#4a3629', browW: 1.4, browArch: true, iris: '#4a2c14', lashes: true,
      mouth: 'smile', age: 'mid', blush: 0.6, lipstick: '#a2544e',
      cloth: 'blouse', clothC: '#a8623e', scoop: true,
      acc: ['studs']
    },
    p_comp: { /* Darnell Carter, 34 */
      label: 'Darnell Carter', bg: BGS[0], sk: SKIN.brown,
      hair: 'fade', hairC: '#15100c',
      browC: '#15100c', browW: 1.9, iris: '#33200f',
      mouth: 'grin', facial: 'beard', beardC: '#15100c',
      cloth: 'jacket', clothC: '#8b9199', jacketC: '#4c5b45',
      face: { jaw: 0.86 }
    },
    p_ext: { /* Joyce Bennett, 67 */
      label: 'Joyce Bennett', bg: BGS[1], sk: SKIN.porcelain,
      hair: 'curlcap', hairC: '#d7d9dc',
      browC: '#9b9489', browW: 1.2, browArch: true, iris: '#5c7186',
      mouth: 'smile', age: 'older', blush: 0.5, glasses: 'round', glassesC: '#7a6a58',
      cloth: 'cardigan', clothC: '#7386a5', innerC: '#efe8db', necklace: 'pearl',
      face: { w: 16.5, jaw: 0.78 }
    },
    p_emerg: { /* Tyler Nguyen, 28 */
      label: 'Tyler Nguyen', bg: BGS[5], sk: SKIN.golden,
      hair: 'crop', hairC: '#131110', hairOpts: { flick: true },
      browC: '#131110', browW: 1.7, browRaise: 1.6, iris: '#2c1c10',
      mouth: 'tense',
      cloth: 'tee', clothC: '#41546e'
    },
    p_exam: { /* Priya Patel, 41 */
      label: 'Priya Patel', bg: BGS[4], sk: SKIN.tan,
      hair: 'long', hairC: '#1c1310',
      browC: '#1c1310', browW: 1.5, browArch: true, iris: '#31180a', lashes: true,
      mouth: 'smile', blush: 0.6, lipstick: '#9c4f46',
      cloth: 'blouse', clothC: '#b0813a', scoop: true,
      acc: ['studs']
    },
    p_hyg: { /* Frank Russo, 58 */
      label: 'Frank Russo', bg: BGS[2], sk: SKIN.fair,
      hair: 'recede', hairC: '#95897b',
      browC: '#6e6255', browW: 2.1, iris: '#4c3a26',
      mouth: 'smile', age: 'older', blush: 0.9, foreheadLines: true,
      facial: 'mustache', beardC: '#8b8072', mustBushy: true,
      cloth: 'polo', clothC: '#5e7261',
      face: { w: 18, jaw: 0.88, chinW: 8 }
    },
    p_pedo: { /* Emma Wright, 9 */
      label: 'Emma Wright', bg: BGS[5], sk: SKIN.porcelain, child: true,
      hair: 'pig', hairC: '#7a5330', hairOpts: { tie: '#e8766a' },
      browC: '#7a5330', browW: 1.15, iris: '#6b7c46', eyeScale: 1,
      mouth: 'grin', blush: 1, freckles: true,
      cloth: 'tee', clothC: '#e8766a', stripes: true
    },
    p_endo: { /* Gloria Sims, 47 */
      label: 'Gloria Sims', bg: BGS[3], sk: SKIN.brown,
      hair: 'coils', hairC: '#1d1510',
      browC: '#1d1510', browW: 1.5, browArch: true, iris: '#2f1c0d', lashes: true,
      mouth: 'grin', lipstick: '#8e3f44', age: 'mid',
      cloth: 'blouse', clothC: '#68498a', scoop: true,
      acc: ['hoops']
    },

    /* --- fallback --- */
    generic: {
      label: 'Visitor', bg: BGS[0], sk: SKIN.olive,
      hair: 'crop', hairC: '#3f2f21', hairOpts: { sideburns: false },
      browC: '#3f2f21', browW: 1.5, iris: '#4f3319',
      mouth: 'smile',
      cloth: 'tee', clothC: '#5b7570'
    }
  };

  /* name -> key aliases so callers can pass names too */
  var ALIAS = {};
  (function () {
    var names = {
      'dr. williams': 'dentist', 'you': 'assistant', 'renee': 'hygienist', 'carla': 'frontdesk',
      'maria alvarez': 'p_crown', 'darnell carter': 'p_comp', 'joyce bennett': 'p_ext',
      'tyler nguyen': 'p_emerg', 'priya patel': 'p_exam', 'frank russo': 'p_hyg',
      'emma wright': 'p_pedo', 'gloria sims': 'p_endo', 'your shift': 'narrator'
    };
    var k; for (k in names) ALIAS[k] = names[k];
  })();

  function resolveKey(pOrKey) {
    if (!pOrKey) return null;
    var id = null, name = null;
    if (typeof pOrKey === 'string') { id = pOrKey; name = pOrKey; }
    else { id = pOrKey.id; name = pOrKey.name; }
    if (id === 'narrator') return 'narrator';
    if (id && CAST[id]) return id;
    if (name && ALIAS[String(name).toLowerCase()]) return ALIAS[String(name).toLowerCase()];
    if (id && ALIAS[String(id).toLowerCase()]) return ALIAS[String(id).toLowerCase()];
    return null;
  }

  var SL_PEOPLE = {
    has: function (pOrKey) { return resolveKey(pOrKey) !== null; },
    bust: function (pOrKey, opts) {
      var key = resolveKey(pOrKey);
      if (key === 'narrator') return renderNarrator(opts || {});
      var cfg = CAST[key] || CAST.generic;
      if (!key && pOrKey && typeof pOrKey === 'object' && pOrKey.name) {
        /* unknown person: still give them a face, labelled with their name */
        opts = opts || {};
        if (!opts.title) opts = { size: opts.size, title: String(pOrKey.name) };
      }
      return renderBust(cfg, opts || {});
    },
    keys: function () {
      var out = [], k; for (k in CAST) { if (k !== 'generic') out.push(k); }
      out.push('narrator'); return out;
    }
  };

  g.SL_PEOPLE = SL_PEOPLE;
})(typeof window !== 'undefined' ? window : this);
