/*!
 * Onboarding & Competency Hub — 30/60/90-day plan generator (pure logic).
 *
 * Single source of truth for the free public generator. Imported by:
 *  - tools/onboarding-plan-generator.html  (browser, progressive enhancement)
 *  - api/hub/plan.js                        (no-JS server-rendered result)
 *  - scripts/hub-unit-tests.mjs             (unit tests — every combination)
 *
 * Pure functions only: no DOM, no fetch, no Date.now(). All content here is
 * generic dental-office onboarding practice — no statistics, no claims.
 */

import { TEXAS_RADIOLOGY_NOTE, TRAINING_RECORD_DISCLAIMER } from './hub-config.mjs';

// ── Inputs (the generator's four questions) ─────────────────────────────────

export const ROLES = {
  dental_assistant: 'Dental assistant',
  front_office: 'Front office / admin',
  hygienist: 'Dental hygienist',
  office_manager: 'Office manager',
};

export const EXPERIENCE_LEVELS = {
  new_to_dental: 'Brand new to dental',
  new_grad: 'Recent grad / externship done',
  experienced: 'Experienced, new to this office',
};

export const PRACTICE_TYPES = {
  general: 'General dentistry',
  pediatric: 'Pediatric',
  ortho: 'Orthodontics',
  oral_surgery: 'Oral surgery',
  multi_specialty: 'Multi-specialty / group',
};

export const FOCUS_AREAS = {
  sterilization: 'Sterilization & infection control',
  chairside: 'Chairside assisting',
  radiology: 'X-ray workflow (Texas rules apply)',
  software: 'Practice software',
  scheduling: 'Scheduling & recall',
  insurance: 'Insurance & billing basics',
  patient_communication: 'Patient communication',
  lab: 'Lab cases & materials',
};

