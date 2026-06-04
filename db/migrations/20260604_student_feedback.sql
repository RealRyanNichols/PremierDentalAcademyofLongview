-- Live student feedback: weekly pulse ratings + free-form suggestions.
-- Applied to production via Supabase MCP on 2026-06-04; captured here for
-- reproducibility. Idempotent.

create table if not exists public.student_feedback (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references auth.users(id) on delete set null,
  kind text not null default 'pulse',          -- 'pulse' | 'suggestion'
  prompt text,
  rating int check (rating between 1 and 5),
  comment text,
  page text,
  created_at timestamptz not null default now()
);

create index if not exists student_feedback_created_idx on public.student_feedback (created_at desc);
create index if not exists student_feedback_student_idx on public.student_feedback (student_id);

alter table public.student_feedback enable row level security;

-- Students can submit their own feedback.
drop policy if exists "feedback_insert_own" on public.student_feedback;
create policy "feedback_insert_own" on public.student_feedback
  for insert to authenticated
  with check (auth.uid() = student_id);

-- Students can read their own; admins can read everything.
drop policy if exists "feedback_select_own_or_admin" on public.student_feedback;
create policy "feedback_select_own_or_admin" on public.student_feedback
  for select to authenticated
  using (
    auth.uid() = student_id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );
