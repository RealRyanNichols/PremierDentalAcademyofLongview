-- ═══════════════════════════════════════════════════════════════════════════
-- Office Onboarding & Competency Hub (working name) — full schema, RLS, RPCs.
-- STATUS: NOT APPLIED to the live project. STAGING/BRANCH DATABASES ONLY until
-- Amanda approves production application (see docs/hub/DB.md + the PR
-- deployment checklist). Rollback: 20260808_hub_schema_down.sql.
--
-- Everything is namespaced hub_ (zero collision with existing tables).
-- Idempotent: safe to re-run. Touches NO existing tables except a FK to
-- public.profiles (the repo's existing auth-keyed profile table).
--
-- Deliberately EXCLUDED by design (do not add): patient data of any kind,
-- I-9/W-4, SSNs, health/vaccination records, background checks, card data,
-- payroll. This product is an internal training record only.
-- ═══════════════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

-- ── Enums ───────────────────────────────────────────────────────────────────
do $$ begin create type hub_role as enum ('owner','manager','trainer','employee','premier_support'); exception when duplicate_object then null; end $$;
do $$ begin create type hub_plan_tier as enum ('free','paid'); exception when duplicate_object then null; end $$;
do $$ begin create type hub_phase as enum ('d30','d60','d90'); exception when duplicate_object then null; end $$;
do $$ begin create type hub_task_kind as enum ('task','skill','quiz','sop_read','checkin'); exception when duplicate_object then null; end $$;
do $$ begin create type hub_task_status as enum ('todo','in_progress','done','skipped'); exception when duplicate_object then null; end $$;
do $$ begin create type hub_skill_state as enum ('not_started','observed','practicing','independent','needs_coaching'); exception when duplicate_object then null; end $$;
do $$ begin create type hub_invite_status as enum ('pending','accepted','expired','revoked'); exception when duplicate_object then null; end $$;
do $$ begin create type hub_sop_kind as enum ('procedure','tray_setup','sterilization','front_office','other'); exception when duplicate_object then null; end $$;
do $$ begin create type hub_sop_status as enum ('draft','active','archived'); exception when duplicate_object then null; end $$;
do $$ begin create type hub_plan_status as enum ('active','completed','archived'); exception when duplicate_object then null; end $$;

-- ── Tables ──────────────────────────────────────────────────────────────────
create table if not exists hub_organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 1 and 120),
  practice_type text not null default 'General dentistry',
  plan_tier hub_plan_tier not null default 'free',
  settings jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists hub_locations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references hub_organizations(id) on delete cascade,
  name text not null default 'Main location',
  is_primary boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists hub_locations_org_ix on hub_locations (org_id);

-- Profiles: the repo's existing public.profiles (keyed to auth.users) is
-- reused — no hub_profiles table (see docs/hub/REPO-NOTES.md).
create table if not exists hub_org_memberships (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references hub_organizations(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role hub_role not null check (role <> 'premier_support'), -- support access is via grants, never membership
  title text,
  status text not null default 'active' check (status in ('active','archived')),
  archived_at timestamptz, archive_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, profile_id)
);
create index if not exists hub_org_memberships_org_ix on hub_org_memberships (org_id);
create index if not exists hub_org_memberships_profile_ix on hub_org_memberships (profile_id);

create table if not exists hub_invitations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references hub_organizations(id) on delete cascade,
  email text not null,
  role hub_role not null check (role <> 'premier_support'),
  token_hash text not null unique,       -- SHA-256 of the token; raw token only in the invite link
  expires_at timestamptz not null,
  status hub_invite_status not null default 'pending',
  invited_by uuid not null,
  created_at timestamptz not null default now()
);
create index if not exists hub_invitations_org_ix on hub_invitations (org_id);

