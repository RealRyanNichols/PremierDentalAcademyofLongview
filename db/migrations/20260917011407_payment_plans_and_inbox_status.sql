-- RECOVERED FROM LIVE on 2026-09-24. Applied 2026-09-17 01:14 UTC, but the file was never committed.
-- Source: supabase_migrations.schema_migrations version 20260917011407 ("payment_plans_and_inbox_status").
-- ALREADY APPLIED — never run it again. It is here so the repo shows what the database holds.
-- Owner tools: student_payment_plans + admin_inbox_status + student_question_queue view.
-- Everything below the marker line is byte-identical to the stored statement
-- (md5 737fa08db587390b4aa348a29e190c7d); scripts/check-migrations.mjs verifies that on every npm test.
-- ---- recovered statement below ----
-- Additive owner tools; no existing payments, messages or billing mandates change.
begin;
create table public.student_payment_plans (
  student_id uuid primary key references public.profiles(id),
  class_start_date date not null,
  total_cents integer not null check (total_cents > 0),
  down_cents integer not null check (down_cents >= 0 and down_cents <= total_cents),
  cadence text not null check (cadence in ('weekly','monthly','full')),
  installment_count integer not null check (installment_count between 1 and 60),
  updated_at timestamptz not null default now(),
  updated_by uuid not null references auth.users(id)
);
alter table public.student_payment_plans enable row level security;
create policy payment_plans_admin on public.student_payment_plans for all to authenticated
  using (exists (select 1 from public.profiles where id=(select auth.uid()) and is_admin=true))
  with check (exists (select 1 from public.profiles where id=(select auth.uid()) and is_admin=true));
grant select,insert,update on public.student_payment_plans to authenticated;
revoke all on public.student_payment_plans from anon;

create table public.admin_inbox_status (
  scope text not null check (scope in ('communication','question','student')),
  thread_key text not null,
  status text not null check (status in ('open','replied','handled')),
  last_message_at timestamptz not null,
  updated_at timestamptz not null default now(),
  updated_by uuid not null references auth.users(id),
  primary key(scope,thread_key)
);
alter table public.admin_inbox_status enable row level security;
create policy inbox_status_staff on public.admin_inbox_status for all to authenticated
  using (exists (select 1 from public.profiles where id=(select auth.uid()) and (is_admin=true or (is_instructor=true and admin_inbox_status.scope='question'))))
  with check (exists (select 1 from public.profiles where id=(select auth.uid()) and (is_admin=true or (is_instructor=true and admin_inbox_status.scope='question'))));
grant select,insert,update on public.admin_inbox_status to authenticated;
revoke all on public.admin_inbox_status from anon;
create view public.student_question_queue with (security_invoker=true) as
select q.id from public.student_questions q
left join public.admin_inbox_status s on s.scope='question' and s.thread_key=q.id::text
where case when s.last_message_at >= q.created_at then s.status else case when q.answer is null or q.answer='' then 'open' else 'replied' end end='open';
grant select on public.student_question_queue to authenticated;
revoke all on public.student_question_queue from anon;
commit;
