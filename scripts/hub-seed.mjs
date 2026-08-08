// Office Hub — STAGING seed. Entirely FICTIONAL demo data (Sunrise Family
// Dental; Dr. Maria Alvarez, Kate Nguyen, Bree Colton RDA, Jordan Reyes,
// Taylor Brooks). Never real students, leads, or graduates.
//
// Idempotent: fixed UUIDs + upserts — run it twice, get one dataset.
// SAFETY: refuses to run when NODE_ENV=production OR when pointed at the
// live PDA Supabase project. Staging/branch databases only.
//
// Run: SUPABASE_URL=<staging url> SUPABASE_SERVICE_ROLE_KEY=<staging key> node scripts/hub-seed.mjs

const URL_ = process.env.SUPABASE_URL || '';
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const PRODUCTION_REF = 'lmbsuwslsycukynzpzik'; // live PDA project — never seed

if (process.env.NODE_ENV === 'production') {
  console.error('✗ Refusing to seed: NODE_ENV=production.');
  process.exit(1);
}
if (!URL_ || !KEY) {
  console.error('✗ Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (staging project only).');
  process.exit(1);
}
if (URL_.includes(PRODUCTION_REF)) {
  console.error('✗ Refusing to seed: SUPABASE_URL points at the PRODUCTION project.');
  process.exit(1);
}

const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };

