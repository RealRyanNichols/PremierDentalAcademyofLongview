# Kajabi migration — Phases 1–5 (course platform + email engine on the site)

> **Phase 5 (July 11, 2026): the courses are FULL and purchasable end-to-end.**
> Every lesson of both 12-week RDA courses now has real content in Supabase:
> weeks 7–10 imported from the repo's `kajabi-weeks-7-12/` package (md5-verified),
> weeks 0–7 authored + adversarially verified by a multi-agent workflow (chapter
> content follows the standard Modern Dental Assisting curriculum; every lesson has
> learning objectives, key terms, chairside notes, exam focus; quizzes are 8-question
> banks in the player's format; Texas-specific rules are NEVER stated as fact —
> lessons point to tsbde.texas.gov), weeks 11–12 created in BOTH courses (career
> week + state-board week, wired to the real site tools). The online $397 purchase
> now routes through buy-product v3 (deployed): account creation, program grant
> (career_track + active portal, what the Kajabi webhook used to do), already-
> enrolled double-charge guard, magic-link email, buyer automations, and an
> enroll-success "Start my course now →" door into /learn. products.online_program
> row is live.

> **Phase 2 (shipped July 10, 2026, same day):** `/career-vault` sales page with REAL
> Square checkout through the `buy-product` engine (products row `career_vault`, $147
> founding / reg $247, `entitlement_flag='career_vault'`, active). `buy-product` v2
> DEPLOYED to production: access emails now deep-link to `/learn?c=<slug>` when the
> entitlement matches a website course, and purchases fire the automations engine
> (subscriber upsert + `buyer_<flag>` tag + sequence rules) — all post-charge,
> best-effort, never-error-after-charge preserved. `/admin/emails` Email Center
> (broadcast scheduling, drip sequence toggles, send log). Nav cutover: student
> "My courses" → `/learn` (Kajabi library remains linked in the portal footer during
> the parallel run); admin nav gains Courses + Emails.

Ships the student course player, the admin course builder, and the email/automation
engine **natively in this repo's stack** so PremierDentalAcademyofLongview.com can host
courses and send email — the groundwork for retiring Kajabi.

## Why this is not the Next.js drop-in package

