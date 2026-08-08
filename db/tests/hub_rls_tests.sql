-- ═══════════════════════════════════════════════════════════════════════════
-- Office Hub RLS proof script. STAGING ONLY. Run with psql as postgres AFTER
-- applying 20260808_hub_schema.sql:   psql "$STAGING_DB_URL" -f db/tests/hub_rls_tests.sql
-- Runs in ONE transaction and ROLLS BACK — leaves no data behind.
-- Any policy leak raises an exception (script exits non-zero via ON_ERROR_STOP).
-- ═══════════════════════════════════════════════════════════════════════════
\set ON_ERROR_STOP on
begin;

-- ── Fixtures (fictional; rolled back at the end) ────────────────────────────
insert into auth.users (id, email) values
  ('a0000000-0000-0000-0000-00000000000a', 'owner-a@example.com'),
  ('a0000000-0000-0000-0000-00000000000b', 'trainer-a@example.com'),
  ('a0000000-0000-0000-0000-00000000000c', 'employee-a@example.com'),
  ('b0000000-0000-0000-0000-00000000000a', 'owner-b@example.com'),
  ('c0000000-0000-0000-0000-00000000000a', 'support@example.com')
on conflict (id) do nothing;
insert into public.profiles (id, email) values
  ('a0000000-0000-0000-0000-00000000000a', 'owner-a@example.com'),
  ('a0000000-0000-0000-0000-00000000000b', 'trainer-a@example.com'),
  ('a0000000-0000-0000-0000-00000000000c', 'employee-a@example.com'),
  ('b0000000-0000-0000-0000-00000000000a', 'owner-b@example.com'),
  ('c0000000-0000-0000-0000-00000000000a', 'support@example.com')
on conflict (id) do nothing;

insert into hub_organizations (id, name) values
  ('0a000000-0000-0000-0000-000000000001', 'Test Org A (fictional)'),
  ('0b000000-0000-0000-0000-000000000001', 'Test Org B (fictional)');
insert into hub_locations (org_id) values
  ('0a000000-0000-0000-0000-000000000001'), ('0b000000-0000-0000-0000-000000000001');
insert into hub_org_memberships (id, org_id, profile_id, role) values
  ('11000000-0000-0000-0000-000000000001','0a000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-00000000000a','owner'),
  ('11000000-0000-0000-0000-000000000002','0a000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-00000000000b','trainer'),
  ('11000000-0000-0000-0000-000000000003','0a000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-00000000000c','employee'),
  ('11000000-0000-0000-0000-000000000004','0b000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-00000000000a','owner');
insert into hub_skills (id, org_id, category, title) values
  ('22000000-0000-0000-0000-000000000001', null, 'Test', 'Stock skill'),
  ('22000000-0000-0000-0000-000000000002', '0b000000-0000-0000-0000-000000000001', 'Test', 'Org B skill');
insert into hub_plans (id, org_id, employee_membership_id, start_date) values
  ('33000000-0000-0000-0000-000000000001','0a000000-0000-0000-0000-000000000001','11000000-0000-0000-0000-000000000003','2026-08-10');
insert into hub_plan_tasks (id, plan_id, org_id, phase, day_offset, kind, title) values
  ('44000000-0000-0000-0000-000000000001','33000000-0000-0000-0000-000000000001','0a000000-0000-0000-0000-000000000001','d30',1,'task','A task'),
  ('44000000-0000-0000-0000-000000000002','33000000-0000-0000-0000-000000000001','0a000000-0000-0000-0000-000000000001','d30',2,'skill','A skill task');
update hub_plan_tasks set skill_id = '22000000-0000-0000-0000-000000000001'
 where id = '44000000-0000-0000-0000-000000000002';
insert into hub_employee_skills (id, org_id, employee_membership_id, skill_id, state) values
  ('55000000-0000-0000-0000-000000000001','0a000000-0000-0000-0000-000000000001','11000000-0000-0000-0000-000000000003','22000000-0000-0000-0000-000000000001','observed');
insert into hub_skill_signoff_events (org_id, employee_skill_id, actor_membership_id, from_state, to_state) values
  ('0a000000-0000-0000-0000-000000000001','55000000-0000-0000-0000-000000000001','11000000-0000-0000-0000-000000000002','not_started','observed');
insert into hub_sops (org_id, kind, title) values
  ('0a000000-0000-0000-0000-000000000001','sterilization','Org A SOP'),
  ('0b000000-0000-0000-0000-000000000001','sterilization','Org B SOP');
