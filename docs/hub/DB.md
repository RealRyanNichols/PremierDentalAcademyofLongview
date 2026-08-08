# Office Hub — database workflow (staging only)

## Status: NOT APPLIED ANYWHERE
`db/migrations/20260808_hub_schema.sql` has **not** been run against the live
Supabase project (`lmbsuwslsycukynzpzik`) or any other database. Production
application requires Amanda's explicit approval, a backup/export first, and is
listed in the PR's deployment checklist.

## Files
- `db/migrations/20260808_hub_schema.sql` — full up migration: enums, tables
  (all `hub_`-prefixed), indexes, triggers, RLS policies (default deny), and
  `security definer` RPCs. Idempotent (safe to re-run).
- `db/migrations/20260808_hub_schema_down.sql` — full rollback. Drops every
  object the up migration creates, in dependency order, and nothing else.
  It contains `drop table` statements — never run it against a database whose
  hub data you want to keep.
- `db/tests/hub_rls_tests.sql` — RLS proof script (cross-tenant matrix,
  employee restrictions, append-only history, support-grant expiry). Run in a
  single psql session against a **staging** database after seeding.
- `scripts/hub-seed.mjs` — fictional staging seed (refuses production).

## Workflow (matches the repo's convention: hand-applied SQL, kept in git)
1. Create a Supabase **development branch** (or local stack via `supabase start`).
   Never use the production project ref for any of this.
2. Apply the up migration in the SQL editor / `psql`.
3. Seed: `SUPABASE_URL=<staging url> SUPABASE_SERVICE_ROLE_KEY=<staging key> node scripts/hub-seed.mjs`
4. Verify RLS: run `db/tests/hub_rls_tests.sql` (psql; it uses transaction-local
   `set local role` / `request.jwt.claims` to impersonate users and raises on
   any policy leak).
5. Rollback when done experimenting: run `20260808_hub_schema_down.sql`.

## Design notes
- **Default deny**: `alter table … enable row level security` on every `hub_`
  table; tables with no policy for a role are invisible to it. The service-role
  key (server functions only) bypasses RLS by design.
- **Two walls**: role checks live in RPCs (`security definer`, explicit
  `hub_is_member(org, roles)` guards) *and* in RLS policies. Client role is
  never trusted.
- **Append-only**: `hub_skill_signoff_events`, `hub_audit_events`,
  `hub_quiz_attempts`, `hub_analytics_events` have no update/delete policies,
  and sign-off history additionally has a trigger raising on update/delete so
  even future policy mistakes can't rewrite history.
- **Free tier**: enforced in the database (trigger on `hub_plans`) — one active
  plan per org while `plan_tier='free'` — not just in the UI.
- **Invitations**: only a SHA-256 hash of the token is stored; the raw token
  exists only in the returned link. Creation is rate-limited (20/day/org) inside
  the RPC. Accepting is atomic (`hub_accept_invite`).
- **Deletion requests**: `hub_request_deletion(org)` writes the audit event and
  stamps `settings.deletion_requested_at`. Actual purge is a manual runbook
  step (14-day window) — intentionally not automated in MVP.
- **Rollback of the whole feature**: the migration creates only new `hub_*`
  objects and touches no existing tables, so the down script (or reverting the
  PR before production application) fully restores prior behavior.