async function rest(path, method, body, prefer) {
  const res = await fetch(`${URL_}/rest/v1/${path}`, {
    method: method || 'GET',
    headers: { ...H, ...(prefer ? { Prefer: prefer } : {}) },
    body: body != null ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method || 'GET'} ${path} → ${res.status}: ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : null;
}
const upsert = (table, rows, conflict) =>
  rest(`${table}?on_conflict=${conflict || 'id'}`, 'POST', rows, 'resolution=merge-duplicates,return=minimal');

async function ensureUser(email, first, last) {
  const q = await fetch(`${URL_}/auth/v1/admin/users?page=1&per_page=1&email=${encodeURIComponent(email)}`, { headers: H });
  const found = await q.json();
  let user = (found.users || []).find((u) => u.email === email);
  if (!user) {
    const res = await fetch(`${URL_}/auth/v1/admin/users`, {
      method: 'POST', headers: H,
      body: JSON.stringify({ email, email_confirm: true, user_metadata: { seeded: 'hub-fictional' } }),
    });
    const created = await res.json();
    if (!res.ok) throw new Error(`create user ${email}: ${JSON.stringify(created).slice(0, 200)}`);
    user = created;
  }
  await upsert('profiles', [{ id: user.id, email, first_name: first, last_name: last }], 'id');
  return user.id;
}

// ── fixed IDs (idempotency) ─────────────────────────────────────────────────
const ORG = '5eed0000-0000-4000-8000-000000000001';
const LOC = '5eed0000-0000-4000-8000-000000000002';
const MEM = {
  maria: '5eed0000-0000-4000-8000-000000000011',
  kate: '5eed0000-0000-4000-8000-000000000012',
  bree: '5eed0000-0000-4000-8000-000000000013',
  jordan: '5eed0000-0000-4000-8000-000000000014',
  taylor: '5eed0000-0000-4000-8000-000000000015',
};
const TPL = '5eed0000-0000-4000-8000-000000000020';
const PLAN = '5eed0000-0000-4000-8000-000000000030';
const QUIZ = '5eed0000-0000-4000-8000-000000000040';
const skillId = (n) => `5eed0000-0000-4000-8000-0000000001${String(n).padStart(2, '0')}`;
const taskId = (n) => `5eed0000-0000-4000-8000-0000000002${String(n).padStart(2, '0')}`;
const sopId = (n) => `5eed0000-0000-4000-8000-0000000003${String(n).padStart(2, '0')}`;
const esId = (n) => `5eed0000-0000-4000-8000-0000000004${String(n).padStart(2, '0')}`;

// 24 stock skills, 8 categories × 3 (radiology category text renders the
// Texas TSBDE note in the UI wherever the category shows).
const SKILLS = [
  ['Sterilization & Infection Control', 'Instrument processing, dirty to sterile', 'Full flow: transport, ultrasonic, packaging, autoclave, storage.'],
  ['Sterilization & Infection Control', 'Autoclave cycles & indicators', 'Choose the right cycle, read chemical/biological indicators, log spore tests.'],
  ['Sterilization & Infection Control', 'Operatory disinfection & barriers', 'Between-patient turnover to office standard.'],
  ['Operatory & Setup', 'Tray setup: exam', 'Standard exam tray, arranged to office standard.'],
  ['Operatory & Setup', 'Tray setup: composite', 'Composite restorative tray, including shades and etch/bond.'],
  ['Operatory & Setup', 'Equipment start-up & shutdown', 'Morning and evening equipment routine, including compressor and vacuum.'],
  ['Chairside Assisting', 'Suction & isolation', 'HVE and saliva ejector placement that keeps the field dry without fighting the doctor.'],
  ['Chairside Assisting', 'Instrument transfer', 'Smooth four-handed exchanges with correct grasp.'],
  ['Chairside Assisting', 'Anticipating the next step', 'Reads the procedure and has the next thing ready.'],
  ['Impressions & Lab', 'Alginate impressions', 'Mixing, loading, seating, and removing without voids.'],
  ['Impressions & Lab', 'Pouring & trimming models', 'Stone models poured bubble-free and trimmed clean.'],
  ['Impressions & Lab', 'Lab case logging', 'Every outgoing/incoming case logged and tracked.'],
  ['Radiology Workflow', 'Sensor care & image import', 'Handles sensors safely; imports and files images correctly. (Non-exposure tasks only.)'],
  ['Radiology Workflow', 'Mounting & labeling images', 'Mounts, labels, and attaches images to the right chart.'],
  ['Radiology Workflow', 'Retake & quality policy', 'Knows the office retake policy and image-quality standard. (Non-exposure tasks only.)'],
  ['Front Office Basics', 'Phone greeting & messages', 'Answers to office standard; messages reach the right person.'],
  ['Front Office Basics', 'Check-in / check-out flow', 'Arrivals, forms, collections, next visit scheduled.'],
  ['Front Office Basics', 'Appointment confirmation run', 'Works a full confirmation list accurately.'],
  ['Patient Communication', 'Explaining without jargon', 'Describes visits and instructions in plain words.'],
  ['Patient Communication', 'Calming a nervous patient', 'Slows down, names the worry, offers the comfort menu.'],
  ['Patient Communication', 'Handling a payment conversation', 'Kind, clear, and accurate about balances.'],
  ['Practice Software', 'Chart lookup & notes', 'Finds patients fast; writes notes others can act on.'],
  ['Practice Software', 'Schedule navigation', 'Reads and moves the schedule without double-booking.'],
  ['Practice Software', 'Document scanning & filing', 'Scans and files to the right chart, right category.'],
];

// Green Dental Assistant template — 27 tasks across d30/d60/d90.
const TEMPLATE_TASKS = [
  // d30 (12)
  { phase: 'd30', day: 1, kind: 'task', title: 'Office tour: operatories, sterilization, lab, supplies' },
  { phase: 'd30', day: 1, kind: 'task', title: 'Meet the team and your training buddy' },
  { phase: 'd30', day: 2, kind: 'sop_read', title: 'Read: morning opening routine' },
  { phase: 'd30', day: 3, kind: 'task', title: 'Shadow a full patient day, notes only' },
  { phase: 'd30', day: 5, kind: 'skill', title: 'Skill: operatory disinfection & barriers', skill_title: 'Operatory disinfection & barriers' },
  { phase: 'd30', day: 7, kind: 'sop_read', title: 'Read: sterilization flow, dirty to sterile' },
  { phase: 'd30', day: 8, kind: 'checkin', title: 'Week-1 check-in with your manager' },
  { phase: 'd30', day: 10, kind: 'skill', title: 'Skill: instrument processing, dirty to sterile', skill_title: 'Instrument processing, dirty to sterile' },
  { phase: 'd30', day: 12, kind: 'quiz', title: 'Knowledge check: sterilization basics' },
  { phase: 'd30', day: 15, kind: 'skill', title: 'Skill: tray setup — exam', skill_title: 'Tray setup: exam' },
  { phase: 'd30', day: 21, kind: 'skill', title: 'Skill: alginate impressions', skill_title: 'Alginate impressions' },
  { phase: 'd30', day: 27, kind: 'checkin', title: 'Day-30 review: checklist walkthrough + 60-day goals' },
  // d60 (8)
  { phase: 'd60', day: 33, kind: 'task', title: 'Own your station setup and turnover all week' },
  { phase: 'd60', day: 36, kind: 'skill', title: 'Skill: suction & isolation', skill_title: 'Suction & isolation' },
  { phase: 'd60', day: 40, kind: 'skill', title: 'Skill: instrument transfer', skill_title: 'Instrument transfer' },
  { phase: 'd60', day: 43, kind: 'sop_read', title: 'Read: composite tray setup' },
  { phase: 'd60', day: 47, kind: 'skill', title: 'Skill: tray setup — composite', skill_title: 'Tray setup: composite' },
  { phase: 'd60', day: 50, kind: 'task', title: 'Cross-train: one hour at the front desk' },
  { phase: 'd60', day: 54, kind: 'checkin', title: 'Day-60 review with your trainer' },
  { phase: 'd60', day: 58, kind: 'skill', title: 'Skill: pouring & trimming models', skill_title: 'Pouring & trimming models' },
  // d90 (7)
  { phase: 'd90', day: 65, kind: 'task', title: 'Run your area solo for a full week' },
  { phase: 'd90', day: 70, kind: 'skill', title: 'Skill: anticipating the next step', skill_title: 'Anticipating the next step' },
  { phase: 'd90', day: 75, kind: 'task', title: 'Teach the opening routine back to a teammate' },
  { phase: 'd90', day: 78, kind: 'skill', title: 'Skill: lab case logging', skill_title: 'Lab case logging' },
  { phase: 'd90', day: 82, kind: 'sop_read', title: 'Read: retake & image quality policy' },
  { phase: 'd90', day: 85, kind: 'checkin', title: 'Day-90 readiness review' },
  { phase: 'd90', day: 88, kind: 'task', title: 'Own one supply category with the ordering system' },
];

const SOPS = [
  {
    id: sopId(1), kind: 'tray_setup', title: 'Composite tray setup',
    body: [
      { tray: [['Mirror', 'far left'], ['Explorer', 'left'], ['Cotton pliers', 'left'], ['Composite gun', 'center'], ['Shade guide', 'center'], ['Etch & bond kit', 'right'], ['Curing light (check battery)', 'far right'], ['2x2 gauze + articulating paper', 'top edge']] },
      { step: 'Pull the patient chart and confirm the planned shade before setup.' },
      { step: 'Barriers on light handles, chair controls, and x-ray head.' },
      { step: 'Set the tray as diagrammed; curing light tested before the doctor sits down.' },
      { step: 'After the visit: sharps check, tray to sterilization, room turnover per the disinfection SOP.' },
    ],
  },
  {
    id: sopId(2), kind: 'sterilization', title: 'Sterilization flow, dirty to sterile',
    body: [
      { step: 'Transport instruments in a closed cassette — never loose in hands.' },
      { step: 'Ultrasonic 8 minutes, lid on; rinse and dry completely.' },
      { step: 'Package with internal indicator; seal and date every pouch.' },
      { step: 'Autoclave on the wrapped cycle; do not stack pouches flat against each other.' },
      { step: 'Weekly spore test every Monday — log the result before the first patient.' },
      { step: 'Sterile storage: first in, first out; anything torn or wet goes back through.' },
    ],
  },
  {
    id: sopId(3), kind: 'front_office', title: 'Phone greeting & messages',
    body: [
      { step: 'Answer inside three rings: "Thank you for calling Sunrise Family Dental, this is [name]."' },
      { step: 'Never park a caller on hold longer than a minute without checking back.' },
      { step: 'Messages go in the software, tagged to the right person — no sticky notes.' },
      { step: 'Emergencies: get name, number, and what happened, then flag the doctor immediately.' },
    ],
  },
  {
    id: sopId(4), kind: 'procedure', title: 'Morning opening routine',
    body: [
      { step: 'Unlock, lights, thermostat; flip compressor and vacuum on.' },
      { step: 'Run waterlines 2 minutes per operatory.' },
      { step: 'Turn on sterilizer and run the first cycle check.' },
      { step: 'Set operatories for the first hour from the schedule.' },
      { step: 'Huddle at 7:50: today’s schedule, lab cases due, anything tight.' },
    ],
  },
  {
    id: sopId(5), kind: 'procedure', title: 'Evening closing routine',
    body: [
      { step: 'Last instruments through sterilization; nothing sits dirty overnight.' },
      { step: 'Operatories broken down, barriers off, surfaces disinfected.' },
      { step: 'Vacuum lines cleaned; compressor and vacuum off.' },
      { step: 'Tomorrow’s lab cases confirmed on the shelf.' },
      { step: 'Locks, alarm, lights.' },
    ],
  },
];

// 3 ORIGINAL sterilization questions (never textbook/test-bank content).
const QUIZ_QUESTIONS = [
  {
    prompt: 'A pouch comes out of the autoclave and the internal indicator has NOT changed color. What do you do?',
    options: ['Use it if the outside tape changed', 'Set it aside and re-process the instruments through the full cycle', 'Wipe the instruments with disinfectant and use them', 'Ask the doctor to decide'],
    correct_index: 1,
  },
  {
    prompt: 'Why does every pouch get dated?',
    options: ['To track who packaged it', 'For first-in-first-out storage and recall if a spore test fails', 'It’s required by the manufacturer only', 'Decoration'],
    correct_index: 1,
  },
  {
    prompt: 'The weekly spore test comes back positive (failed). What happens first?',
    options: ['Keep using the sterilizer but re-test tomorrow', 'The sterilizer comes out of service and loads since the last good test are recalled per the log', 'Run an empty cycle and continue', 'Switch indicator brands'],
    correct_index: 1,
  },
];

function isoDaysAgo(n) {
  const d = new Date(Date.now() - n * 86400000);
  return d.toISOString().slice(0, 10);
}

async function main() {
  console.log(`Seeding FICTIONAL hub demo data → ${URL_}`);

  // people
  const uid = {};
  uid.maria = await ensureUser('maria.alvarez.demo@example.com', 'Maria', 'Alvarez');
  uid.kate = await ensureUser('kate.nguyen.demo@example.com', 'Kate', 'Nguyen');
  uid.bree = await ensureUser('bree.colton.demo@example.com', 'Bree', 'Colton');
  uid.jordan = await ensureUser('jordan.reyes.demo@example.com', 'Jordan', 'Reyes');
  uid.taylor = await ensureUser('taylor.brooks.demo@example.com', 'Taylor', 'Brooks');
  console.log('✓ 5 fictional auth users + profiles');

  await upsert('hub_organizations', [{
    id: ORG, name: 'Sunrise Family Dental', practice_type: 'General dentistry',
    plan_tier: 'free', settings: { demo: true, label: 'Sample data — fictional' },
  }]);
  await upsert('hub_locations', [{ id: LOC, org_id: ORG, name: 'Main location', is_primary: true }]);
  await upsert('hub_org_memberships', [
    { id: MEM.maria, org_id: ORG, profile_id: uid.maria, role: 'owner', title: 'Dentist & owner' },
    { id: MEM.kate, org_id: ORG, profile_id: uid.kate, role: 'manager', title: 'Office manager' },
    { id: MEM.bree, org_id: ORG, profile_id: uid.bree, role: 'trainer', title: 'RDA, lead assistant' },
    { id: MEM.jordan, org_id: ORG, profile_id: uid.jordan, role: 'employee', title: 'Dental assistant (new hire)' },
    { id: MEM.taylor, org_id: ORG, profile_id: uid.taylor, role: 'employee', title: 'Front office (example)', status: 'archived', archived_at: new Date().toISOString(), archive_reason: 'Example of an archived record (fictional)' },
  ]);
  console.log('✓ Sunrise Family Dental + 5 memberships (1 archived)');

  await upsert('hub_skills', SKILLS.map((s, i) => ({
    id: skillId(i + 1), org_id: null, category: s[0], title: s[1], description: s[2],
    requires_observation: true, sort: i,
  })));
  console.log('✓ 24 stock skills in 8 categories');

  await upsert('hub_templates', [{
    id: TPL, org_id: null, slug: 'green-dental-assistant', title: 'Green Dental Assistant (starter)',
    role_target: 'dental_assistant', body: { tasks: TEMPLATE_TASKS },
  }]);
  console.log(`✓ Green Dental Assistant template (${TEMPLATE_TASKS.length} tasks)`);

  await upsert('hub_sops', SOPS.map((s) => ({ ...s, org_id: ORG, status: 'active' })));
  console.log('✓ 5 SOPs (incl. composite tray layout)');

  await upsert('hub_quizzes', [{
    id: QUIZ, org_id: null, slug: 'sterilization-basics', title: 'Sterilization basics', questions: QUIZ_QUESTIONS,
  }]);
  console.log('✓ sterilization quiz (3 original questions)');

  // Jordan, day 12 of the plan
  const startDate = isoDaysAgo(11);
  await upsert('hub_plans', [{
    id: PLAN, org_id: ORG, employee_membership_id: MEM.jordan, template_id: TPL,
    start_date: startDate, status: 'active',
  }]);
  const skillIdByTitle = {};
  SKILLS.forEach((s, i) => { skillIdByTitle[s[1]] = skillId(i + 1); });
  // 8 done: the 7 non-skill tasks through day 12, plus the day-5 skill task,
  // which completed via its sign-off (the disinfection skill is independent).
  const doneTitles = new Set(TEMPLATE_TASKS.filter((t) => t.day <= 12 && t.kind !== 'skill').map((t) => t.title));
  doneTitles.add('Skill: operatory disinfection & barriers');
  await upsert('hub_plan_tasks', TEMPLATE_TASKS.map((t, i) => ({
    id: taskId(i + 1), plan_id: PLAN, org_id: ORG, phase: t.phase, day_offset: t.day,
    kind: t.kind, title: t.title,
    skill_id: t.skill_title ? skillIdByTitle[t.skill_title] : null,
    quiz_id: t.kind === 'quiz' ? QUIZ : null,
    status: doneTitles.has(t.title) ? 'done' : 'todo',
    completed_at: doneTitles.has(t.title) ? new Date().toISOString() : null,
    completed_by: doneTitles.has(t.title) ? MEM.jordan : null,
    sort: i,
  })));
  console.log(`✓ Jordan's plan (started ${startDate}, ${doneTitles.size} tasks done)`);

  // 6 skill records — incl. needs_coaching alginate with re-check + note
  const skillStates = [
    ['Operatory disinfection & barriers', 'independent', null, null],
    ['Instrument processing, dirty to sterile', 'practicing', null, null],
    ['Autoclave cycles & indicators', 'observed', null, null],
    ['Tray setup: exam', 'practicing', null, null],
    ['Alginate impressions', 'needs_coaching', isoDaysAgo(-5), 'Water ratio — mix ran soupy twice. Redo with Bree on the re-check date.'],
    ['Suction & isolation', 'observed', null, null],
  ];
  await upsert('hub_employee_skills', skillStates.map((s, i) => ({
    id: esId(i + 1), org_id: ORG, employee_membership_id: MEM.jordan,
    skill_id: skillIdByTitle[s[0]], state: s[1], signed_off_by: MEM.bree,
    signed_off_at: new Date().toISOString(), recheck_at: s[2], note: s[3],
  })), 'employee_membership_id,skill_id');
  // history rows (append-only; idempotent via fixed ids)
  await upsert('hub_skill_signoff_events', skillStates.map((s, i) => ({
    id: `5eed0000-0000-4000-8000-0000000005${String(i + 1).padStart(2, '0')}`,
    org_id: ORG, employee_skill_id: esId(i + 1), actor_membership_id: MEM.bree,
    from_state: 'not_started', to_state: s[1], note: s[3],
  })));
  console.log('✓ 6 skill records (incl. needs-coaching alginate w/ re-check) + history');

  await upsert('hub_quiz_attempts', [{
    id: '5eed0000-0000-4000-8000-000000000601', org_id: ORG, quiz_id: QUIZ,
    employee_membership_id: MEM.jordan, score_pct: 80, passed: true,
  }]);
  await upsert('hub_checkins', [{
    id: '5eed0000-0000-4000-8000-000000000701', org_id: ORG,
    employee_membership_id: MEM.jordan, author_membership_id: MEM.kate,
    week_of: isoDaysAgo(4), wins: 'Turnover speed way up; patients like Jordan already.',
    needs: 'Alginate consistency; asks before acting on sterilization edge cases (good instinct, needs reps).',
    next_plan: 'Alginate re-check with Bree; own the ultrasonic station all week.',
  }], 'employee_membership_id,week_of');
  console.log("✓ quiz attempt (80%, passed) + week-2 check-in");

  // 2 invitations: 1 pending, 1 expired (dummy token hashes, fictional emails)
  const sha = async (s) => {
    const { createHash } = await import('node:crypto');
    return createHash('sha256').update(s).digest('hex');
  };
  await upsert('hub_invitations', [
    {
      id: '5eed0000-0000-4000-8000-000000000801', org_id: ORG,
      email: 'newassistant.demo@example.com', role: 'employee',
      token_hash: await sha('seed-pending-token-fictional'),
      expires_at: new Date(Date.now() + 6 * 86400000).toISOString(),
      status: 'pending', invited_by: MEM.kate,
    },
    {
      id: '5eed0000-0000-4000-8000-000000000802', org_id: ORG,
      email: 'oldinvite.demo@example.com', role: 'trainer',
      token_hash: await sha('seed-expired-token-fictional'),
      expires_at: new Date(Date.now() - 3 * 86400000).toISOString(),
      status: 'expired', invited_by: MEM.kate,
    },
  ]);
  console.log('✓ 2 invitations (1 pending, 1 expired)');

  console.log('\n✓ Seed complete (fictional data only). Demo sign-in: use magic links for');
  console.log('  maria.alvarez.demo@example.com (owner) / bree.colton.demo@example.com (trainer)');
  console.log('  jordan.reyes.demo@example.com (employee) via the staging Supabase auth.');
}

main().catch((e) => { console.error('✗ Seed failed:', e.message); process.exit(1); });
