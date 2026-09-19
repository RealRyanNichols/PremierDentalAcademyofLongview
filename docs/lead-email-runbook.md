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
  with a `lead_notify_status` view for admin. Apply only with Amanda's approval.
- Test: `npm run check:lead-api` (handler with Supabase/Resend mocked) and `npm run test:e2e`
  (real browser, happy + failure paths for the main forms at phone width).

## Maintenance
- **Change copy:** edit `templates/email/*.html` AND the inline strings in `index.ts`, then
  redeploy (`supabase functions deploy lead-notify` or the Supabase MCP `deploy_edge_function`).
- **Disable:** `drop trigger trg_notify_new_lead on public.leads;`
- **Debug:** edge-function logs (`get_logs` / dashboard) or `select status_code, content from
  net._http_response order by created desc limit 5;` (never select the secret-bearing request URL).
- **An employer-specific autoresponder** could be added later (currently employers get the admin
  alert only).
