-- RECOVERED FROM LIVE on 2026-09-24. Applied 2026-09-08 23:22 UTC, but the file was never committed.
-- Source: supabase_migrations.schema_migrations version 20260908232243 ("roles_owner_admin_tier_and_profile_guard").
-- ALREADY APPLIED — never run it again. It is here so the repo shows what the database holds.
-- Adds profiles.is_owner + is_pda_owner() and the trigger that freezes privilege and paid-entitlement columns for non-staff.
-- Everything below the marker line is byte-identical to the stored statement
-- (md5 5dd6b3dd8513353c57e862f0a670f914); scripts/check-migrations.mjs verifies that on every npm test.
-- ---- recovered statement below ----
-- PDA role tier: owner (Amanda) > admin (instructors/sales) > instructor > student.
-- Replaces pda_auto_admin_hello(), which hard-forced is_admin=false for every
-- account except hello@, and left is_instructor + all paid entitlement flags
-- self-writable by any signed-in user.

alter table public.profiles
  add column if not exists is_owner boolean not null default false;

update public.profiles
   set is_owner = true
 where lower(email) = 'hello@premierdentalacademyoflongview.com';

create or replace function public.is_pda_owner()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select is_owner from public.profiles where id = auth.uid()), false);
$$;

create or replace function public.pda_guard_profile_roles()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare
  actor_admin boolean := false;
  actor_owner boolean := false;
  uid uuid := auth.uid();
begin
  -- The owner account can never be demoted or locked out of her own school.
  if new.email is not null
     and lower(new.email) = 'hello@premierdentalacademyoflongview.com' then
    new.is_admin := true;
    new.is_owner := true;
  end if;

  -- Trusted server contexts (service-role edge functions, /api routes) pass through.
  if uid is null then
    return new;
  end if;

  select coalesce(p.is_admin,false), coalesce(p.is_owner,false)
    into actor_admin, actor_owner
    from public.profiles p
   where p.id = uid;

  if tg_op = 'INSERT' then
    if not coalesce(actor_admin,false) then
      new.is_admin      := false;
      new.is_owner      := false;
      new.is_instructor := false;
    end if;
    return new;
  end if;

  if coalesce(actor_owner,false) then
    return new;                                   -- owner may change anything
  end if;

  if coalesce(actor_admin,false) then
    if new.is_owner is distinct from old.is_owner
       or new.is_admin is distinct from old.is_admin then
      raise exception 'Only the owner can grant or remove admin access'
        using errcode = '42501';
    end if;
    return new;
  end if;

  -- Everyone else: privilege and paid-entitlement columns freeze to stored values.
  new.is_admin         := old.is_admin;
  new.is_owner         := old.is_owner;
  new.is_instructor    := old.is_instructor;
  new.program          := old.program;
  new.portal_status    := old.portal_status;
  new.study_pack       := old.study_pack;
  new.exam_prep        := old.exam_prep;
  new.exam_pro         := old.exam_pro;
  new.money_plan       := old.money_plan;
  new.survival_planner := old.survival_planner;
  new.career_vault     := old.career_vault;
  new.career_plan      := old.career_plan;
  new.online_program   := old.online_program;
  new.ms_abbrev        := old.ms_abbrev;
  new.ms_hours         := old.ms_hours;
  new.ms_infection     := old.ms_infection;
  new.ms_instruments   := old.ms_instruments;
  new.ms_interview     := old.ms_interview;
  new.ms_resume        := old.ms_resume;
  new.ms_spanish       := old.ms_spanish;
  new.ms_toothnum      := old.ms_toothnum;
  return new;
end $$;

drop trigger if exists trg_pda_auto_admin_hello on public.profiles;
drop trigger if exists trg_pda_guard_profile_roles on public.profiles;
create trigger trg_pda_guard_profile_roles
  before insert or update on public.profiles
  for each row execute function public.pda_guard_profile_roles();
