# Premier Dental Academy of Longview — project memory (read me first)

Claude Code auto-loads this file. It is the standing context so any new session
"just knows" the project. Keep it current.

## What this is
The live website for Premier Dental Academy of Longview — a Registered Dental
Assistant (RDA) training school in Longview, TX.
Live: https://www.premierdentalacademyoflongview.com (apex + www).

## Stack & hosting
- Static HTML + Tailwind (CDN) + Inter/Fraunces fonts. No build step.
- Supabase (project `lmbsuwslsycukynzpzik`) — auth, student dashboard, admin, RLS.
  The client uses the PUBLIC anon/publishable key (safe to ship in client code).
- Square — enrollment payments via the serverless function `api/enroll.js`.
- Hosted on Vercel. Clean URLs via `vercel.json` (`cleanUrls: true`): pages are
  root-level HTML served without `.html` (e.g. `/night-class`).

## Repo layout (flattened — pages at the repo root)
- `*.html` (root)       pages: /, /dashboard, /login, /enroll, /admin, /about,
                        /classes, /calendar, /graduates, /salary,
                        /sponsor-a-student, /paperwork (day-one e-enrollment),
                        the East-Texas city landing pages, etc. (/night-class
                        is a redirect stub → /classes)
- `go/`                 noindex ad funnels: /go/dental-assistant (general) +
                        persona funnels (moms, single-moms, fresh-start,
                        career-change, laid-off) on assets/funnel-kit.js/css.
- `assets/`             shared JS: pda-nav (marketing shell), admin-nav +
                        student-nav (admin/student shells), pda-track
                        (first-party analytics → page_visits, rolled up nightly
                        into daily_stats), pda-seo, ask-premier, funnel-kit,
                        social proof, feedback + logos/favicons/og images.
- `auth.js` (root)      Supabase auth shim.
- `tools/`              student tools: practice-pro (Dentrix-style trainer with
                        the anatomical tooth chart), chairside, flashcards,
                        practice-exam, resume-builder, how-to-chart.
- `admin/`              admin pages: index, leads (pipeline + messages inbox),
                        progress (teacher gradebook), students, instructors,
                        chat, feedback, whoami.
- `blog/`               posts.
- `api/enroll.js`       Square checkout (serverless). See "Payments".
- `db/migrations/`      Supabase schema, RLS, RPCs, triggers (already applied to
                        the live project; kept here for version control).
- `supabase/functions/` edge function source.
- `vercel.json`         { "cleanUrls": true }
- `.gitlab-ci.yml`      GitLab secret detection (keep it).

## Hard rules (do not break)
1. Clean URLs stay working (`/night-class`, not `/night-class.html`).
2. Supabase RLS stays enforced; admin-only data stays admin-only. Admin is
   recognized via `profiles.is_admin` OR the `app_metadata` JWT claim (a DB
   trigger keeps the claim in sync). Never expose PII.
3. Square: NEVER return an error to the buyer after a successful charge.
4. Marketing copy is REAL ONLY — no fabricated names, claims, or statistics.
5. Never commit secrets. The Supabase anon key is public and fine in client
   code. `SQUARE_ACCESS_TOKEN`, service-role keys, and any access tokens live in
   Vercel env vars — never in the repo.
6. Commits: author `Ryan Nichols <hello@premierdentalacademyoflongview.com>`,
   normal cadence. Do NOT tag commits, PRs, or code as machine-generated.

## Payments (api/enroll.js)
- Vercel serverless function; reads `SQUARE_ACCESS_TOKEN` from Vercel env.
- Square location id `2P2ZE3FJNEYTV`. Since July 1, 2026: in-person **$3,000
  paid in full** OR **$3,500 on a plan** ($500 down + $3,000 balance, weekly or
  monthly, up to ~13 installments / 12 months; certificate issued when tuition
  is paid in full). Online $397 (sale; reg $997). Idempotency keys are derived
  from the card nonce so a re-submit can't double-charge. Never errors after a
  charge.
- `supabase/functions/buy-product` is the one checkout engine for every item
  in `public.products` (guest checkout, entitlement grant, Kajabi sync, Resend
  access email). Dormant `ms_*` mini-products stay `active=false` until they
  have a delivery PDF + page — see docs/mini-products-launch-checklist.md.
