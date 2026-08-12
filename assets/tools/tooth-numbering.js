/*!
 * Premier Dental Academy — tooth numbering systems: Universal, Palmer and FDI.
 *
 * Three systems name the same tooth three different ways, and a dental assistant reads all
 * three: Universal on most US charts, FDI on anything international or academic, Palmer on
 * orthodontic and oral-surgery notes. Getting them confused means charting the wrong tooth.
 *
 * The mapping is arithmetic, not a lookup table, so there is nowhere for a typo to hide:
 *
 *   Universal  permanent teeth 1–32, starting at the upper right third molar (1), running
 *              left across the top to 16, dropping to the lower left third molar (17), and
 *              running back to the lower right third molar (32). Primary teeth are A–T on
 *              the same path.
 *   Palmer     a quadrant bracket plus 1–8 counting OUT from the midline. Primary is A–E.
 *   FDI/ISO    two digits: quadrant then position from the midline. Permanent quadrants are
 *              1 upper right, 2 upper left, 3 lower left, 4 lower right; primary uses 5–8 in
 *              the same order. (ISO 3950.)
 *
 * Pinned by scripts/test/tooth-numbering.test.mjs against the anchor teeth in every quadrant.
 */
(function () {
  'use strict';

  var QUADRANTS = [
    { id: 'UR', name: 'Upper right', arch: 'Maxillary', side: 'right', fdiPerm: 1, fdiPrim: 5 },
    { id: 'UL', name: 'Upper left',  arch: 'Maxillary', side: 'left',  fdiPerm: 2, fdiPrim: 6 },
    { id: 'LL', name: 'Lower left',  arch: 'Mandibular', side: 'left',  fdiPerm: 3, fdiPrim: 7 },
    { id: 'LR', name: 'Lower right', arch: 'Mandibular', side: 'right', fdiPerm: 4, fdiPrim: 8 }
  ];

  // Position out from the midline → tooth name. Same for every quadrant.
  var PERM_NAMES = ['Central incisor', 'Lateral incisor', 'Canine', 'First premolar',
                    'Second premolar', 'First molar', 'Second molar', 'Third molar'];
  var PRIM_NAMES = ['Central incisor', 'Lateral incisor', 'Canine', 'First molar', 'Second molar'];

  var PRIMARY_LETTERS = 'ABCDEFGHIJKLMNOPQRST'.split('');

  /**
   * Permanent tooth from its Universal number (1–32).
   * @returns {{universal, palmer, palmerQuadrant, fdi, quadrant, name, position, dentition}|null}
   */
  function permanent(universal) {
    var n = parseInt(universal, 10);
    if (!(n >= 1 && n <= 32)) return null;

    var qIndex = Math.floor((n - 1) / 8);            // 0..3 → UR, UL, LL, LR
    var q = QUADRANTS[qIndex];
    var withinQuadrant = ((n - 1) % 8) + 1;          // 1..8 along the Universal path

    // Universal runs midline-outward in the UL and LR quadrants, and outward-to-midline in
    // UR and LL. Palmer and FDI always count OUT from the midline, so two of the four flip.
    var position = (q.id === 'UR' || q.id === 'LL') ? 9 - withinQuadrant : withinQuadrant;

    return {
      dentition: 'permanent',
      universal: String(n),
      quadrant: q,
      position: position,
      name: PERM_NAMES[position - 1],
      palmer: q.id + position,
      palmerQuadrant: q.id,
      fdi: String(q.fdiPerm) + String(position)
    };
  }

  /** Primary tooth from its Universal letter (A–T). */
  function primary(letter) {
    var L = String(letter || '').trim().toUpperCase();
    var i = PRIMARY_LETTERS.indexOf(L);
    if (i === -1) return null;

    var qIndex = Math.floor(i / 5);
    var q = QUADRANTS[qIndex];
    var withinQuadrant = (i % 5) + 1;
    var position = (q.id === 'UR' || q.id === 'LL') ? 6 - withinQuadrant : withinQuadrant;

    return {
      dentition: 'primary',
      universal: L,
      quadrant: q,
      position: position,
      name: PRIM_NAMES[position - 1],
      palmer: q.id + PRIMARY_LETTERS[position - 1],
      palmerQuadrant: q.id,
      fdi: String(q.fdiPrim) + String(position)
    };
  }

  /** Accepts a Universal number/letter, an FDI code, or a Palmer string. */
  function lookup(input) {
    var s = String(input || '').trim().toUpperCase().replace(/\s+/g, '');
    if (!s) return null;

    if (/^\d{1,2}$/.test(s)) {
      var n = parseInt(s, 10);
      // Two digits in FDI range that are NOT a valid Universal number can only be FDI.
      if (n >= 1 && n <= 32) return permanent(n);
      return fromFdi(s);
    }
    if (/^[A-T]$/.test(s)) return primary(s);
    if (/^(UR|UL|LL|LR)([1-8]|[A-E])$/.test(s)) {
      var q = s.slice(0, 2), rest = s.slice(2);
      return /^[1-8]$/.test(rest) ? fromQuadrantPosition(q, parseInt(rest, 10), 'permanent')
                                  : fromQuadrantPosition(q, PRIMARY_LETTERS.indexOf(rest) + 1, 'primary');
    }
    return null;
  }

  function fromFdi(code) {
    var s = String(code || '').trim();
    if (!/^[1-8][1-8]$/.test(s)) return null;
    var qDigit = parseInt(s[0], 10), position = parseInt(s[1], 10);
    var q = QUADRANTS.filter(function (x) { return x.fdiPerm === qDigit || x.fdiPrim === qDigit; })[0];
    if (!q) return null;
    var isPrimary = qDigit >= 5;
    if (isPrimary && position > 5) return null;
    return fromQuadrantPosition(q.id, position, isPrimary ? 'primary' : 'permanent');
  }

  function fromQuadrantPosition(quadrantId, position, dentition) {
    var qIndex = QUADRANTS.map(function (q) { return q.id; }).indexOf(quadrantId);
    if (qIndex === -1) return null;
    var q = QUADRANTS[qIndex];
    if (dentition === 'primary') {
      if (!(position >= 1 && position <= 5)) return null;
      var pWithin = (q.id === 'UR' || q.id === 'LL') ? 6 - position : position;
      return primary(PRIMARY_LETTERS[qIndex * 5 + pWithin - 1]);
    }
    if (!(position >= 1 && position <= 8)) return null;
    var within = (q.id === 'UR' || q.id === 'LL') ? 9 - position : position;
    return permanent(qIndex * 8 + within);
  }

  function allPermanent() {
    var out = [];
    for (var i = 1; i <= 32; i++) out.push(permanent(i));
    return out;
  }

  function allPrimary() {
    return PRIMARY_LETTERS.map(primary);
  }

  var API = {
    QUADRANTS: QUADRANTS, PERM_NAMES: PERM_NAMES, PRIM_NAMES: PRIM_NAMES,
    permanent: permanent, primary: primary, lookup: lookup, fromFdi: fromFdi,
    fromQuadrantPosition: fromQuadrantPosition, allPermanent: allPermanent, allPrimary: allPrimary
  };

  if (typeof window !== 'undefined') window.PDA_TEETH = API;
  else globalThis.PDA_TEETH = API;
})();
