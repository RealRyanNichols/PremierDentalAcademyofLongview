-- Sponsor-a-Student program (/sponsor-a-student).
-- Local businesses sponsor a student's tuition; students who can't afford
-- class apply for sponsorship. Both application forms insert into public.leads
-- (existing anon INSERT policy) with sources 'sponsor-student' / 'sponsor-business'.
--
-- This table is the PUBLIC, ANONYMIZED gallery of students waiting for a
-- sponsor. Rows are created by STAFF ONLY after vetting the student and
-- getting their explicit consent to be listed. display_name is first name +
-- last initial only — never emails, phones, or full names (no PII).
-- Applied to production via Supabase MCP on 2026-07-02; captured here for
-- reproducibility. Idempotent.

create table if not exists public.sponsor_profiles (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,               -- e.g. "Brittany M." — first name + last initial ONLY
  story text not null,                      -- short, student-approved blurb (goal, situation)
  city text,                                -- e.g. "Longview" (town only)
  goal_cents int not null default 350000,   -- default = $3,500 plan total
  raised_cents int not null default 0,
  status text not null default 'pending',   -- pending | approved | sponsored | archived
  consent_confirmed boolean not null default false,  -- student agreed in writing to be listed
  created_at timestamptz not null default now()
);

create index if not exists sponsor_profiles_status_idx on public.sponsor_profiles (status, created_at desc);

alter table public.sponsor_profiles enable row level security;

-- The public gallery: anyone can read APPROVED, CONSENTED profiles (and
-- 'sponsored' success stories). Pending/archived rows stay staff-only.
drop policy if exists "sponsor_profiles_public_read" on public.sponsor_profiles;
create policy "sponsor_profiles_public_read" on public.sponsor_profiles
  for select to anon, authenticated
  using (consent_confirmed = true and status in ('approved', 'sponsored'));

-- Staff manage rows (create after vetting + consent, update as funds arrive).
drop policy if exists "sponsor_profiles_admin_all" on public.sponsor_profiles;
create policy "sponsor_profiles_admin_all" on public.sponsor_profiles
  for all to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
    or coalesce((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false)
  )
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
    or coalesce((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false)
  );
