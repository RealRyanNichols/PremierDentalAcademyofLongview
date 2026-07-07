-- Day-One Paperwork: electronic enrollment forms filled by students on their
-- phones (applied to production via Supabase MCP on 2026-07-07; captured here
-- for reproducibility). Written ONLY by the enroll-paperwork edge function
-- (service role); staff read them at /admin/paperwork. PII — admin-only reads.
create table if not exists public.enrollment_forms (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references auth.users(id) on delete set null,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text not null,
  dob date,
  address text,
  emergency_name text,
  emergency_phone text,
  cohort_name text,
  start_date date,
  payment_choice text not null,          -- cash_paid_full | cash_deposit_plan | card_plan | card_full | wioa | other
  payment_notes text,
  agreed_terms boolean not null default false,
  signature text not null,               -- typed full legal name (clickwrap)
  signed_at timestamptz not null default now(),
  user_agent text,
  extra jsonb,
  created_at timestamptz not null default now()
);

create index if not exists enrollment_forms_created_idx on public.enrollment_forms (created_at desc);

alter table public.enrollment_forms enable row level security;

drop policy if exists "enrollment_forms_admin_read" on public.enrollment_forms;
create policy "enrollment_forms_admin_read" on public.enrollment_forms
  for select to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
    or coalesce((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false)
  );
