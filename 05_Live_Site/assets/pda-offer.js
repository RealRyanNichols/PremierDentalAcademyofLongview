/* PDA — the approved offer, defined once.
 *
 * Owner: Amanda. Approved October 3, 2026.
 *
 *   In-person RDA program, about 12 weeks, Longview.
 *   Pay in full:    $3,000
 *   Payment plan:   $3,500 total = $500 down + $3,000 balance
 *   No grants, vouchers, or any other free / funded enrollment option,
 *   and no financing beyond the payment plan.
 *
 * Pages that render tuition from JavaScript (classes, calendar, enroll,
 * the Ask Premier chatbot) read these values. Static copy on index.html,
 * enroll.html and apply.html must match; run `python3 scripts/check_offer.py`
 * after any change here — it fails if stale prices or funding wording are
 * found anywhere on the public site.
 */
(function () {
  'use strict';
  const fmt = (n) => '$' + Number(n).toLocaleString('en-US');

  const plan = { down: 500, balance: 3000 };
  plan.total = plan.down + plan.balance; // 3,500 — derived, never typed twice

  window.PDA_OFFER = Object.freeze({
    programName: 'In-person RDA program',
    durationWeeks: 12,
    durationLabel: '12 weeks',
    payInFull: 3000,
    plan: Object.freeze(plan),
    fundingOffered: false,
    fmt,
  });
})();
