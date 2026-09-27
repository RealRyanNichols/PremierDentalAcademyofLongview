import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

// 2026-08-22: verify_jwt flipped to true. This function runs with the service role and
// seeds/overwrites a test account; it was previously reachable by anyone on the internet
// who knew the hardcoded header secret below. It is a dev tool, so it was kept rather than
// retired — but it now also requires a valid Supabase JWT to reach at all.
const SECRET = 'REDACTED-see-migration/supabase-export/README';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req: Request) => {
  if (req.headers.get('x-pda-secret') !== SECRET) {
    return new Response('unauthorized', { status: 401 });
  }
  const sb = createClient(SUPABASE_URL, SERVICE_ROLE);

  const TEST_EMAIL = 'test@premierdentalacademyoflongview.com';
  const TEST_PASSWORD = 'REDACTED-see-migration/supabase-export/README';
  const TEST_FIRST = 'Ryan';
  const TEST_LAST  = 'Test';

  // 1. Try to fetch existing user
  const { data: existing } = await sb.auth.admin.listUsers();
  let user = existing.users.find(u => u.email === TEST_EMAIL);

  if (user) {
    // Update password just in case
    await sb.auth.admin.updateUserById(user.id, { password: TEST_PASSWORD, email_confirm: true });
  } else {
    const { data: created, error } = await sb.auth.admin.createUser({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      email_confirm: true,
      user_metadata: { first_name: TEST_FIRST, last_name: TEST_LAST }
    });
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'content-type': 'application/json' } });
    user = created.user!;
  }

  // Wait a beat for the trigger to create the profile row
  await new Promise(r => setTimeout(r, 500));

  // Upsert profile with rich data
  await sb.from('profiles').upsert({
    id: user.id,
    email: TEST_EMAIL,
    first_name: TEST_FIRST,
    last_name: TEST_LAST,
    phone: '(903) 913-6444',
    city: 'Longview',
    state: 'TX',
    enrollment_path: 'in_person'
  });

  // Pick first open cohort for enrollment
  const { data: cohort } = await sb.from('cohorts').select('id').eq('status', 'open').order('start_date').limit(1).single();

  if (cohort) {
    // Clean prior enrollments to avoid duplicates
    await sb.from('enrollments').delete().eq('student_id', user.id);
    await sb.from('enrollments').insert({
      student_id: user.id,
      cohort_id: cohort.id,
      status: 'active',
      progress_percent: 47
    });
  }

  // Seed module progress for modules 1-6 (completed) + module 7 (in progress)
  await sb.from('module_progress').delete().eq('student_id', user.id);
  const completedModules = [
    [1, 8, 100, '2026-03-12'],
    [2, 6, 92, '2026-03-19'],
    [3, 10, 95, '2026-03-26'],
    [4, 12, 88, '2026-04-05'],
    [5, 14, 91, '2026-04-15'],
    [6, 10, 86, '2026-04-22']
  ];
  for (const [m, lessons, score, date] of completedModules) {
    for (let l = 1; l <= (lessons as number); l++) {
      await sb.from('module_progress').insert({
        student_id: user.id,
        module_number: m,
        lesson_number: l,
        completed_at: date,
        quiz_score: score
      });
    }
  }
  // Module 7 in progress (lesson 1-2 done, on lesson 3)
  for (let l = 1; l <= 2; l++) {
    await sb.from('module_progress').insert({
      student_id: user.id,
      module_number: 7,
      lesson_number: l,
      completed_at: '2026-04-30',
      quiz_score: 90
    });
  }

  // Seed a couple of mock exam attempts
  await sb.from('mock_exam_attempts').delete().eq('student_id', user.id);
  await sb.from('mock_exam_attempts').insert([
    {
      student_id: user.id,
      started_at: '2026-04-20T14:00:00Z',
      completed_at: '2026-04-20T15:55:00Z',
      score_percent: 76.0,
      total_questions: 50,
      correct_count: 38,
      time_taken_seconds: 6900,
      topic_breakdown: { 'Anatomy':{total:7,correct:6}, 'Infection Control':{total:6,correct:5}, 'Radiology':{total:6,correct:4}, 'Chairside':{total:5,correct:4}, 'Materials':{total:5,correct:3}, 'Operative':{total:3,correct:2}, 'Endodontics':{total:2,correct:2}, 'Periodontics':{total:3,correct:2}, 'Surgery':{total:2,correct:2}, 'Pharmacology':{total:3,correct:3}, 'Emergency':{total:3,correct:2}, 'Texas RDA':{total:3,correct:2}, 'Patient Management':{total:2,correct:1} }
    },
    {
      student_id: user.id,
      started_at: '2026-04-28T09:00:00Z',
      completed_at: '2026-04-28T10:38:00Z',
      score_percent: 88.0,
      total_questions: 50,
      correct_count: 44,
      time_taken_seconds: 5880,
      topic_breakdown: { 'Anatomy':{total:7,correct:7}, 'Infection Control':{total:6,correct:6}, 'Radiology':{total:6,correct:6}, 'Chairside':{total:5,correct:5}, 'Materials':{total:5,correct:4}, 'Operative':{total:3,correct:3}, 'Endodontics':{total:2,correct:2}, 'Periodontics':{total:3,correct:2}, 'Surgery':{total:2,correct:2}, 'Pharmacology':{total:3,correct:3}, 'Emergency':{total:3,correct:2}, 'Texas RDA':{total:3,correct:1}, 'Patient Management':{total:2,correct:1} }
    }
  ]);

  // Seed a tutoring session (booked + one completed)
  await sb.from('tutoring_sessions').delete().eq('student_id', user.id);
  await sb.from('tutoring_sessions').insert([
    { student_id: user.id, service_type: 'tutoring1on1', scheduled_at: '2026-04-15T19:00:00Z', duration_minutes: 60, status: 'completed', notes: 'Reviewed Class II amalgam preps' },
    { student_id: user.id, service_type: 'mockBoards', scheduled_at: '2026-05-19T18:00:00Z', duration_minutes: 120, status: 'scheduled', notes: 'Final mock before state board' }
  ]);

  // Seed purchase
  await sb.from('purchases').delete().eq('student_id', user.id);
  await sb.from('purchases').insert({
    student_id: user.id,
    product_key: 'rdaWeekly',
    product_label: 'RDA Program — Weekly Plan',
    amount_cents: 17500,
    payment_type: 'subscription',
    status: 'active',
    metadata: { plan: 'weekly', installment: 8, total_installments: 12 }
  });

  return new Response(JSON.stringify({
    ok: true,
    user_id: user.id,
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    seeded: { profile: true, enrollment: !!cohort, module_progress: 'modules 1-6 complete, 7 in progress', mock_exams: 2, tutoring: 2, purchases: 1 }
  }, null, 2), { headers: { 'content-type': 'application/json' } });
});
