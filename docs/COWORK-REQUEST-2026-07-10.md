# Cowork request — July 10, 2026 (Kajabi exit: accounts, keys, exports)
*Paste the prompt below into a browser-capable Claude (Cowork / local agent mode) on
Amanda's Mac. Everything here needs a browser or the local filesystem — the repo side is
already built and live (see docs/kajabi-migration-phase1.md and CLAUDE.md).*

---

## PROMPT — copy everything below this line

You are doing the account/browser legwork for Premier Dental Academy of Longview's Kajabi
exit. The website already has its own course platform (/learn), checkout, email engine,
and automations — your job is credentials, DNS, and exports. Work through these in order
and report each result. Never paste secrets into chat logs or documents — put them
directly where each step says.

### 1. Kajabi — keep the account alive, then export
- Sign in at app.kajabi.com (Amanda's login).
- Settings → Billing: confirm the $291.54 balance is paid / auto-pay is on. The account
  must NOT suspend before our export is done (suspension date if unpaid: July 22).
- Contacts → Export all contacts. Kajabi emails the CSV — download it and save it to the
  Desktop as `kajabi-contacts.csv`.
- Do NOT cancel Kajabi yet. That happens only after the parallel run (last step of the
  migration plan).

### 2. Resend — sending domain + API key
- Sign in at resend.com (create the account with hello@premierdentalacademyoflongview.com
  if none exists).
- Check the plan: we send ~695 contacts × 1 email/day ≈ 21k/month. The free tier caps at
  100 emails/DAY, which is too small — upgrade to **Pro ($20/mo)**.
- Domains → Add Domain → `premierdentalacademyoflongview.com`. Resend shows DKIM/SPF DNS
  records. Add those records where the domain's DNS lives — check Vercel first
  (vercel.com → team realryannichols → project `premier-dental-academyof-longview` →
  Domains). Wait for Resend to show **Verified**.
- API Keys → Create ("PDA website"), full sending access. Copy it — you'll paste it into
  Vercel in step 4. 

### 3. Mux — video hosting tokens
- Sign in at mux.com (create an account if needed — Amanda may already have one).
- Settings → Access Tokens → Generate new token: environment = Production, permissions =
  Mux Video (full access). Save the TOKEN ID and TOKEN SECRET for step 4.
- Settings → Signing Keys → Create signing key. Save the KEY ID and the PRIVATE KEY
  (base64) — these enable private (signed) playback for paid course videos later.

### 4. Vercel — environment variables + plan
- vercel.com → project `premier-dental-academyof-longview` → Settings → Environment
  Variables. Add each of these for **Production** (and Preview):
  - `SUPABASE_SERVICE_ROLE_KEY` — from supabase.com → project `lmbsuwslsycukynzpzik` →
    Settings → API → service_role key
  - `RESEND_API_KEY` — from step 2
  - `RESEND_FROM` — exactly: `Amanda Williams <amanda@premierdentalacademyoflongview.com>`
    (if that mailbox doesn't exist, use `hello@premierdentalacademyoflongview.com`)
  - `CRON_SECRET` — generate 32+ random characters (password generator is fine)
  - `MUX_TOKEN_ID` and `MUX_TOKEN_SECRET` — from step 3
  - `MUX_SIGNING_KEY_ID` and `MUX_SIGNING_KEY_PRIVATE` — from step 3
- Check the plan (team settings → Billing): sub-daily cron jobs (ours run every 15
  minutes) require **Pro**. Upgrade if it's on Hobby.
- Deployments → latest → ⋯ → **Redeploy** so the functions pick up the new variables.
- Verify: `https://www.premierdentalacademyoflongview.com/api/cron-send-scheduled` with
  header `Authorization: Bearer <CRON_SECRET>` returns `{"ok":true,...}` — and returns
  `{"error":"unauthorized"}` without the header.

### 5. The 30 email bodies — off this Mac, into the repo
- The finished broadcast emails live in this folder (Cowork outputs from July 9):
  `~/Library/Application Support/Claude/local-agent-mode-sessions/c7ef4bd2-10ef-4dd0-b25a-7fd9b7acc55f/10149406-870d-4693-b557-fcf992a0b878/local_3cbd7716-d41b-4b1a-9830-8298083dce45/outputs/emails/`
  (day01.html … day30.html — if the exact path moved, search the Mac for `day01.html`).
- Get them into the GitHub repo `RealRyanNichols/PremierDentalAcademyofLongview` as a
  top-level `emails/` folder: either commit them via the GitHub web UI (Add file →
  Upload files → target an `emails/` folder on a branch + open a PR), or if this session
  has the GitHub connector, push them directly to a branch named
  `cowork/email-bodies`.
- While you're in that outputs folder, also grab `site/career-vault-sales-page.html` and
  `emails/campaign-meta.json` if present and include them in the same PR (reference
  material — the live sales page is already built).

### 6. Kajabi lesson export — the verbatim mirror (owner feedback July 11)
Ryan & Amanda compared the site lessons against Kajabi and want the site to MIRROR the
original Kajabi lessons (same info, same order), then improve on them. Two ways to get
the originals out — do (a) if the option exists, else (b):
- **(a) API scopes (10 min):** Kajabi → Settings → API / third-party integrations → open
  the existing API credential (the one whose client id starts `oMDx6...`) and enable
  read access to **Courses/Products/Posts** if scope checkboxes exist. Then tell the
  next Claude Code session "Kajabi API course scope is on" — its exporter pulls every
  lesson body + the true lesson ORDER automatically. (The current credential returns
  403 on /v1/courses; contacts work.)
- **(b) Browser export:** for BOTH courses (in-person `2149312762`, online `2149362906`),
  open each lesson in the Kajabi editor, copy the lesson body HTML (and any downloads'
  file URLs), and paste into a doc per week — or use a local Cowork agent to script it.
  Also capture each course's exact lesson ORDER (screenshot of each week's outline is
  enough) and download the attached files (Resume Pack etc.) for re-hosting.

### 7. Report back
Post a summary: Kajabi paid? CSV saved where? Resend verified (domain status)? Which
Vercel env vars are set? Cron verify result? PR link for the emails folder. Flag anything
you couldn't finish and why.

## After this is done
Run the next Claude Code session with `docs/claude-code-next-session-prompt.md` — it
imports the emails + contacts, exports the remaining Kajabi lesson content, and finishes
Mux signed playback.
