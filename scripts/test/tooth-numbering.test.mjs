// Tooth numbering conversions. Charting the wrong tooth is a real clinical error, so the
// anchor teeth in all four quadrants are pinned explicitly rather than trusted to the formula.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const win = {};
new Function("window", readFileSync(join(root, "assets/tools/tooth-numbering.js"), "utf8"))(win);
const T = win.PDA_TEETH;

// Universal → { FDI, Palmer, quadrant, name }. Every quadrant boundary and both midlines.
const ANCHORS = [
  [1,  "18", "UR8", "UR", "Third molar"],
  [3,  "16", "UR6", "UR", "First molar"],
  [6,  "13", "UR3", "UR", "Canine"],
  [8,  "11", "UR1", "UR", "Central incisor"],
  [9,  "21", "UL1", "UL", "Central incisor"],
  [14, "26", "UL6", "UL", "First molar"],
  [16, "28", "UL8", "UL", "Third molar"],
  [17, "38", "LL8", "LL", "Third molar"],
  [19, "36", "LL6", "LL", "First molar"],
  [24, "31", "LL1", "LL", "Central incisor"],
  [25, "41", "LR1", "LR", "Central incisor"],
  [30, "46", "LR6", "LR", "First molar"],
  [32, "48", "LR8", "LR", "Third molar"],
];

test("every anchor tooth converts correctly", () => {
  for (const [uni, fdi, palmer, quad, name] of ANCHORS) {
    const t = T.permanent(uni);
    assert.ok(t, `Universal ${uni} should resolve`);
    assert.equal(t.fdi, fdi, `Universal ${uni} → FDI`);
    assert.equal(t.palmer, palmer, `Universal ${uni} → Palmer`);
    assert.equal(t.quadrant.id, quad, `Universal ${uni} → quadrant`);
    assert.equal(t.name, name, `Universal ${uni} → name`);
  }
});

test("all 32 permanent teeth resolve, with unique FDI codes", () => {
  const all = T.allPermanent();
  assert.equal(all.length, 32);
  assert.equal(all.filter(Boolean).length, 32);
  assert.equal(new Set(all.map((t) => t.fdi)).size, 32, "FDI codes must be unique");
  assert.equal(new Set(all.map((t) => t.palmer)).size, 32, "Palmer codes must be unique");
});

test("FDI round-trips back to the same Universal number", () => {
  for (const t of T.allPermanent()) {
    const back = T.fromFdi(t.fdi);
    assert.equal(back.universal, t.universal, `FDI ${t.fdi} should return Universal ${t.universal}`);
  }
});

test("the two systems that count outward from the midline agree", () => {
  // Palmer position and the FDI second digit are the same number by definition.
  for (const t of T.allPermanent()) {
    assert.equal(String(t.position), t.fdi[1], `${t.universal}: Palmer position vs FDI digit`);
  }
});

test("mirrored teeth share a name and a position across the midline", () => {
  const ur1 = T.permanent(8), ul1 = T.permanent(9);
  assert.equal(ur1.name, ul1.name);
  assert.equal(ur1.position, ul1.position);
  assert.notEqual(ur1.fdi, ul1.fdi, "but they are still different teeth");
});

test("primary teeth A-T resolve across all four quadrants", () => {
  const all = T.allPrimary();
  assert.equal(all.length, 20);
  assert.equal(all.filter(Boolean).length, 20);
  assert.equal(T.primary("A").quadrant.id, "UR", "A is the upper right second molar");
  assert.equal(T.primary("A").name, "Second molar");
  assert.equal(T.primary("E").quadrant.id, "UR");
  assert.equal(T.primary("F").quadrant.id, "UL", "F starts the upper left");
  assert.equal(T.primary("K").quadrant.id, "LL");
  assert.equal(T.primary("P").quadrant.id, "LR");
  assert.equal(T.primary("T").quadrant.id, "LR", "T is the lower right second molar");
  assert.equal(new Set(all.map((t) => t.fdi)).size, 20, "primary FDI codes must be unique");
});

test("primary FDI uses quadrants 5-8", () => {
  assert.equal(T.primary("A").fdi[0], "5");
  assert.equal(T.primary("F").fdi[0], "6");
  assert.equal(T.primary("K").fdi[0], "7");
  assert.equal(T.primary("P").fdi[0], "8");
});

test("lookup accepts all three notations for the same tooth", () => {
  const expected = T.permanent(30);
  for (const input of ["30", "46", "LR6", "lr6", " 46 "]) {
    const t = T.lookup(input);
    assert.ok(t, `lookup("${input}") should resolve`);
    assert.equal(t.universal, expected.universal, `lookup("${input}")`);
  }
});

test("nonsense input returns null rather than a wrong tooth", () => {
  for (const bad of ["", "0", "99", "Z", "UR9", "XY1", null, undefined, "abc", "  "]) {
    assert.equal(T.lookup(bad), null, `lookup(${JSON.stringify(bad)}) must be null`);
  }
  assert.equal(T.permanent(0), null);
  assert.equal(T.permanent(33), null);
  assert.equal(T.fromFdi("19"), null, "FDI position 9 does not exist");
  assert.equal(T.fromFdi("58"), null, "primary quadrants stop at position 5");
});

test("two-digit codes above 32 are read as FDI, which is the only thing they can be", () => {
  // "33" is not a Universal number — there are only 32 permanent teeth — but it is a perfectly
  // valid FDI code for the lower left canine. Resolving it is correct; rejecting it would be
  // the bug. The page tells the reader which system it decided the input was in, because a
  // number like "14" IS valid in both and means a different tooth in each.
  const t = T.lookup("33");
  assert.ok(t, '"33" should resolve as FDI');
  assert.equal(t.fdi, "33");
  assert.equal(t.quadrant.id, "LL");
  assert.equal(t.name, "Canine");
  assert.equal(t.universal, "22", "the same tooth is 22 in the Universal system");
});

test("a number valid in both systems is read as Universal, and they differ", () => {
  // 14 is Universal (upper left first molar) and also FDI (upper right first premolar).
  const asUniversal = T.lookup("14");
  assert.equal(asUniversal.universal, "14");
  assert.equal(asUniversal.name, "First molar");
  assert.equal(asUniversal.quadrant.id, "UL");

  const asFdi = T.fromFdi("14");
  assert.equal(asFdi.name, "First premolar");
  assert.equal(asFdi.quadrant.id, "UR");
  assert.notEqual(asUniversal.universal, asFdi.universal, "genuinely different teeth");
});
