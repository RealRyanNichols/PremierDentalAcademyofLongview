# COPY-PASTE PROMPT for the next Claude Code / Cowork session
*(written July 10, 2026 — after PRs #146 & #147 shipped the native course platform + email engine)*

---

## Context (read first, don't rebuild)

Repo `RealRyanNichols/PremierDentalAcademyofLongview` (static HTML + Tailwind CDN, no build
step, Vercel, Supabase project `lmbsuwslsycukynzpzik`). CLAUDE.md is current. The Kajabi
replacement is **built, deployed, and live**:

- `/learn` course platform, `/certificate`, `/career-vault` (real Square checkout, product
  `career_vault` $147), `/admin/courses` builder, `/admin/emails` Email Center.
- Email crons in `api/` (dormant until env vars exist). Automations engine live in TWO edge
  functions: `buy-product` v2 (purchases) and `run-automations` (new leads via
  `trg_automate_new_lead`). Verified end-to-end with a live test lead.
- 4 buyer onboarding drips (3 emails each) already written into `sequence_emails`.
- Kajabi is still the fallback during the parallel run (portal keeps a library link).

## The brick wall — human/browser steps (Amanda or Ryan, ~45 minutes total)

Do these IN ORDER; everything else is blocked behind them:

1. **PAY THE KAJABI BILL ($291.54)** — Kajabi → Settings → Billing. The account suspends
   **July 22** with the un-exported course content inside. This is the deadline that matters.
2. **Kajabi → Contacts → Export** (button only works for the account owner; the CSV arrives
   by email, ~695 contacts). Save it as `kajabi-contacts.csv`.
3. **Resend** (resend.com): upgrade to Pro ($20/mo), add the sending domain
   `premierdentalacademyoflongview.com`, and add the DKIM/SPF DNS records Resend shows
   (DNS is wherever the domain is hosted — likely Vercel Domains). Copy the API key.
4. **Mux** (mux.com): Settings → Access Tokens → create a token (ID + secret). Also create
   a **Signing Key** (for signed playback later) and save both values.
5. **Vercel** → project `premier-dental-academyof-longview` → Settings → Environment
   Variables → add (Production):
   - `SUPABASE_SERVICE_ROLE_KEY` = (Supabase → Settings → API → service_role)
   - `RESEND_API_KEY` = from step 3
   - `RESEND_FROM` = `Amanda Williams <amanda@premierdentalacademyoflongview.com>`
   - `CRON_SECRET` = any random 32+ character string
   - `MUX_TOKEN_ID` / `MUX_TOKEN_SECRET` = from step 4
   Then **redeploy** (Deployments → ⋯ → Redeploy) so functions pick them up.
   NOTE: the vercel.json crons run every 15 min / hourly — that needs the **Pro** plan
   (Hobby only allows daily). Confirm the plan while you're in there.
6. **Locate the 30 email bodies** (`day01.html` … `day30.html`) — they're in the Cowork
   outputs folder on Amanda's Mac (path is in the July 9 blueprint). Drop them into an
   `emails/` folder in the repo (or attach them to the session).

## Then paste this work order to Claude Code

```
Work in RealRyanNichols/PremierDentalAcademyofLongview (read CLAUDE.md first — the course
platform and email engine are already live; do NOT rebuild them). Supabase project
lmbsuwslsycukynzpzik. Do these in order:

1. IMPORT BROADCASTS + CONTACTS. The emails/ folder has day01–day30.html and
   kajabi-contacts.csv is attached. Run:
     SUPABASE_SERVICE_ROLE_KEY=... node scripts/import-emails.mjs --dir ./emails --contacts ./kajabi-contacts.csv
   All 30 campaigns must land as status='draft' (verify in /admin/emails). Verify
   subscriber count ≈ 695 and spot-check unsubscribe_token is set on imported rows.
   Do NOT schedule anything — Amanda flips campaigns to scheduled herself.

2. SMOKE-TEST THE EMAIL ENGINE. With Amanda's test address only: create a tiny test
   campaign audience-tagged to just her, flip it scheduled, confirm the cron sends it
   (check email_sends + her inbox including the List-Unsubscribe header), then clean up.
   Confirm both cron endpoints return 200 with CRON_SECRET and 401 without.

3. KAJABI EXPORT — REDUCED SCOPE (browser session while Kajabi is alive). The lesson
   bodies + quizzes are NOW FULLY BUILT natively (Phase 5) — do NOT overwrite them.
   What still only exists in Kajabi: (a) the sequence email bodies for "PDA 30 Day
   Follow Up" and "FB Lead — 30-Day Enrollment Drip" -> export into sequence_emails
   (the 4 buyer sequences are native — don't touch); (b) an inventory of any
   Kajabi-HOSTED (non-YouTube) lesson videos -> list them for Mux migration;
   (c) spot-compare a handful of Kajabi lessons against /learn and note anywhere
   Amanda prefers the original wording — patch those individually.

4. MUX SIGNED PLAYBACK for paid courses. Env vars MUX_SIGNING_KEY_ID /
   MUX_SIGNING_KEY_PRIVATE exist now. Add api/mux-token.js (entitled-user check → mint
   short-lived playback JWT), set courses.signed_playback=true for rda-program and
   online-rda-12-week and career-vault, pass playback-token in learn.html's <mux-player>,
   and switch api/admin-mux-upload.js default to signed. Public YouTube lessons keep
   working unchanged.

5. STUDENT ONBOARDING EMAIL. Build a one-time script that emails existing Kajabi students
   (profiles with kajabi_id) a "your courses moved — set your password" message with a
   magic link to /learn, using the same Resend pipeline. Draft the copy for Amanda's
   approval BEFORE sending anything.

6. PARALLEL RUN CHECKLIST → CANCEL. After 1–2 clean weeks (emails sending, students using
   /learn): cancel remaining Kajabi-scheduled broadcasts, remove the Kajabi fallback links
   (portal.html + dashboard), update CLAUDE.md, and Amanda cancels Kajabi. Savings begin.

Rules: npm test before every push, CHANGELOG one-liner per push, commits authored
Ryan Nichols <hello@premierdentalacademyoflongview.com>, never expose service keys
client-side, never mention class times (daytime only, point to /calendar), REAL copy only.
```

## Nice-to-have backlog (only after the above)
- `/admin/subscribers` management UI (search, tags, CSV export).
- Broadcast composer in /admin/emails (new-campaign form with the shared email shell).
- Sentry (or Vercel log drains) for error alerts; PostHog/Plausible if UTM clicks aren't enough.
- Date-gated $147→$247 Vault price flip once Amanda picks the real date (same pattern as
  the July 1 tuition cutover — never a fake countdown).
- 301 redirect for premierdentalacademy.net when Amanda finds the registrar.
- Instructor-recruitment + weeks 11–12 content writing (Airtable "Growth To-Dos" has the list).
