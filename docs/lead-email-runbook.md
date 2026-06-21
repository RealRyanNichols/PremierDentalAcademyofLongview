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

## Maintenance
- **Change copy:** edit `templates/email/*.html` AND the inline strings in `index.ts`, then
  redeploy (`supabase functions deploy lead-notify` or the Supabase MCP `deploy_edge_function`).
- **Disable:** `drop trigger trg_notify_new_lead on public.leads;`
- **Debug:** edge-function logs (`get_logs` / dashboard) or `select status_code, content from
  net._http_response order by created desc limit 5;` (never select the secret-bearing request URL).
- **An employer-specific autoresponder** could be added later (currently employers get the admin
  alert only).
