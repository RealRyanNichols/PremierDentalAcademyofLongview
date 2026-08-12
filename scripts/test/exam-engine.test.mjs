// Exam scoring and the integrity of the question bank itself.
//
// A practice exam that marks the wrong answer as correct is worse than no practice exam, so the
// bank gets structurally validated here as well as the scoring logic.
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

const E = load("assets/exam/exam-engine.js", "PDA_EXAM");
const BANKS = load("assets/exam/rda-question-banks.js", "PDA_EXAM_BANKS");

/* ── Bank integrity ───────────────────────────────────────────────────────── */

test("the bank holds 90 questions across three banks", () => {
  assert.equal(BANKS.BANKS.length, 3);
  assert.equal(E.allQuestions(BANKS).length, 90);
  for (const b of BANKS.BANKS) assert.equal(b.questions.length, 30, `${b.id} should hold 30`);
});

test("every question is structurally sound", () => {
  for (const q of E.allQuestions(BANKS)) {
    assert.ok(q.id, "every question needs an id");
    assert.equal(q.options.length, 4, `${q.id} should have 4 options`);
    assert.ok(Number.isInteger(q.answer), `${q.id} answer must be an index`);
    assert.ok(q.answer >= 0 && q.answer < q.options.length, `${q.id} answer index out of range`);
    assert.ok(q.rationale && q.rationale.length > 20, `${q.id} needs a real rationale`);
    assert.ok(q.domain, `${q.id} needs a domain for the per-domain report`);
    assert.ok(new Set(q.options).size === 4, `${q.id} has duplicate options`);
  }
});

test("question ids are unique, so answers cannot collide", () => {
  const ids = E.allQuestions(BANKS).map((q) => q.id);
  assert.equal(new Set(ids).size, ids.length, "duplicate ids would overwrite each other's answers");
});

test("every declared domain is used and every used domain is declared", () => {
  const declared = new Set(BANKS.DOMAINS.map((d) => d.id));
  const used = new Set(E.allQuestions(BANKS).map((q) => q.domain));
  for (const d of used) assert.ok(declared.has(d), `domain "${d}" is used but not declared`);
  for (const d of declared) assert.ok(used.has(d), `domain "${d}" is declared but unused`);
});

test("the bank carries its draft review status", () => {
  assert.ok(BANKS.reviewStatus, "reviewStatus is load-bearing — the page reads it");
  assert.equal(E.isDraft(BANKS), true, "must stay draft until the school owner signs it off");
});

test("no question repeats the false 75%-to-pass claim", () => {
  const text = JSON.stringify(BANKS).toLowerCase();
  assert.ok(!/75%\s*(is\s*)?(required\s*)?to\s*pass/.test(text));
  assert.ok(!/about 75%/.test(text));
});

/* ── Exam construction ────────────────────────────────────────────────────── */

test("buildExam respects length, bank and domain filters", () => {
  assert.equal(E.buildExam({ banks: BANKS, length: 10 }).length, 10);
  assert.equal(E.buildExam({ banks: BANKS, bankId: "bank2" }).length, 30);
  const rad = E.buildExam({ banks: BANKS, domains: ["radiography"] });
  assert.ok(rad.length > 0);
  for (const q of rad) assert.equal(q.domain, "radiography");
});

test("an unknown bank or domain yields an empty exam rather than the whole bank", () => {
  assert.equal(E.buildExam({ banks: BANKS, bankId: "nope" }).length, 0);
  assert.equal(E.buildExam({ banks: BANKS, domains: ["not_a_domain"] }).length, 0);
});

test("a missing bank produces an empty exam instead of throwing", () => {
  assert.deepEqual(E.allQuestions(null), []);
  assert.deepEqual(E.allQuestions({}), []);
  assert.equal(E.buildExam({ banks: null }).length, 0);
  assert.equal(E.isDraft(null), true, "no bank must never read as approved");
});

/* ── Scoring ──────────────────────────────────────────────────────────────── */

const Q = [
  { id: "a", domain: "radiography", options: ["w", "x", "y", "z"], answer: 0, rationale: "because" },
  { id: "b", domain: "radiography", options: ["w", "x", "y", "z"], answer: 1, rationale: "because" },
  { id: "c", domain: "chairside", options: ["w", "x", "y", "z"], answer: 2, rationale: "because" },
  { id: "d", domain: "chairside", options: ["w", "x", "y", "z"], answer: 3, rationale: "because" },
];

test("scoring counts correct answers and breaks them down by domain", () => {
  const s = E.score(Q, { a: 0, b: 0, c: 2, d: 3 });
  assert.equal(s.correct, 3);
  assert.equal(s.answered, 4);
  assert.equal(s.total, 4);
  assert.equal(s.unanswered, 0);
  assert.equal(s.byDomain.radiography.correct, 1);
  assert.equal(s.byDomain.radiography.total, 2);
  assert.equal(s.byDomain.chairside.correct, 2);
  assert.equal(s.byDomain.chairside.total, 2);
});

test("the weakest domain sorts first, which is the study advice", () => {
  const s = E.score(Q, { a: 0, b: 0, c: 2, d: 3 });
  assert.equal(s.weakest[0].domain, "radiography");
  assert.equal(s.weakest[0].pct, 50);
  assert.equal(s.weakest[1].domain, "chairside");
  assert.equal(s.weakest[1].pct, 100);
});

test("an unanswered question counts against the total but is not marked wrong-by-guess", () => {
  const s = E.score(Q, { a: 0 });
  assert.equal(s.correct, 1);
  assert.equal(s.answered, 1);
  assert.equal(s.unanswered, 3);
  assert.equal(s.results.filter((r) => !r.answered).length, 3);
  for (const r of s.results.filter((r) => !r.answered)) {
    assert.equal(r.chosen, null, "an unanswered question must not record a chosen index");
  }
});

test("index 0 is a real answer, not a falsy blank", () => {
  const s = E.score([Q[0]], { a: 0 });
  assert.equal(s.correct, 1, "choosing the first option must count");
  assert.equal(s.answered, 1);
});

test("an empty exam scores zero without dividing by zero", () => {
  const s = E.score([], {});
  assert.equal(s.total, 0);
  assert.equal(s.correct, 0);
  assert.deepEqual(s.weakest, []);
  for (const v of [s.correct, s.answered, s.total, s.unanswered]) assert.ok(Number.isFinite(v));
});

test("weakAreas returns the domains below the threshold, weakest first", () => {
  const s = E.score(Q, { a: 0, b: 0, c: 2, d: 3 });
  const weak = E.weakAreas(s, 70);
  assert.equal(weak.length, 1);
  assert.equal(weak[0].domain, "radiography");
  assert.equal(E.weakAreas(s, 100).length, 1, "chairside at 100% is not below 100");
  assert.equal(E.weakAreas(s, 0).length, 0);
});

test("the clock formats without leaking NaN", () => {
  assert.equal(E.formatClock(0), "0:00");
  assert.equal(E.formatClock(9), "0:09");
  assert.equal(E.formatClock(75), "1:15");
  assert.equal(E.formatClock(3600), "60:00");
  assert.equal(E.formatClock(-5), "0:00", "a finished clock must not run negative");
  assert.ok(!/NaN/.test(E.formatClock(NaN)));
});
