# Cowork Request — July 9, 2026 (Finish-the-Build: keys + content migration)

Paste this whole file into Claude Cowork (browser + logged-in accounts). Claude Code
has done everything that can be done from the repo + Supabase MCP; the tasks below need
a **browser and logged-in accounts** (Kajabi, Mux, Resend, Square) that only you have.

> **Security rule (do not break):** never paste tokens/secrets into chat. Store them
> straight into Supabase `public.app_secrets` via the SQL editor:
> `insert into app_secrets (key,value) values ('KEY','value') on conflict (key) do update set value = excluded.value;`

---

## What Claude Code already did (July 9 — so you have ground truth)

- **Verified the whole build** against project `lmbsuwslsycukynzpzik`: 2 courses / 19 modules /
  **110 lesson shells (0 have video, 0 have written content)**; 13 products; `email_campaigns` /
  `email_sequences` / `email_sequence_steps` exist but are **empty**; 31 edge functions live
  (every integration function is present).
- **Fixed + deployed `email-worker` (v3)**: it filtered `subscribers.status='active'` but every
  real subscriber is `'subscribed'` → it would have sent to **0 recipients**. Now sends to
  `status IN ('subscribed','active')`. Also added native replacement of the Kajabi
  `{{ unsubscribe_link }}` body token (per-recipient), so repo/Kajabi emails render a working
  unsubscribe link.
- **Added the `email-worker-tick` cron** (every 5 min). The send pipeline is now complete but
  **HARD-GATED**: nothing sends while `app_secrets.EMAIL_SENDER_ENABLED='off'` (it is off). Every
  tick currently returns "kill switches off — nothing sent".
- **Generated `db/seeds/email_campaigns_from_repo.sql`** — the repo's 30 ready-made emails
  (28-day series + 2 broadcasts) as `status='draft'` rows. See Task B to load them.
- Fixed a stray dead "$200 down" share link in `day-04`.

**Confirmed secrets already present** (names only): `CRON_SECRET`, `RESEND_API_KEY`, all
`SQUARE_*`, all `KAJABI_*`, `QUO_API_KEY`, `EMAIL_FROM/REPLY_TO`, `SITE_URL`, `EMAIL_SENDER_ENABLED`,
`SEQUENCES_ENABLED`. **Missing:** `MUX_TOKEN_ID`, `MUX_TOKEN_SECRET` (Task A1).

Function base URL: `https://lmbsuwslsycukynzpzik.supabase.co/functions/v1/<name>`

---

## A. Stage-1 keys + webhooks (dashboards)

**A1. Mux (the only missing secret).** Mux dashboard → Settings → API Access Tokens → new token
with **Mux Video (read + write)**. Store `MUX_TOKEN_ID` + `MUX_TOKEN_SECRET` in `app_secrets`.
Add a Mux webhook → `…/functions/v1/mux-webhook` (auto-fills `mux_playback_id` + `duration_seconds`
when an asset is ready).

**A2. Resend.** Verify domain `premierdentalacademyoflongview.com` (add the SPF/DKIM/DMARC DNS
records Resend shows). Confirm the stored `RESEND_API_KEY` is current — if you rotated it, update
that one `app_secrets` row (and regenerate any key that was exposed in chat). Add a Resend webhook
→ `…/functions/v1/resend-webhook`.

**A3. Square.** Confirm `SQUARE_ACCESS_TOKEN` is a **production** token (not sandbox). Set the
Square webhook → `…/functions/v1/square-webhook`; confirm the signature key matches
`SQUARE_WEBHOOK_SIGNATURE_KEY`.

## B. Load the email drafts (30-second SQL paste — no Kajabi needed)

Supabase → SQL Editor → paste the contents of **`db/seeds/email_campaigns_from_repo.sql`** → Run.
Loads the 30 repo emails into `email_campaigns` as `status='draft'` (idempotent; cannot send).
Confirm: `select count(*) from email_campaigns;` → **30**.

## C. Kajabi content extraction (needs Kajabi admin — Claude Code CANNOT do this)

