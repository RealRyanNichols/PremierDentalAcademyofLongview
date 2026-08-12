/*!
 * Premier Dental Academy — tray setup grading.
 *
 * Grades a student's tray against the four arrangement conventions a real office uses, held in
 * assets/skills-lab/trays-data.js:
 *   1. Instruments run left to right in order of use.
 *   2. Cotton products and gauze go across the top.
 *   3. Hinged instruments group at the right-hand end.
 *   4. Instruments are grouped by function.
 *
 * The grading is per-rule rather than a single percentage, because "you scored 68%" tells a
 * student nothing they can act on, whereas "your cotton is in the instrument row" does.
 *
 * Order is scored on RELATIVE position, not absolute index. A tray that is correct apart from
 * one missing item should not be marked wrong from that point on — that would punish one
 * mistake nine times over.
 */
(function () {
  'use strict';

  // Longest increasing subsequence over the expected positions. The items in it are the ones
  // in a correct relative order; everything else is what actually needs moving.
  function longestInOrder(positions) {
    if (!positions.length) return [];
    var tails = [], prev = new Array(positions.length).fill(-1), idxs = [];
    for (var i = 0; i < positions.length; i++) {
      var lo = 0, hi = tails.length;
      while (lo < hi) {
        var mid = (lo + hi) >> 1;
        if (positions[idxs[tails[mid]]] < positions[i]) lo = mid + 1; else hi = mid;
      }
      prev[i] = lo > 0 ? tails[lo - 1] : -1;
      idxs[i] = i;
      if (lo === tails.length) tails.push(i); else tails[lo] = i;
    }
    var out = [], k = tails[tails.length - 1];
    while (k !== -1 && k !== undefined) { out.push(k); k = prev[k]; }
    return out.reverse();
  }

  /**
   * @param {Object} cfg
   *   setup       the tray setup being attempted
   *   placedIds   the student's instrument row, left to right
   *   topIds      what the student put across the top of the tray
   *   instruments the full instrument list, for category lookups
   * @returns {{results:Array, missing:Array, extra:Array, passed:number, total:number}}
   */
  function grade(cfg) {
    var setup = cfg.setup || {};
    var placed = (cfg.placedIds || []).slice();
    var top = (cfg.topIds || []).slice();
    var byId = {};
    (cfg.instruments || []).forEach(function (i) { byId[i.id] = i; });

    var expectedSeq = (setup.sequence || setup.instrumentIds || []).slice();
    var required = (setup.instrumentIds || []).slice();
    var chosen = placed.concat(top);

    var isCotton = function (id) {
      var it = byId[id];
      var name = ((it && it.name) || id).toLowerCase();
      return /cotton|gauze|dri-?aid|pellet|roll/.test(name);
    };
    var isHinged = function (id) {
      var it = byId[id];
      var name = ((it && it.name) || id).toLowerCase();
      return /forcep|scissor|needle holder|hemostat|plier|elevator forcep|rongeur/.test(name);
    };

    var missing = required.filter(function (id) { return chosen.indexOf(id) === -1; });
    var extra = chosen.filter(function (id) { return required.indexOf(id) === -1; });

    var results = [];

    /* 1. Order of use ─────────────────────────────────────────────────────── */
    var sequenced = placed.filter(function (id) { return expectedSeq.indexOf(id) !== -1; });
    var positions = sequenced.map(function (id) { return expectedSeq.indexOf(id); });
    var inOrder = longestInOrder(positions);
    var outOfOrder = sequenced.filter(function (_, i) { return inOrder.indexOf(i) === -1; });
    results.push({
      id: 'order-of-use',
      ok: outOfOrder.length === 0 && sequenced.length > 0,
      detail: !sequenced.length
        ? 'Nothing placed in the instrument row yet.'
        : outOfOrder.length === 0
          ? 'Everything in the row runs in the order it gets used.'
          : outOfOrder.length + ' item' + (outOfOrder.length === 1 ? '' : 's') + ' out of sequence: ' +
            outOfOrder.map(function (id) { return (byId[id] && byId[id].name) || id; }).join(', ') + '.',
      offenders: outOfOrder
    });

    /* 2. Cotton across the top ────────────────────────────────────────────── */
    var cottonInRow = placed.filter(isCotton);
    var cottonUp = top.filter(isCotton);
    results.push({
      id: 'cotton-top',
      ok: cottonInRow.length === 0 && cottonUp.length > 0,
      detail: cottonInRow.length
        ? 'These belong across the top, not in the instrument row: ' +
          cottonInRow.map(function (id) { return (byId[id] && byId[id].name) || id; }).join(', ') + '.'
        : cottonUp.length
          ? 'Cotton products are across the top where they belong.'
          : 'No cotton products placed on the top of the tray yet.',
      offenders: cottonInRow
    });

    /* 3. Hinged instruments at the right ──────────────────────────────────── */
    var hinged = placed.filter(isHinged);
    var lastNonHinged = -1;
    placed.forEach(function (id, i) { if (!isHinged(id)) lastNonHinged = i; });
    var hingedTooEarly = placed.filter(function (id, i) { return isHinged(id) && i < lastNonHinged; });
    results.push({
      id: 'hinged-right',
      ok: hinged.length === 0 || hingedTooEarly.length === 0,
      detail: !hinged.length
        ? 'No hinged instruments on this tray, so nothing to group.'
        : hingedTooEarly.length === 0
          ? 'Hinged instruments are grouped at the right-hand end.'
          : 'These are hinged and belong at the right-hand end: ' +
            hingedTooEarly.map(function (id) { return (byId[id] && byId[id].name) || id; }).join(', ') + '.',
      offenders: hingedTooEarly
    });

    /* 4. Grouped by function ──────────────────────────────────────────────── */
    // A group is "broken" when its category reappears after a different one has intervened.
    var seenRuns = [], lastCat = null, broken = [];
    placed.forEach(function (id) {
      var cat = (byId[id] && byId[id].category) || 'other';
      if (cat !== lastCat) {
        if (seenRuns.indexOf(cat) !== -1 && broken.indexOf(cat) === -1) broken.push(cat);
        seenRuns.push(cat);
        lastCat = cat;
      }
    });
    results.push({
      id: 'group-by-function',
      ok: broken.length === 0 && placed.length > 0,
      detail: !placed.length
        ? 'Nothing placed yet.'
        : broken.length === 0
          ? 'Instruments of the same kind are kept together.'
          : broken.length + ' group' + (broken.length === 1 ? ' is' : 's are') + ' split up and scattered across the tray rather than kept together.',
      offenders: []
    });

    return {
      results: results,
      missing: missing,
      extra: extra,
      passed: results.filter(function (r) { return r.ok; }).length,
      total: results.length
    };
  }

  var API = { grade: grade, longestInOrder: longestInOrder };

  if (typeof window !== 'undefined') window.SL_TRAY_GRADER = API;
  else globalThis.SL_TRAY_GRADER = API;
})();
