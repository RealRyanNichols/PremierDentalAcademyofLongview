/*!
 * Premier Dental Academy — the 168-hour week reality check.
 *
 * Pure arithmetic, no DOM. Everyone gets 168 hours a week. This adds up what is already spoken
 * for and shows what is genuinely left, so somebody can decide whether class fits before they
 * pay for it rather than after. Pinned by scripts/test/hours-check.test.mjs.
 */
(function () {
  'use strict';

  var HOURS_IN_A_WEEK = 168;

  // Order matters: this is the order the answer is read back in.
  var FIELDS = [
    { key: 'work',      label: 'Paid work',                per: 'week',  hint: 'Hours on the clock, including any second job.' },
    { key: 'sleep',     label: 'Sleep',                    per: 'night', hint: 'Per night — we multiply by 7.' },
    { key: 'care',      label: 'Caring for someone',       per: 'week',  hint: 'Children, a parent, anyone who depends on you.' },
    { key: 'commute',   label: 'Commuting',                per: 'week',  hint: 'To work and back, plus school runs.' },
    { key: 'classTime', label: 'Class',                    per: 'week',  hint: 'Time in the room at the campus.' },
    { key: 'study',     label: 'Studying',                 per: 'week',  hint: 'Homework and revision outside class.' },
    { key: 'household', label: 'Household & everything else', per: 'week', hint: 'Cooking, cleaning, errands, appointments.' }
  ];

  var n = function (v) {
    var x = typeof v === 'number' ? v : parseFloat(v);
    return isFinite(x) && x > 0 ? x : 0;
  };

  /**
   * @returns {{committed, left, overCommitted, rows:Array, sleepPerWeek}}
   */
  function weeklyHours(input) {
    input = input || {};
    var sleepPerWeek = n(input.sleep) * 7;

    var rows = FIELDS.map(function (f) {
      return { key: f.key, label: f.label, hours: f.key === 'sleep' ? sleepPerWeek : n(input[f.key]) };
    });

    var committed = rows.reduce(function (sum, r) { return sum + r.hours; }, 0);
    var left = HOURS_IN_A_WEEK - committed;

    return {
      committed: committed,
      left: left,
      overCommitted: left < 0,
      sleepPerWeek: sleepPerWeek,
      rows: rows.filter(function (r) { return r.hours > 0; })
    };
  }

  /** A plain-language read of the result. No judgement, no scare tactics — just the arithmetic. */
  function verdict(result) {
    if (!result) return '';
    if (result.overCommitted) {
      return 'That adds up to more than a week holds. Something has to give before class starts — ' +
             'usually hours at work, or help with the childcare. Worth a conversation: (903) 913-6444.';
    }
    if (result.left < 7) {
      return 'That leaves under an hour a day unaccounted for. It is doable, but there is no slack ' +
             'in it for a sick child or a car that will not start. Plan for that now, not in week six.';
    }
    if (result.left < 21) {
      return 'That is tight but workable. Students who make this work usually protect one fixed ' +
             'study block a week and treat it like a shift they cannot miss.';
    }
    return 'There is real room in that week. Put the study time in the calendar before something ' +
           'else claims it.';
  }

  var API = { HOURS_IN_A_WEEK: HOURS_IN_A_WEEK, FIELDS: FIELDS, weeklyHours: weeklyHours, verdict: verdict };

  if (typeof window !== 'undefined') window.PDA_HOURS = API;
  else globalThis.PDA_HOURS = API;
})();