- Deploy checklist: `npm test` (includes `check:pricing`, which fails on any
  page contradicting the payment engine) + one-line entry in CHANGELOG.md.

## STANDING PRIORITY — automation-first for Amanda (July 2026 →)
- Amanda has very limited hands-on availability through fall 2026. Default to
  AUTOMATION: anything she'd do manually (onboarding, notifications, follow-ups,
  reporting) should become a self-serve flow or scheduled job. Batch questions
  for her; never build things that require her daily clicking.
- Day-One enrollment is electronic: students fill /paperwork on their phones →
  account created, signed form stored (enrollment_forms, admin-only), welcome
  email + supply list + magic link sent, payment routed (cash flagged for
  Square, card → /enroll checkout). Staff view: /admin/paperwork.
- Browser/manual tasks (Meta tokens, Kajabi admin, ads) go on a Cowork request
  doc — see docs/COWORK-REQUEST-2026-07-07.md for the pattern. Do NOT ask Ryan
  or Amanda to do these one-by-one.

## CRITICAL — schedule facts (per Amanda, July 6, 2026)
- PDA NO LONGER OFFERS NIGHT/EVENING CLASSES. Never state or imply evening/night class
  times anywhere (site, blog, emails, ads). The old "Tue/Thu 5:30–9pm" and "MWF 6–9pm
  + Sat 9–1" schedules are DEAD COPY — do not reuse them from old posts or git history.
- Supabase `cohorts.schedule` strings were neutralized on Jul 6, 2026 to "Call or text
  (903) 913-6444 for current class days & times". Do not restore old schedule strings.
- /night-class is a redirect stub → /classes. The blog post night-class-training-after-work
  was published and removed the same day. Do not recreate night-class content.
- CONFIRMED by Amanda (Jul 7, 2026): classes are DAYTIME now; cohort start dates are
  unchanged (Aug 17, Aug 25, Sep 14, Sep 29, Nov 9, Nov 17). Exact daytime hours NOT yet
  provided — say "daytime classes" and point to (903) 913-6444 / /calendar. NEVER invent times.
- Per Amanda: LEAVE the weekend-evening-dental-assistant-classes-texas post (now generic,
  no PDA evening claims) and the index.html "evenings-and-weekends" testimonial (real
  historical quote). Revisit once exact daytime hours are published.

## HELD — do not ship
- The night-class "$200 down / $1,497" offer section stays OUT of production
  until Ryan provides a REAL Square/Stripe $200-deposit checkout link for the
  $1,497 offer. Do not wire a placeholder payment link live.

## Active marketing: daily email list test (June 2026)
- Amanda is running a list test: ONE email/day to the ENTIRE Kajabi list at 6:30 PM CT,
  started Monday the week of June 15, to see if CLICK-THROUGH and sales pick up. May
  extend to 2–4 weeks. Optimize for CLICKS, not opens (Apple Mail Privacy Protection
  makes open rates unreliable).
- Email bodies live in `marketing/series/day-01..28-*.html` — paste each into a Kajabi
  broadcast "Custom Code" block. Subjects + calendar in `marketing/series/README.md`.
  Each is inline-styled and click-loaded (quick-links bar + "more to explore" row + buy
  buttons + tool links + share + tap-to-call/text).
- Sending/scheduling is a KAJABI ADMIN action done inside Kajabi by Amanda or a
  browser-capable assistant. THIS repo/agent has NO Kajabi login or send API — it
  CANNOT send broadcasts or read open/click stats. Build the email files here; hand off
  the sending.

## Online course is missing weeks 6–12 (June 2026)
- The Kajabi ONLINE RDA course is missing modules 6–12; the IN-PERSON course has all 12
  built. They must mirror (same 12 modules listed on the homepage). Fastest fix = CLONE
  the in-person lessons into the online product (in-person 6–12 are confirmed built).
- Full handoff/runbook: `docs/HANDOFF-kajabi-online-course-buildout.md`. This is a
  Kajabi-admin job; the repo/agent cannot do it (no Kajabi access).

## Migration status (June 2026)
- Moved off a SUSPENDED personal GitHub repo onto this GitLab repo
  `RealRyanNichols/premier-dental-academy` (default branch `main`).
