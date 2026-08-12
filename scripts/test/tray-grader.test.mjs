// Tray grading. The whole value of this tool is that it marks against the real arrangement
// rules rather than "did you pick the right instruments", so each rule gets its own test.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const load = (p, g) => {
  const win = {};
  new Function("window", readFileSync(join(root, p), "utf8"))(win);
  return win[g];
};

const { grade, longestInOrder } = load("assets/skills-lab/tray-grader.js", "SL_TRAY_GRADER");
const TRAYS = load("assets/skills-lab/trays-data.js", "SL_TRAYS");
const INSTRUMENTS = load("assets/skills-lab/instruments-data.js", "SL_INSTRUMENTS");

const byRule = (r, id) => r.results.find((x) => x.id === id);

test("the four arrangement rules are all defined in the data", () => {
  const ids = TRAYS.RULES.map((r) => r.id).sort();
  assert.deepEqual(ids, ["cotton-top", "group-by-function", "hinged-right", "order-of-use"]);
  for (const r of TRAYS.RULES) {
    assert.ok(r.rule.length > 10, `${r.id} needs a rule statement`);
    assert.ok(r.why && r.why.length > 10, `${r.id} needs a reason a student can understand`);
  }
});

test("every instrument a tray references actually exists", () => {
  const ids = new Set(INSTRUMENTS.ITEMS.map((i) => i.id));
  for (const s of TRAYS.SETUPS) {
    for (const id of s.instrumentIds || []) {
      assert.ok(ids.has(id), `${s.procedure} references unknown instrument "${id}"`);
    }
    for (const id of s.sequence || []) {
      assert.ok(ids.has(id), `${s.procedure} sequence references unknown instrument "${id}"`);
    }
  }
});

test("a perfectly arranged tray passes every rule", () => {
  const setup = TRAYS.SETUPS.find((s) => s.id === "exam") || TRAYS.SETUPS[0];
  const byId = Object.fromEntries(INSTRUMENTS.ITEMS.map((i) => [i.id, i]));
  const isCotton = (id) => /cotton|gauze|dri-?aid|pellet|roll/.test(((byId[id] || {}).name || id).toLowerCase());

  const seq = (setup.sequence || setup.instrumentIds).filter((id) => !isCotton(id));
  const top = (setup.instrumentIds || []).filter(isCotton);

  const r = grade({ setup, placedIds: seq, topIds: top, instruments: INSTRUMENTS.ITEMS });
  assert.equal(byRule(r, "order-of-use").ok, true, byRule(r, "order-of-use").detail);
  assert.equal(r.missing.length, 0, `nothing should be missing: ${r.missing}`);
  assert.equal(r.extra.length, 0, `nothing should be extra: ${r.extra}`);
});

test("cotton left in the instrument row is caught and named", () => {
  const setup = TRAYS.SETUPS.find((s) => (s.instrumentIds || []).some((id) => /cotton|gauze/.test(id)));
  assert.ok(setup, "expected at least one setup with cotton products");
  const cotton = setup.instrumentIds.find((id) => /cotton|gauze/.test(id));

  const r = grade({ setup, placedIds: [cotton], topIds: [], instruments: INSTRUMENTS.ITEMS });
  const rule = byRule(r, "cotton-top");
  assert.equal(rule.ok, false);
  assert.match(rule.detail, /across the top/i);
  assert.ok(rule.offenders.includes(cotton), "must name the item that is in the wrong place");
});

test("a hinged instrument placed before non-hinged ones is caught", () => {
  const byId = Object.fromEntries(INSTRUMENTS.ITEMS.map((i) => [i.id, i]));
  const hinged = INSTRUMENTS.ITEMS.find((i) => /forcep|scissor|needle holder|hemostat/.test(i.name.toLowerCase()));
  assert.ok(hinged, "expected at least one hinged instrument in the data");
  const plain = INSTRUMENTS.ITEMS.find((i) => i.id === "mirror") || INSTRUMENTS.ITEMS[0];

  const setup = { id: "t", procedure: "test", instrumentIds: [hinged.id, plain.id], sequence: [hinged.id, plain.id] };
  const r = grade({ setup, placedIds: [hinged.id, plain.id], topIds: [], instruments: INSTRUMENTS.ITEMS });
  const rule = byRule(r, "hinged-right");
  assert.equal(rule.ok, false, "hinged instrument sitting to the left of a plain one should fail");
  assert.match(rule.detail, /right-hand end/i);
});

test("one item out of place costs one mistake, not every position after it", () => {
  // Expected A B C D E; student swaps B and C. That is one item to move, not four.
  const setup = { id: "t", procedure: "test", instrumentIds: ["a","b","c","d","e"], sequence: ["a","b","c","d","e"] };
  const r = grade({ setup, placedIds: ["a","c","b","d","e"], topIds: [], instruments: [] });
  const rule = byRule(r, "order-of-use");
  assert.equal(rule.ok, false);
  assert.equal(rule.offenders.length, 1, `expected a single offender, got ${rule.offenders}`);
});

test("missing and extra instruments are reported separately from arrangement", () => {
  const setup = { id: "t", procedure: "test", instrumentIds: ["a","b","c"], sequence: ["a","b","c"] };
  const r = grade({ setup, placedIds: ["a","b","z"], topIds: [], instruments: [] });
  assert.deepEqual(r.missing, ["c"]);
  assert.deepEqual(r.extra, ["z"]);
});

test("an empty tray fails honestly instead of scoring full marks", () => {
  const setup = TRAYS.SETUPS[0];
  const r = grade({ setup, placedIds: [], topIds: [], instruments: INSTRUMENTS.ITEMS });
  assert.equal(byRule(r, "order-of-use").ok, false);
  assert.ok(r.passed < r.total, "an empty tray must not pass every rule");
  assert.ok(r.missing.length > 0);
  for (const res of r.results) {
    assert.ok(!/NaN|undefined/.test(res.detail), `leaked a raw value: ${res.detail}`);
  }
});

test("longestInOrder finds the correctly-ordered run", () => {
  assert.deepEqual(longestInOrder([0, 1, 2, 3]), [0, 1, 2, 3]);
  assert.equal(longestInOrder([3, 2, 1, 0]).length, 1);
  assert.deepEqual(longestInOrder([]), []);
});
