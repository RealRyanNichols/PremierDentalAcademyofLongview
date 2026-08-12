/*!
 * Premier Dental Academy — RDA practice exam engine.
 *
 * Two modes, because they teach different things:
 *   learn — answer, see immediately whether it was right and why. Building knowledge.
 *   timed — no feedback until the end, with a clock. Rehearsing exam conditions.
 *
 * Scoring reports a raw count and a per-domain breakdown, and deliberately does NOT convert
 * that into a pass/fail or a predicted result. DANB reports a scaled score (400 to pass, on a
 * 100–900 scale), which is not a percent correct and cannot be derived from one — so telling a
 * student "you would have passed" would be inventing a number. The per-domain breakdown is the
 * genuinely useful output: it says where the next hour of study should go.
 *
 * Pinned by scripts/test/exam-engine.test.mjs.
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

  /** True when the bank has not been signed off by the school owner yet. */
  function isDraft(banks) {
    return !banks || !banks.reviewStatus || /^\s*DRAFT/i.test(String(banks.reviewStatus));
  }

  function allQuestions(banks) {
    if (!banks || !banks.BANKS) return [];
    return banks.BANKS.reduce(function (out, b) {
      b.questions.forEach(function (q) { out.push(q); });
      return out;
    }, []);
  }

  /**
   * @param {Object} cfg  { banks, bankId?, domains?, length?, shuffleQuestions? }
   */
  function buildExam(cfg) {
    cfg = cfg || {};
    var pool = allQuestions(cfg.banks);
    if (cfg.bankId) {
      var bank = (cfg.banks.BANKS || []).filter(function (b) { return b.id === cfg.bankId; })[0];
      pool = bank ? bank.questions.slice() : [];
    }
    if (cfg.domains && cfg.domains.length) {
      pool = pool.filter(function (q) { return cfg.domains.indexOf(q.domain) !== -1; });
    }
    if (cfg.shuffleQuestions !== false) pool = shuffle(pool);
    if (cfg.length > 0) pool = pool.slice(0, cfg.length);
    return pool;
  }

  /**
   * @param {Array} questions
   * @param {Object} answers  { [questionId]: chosenIndex }
   * @returns {{correct, answered, total, unanswered, byDomain, weakest, results}}
   */
  function score(questions, answers) {
    questions = questions || [];
    answers = answers || {};
    var byDomain = {};
    var correct = 0, answered = 0;

    var results = questions.map(function (q) {
      var chosen = answers[q.id];
      var didAnswer = chosen !== undefined && chosen !== null;
      var isRight = didAnswer && chosen === q.answer;
      if (didAnswer) answered++;
      if (isRight) correct++;

      var d = byDomain[q.domain] = byDomain[q.domain] || { correct: 0, total: 0 };
      d.total++;
      if (isRight) d.correct++;

      return { question: q, chosen: didAnswer ? chosen : null, correct: isRight, answered: didAnswer };
    });

    var weakest = Object.keys(byDomain)
      .map(function (k) {
        var d = byDomain[k];
        return { domain: k, correct: d.correct, total: d.total,
                 pct: d.total ? Math.round(d.correct / d.total * 100) : 0 };
      })
      .sort(function (a, b) { return a.pct - b.pct || b.total - a.total; });

    return {
      correct: correct,
      answered: answered,
      total: questions.length,
      unanswered: questions.length - answered,
      byDomain: byDomain,
      weakest: weakest,
      results: results
    };
  }

  /** The domains worth drilling next: below the cut, weakest first. */
  function weakAreas(scored, threshold) {
    var cut = typeof threshold === 'number' ? threshold : 70;
    return (scored.weakest || []).filter(function (d) { return d.pct < cut; });
  }

  function formatClock(seconds) {
    var n = typeof seconds === 'number' ? seconds : parseFloat(seconds);
    // A clock is on screen throughout a timed exam. If the input is ever NaN — a dropped
    // timestamp, a paused tab — showing "NaN:NaN" to somebody mid-exam is alarming and useless,
    // so it falls back to zero.
    var s = isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
    var m = Math.floor(s / 60);
    var r = s % 60;
    return m + ':' + (r < 10 ? '0' : '') + r;
  }

  var API = {
    isDraft: isDraft, allQuestions: allQuestions, buildExam: buildExam,
    score: score, weakAreas: weakAreas, formatClock: formatClock, shuffle: shuffle
  };

  if (typeof window !== 'undefined') window.PDA_EXAM = API;
  else globalThis.PDA_EXAM = API;
})();