insert into hub_checkins (org_id, employee_membership_id, author_membership_id, week_of, next_plan) values
  ('0a000000-0000-0000-0000-000000000001','11000000-0000-0000-0000-000000000003','11000000-0000-0000-0000-000000000001','2026-08-10','keep going');
insert into hub_generator_leads (role_interest, inputs) values ('dental_assistant', '{}');
insert into hub_analytics_events (event_name, idempotency_key) values ('rls_test', 'rls-test-1');

-- Impersonation helper: run a check as a given auth uid.
create or replace function pg_temp.impersonate(p_uid uuid) returns void language plpgsql as $$
begin
  execute format('set local request.jwt.claims = %L',
    json_build_object('sub', p_uid, 'role', 'authenticated')::text);
  set local role authenticated;
end $$;
create or replace function pg_temp.as_postgres() returns void language plpgsql as $$
begin reset role; set local request.jwt.claims to default; end $$;

-- ── 1. Cross-tenant matrix: org A members see ZERO org B rows, every table ──
do $$
declare t text; n bigint;
begin
  perform pg_temp.impersonate('a0000000-0000-0000-0000-00000000000a'); -- owner of A
  foreach t in array array['hub_locations','hub_org_memberships','hub_invitations',
    'hub_templates','hub_plans','hub_plan_tasks','hub_employee_skills',
    'hub_skill_signoff_events','hub_sops','hub_quizzes','hub_quiz_attempts',
    'hub_checkins','hub_reports','hub_support_grants','hub_audit_events']
  loop
    execute format('select count(*) from %I where org_id = %L', t,
                   '0b000000-0000-0000-0000-000000000001') into n;
    if n > 0 then raise exception 'LEAK: org A owner sees % org-B rows in %', n, t; end if;
  end loop;
  execute 'select count(*) from hub_organizations where id = ''0b000000-0000-0000-0000-000000000001''' into n;
  if n > 0 then raise exception 'LEAK: org A owner sees org B organization row'; end if;
  execute 'select count(*) from hub_skills where org_id = ''0b000000-0000-0000-0000-000000000001''' into n;
  if n > 0 then raise exception 'LEAK: org A owner sees org B skills'; end if;
  -- cross-tenant write must hit zero rows
  execute 'update hub_sops set title = ''hacked'' where org_id = ''0b000000-0000-0000-0000-000000000001''';
  get diagnostics n = row_count;
  if n > 0 then raise exception 'LEAK: org A owner updated an org B SOP'; end if;
  perform pg_temp.as_postgres();
  raise notice 'PASS: cross-tenant matrix (org A cannot see/touch org B on any table)';
end $$;

-- ── 2. Server-only tables invisible to every authenticated user ─────────────
do $$
declare n bigint;
begin
  perform pg_temp.impersonate('a0000000-0000-0000-0000-00000000000a');
  select count(*) from hub_generator_leads into n;
  if n > 0 then raise exception 'LEAK: generator leads visible to client'; end if;
  select count(*) from hub_analytics_events into n;
  if n > 0 then raise exception 'LEAK: analytics events visible to client'; end if;
  perform pg_temp.as_postgres();
  raise notice 'PASS: leads/analytics are server-only';
end $$;

-- ── 3. Employee restrictions ────────────────────────────────────────────────
do $$
declare n bigint; ok boolean := false;
begin
  perform pg_temp.impersonate('a0000000-0000-0000-0000-00000000000c'); -- employee of A
  -- cannot see audit events or invitations
  select count(*) from hub_audit_events into n;
  if n > 0 then raise exception 'LEAK: employee sees audit events'; end if;
  select count(*) from hub_invitations into n;
  if n > 0 then raise exception 'LEAK: employee sees invitations'; end if;
  -- cannot write employee_skills (sign-off is owner/trainer only)
  begin
    insert into hub_employee_skills (org_id, employee_membership_id, skill_id, state)
    values ('0a000000-0000-0000-0000-000000000001','11000000-0000-0000-0000-000000000003',
            '22000000-0000-0000-0000-000000000002','independent');
  exception when insufficient_privilege or others then ok := true;
  end;
  if not ok then raise exception 'LEAK: employee inserted a skill sign-off'; end if;
  -- CAN complete own ordinary task
  update hub_plan_tasks set status = 'done' where id = '44000000-0000-0000-0000-000000000001';
  if not found then raise exception 'FAIL: employee could not complete own task'; end if;
  -- CANNOT complete a skill-kind task by status flip: RLS filters the row
  -- (0 rows affected) or the guard trigger raises — either way status stays todo.
  begin
    update hub_plan_tasks set status = 'done' where id = '44000000-0000-0000-0000-000000000002';
  exception when others then null;
  end;
  perform pg_temp.as_postgres();
  select count(*) from hub_plan_tasks
   where id = '44000000-0000-0000-0000-000000000002' and status = 'todo' into n;
  if n <> 1 then raise exception 'LEAK: employee completed a skill task without sign-off'; end if;
  raise notice 'PASS: employee restrictions (no audit/invites, no sign-off, no skill-task flips)';
