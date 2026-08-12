// Cost-of-training arithmetic, pinned to hand-verified fixtures.
//
// These numbers decide whether somebody believes they can afford to retrain. If the maths drifts,
// the tool lies to people about their own money — so the fixture below is checked to the cent and
// the edge cases assert that the tool says "I can't tell you that" rather than printing nonsense.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const win = {};
new Function("window", readFileSync(join(root, "assets/tools/cost-of-training.js"), "utf8"))(win);
const { totalCost, payback, money, months } = win.PDA_COST;

// The hand-verified case: 12 weeks of training, cutting 10 hours a week off a $15/hr job,
// a 24-mile round trip three days a week at 24 mpg and $2.99 a gallon, 9 hours of childcare
// a week at $8/hr, coming out to a $20/hr job at the same 36 hours.
const FIXTURE = {
  tuition: 3000,
  fees: 400,
  weeks: 12,
  currentWage: 15,
  currentHoursPerWeek: 36,
  hoursLostPerWeek: 10,
  roundTripMiles: 24,
  mpg: 24,
  gasPrice: 2.99,
  daysPerWeek: 3,
  childcareHoursPerWeek: 9,
  childcareRate: 8,
  newWage: 20,
  newHoursPerWeek: 36,
};

test("total cost matches the hand-verified fixture", () => {
  const c = totalCost(FIXTURE);
  assert.equal(c.tuition, 3000);
  assert.equal(c.fees, 400);
  assert.equal(c.lostWages, 1800, "$15/hr x 10 hrs/wk x 12 weeks");
  assert.ok(Math.abs(c.fuel - 107.64) < 0.005, `fuel should be $107.64, got ${c.fuel}`);
  assert.equal(c.childcare, 864, "9 hrs/wk x $8 x 12 weeks");
  assert.ok(Math.abs(c.total - 6171.64) < 0.005, `total should be $6,171.64, got ${c.total}`);
  assert.equal(money(c.total), "$6,172", "the figure shown to the student");
});

test("payback matches the hand-verified fixture", () => {
  const c = totalCost(FIXTURE);
  const p = payback(FIXTURE, c);
  assert.equal(p.paysBack, true);
  assert.ok(Math.abs(p.monthlyGain - 780) < 0.005, `monthly gain should be $780, got ${p.monthlyGain}`);
  assert.equal(money(p.monthlyGain), "$780");
  assert.equal(months(p.months), "7.9", `payback should be 7.9 months, got ${p.months}`);
});

test("an empty form produces zeroes, never NaN", () => {
  const c = totalCost({});
  for (const [k, v] of Object.entries(c)) {
    if (typeof v === "number") assert.ok(Number.isFinite(v), `${k} must be finite, got ${v}`);
  }
  assert.equal(c.total, 0);
  const p = payback({}, c);
  assert.equal(p.paysBack, false);
  assert.ok(p.reason.length > 0, "must explain itself rather than showing a blank");
});

test("zero MPG does not produce Infinity", () => {
  const c = totalCost({ ...FIXTURE, mpg: 0 });
  assert.ok(Number.isFinite(c.fuel), `fuel must stay finite when mpg is 0, got ${c.fuel}`);
  assert.equal(c.fuel, 0, "unknown fuel economy contributes nothing rather than everything");
  assert.ok(Number.isFinite(c.total));
});

test("a new wage below the current wage says so plainly", () => {
  const p = payback({ ...FIXTURE, newWage: 12 }, totalCost(FIXTURE));
  assert.equal(p.paysBack, false, "there is no payback period when you would earn less");
  assert.equal(p.months, null, "must not invent a number");
  assert.match(p.reason, /would not pay more/i);
  assert.ok(!/-/.test(months(p.months)), "must never print a negative payback");
});

test("an equal wage is treated as no gain, not as instant payback", () => {
  const p = payback({ ...FIXTURE, newWage: 15, newHoursPerWeek: 36 }, totalCost(FIXTURE));
  assert.equal(p.paysBack, false);
  assert.equal(p.months, null);
});

test("formatters never emit NaN or Infinity", () => {
  for (const bad of [NaN, Infinity, -Infinity, undefined, null]) {
    assert.ok(!/NaN|Infinity/.test(money(bad)), `money(${bad}) leaked: ${money(bad)}`);
    assert.ok(!/NaN|Infinity/.test(months(bad)), `months(${bad}) leaked: ${months(bad)}`);
  }
});
