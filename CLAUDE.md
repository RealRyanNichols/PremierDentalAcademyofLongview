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
- `*.html` (root)       pages: /, /night-class, /dashboard, /login, /enroll,
                        /admin, /about, /classes, /calendar, /graduates,
                        /salary, the East-Texas city landing pages, etc.
- `assets/`             shared JS (pda-nav, pda-seo, ask-premier, social proof,
                        feedback) + logos/favicons/og-cover.
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
- Square location id `2P2ZE3FJNEYTV`. Plans: in-person $1,997, online $397.
- Takes a $200+ down payment now and schedules the balance as a Square auto-pay
  installment invoice (clean round amounts). Idempotency keys are derived from
  the card nonce so a re-submit can't double-charge. Never errors after a charge.

## HELD — do not ship
- The night-class "$200 down / $1,497" offer section stays OUT of production
  until Ryan provides a REAL Square/Stripe $200-deposit checkout link for the
  $1,497 offer. Do not wire a placeholder payment link live.

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

## To continue building
Describe what you want. This file is your memory: read the repo, propose a short
plan, then make focused changes that follow the rules above.
