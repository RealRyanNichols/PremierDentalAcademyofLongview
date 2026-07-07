/* Realistic vector art for every Skills Lab instrument & material.
   Layered-gradient SVG renderings of each instrument id in
   SL_VO_DATA.INSTRUMENTS: full-length hand instruments (viewBox 0 0 64 260)
   and square material/disposable studies (viewBox 0 0 160 160), lit from the
   upper-left with a soft contact shadow so each piece sits on the tray.
   Exposes window.SL_ART = { has, svg, kindOf } and upgrades window.SL_ICON_FOR
   (this file loads AFTER instrument-icons.js; anything not covered here still
   falls back to the line icons, then the emoji glyph).
   Render priority everywhere stays: photo (instr-<id>.png) -> art -> emoji. */
(function (g) {
  'use strict';

  /* ---------- shared paints (same ids in every svg; duplicates are fine) ---------- */
  function lg(id, dir, stops) {
    var d = dir === 'v' ? 'x1="0" y1="0" x2="0" y2="1"' : 'x1="0" y1="0" x2="1" y2="0"';
    var s = '';
    for (var i = 0; i < stops.length; i++) s += '<stop offset="' + stops[i][0] + '" stop-color="' + stops[i][1] + '"/>';
    return '<linearGradient id="' + id + '" ' + d + '>' + s + '</linearGradient>';
  }
  var STEEL = [[0, '#475569'], ['.16', '#94a3b8'], ['.3', '#e2e8f0'], ['.46', '#cbd5e1'], ['.7', '#64748b'], [1, '#334155']];
  var DARKS = [[0, '#334155'], ['.25', '#64748b'], ['.45', '#94a3b8'], ['.7', '#475569'], [1, '#1e293b']];
  var DEFS = '<defs>'
    + lg('slgSt', 'h', STEEL) + lg('slgStV', 'v', STEEL)
    + lg('slgDk', 'h', DARKS) + lg('slgDkV', 'v', DARKS)
    + lg('slgWht', 'h', [[0, '#ffffff'], ['.45', '#f1f5f9'], ['.8', '#cbd5e1'], [1, '#94a3b8']])
    + lg('slgWhtV', 'v', [[0, '#ffffff'], ['.55', '#f1f5f9'], [1, '#cbd5e1']])
    + lg('slgBlu', 'h', [[0, '#bfdbfe'], ['.35', '#60a5fa'], ['.7', '#3b82f6'], [1, '#1d4ed8']])
    + lg('slgBluV', 'v', [[0, '#bfdbfe'], ['.4', '#60a5fa'], [1, '#2563eb']])
    + lg('slgTeal', 'v', [[0, '#99f6e4'], ['.45', '#2dd4bf'], [1, '#0f766e']])
    + lg('slgAmb', 'v', [[0, '#fbbf24'], ['.4', '#d97706'], [1, '#92400e']])
    + lg('slgIvo', 'v', [[0, '#fefce8'], ['.45', '#f3e6c0'], [1, '#d3bf94']])
    + lg('slgWood', 'v', [[0, '#eec085'], ['.5', '#d09353'], [1, '#a06a33']])
    + lg('slgGrn', 'v', [[0, '#a7f3d0'], ['.4', '#34d399'], [1, '#059669']])
    + lg('slgPur', 'v', [[0, '#ddd6fe'], ['.4', '#a78bfa'], [1, '#6d28d9']])
    + lg('slgOr', 'v', [[0, '#fed7aa'], ['.4', '#fb923c'], [1, '#c2410c']])
    + lg('slgRose', 'v', [[0, '#fecdd3'], ['.45', '#fda4af'], [1, '#e11d48']])
    + lg('slgGls', 'v', [[0, '#ffffff'], ['.5', '#e2e8f0'], [1, '#94a3b8']])
    + lg('slgNvy', 'v', [[0, '#475569'], ['.4', '#1e293b'], [1, '#0f172a']])
    + lg('slgPPt', 'v', [[0, '#fdfcf8'], ['.5', '#efe8d8'], [1, '#ddd2b8']])
    + lg('slgGP', 'v', [[0, '#fbc7bf'], ['.5', '#f8a29a'], [1, '#e8756b']])
    + '<radialGradient id="slgMir" cx=".38" cy=".32" r=".85"><stop offset="0" stop-color="#ffffff"/><stop offset=".45" stop-color="#dbeafe"/><stop offset=".8" stop-color="#93c5fd"/><stop offset="1" stop-color="#60a5fa"/></radialGradient>'
    + '<pattern id="slgKn" width="3.2" height="3.2" patternUnits="userSpaceOnUse"><path d="M0 3.2 3.2 0" stroke="#334155" stroke-width=".55" opacity=".38"/><path d="M0 0 3.2 3.2" stroke="#0f172a" stroke-width=".4" opacity=".22"/></pattern>'
    + '<pattern id="slgWeave" width="2.6" height="2.6" patternUnits="userSpaceOnUse"><path d="M0 1.3 H2.6 M1.3 0 V2.6" stroke="#cbd5e1" stroke-width=".45" opacity=".35"/></pattern>'
    + '</defs>';

  /* ---------- small builders ---------- */
  function shk(d, w) { // shaded steel shank stroke + silhouette edge + specular thread
    return '<path d="' + d + '" fill="none" stroke="#334155" stroke-width="' + (w + 1.6).toFixed(2) + '" stroke-linecap="round" stroke-linejoin="round" opacity=".5"/>'
      + '<path d="' + d + '" fill="none" stroke="url(#slgSt)" stroke-width="' + w + '" stroke-linecap="round" stroke-linejoin="round"/>'
      + '<path d="' + d + '" fill="none" stroke="#f8fafc" stroke-width="' + (w * 0.3).toFixed(2) + '" stroke-linecap="round" stroke-linejoin="round" opacity=".55" transform="translate(-' + (w * 0.14).toFixed(2) + ',0)"/>';
  }
  function hnd(top, bot, w) { // knurled octagonal handle w/ tapered shoulder
    var x = 32 - w / 2, h = bot - top;
    return '<path d="M' + (32 - w * 0.36) + ' ' + (top - 9) + ' L' + x + ' ' + top + ' L' + x + ' ' + (bot - 3) + ' Q' + x + ' ' + bot + ' ' + (x + 3) + ' ' + bot + ' L' + (x + w - 3) + ' ' + bot + ' Q' + (x + w) + ' ' + bot + ' ' + (x + w) + ' ' + (bot - 3) + ' L' + (x + w) + ' ' + top + ' L' + (32 + w * 0.36) + ' ' + (top - 9) + ' Z" fill="url(#slgSt)" stroke="#334155" stroke-width=".8" stroke-opacity=".5"/>'
      + '<rect x="' + x + '" y="' + (top + h * 0.16) + '" width="' + w + '" height="' + (h * 0.6) + '" fill="url(#slgKn)"/>'
      + '<line x1="' + (x + w * 0.3) + '" y1="' + (top + 2) + '" x2="' + (x + w * 0.3) + '" y2="' + (bot - 2) + '" stroke="#ffffff" stroke-width="1" opacity=".35"/>'
      + '<rect x="' + x + '" y="' + (top + h * 0.11) + '" width="' + w + '" height="2.2" fill="#475569" opacity=".45"/>'
      + '<rect x="' + x + '" y="' + (top + h * 0.79) + '" width="' + w + '" height="2.2" fill="#475569" opacity=".45"/>';
  }
  function hnd2(top, bot, w) { // double-ended handle (shoulders both ends)
    var x = 32 - w / 2, h = bot - top;
    return '<path d="M' + (32 - w * 0.34) + ' ' + (top - 8) + ' L' + x + ' ' + top + ' L' + x + ' ' + bot + ' L' + (32 - w * 0.34) + ' ' + (bot + 8) + ' L' + (32 + w * 0.34) + ' ' + (bot + 8) + ' L' + (x + w) + ' ' + bot + ' L' + (x + w) + ' ' + top + ' L' + (32 + w * 0.34) + ' ' + (top - 8) + ' Z" fill="url(#slgSt)" stroke="#334155" stroke-width=".8" stroke-opacity=".5"/>'
      + '<rect x="' + x + '" y="' + (top + h * 0.14) + '" width="' + w + '" height="' + (h * 0.72) + '" fill="url(#slgKn)"/>'
      + '<line x1="' + (x + w * 0.28) + '" y1="' + (top + 3) + '" x2="' + (x + w * 0.28) + '" y2="' + (bot - 3) + '" stroke="#fff" stroke-width="1" opacity=".35"/>';
  }
  function arm(d, w, tone) { // solid-toned arm/handle stroke + specular edge (hinged tools)
    var base = tone === 'dk' ? '#6b7787' : '#8b98a8';
    return '<path d="' + d + '" fill="none" stroke="#334155" stroke-width="' + (w + 1.4).toFixed(2) + '" stroke-linecap="round" stroke-linejoin="round" opacity=".45"/>'
      + '<path d="' + d + '" fill="none" stroke="' + base + '" stroke-width="' + w + '" stroke-linecap="round" stroke-linejoin="round"/>'
      + '<path d="' + d + '" fill="none" stroke="#475569" stroke-width="' + (w * 0.34).toFixed(2) + '" stroke-linecap="round" stroke-linejoin="round" opacity=".55" transform="translate(' + (w * 0.26).toFixed(2) + ',0)"/>'
      + '<path d="' + d + '" fill="none" stroke="#eef2f7" stroke-width="' + (w * 0.3).toFixed(2) + '" stroke-linecap="round" stroke-linejoin="round" opacity=".85" transform="translate(-' + (w * 0.2).toFixed(2) + ',0)"/>';
  }
  function ring(cx, cy, r) { // finger ring (scissors/hemostat)
    return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="url(#slgSt)" stroke-width="3.6"/>'
      + '<circle cx="' + (cx - 0.6) + '" cy="' + (cy - 0.6) + '" r="' + r + '" fill="none" stroke="#f8fafc" stroke-width="1" opacity=".5"/>';
  }
  function shL(rx) { return '<ellipse cx="32" cy="251" rx="' + (rx || 17) + '" ry="4.5" fill="#0f172a" opacity=".15"/>'; }
  function shF(cx, cy, rx) { return '<ellipse cx="' + (cx || 80) + '" cy="' + (cy || 134) + '" rx="' + (rx || 48) + '" ry="9" fill="#0f172a" opacity=".12"/>'; }

  var ART = {};
  function L(id, body, crop) { ART[id] = { k: 'long', b: body, crop: crop || '6 6 52 108' }; }
  function F(id, body) { ART[id] = { k: 'flat', b: body }; }

  /* ================= LONG HAND INSTRUMENTS (0 0 64 260) ================= */

  L('mirror',
    shL() + hnd(124, 246, 13)
    + shk('M32 121 L32 62 Q32 52 35.5 46 L39 40', 4)
    + '<circle cx="40" cy="25.5" r="15" fill="url(#slgDk)"/>'
    + '<circle cx="40" cy="25.5" r="15" fill="none" stroke="#334155" stroke-width=".8" opacity=".5"/>'
    + '<circle cx="40" cy="25.5" r="12.2" fill="url(#slgMir)"/>'
    + '<ellipse cx="35.5" cy="20" rx="4.6" ry="2.7" fill="#ffffff" opacity=".9" transform="rotate(-28 35.5 20)"/>'
    , '14 2 50 66');

  L('explorer',
    shL() + hnd(124, 246, 13)
    + shk('M32 121 L32 66', 4.4)
    + shk('M32 68 C32 50 33 40 27 32 C22 25.5 15 25 13.5 31 C12.8 34 14.2 36.2 16.4 36.4', 3.2)
    + '<path d="M15.8 36.4 L19 33.6" stroke="url(#slgSt)" stroke-width="1.5" stroke-linecap="round"/>'
    , '2 14 44 50');

  L('explorer-probe',
    shL() + hnd2(100, 176, 13)
    + shk('M32 97 L32 62', 4)
    + shk('M32 64 C32 50 33 42 27 34 C22 27 15 27 14 33', 3)
    + shk('M32 179 L32 202 Q32 208 34.5 212 L36.5 216', 3.6)
    + shk('M36.5 216 L39 238', 2.2)
    + '<path d="M35.8 222 l4.2 -.6 M36.5 227.5 l4.2 -.6 M37.2 233 l4.2 -.6" stroke="#0f172a" stroke-width="1.5"/>'
    , '4 10 56 80');

  L('cotton-pliers',
    shL(14)
    + arm('M32 244 C25.5 240 25 226 25.4 198 L26.4 124 C26.7 102 27.1 80 27.9 62', 4.4)
    + arm('M32 244 C38.5 240 39 226 38.6 198 L37.6 124 C37.3 102 36.9 80 36.1 62', 4.4, 'dk')
    + '<path d="M27.9 62 C28.4 52 29.4 43.5 30.9 36.5 L31.5 37.2 C30.5 44.5 30 53 29.9 62.5 Z" fill="#8b98a8" stroke="#475569" stroke-width=".7" stroke-linejoin="round"/>'
    + '<path d="M36.1 62 C35.6 52 34.6 43.5 33.1 36.5 L32.5 37.2 C33.5 44.5 34 53 34.1 62.5 Z" fill="#6b7787" stroke="#334155" stroke-width=".7" stroke-linejoin="round"/>'
    + '<path d="M26.6 68 l4.6 .6 M26.5 74 l4.8 .6" stroke="#475569" stroke-width=".9"/>'
    + '<path d="M37.4 68 l-4.6 .6 M37.5 74 l-4.8 .6" stroke="#334155" stroke-width=".9"/>'
    , '10 28 44 62');

  L('periodontal-probe',
    shL() + hnd(124, 246, 13)
    + shk('M32 121 L32 66 Q32 58 35 53 L37 49', 4)
    + shk('M37 50 L30 16', 2.3)
    + '<path d="M33.6 41.8 l3.4 -.7 M31.9 33.3 l3.4 -.7 M30.2 24.8 l3.4 -.7" stroke="#0f172a" stroke-width="1.9"/>'
    , '4 6 52 62');

  L('spoon-excavator',
    shL() + hnd(124, 246, 13)
    + shk('M32 121 L32 76 Q32 66 27.5 58.5 L24 53', 3.8)
    + '<ellipse cx="20.5" cy="42" rx="5.4" ry="8" transform="rotate(-27 20.5 42)" fill="url(#slgDk)"/>'
    + '<ellipse cx="19.6" cy="41" rx="3.3" ry="5.6" transform="rotate(-27 19.6 41)" fill="url(#slgSt)"/>'
    + '<ellipse cx="18.4" cy="38.6" rx="1.5" ry="2.6" transform="rotate(-27 18.4 38.6)" fill="#ffffff" opacity=".7"/>'
    , '0 16 52 58');

  L('condenser',
    shL() + hnd(124, 246, 13)
    + shk('M32 121 L32 74 Q32 64 27 57 L23.5 51', 3.8)
    + '<g transform="rotate(-35 22 45)"><rect x="16.5" y="41.5" width="11" height="7.5" rx="1.6" fill="url(#slgSt)" stroke="#475569" stroke-width=".7"/><rect x="16.5" y="41.5" width="11" height="2.4" rx="1.2" fill="#f8fafc" opacity=".55"/></g>'
    , '0 18 52 56');

  L('carver',
    shL() + hnd(124, 246, 13)
    + shk('M32 121 L32 78 Q32 70 28.5 64 L26 59', 3.8)
    + '<path d="M26.5 61 C21 52 19.5 41 21.5 27.5 L22.3 26 C26.8 34 29.8 45 30.4 57.5 Z" fill="url(#slgDk)" stroke="#1e293b" stroke-width=".7" stroke-linejoin="round"/>'
    + '<path d="M24 52 C22.5 44 22.3 36 22.6 30" stroke="#f8fafc" stroke-width="1.3" fill="none" opacity=".75"/>'
    , '6 18 38 46');

  L('scaler',
    shL() + hnd(124, 246, 13)
    + shk('M32 121 L32 76', 4)
    + '<path d="M32 78 C34 64 31.5 50 22 38 C19 34.4 16 32 12.5 30.6 L14.5 25.5 C24 28.5 32.5 38 35.8 50 C37.6 57 37.6 68 36 78 Z" fill="url(#slgDk)" stroke="#1e293b" stroke-width=".7" stroke-linejoin="round"/>'
    + '<path d="M15.5 28.5 C24 31.5 31 39.5 34 49" stroke="#f8fafc" stroke-width="1.4" fill="none" opacity=".75"/>'
    , '2 18 42 50');

  L('high-speed-handpiece',
    shL()
    + '<rect x="28.5" y="240" width="7" height="10" rx="3" fill="url(#slgNvy)"/>'
    + '<rect x="25" y="228" width="14" height="14" rx="3" fill="url(#slgDk)"/>'
    + '<path d="M26 232.5 h12 M26 237 h12" stroke="#334155" stroke-width="1" opacity=".6"/>'
    + '<path d="M25.8 228 L27 150 C27.4 136 28.6 127 30.5 120 L33.5 120 C35.4 127 36.6 136 37 150 L38.2 228 Z" fill="url(#slgSt)"/>'
    + '<path d="M29.3 226 L30.2 150 C30.5 138 31 130 31.8 123" stroke="#ffffff" stroke-width="1.6" opacity=".55" fill="none"/>'
    + '<rect x="27.4" y="150" width="9.4" height="30" fill="url(#slgKn)"/>'
    + '<path d="M32 122 C31 104 34 86 41.5 72" fill="none" stroke="url(#slgSt)" stroke-width="8" stroke-linecap="round"/>'
    + '<path d="M30.4 116 C30 102 32.5 88 39 75" fill="none" stroke="#f8fafc" stroke-width="1.4" opacity=".55"/>'
    + '<circle cx="42" cy="71" r="4.6" fill="#8994a5"/>'
    + '<g transform="rotate(24 44 63)"><rect x="37.5" y="52" width="13" height="20" rx="4.5" fill="url(#slgSt)" stroke="#475569" stroke-width=".6"/><ellipse cx="44" cy="53.6" rx="6.5" ry="2.6" fill="url(#slgDk)"/><rect x="37.5" y="64.5" width="13" height="2.4" fill="#64748b" opacity=".6"/></g>'
    + '<path d="M48.4 54 L52.4 43" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>'
    + '<path d="M52.4 43 C51.2 39.5 51.5 36.2 53.5 34.4 C55 36.8 54.6 40.6 52.4 43 Z" fill="url(#slgDk)"/>'
    , '10 20 52 92');

  L('low-speed-handpiece',
    shL()
    + '<rect x="27.5" y="238" width="9" height="13" rx="3.5" fill="url(#slgNvy)"/>'
    + '<rect x="23.5" y="224" width="17" height="16" rx="3" fill="url(#slgDk)"/>'
    + '<path d="M24.5 229 h15 M24.5 234 h15" stroke="#1e293b" stroke-width="1" opacity=".6"/>'
    + '<rect x="23.5" y="140" width="17" height="86" rx="4" fill="url(#slgSt)"/>'
    + '<rect x="23.5" y="168" width="17" height="34" fill="url(#slgKn)"/>'
    + '<path d="M23.5 140 L26.5 104 Q27.5 96 30 92 L34 92 Q36.5 96 37.5 104 L40.5 140 Z" fill="url(#slgSt)"/>'
    + '<rect x="26" y="120" width="12" height="2.2" fill="#64748b" opacity=".55"/>'
    + '<ellipse cx="32" cy="92" rx="4" ry="2" fill="url(#slgDk)"/>'
    + '<line x1="27.5" y1="144" x2="27.5" y2="222" stroke="#fff" stroke-width="1.8" opacity=".5"/>'
    , '6 74 52 92');

  L('air-water-syringe',
    shL()
    + '<path d="M26.5 148 L25 240 Q25 246 31 246 L33 246 Q39 246 39 240 L37.5 148 Z" fill="url(#slgSt)"/>'
    + '<rect x="25.6" y="164" width="12.8" height="58" fill="url(#slgKn)"/>'
    + '<line x1="28.4" y1="152" x2="27.6" y2="238" stroke="#fff" stroke-width="1.4" opacity=".5"/>'
    + '<rect x="19" y="124" width="27" height="26" rx="7" fill="url(#slgSt)" stroke="#475569" stroke-width=".6"/>'
    + '<rect x="22.5" y="112" width="7.5" height="13" rx="2.5" fill="url(#slgDk)"/><ellipse cx="26.2" cy="112.8" rx="3.7" ry="1.7" fill="#cbd5e1"/>'
    + '<rect x="34" y="112" width="7.5" height="13" rx="2.5" fill="url(#slgDk)"/><ellipse cx="37.7" cy="112.8" rx="3.7" ry="1.7" fill="#cbd5e1"/>'
    + '<path d="M22 128 L10 66" stroke="url(#slgSt)" stroke-width="6" stroke-linecap="round"/>'
    + '<path d="M20.6 124 L10.4 71" stroke="#f8fafc" stroke-width="1.1" opacity=".55"/>'
    + '<path d="M10 66 L7.5 52" stroke="url(#slgSt)" stroke-width="3.4" stroke-linecap="round"/>'
    + '<circle cx="10.2" cy="67" r="3.4" fill="url(#slgDk)"/>'
    , '0 44 56 92');

  (function () {
    var d = 'M31 246 L31 94 C31 72 32 63 40 57.5 C47.5 52.5 52 58 50 66';
    var ribs = '';
    for (var y = 104; y <= 240; y += 9) ribs += 'M27.8 ' + y + ' h6.4 ';
    L('saliva-ejector',
      shL(12)
      + '<path d="' + d + '" fill="none" stroke="url(#slgBlu)" stroke-width="7" stroke-linecap="round"/>'
      + '<path d="' + d + '" fill="none" stroke="#ffffff" stroke-width="1.8" opacity=".6" stroke-linecap="round" transform="translate(-1.6,0)"/>'
      + '<path d="' + ribs + '" stroke="#1d4ed8" stroke-width=".8" opacity=".45"/>'
      + '<g transform="rotate(22 50 66)"><rect x="44" y="63.5" width="12" height="5.4" rx="2.7" fill="url(#slgBluV)"/><rect x="46.3" y="60.6" width="7.4" height="3.6" rx="1.8" fill="#dbeafe"/></g>'
      , '8 44 52 76');
  })();

  L('hve-tip',
    shL(13)
    + '<path d="M25.5 246 L26.5 62 L40.5 38 L39.5 246 Q39.5 249 36 249 L29 249 Q25.5 249 25.5 246 Z" fill="url(#slgWht)" stroke="#94a3b8" stroke-width=".7"/>'
    + '<ellipse cx="33.4" cy="49.6" rx="9" ry="3.2" transform="rotate(-60 33.4 49.6)" fill="#334155"/>'
    + '<ellipse cx="33.7" cy="50" rx="7" ry="2.1" transform="rotate(-60 33.7 50)" fill="#0f172a"/>'
    + '<line x1="28.6" y1="66" x2="27.8" y2="242" stroke="#ffffff" stroke-width="2.2" opacity=".8"/>'
    , '8 30 52 74');

  L('surgical-suction',
    shL(11)
    + '<path d="M33 246 C33 205 33.5 172 31.5 142" fill="none" stroke="url(#slgSt)" stroke-width="7.5" stroke-linecap="round"/>'
    + '<path d="M31.5 144 C29.5 116 26 88 20 58" fill="none" stroke="url(#slgSt)" stroke-width="5" stroke-linecap="round"/>'
    + '<path d="M20.5 60 L16.5 36" stroke="url(#slgSt)" stroke-width="3" stroke-linecap="round"/>'
    + '<path d="M31.4 240 C31.4 205 31.6 175 30 148 C28.4 120 25 92 19.6 64" fill="none" stroke="#f8fafc" stroke-width="1.2" opacity=".55"/>'
    + '<ellipse cx="16.3" cy="35.4" rx="1.6" ry=".9" transform="rotate(-80 16.3 35.4)" fill="#334155"/>'
    + '<ellipse cx="40" cy="168" rx="6.5" ry="4.5" fill="url(#slgSt)" stroke="#64748b" stroke-width=".6"/><ellipse cx="40" cy="168" rx="2.6" ry="1.7" fill="#334155"/>'
    , '0 22 52 76');

  L('anesthetic-syringe',
    shL(13)
    + '<circle cx="32" cy="235" r="9" fill="none" stroke="url(#slgSt)" stroke-width="4.2"/>'
    + '<rect x="29.8" y="212" width="4.4" height="15" fill="url(#slgSt)"/>'
    + '<rect x="16" y="205" width="32" height="7" rx="3.4" fill="url(#slgSt)" stroke="#64748b" stroke-width=".5"/>'
    + '<rect x="23.5" y="140" width="17" height="66" rx="3.5" fill="url(#slgSt)"/>'
    + '<rect x="27" y="146" width="10" height="52" rx="4.4" fill="#334155"/>'
    + '<rect x="27.9" y="148" width="8.2" height="48" rx="3.6" fill="url(#slgGls)"/>'
    + '<rect x="27.9" y="188" width="8.2" height="8" rx="2" fill="#94a3b8"/>'
    + '<path d="M28.5 140 L30.5 124 L33.5 124 L35.5 140 Z" fill="url(#slgSt)"/>'
    + '<rect x="29.5" y="112" width="5" height="13" rx="2" fill="url(#slgBluV)"/>'
    + '<path d="M32 112 L32 52" stroke="#94a3b8" stroke-width="1.4"/><path d="M32 60 L32 52 L33.4 56 Z" fill="#94a3b8"/>'
    , '4 116 56 130');

  L('cb-scissors',
    shL(15)
    + ring(23.5, 225, 7.8) + ring(40.5, 225, 7.8)
    + '<path d="M26 218 L30.5 158" stroke="url(#slgSt)" stroke-width="4" stroke-linecap="round"/>'
    + '<path d="M38 218 L33.5 158" stroke="url(#slgSt)" stroke-width="4" stroke-linecap="round"/>'
    + '<path d="M29 160 C26.5 138 25 118 19.5 98 L17 90 L20.8 92.6 C27.5 103 31 121 33 160 Z" fill="url(#slgDk)" stroke="#1e293b" stroke-width=".7" stroke-linejoin="round"/>'
    + '<path d="M35 160 C36 136 35 114 29.5 96 L27 88.5 L30.6 90.8 C36.6 102 38.8 124 37.6 160 Z" fill="url(#slgSt)" stroke="#475569" stroke-width=".7" stroke-linejoin="round"/>'
    + '<path d="M21.4 96 C26.6 106 29.6 122 31.2 150" fill="none" stroke="#f8fafc" stroke-width="1.1" opacity=".8"/>'
    + '<circle cx="32" cy="158" r="2.6" fill="url(#slgDk)" stroke="#334155" stroke-width=".6"/>'
    , '8 80 46 90');

  L('cord-packer',
    shL() + hnd(124, 246, 13)
    + shk('M32 121 L32 74 Q32 66 28 60 L25 55', 3.8)
    + '<g transform="rotate(-32 22 45)"><rect x="19.6" y="34" width="5" height="20" rx="2.4" fill="url(#slgDk)"/><path d="M20 38.5 h4.4 M20 42.5 h4.4 M20 46.5 h4.4 M20 50.5 h4.4" stroke="#f8fafc" stroke-width=".8" opacity=".7"/></g>'
    , '0 16 52 58');

  L('endo-explorer',
    shL() + hnd(124, 246, 13)
    + shk('M32 121 L32 72 Q32 64 29 58', 3.6)
    + shk('M29.5 59 L19 24', 2.2)
    + '<path d="M20.6 29.5 L19 24 L22 28.8 Z" fill="#94a3b8"/>'
    , '0 8 52 64');

  (function () {
    var barbs = '';
    for (var y = 54, i = 0; y <= 182; y += 13, i++) {
      barbs += (i % 2 === 0)
        ? '<path d="M32 ' + y + ' L27.8 ' + (y - 5) + '" stroke="#64748b" stroke-width="1.3"/>'
        : '<path d="M32 ' + y + ' L36.2 ' + (y - 5) + '" stroke="#64748b" stroke-width="1.3"/>';
    }
    L('barbed-broach',
      shL(10)
      + '<rect x="26" y="196" width="12" height="46" rx="5.5" fill="url(#slgBlu)"/>'
      + '<path d="M27 206 h10 M27 212 h10 M27 218 h10 M27 224 h10 M27 230 h10" stroke="#1e3a8a" stroke-width="1" opacity=".5"/>'
      + '<line x1="32" y1="196" x2="32" y2="36" stroke="#64748b" stroke-width="1.7"/>'
      + '<line x1="31.6" y1="196" x2="31.6" y2="36" stroke="#e2e8f0" stroke-width=".55"/>'
      + barbs
      , '8 30 48 112');
  })();

  L('irrigation-syringe',
    shL(13)
    + '<rect x="22" y="238" width="20" height="5.5" rx="2.6" fill="url(#slgWht)"/>'
    + '<rect x="28.8" y="204" width="6.4" height="35" fill="url(#slgWht)"/>'
    + '<path d="M29.4 212 h5.2 M29.4 220 h5.2 M29.4 228 h5.2" stroke="#94a3b8" stroke-width=".8" opacity=".7"/>'
    + '<rect x="17.5" y="198" width="29" height="6.5" rx="3" fill="url(#slgWht)"/>'
    + '<rect x="23.5" y="120" width="17" height="82" rx="3" fill="url(#slgGls)" opacity=".92" stroke="#94a3b8" stroke-width=".7"/>'
    + '<rect x="24.8" y="128" width="14.4" height="60" rx="2" fill="#bae6fd" opacity=".75"/>'
    + '<rect x="24.8" y="186" width="14.4" height="7" rx="2" fill="#334155" opacity=".85"/>'
    + '<path d="M36 132 h3.5 M36 142 h3.5 M36 152 h3.5 M36 162 h3.5 M36 172 h3.5" stroke="#475569" stroke-width=".7" opacity=".7"/>'
    + '<path d="M28.5 120 L30.8 106 L33.2 106 L35.5 120 Z" fill="url(#slgWht)"/>'
    + '<rect x="29.3" y="96" width="5.4" height="11" rx="2" fill="url(#slgBlu)"/>'
    + '<line x1="32" y1="97" x2="32" y2="46" stroke="#94a3b8" stroke-width="1.3"/>'
    + '<circle cx="32" cy="46" r="1.1" fill="#94a3b8"/><circle cx="33.2" cy="52" r=".8" fill="#334155"/>'
    , '4 92 56 120');

  L('endo-plugger',
    shL() + hnd(124, 246, 13)
    + shk('M32 121 L32 70 Q32 62 29.5 57 L28 53', 3.6)
    + shk('M28 54 L25 26', 2.2)
    + '<path d="M24.4 46 l4 -.5 M23.8 40 l4 -.5 M23.2 34 l4 -.5" stroke="#0f172a" stroke-width="1.3"/>'
    + '<path d="M23.6 26.4 l3 -.4" stroke="#64748b" stroke-width="2"/>'
    , '0 10 52 60');

  L('glick',
    shL() + hnd2(100, 176, 13)
    + shk('M32 97 L32 66 Q32 58 28 52', 3.6)
    + '<ellipse cx="25" cy="40" rx="4.2" ry="10" transform="rotate(-14 25 40)" fill="url(#slgDk)"/>'
    + '<ellipse cx="24" cy="38" rx="2" ry="6" transform="rotate(-14 24 38)" fill="#f8fafc" opacity=".55"/>'
    + shk('M32 179 L32 208 Q32 214 35 219', 3.4)
    + shk('M35 218 L38 238', 2)
    + '<path d="M34.6 224 l4 -.5 M35.3 230 l4 -.5" stroke="#0f172a" stroke-width="1.2"/>'
    , '4 14 44 52');

  L('forceps',
    shL(19)
    + arm('M22.5 244 C13.5 212 15.5 176 26 142 L29.5 126', 7)
    + arm('M41.5 244 C50.5 212 48.5 176 38 142 L34.5 126', 7, 'dk')
    + '<g transform="rotate(14 32 122)"><rect x="27" y="114" width="10" height="16" rx="4" fill="#9aa6b6" stroke="#64748b" stroke-width=".6"/></g>'
    + '<g transform="rotate(-14 32 122)"><rect x="27" y="114" width="10" height="16" rx="4" fill="#7b8798" stroke="#475569" stroke-width=".6"/></g>'
    + '<circle cx="32" cy="122" r="2.6" fill="#334155"/><circle cx="31.2" cy="121.2" r=".9" fill="#cbd5e1"/>'
    + '<path d="M29 116 C25.2 100 25.6 82 29.8 62 L30.6 58 L31.9 58.6 L31.2 63 C28.4 84 28.8 100 31.6 114 Z" fill="#8994a5" stroke="#5b6779" stroke-width=".7"/>'
    + '<path d="M35 116 C38.8 100 38.4 82 34.2 62 L33.4 58 L32.1 58.6 L32.8 63 C35.6 84 35.2 100 32.4 114 Z" fill="#6f7b8d" stroke="#475569" stroke-width=".7"/>'
    + '<path d="M29.6 108 C27.6 92 28 78 30.6 64" fill="none" stroke="#eef2f7" stroke-width="1" opacity=".8"/>'
    , '6 44 52 86');

  L('elevator',
    shL() + hnd(130, 246, 15)
    + shk('M32 127 L32 82 Q32 72 30 66 L28.6 61', 4.2)
    + '<path d="M26.4 63 C18.6 59 15 48.5 16.2 35.5 Q16.9 27.6 24.8 27.1 Q32.8 26.6 34.3 34.4 C36.6 46.5 34.6 57 30.8 63 Z" fill="url(#slgSt)" stroke="#475569" stroke-width=".9" stroke-linejoin="round"/>'
    + '<path d="M20.4 32.4 C19 41 19.6 50 22.6 57.4" stroke="#f8fafc" stroke-width="1.6" fill="none" opacity=".75"/>'
    + '<path d="M25.4 30 C26.4 40 26.6 51 25.8 60" stroke="#64748b" stroke-width=".8" fill="none" opacity=".6"/>'
    , '2 18 44 52');

  L('rongeurs',
    shL(19)
    + arm('M23 244 C15 214 16.5 180 26.5 146 L30 128', 7)
    + arm('M41 244 C49 214 47.5 180 37.5 146 L34 128', 7, 'dk')
    + '<path d="M25.5 222 C29 231 35 231 38.5 222" fill="none" stroke="#64748b" stroke-width="2"/>'
    + '<circle cx="32" cy="124" r="3" fill="#334155"/><circle cx="31.2" cy="123.2" r=".9" fill="#cbd5e1"/>'
    + arm('M29.5 120 C26 106 25.5 92 28 78', 5)
    + arm('M34.5 120 C38 106 38.5 92 36 78', 5, 'dk')
    + '<ellipse cx="28.8" cy="64" rx="6.6" ry="11.5" transform="rotate(-8 28.8 64)" fill="#5b6779" stroke="#1e293b" stroke-width=".9"/>'
    + '<ellipse cx="35.2" cy="64" rx="6.6" ry="11.5" transform="rotate(8 35.2 64)" fill="#47546a" stroke="#0f172a" stroke-width=".9"/>'
    + '<path d="M32 53.5 L32 74.5" stroke="#0f172a" stroke-width="1.3"/>'
    + '<ellipse cx="26.6" cy="59" rx="1.8" ry="4" transform="rotate(-8 26.6 59)" fill="#eef2f7" opacity=".55"/>'
    , '6 40 52 90');

  L('bone-file',
    shL() + hnd(128, 246, 14)
    + shk('M32 125 L32 84 Q32 76 30 70', 4)
    + '<ellipse cx="28.5" cy="46" rx="6.4" ry="20" transform="rotate(-8 28.5 46)" fill="url(#slgSt)" stroke="#475569" stroke-width=".9"/>'
    + '<g transform="rotate(-8 28.5 46)">'
    + '<path d="M22.6 30.5 l11.6 3.6 M22.4 35.5 l12 3.6 M22.2 40.5 l12.4 3.6 M22.2 45.5 l12.4 3.6 M22.4 50.5 l12 3.6 M22.6 55.5 l11.6 3.6 M23.2 60.5 l10.6 3.4" stroke="#1e293b" stroke-width="1.5"/>'
    + '<path d="M34 31 l-11.4 4.6 M34.2 36.5 l-11.8 4.6 M34.4 42 l-12 4.6 M34.4 47.5 l-12 4.6 M34.2 53 l-11.6 4.6 M33.8 58.5 l-10.8 4.4" stroke="#475569" stroke-width=".8" opacity=".8"/>'
    + '</g>'
    , '4 20 40 50');

  (function () {
    var serr = '';
    for (var y = 106; y <= 136; y += 5) serr += 'M29.2 ' + y + ' l5.6 -.8 ';
    L('hemostat',
      shL(16)
      + ring(23, 227, 8) + ring(41, 227, 8)
      + '<path d="M27.5 214 l9 3 M27.7 210 l8.6 2.8 M27.9 206 l8.2 2.6" stroke="#475569" stroke-width="1.2"/>'
      + '<path d="M25.5 220 L30.6 158 L35.6 141" fill="none" stroke="url(#slgSt)" stroke-width="4.4" stroke-linecap="round" stroke-linejoin="round"/>'
      + '<path d="M38.5 220 L33.4 158 L28.4 141" fill="none" stroke="url(#slgSt)" stroke-width="4.4" stroke-linecap="round" stroke-linejoin="round"/>'
      + '<path d="M28.8 142.5 C26.8 129 27.2 114 30.2 103.5 L31.2 100.5 L32.4 101 C29.8 112 29.4 127 31.6 142 Z" fill="#6f7b8d" stroke="#475569" stroke-width=".8" stroke-linejoin="round"/>'
      + '<path d="M35.2 142.5 C37.2 129 36.8 114 33.8 103.5 L32.8 100.5 L31.6 101 C34.2 112 34.6 127 32.4 142 Z" fill="#556173" stroke="#1e293b" stroke-width=".8" stroke-linejoin="round"/>'
      + '<path d="' + serr + '" stroke="#1e293b" stroke-width=".9"/>'
      + '<circle cx="32" cy="149" r="2.8" fill="url(#slgDk)" stroke="#1e293b" stroke-width=".7"/><circle cx="31.2" cy="148.2" r=".9" fill="#cbd5e1"/>'
      , '8 88 48 84');
  })();

  L('scissors',
    shL(16)
    + ring(22.5, 226, 8.2) + ring(41.5, 226, 8.2)
    + '<path d="M25.5 219 L30.8 166" stroke="url(#slgSt)" stroke-width="4" stroke-linecap="round"/>'
    + '<path d="M38.5 219 L33.2 166" stroke="url(#slgSt)" stroke-width="4" stroke-linecap="round"/>'
    + '<path d="M30.6 163 C27.6 146 26.9 126 27.4 110 L27.6 105.5 L30.6 109.5 C31.5 124 32 144 32.3 163 Z" fill="url(#slgSt)" stroke="#475569" stroke-width=".8" stroke-linejoin="round"/>'
    + '<path d="M33.4 163 C36.4 146 37.1 126 36.6 110 L36.4 105.5 L33.4 109.5 C32.5 124 32 144 31.7 163 Z" fill="#556173" stroke="#1e293b" stroke-width=".8" stroke-linejoin="round"/>'
    + '<path d="M31.6 158 C30 142 29.4 124 29.6 110" fill="none" stroke="#f8fafc" stroke-width="1.1" opacity=".9"/>'
    + '<path d="M32.4 158 C34 142 34.6 124 34.4 110" fill="none" stroke="#cbd5e1" stroke-width="1" opacity=".85"/>'
    + '<circle cx="32" cy="162" r="2.7" fill="url(#slgDk)" stroke="#1e293b" stroke-width=".7"/><circle cx="31.2" cy="161.2" r=".9" fill="#cbd5e1"/>'
    , '6 92 52 88');

  L('surgical-curette',
    shL() + hnd(128, 246, 14)
    + shk('M32 125 L32 78 Q32 70 28.5 63 L26 58', 4)
    + '<ellipse cx="23.5" cy="44" rx="7.4" ry="11.6" transform="rotate(-22 23.5 44)" fill="url(#slgSt)" stroke="#475569" stroke-width=".9"/>'
    + '<ellipse cx="22.4" cy="42.8" rx="4.9" ry="8.4" transform="rotate(-22 22.4 42.8)" fill="#334155"/>'
    + '<ellipse cx="21.7" cy="41.9" rx="3.9" ry="7" transform="rotate(-22 21.7 41.9)" fill="#1e293b"/>'
    + '<path d="M18 36.4 C16.6 40.6 16.9 46.4 18.9 50.4" stroke="#f8fafc" stroke-width="1.4" fill="none" opacity=".85"/>'
    + '<ellipse cx="20" cy="38.4" rx="1.4" ry="2.6" transform="rotate(-22 20 38.4)" fill="#64748b" opacity=".9"/>'
    , '0 20 42 48');

  /* ================= FLAT MATERIALS & DISPOSABLES (0 0 160 160) ================= */

  F('gauze',
    shF(80, 128, 50)
    + '<g transform="rotate(-5 80 84)"><rect x="34" y="44" width="86" height="80" rx="5" fill="#dbe3ec" stroke="#aab6c4" stroke-width="1.1"/></g>'
    + '<g transform="rotate(3 82 86)"><rect x="42" y="40" width="84" height="78" rx="5" fill="url(#slgWhtV)" stroke="#aab6c4" stroke-width="1.1"/><rect x="42" y="40" width="84" height="78" rx="5" fill="url(#slgWeave)"/><rect x="42" y="79" width="84" height="39" rx="5" fill="#94a3b8" opacity=".18"/><line x1="44" y1="79" x2="124" y2="79" stroke="#8b98a8" stroke-width="1.3"/><path d="M45 42.5 L110 42.5" stroke="#ffffff" stroke-width="2.6" opacity=".85" stroke-linecap="round"/><path d="M43.5 44 C43.5 62 43.5 96 43.5 114" stroke="#ffffff" stroke-width="1.8" opacity=".6" stroke-linecap="round"/><path d="M126 40 L110 40 L126 56 Z" fill="#cbd5e1"/><path d="M110 40 L126 56" stroke="#aab6c4" stroke-width=".8"/></g>');

  F('cotton-rolls',
    shF(80, 124, 52)
    + '<g transform="rotate(-14 80 78)"><rect x="26" y="68" width="96" height="21" rx="10.5" fill="url(#slgWhtV)" stroke="#e2e8f0" stroke-width=".8"/><ellipse cx="122" cy="78.5" rx="4.6" ry="10.5" fill="#e2e8f0"/><ellipse cx="122" cy="78.5" rx="2.6" ry="6.4" fill="#cbd5e1"/><path d="M32 74 h84 M32 83 h84" stroke="#e2e8f0" stroke-width=".8"/></g>'
    + '<g transform="rotate(7 80 102)"><rect x="30" y="92" width="96" height="21" rx="10.5" fill="url(#slgWhtV)" stroke="#e2e8f0" stroke-width=".8"/><ellipse cx="126" cy="102.5" rx="4.6" ry="10.5" fill="#e2e8f0"/><ellipse cx="126" cy="102.5" rx="2.6" ry="6.4" fill="#cbd5e1"/><path d="M36 98 h84 M36 107 h84" stroke="#e2e8f0" stroke-width=".8"/></g>');

  F('dri-aids',
    shF(80, 126, 50)
    + '<path d="M34 112 Q30 118 38 118 L124 118 Q132 118 126 111 L52 44 Q46 38 43 46 Z" fill="url(#slgWhtV)" stroke="#9fb4cd" stroke-width="1.4"/>'
    + '<path d="M40 116 L122 116 Q128 116 123 111 L110 99 L42 99 Z" fill="#c7d9ec" opacity=".55"/>'
    + '<path d="M44 110 L116 110 L54 54 Z" fill="none" stroke="#93b6dd" stroke-width="1.5" stroke-dasharray="4 3"/>'
    + '<circle cx="66" cy="98" r="1.5" fill="#a8c6e4"/><circle cx="80" cy="102" r="1.5" fill="#a8c6e4"/><circle cx="94" cy="98" r="1.5" fill="#a8c6e4"/><circle cx="72" cy="84" r="1.5" fill="#a8c6e4"/><circle cx="62" cy="72" r="1.5" fill="#a8c6e4"/>');

  F('cotton-pellets',
    shF(80, 128, 42)
    + '<path d="M62 78 L98 78 L88 104 L84 110 L84 116 L76 116 L76 110 L72 104 Z" fill="#d9e8f6" opacity=".92" stroke="#7f95ab" stroke-width="1.2" stroke-linejoin="round"/>'
    + '<path d="M67 82 L74 100" stroke="#ffffff" stroke-width="2.6" opacity=".9"/>'
    + '<path d="M64 116 Q64 112 70 112 L90 112 Q96 112 96 116 L96 120 Q96 124 90 124 L70 124 Q64 124 64 120 Z" fill="#c3d6e8" stroke="#7f95ab" stroke-width="1"/>'
    + '<ellipse cx="80" cy="78" rx="18" ry="5.5" fill="#eaf2fa" stroke="#7f95ab" stroke-width="1.1"/>'
    + '<circle cx="72" cy="72" r="6.4" fill="url(#slgWhtV)" stroke="#a5b4c4" stroke-width="1"/>'
    + '<circle cx="87" cy="73" r="6.4" fill="url(#slgWhtV)" stroke="#a5b4c4" stroke-width="1"/>'
    + '<circle cx="79.5" cy="64" r="6.4" fill="#ffffff" stroke="#a5b4c4" stroke-width="1"/><path d="M76 62 a4.4 4.4 0 0 1 3.4 -1.8" stroke="#ffffff" stroke-width="1.3" fill="none"/>'
    + '<circle cx="116" cy="120" r="5.8" fill="url(#slgWhtV)" stroke="#a5b4c4" stroke-width="1"/>'
    + '<circle cx="45" cy="122" r="4.8" fill="url(#slgWhtV)" stroke="#a5b4c4" stroke-width="1"/>');

  F('matrix-band',
    shF(80, 128, 52)
    + '<g transform="rotate(-26 80 88)">'
    + '<ellipse cx="36" cy="79" rx="14" ry="9.5" fill="none" stroke="#8994a5" stroke-width="2"/>'
    + '<ellipse cx="35.4" cy="78.4" rx="13.4" ry="9" fill="none" stroke="#eef2f7" stroke-width=".9" opacity=".8"/>'
    + '<path d="M22 79 A14 9.5 0 0 0 50 79 L50 88 A14 9.5 0 0 1 22 88 Z" fill="url(#slgStV)" stroke="#64748b" stroke-width=".8"/>'
    + '<path d="M24 84 A12.4 8 0 0 0 48 84" fill="none" stroke="#f8fafc" stroke-width=".9" opacity=".65"/>'
    + '<path d="M44 76 L54 81 L54 90 L44 90 Z" fill="#7b8798"/>'
    + '<rect x="52" y="82" width="60" height="9" rx="2.5" fill="url(#slgSt)" stroke="#64748b" stroke-width=".7"/>'
    + '<line x1="56" y1="86.5" x2="102" y2="86.5" stroke="#475569" stroke-width="1.5"/>'
    + '<rect x="100" y="78" width="9" height="17" rx="3" fill="#7b8798" stroke="#475569" stroke-width=".6"/><path d="M102.5 80 v13 M105.5 80 v13" stroke="#334155" stroke-width=".8" opacity=".7"/>'
    + '<rect x="112" y="80.5" width="13" height="12" rx="3.5" fill="#9aa6b6" stroke="#64748b" stroke-width=".6"/><path d="M115 82 v9 M118.5 82 v9 M122 82 v9" stroke="#64748b" stroke-width=".8"/>'
    + '</g>');

  F('wedge',
    shF(80, 120, 50)
    + '<g transform="rotate(-8 80 100)"><path d="M30 106 L122 98 L36 86 Q28 88 30 106 Z" fill="url(#slgWood)" stroke="#8a5a2b" stroke-width=".8"/><path d="M36 90 L112 97 M34 96 L116 98" stroke="#8a5a2b" stroke-width=".7" opacity=".55"/></g>'
    + '<g transform="rotate(9 86 116)"><path d="M52 124 L128 118 L58 108 Q50 110 52 124 Z" fill="url(#slgWood)" stroke="#8a5a2b" stroke-width=".7"/><path d="M58 112 L118 118" stroke="#8a5a2b" stroke-width=".6" opacity=".55"/></g>');

  F('bite-block',
    shF(80, 124, 46)
    + '<path d="M44 112 Q37 112 39 104 L42 98 C62 86 94 64 110 54 Q119 49 121.5 58 L124 102 Q124.5 112 116 112 Z" fill="url(#slgBluV)" stroke="#1d4ed8" stroke-width="1"/>'
    + '<path d="M50 99 L112 60 M58 103 L116 68 M66 107 L119 77" stroke="#1e40af" stroke-width="2" opacity=".45"/>'
    + '<circle cx="110" cy="93" r="4.6" fill="#1e3a8a"/>'
    + '<path d="M110 93 C126 84 136 96 128 110" fill="none" stroke="#e2e8f0" stroke-width="2.2"/>');

  F('articulating-paper',
    shF(80, 122, 52)
    + '<g transform="rotate(-6 62 104)"><rect x="28" y="88" width="68" height="6" rx="2" fill="#dbeafe" stroke="#93c5fd" stroke-width=".6"/><rect x="28" y="93" width="68" height="18" rx="3" fill="url(#slgBluV)" stroke="#1e3a8a" stroke-width=".8"/></g>'
    + '<g transform="rotate(-16 88 66)">'
    + '<path d="M34 68.5 L96 65" stroke="#8994a5" stroke-width="3.6" stroke-linecap="round"/>'
    + '<path d="M34 79.5 L96 73" stroke="#6f7b8d" stroke-width="3.6" stroke-linecap="round"/>'
    + '<path d="M34 68.5 Q26 74 34 79.5" stroke="#8994a5" stroke-width="3.2" fill="none"/>'
    + '<path d="M34 67.6 L92 64.4" stroke="#eef2f7" stroke-width="1" opacity=".85"/>'
    + '<rect x="101" y="60" width="36" height="14" rx="3" fill="url(#slgBluV)" stroke="#1e3a8a" stroke-width=".7"/>'
    + '<rect x="93" y="60.5" width="11" height="13" rx="3" fill="#5b6779" stroke="#334155" stroke-width=".7"/>'
    + '</g>');

  F('etch',
    shF(80, 122, 50)
    + '<g transform="rotate(-22 80 86)">'
    + '<rect x="20" y="74" width="6" height="21" rx="2.5" fill="url(#slgWht)"/>'
    + '<rect x="26" y="80" width="24" height="9" rx="3" fill="url(#slgWht)"/>'
    + '<rect x="48" y="70" width="6" height="29" rx="2.5" fill="url(#slgWht)"/>'
    + '<rect x="52" y="76" width="52" height="17" rx="4" fill="url(#slgBluV)" stroke="#1d4ed8" stroke-width=".8"/>'
    + '<rect x="55" y="78" width="46" height="4" rx="2" fill="#dbeafe" opacity=".8"/>'
    + '<path d="M104 80.5 L118 82 L118 87 L104 88.5 Z" fill="url(#slgBluV)"/>'
    + '<path d="M118 84.5 L132 78" stroke="#1d4ed8" stroke-width="3.6" stroke-linecap="round"/>'
    + '<circle cx="133.5" cy="77" r="2.4" fill="#3b82f6"/>'
    + '</g>');

  F('bond',
    shF(80, 130, 36)
    + '<rect x="66" y="34" width="28" height="16" rx="3.5" fill="url(#slgNvy)"/>'
    + '<path d="M71 36 v12 M76 36 v12 M81 36 v12 M86 36 v12" stroke="#334155" stroke-width=".8" opacity=".7"/>'
    + '<rect x="72" y="50" width="16" height="10" fill="url(#slgAmb)"/>'
    + '<path d="M60 62 Q60 56 66 56 L94 56 Q100 56 100 62 L100 114 Q100 124 90 124 L70 124 Q60 124 60 114 Z" fill="url(#slgAmb)" stroke="#92400e" stroke-width=".8"/>'
    + '<rect x="60" y="80" width="40" height="24" fill="#fffbeb" opacity=".92"/>'
    + '<rect x="60" y="80" width="40" height="6" fill="#0d9488"/>'
    + '<rect x="66" y="92" width="28" height="2.6" rx="1.3" fill="#cbd5e1"/><rect x="66" y="98" width="20" height="2.6" rx="1.3" fill="#cbd5e1"/>'
    + '<line x1="66" y1="62" x2="66" y2="112" stroke="#fde68a" stroke-width="2.5" opacity=".7"/>');

  F('composite',
    shF(80, 120, 52)
    + '<g transform="rotate(-10 80 84)">'
    + '<rect x="14" y="72" width="6" height="24" rx="2.5" fill="url(#slgWht)"/>'
    + '<rect x="18" y="80" width="22" height="8" rx="3" fill="url(#slgWht)"/>'
    + '<rect x="38" y="68" width="6" height="32" rx="2.5" fill="url(#slgIvo)" stroke="#bda67c" stroke-width=".5"/>'
    + '<rect x="42" y="72" width="56" height="24" rx="6" fill="url(#slgIvo)" stroke="#bda67c" stroke-width=".8"/>'
    + '<rect x="86" y="72" width="8" height="24" fill="url(#slgAmb)" opacity=".85"/>'
    + '<rect x="48" y="78" width="24" height="3" rx="1.5" fill="#bda67c" opacity=".6"/><rect x="48" y="85" width="18" height="3" rx="1.5" fill="#bda67c" opacity=".5"/>'
    + '<path d="M98 78 L122 80.5 L122 87.5 L98 90 Z" fill="url(#slgIvo)" stroke="#bda67c" stroke-width=".7"/>'
    + '<rect x="120" y="78.5" width="7" height="10" rx="3" fill="#94a3b8"/>'
    + '</g>');

  F('flowable-composite',
    shF(80, 120, 50)
    + '<g transform="rotate(-28 80 84)">'
    + '<rect x="8" y="72" width="5.5" height="21" rx="2.5" fill="url(#slgWht)"/>'
    + '<rect x="12" y="79" width="22" height="7" rx="3" fill="url(#slgWht)"/>'
    + '<rect x="32" y="70" width="5.5" height="26" rx="2.5" fill="url(#slgIvo)" stroke="#bda67c" stroke-width=".5"/>'
    + '<rect x="36" y="76" width="50" height="14" rx="5" fill="url(#slgIvo)" stroke="#bda67c" stroke-width=".7"/>'
    + '<path d="M86 79 L102 81 L102 85 L86 87 Z" fill="url(#slgIvo)"/>'
    + '<path d="M102 83 L118 83 L126 76" stroke="#64748b" stroke-width="2.4" fill="none" stroke-linecap="round"/>'
    + '</g>');

  (function () {
    var shades = ['#fff7e0', '#fdeec3', '#f8e3ab', '#efd391', '#e6c27b'];
    var tabs = '';
    for (var i = 0; i < 5; i++) {
      var a = -36 + i * 18;
      tabs += '<g transform="rotate(' + a + ' 80 122)"><path d="M77.8 104 L77.8 80 L74.6 76 L74.2 60 Q74.2 53.5 80 53.5 Q85.8 53.5 85.8 60 L85.4 76 L82.2 80 L82.2 104 Z" fill="' + shades[i] + '" stroke="#c9b586" stroke-width=".8"/><path d="M76.8 62 Q76.9 56.5 80 56.3" stroke="#ffffff" stroke-width="1.5" fill="none" opacity=".9"/><path d="M75.6 74 h9" stroke="#c9b586" stroke-width=".6" opacity=".8"/></g>';
    }
    F('shade-guide',
      shF(80, 130, 46) + tabs
      + '<rect x="66" y="108" width="28" height="18" rx="6" fill="url(#slgSt)" stroke="#64748b" stroke-width=".8"/>'
      + '<circle cx="80" cy="117" r="3" fill="#334155"/>');
  })();

  F('curing-light',
    shF(78, 138, 48)
    + '<path d="M42 64 Q33 64 33 74 Q33 84 42 84 L57 84 L52.5 125 Q51.5 134 60 134 L73 134 Q81.5 134 80.5 125 L76 84 L102 84 Q104 84 104 82 L104 66 Q104 64 102 64 Z" fill="url(#slgNvy)" stroke="#0f172a" stroke-width="1" stroke-linejoin="round"/>'
    + '<path d="M38 69 L99 69" stroke="#64748b" stroke-width="2" opacity=".75" stroke-linecap="round"/>'
    + '<path d="M56 90 L77 90" stroke="#0f172a" stroke-width="1.4" opacity=".6"/>'
    + '<circle cx="66" cy="101" r="4.4" fill="#0d9488" stroke="#134e4a" stroke-width="1"/><circle cx="64.8" cy="99.8" r="1.3" fill="#5eead4" opacity=".9"/>'
    + '<circle cx="99" cy="63" r="11" fill="url(#slgOr)" opacity=".78" stroke="#c2410c" stroke-width="1.1"/>'
    + '<circle cx="95.5" cy="59" r="4" fill="#ffffff" opacity=".3"/>'
    + '<path d="M102 74 C114 74 122 66.5 127 53" stroke="#1e293b" stroke-width="10" fill="none" stroke-linecap="round" opacity=".5"/>'
    + '<path d="M102 74 C114 74 122 66.5 127 53" stroke="url(#slgDkV)" stroke-width="8.5" fill="none" stroke-linecap="round"/>'
    + '<path d="M102 71 C113 70.6 120 63.5 124.3 53.5" stroke="#94a3b8" stroke-width="1.4" fill="none" opacity=".8"/>'
    + '<circle cx="128" cy="50" r="9" fill="#60a5fa" opacity=".38"/><circle cx="128" cy="50" r="5" fill="#93c5fd"/><circle cx="128" cy="50" r="2.2" fill="#ffffff"/>');

  F('retraction-cord',
    shF(76, 130, 44)
    + '<rect x="50" y="62" width="52" height="62" rx="10" fill="url(#slgTeal)" stroke="#0f766e" stroke-width="1"/>'
    + '<rect x="50" y="86" width="52" height="20" fill="#f0fdfa" opacity=".95"/>'
    + '<rect x="56" y="92" width="30" height="2.8" rx="1.4" fill="#94a3b8"/><rect x="56" y="98" width="22" height="2.8" rx="1.4" fill="#cbd5e1"/>'
    + '<rect x="46" y="48" width="60" height="20" rx="8" fill="url(#slgWht)" stroke="#94a3b8" stroke-width=".8"/>'
    + '<circle cx="76" cy="52" r="3.2" fill="#334155"/>'
    + '<path d="M76 51 C82 38 96 36 106 44 C116 52 122 68 118 84" fill="none" stroke="#e2e8f0" stroke-width="3" stroke-linecap="round"/>'
    + '<path d="M76 51 C82 38 96 36 106 44 C116 52 122 68 118 84" fill="none" stroke="#94a3b8" stroke-width="3" stroke-linecap="round" stroke-dasharray="2.4 2.4"/>'
    + '<ellipse cx="118" cy="106" rx="13" ry="7" fill="none" stroke="#e2e8f0" stroke-width="3"/><ellipse cx="118" cy="108" rx="8" ry="4.5" fill="none" stroke="#cbd5e1" stroke-width="2.6"/>');

  F('ferric-sulfate',
    shF(80, 130, 34)
    + '<rect x="66" y="42" width="28" height="20" rx="5" fill="#7f1d1d"/>'
    + '<path d="M71 44 v16 M77 44 v16 M83 44 v16 M89 44 v16" stroke="#5b1515" stroke-width=".9" opacity=".8"/>'
    + '<rect x="72" y="60" width="16" height="8" fill="#cbd5e1"/>'
    + '<path d="M60 74 Q60 66 68 66 L92 66 Q100 66 100 74 L100 116 Q100 126 90 126 L70 126 Q60 126 60 116 Z" fill="url(#slgGls)" stroke="#94a3b8" stroke-width=".8"/>'
    + '<path d="M61.5 80 L98.5 80 L98.5 116 Q98.5 124.5 90 124.5 L70 124.5 Q61.5 124.5 61.5 116 Z" fill="#63200f"/>'
    + '<path d="M64 84 L64 114" stroke="#a8543c" stroke-width="2.2" opacity=".8"/>'
    + '<rect x="60" y="92" width="40" height="18" fill="#fef2f2" opacity=".96"/>'
    + '<rect x="60" y="92" width="40" height="4.5" fill="#b91c1c"/>'
    + '<rect x="66" y="100" width="26" height="2.6" rx="1.3" fill="#94a3b8"/><rect x="66" y="105" width="18" height="2.4" rx="1.2" fill="#cbd5e1"/>');

  F('heavy-body',
    shF(80, 124, 54)
    + '<g transform="rotate(-6 80 90)">'
    + '<rect x="22" y="76" width="8" height="30" rx="3" fill="url(#slgWht)"/>'
    + '<rect x="30" y="72" width="7" height="38" rx="3" fill="url(#slgWht)"/>'
    + '<rect x="37" y="74" width="66" height="16" rx="6" fill="url(#slgPur)" stroke="#6d28d9" stroke-width=".8"/>'
    + '<rect x="37" y="90" width="66" height="16" rx="6" fill="url(#slgPur)" stroke="#6d28d9" stroke-width=".8"/>'
    + '<rect x="42" y="77" width="54" height="3.4" rx="1.7" fill="#ede9fe" opacity=".8"/>'
    + '<path d="M103 80 L112 84 L112 96 L103 100 Z" fill="url(#slgPur)" stroke="#6d28d9" stroke-width=".7"/>'
    + '<path d="M112 83.5 L142 87.5 L142 92.5 L112 96.5 Z" fill="url(#slgTeal)" stroke="#0f766e" stroke-width=".8"/>'
    + '<path d="M117 85 l3.4 10 M124 86 l3.2 8.4 M131 87 l3 6.8 M137 87.8 l2.6 5.2" stroke="#0f766e" stroke-width="1" opacity=".8"/>'
    + '</g>');

  F('light-body',
    shF(80, 120, 50)
    + '<g transform="rotate(-10 80 86)">'
    + '<rect x="16" y="76" width="5.5" height="21" rx="2.5" fill="url(#slgWht)"/>'
    + '<rect x="20" y="82" width="16" height="7" rx="3" fill="url(#slgWht)"/>'
    + '<rect x="32" y="72" width="6" height="28" rx="2.5" fill="url(#slgWht)"/>'
    + '<rect x="36" y="78" width="58" height="15" rx="6" fill="url(#slgTeal)" stroke="#0f766e" stroke-width=".8"/>'
    + '<rect x="41" y="80.5" width="46" height="3" rx="1.5" fill="#ccfbf1" opacity=".85"/>'
    + '<path d="M94 83 L108 84.5 L108 88 L94 89.5 Z" fill="url(#slgTeal)"/>'
    + '<path d="M108 86 L124 86 C130 86 132 82 133 77" stroke="#eab308" stroke-width="3.4" fill="none" stroke-linecap="round"/>'
    + '</g>');

  F('bite-registration',
    shF(80, 122, 52)
    + '<g transform="rotate(-4 80 92)">'
    + '<rect x="22" y="78" width="8" height="26" rx="3" fill="url(#slgWht)"/>'
    + '<rect x="30" y="74" width="7" height="34" rx="3" fill="url(#slgWht)"/>'
    + '<rect x="36" y="78" width="62" height="13" rx="5.5" fill="url(#slgAmb)" stroke="#b45309" stroke-width=".8"/>'
    + '<rect x="36" y="91" width="62" height="13" rx="5.5" fill="url(#slgAmb)" stroke="#b45309" stroke-width=".8"/>'
    + '<rect x="41" y="80.5" width="50" height="3" rx="1.5" fill="#fef3c7" opacity=".85"/>'
    + '<path d="M98 84 L106 86.5 L106 95.5 L98 98 Z" fill="url(#slgAmb)" stroke="#b45309" stroke-width=".6"/>'
    + '<path d="M106 88 L126 89.5 L126 92.5 L106 94 Z" fill="url(#slgWht)" stroke="#94a3b8" stroke-width=".6"/>'
    + '<path d="M110 89 l2.6 4 M116 89.6 l2.6 3.4 M122 90.2 l2.6 2.6" stroke="#94a3b8" stroke-width=".8"/>'
    + '</g>');

  F('temp-crown-material',
    shF(80, 126, 54)
    + '<g transform="rotate(-5 80 88)">'
    + '<rect x="16" y="76" width="10" height="20" rx="3.5" fill="url(#slgWht)"/>'
    + '<rect x="24" y="70" width="8" height="32" rx="3" fill="url(#slgWht)"/>'
    + '<rect x="30" y="66" width="66" height="36" rx="9" fill="url(#slgIvo)" stroke="#bda67c" stroke-width="1"/>'
    + '<line x1="32" y1="94" x2="94" y2="94" stroke="#bda67c" stroke-width="1"/>'
    + '<rect x="42" y="72" width="34" height="12" rx="3" fill="#0d9488" opacity=".85"/>'
    + '<path d="M96 74 L108 79 L108 91 L96 96 Z" fill="url(#slgIvo)" stroke="#bda67c" stroke-width=".7"/>'
    + '<path d="M108 81 L140 84 L140 86.5 L108 89 Z" fill="url(#slgWht)" stroke="#94a3b8" stroke-width=".6"/>'
    + '<path d="M114 82 l2.6 5.4 M122 82.8 l2.6 4.6 M130 83.6 l2.6 3.6" stroke="#94a3b8" stroke-width=".8"/>'
    + '</g>');

  F('impression-tray',
    shF(80, 130, 52)
    + '<rect x="74" y="20" width="12" height="22" rx="5" fill="url(#slgSt)" stroke="#475569" stroke-width=".8"/>'
    + '<path d="M46 124 C24 80 42 38 80 38 C118 38 136 80 114 124 Q112 130 105 128 L102.5 127.2 Q97.5 125.5 99.5 120 C111 90 103 62 80 62 C57 62 49 90 60.5 120 Q62.5 125.5 57.5 127.2 L55 128 Q48 130 46 124 Z" fill="#a4afbd" stroke="#475569" stroke-width="1" stroke-linejoin="round"/>'
    + '<path d="M46.8 120 C26.5 79 44 40.5 80 40.5 C116 40.5 133.5 79 113.2 120" fill="none" stroke="#e8edf2" stroke-width="2.6" opacity=".95"/>'
    + '<path d="M49.5 116 C32 79 48 45 80 45 C112 45 128 79 110.5 116" fill="none" stroke="#64748b" stroke-width="3.6" opacity=".5"/>'
    + '<path d="M98 118 C108.5 90 101 64 80 64 C59 64 51.5 90 62 118" fill="none" stroke="#dfe5eb" stroke-width="2" opacity=".9"/>'
    + '<circle cx="55" cy="110" r="2" fill="#1e293b"/><circle cx="52" cy="92" r="2" fill="#1e293b"/><circle cx="56" cy="72" r="2" fill="#1e293b"/><circle cx="66" cy="57" r="2" fill="#1e293b"/><circle cx="80" cy="52.5" r="2" fill="#1e293b"/><circle cx="94" cy="57" r="2" fill="#1e293b"/><circle cx="104" cy="72" r="2" fill="#1e293b"/><circle cx="108" cy="92" r="2" fill="#1e293b"/><circle cx="105" cy="110" r="2" fill="#1e293b"/>');

  F('floss',
    shF(80, 130, 40)
    + '<rect x="52" y="66" width="56" height="58" rx="14" fill="url(#slgTeal)" stroke="#0f766e" stroke-width="1"/>'
    + '<path d="M52 80 Q52 58 80 58 Q108 58 108 80 L108 86 L52 86 Z" fill="url(#slgWht)" stroke="#8b98a8" stroke-width="1"/>'
    + '<rect x="97" y="60" width="9" height="7" rx="1.6" fill="#7b8798" stroke="#475569" stroke-width=".6"/>'
    + '<path d="M101.5 63 C120 52 132 66 126 86 C121 100 128 108 136 110" fill="none" stroke="#ffffff" stroke-width="2.6" stroke-linecap="round"/>'
    + '<path d="M101.5 63 C120 52 132 66 126 86 C121 100 128 108 136 110" fill="none" stroke="#8b98a8" stroke-width="2.6" stroke-linecap="round" stroke-dasharray="5 3" stroke-dashoffset="2" opacity=".55"/>'
    + '<circle cx="80" cy="100" r="12" fill="#f0fdfa" opacity=".35"/>'
    + '<line x1="60" y1="94" x2="60" y2="116" stroke="#ccfbf1" stroke-width="2.5" opacity=".7"/>');

  F('cement',
    shF(80, 130, 52)
    + '<rect x="34" y="72" width="46" height="52" rx="8" fill="url(#slgIvo)" stroke="#bda67c" stroke-width=".8"/>'
    + '<rect x="30" y="58" width="54" height="18" rx="7" fill="url(#slgAmb)" stroke="#92400e" stroke-width=".7"/>'
    + '<rect x="34" y="88" width="46" height="20" fill="#fffbeb" opacity=".95"/>'
    + '<rect x="40" y="93" width="30" height="2.8" rx="1.4" fill="#94a3b8"/><rect x="40" y="99" width="22" height="2.8" rx="1.4" fill="#cbd5e1"/>'
    + '<rect x="96" y="82" width="30" height="42" rx="7" fill="url(#slgWht)" stroke="#94a3b8" stroke-width=".8"/>'
    + '<rect x="102" y="68" width="18" height="16" rx="4" fill="url(#slgTeal)"/>'
    + '<rect x="96" y="96" width="30" height="14" fill="#f0fdfa" opacity=".95"/><rect x="101" y="100" width="18" height="2.6" rx="1.3" fill="#94a3b8"/>');

  F('dental-dam',
    shF(80, 132, 52)
    + '<g transform="rotate(-4 80 84)"><rect x="32" y="40" width="94" height="90" rx="6" fill="url(#slgGrn)" stroke="#059669" stroke-width="1"/>'
    + '<path d="M40 50 L86 44 L48 86 Z" fill="#ffffff" opacity=".14"/>'
    + '<path d="M126 40 L104 40 Q120 52 126 62 Z" fill="#bbf7d0"/>'
    + '<circle cx="98" cy="76" r="5" fill="#0f172a" opacity=".7"/>'
    + '</g>');

  F('dam-frame',
    shF(80, 132, 44)
    + '<path d="M52 40 L52 106 Q52 120 66 120 L94 120 Q108 120 108 106 L108 40" fill="none" stroke="url(#slgWht)" stroke-width="11" stroke-linecap="round"/>'
    + '<path d="M52 40 L52 106 Q52 120 66 120 L94 120 Q108 120 108 106 L108 40" fill="none" stroke="#94a3b8" stroke-width="11.8" stroke-linecap="round" opacity=".25"/>'
    + '<path d="M49 42 L52 32 L55 42 Z M49 74 L46 66 L52 70 Z M105 42 L108 32 L111 42 Z M111 74 L114 66 L108 70 Z M66 117 L62 124 L70 122 Z M94 117 L98 124 L90 122 Z" fill="#e2e8f0" stroke="#94a3b8" stroke-width=".6"/>');

  F('dam-punch',
    shF(80, 132, 48)
    + '<g transform="rotate(-14 80 88)">'
    + '<path d="M120 128 C130 108 126 92 106 82" stroke="url(#slgSt)" stroke-width="7" fill="none" stroke-linecap="round"/>'
    + '<path d="M96 134 C92 112 94 98 100 88" stroke="url(#slgSt)" stroke-width="7" fill="none" stroke-linecap="round"/>'
    + '<circle cx="103" cy="84" r="4.5" fill="url(#slgDk)"/>'
    + '<path d="M100 82 C88 70 76 62 62 56" stroke="url(#slgSt)" stroke-width="6" fill="none" stroke-linecap="round"/>'
    + '<rect x="57" y="54" width="7" height="13" rx="2.5" fill="url(#slgDk)"/>'
    + '<path d="M102 88 C88 84 74 80 66 78" stroke="url(#slgSt)" stroke-width="6" fill="none" stroke-linecap="round"/>'
    + '<circle cx="60" cy="78" r="13" fill="url(#slgSt)" stroke="#64748b" stroke-width=".8"/>'
    + '<circle cx="60" cy="78" r="2.2" fill="#334155"/>'
    + '<circle cx="60" cy="69.5" r="1.7" fill="#334155"/><circle cx="67" cy="72.5" r="1.7" fill="#334155"/><circle cx="67" cy="83.5" r="1.7" fill="#334155"/><circle cx="60" cy="86.5" r="1.7" fill="#334155"/><circle cx="53" cy="83.5" r="1.7" fill="#334155"/><circle cx="52.5" cy="74" r="1.7" fill="#334155"/>'
    + '</g>');

  F('dam-clamp',
    shF(80, 122, 42)
    + '<path d="M63 74 A25 25 0 0 1 97 74" fill="none" stroke="#334155" stroke-width="9.6" stroke-linecap="round" opacity=".45"/>'
    + '<path d="M63 74 A25 25 0 0 1 97 74" fill="none" stroke="#6b7787" stroke-width="8"/>'
    + '<path d="M64.5 70.5 A23 23 0 0 1 95.5 70.5" fill="none" stroke="#eef2f7" stroke-width="1.5" opacity=".8"/>'
    + '<g>'
    + '<path d="M66 70 C60 65.5 51 66 45.5 70.5 L34.5 67.5 C31.8 66.8 30.6 69.3 32.4 71.3 L40.5 79.5 C38.8 84 38.8 91.5 40.5 96 L32.4 104.2 C30.6 106.2 31.8 108.7 34.5 108 L45.5 105 C51 109.5 60 110 66 105.5 C70 102.3 72 96 72 87.7 C72 79.5 70 73.2 66 70 Z" fill="#8b98a8" stroke="#475569" stroke-width="1" stroke-linejoin="round"/>'
    + '<circle cx="51" cy="87.7" r="5" fill="#334155"/><circle cx="50" cy="86.7" r="1.4" fill="#94a3b8"/>'
    + '<path d="M68.4 74.5 C71 80.5 71 95 68.4 101" fill="none" stroke="#eef2f7" stroke-width="1.3" opacity=".85"/>'
    + '</g>'
    + '<g transform="matrix(-1 0 0 1 160 0)">'
    + '<path d="M66 70 C60 65.5 51 66 45.5 70.5 L34.5 67.5 C31.8 66.8 30.6 69.3 32.4 71.3 L40.5 79.5 C38.8 84 38.8 91.5 40.5 96 L32.4 104.2 C30.6 106.2 31.8 108.7 34.5 108 L45.5 105 C51 109.5 60 110 66 105.5 C70 102.3 72 96 72 87.7 C72 79.5 70 73.2 66 70 Z" fill="#75828f" stroke="#334155" stroke-width="1" stroke-linejoin="round"/>'
    + '<circle cx="51" cy="87.7" r="5" fill="#1e293b"/><circle cx="50" cy="86.7" r="1.4" fill="#94a3b8"/>'
    + '</g>');

  (function () {
    var cols = ['#f8fafc', '#facc15', '#ef4444', '#3b82f6', '#22c55e'];
    var files = '';
    for (var i = 0; i < 5; i++) {
      var x = 46 + i * 17;
      files += '<line x1="' + x + '" y1="70" x2="' + x + '" y2="106" stroke="#94a3b8" stroke-width="1.6"/>'
        + '<path d="M' + (x - 1.5) + ' 84 l3 2 M' + (x - 1.5) + ' 90 l3 2 M' + (x - 1.5) + ' 96 l3 2" stroke="#64748b" stroke-width=".8"/>'
        + '<rect x="' + (x - 3) + '" y="78" width="6" height="3.4" rx="1.6" fill="#0f172a" opacity=".7"/>'
        + '<rect x="' + (x - 4.5) + '" y="56" width="9" height="15" rx="3.5" fill="' + cols[i] + '" stroke="#334155" stroke-width=".6" stroke-opacity=".35"/>';
    }
    F('endo-files',
      shF(80, 132, 52)
      + '<rect x="30" y="100" width="100" height="26" rx="7" fill="#bfdbfe" stroke="#60a5fa" stroke-width=".8"/>'
      + '<circle cx="42" cy="113" r="1.6" fill="#93c5fd"/><circle cx="58" cy="118" r="1.6" fill="#93c5fd"/><circle cx="74" cy="112" r="1.6" fill="#93c5fd"/><circle cx="92" cy="118" r="1.6" fill="#93c5fd"/><circle cx="108" cy="112" r="1.6" fill="#93c5fd"/><circle cx="120" cy="118" r="1.6" fill="#93c5fd"/>'
      + files);
  })();

  F('apex-locator',
    shF(78, 134, 46)
    + '<rect x="42" y="46" width="72" height="82" rx="10" fill="url(#slgWht)" stroke="#94a3b8" stroke-width="1"/>'
    + '<rect x="50" y="56" width="56" height="38" rx="4" fill="#0f172a"/>'
    + '<rect x="56" y="82" width="5" height="8" fill="#22c55e"/><rect x="63" y="78" width="5" height="12" fill="#22c55e"/><rect x="70" y="74" width="5" height="16" fill="#84cc16"/><rect x="77" y="70" width="5" height="20" fill="#eab308"/><rect x="84" y="66" width="5" height="24" fill="#f97316"/>'
    + '<path d="M96 62 C102 66 102 80 97 90" stroke="#38bdf8" stroke-width="2" fill="none"/>'
    + '<circle cx="56" cy="110" r="4.5" fill="#0d9488" stroke="#134e4a" stroke-width=".8"/><circle cx="70" cy="110" r="4.5" fill="#cbd5e1" stroke="#94a3b8" stroke-width=".8"/><rect x="82" y="105" width="22" height="10" rx="5" fill="#e2e8f0" stroke="#94a3b8" stroke-width=".8"/>'
    + '<path d="M114 84 C130 86 136 98 132 114" stroke="#475569" stroke-width="2.4" fill="none"/>'
    + '<path d="M129 112 q-4 8 3 11" stroke="#475569" stroke-width="2.2" fill="none"/>');

  F('endo-measuring-block',
    shF(80, 130, 52)
    + '<path d="M38 86 L52 68 L136 68 L122 86 Z" fill="url(#slgWht)" stroke="#94a3b8" stroke-width=".7"/>'
    + '<path d="M122 86 L136 68 L136 96 L122 114 Z" fill="#cbd5e1" stroke="#94a3b8" stroke-width=".7"/>'
    + '<path d="M38 86 L122 86 L122 114 Q122 118 118 118 L42 118 Q38 118 38 114 Z" fill="url(#slgGls)" stroke="#94a3b8" stroke-width=".8"/>'
    + '<path d="M46 88 v6 M54 88 v4 M62 88 v6 M70 88 v4 M78 88 v6 M86 88 v4 M94 88 v6 M102 88 v4 M110 88 v6" stroke="#475569" stroke-width=".9"/>'
    + '<path d="M66 72 l10 0 M86 72 l10 0" stroke="#334155" stroke-width="3" opacity=".7"/>'
    + '<g transform="rotate(-8 70 60)"><rect x="40" y="56" width="9" height="8" rx="3" fill="#3b82f6"/><line x1="49" y1="60" x2="98" y2="60" stroke="#94a3b8" stroke-width="1.4"/><rect x="66" y="57.5" width="5" height="5" rx="2.4" fill="#dc2626"/></g>');

  (function () {
    var cols = ['#dc2626', '#3b82f6', '#facc15', '#22c55e', '#f8fafc', '#0f172a'];
    var dots = '';
    for (var i = 0; i < 6; i++) {
      var a = i * Math.PI / 3, cx = (80 + Math.cos(a) * 17).toFixed(1), cy = (88 + Math.sin(a) * 17).toFixed(1);
      dots += '<circle cx="' + cx + '" cy="' + cy + '" r="5" fill="' + cols[i] + '" stroke="#334155" stroke-width=".6" stroke-opacity=".35"/><circle cx="' + cx + '" cy="' + cy + '" r="1" fill="#0f172a" opacity=".45"/>';
    }
    F('rubber-stoppers',
      shF(80, 128, 40)
      + '<circle cx="80" cy="88" r="36" fill="url(#slgWht)" stroke="#94a3b8" stroke-width="1"/>'
      + '<circle cx="80" cy="88" r="28" fill="#f1f5f9" stroke="#cbd5e1" stroke-width=".8"/>'
      + dots
      + '<circle cx="80" cy="88" r="5" fill="#e11d48" stroke="#334155" stroke-width=".6" stroke-opacity=".35"/><circle cx="80" cy="88" r="1" fill="#0f172a" opacity=".45"/>');
  })();

  (function () {
    function cones(fill, stroke) {
      var s = '', xs = [50, 65, 80, 95, 110], ys = [114, 109, 116, 110, 114], rot = [-7, 4, -2, 6, -5];
      for (var i = 0; i < 5; i++) {
        var x = xs[i], y = ys[i];
        s += '<g transform="rotate(' + rot[i] + ' ' + x + ' ' + y + ')">'
          + '<path d="M' + (x - 4.6) + ' ' + y + ' L' + (x - 0.7) + ' ' + (y - 64) + ' Q' + x + ' ' + (y - 66) + ' ' + (x + 0.7) + ' ' + (y - 64) + ' L' + (x + 4.6) + ' ' + y + ' Q' + x + ' ' + (y + 4) + ' ' + (x - 4.6) + ' ' + y + ' Z" fill="' + fill + '" stroke="' + stroke + '" stroke-width="1" stroke-linejoin="round"/>'
          + '<path d="M' + (x - 2.2) + ' ' + (y - 6) + ' L' + (x - 0.6) + ' ' + (y - 58) + '" stroke="#ffffff" stroke-width="1" opacity=".55"/>'
          + '</g>';
      }
      return s;
    }
    F('paper-points', shF(80, 126, 46) + cones('url(#slgPPt)', '#94a3b8'));
    F('gutta-percha', shF(80, 126, 46) + cones('url(#slgGP)', '#d95f55'));
  })();

  F('root-canal-sealer',
    shF(80, 126, 48)
    + '<g transform="rotate(-8 80 92)">'
    + '<path d="M36 78 L42 76 L42 106 L36 104 Z" fill="#cbd5e1" stroke="#94a3b8" stroke-width=".6"/>'
    + '<path d="M38 79 v25 M40 78.4 v26.4" stroke="#94a3b8" stroke-width=".7"/>'
    + '<path d="M42 76 L104 80 L104 102 L42 106 Z" fill="url(#slgWht)" stroke="#94a3b8" stroke-width=".8"/>'
    + '<path d="M58 77 L70 77.8 L70 104.6 L58 105.4 Z" fill="#0d9488" opacity=".85"/>'
    + '<path d="M104 82 L110 84 L110 98 L104 100 Z" fill="url(#slgWht)"/>'
    + '<rect x="110" y="82" width="14" height="18" rx="3" fill="url(#slgNvy)"/>'
    + '<path d="M113 84 v14 M117 84 v14 M121 84 v14" stroke="#334155" stroke-width=".8" opacity=".7"/>'
    + '</g>'
    + '<circle cx="128" cy="118" r="4" fill="#fef9c3" stroke="#eab308" stroke-width=".6"/>');

  F('cavit',
    shF(80, 130, 38)
    + '<rect x="52" y="76" width="56" height="46" rx="9" fill="url(#slgWht)" stroke="#94a3b8" stroke-width=".9"/>'
    + '<rect x="48" y="56" width="64" height="24" rx="9" fill="url(#slgTeal)" stroke="#0f766e" stroke-width=".9"/>'
    + '<path d="M54 58 v20 M62 57 v22 M70 56.5 v23 M78 56.5 v23 M86 56.5 v23 M94 57 v22 M102 58 v20" stroke="#0f766e" stroke-width=".8" opacity=".5"/>'
    + '<rect x="52" y="88" width="56" height="20" fill="#f0fdfa" opacity=".95"/>'
    + '<rect x="58" y="93" width="34" height="2.8" rx="1.4" fill="#94a3b8"/><rect x="58" y="99" width="26" height="2.8" rx="1.4" fill="#cbd5e1"/>');

  F('sutures',
    shF(80, 126, 50)
    + '<g transform="rotate(-6 80 84)">'
    + '<rect x="34" y="50" width="92" height="66" rx="7" fill="#fbfcfe" stroke="#aab6c4" stroke-width="1.1"/>'
    + '<rect x="34" y="50" width="92" height="15" rx="7" fill="#0d9488"/><rect x="34" y="59" width="92" height="6" fill="#0f766e"/>'
    + '<path d="M118 52 L124 58 L124 52 Z" fill="#f0fdfa"/>'
    + '<rect x="42" y="70" width="76" height="40" rx="5" fill="#eef4fa" stroke="#c4d2de" stroke-width=".8"/>'
    + '<circle cx="72" cy="90" r="13" fill="none" stroke="#3730a3" stroke-width="1.7"/><circle cx="72" cy="90" r="9" fill="none" stroke="#3730a3" stroke-width="1.5" opacity=".8"/>'
    + '<path d="M96 80 A11 11 0 1 1 88 101" fill="none" stroke="#5b6779" stroke-width="3" stroke-linecap="round"/>'
    + '<path d="M88 101 L84.5 104.5" stroke="#475569" stroke-width="1.6" stroke-linecap="round"/>'
    + '<path d="M97 79 A11 11 0 0 1 101 87" fill="none" stroke="#eef2f7" stroke-width="1" opacity=".9"/>'
    + '</g>');

  F('cheek-retractor',
    shF(80, 126, 52)
    + '<path d="M54 44 C32 50 26 78 32 96 C36 108 44 116 54 118 C60 112 61 98 59 82 C57.5 68 56 52 54 44 Z" fill="#cfe4fb" opacity=".85" stroke="#5da2ee" stroke-width="1.3"/>'
    + '<path d="M52 52 C40 58 36 78 40 94 C43 104 48 110 53 112" fill="none" stroke="#ffffff" stroke-width="2" opacity=".85"/>'
    + '<path d="M54 46 C60 60 61 100 55 116" fill="none" stroke="#5da2ee" stroke-width="1" opacity=".6"/>'
    + '<g transform="matrix(-1 0 0 1 160 0)"><path d="M54 44 C32 50 26 78 32 96 C36 108 44 116 54 118 C60 112 61 98 59 82 C57.5 68 56 52 54 44 Z" fill="#bcd8f6" opacity=".85" stroke="#5da2ee" stroke-width="1.3"/><path d="M54 46 C60 60 61 100 55 116" fill="none" stroke="#5da2ee" stroke-width="1" opacity=".6"/></g>'
    + '<path d="M58 76 Q80 70 102 76 L102 88 Q80 82 58 88 Z" fill="#cfe4fb" opacity=".8" stroke="#5da2ee" stroke-width="1.2"/>');

  /* ---------- shared paint-server host ----------
     url(#id) references resolve document-wide to the FIRST element with that
     id. If that first copy sits inside a hidden (display:none) container the
     browser won't paint with it, so every icon on the page goes flat. Pin one
     always-renderable copy of the defs at the very top of <body>; each icon
     string still embeds its own defs so detached/standalone use keeps working. */
  function ensureSharedDefs() {
    try {
      var d = g.document;
      if (!d || d.getElementById('sl-art-defs')) return;
      var b = d.body || d.documentElement;
      if (!b) return;
      var host = d.createElement('span');
      host.id = 'sl-art-defs';
      host.setAttribute('aria-hidden', 'true');
      host.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
      host.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" focusable="false">' + DEFS + '</svg>';
      b.insertBefore(host, b.firstChild);
    } catch (e) { /* non-DOM environment: embedded defs still apply */ }
  }
  ensureSharedDefs();

  /* ---------- public API ---------- */
  function idOf(x) { return (typeof x === 'string') ? x : (x && x.id); }
  function wrap(a, o) {
    o = o || {};
    var vb = (o.crop && a.k === 'long') ? a.crop : (a.k === 'long' ? '0 0 64 260' : '0 0 160 160');
    var attrs = '';
    if (o.w) attrs += ' width="' + o.w + '"';
    if (o.h) attrs += ' height="' + o.h + '"';
    if (o.className) attrs += ' class="' + String(o.className).replace(/["<>]/g, '') + '"';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + vb + '"' + attrs + ' role="img" aria-hidden="true" focusable="false">' + DEFS + a.b + '</svg>';
  }
  g.SL_ART = {
    has: function (id) { return !!ART[idOf(id)]; },
    kindOf: function (id) { var a = ART[idOf(id)]; return a ? a.k : 'flat'; },
    svg: function (id, opts) { var a = ART[idOf(id)]; if (!a) return ''; ensureSharedDefs(); return wrap(a, opts); },
    ids: function () { var out = [], k; for (k in ART) out.push(k); return out; }
  };

  /* Thumb-size override: crop long instruments to the working end so a 28-56px
     box shows the business end, not a full-length sliver. */
  var prevIconFor = g.SL_ICON_FOR;
  g.SL_ICON_FOR = function (item) {
    var id = item && item.id, a = id && ART[id];
    if (a) {
      ensureSharedDefs();
      var vb = (a.k === 'long') ? a.crop : '0 0 160 160';
      return '<span style="display:inline-flex;align-items:center;justify-content:center;width:100%;height:100%">'
        + '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + vb + '" width="34" height="34" style="width:100%;height:100%;max-width:56px;max-height:56px" preserveAspectRatio="xMidYMid meet" role="img" aria-hidden="true" focusable="false">' + DEFS + a.b + '</svg></span>';
    }
    if (typeof prevIconFor === 'function') return prevIconFor(item);
    var e = (item && item.emoji) || '🦷';
    return '<span style="font-size:22px;line-height:1">' + e + '</span>';
  };
})(window);