The handoff blueprint describes a Next.js App Router package (`site/course-platform/`,
`app/learn/page.tsx`, `@/lib/supabase/server`, `<mux-player-react>`). **This repo is not
Next.js** — it is static HTML + Tailwind (CDN) with **no build step**, vanilla JS talking
to Supabase via the public anon key, and Vercel serverless functions in `api/*.js`
(CLAUDE.md hard-rule #1; see `auth.js`, `api/enroll.js`). Converting the live site to
Next.js would break every existing page and violate the "additive only / do not modify
existing pages" guardrail.

The Next.js source package also was not reachable from this environment (it lives on a
local Cowork output path on Amanda's Mac). So everything here was **rebuilt against the
already-live Supabase schema** in the site's real idiom. Same database, same tables, same
entitlement model — different (correct-for-this-repo) front end.

## What shipped (all additive)

| File | Route / role |
|---|---|
| `learn.html` | `/learn` — catalog + course outline + lesson player (YouTube + Mux + quizzes + mark-complete). Single page, query-param routed: `/learn`, `/learn?c=slug`, `/learn?c=slug&m=1&l=2`. |
| `admin/courses.html` | `/admin/courses` — create course (+ optional product row) → module/lesson editor → direct-to-Mux upload → Publish. Admin-gated. |
| `api/_common.mjs` | shared helpers (service-role PostgREST fetch, admin-JWT verify, Resend send, cron-secret check). Import-only. |
| `api/_automations.mjs` | `runAutomations(trigger_type, trigger_value, email)` — data-driven engine over `public.automations` (add_tag / subscribe_sequence / unsubscribe_sequence, with tag cascades). |
| `api/cron-send-scheduled.js` | Broadcast cron (every 15 min) — sends `email_campaigns` where `status='scheduled' AND scheduled_at<=now`, deduped via `email_sends`, batched. |
| `api/cron-process-sequences.js` | Drip cron (hourly) — advances each active `sequence_subscriptions` row one email per due tick; stops on global unsubscribe. |
| `api/automations-run.js` | `POST /api/automations-run` — secret/admin-gated trigger for the engine (for the Square webhook + form hooks). |
| `api/admin-mux-upload.js` / `api/admin-mux-asset.js` | Create a Mux direct upload / poll it to a playback id. Admin-gated. |
| `scripts/import-emails.mjs` | Loads the 30-day calendar into `email_campaigns` as **drafts**; `--contacts file.csv` imports a Kajabi export into `subscribers`. |
| `db/migrations/20260710_course_platform_admin_write.sql` | **Applied.** Adds `profiles.career_vault` + a `products_admin_all` RLS policy. |
| `vercel.json` | adds the two `crons` entries. |

`unsubscribe.html` already existed and already sets `subscribers.status='unsubscribed'`
by token (matches the RLS `public can unsubscribe by token` policy) — no change needed.

## How the pieces authenticate (no new secrets in the client)

- **Reads + admin writes are direct from the browser** with the signed-in user's Supabase
  session. RLS already enforces this: `courses/course_modules/course_lessons/products`
  have `*_admin_all` policies keyed on `profiles.is_admin`; students upsert their own
  `module_progress` (`progress_self` = `auth.uid()=student_id`). This is the same pattern
  as every existing admin page.
- **Crons + the automation engine run server-side** with `SUPABASE_SERVICE_ROLE_KEY`
  (email/sequence/automation tables are admin-only). They are gated by `CRON_SECRET`.
- **Mux endpoints** verify the caller's access token → `profiles.is_admin` before minting
  an upload URL. The `MUX_TOKEN_*` secrets never reach the browser.

## Entitlement model (who can open a course)

`courses.entitlement_flag` → gate in `learn.html`:
- `online_program` → enrolled members (`my_portal_access().enrolled`: real `program` +
  `portal_status='active'`, or staff/admin).
- `career_vault` → `profiles.career_vault = true` (set on purchase, same pattern as
  `exam_prep`/`study_pack`), or admin.
- admins see everything, including unpublished drafts.

Note: RLS lets any authenticated user *read* active course rows, so the entitlement gate is
UX-level (catalog + lesson page). Course *structure* is not secret; real content protection
for paid video is **Mux signed playback** (below). This is the same posture as the current
unlisted-YouTube lessons.

## Env vars to set in Vercel (Settings → Environment Variables)

| Var | Used by | Notes |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | crons, automations, import script | server-side only |
| `RESEND_API_KEY` | crons | Resend Pro; verify the sending domain (DKIM/SPF) first |
| `RESEND_FROM` | crons | `Amanda Williams <amanda@premierdentalacademyoflongview.com>` |
| `CRON_SECRET` | crons | random 32+ chars; Vercel Cron sends it automatically |
| `MUX_TOKEN_ID`, `MUX_TOKEN_SECRET` | Mux endpoints | until set, the uploader shows "Mux not configured" and admins can paste a playback id manually |
| `INTERNAL_SECRET` | automations-run | optional; for server-to-server triggers |

Sub-daily Vercel Crons require a **Pro** plan (Hobby is daily-only) — the blueprint already
budgets for Pro.

## Mux: public vs signed playback

Uploads use `courses.signed_playback` to choose the policy (all three seeded courses are
currently `false` → **public**). Public ships fastest; anyone with the playback id can
stream. For the paid programs, flip `courses.signed_playback=true` **and** implement signed
tokens: add a Mux **signing key** (`MUX_SIGNING_KEY_ID` / `MUX_SIGNING_KEY_PRIVATE`), mint a
short-lived JWT per lesson in a small `api/mux-token` function, and pass it to `<mux-player
playback-token=…>`. Left as a follow-up so nothing blocks launch.

## Schema assumptions (verified against production)

- `module_progress` is keyed on `(student_id, module_number, lesson_number)` with **no
  course_id** — the scheme the dashboard already reads. Progress therefore is not
  course-scoped: a student enrolled in two courses that share a `(module,lesson)` pair would
  see it complete in both. Acceptable because students almost always have one program; kept
  as-is to avoid touching the 62 live rows / the dashboard. Flag for later if multi-course
  enrollment becomes common.
- `email_sequences` uses `key` (text) as its stable id; `automations.action_value` for
  `subscribe_sequence` holds that `key`. The engine resolves sequences by `key`.
- `products` PK is `key` (text); the builder upserts product rows on `key`.
- `sequence_emails` currently has **0 rows** for every sequence, so the drip cron sends
  nothing until that content is imported — a safe default.

## Blocked on inputs from Amanda / a later Cowork session

1. **30 email bodies** (`day01.html … day30.html`) live only in the Cowork output folder.
   Drop them into an `emails/` dir and run `npm run import:emails -- --dir ./emails`
   (they import as drafts). The subjects/preview/dates are already in the script's manifest.
2. **`/career-vault` sales page** — needs the provided HTML + Amanda's real Square checkout
   link. Not built (hard rule: no placeholder payment links live). `learn.html` points
   Vault "get access" at `/waitlist` until it exists.
3. **Kajabi contacts CSV** — `Kajabi → Contacts → Export`, then
   `npm run import:emails -- --contacts ./kajabi-contacts.csv`.
4. **Lesson body text / quizzes for weeks 10–12** — scripted Kajabi export while the account
   is still active.
5. Wiring `runAutomations` into the Square purchase webhook and site lead forms — the engine
   + endpoint are ready; the call sites are documented in `api/automations-run.js`. Left as a
   follow-up to respect "do not modify existing pages" this pass.

## Verify after deploy (preview first)

1. Sign in as an admin → `/admin/courses` → create a draft course → add a module + a lesson
   → (with Mux env) upload a short video, or paste a YouTube URL → Publish.
2. Sign in as an entitled test student → `/learn` → open the course → play the video →
   Mark complete → confirm the progress bar moves and a `module_progress` row was written.
3. `curl -H "Authorization: Bearer $CRON_SECRET" https://<preview>/api/cron-send-scheduled`
   → `200 {"ok":true,...}` (0 sent while no campaign is `scheduled`). Same for
   `/api/cron-process-sequences`.
4. `/unsubscribe?token=<a real token>` → "You're unsubscribed."