**C1. Emails — SUPPLEMENT the 30 already seeded.** For each Kajabi broadcast **not already covered**
by the seed, insert into `email_campaigns (internal_title, subject, preview_text, html,
audience='all', status='draft')`. For each Automation → one `email_sequences (key, name,
trigger_event, active=false)` + a `email_sequence_steps (step_number, delay_hours from the wait
blocks, subject, html)` per step. **Dedupe by subject** against the seeded set.
Token rules: **keep** `{{ unsubscribe_link }}` and `{{first_name}}` (the worker handles both);
rewrite any other Kajabi merge fields; fix `kajabi.com` links to `SITE_URL`.

**C2. Lesson TEXT.** Walk each Kajabi course module → lesson in order; match to the existing 110
`course_lessons` shells **by title**; fill `content_html` (post body), `overview`, and `quiz_json`
(set `lesson_type='quiz'` for quizzes). Preserve order via `sort`/`lesson_number`. **Report any
lesson with no shell match.**

**C3. Contacts + tags.** Sync Kajabi contacts/tags → `subscribers` (run `kajabi-sync` /
`kajabi-push-contacts`). New rows default `status='subscribed'` (the worker now sends to that).

## D. Video → Mux (needs the owner decision)

Ask Amanda: **Option A** — upload the ORIGINAL lesson video files (best quality), or **Option B** —
pull each video from Kajabi's media library and push to Mux (slower, lower quality). Then, per video
lesson: create a Mux asset via `mux-upload`; set `course_lessons.video_status='processing'`;
`mux-webhook` auto-fills the playback id + duration. Never hardcode Mux keys — the function reads
`MUX_TOKEN_*` from `app_secrets` (stored in A1).

## E. Products / offers reconcile (light)

Map each Kajabi Offer → `products.kajabi_offer_ids`; confirm `price_cents` + `entitlement_flag`.
New sellable items = new `products` rows (checkout already works via `buy-product` → Square).

---

## Rules (keep it this way)

- **Idempotent** — upsert, never duplicate; re-running must not create second copies.
- **Do NOT flip** `EMAIL_SENDER_ENABLED` / `SEQUENCES_ENABLED`. Email stays OFF until Amanda reviews
  the drafts and Claude Code runs a single test send.
- **Never paste secrets into chat** — store straight into `app_secrets`.
- **Content rules:** real-only (no fabricated stats/testimonials/grad counts/salary figures);
  **no evening/night class copy — daytime only**; July-1 pricing ($3,000 paid-in-full / $3,500 plan,
  $500 down; online $397); **no held $1,497 night-class offer**.

## When you're done — hand a result-prompt BACK to Claude Code

Post (in Cowork chat AND as `docs/COWORK-RESULTS-2026-07-09.md`, committed to the branch):

```
COWORK COMPLETE — 2026-07-09
| # | Task | Status | Notes |
|---|------|--------|-------|
| A1 | Mux keys + webhook | ✅/⚠️/❌ | MUX_TOKEN_* stored: y/n |
| A2 | Resend domain + webhook | … | domain verified: y/n |
| A3 | Square prod + webhook | … | production token: y/n |
| B  | Seed loaded | … | email_campaigns count: __ |
| C1 | Kajabi emails/sequences | … | campaigns added __ · sequences __ |
| C2 | Lesson text | … | lessons filled __/110 · unmatched: __ |
| C3 | Contacts/tags synced | … | subscribers: __ |
| D  | Video → Mux | … | source A/B · videos processing __ |
| E  | Products reconciled | … | |
Blocked on: [anything]
```

Then paste this handoff line for the next Claude Code session:

> **"Cowork finished the July 9 finish-the-build tasks — read `docs/COWORK-RESULTS-2026-07-09.md`.
> Status: Mux keys stored [y/n], Resend domain verified [y/n], Square prod [y/n], seed loaded
> [count], Kajabi emails added [n], sequences [n], lessons filled [n/110], video source [A/B],
> videos processing [n]. Next: run a test broadcast to hello@premierdentalacademyoflongview.com via
> the email-worker test mode, verify a migrated lesson plays for a test student, reconcile any
> unmatched lessons, then prep the go-live checklist for Amanda before flipping EMAIL_SENDER_ENABLED."**
