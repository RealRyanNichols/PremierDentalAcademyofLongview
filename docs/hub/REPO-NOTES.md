# Office Hub build — Phase 0 repository notes (Aug 8, 2026)

Findings from the pre-build inspection required by the Deliverable-7 prompt (§1).
Nothing was changed during this inspection. Working tree was clean.

## Two load-bearing surprises

### 1. The five companion docs are NOT in the repo
The prompt assumes `docs/hub/` contains `deliverable-2-product-spec.md`,
`deliverable-3-prototype-notes.md`, `deliverable-4-tutorial-package.md`,
`deliverable-5-seo-growth-package.md`, and `pda-office-hub-prototype.html`.
None of them exist anywhere in the repository (searched by name and content).

Consequences for this build:
- The Deliverable-7 prompt itself is detailed enough to build the schema, RLS,
  routes, roles, generator, seed shape, gating, and testing requirements — all
  of that is implemented here.
- Exact **prototype parity** (the 32-screen inventory, microcopy, the PLAN
  object's 27 task titles, the 24 stock skill names, the 5 SOP bodies) could
  not be ported verbatim. Fictional seed content and screens were authored
  fresh to the prompt's stated counts and constraints, and are clearly marked.
- The **20-tutorial package** (D4) and the **D5 §15 analytics event name
  lists / §5 landing outline / §8 article briefs** could not be consumed.
  The tutorial hub ships with the structure plus an initial set of original
  product-help tutorials; analytics event names ship as a documented set in
  `docs/hub/ANALYTICS.md` to be reconciled against D5 when it arrives.
- ACTION FOR AMANDA/RYAN: drop the five companion files into `docs/hub/` and
  a follow-up session can true-up copy, tutorials, and event names.

### 2. The stack is NOT Next.js
The prompt expected Next.js on Vercel. The actual repo is:
- **Static HTML pages at the repo root** (+ subfolders), Tailwind via CDN,
  Inter/Fraunces fonts, **no build step, no framework, no TypeScript**.
- **Vercel serverless functions** in `api/` (plain ESM JS, zero-dependency,
  shared helpers in `api/_common.mjs`; service-role key via `process.env`).
- **Supabase** (auth + Postgres + RLS) accessed from the browser with the
  public anon key (`auth.js` shim → `window.PDA`) and from `api/` functions
  with the service-role key via PostgREST.
- **Clean URLs** via `vercel.json` (`cleanUrls: true`); a page and a same-named
  directory can coexist (existing precedent: `directory.html` + `directory/`).
- **Migrations**: `db/migrations/YYYYMMDD_name.sql`, hand-applied to the live
  Supabase project, written idempotent. No `supabase/migrations/` CLI setup.
- **Tests**: `npm test` = seven static validators in `scripts/check-*.mjs`
  (facts, links, analytics, seo, a11y, sitemap, pricing). No Jest/Playwright.

How the prompt's Next.js-specific asks map onto this stack:
| Prompt ask | Implementation here |
|---|---|
| Server-rendered public pages | Static HTML **is** fully rendered HTML — the "Loading…" anti-goal is avoided by authoring real content into the files |
| Generator works without client JS | Static form does `GET /api/hub/plan`; that serverless function renders the complete result page as HTML. With JS, the same logic runs inline (progressive enhancement) from the shared `assets/hub/plan-builder.mjs` |
| Server actions / route handlers | `api/hub/*.js` serverless functions + Postgres RPCs (`security definer`) for atomic, role-checked mutations |
| `config/business.ts` interim source of truth | The repo already has `assets/site-facts.js` (`window.PDA_FACTS`) as its facts source; the hub adds `assets/hub/hub-config.mjs` for HUB-specific constants (`HUB_DISPLAY_NAME`, `HUB_SLUG`) and mirrors contact facts from site-facts with a parity comment |
| `NEXT_PUBLIC_HUB_ENABLED` feature flag | No server rendering layer exists to gate routes at runtime. Rollback story: this branch touches no existing tables and only appends to `robots.txt`/`sitemap.xml`, so reverting the PR fully restores prior behavior. Noted in DB.md |
| MDX tutorials | Plain HTML pages under `office-hub/tutorials/` following the repo's page conventions |

## Conventions this build follows
- Page skeleton: `<!doctype html>` + Tailwind CDN + Inter/Fraunces + static
  `<title>/<meta description>/<canonical>/OG` in the head (check-seo enforces
  this for indexable pages), `assets/pda-nav.js` for the marketing shell.
- One `<h1>` per page, `<html lang="en">`, viewport meta, `alt` on images
  (check-a11y enforces).
- API functions: ESM, zero-dependency, `export default async function handler(req,res)`,
  helpers imported from `api/_common.mjs`.
- Migrations: idempotent SQL, big header comment stating applied-status.
  **The hub migration is NOT applied to any database** — staging only, by hand.
- New tables all namespaced `hub_` (verified: no existing `hub_` tables in
  `db/migrations/`).
- Auth: Supabase magic-link (`signInWithOtp`) — matches the "never password
  emails" rule; the hub app has its own lightweight shell (`assets/hub/hub-app.js`)
  because the existing `auth.js` shim is student-dashboard-oriented (it falls
  back to an anonymous demo mode, which is wrong for a multi-tenant app).

## Existing profiles table
The live project has `public.profiles` keyed to `auth.users` (used by
dashboard/admin/learn, has `is_admin`, entitlement flags). Per the prompt's
schema note, the hub **reuses `public.profiles`** — `hub_org_memberships.profile_id`
references `profiles(id)`. No `hub_profiles` table is created.

## Other notes
- `TODO-META-LEAD-WEBHOOK.md` exists (Meta CAPI feed). `hub_analytics_events`
  keeps `event_name/props/anon_id/idempotency_key` — flat, timestamped, and
  compatible with a future Conversions API relay. Not implemented here.
- The JS-shell pages the audit flagged (`/skills-lab`, `/tools/*`) are student
  tools excluded from check-seo; the hub's public pages are real static HTML
  and are included in check-seo instead.
- Git: the session's designated branch is `claude/dental-office-hub-build-l2ao59`
  (harness rule) — used instead of the prompt's `feature/office-hub` name.
  Same intent: branch-only, draft PR, no merge, no deploy.
- `.gitlab-ci.yml` note in CLAUDE.md is historical; hosting/CI is GitHub+Vercel.