- `api/enroll.js`, `db/migrations/`, `supabase/functions/` were restored here
  (they had not made the first snapshot).
- ONE-TIME HUMAN STEP LEFT: connect Vercel -> GitLab so pushes deploy.
  Vercel -> project `premier-dental-academyof-longview` -> Settings -> Git:
  disconnect the old GitHub repo, connect this GitLab repo, set production
  branch `main`, keep the `premierdentalacademyoflongview.com` domain. After
  that, pushing to `main` auto-deploys to production.

## Deploy & verify
- Production deploys from `main` once Vercel<->GitLab is connected.
- After any deploy, confirm these return HTTP 200:
  /, /night-class, /dashboard, /login, /enroll, /api/enroll, /admin.

## Dev quality gates (2026 site upgrade)
`npm test` runs five static validators (no build step) — run before every push:
- `check:facts` — business facts in `assets/site-facts.js` (`window.PDA_FACTS`); fails on
  blank facts, warns on owner-confirmation items (`docs/known-decisions-needed.md`).
- `check:links` — internal links resolve (cleanUrls-aware).
- `check:analytics` — `assets/pda-analytics.js` loads + is no-op safe.
- `check:seo` — every indexable page has static title/description/canonical + OG.
- `check:a11y` — `<html lang>`, viewport, `<img alt>`, single `<h1>`.

Shared client modules (auto-loaded site-wide by `assets/pda-nav.js`):
- `pda-nav.js` — canonical nav + shared footer; also loads site-facts & analytics.
- `pda-analytics.js` — `window.PDA.track()` + UTM attribution; auto-fires on any
  `[data-event]` element. Event names + provider setup: `docs/analytics-events.md`.
- `site-facts.js` — single source of truth for name/address/phone/pricing/length.

Lead capture: `/apply`, `/waitlist`, `/tour`, `/study-guide`,
`/employers/request-graduate`, and the practice-exam unlock all insert into `public.leads`
(anon key, public INSERT RLS) with a honeypot + UTM attribution folded into the
admin-visible `message`. New-lead emails are built but OFF until deployed —
`docs/lead-email-runbook.md`. Full pre-launch checklist: `docs/launch-qa.md`.

NOTE: hosting/CI is on GitHub now (PRs auto-deploy via Vercel); the GitLab notes above
are historical.

## Growth memory (July 7, 2026 — battle report; full backlog in Airtable "PDA Content Engine" → Growth To-Dos)
- TWC Career School License **#S5316** VERIFIED (TWC directory schoolId 5316) — badge shipped in the
  shared footer (pda-nav.js). Keep it there.
- PRICING RULE (Amanda, 7/7/26): **NO marketed discounts on the $3,000 in-person price.** Discounts
  are case-by-case only if a student raises it — never advertised, no promo codes.
- Online $397 sale has NO end date in code. When Amanda picks the $997 flip date, build a date-gated
  auto-flip (same pattern as the July 1 in-person cutover) — never a fake countdown.
- Google Business Profile CHECKED LIVE 7/7/26 — it's actually correct (2800 Gilmer Rd Ste 106, right
  phone/site) and Amanda's Google account HAS management access. 5.0★, 21 reviews. Remaining GBP work:
  photos are stale (711+ days old — upload fresh ones), use "Add update" weekly. The OLD 1405 McCann Rd
  address only survives in THIRD-PARTY listings (BBB, Longview Chamber/GrowthZone, Waze/HERE, Instagram
  bio) — see the NAP-cleanup item in Airtable Growth To-Dos for the fix list.
- Old domain premierdentalacademy.net is still live — 301-redirect it to the main domain when Amanda
  locates the registrar.
- INSTRUCTOR GAP: no dedicated instructor yet; course currently self-taught (Kajabi + site). Do not
  overstate "instructor-led" in new marketing until Amanda confirms what happens in the room. Two
  instructor applications sit in admin (May 27 + July 6, status new). Plan: office hours + group chat
  now → recruit from 17 hiring partners → film modules with a working RDA.
- Main competitor: longviewdentalassistant.com (Zollege franchise; Saturdays-only 8-12:30, reviews +
  citations power their #1). Never name competitors negatively in content; win by being more useful.

## To continue building
Describe what you want. This file is your memory: read the repo, propose a short
plan, then make focused changes that follow the rules above.
