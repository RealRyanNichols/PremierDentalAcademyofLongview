-- Student → teacher questions: a simple two-way Q&A channel.
-- Students ask from the dashboard ("Ask your teacher"); staff answer at
-- /admin/questions; the student sees the answer on their dashboard.
-- Applied to production via Supabase MCP on 2026-07-02; captured here for
-- reproducibility. Idempotent.

create table if not exists public.student_questions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users(id) on delete cascade,
  question text not null,
  topic text,                                  -- optional: 'course' | 'trainer' | 'schedule' | 'billing' | 'other'
  answer text,
  answered_by uuid references auth.users(id) on delete set null,
  answered_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists student_questions_student_idx on public.student_questions (student_id, created_at desc);
create index if not exists student_questions_unanswered_idx on public.student_questions (created_at desc) where answer is null;

alter table public.student_questions enable row level security;

-- A signed-in student can ask a question as themselves.
drop policy if exists "questions_insert_own" on public.student_questions;
create policy "questions_insert_own" on public.student_questions
  for insert to authenticated
  with check (auth.uid() = student_id);

-- Students read their own thread; admins read everything. Admin is recognized
-- via profiles.is_admin OR the app_metadata JWT claim (kept in sync by the
-- 20260608_admin_jwt_claim trigger).
drop policy if exists "questions_select_own_or_admin" on public.student_questions;
create policy "questions_select_own_or_admin" on public.student_questions
  for select to authenticated
  using (
    auth.uid() = student_id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
    or coalesce((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false)
  );

-- Only admins can answer (update).
drop policy if exists "questions_update_admin" on public.student_questions;
create policy "questions_update_admin" on public.student_questions
  for update to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
    or coalesce((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false)
  )
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
    or coalesce((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false)
  );
