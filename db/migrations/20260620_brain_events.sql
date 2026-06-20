-- "Brain – PDA": the data store for the interactive blog/site tools.
-- ===================================================================
-- Every time a visitor uses one of the embeddable tools (pay-raise calculator,
-- career-change budget, readiness quiz, etc.) we capture the INPUTS they gave
-- and the OUTPUTS/answers they got — anonymously by default, with contact info
-- when they choose to share/save. Admin-only reads.
--
-- Additive + idempotent.

create table if not exists public.brain_events (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  tool          text not null,                 -- 'paycalc' | 'budget' | 'quiz' | ...
  page          text,                          -- pathname the tool ran on
  session_id    text,                          -- anonymous client id (localStorage)
  inputs        jsonb not null default '{}'::jsonb,
  outputs       jsonb not null default '{}'::jsonb,
  contact_name  text,
  contact_email text,
  contact_phone text,
  shared_to     text,                          -- 'web-share' | 'sms' | 'facebook' | 'x' | 'copy'
  source        text not null default 'blog',
  reviewed      boolean not null default false -- Amanda can mark handled
);

create index if not exists brain_events_created_idx on public.brain_events (created_at desc);
create index if not exists brain_events_tool_idx    on public.brain_events (tool);
create index if not exists brain_events_email_idx   on public.brain_events (contact_email);

alter table public.brain_events enable row level security;

-- Anyone (even logged-out visitors) may LOG a tool event — that's the point.
-- No SELECT for anon, so the data is never readable client-side.
drop policy if exists "brain_events_public_insert" on public.brain_events;
create policy "brain_events_public_insert" on public.brain_events
  for insert to anon, authenticated
  with check (true);

-- Admins read + manage everything.
drop policy if exists "brain_events_admin_read" on public.brain_events;
create policy "brain_events_admin_read" on public.brain_events
  for select to authenticated
  using (public.is_pda_admin());

drop policy if exists "brain_events_admin_update" on public.brain_events;
create policy "brain_events_admin_update" on public.brain_events
  for update to authenticated
  using (public.is_pda_admin()) with check (public.is_pda_admin());

-- Roll-up the admin "Brain" page reads: one row per tool with counts + latest.
create or replace function public.brain_tool_rollup()
returns table (tool text, uses bigint, with_contact bigint, last_used timestamptz)
language sql
security definer
set search_path = public
as $$
  select tool,
         count(*)                                              as uses,
         count(*) filter (where contact_email is not null
                             or contact_phone is not null)     as with_contact,
         max(created_at)                                       as last_used
  from public.brain_events
  where public.is_pda_admin()
  group by tool
  order by max(created_at) desc;
$$;

revoke execute on function public.brain_tool_rollup() from public, anon;
grant  execute on function public.brain_tool_rollup() to authenticated;
