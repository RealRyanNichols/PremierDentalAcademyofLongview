/*!
 * Premier Dental Academy — real cost of training, and how long it takes to earn back.
 *
 * Pure calculation, no DOM. The page imports this and so does scripts/test/cost-of-training.test.mjs,
 * which pins the arithmetic to hand-verified fixtures — the numbers here decide whether someone
 * can afford to retrain, so they are not allowed to drift quietly.
 *
 * The honest part of this tool is that it counts the costs a tuition page leaves out: the wages
 * you give up by cutting hours, the fuel to get to class, and the childcare while you are there.
 */
(function () {
  'use strict';

  // Weeks per month, averaged over a year. 52/12, not 4 — using 4 understates monthly pay by 8%.
  var WEEKS_PER_MONTH = 52 / 12;

  var n = function (v) {
    var x = typeof v === 'number' ? v : parseFloat(v);
    return isFinite(x) && x > 0 ? x : 0;
  };

  /**
   * What the training actually costs, all in.
   * @returns {{tuition,fees,lostWages,fuel,childcare,total,breakdown:Array}}
   */
  function totalCost(input) {
    input = input || {};
    var weeks = n(input.weeks);

    var tuition = n(input.tuition);
    var fees = n(input.fees);
    var lostWages = n(input.currentWage) * n(input.hoursLostPerWeek) * weeks;

    // Fuel: a round trip burns (miles / mpg) gallons. Zero mpg means "I don't know" or an EV —
    // either way, dividing by it would produce Infinity, so it contributes nothing.
    var mpg = n(input.mpg);
    var gallonsPerTrip = mpg > 0 ? n(input.roundTripMiles) / mpg : 0;
    var fuel = gallonsPerTrip * n(input.gasPrice) * n(input.daysPerWeek) * weeks;

    var childcare = n(input.childcareHoursPerWeek) * n(input.childcareRate) * weeks;

    var total = tuition + fees + lostWages + fuel + childcare;

    return {
      tuition: tuition, fees: fees, lostWages: lostWages, fuel: fuel, childcare: childcare,
      total: total,
      breakdown: [
        { label: 'Tuition', amount: tuition },
        { label: 'Books, scrubs & exam fees', amount: fees },
        { label: 'Wages you give up', amount: lostWages },
        { label: 'Fuel to get to class', amount: fuel },
        { label: 'Childcare during class', amount: childcare }
      ].filter(function (r) { return r.amount > 0; })
    };
  }

  /**
   * How long the training takes to pay for itself.
   *
   * Returns paysBack:false when the new job would not pay more than the current one. A payback
   * period is meaningless there, and printing a negative or enormous number would be worse than
   * saying so plainly — so the caller gets an explicit reason string to show instead.
   */
  function payback(input, cost) {
    input = input || {};
    var currentMonthly = n(input.currentWage) * n(input.currentHoursPerWeek) * WEEKS_PER_MONTH;
    var newMonthly = n(input.newWage) * n(input.newHoursPerWeek) * WEEKS_PER_MONTH;
    var monthlyGain = newMonthly - currentMonthly;
    var total = cost && isFinite(cost.total) ? cost.total : totalCost(input).total;

    if (!(newMonthly > 0)) {
      return { paysBack: false, monthlyGain: 0, months: null,
        reason: 'Add the pay you expect afterwards and we\'ll work out how long it takes to earn back.' };
    }
    if (monthlyGain <= 0) {
      return { paysBack: false, monthlyGain: monthlyGain, months: null,
        reason: 'At those numbers the new job would not pay more than what you earn now, so there is nothing to earn back. Try a different wage or a full-time schedule.' };
    }

    return {
      paysBack: true,
      monthlyGain: monthlyGain,
      months: total / monthlyGain,
      currentMonthly: currentMonthly,
      newMonthly: newMonthly
    };
  }

  function money(v) {
    if (!isFinite(v)) return '$0';
    return '$' + Math.round(v).toLocaleString('en-US');
  }

  function months(v) {
    if (v === null || !isFinite(v)) return '—';
    return (Math.round(v * 10) / 10).toFixed(1);
  }

  var API = { totalCost: totalCost, payback: payback, money: money, months: months,
              WEEKS_PER_MONTH: WEEKS_PER_MONTH };

  if (typeof window !== 'undefined') window.PDA_COST = API;
  else globalThis.PDA_COST = API;
})();
