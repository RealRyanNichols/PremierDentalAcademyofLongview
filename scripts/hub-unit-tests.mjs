// Unit tests for the Office Hub plan generator (pure logic, no network).
// Run: node scripts/hub-unit-tests.mjs   (part of npm test via test:hub)
import assert from 'node:assert/strict';
import {
  buildPlan, addDays, dateForDay, inputsToQuery, queryToInputs,
  ROLES, EXPERIENCE_LEVELS, PRACTICE_TYPES, FOCUS_AREAS,
} from '../assets/hub/plan-builder.mjs';
import { TEXAS_RADIOLOGY_NOTE } from '../assets/hub/hub-config.mjs';

let ran = 0;
const test = (name, fn) => { try { fn(); ran++; } catch (e) { console.error(`✗ ${name}`); throw e; } };

// ── Every combination produces a complete 3-phase plan ─────────────────────
const focusSets = [[], ...Object.keys(FOCUS_AREAS).map((f) => [f]), Object.keys(FOCUS_AREAS)];
let combos = 0;
for (const role of Object.keys(ROLES))
  for (const experience of Object.keys(EXPERIENCE_LEVELS))
    for (const practiceType of Object.keys(PRACTICE_TYPES))
      for (const focusAreas of focusSets) {
        const plan = buildPlan({ role, experience, practiceType, focusAreas });
        combos++;
        assert.equal(plan.phases.length, 3, 'three phases');
        for (const ph of plan.phases) {
          assert.ok(ph.items.length > 0, `${role}/${experience}/${practiceType} phase ${ph.key} not empty`);
          for (const it of ph.items) {
            assert.ok(it.title && it.detail, 'item has title+detail');
            assert.ok(it.day >= 1 && it.day <= 120, 'day in range');
            if (ph.key === 'd30') assert.ok(it.day <= 30);
            if (ph.key === 'd60') assert.ok(it.day > 30 && it.day <= 60);
            if (ph.key === 'd90') assert.ok(it.day > 60);
            assert.ok(['task', 'skill', 'quiz', 'sop_read', 'checkin'].includes(it.kind));
          }
        }
        assert.ok(plan.disclaimer.includes('not a certification'), 'disclaimer present');
      }
test(`all ${combos} input combinations yield complete plans`, () => {});

// ── Focus areas alter content ──────────────────────────────────────────────
test('focus areas change the plan', () => {
  const base = buildPlan({ role: 'dental_assistant', experience: 'new_grad', practiceType: 'general', focusAreas: [] });
  const withLab = buildPlan({ role: 'dental_assistant', experience: 'new_grad', practiceType: 'general', focusAreas: ['lab'] });
  const count = (p) => p.phases.reduce((n, ph) => n + ph.items.length, 0);
  assert.ok(count(withLab) > count(base));
  assert.ok(withLab.phases.some((ph) => ph.items.some((it) => it.tag === 'lab')));
});

// ── Texas radiology note appears iff radiology content is present ──────────
test('radiology note gating', () => {
  const withRad = buildPlan({ role: 'front_office', experience: 'new_grad', practiceType: 'general', focusAreas: ['radiology'] });
  assert.ok(withRad.notes.includes(TEXAS_RADIOLOGY_NOTE));
  const noRad = buildPlan({ role: 'front_office', experience: 'new_grad', practiceType: 'general', focusAreas: [] });
  assert.ok(!noRad.notes.includes(TEXAS_RADIOLOGY_NOTE));
});

// ── Invalid input falls back to defaults instead of crashing ───────────────
test('invalid inputs are sanitized', () => {
  const plan = buildPlan({ role: 'hacker', experience: 'x', practiceType: 'y', focusAreas: ['nope', 'lab'] });
  assert.equal(plan.inputs.role, 'dental_assistant');
  assert.deepEqual(plan.inputs.focusAreas, ['lab']);
});

// ── DST-safe day math (America/Chicago springs forward Mar 8 2026, falls back Nov 1 2026) ──
test('day math across DST boundaries', () => {
  assert.equal(dateForDay('2026-03-01', 1), '2026-03-01');
  assert.equal(dateForDay('2026-03-01', 10), '2026-03-10'); // crosses Mar 8 spring-forward
  assert.equal(dateForDay('2026-10-25', 10), '2026-11-03'); // crosses Nov 1 fall-back
  assert.equal(dateForDay('2026-12-28', 7), '2027-01-03'); // year boundary
  assert.equal(addDays('2026-02-27', 2), '2026-03-01');    // non-leap Feb
  assert.throws(() => addDays('bogus', 1));
});

// ── Query round-trip (no-JS form GET ↔ shared lib) ─────────────────────────
test('query round-trip', () => {
  const inputs = { role: 'hygienist', experience: 'experienced', practiceType: 'ortho', focusAreas: ['software', 'scheduling'] };
  const round = queryToInputs(inputsToQuery(inputs));
  const plan = buildPlan(round);
  assert.equal(plan.inputs.role, 'hygienist');
  assert.equal(plan.inputs.practiceType, 'ortho');
  assert.deepEqual(plan.inputs.focusAreas, ['software', 'scheduling']);
});

console.log(`✓ hub unit tests passed (${ran} groups, ${combos} generator combinations)`);
