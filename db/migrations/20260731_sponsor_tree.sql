-- Sponsor Tree buildout (/sponsor-a-student + /admin/sponsors).
-- Turns the sponsor-a-student page from two lead forms into the full "angel
-- tree for careers" it describes:
--   * public.sponsorships — the money ledger (pledges + payments). Contains
--     business contact PII, so it is ADMIN-ONLY under RLS. Online Square
--     payments are recorded by api/sponsor.js with the service role key.
--   * rollup trigger — keeps sponsor_profiles.raised_cents equal to the sum
--     of PAID sponsorships for that student, and flips approved → sponsored
--     automatically when the goal is met (and back if a payment is voided).
--     Zero manual math for Amanda.
--   * sponsor_tree_stats() — public RPC returning AGGREGATES ONLY (students
--     waiting/sponsored, dollars raised, sponsor count). No PII.
--   * sponsor_wall() — public RPC listing ONLY the recognition names of paid
--     sponsors who opted in to public thanks (public_thanks = true). No PII.
-- Applied to production via Supabase MCP on 2026-07-31; captured here for
-- reproducibility. Idempotent.

-- ── 1) The ledger ──────────────────────────────────────────────────────────
create table if not exists public.sponsorships (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.sponsor_profiles(id) on delete set null,
  business_name text,
  contact_name text,
  email text,
  phone text,
  amount_cents int not null check (amount_cents > 0),
  status text not null default 'pledged'
    check (status in ('pledged', 'invoiced', 'paid', 'canceled')),
  method text,                     -- 'square-online' | 'invoice' | 'cash' | 'check' | …
  square_payment_id text,
  square_receipt_url text,
  public_thanks boolean not null default false,   -- sponsor opted in to public recognition
  recognition_name text,           -- how to credit them publicly (business name, usually)
  notes text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create index if not exists sponsorships_profile_idx on public.sponsorships (profile_id, status);
create index if not exists sponsorships_status_idx on public.sponsorships (status, created_at desc);
-- One ledger row per Square payment — re-recording the same payment is a no-op
-- (plain unique index: Postgres allows many NULLs, so manual rows are fine,
-- and PostgREST on_conflict=square_payment_id can target it).
create unique index if not exists sponsorships_square_payment_uq
  on public.sponsorships (square_payment_id);

alter table public.sponsorships enable row level security;

-- Admin-only. No anon/authenticated read: rows hold sponsor contact PII.
-- api/sponsor.js writes with the service role key (bypasses RLS, server only).
drop policy if exists "sponsorships_admin_all" on public.sponsorships;
create policy "sponsorships_admin_all" on public.sponsorships
  for all to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
    or coalesce((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false)
  )
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
    or coalesce((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false)
  );

-- ── 2) Rollup: paid money → student progress → auto "sponsored" ────────────
create or replace function public.sponsor_rollup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  pids uuid[];
  pid uuid;
begin
  if tg_op = 'INSERT' then
    pids := array[new.profile_id];
  elsif tg_op = 'DELETE' then
    pids := array[old.profile_id];
  else
    pids := array[new.profile_id, old.profile_id];
  end if;

  foreach pid in array pids loop
    continue when pid is null;
    update public.sponsor_profiles sp
       set raised_cents = coalesce((
             select sum(s.amount_cents) from public.sponsorships s
              where s.profile_id = sp.id and s.status = 'paid'), 0)
     where sp.id = pid;
    -- Flip approved → sponsored at goal; revert if a payment is voided.
    -- Never touches pending/archived rows — those stay staff-controlled.
    update public.sponsor_profiles sp
       set status = case
             when sp.raised_cents >= sp.goal_cents and sp.status = 'approved' then 'sponsored'
             when sp.raised_cents <  sp.goal_cents and sp.status = 'sponsored' then 'approved'
             else sp.status
           end
     where sp.id = pid;
  end loop;
  return null;
end;
$$;

-- Trigger-only: never callable via PostgREST RPC (security advisor clean).
revoke all on function public.sponsor_rollup() from public, anon, authenticated;

drop trigger if exists trg_sponsor_rollup on public.sponsorships;
create trigger trg_sponsor_rollup
after insert or update or delete on public.sponsorships
for each row execute function public.sponsor_rollup();

-- ── 3) Public stats — aggregates only, no PII ──────────────────────────────
create or replace function public.sponsor_tree_stats()
returns json
language sql
stable
security definer
set search_path = public
as $$
  select json_build_object(
    'waiting',   (select count(*) from sponsor_profiles
                   where consent_confirmed and status = 'approved'),
    'sponsored', (select count(*) from sponsor_profiles
                   where consent_confirmed and status = 'sponsored'),
    'raised_cents', (select coalesce(sum(amount_cents), 0) from sponsorships
                      where status = 'paid'),
    'sponsor_count', (select count(distinct coalesce(nullif(lower(email), ''), id::text))
                        from sponsorships where status = 'paid')
  );
$$;
revoke all on function public.sponsor_tree_stats() from public;
grant execute on function public.sponsor_tree_stats() to anon, authenticated;

-- ── 4) Public sponsor wall — opt-in recognition names only ─────────────────
create or replace function public.sponsor_wall()
returns table (recognition_name text, paid_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select s.recognition_name, s.paid_at
    from sponsorships s
   where s.status = 'paid'
     and s.public_thanks = true
     and coalesce(s.recognition_name, '') <> ''
   order by s.paid_at desc nulls last
   limit 100;
$$;
revoke all on function public.sponsor_wall() from public;
grant execute on function public.sponsor_wall() to anon, authenticated;
