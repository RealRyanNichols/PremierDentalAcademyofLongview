# Office Hub — E2E suite (staging only, NOT yet executed)

Status: **written as a scaffold, not run.** The full flow needs a seeded
staging Supabase branch (auth + RLS + RPCs) plus a Vercel preview URL; this
repo has no test-runner dependency installed (the site is intentionally
zero-dependency). Honest state, per the build rules: nothing here is claimed
as passing.

## To run (once a staging DB + preview exist)
1. Apply `db/migrations/20260808_hub_schema.sql` to a Supabase **branch** DB.
2. Seed: `SUPABASE_URL=<staging> SUPABASE_SERVICE_ROLE_KEY=<staging> npm run seed:hub`
3. `npm i -D @playwright/test` (dev-only; do not commit node_modules)
4. `HUB_BASE_URL=<vercel-preview-url> npx playwright test tests/hub-e2e/`
   - The pre-installed Chromium works via `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`
     in Claude Code cloud sessions; locally Playwright downloads its own.
5. Magic-link auth in E2E: use the Supabase admin API to mint session tokens
   for the fictional demo users (see `hub-flow.spec.mjs` helpers) — never real
   people.

## Coverage in the spec (mirrors Deliverable-7 §12's 16-step flow)
generator complete (no-JS + JS paths) → workspace create → template plan →
invite create/copy → accept → employee completes a task → trainer signs off →
needs-coaching + re-check → weekly check-in → readiness report print CSS →
archive with reason → empty state → permission-denied (employee on /hub/settings)
→ expired invite screen → offline save-retry (context.setOffline) → mobile
viewport bottom tab bar → 404.

Plus: role-matrix route table (owner/manager/trainer/employee/support/logged-out
× every /hub route), SEO checks (JS-disabled fetch of public routes contains the
primary content; /hub/* carries noindex), and axe-core passes on the 8 main
screens — see the spec file's TODO markers for the axe integration.