// ── Date math (DST-safe) ────────────────────────────────────────────────────
// Day arithmetic is done on calendar days in UTC so a plan that crosses a
// DST change in America/Chicago never gains or loses a day. Day 1 = start_date.
export function addDays(isoDate, days) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(isoDate || ''));
  if (!m) throw new Error('addDays expects YYYY-MM-DD, got: ' + isoDate);
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  d.setUTCDate(d.getUTCDate() + days);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}`;
}
export function dateForDay(startDate, dayOffset) {
  return addDays(startDate, dayOffset - 1); // day 1 is the start date itself
}

// ── Content blocks ──────────────────────────────────────────────────────────
// item: { day, title, detail, kind, tag }  kind: task|skill|sop_read|quiz|checkin
const T = (day, title, detail, kind = 'task', tag = null) => ({ day, title, detail, kind, tag });

const CORE = {
  d30: [
    T(1, 'Welcome, tour, and where things live', 'Walk the office: operatories, sterilization area, lab, supply storage, break room, emergency exits and kits.'),
    T(1, 'Meet the team', 'Names, roles, and who to ask for what. Pair the new hire with one go-to person for week one.'),
    T(2, 'Read the office handbook & core policies', 'Hours, dress, phones, sick-day process, and how the daily huddle works.', 'sop_read'),
    T(3, 'Shadow a full patient day', 'Observe check-in to check-out, no tasks assigned — just watch the flow and take notes.'),
    T(5, 'Learn the morning opening routine', 'Unlock, lights, equipment on, operatory setup, huddle prep. Do it with a buddy twice before doing it alone.'),
    T(8, 'First week check-in with your manager', 'What made sense, what didn’t, what to focus on next week.', 'checkin'),
    T(12, 'Learn the closing routine', 'End-of-day teardown, instrument processing handoff, locks and alarms.'),
    T(19, 'Mid-month check-in', 'Review progress on the checklist together; adjust the plan where needed.', 'checkin'),
    T(27, 'Day-30 review', 'Walk the competency checklist with your trainer and set the 60-day goals.', 'checkin'),
  ],
  d60: [
    T(33, 'Take ownership of your daily station', 'Own your setup and turnover without prompting; buddy spot-checks twice a week.'),
    T(40, 'Handle a full day without a shadow', 'Trainer nearby but hands-off. Debrief at the end of the day.'),
    T(47, 'Cross-train: one hour in another seat', 'Spend time with a different role (front to back or back to front) to see the handoffs you touch.'),
    T(54, 'Day-60 review', 'Checklist review with your trainer; agree what "independent" still needs.', 'checkin'),
  ],
  d90: [
    T(65, 'Run your area solo for a full week', 'Trainer checks in at the end of each day instead of during.'),
    T(75, 'Teach something back', 'Walk a teammate through one routine you now own — teaching it proves you know it.'),
    T(85, 'Day-90 readiness review', 'Full checklist walkthrough, sign-offs updated, and a plain-language readiness summary for the doctor.', 'checkin'),
  ],
};

const ROLE_ITEMS = {
  dental_assistant: {
    d30: [
      T(4, 'Instrument names and tray anatomy', 'Learn the office’s tray setups for the most common procedures; photograph each tray for your notes.', 'skill'),
      T(6, 'Sterilization workflow, end to end', 'Dirty-to-clean flow, ultrasonic, packaging, autoclave cycles, spore-test log. Observe, then do with supervision.', 'skill', 'sterilization'),
      T(9, 'Operatory setup & barrier protocol', 'Set up and break down an operatory to office standard, including barriers and surface disinfection.', 'skill'),
      T(14, 'Chairside basics: suction & retraction', 'Assist on routine restorative visits; focus on anticipating the next instrument.', 'skill', 'chairside'),
      T(21, 'Impressions & models practice', 'Practice alginate impressions and pouring models on typodonts before live patients.', 'skill'),
    ],
    d60: [
      T(35, 'Chairside: full procedure rotation', 'Assist across the office’s common procedure types; keep a log of which you’ve seen.', 'skill', 'chairside'),
      T(42, 'Sterilization knowledge check', 'Short quiz on cycles, indicators, and what to do on a failed spore test.', 'quiz', 'sterilization'),
      T(50, 'Room turnover to time standard', 'Consistently turn a room over to the office’s standard between patients.', 'skill'),
    ],
    d90: [
      T(70, 'Independent chairside on routine visits', 'Doctor confirms you anticipate well on bread-and-butter procedures.', 'skill', 'chairside'),
      T(80, 'Own one supply category', 'Track and reorder one category (e.g. restorative materials) with the ordering system.'),
    ],
  },
  front_office: {
    d30: [
      T(4, 'Phone greeting & message-taking standard', 'Learn the office’s phone script, hold etiquette, and where messages go.', 'skill', 'patient_communication'),
      T(6, 'Check-in and check-out flow', 'Run the front desk flow with a buddy: arrivals, forms, collecting balances, scheduling next visits.', 'skill'),
      T(9, 'Practice software: patient lookup & notes', 'Find charts, read the schedule, add notes the back office can act on.', 'skill', 'software'),
      T(14, 'Insurance vocabulary basics', 'Deductible, max, downgrade, pre-auth — enough to explain a statement without guessing.', 'skill', 'insurance'),
      T(21, 'Confirmation & recall workflow', 'Work one full day of confirmations and one recall list with supervision.', 'skill', 'scheduling'),
    ],
    d60: [
      T(35, 'Schedule to the office’s block plan', 'Fill and move appointments to the production-block plan without double-booking.', 'skill', 'scheduling'),
      T(42, 'Handle payment conversations', 'Collect at time of service and explain balances kindly and clearly.', 'skill', 'patient_communication'),
      T(50, 'Insurance verification run-through', 'Verify a day’s worth of coverage with a checklist and no missed fields.', 'skill', 'insurance'),
    ],
    d90: [
      T(70, 'Run the front desk solo for a week', 'Includes opening the schedule, working the day, and end-of-day reconciliation.', 'skill'),
      T(80, 'Reduce one friction point', 'Pick one recurring front-desk snag and propose a fix at the team huddle.'),
    ],
  },
  hygienist: {
    d30: [
      T(4, 'Hygiene operatory standard', 'Set up and break down the hygiene room to office standard; instrument preferences documented.', 'skill'),
      T(6, 'Chart review & perio charting workflow', 'How this office documents perio, where prior charting lives, and doctor handoff notes.', 'skill', 'software'),
      T(9, 'Recall philosophy & scheduling', 'How the office books hygiene, handles overdue recall, and what the ideal day looks like.', 'sop_read', 'scheduling'),
      T(14, 'Doctor exam handoff rhythm', 'Practice the hygiene-to-doctor handoff: what to summarize, when to call for the exam.', 'skill', 'patient_communication'),
    ],
    d60: [
      T(35, 'Full-day hygiene column', 'Run a full column at the office’s pace with assistant support as configured.', 'skill'),
      T(42, 'Patient education consistency', 'Deliver home-care guidance consistent with the doctors’ philosophy.', 'skill', 'patient_communication'),
    ],
    d90: [
      T(70, 'Own your recall re-appointment rate', 'Track your column’s re-appointment before-they-leave habit for two weeks.'),
      T(80, 'Case co-planning with the doctor', 'Bring one perio or restorative observation per day into the exam handoff.', 'skill'),
    ],
  },
  office_manager: {
    d30: [
      T(4, 'Meet one-on-one with every team member', 'Fifteen minutes each: what works, what’s stuck, what they’d fix first.'),
      T(6, 'Map the money flow', 'From treatment plan to collection: who touches what, where things stall.', 'skill', 'insurance'),
      T(9, 'Learn the reporting rhythm', 'Which numbers the owner watches, where they come from, and when.', 'skill', 'software'),
      T(14, 'Sit every seat for half a day', 'Front desk, sterilization, chairside observation — know the jobs you coordinate.'),
    ],
    d60: [
      T(35, 'Run the morning huddle', 'Own the huddle agenda for two weeks straight.', 'skill', 'patient_communication'),
      T(42, 'Own the schedule health check', 'Weekly review of openings, blocks, and recall backlog with the front desk.', 'skill', 'scheduling'),
    ],
    d90: [
      T(70, 'Present a 90-day observations memo', 'Three things running well, three to improve, one plan — reviewed with the owner.'),
      T(80, 'Own one improvement project', 'Pick one workflow fix and drive it to done with the team.'),
    ],
  },
};

const PRACTICE_ITEMS = {
  general: [],
  pediatric: [
    T(10, 'Pediatric behavior guidance basics', 'Tell-show-do, parent presence policy, and this office’s comfort menu.', 'skill', 'patient_communication'),
    T(38, 'Kid-visit flow mastery', 'Run the shorter, faster pediatric visit rhythm without losing warmth.', 'skill'),
  ],
  ortho: [
    T(10, 'Ortho visit types & intervals', 'Bond, adjust, debond, retainer checks — what happens at each and how long they take.', 'sop_read'),
    T(38, 'Wire, bracket, and supply fluency', 'Know the office’s ortho supply names and where everything lives.', 'skill'),
  ],
  oral_surgery: [
    T(10, 'Surgical setup & sterile field', 'This office’s surgical tray standard and sterile-field habits.', 'skill', 'sterilization'),
    T(38, 'Pre-op & post-op call rhythm', 'Instructions patients get before and after, and who makes the calls.', 'skill', 'patient_communication'),
  ],
  multi_specialty: [
    T(10, 'Who does what across specialties', 'Which providers do which procedures, and how referrals move inside the group.', 'sop_read'),
    T(38, 'Specialty scheduling rules', 'Each provider’s block preferences and setup differences.', 'skill', 'scheduling'),
  ],
};

const FOCUS_ITEMS = {
  sterilization: [
    T(7, 'Deep-dive: instrument processing standard', 'Written walkthrough of every station from dirty to sterile storage, with the why behind each step.', 'sop_read', 'sterilization'),
    T(45, 'Sterilization: independent with spot audits', 'Run processing solo; trainer audits twice weekly against the checklist.', 'skill', 'sterilization'),
  ],
  chairside: [
    T(16, 'Focused chairside reps', 'Extra scheduled assisting reps this month on the office’s top three procedures.', 'skill', 'chairside'),
    T(58, 'Chairside: anticipation check', 'Doctor rates instrument anticipation on five consecutive visits.', 'skill', 'chairside'),
  ],
  radiology: [
    T(11, 'X-ray workflow familiarization (no exposures)', 'Learn sensor care, image import, mounting, and retake policy. Texas note: exposing radiographs requires the TSBDE RDA radiology certificate.', 'sop_read', 'radiology'),
    T(48, 'Radiology paperwork & image hygiene', 'Own image labeling, mounting, and chart attachment for the day’s visits (non-exposure tasks).', 'skill', 'radiology'),
  ],
  software: [
    T(13, 'Software power-user hour', 'A focused hour on the practice software’s five most-used screens for your seat.', 'skill', 'software'),
    T(52, 'Software: no-lookup day', 'Work a full day without asking for a click-path; note anything you still had to hunt for.', 'skill', 'software'),
  ],
  scheduling: [
    T(15, 'Read the block schedule like a map', 'Why the blocks are shaped the way they are, and what a "good day" looks like here.', 'sop_read', 'scheduling'),
    T(56, 'Fill a broken day', 'Practice rebuilding a day after cancellations using the short-call list.', 'skill', 'scheduling'),
  ],
  insurance: [
    T(17, 'Explain a statement in plain words', 'Role-play three common statement questions until the answers feel natural.', 'skill', 'insurance'),
    T(59, 'Claims follow-up basics', 'Work the over-30-days claim list with a buddy for one session.', 'skill', 'insurance'),
  ],
  patient_communication: [
    T(18, 'The office voice', 'How this office talks: greetings, tough moments, and the phrases we avoid.', 'sop_read', 'patient_communication'),
    T(57, 'Difficult-moment role-play', 'Practice a late patient, a payment concern, and a nervous patient with your trainer.', 'skill', 'patient_communication'),
  ],
  lab: [
    T(20, 'Lab case lifecycle', 'From impression/scan to seat date: logging, shipping, tracking, and where cases wait.', 'sop_read', 'lab'),
    T(60, 'Own the lab log', 'Track every open case for two weeks; nothing arrives late without a heads-up.', 'skill', 'lab'),
  ],
};

// Experience level shapes pacing, not content volume.
const EXPERIENCE_NOTES = {
  new_to_dental:
    'Pace: everything gets shown before it gets assigned. Expect the first two weeks to feel like drinking from a firehose — that’s normal. Ask early, ask often.',
  new_grad:
    'Pace: you’ve seen the skills — this plan is about how THIS office does them. Speak up where school taught you differently so the team can align.',
  experienced:
    'Pace: accelerated. Early items are about this office’s way of doing things, not the fundamentals. Days 1–14 may compress if sign-offs come fast.',
};

// ── The generator ───────────────────────────────────────────────────────────

export function buildPlan(inputs = {}) {
  const role = ROLES[inputs.role] ? inputs.role : 'dental_assistant';
  const experience = EXPERIENCE_LEVELS[inputs.experience] ? inputs.experience : 'new_to_dental';
  const practiceType = PRACTICE_TYPES[inputs.practiceType] ? inputs.practiceType : 'general';
  const focusAreas = (Array.isArray(inputs.focusAreas) ? inputs.focusAreas : [])
    .filter((f) => FOCUS_AREAS[f]);

  const items = [
    ...CORE.d30, ...CORE.d60, ...CORE.d90,
    ...ROLE_ITEMS[role].d30, ...ROLE_ITEMS[role].d60, ...ROLE_ITEMS[role].d90,
    ...PRACTICE_ITEMS[practiceType],
    ...focusAreas.flatMap((f) => FOCUS_ITEMS[f]),
  ].map((it) => ({ ...it }));

  // Experienced hires compress the shadow/orientation window slightly:
  // pure-observation tasks move earlier so ownership items start sooner.
  if (experience === 'experienced') {
    for (const it of items) {
      if (it.day >= 3 && it.day <= 9 && it.kind === 'task') it.day = Math.max(2, it.day - 1);
    }
  }

  const phaseOf = (day) => (day <= 30 ? 'd30' : day <= 60 ? 'd60' : 'd90');
  const phases = { d30: [], d60: [], d90: [] };
  for (const it of items) phases[phaseOf(it.day)].push(it);
  for (const key of Object.keys(phases)) phases[key].sort((a, b) => a.day - b.day || a.title.localeCompare(b.title));

  const hasRadiology = items.some((it) => it.tag === 'radiology');
  const notes = [EXPERIENCE_NOTES[experience]];
  if (hasRadiology) notes.push(TEXAS_RADIOLOGY_NOTE);

  return {
    inputs: { role, experience, practiceType, focusAreas },
    labels: {
      role: ROLES[role],
      experience: EXPERIENCE_LEVELS[experience],
      practiceType: PRACTICE_TYPES[practiceType],
      focusAreas: focusAreas.map((f) => FOCUS_AREAS[f]),
    },
    phases: [
      { key: 'd30', title: 'Days 1–30 · Learn the office', items: phases.d30 },
      { key: 'd60', title: 'Days 31–60 · Build ownership', items: phases.d60 },
      { key: 'd90', title: 'Days 61–90 · Run it yourself', items: phases.d90 },
    ],
    notes,
    disclaimer: TRAINING_RECORD_DISCLAIMER,
  };
}

// Serialize/parse inputs to URL query params so the no-JS form GET and shared
// links both round-trip through /api/hub/plan.
export function inputsToQuery(inputs) {
  const q = new URLSearchParams();
  q.set('role', inputs.role || 'dental_assistant');
  q.set('experience', inputs.experience || 'new_to_dental');
  q.set('practice', inputs.practiceType || 'general');
  for (const f of inputs.focusAreas || []) q.append('focus', f);
  return q.toString();
}
export function queryToInputs(query) {
  const q = new URLSearchParams(query || '');
  return {
    role: q.get('role') || undefined,
    experience: q.get('experience') || undefined,
    practiceType: q.get('practice') || undefined,
    focusAreas: q.getAll('focus'),
  };
}
