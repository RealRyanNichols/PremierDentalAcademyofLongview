/*!
 * Premier Dental Academy — shared drill engine for the Skills Lab.
 *
 * Three of the reference pages needed the same thing: take a list of items, show them one at a
 * time, ask the student to recall or identify, and keep score. Rather than write that three
 * times with three subtly different bugs, it lives here.
 *
 * Modes:
 *   flip   — show the prompt, reveal the answer, self-mark. Good for first exposure.
 *   recall — type the answer, get marked automatically. Harder, and the one that makes it stick.
 *   quiz   — four options, pick one. Closest to how a written exam asks.
 *
 * Deliberately NOT here: any claim about how ready a student is. It reports what they got right
 * out of what they attempted, which is a fact, and leaves the interpretation alone.
 */
(function () {
  'use strict';

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  // Forgiving comparison for recall mode. Somebody who types "mesio-occlusal" when the answer is
  // "Mesio-occlusal" knows the answer; failing them on capitalisation teaches nothing.
  function normalise(s) {
    return String(s || '')
      .toLowerCase()
      .replace(/[‐-―]/g, '-')   // any dash → hyphen
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  function matches(given, expected) {
    var g = normalise(given), e = normalise(expected);
    if (!g) return false;
    if (g === e) return true;
    // Accept the answer without a bracketed aside, e.g. "Plaque (biofilm)" → "plaque".
    var stripped = normalise(String(expected).replace(/\([^)]*\)/g, ''));
    return stripped.length > 2 && g === stripped;
  }

  /**
   * @param {Object} cfg
   *   items      [{ prompt, answer, detail, group }]
   *   mode       'flip' | 'recall' | 'quiz'
   *   length     how many to ask (0 = all)
   *   distractorsFrom  optional pool for quiz options; defaults to items
   */
  function build(cfg) {
    var items = shuffle(cfg.items || []);
    if (cfg.length > 0) items = items.slice(0, cfg.length);
    var pool = cfg.distractorsFrom || cfg.items || [];

    return items.map(function (it) {
      var q = { prompt: it.prompt, answer: it.answer, detail: it.detail || '', group: it.group || '' };
      if (cfg.mode === 'quiz') {
        // Prefer distractors from the same group — an instrument confused with another
        // instrument in its own family is the confusion actually worth drilling.
        var sameGroup = pool.filter(function (p) { return p.group === it.group && p.answer !== it.answer; });
        var others = pool.filter(function (p) { return p.answer !== it.answer; });
        var picks = shuffle(sameGroup.length >= 3 ? sameGroup : others).slice(0, 3);
        q.options = shuffle(picks.map(function (p) { return p.answer; }).concat([it.answer]));
        q.correctIndex = q.options.indexOf(it.answer);
      }
      return q;
    });
  }

  /** Running score. Attempted is what they answered, not what was in the deck. */
  function newScore() {
    return {
      right: 0, wrong: 0,
      byGroup: {},
      record: function (group, correct) {
        if (correct) this.right++; else this.wrong++;
        var g = this.byGroup[group] = this.byGroup[group] || { right: 0, total: 0 };
        g.total++; if (correct) g.right++;
      },
      attempted: function () { return this.right + this.wrong; },
      // Per-group results, weakest first — that ordering IS the study advice.
      weakest: function () {
        var self = this;
        return Object.keys(this.byGroup)
          .map(function (k) {
            var g = self.byGroup[k];
            return { group: k, right: g.right, total: g.total, pct: g.total ? Math.round(g.right / g.total * 100) : 0 };
          })
          .sort(function (a, b) { return a.pct - b.pct || b.total - a.total; });
      }
    };
  }

  var API = { shuffle: shuffle, normalise: normalise, matches: matches, build: build, newScore: newScore };

  if (typeof window !== 'undefined') window.SL_DRILL = API;
  else globalThis.SL_DRILL = API;
})();
