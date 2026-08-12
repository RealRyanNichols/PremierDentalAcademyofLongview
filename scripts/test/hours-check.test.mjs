// The 168-hour week arithmetic, pinned to a hand-verified fixture.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const win = {};
new Function("window", readFileSync(join(root, "assets/tools/hours-check.js"), "utf8"))(win);
const { weeklyHours, verdict, HOURS_IN_A_WEEK } = win.PDA_HOURS;

// 32 hours of work, 7 hours of sleep a night, 14 caring, 5 commuting, 15 in class,
// 6 studying, 14 on the household.
const FIXTURE = { work: 32, sleep: 7, care: 14, commute: 5, classTime: 15, study: 6, household: 14 };

test("a week has 168 hours", () => {
  assert.equal(HOURS_IN_A_WEEK, 168);
});

test("committed and remaining hours match the hand-verified fixture", () => {
  const r = weeklyHours(FIXTURE);
  assert.equal(r.sleepPerWeek, 49, "7 hours a night is 49 a week");
  assert.equal(r.committed, 135);
  assert.equal(r.left, 33);
  assert.equal(r.overCommitted, false);
  assert.equal(r.committed + r.left, 168, "the two halves must always add back to a full week");
});

test("an empty form produces zeroes, never NaN", () => {
  const r = weeklyHours({});
  assert.equal(r.committed, 0);
  assert.equal(r.left, 168);
  assert.ok(Number.isFinite(r.committed) && Number.isFinite(r.left));
  assert.equal(r.rows.length, 0, "nothing entered means nothing listed back");
});

test("non-numeric and negative input is ignored rather than trusted", () => {
  const r = weeklyHours({ work: "abc", sleep: -8, care: null, commute: undefined, classTime: "15" });
  assert.ok(Number.isFinite(r.committed));
  assert.equal(r.committed, 15, "only the parseable positive value counts");
});

test("over-committing is reported honestly, not clamped to zero", () => {
  const r = weeklyHours({ work: 60, sleep: 8, care: 40, commute: 10, classTime: 15, study: 10, household: 20 });
  assert.equal(r.committed, 211);
  assert.equal(r.left, -43, "the shortfall is the whole point — it must not be hidden");
  assert.equal(r.overCommitted, true);
  assert.match(verdict(r), /more than a week holds/i);
});

test("every verdict is a real sentence", () => {
  const cases = [
    weeklyHours(FIXTURE),
    weeklyHours({ work: 40, sleep: 8, care: 20, commute: 8, classTime: 15, study: 8, household: 16 }),
    weeklyHours({ work: 60, sleep: 8, care: 40, commute: 10, classTime: 15, study: 10, household: 20 }),
    weeklyHours({}),
  ];
  for (const c of cases) {
    const v = verdict(c);
    assert.ok(v.length > 20, "must say something useful");
    assert.ok(!/NaN|Infinity|undefined/.test(v), `verdict leaked a raw value: ${v}`);
  }
});
