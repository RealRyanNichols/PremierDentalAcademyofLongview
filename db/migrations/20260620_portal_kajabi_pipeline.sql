-- Portal access + Kajabi sync idempotency + lead-pipeline grading
-- =================================================================
-- Additive, non-destructive. Safe to re-run (IF NOT EXISTS guards).
--
-- Ships three things from the June 2026 build:
--   1. Student portal "enrolled-only" gate            (profiles.portal_status + RPC)
--   2. Kajabi webhook idempotency                     (unique purchase id)
--   3. Amanda's lead grading (hot/qualified/non) +    (leads.lead_grade,
--      "ready now vs which month"                       leads.ready_timeline)
--
-- Already-live context this builds on:
--   profiles(program ∈ preview|foundation|career_track|staff|admin, enrolled_at,
--            cohort, kajabi_id, is_admin)
--   leads(pipeline_stage, amanda_notes, pay_intent, pay_when, path_preference)
--   purchases(external_payment_id, student_id, ...)
--   public.is_pda_admin()  -- existing admin gate used by leads RLS

-- ── 1. Portal access ────────────────────────────────────────────
-- portal_status lets Amanda pause a member's tool access without deleting them.
alter table public.profiles
  add column if not exists portal_status text not null default 'active';

do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_portal_status_chk'
  ) then
    alter table public.profiles
      add constraint profiles_portal_status_chk
      check (portal_status in ('active','suspended','pending'));
  end if;
end $$;

-- Single source of truth for "can this signed-in user use the member portal?"
-- Enrolled = a real program (anything other than the free 'preview'), OR staff/
-- admin, AND portal_status = 'active'. SECURITY DEFINER so the gate is the same
-- truth the server sees, not something a client can spoof. Gated to the caller
-- (auth.uid()) only — it never reveals anyone else's status.
create or replace function public.my_portal_access()
returns table (enrolled boolean, program text, portal_status text, is_admin boolean)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    (coalesce(p.is_admin,false)
      or (p.program is not null and p.program <> 'preview'))
      and coalesce(p.portal_status,'active') = 'active'   as enrolled,
    p.program,
    coalesce(p.portal_status,'active')                    as portal_status,
    coalesce(p.is_admin,false)                            as is_admin
  from public.profiles p
  where p.id = auth.uid();
end;
$$;

revoke execute on function public.my_portal_access() from public, anon;
grant  execute on function public.my_portal_access() to authenticated;

-- ── 2. Kajabi webhook idempotency ───────────────────────────────
-- Webhooks get re-delivered; without this a retry creates duplicate purchase
-- rows. Partial unique index so many NULLs (manual rows) still coexist.
create unique index if not exists purchases_external_payment_id_key
  on public.purchases (external_payment_id)
  where external_payment_id is not null;

-- ── 3. Lead grading + readiness ─────────────────────────────────
-- lead_grade: Amanda's manual grade (the webhook may seed it, she owns it).
-- ready_timeline: 'ready_now' or a 'YYYY-MM' month they said they want to start.
alter table public.leads add column if not exists lead_grade text;
alter table public.leads add column if not exists ready_timeline text;

do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'leads_lead_grade_chk'
  ) then
    alter table public.leads
      add constraint leads_lead_grade_chk
      check (lead_grade is null or lead_grade in ('hot','qualified','non_qualified'));
  end if;
end $$;

-- Helpful indexes for the admin board's grade/stage filters.
create index if not exists leads_lead_grade_idx     on public.leads (lead_grade);
create index if not exists leads_pipeline_stage_idx on public.leads (pipeline_stage);

-- RLS note: public.leads already has admin-only SELECT ("leads_admin_read") and
-- UPDATE ("leads_admin_update") policies. Those are column-agnostic, so the new
-- columns are readable/writable by admins immediately — no policy change needed.