create table if not exists hub_templates (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references hub_organizations(id) on delete cascade,  -- NULL = Premier stock template
  slug text not null, title text not null, role_target text not null,
  body jsonb not null,                   -- ordered task defs {phase,day,kind,title,skill_slug?,quiz_slug?,sop_kind?}
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists hub_templates_org_slug_ux
  on hub_templates (coalesce(org_id, '00000000-0000-0000-0000-000000000000'::uuid), slug);

create table if not exists hub_plans (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references hub_organizations(id) on delete cascade,
  employee_membership_id uuid not null references hub_org_memberships(id) on delete cascade,
  template_id uuid references hub_templates(id),
  start_date date not null,
  status hub_plan_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists hub_plans_one_active_ux on hub_plans (employee_membership_id) where status = 'active';
create index if not exists hub_plans_org_ix on hub_plans (org_id);

create table if not exists hub_plan_tasks (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references hub_plans(id) on delete cascade,
  org_id uuid not null,                  -- denormalized for RLS speed; trigger enforces = plan's org
  phase hub_phase not null,
  day_offset int not null check (day_offset between 1 and 120),
  kind hub_task_kind not null, title text not null,
  skill_id uuid, sop_id uuid, quiz_id uuid,
  status hub_task_status not null default 'todo',
  completed_at timestamptz, completed_by uuid,
  sort int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists hub_plan_tasks_plan_ix on hub_plan_tasks (plan_id);
create index if not exists hub_plan_tasks_org_ix on hub_plan_tasks (org_id);

create table if not exists hub_skills (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references hub_organizations(id) on delete cascade,   -- NULL = Premier stock skill
  category text not null, title text not null, description text,
  requires_observation boolean not null default true,
  sort int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists hub_skills_org_ix on hub_skills (org_id);

create table if not exists hub_employee_skills (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references hub_organizations(id) on delete cascade,
  employee_membership_id uuid not null references hub_org_memberships(id) on delete cascade,
  skill_id uuid not null references hub_skills(id),
  state hub_skill_state not null default 'not_started',
  signed_off_by uuid, signed_off_at timestamptz,
  recheck_at date, note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (employee_membership_id, skill_id)
);
create index if not exists hub_employee_skills_org_ix on hub_employee_skills (org_id);

create table if not exists hub_skill_signoff_events (  -- APPEND-ONLY
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  employee_skill_id uuid not null references hub_employee_skills(id) on delete cascade,
  actor_membership_id uuid not null,
  from_state hub_skill_state not null, to_state hub_skill_state not null,
  note text,
  at timestamptz not null default now()
);
create index if not exists hub_skill_signoff_events_org_ix on hub_skill_signoff_events (org_id);
create index if not exists hub_skill_signoff_events_skill_ix on hub_skill_signoff_events (employee_skill_id);

create table if not exists hub_sops (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references hub_organizations(id) on delete cascade,
  kind hub_sop_kind not null, title text not null,
  body jsonb not null default '[]',      -- ordered steps; tray layouts as {tray:[[item,position],...]}
  version int not null default 1,
  last_reviewed_at date not null default current_date,
  status hub_sop_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists hub_sops_org_ix on hub_sops (org_id);

create table if not exists hub_quizzes (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references hub_organizations(id) on delete cascade,   -- NULL = stock (ORIGINAL questions only)
  slug text, title text not null,
  questions jsonb not null,              -- [{prompt,options[],correct_index}]
  created_at timestamptz not null default now()
);
create index if not exists hub_quizzes_org_ix on hub_quizzes (org_id);

create table if not exists hub_quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  quiz_id uuid not null references hub_quizzes(id),
  employee_membership_id uuid not null references hub_org_memberships(id) on delete cascade,
  score_pct int not null check (score_pct between 0 and 100),
  passed boolean not null,
  at timestamptz not null default now()
  -- deliberately NO per-question answer storage (data minimization)
);
create index if not exists hub_quiz_attempts_org_ix on hub_quiz_attempts (org_id);

create table if not exists hub_checkins (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references hub_organizations(id) on delete cascade,
  employee_membership_id uuid not null references hub_org_memberships(id) on delete cascade,
  author_membership_id uuid not null,
  week_of date not null, wins text, needs text, next_plan text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (employee_membership_id, week_of)
);
create index if not exists hub_checkins_org_ix on hub_checkins (org_id);

create table if not exists hub_reports (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references hub_organizations(id) on delete cascade,
  employee_membership_id uuid not null,
  kind text not null default 'readiness',
  generated_by uuid not null,
  snapshot jsonb not null,
  at timestamptz not null default now()
);
create index if not exists hub_reports_org_ix on hub_reports (org_id);

create table if not exists hub_support_grants (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references hub_organizations(id) on delete cascade,
  granted_by uuid not null,               -- practice-side membership id
  granted_to_profile_id uuid not null,    -- Premier support profile
  reason text,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists hub_support_grants_org_ix on hub_support_grants (org_id);
create index if not exists hub_support_grants_to_ix on hub_support_grants (granted_to_profile_id);

create table if not exists hub_audit_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid,                            -- NULL only for platform-level events
  actor_profile_id uuid, actor_label text not null,
  action text not null, subject_type text, subject_id uuid,
  meta jsonb not null default '{}',
  at timestamptz not null default now()
);
create index if not exists hub_audit_events_org_at_ix on hub_audit_events (org_id, at desc);

create table if not exists hub_generator_leads (
  id uuid primary key default gen_random_uuid(),
  email text, name text,
  role_interest text not null, inputs jsonb not null,
  marketing_consent boolean not null default false,
  consent_text_version text,
  source jsonb not null default '{}',     -- utm_*, referrer, partner, ip_hash
  org_id uuid,
  created_at timestamptz not null default now(),
  constraint hub_generator_leads_consent_ck
    check (marketing_consent = false or consent_text_version is not null)
);

create table if not exists hub_analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  org_id uuid, membership_id uuid, anon_id text,
  props jsonb not null default '{}',
  idempotency_key text not null unique,
  at timestamptz not null default now()
);
create index if not exists hub_analytics_events_name_at_ix on hub_analytics_events (event_name, at desc);

-- ── Shared triggers ─────────────────────────────────────────────────────────
create or replace function hub_set_updated_at() returns trigger
language plpgsql as $$
begin new.updated_at := now(); return new; end $$;

do $$ declare t text;
begin
  foreach t in array array['hub_organizations','hub_org_memberships','hub_templates',
    'hub_plans','hub_plan_tasks','hub_employee_skills','hub_sops','hub_checkins']
  loop
    execute format('drop trigger if exists %I_set_updated_at on %I', t, t);
    execute format('create trigger %I_set_updated_at before update on %I
                    for each row execute function hub_set_updated_at()', t, t);
  end loop;
end $$;

-- Defense in depth: denormalized org_id must always equal the parent's org.
create or replace function hub_enforce_parent_org() returns trigger
language plpgsql as $$
declare v_org uuid;
begin
  if tg_table_name = 'hub_plan_tasks' then
    select org_id into v_org from hub_plans where id = new.plan_id;
  elsif tg_table_name = 'hub_employee_skills' then
    select org_id into v_org from hub_org_memberships where id = new.employee_membership_id;
  elsif tg_table_name = 'hub_skill_signoff_events' then
    select org_id into v_org from hub_employee_skills where id = new.employee_skill_id;
  elsif tg_table_name = 'hub_quiz_attempts' then
    select org_id into v_org from hub_org_memberships where id = new.employee_membership_id;
  end if;
  if v_org is null then raise exception 'hub: parent row not found for org check'; end if;
  if new.org_id is distinct from v_org then
    raise exception 'hub: org_id % does not match parent org %', new.org_id, v_org;
  end if;
  return new;
end $$;

do $$ declare t text;
begin
  foreach t in array array['hub_plan_tasks','hub_employee_skills','hub_skill_signoff_events','hub_quiz_attempts']
  loop
    execute format('drop trigger if exists %I_org_guard on %I', t, t);
    execute format('create trigger %I_org_guard before insert or update on %I
                    for each row execute function hub_enforce_parent_org()', t, t);
  end loop;
end $$;

-- Sign-off history is append-only for everyone, including table owners.
create or replace function hub_block_mutation() returns trigger
language plpgsql as $$
begin raise exception 'hub: % rows are append-only', tg_table_name; end $$;

drop trigger if exists hub_skill_signoff_events_append_only on hub_skill_signoff_events;
create trigger hub_skill_signoff_events_append_only
  before update or delete on hub_skill_signoff_events
  for each row execute function hub_block_mutation();

-- Free tier: one ACTIVE plan (one active hire being onboarded) per free org.
create or replace function hub_enforce_free_tier() returns trigger
language plpgsql as $$
begin
  if new.status = 'active' then
    if (select plan_tier from hub_organizations where id = new.org_id) = 'free'
       and exists (select 1 from hub_plans
                   where org_id = new.org_id and status = 'active' and id <> new.id) then
      raise exception 'FREE_TIER_LIMIT: free workspaces can run one active onboarding at a time'
        using errcode = 'P0001';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists hub_plans_free_tier on hub_plans;
create trigger hub_plans_free_tier before insert or update on hub_plans
  for each row execute function hub_enforce_free_tier();

-- Role helpers (security definer so they can read memberships under RLS).
create or replace function hub_is_member(p_org uuid, p_roles hub_role[] default null)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from hub_org_memberships m
    where m.org_id = p_org and m.profile_id = auth.uid() and m.status = 'active'
      and (p_roles is null or m.role = any(p_roles))
  );
$$;

create or replace function hub_has_support_grant(p_org uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from hub_support_grants g
    where g.org_id = p_org and g.granted_to_profile_id = auth.uid()
      and g.revoked_at is null and g.expires_at > now()
  );
$$;

create or replace function hub_my_membership(p_org uuid) returns uuid
language sql stable security definer set search_path = public as $$
  select m.id from hub_org_memberships m
  where m.org_id = p_org and m.profile_id = auth.uid() and m.status = 'active' limit 1;
$$;

-- Audit writer (security definer: triggers/RPCs write audits regardless of RLS).
create or replace function hub_audit(p_org uuid, p_action text, p_subject_type text,
  p_subject_id uuid, p_meta jsonb default '{}') returns void
language plpgsql security definer set search_path = public as $$
declare v_label text;
begin
  select coalesce(nullif(trim(coalesce(p.first_name,'') || ' ' || coalesce(p.last_name,'')), ''), p.email, 'system')
    into v_label from public.profiles p where p.id = auth.uid();
  insert into hub_audit_events (org_id, actor_profile_id, actor_label, action, subject_type, subject_id, meta)
  values (p_org, auth.uid(), coalesce(v_label, 'system'), p_action, p_subject_type, p_subject_id, coalesce(p_meta, '{}'));
end $$;

-- Membership changes are audited automatically.
create or replace function hub_audit_membership_change() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'UPDATE' and (old.role is distinct from new.role) then
    perform hub_audit(new.org_id, 'MEMBER_ROLE_CHANGED', 'membership', new.id,
      jsonb_build_object('from', old.role, 'to', new.role));
  end if;
  if tg_op = 'UPDATE' and (old.status is distinct from new.status) then
    perform hub_audit(new.org_id,
      case when new.status = 'archived' then 'MEMBER_ARCHIVED' else 'MEMBER_RESTORED' end,
      'membership', new.id, jsonb_build_object('reason', new.archive_reason));
  end if;
  return new;
end $$;
drop trigger if exists hub_org_memberships_audit on hub_org_memberships;
create trigger hub_org_memberships_audit after update on hub_org_memberships
  for each row execute function hub_audit_membership_change();

-- Employees may only flip status on their own non-skill tasks; nothing else.
create or replace function hub_guard_task_update() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- service role / definer paths (auth.uid() is null) and privileged members: full edit
  if auth.uid() is null or hub_is_member(new.org_id, array['owner','manager','trainer']::hub_role[]) then
    if new.status = 'done' and new.completed_at is null then new.completed_at := now(); end if;
    return new;
  end if;
  if old.kind in ('skill','checkin') then
    raise exception 'hub: % tasks complete only via sign-off or check-in', old.kind;
  end if;
  if new.plan_id      is distinct from old.plan_id
     or new.org_id     is distinct from old.org_id
     or new.phase      is distinct from old.phase
     or new.day_offset is distinct from old.day_offset
     or new.kind       is distinct from old.kind
     or new.title      is distinct from old.title
     or new.skill_id   is distinct from old.skill_id
     or new.sop_id     is distinct from old.sop_id
     or new.quiz_id    is distinct from old.quiz_id
     or new.sort       is distinct from old.sort then
    raise exception 'hub: employees may only update task status';
  end if;
  if new.status = 'done' then
    new.completed_at := coalesce(new.completed_at, now());
    new.completed_by := hub_my_membership(new.org_id);
  end if;
  return new;
end $$;
drop trigger if exists hub_plan_tasks_guard on hub_plan_tasks;
create trigger hub_plan_tasks_guard before update on hub_plan_tasks
  for each row execute function hub_guard_task_update();

-- ── RPCs (atomic, role-checked mutations — the first wall; RLS is the second) ──

-- Create a workspace: org + primary location + owner membership, one transaction.
create or replace function hub_create_workspace(p_name text, p_practice_type text default 'General dentistry')
returns uuid language plpgsql security definer set search_path = public as $$
declare v_org uuid; v_email text;
begin
  if auth.uid() is null then raise exception 'hub: sign in first'; end if;
  if not exists (select 1 from public.profiles where id = auth.uid()) then
    select email into v_email from auth.users where id = auth.uid();
    insert into public.profiles (id, email) values (auth.uid(), coalesce(v_email, ''))
    on conflict (id) do nothing;
  end if;
  insert into hub_organizations (name, practice_type)
  values (trim(p_name), coalesce(nullif(trim(p_practice_type), ''), 'General dentistry'))
  returning id into v_org;
  insert into hub_locations (org_id, name, is_primary) values (v_org, 'Main location', true);
  insert into hub_org_memberships (org_id, profile_id, role, title)
  values (v_org, auth.uid(), 'owner', 'Owner');
  perform hub_audit(v_org, 'WORKSPACE_CREATED', 'organization', v_org,
    jsonb_build_object('name', trim(p_name)));
  return v_org;
end $$;

-- People roster with names, scoped by role: employees see themselves + staff
-- (never other employees' rows); owner/manager/trainer and support see all.
create or replace function hub_org_people(p_org uuid)
returns table (membership_id uuid, profile_id uuid, full_name text, email text,
               role hub_role, title text, status text, archived_at timestamptz,
               archive_reason text, created_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
declare v_privileged boolean;
begin
  v_privileged := hub_is_member(p_org, array['owner','manager','trainer']::hub_role[])
                  or hub_has_support_grant(p_org);
  if not v_privileged and not hub_is_member(p_org) then
    raise exception 'hub: not a member of this workspace';
  end if;
  return query
    select m.id, m.profile_id,
           coalesce(nullif(trim(coalesce(p.first_name,'') || ' ' || coalesce(p.last_name,'')), ''), p.email),
           p.email, m.role, m.title, m.status, m.archived_at, m.archive_reason, m.created_at
    from hub_org_memberships m
    join public.profiles p on p.id = m.profile_id
    where m.org_id = p_org
      and (v_privileged or m.profile_id = auth.uid() or m.role <> 'employee')
    order by m.created_at;
end $$;

-- Sign off a skill: upsert state + append history + audit, one transaction.
-- Marks the matching plan task done when the skill reaches 'independent'.
create or replace function hub_sign_off_skill(p_org uuid, p_employee_membership uuid,
  p_skill uuid, p_to_state hub_skill_state, p_note text default null, p_recheck date default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_row hub_employee_skills; v_from hub_skill_state; v_actor uuid;
begin
  if not hub_is_member(p_org, array['owner','trainer']::hub_role[]) then
    raise exception 'hub: only owners and trainers can sign off skills';
  end if;
  v_actor := hub_my_membership(p_org);
  if not exists (select 1 from hub_org_memberships
                 where id = p_employee_membership and org_id = p_org) then
    raise exception 'hub: employee is not in this workspace';
  end if;
  select * into v_row from hub_employee_skills
   where employee_membership_id = p_employee_membership and skill_id = p_skill;
  v_from := coalesce(v_row.state, 'not_started');
  insert into hub_employee_skills (org_id, employee_membership_id, skill_id, state,
    signed_off_by, signed_off_at, recheck_at, note)
  values (p_org, p_employee_membership, p_skill, p_to_state, v_actor, now(), p_recheck, p_note)
  on conflict (employee_membership_id, skill_id) do update
    set state = excluded.state, signed_off_by = excluded.signed_off_by,
        signed_off_at = excluded.signed_off_at, recheck_at = excluded.recheck_at,
        note = excluded.note, updated_at = now()
  returning * into v_row;
  insert into hub_skill_signoff_events (org_id, employee_skill_id, actor_membership_id, from_state, to_state, note)
  values (p_org, v_row.id, v_actor, v_from, p_to_state, p_note);
  if p_to_state = 'independent' then
    update hub_plan_tasks t set status = 'done', completed_at = now(), completed_by = v_actor
    from hub_plans pl
    where t.plan_id = pl.id and pl.employee_membership_id = p_employee_membership
      and t.kind = 'skill' and t.skill_id = p_skill and t.status <> 'done';
  end if;
  perform hub_audit(p_org, 'SKILL_SIGNED_OFF', 'employee_skill', v_row.id,
    jsonb_build_object('from', v_from, 'to', p_to_state, 'employee_membership', p_employee_membership));
  return v_row.id;
end $$;

-- Invitations: raw 32-byte token returned ONCE to the authorized caller;
-- only its SHA-256 is stored. Rate limited to 20 per org per rolling day.
create or replace function hub_create_invitation(p_org uuid, p_email text, p_role hub_role)
returns text language plpgsql security definer set search_path = public as $$
declare v_token text; v_count int;
begin
  if not hub_is_member(p_org, array['owner','manager']::hub_role[]) then
    raise exception 'hub: only owners and managers can invite';
  end if;
  if p_role = 'premier_support' then raise exception 'hub: support access uses grants, not invites'; end if;
  if p_email is null or p_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'hub: valid email required';
  end if;
  select count(*) into v_count from hub_invitations
   where org_id = p_org and created_at > now() - interval '1 day';
  if v_count >= 20 then
    raise exception 'RATE_LIMIT: invitation limit reached for today' using errcode = 'P0001';
  end if;
  v_token := encode(gen_random_bytes(32), 'hex');
  insert into hub_invitations (org_id, email, role, token_hash, expires_at, invited_by)
  values (p_org, lower(trim(p_email)), p_role, encode(digest(v_token, 'sha256'), 'hex'),
          now() + interval '7 days', hub_my_membership(p_org));
  perform hub_audit(p_org, 'INVITE_CREATED', 'invitation', null,
    jsonb_build_object('role', p_role));
  return v_token;
end $$;

-- Anyone holding the raw token may preview what it opens (org name, role, state).
create or replace function hub_invite_preview(p_token text)
returns table (org_name text, role hub_role, email text, status hub_invite_status, expires_at timestamptz)
language sql stable security definer set search_path = public as $$
  select o.name,
         i.role,
         i.email,
         case when i.status = 'pending' and i.expires_at <= now() then 'expired'::hub_invite_status else i.status end,
         i.expires_at
  from hub_invitations i join hub_organizations o on o.id = i.org_id
  where i.token_hash = encode(digest(p_token, 'sha256'), 'hex');
$$;

-- Accept an invite: atomic membership creation for the signed-in user.
create or replace function hub_accept_invite(p_token text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_inv hub_invitations; v_email text;
begin
  if auth.uid() is null then raise exception 'hub: sign in first'; end if;
  select * into v_inv from hub_invitations
   where token_hash = encode(digest(p_token, 'sha256'), 'hex') for update;
  if v_inv.id is null then raise exception 'INVITE_INVALID'; end if;
  if v_inv.status = 'revoked' then raise exception 'INVITE_REVOKED'; end if;
  if v_inv.status = 'accepted' then raise exception 'INVITE_ALREADY_USED'; end if;
  if v_inv.expires_at <= now() then
    update hub_invitations set status = 'expired' where id = v_inv.id;
    raise exception 'INVITE_EXPIRED';
  end if;
  if not exists (select 1 from public.profiles where id = auth.uid()) then
    select email into v_email from auth.users where id = auth.uid();
    insert into public.profiles (id, email) values (auth.uid(), coalesce(v_email, ''))
    on conflict (id) do nothing;
  end if;
  insert into hub_org_memberships (org_id, profile_id, role)
  values (v_inv.org_id, auth.uid(), v_inv.role)
  on conflict (org_id, profile_id) do update set status = 'active', updated_at = now();
  update hub_invitations set status = 'accepted' where id = v_inv.id;
  perform hub_audit(v_inv.org_id, 'INVITE_ACCEPTED', 'invitation', v_inv.id,
    jsonb_build_object('role', v_inv.role));
  return v_inv.org_id;
end $$;

create or replace function hub_revoke_invitation(p_invitation uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_org uuid;
begin
  select org_id into v_org from hub_invitations where id = p_invitation;
  if v_org is null then raise exception 'hub: invitation not found'; end if;
  if not hub_is_member(v_org, array['owner','manager']::hub_role[]) then
    raise exception 'hub: only owners and managers can revoke invites';
  end if;
  update hub_invitations set status = 'revoked' where id = p_invitation and status = 'pending';
  perform hub_audit(v_org, 'INVITE_REVOKED', 'invitation', p_invitation, '{}');
end $$;

-- Premier support grants: explicit, expiring, revocable, fully audited.
create or replace function hub_create_support_grant(p_org uuid, p_support_email text,
  p_reason text default null, p_days int default 7)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_profile uuid; v_grant uuid;
begin
  if not hub_is_member(p_org, array['owner','manager']::hub_role[]) then
    raise exception 'hub: only owners and managers can grant support access';
  end if;
  select id into v_profile from public.profiles where lower(email) = lower(trim(p_support_email));
  if v_profile is null then raise exception 'hub: no account found for that support email'; end if;
  insert into hub_support_grants (org_id, granted_by, granted_to_profile_id, reason, expires_at)
  values (p_org, hub_my_membership(p_org), v_profile, p_reason,
          now() + make_interval(days => greatest(1, least(coalesce(p_days, 7), 30))))
  returning id into v_grant;
  perform hub_audit(p_org, 'SUPPORT_GRANT_CREATED', 'support_grant', v_grant,
    jsonb_build_object('reason', p_reason, 'days', p_days));
  return v_grant;
end $$;

create or replace function hub_revoke_support_grant(p_grant uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_org uuid;
begin
  select org_id into v_org from hub_support_grants where id = p_grant;
  if v_org is null then raise exception 'hub: grant not found'; end if;
  if not hub_is_member(v_org, array['owner','manager']::hub_role[]) then
    raise exception 'hub: only owners and managers can revoke support access';
  end if;
  update hub_support_grants set revoked_at = now() where id = p_grant and revoked_at is null;
  perform hub_audit(v_org, 'SUPPORT_GRANT_REVOKED', 'support_grant', p_grant, '{}');
end $$;

-- Every support console page view is audited and visible to the practice.
create or replace function hub_log_support_view(p_org uuid, p_page text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not hub_has_support_grant(p_org) then raise exception 'hub: no active support grant'; end if;
  perform hub_audit(p_org, 'SUPPORT_VIEWED', 'page', null, jsonb_build_object('page', p_page));
end $$;

-- Archive a person: membership + their active plan, with reason, audited.
create or replace function hub_archive_member(p_membership uuid, p_reason text default null)
returns void language plpgsql security definer set search_path = public as $$
declare v_org uuid;
begin
  select org_id into v_org from hub_org_memberships where id = p_membership;
  if v_org is null then raise exception 'hub: person not found'; end if;
  if not hub_is_member(v_org, array['owner','manager']::hub_role[]) then
    raise exception 'hub: only owners and managers can archive people';
  end if;
  update hub_org_memberships
     set status = 'archived', archived_at = now(), archive_reason = p_reason
   where id = p_membership and status = 'active';
  update hub_plans set status = 'archived' where employee_membership_id = p_membership and status = 'active';
end $$;

-- Readiness report snapshot (print view reads this back).
create or replace function hub_save_report(p_org uuid, p_employee_membership uuid, p_snapshot jsonb)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if not hub_is_member(p_org, array['owner','manager','trainer']::hub_role[]) then
    raise exception 'hub: only staff can generate reports';
  end if;
  insert into hub_reports (org_id, employee_membership_id, generated_by, snapshot)
  values (p_org, p_employee_membership, hub_my_membership(p_org), p_snapshot)
  returning id into v_id;
  perform hub_audit(p_org, 'REPORT_GENERATED', 'report', v_id,
    jsonb_build_object('employee_membership', p_employee_membership));
  return v_id;
end $$;

-- Data & privacy: deletion request stamps the org and writes the audit trail.
-- Actual purge is a manual 14-day-window runbook step (docs/hub/DB.md).
create or replace function hub_request_deletion(p_org uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not hub_is_member(p_org, array['owner']::hub_role[]) then
    raise exception 'hub: only the owner can request deletion';
  end if;
  update hub_organizations
     set settings = settings || jsonb_build_object('deletion_requested_at', now())
   where id = p_org;
  perform hub_audit(p_org, 'DELETION_REQUESTED', 'organization', p_org, '{}');
end $$;

-- Weekly retention view (server-derived, not a cron): any training action per
-- org per ISO week. "weekly_training_action" is read from this view.
create or replace view hub_weekly_training_actions as
  select org_id, date_trunc('week', at)::date as week_of, count(*) as actions
  from (
    select org_id, at from hub_skill_signoff_events
    union all select org_id, at from hub_quiz_attempts
    union all select org_id, created_at as at from hub_checkins
    union all select org_id, completed_at as at from hub_plan_tasks where completed_at is not null
  ) x group by 1, 2;

-- ── Row Level Security: default deny on every hub_ table ────────────────────
do $$ declare t text;
begin
  foreach t in array array['hub_organizations','hub_locations','hub_org_memberships',
    'hub_invitations','hub_templates','hub_plans','hub_plan_tasks','hub_skills',
    'hub_employee_skills','hub_skill_signoff_events','hub_sops','hub_quizzes',
    'hub_quiz_attempts','hub_checkins','hub_reports','hub_support_grants',
    'hub_audit_events','hub_generator_leads','hub_analytics_events']
  loop
    execute format('alter table %I enable row level security', t);
  end loop;
end $$;

-- hub_organizations: members + support read; owner/manager update; create via RPC only.
drop policy if exists hub_organizations_select on hub_organizations;
create policy hub_organizations_select on hub_organizations for select to authenticated
  using (hub_is_member(id) or hub_has_support_grant(id));
drop policy if exists hub_organizations_update on hub_organizations;
create policy hub_organizations_update on hub_organizations for update to authenticated
  using (hub_is_member(id, array['owner','manager']::hub_role[]))
  with check (hub_is_member(id, array['owner','manager']::hub_role[]));

-- hub_locations
drop policy if exists hub_locations_select on hub_locations;
create policy hub_locations_select on hub_locations for select to authenticated
  using (hub_is_member(org_id) or hub_has_support_grant(org_id));
drop policy if exists hub_locations_write on hub_locations;
create policy hub_locations_write on hub_locations for all to authenticated
  using (hub_is_member(org_id, array['owner','manager']::hub_role[]))
  with check (hub_is_member(org_id, array['owner','manager']::hub_role[]));

-- hub_org_memberships: staff/support see all; employees see self + staff rows
-- (never other employees). Writes: owner/manager (creation happens via RPCs).
drop policy if exists hub_org_memberships_select on hub_org_memberships;
create policy hub_org_memberships_select on hub_org_memberships for select to authenticated
  using (
    hub_is_member(org_id, array['owner','manager','trainer']::hub_role[])
    or hub_has_support_grant(org_id)
    or (hub_is_member(org_id) and (profile_id = auth.uid() or role <> 'employee'))
  );
drop policy if exists hub_org_memberships_update on hub_org_memberships;
create policy hub_org_memberships_update on hub_org_memberships for update to authenticated
  using (hub_is_member(org_id, array['owner','manager']::hub_role[]))
  with check (hub_is_member(org_id, array['owner','manager']::hub_role[]));

-- hub_invitations: owner/manager read only (contains emails). Writes via RPC.
drop policy if exists hub_invitations_select on hub_invitations;
create policy hub_invitations_select on hub_invitations for select to authenticated
  using (hub_is_member(org_id, array['owner','manager']::hub_role[]));

-- hub_templates: stock rows readable by any signed-in user; org rows by members.
drop policy if exists hub_templates_select on hub_templates;
create policy hub_templates_select on hub_templates for select to authenticated
  using (org_id is null or hub_is_member(org_id) or hub_has_support_grant(org_id));
drop policy if exists hub_templates_write on hub_templates;
create policy hub_templates_write on hub_templates for all to authenticated
  using (org_id is not null and hub_is_member(org_id, array['owner','manager','trainer']::hub_role[]))
  with check (org_id is not null and hub_is_member(org_id, array['owner','manager','trainer']::hub_role[]));

-- hub_plans: staff/support all; employees their own.
drop policy if exists hub_plans_select on hub_plans;
create policy hub_plans_select on hub_plans for select to authenticated
  using (
    hub_is_member(org_id, array['owner','manager','trainer']::hub_role[])
    or hub_has_support_grant(org_id)
    or employee_membership_id in (select id from hub_org_memberships where profile_id = auth.uid())
  );
drop policy if exists hub_plans_write on hub_plans;
create policy hub_plans_write on hub_plans for all to authenticated
  using (hub_is_member(org_id, array['owner','manager','trainer']::hub_role[]))
  with check (hub_is_member(org_id, array['owner','manager','trainer']::hub_role[]));

-- hub_plan_tasks: staff/support all; employees read + limited update on their own
-- plan (column restrictions enforced by hub_guard_task_update trigger).
drop policy if exists hub_plan_tasks_select on hub_plan_tasks;
create policy hub_plan_tasks_select on hub_plan_tasks for select to authenticated
  using (
    hub_is_member(org_id, array['owner','manager','trainer']::hub_role[])
    or hub_has_support_grant(org_id)
    or plan_id in (select p.id from hub_plans p
                   join hub_org_memberships m on m.id = p.employee_membership_id
                   where m.profile_id = auth.uid())
  );
drop policy if exists hub_plan_tasks_staff_write on hub_plan_tasks;
create policy hub_plan_tasks_staff_write on hub_plan_tasks for all to authenticated
  using (hub_is_member(org_id, array['owner','manager','trainer']::hub_role[]))
  with check (hub_is_member(org_id, array['owner','manager','trainer']::hub_role[]));
drop policy if exists hub_plan_tasks_employee_update on hub_plan_tasks;
create policy hub_plan_tasks_employee_update on hub_plan_tasks for update to authenticated
  using (
    kind in ('task','sop_read','quiz')
    and plan_id in (select p.id from hub_plans p
                    join hub_org_memberships m on m.id = p.employee_membership_id
                    where m.profile_id = auth.uid() and m.status = 'active')
  )
  with check (
    kind in ('task','sop_read','quiz')
    and plan_id in (select p.id from hub_plans p
                    join hub_org_memberships m on m.id = p.employee_membership_id
                    where m.profile_id = auth.uid() and m.status = 'active')
  );

-- hub_skills: stock rows readable by any signed-in user; org rows by members.
drop policy if exists hub_skills_select on hub_skills;
create policy hub_skills_select on hub_skills for select to authenticated
  using (org_id is null or hub_is_member(org_id) or hub_has_support_grant(org_id));
drop policy if exists hub_skills_write on hub_skills;
create policy hub_skills_write on hub_skills for all to authenticated
  using (org_id is not null and hub_is_member(org_id, array['owner','manager','trainer']::hub_role[]))
  with check (org_id is not null and hub_is_member(org_id, array['owner','manager','trainer']::hub_role[]));

-- hub_employee_skills: staff/support read all; employees read own; only
-- owner/trainer write (sign-off itself goes through the RPC).
drop policy if exists hub_employee_skills_select on hub_employee_skills;
create policy hub_employee_skills_select on hub_employee_skills for select to authenticated
  using (
    hub_is_member(org_id, array['owner','manager','trainer']::hub_role[])
    or hub_has_support_grant(org_id)
    or employee_membership_id in (select id from hub_org_memberships where profile_id = auth.uid())
  );
drop policy if exists hub_employee_skills_insert on hub_employee_skills;
create policy hub_employee_skills_insert on hub_employee_skills for insert to authenticated
  with check (hub_is_member(org_id, array['owner','trainer']::hub_role[]));
drop policy if exists hub_employee_skills_update on hub_employee_skills;
create policy hub_employee_skills_update on hub_employee_skills for update to authenticated
  using (hub_is_member(org_id, array['owner','trainer']::hub_role[]))
  with check (hub_is_member(org_id, array['owner','trainer']::hub_role[]));

-- hub_skill_signoff_events: append-only. Insert owner/trainer; NO update/delete
-- policies (and the append-only trigger blocks even privileged mutation).
drop policy if exists hub_skill_signoff_events_select on hub_skill_signoff_events;
create policy hub_skill_signoff_events_select on hub_skill_signoff_events for select to authenticated
  using (
    hub_is_member(org_id, array['owner','manager','trainer']::hub_role[])
    or hub_has_support_grant(org_id)
    or employee_skill_id in (select es.id from hub_employee_skills es
                             join hub_org_memberships m on m.id = es.employee_membership_id
                             where m.profile_id = auth.uid())
  );
drop policy if exists hub_skill_signoff_events_insert on hub_skill_signoff_events;
create policy hub_skill_signoff_events_insert on hub_skill_signoff_events for insert to authenticated
  with check (hub_is_member(org_id, array['owner','trainer']::hub_role[]));

-- hub_sops: every member reads (sop_read tasks require it); staff write.
drop policy if exists hub_sops_select on hub_sops;
create policy hub_sops_select on hub_sops for select to authenticated
  using (hub_is_member(org_id) or hub_has_support_grant(org_id));
drop policy if exists hub_sops_write on hub_sops;
create policy hub_sops_write on hub_sops for all to authenticated
  using (hub_is_member(org_id, array['owner','manager','trainer']::hub_role[]))
  with check (hub_is_member(org_id, array['owner','manager','trainer']::hub_role[]));

-- hub_quizzes: stock readable by any signed-in user; org rows by members; staff write.
drop policy if exists hub_quizzes_select on hub_quizzes;
create policy hub_quizzes_select on hub_quizzes for select to authenticated
  using (org_id is null or hub_is_member(org_id) or hub_has_support_grant(org_id));
drop policy if exists hub_quizzes_write on hub_quizzes;
create policy hub_quizzes_write on hub_quizzes for all to authenticated
  using (org_id is not null and hub_is_member(org_id, array['owner','manager','trainer']::hub_role[]))
  with check (org_id is not null and hub_is_member(org_id, array['owner','manager','trainer']::hub_role[]));

-- hub_quiz_attempts: staff/support read all; employees read own + insert own.
drop policy if exists hub_quiz_attempts_select on hub_quiz_attempts;
create policy hub_quiz_attempts_select on hub_quiz_attempts for select to authenticated
  using (
    hub_is_member(org_id, array['owner','manager','trainer']::hub_role[])
    or hub_has_support_grant(org_id)
    or employee_membership_id in (select id from hub_org_memberships where profile_id = auth.uid())
  );
drop policy if exists hub_quiz_attempts_insert on hub_quiz_attempts;
create policy hub_quiz_attempts_insert on hub_quiz_attempts for insert to authenticated
  with check (
    employee_membership_id in (select id from hub_org_memberships
                               where profile_id = auth.uid() and status = 'active')
    or hub_is_member(org_id, array['owner','manager','trainer']::hub_role[])
  );

-- hub_checkins: staff/support all; employees read their own (summary view).
drop policy if exists hub_checkins_select on hub_checkins;
create policy hub_checkins_select on hub_checkins for select to authenticated
  using (
    hub_is_member(org_id, array['owner','manager','trainer']::hub_role[])
    or hub_has_support_grant(org_id)
    or employee_membership_id in (select id from hub_org_memberships where profile_id = auth.uid())
  );
drop policy if exists hub_checkins_write on hub_checkins;
create policy hub_checkins_write on hub_checkins for all to authenticated
  using (hub_is_member(org_id, array['owner','manager','trainer']::hub_role[]))
  with check (hub_is_member(org_id, array['owner','manager','trainer']::hub_role[]));

-- hub_reports: staff/support read; inserts via hub_save_report RPC.
drop policy if exists hub_reports_select on hub_reports;
create policy hub_reports_select on hub_reports for select to authenticated
  using (hub_is_member(org_id, array['owner','manager','trainer']::hub_role[])
         or hub_has_support_grant(org_id));

-- hub_support_grants: owner/manager manage; the support person sees their own.
drop policy if exists hub_support_grants_select on hub_support_grants;
create policy hub_support_grants_select on hub_support_grants for select to authenticated
  using (hub_is_member(org_id, array['owner','manager']::hub_role[])
         or granted_to_profile_id = auth.uid());

-- hub_audit_events: owner/manager read their org's trail. Writes via definer fns.
drop policy if exists hub_audit_events_select on hub_audit_events;
create policy hub_audit_events_select on hub_audit_events for select to authenticated
  using (org_id is not null and hub_is_member(org_id, array['owner','manager']::hub_role[]));

-- hub_generator_leads / hub_analytics_events: NO policies at all — server-only
-- via the service-role key (api/hub/lead.js, api/hub/events.js). Default deny.