end $$;

-- ── 4. Sign-off history is append-only, even for the table owner ────────────
do $$
declare ok boolean := false;
begin
  begin
    update hub_skill_signoff_events set note = 'rewrite history';
  exception when others then ok := true; end;
  if not ok then raise exception 'FAIL: sign-off history was updatable'; end if;
  ok := false;
  begin
    delete from hub_skill_signoff_events;
  exception when others then ok := true; end;
  if not ok then raise exception 'FAIL: sign-off history was deletable'; end if;
  raise notice 'PASS: sign-off history append-only';
end $$;

-- ── 5. Support grants: blocked without, read-only with, blocked after expiry ─
do $$
declare n bigint; ok boolean := false;
begin
  -- no grant: support profile sees nothing in org A
  perform pg_temp.impersonate('c0000000-0000-0000-0000-00000000000a');
  select count(*) from hub_sops where org_id = '0a000000-0000-0000-0000-000000000001' into n;
  if n > 0 then raise exception 'LEAK: support sees org A without a grant'; end if;
  perform pg_temp.as_postgres();
  -- active grant: read-only visibility
  insert into hub_support_grants (id, org_id, granted_by, granted_to_profile_id, expires_at)
  values ('66000000-0000-0000-0000-000000000001','0a000000-0000-0000-0000-000000000001',
          '11000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-00000000000a', now() + interval '1 hour');
  perform pg_temp.impersonate('c0000000-0000-0000-0000-00000000000a');
  select count(*) from hub_sops where org_id = '0a000000-0000-0000-0000-000000000001' into n;
  if n = 0 then raise exception 'FAIL: support cannot read with an active grant'; end if;
  begin
    update hub_sops set title = 'support edit' where org_id = '0a000000-0000-0000-0000-000000000001';
    if found then raise exception 'LEAK: support wrote through a read-only grant'; end if;
  exception when insufficient_privilege then null; end;
  perform pg_temp.as_postgres();
  -- expired grant: blocked again
  update hub_support_grants set expires_at = now() - interval '1 minute'
   where id = '66000000-0000-0000-0000-000000000001';
  perform pg_temp.impersonate('c0000000-0000-0000-0000-00000000000a');
  select count(*) from hub_sops where org_id = '0a000000-0000-0000-0000-000000000001' into n;
  if n > 0 then raise exception 'LEAK: support reads through an EXPIRED grant'; end if;
  perform pg_temp.as_postgres();
  -- revoked grant: blocked
  update hub_support_grants set expires_at = now() + interval '1 hour', revoked_at = now()
   where id = '66000000-0000-0000-0000-000000000001';
  perform pg_temp.impersonate('c0000000-0000-0000-0000-00000000000a');
  select count(*) from hub_sops where org_id = '0a000000-0000-0000-0000-000000000001' into n;
  if n > 0 then raise exception 'LEAK: support reads through a REVOKED grant'; end if;
  perform pg_temp.as_postgres();
  raise notice 'PASS: support grants (deny / read-only / expiry / revoke)';
end $$;

-- ── 6. Free-tier gate: second active plan rejected at the database ──────────
do $$
declare ok boolean := false;
begin
  begin
    insert into hub_plans (org_id, employee_membership_id, start_date)
    values ('0a000000-0000-0000-0000-000000000001','11000000-0000-0000-0000-000000000002','2026-08-10');
  exception when others then ok := true; end;
  if not ok then raise exception 'FAIL: free tier allowed a second active plan'; end if;
  raise notice 'PASS: free-tier gate enforced in the database';
end $$;

-- ── 7. Audit rows written for role changes ──────────────────────────────────
do $$
declare n bigint;
begin
  update hub_org_memberships set role = 'manager' where id = '11000000-0000-0000-0000-000000000002';
  select count(*) from hub_audit_events
   where org_id = '0a000000-0000-0000-0000-000000000001' and action = 'MEMBER_ROLE_CHANGED' into n;
  if n = 0 then raise exception 'FAIL: role change did not audit'; end if;
  raise notice 'PASS: role changes audited';
end $$;

rollback;
\echo '✓ hub RLS tests passed (all changes rolled back)'
