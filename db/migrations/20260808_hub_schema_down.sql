-- ═══════════════════════════════════════════════════════════════════════════
-- Office Onboarding & Competency Hub — FULL ROLLBACK for 20260808_hub_schema.sql.
-- Drops every hub_* object that migration creates, and nothing else.
-- ⚠ DESTRUCTIVE: drops hub tables and their data. Never run against a database
-- whose hub data you want to keep. Staging/branch databases only.
-- ═══════════════════════════════════════════════════════════════════════════

drop view if exists hub_weekly_training_actions;

drop function if exists hub_request_deletion(uuid);
drop function if exists hub_save_report(uuid, uuid, jsonb);
drop function if exists hub_archive_member(uuid, text);
drop function if exists hub_log_support_view(uuid, text);
drop function if exists hub_revoke_support_grant(uuid);
drop function if exists hub_create_support_grant(uuid, text, text, int);
drop function if exists hub_revoke_invitation(uuid);
drop function if exists hub_accept_invite(text);
drop function if exists hub_invite_preview(text);
drop function if exists hub_create_invitation(uuid, text, hub_role);
drop function if exists hub_sign_off_skill(uuid, uuid, uuid, hub_skill_state, text, date);
drop function if exists hub_org_people(uuid);
drop function if exists hub_create_workspace(text, text);
drop function if exists hub_audit(uuid, text, text, uuid, jsonb);
drop function if exists hub_my_membership(uuid);

-- Tables (children before parents; policies and triggers drop with them).
drop table if exists hub_analytics_events;
drop table if exists hub_generator_leads;
drop table if exists hub_audit_events;
drop table if exists hub_support_grants;
drop table if exists hub_reports;
drop table if exists hub_checkins;
drop table if exists hub_quiz_attempts;
drop table if exists hub_quizzes;
drop table if exists hub_sops;
drop table if exists hub_skill_signoff_events;
drop table if exists hub_employee_skills;
drop table if exists hub_skills;
drop table if exists hub_plan_tasks;
drop table if exists hub_plans;
drop table if exists hub_templates;
drop table if exists hub_invitations;
drop table if exists hub_org_memberships;
drop table if exists hub_locations;
drop table if exists hub_organizations;

-- Helper/trigger functions referenced only by dropped objects.
drop function if exists hub_has_support_grant(uuid);
drop function if exists hub_is_member(uuid, hub_role[]);
drop function if exists hub_guard_task_update();
drop function if exists hub_audit_membership_change();
drop function if exists hub_enforce_free_tier();
drop function if exists hub_block_mutation();
drop function if exists hub_enforce_parent_org();
drop function if exists hub_set_updated_at();

-- Enums last (nothing references them anymore).
drop type if exists hub_plan_status;
drop type if exists hub_sop_status;
drop type if exists hub_sop_kind;
drop type if exists hub_invite_status;
drop type if exists hub_skill_state;
drop type if exists hub_task_status;
drop type if exists hub_task_kind;
drop type if exists hub_phase;
drop type if exists hub_plan_tier;
drop type if exists hub_role;

-- pgcrypto is shared platform infrastructure — intentionally NOT dropped.
