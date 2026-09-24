# Lead email runbook — new-lead notification + applicant autoresponder

**Status: ✅ DEPLOYED & LIVE (2026-06-21).** Every new row in `public.leads` now fires an
**alert email to Amanda**, and genuine prospects also get an **autoresponder**. Verified
end-to-end (a smoke-test lead returned `{"ok":true,"admin":true}` from the function via
pg_net, status 200, then was deleted).

## Pieces (all in the repo)
- `supabase/functions/lead-notify/index.ts` — the deployed edge function (Resend). Renders
  inline copies of the two emails; keep in sync with the template files below.
- `templates/email/lead-notification.html` — alert to Amanda (canonical copy).
- `templates/email/applicant-autoresponder.html` — prospect autoresponder (canonical copy).
- `db/migrations/20260621_lead_notify_trigger.sql` — the `notify_new_lead()` function + the
  `trg_notify_new_lead` AFTER INSERT trigger on `public.leads`.

## How it works (live)
1. A form inserts into `public.leads` (unchanged — capture never depends on email).
2. The `trg_notify_new_lead` trigger calls `lead-notify` **asynchronously via pg_net**
   (`security definer`, exception-safe — a mail failure can never block or roll back a lead).
3. `lead-notify` is gated by `?secret=<LEAD_NOTIFY_SECRET>` (stored in `public.app_secrets`)
   and reads `RESEND_API_KEY` from `app_secrets`. `verify_jwt` is off (server-side trigger call).

## Routing rules (in the function)
- **Quo leads** (`source` contains `quo`) → skipped (the Quo webhook already notifies).
- **Admin alert → Amanda** for every other lead.
- **Applicant autoresponder** → only genuine prospects with an email. **Employer** leads
  (`source`/`interest_path` contains `employer`) are skipped, because the "thanks for applying"
  copy would be wrong for an office.

## What's deployed
- Edge function `lead-notify` (verify_jwt = false).
- `app_secrets.LEAD_NOTIFY_SECRET` (random, set once).
- DB trigger `trg_notify_new_lead` + function `public.notify_new_lead()`.
- `RESEND_API_KEY` already present in `app_secrets`; Resend domain already verified (Kajabi uses it).

## Speed-to-lead hardening (Sep 19, 2026)
- **Every lead form now submits through `assets/pda-lead.js`** → `POST /api/lead` (Vercel
  function, `api/lead.js`) → insert into `public.leads` → the trigger above emails Amanda as
  before. If the function is unreachable the browser falls back to the direct anon-key insert;
  if that fails too the visitor sees an honest error (call / text / email links, entries kept)
  and the lead is retried on their next page load (idempotent via `utm.submission_id`).
- **If the database insert fails inside `/api/lead`**, the function emails the lead to hello@
  directly — via Resend when `RESEND_API_KEY` is set in Vercel, or via the `lead-notify`
  function when `LEAD_NOTIFY_SECRET` is set in Vercel. Neither is set today (Amanda decides;
  env changes need her approval). Until one is, the browser-side fallback + retry is the net.
- **Attribution in the alert:** `lead-notify` (source updated, redeploy pending Amanda's OK)
  shows Campaign / Landing page / First visit rows from `leads.utm` + `leads.landing_page`,
  plus a Text button.
- **Retry the alert itself:** `db/pending/20260919_lead_notify_reliability.sql` (STAGED, not
  applied) logs each pg_net attempt and re-posts un-delivered alerts every 10 minutes (max 3),
  with a `lead_notify_status` view (SQL only). Apply only with Amanda's approval.

## Ship order (checked 2026-09-24)
Two independent pieces are waiting. Each is safe on its own, in either order, because live
`lead-notify` v5 already accepts the secret both ways (`?secret=` and the `x-lead-secret`
header) and the reconciled copy keeps both (`check:edge-behavior` pins it).
1. **Redeploy lead-notify** (adds the Campaign / Landing page / First visit rows and the Text
   button). Follow `docs/edge-functions.md`: re-check `list_edge_functions` first (it must
   still be v5), deploy the `--body` output, confirm v6, watch logs, set the record to
   `in_sync`. Rollback = redeploy the v5 source (the repo file minus its two additions).
2. **Apply the retry migration.** First run the no-email pre-flight in its header: a 200
   `{"skipped":"no contact info"}` means the header path works; a 401 means stop. Then apply,
   run the verify queries at the bottom of the file, and move it to `db/migrations/`.
   Rollback is in the file and restores today's trigger function verbatim.
Never ship a lead-notify version that drops the `?secret=` path while the old trigger is
live, or drops the header path once the retry migration is live: either stops every alert.
The sender always comes from `app_secrets` (`EMAIL_FROM` / `EMAIL_REPLY_TO`) — a hardcoded
`updates.*` sender drew a Resend 403 on Aug 3.
- Test: `npm run check:lead-api` (handler with Supabase/Resend mocked) and `npm run test:e2e`
  (real browser, happy + failure paths for the main forms at phone width).

## Maintenance
- **Change copy:** edit `templates/email/*.html` AND the inline strings in `index.ts`, then
  redeploy per `docs/edge-functions.md` (base the edit on the live source, update
  `supabase/functions/DEPLOYED.json`; a git push does not deploy a function).
- **Disable:** `drop trigger trg_notify_new_lead on public.leads;`
- **Debug:** edge-function logs (`get_logs` / dashboard) or `select status_code, content from
  net._http_response order by created desc limit 5;` (never select the secret-bearing request URL).
- **An employer-specific autoresponder** could be added later (currently employers get the admin
  alert only).
