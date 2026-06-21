# Lead email runbook — new-lead notification + applicant autoresponder

**Status: built, NOT deployed.** The forms (`/apply`, `/waitlist`, `/tour`) already save
leads to `public.leads`. This adds two emails per new lead: an **alert to Amanda** and an
**autoresponder to the applicant**. Turning it on is a Supabase admin step (the repo/agent
can't deploy without project access).

## Pieces
- `templates/email/lead-notification.html` — alert to Amanda (canonical copy).
- `templates/email/applicant-autoresponder.html` — autoresponder to the applicant (canonical copy).
- `supabase/functions/lead-notify/index.ts` — edge function that renders inline copies of both
  and sends them via **Resend**. Keep its inline HTML in sync with the template files above.

## How sending works
The forms insert directly into `public.leads` (unchanged — payments/lead capture never depend
on email). A **Supabase Database Webhook** fires the edge function on each new lead, so a
mail failure can never lose or block a lead.

## Deploy steps (one-time)
1. **Resend domain**: verify `premierdentalacademyoflongview.com` in Resend so
   `hello@premierdentalacademyoflongview.com` can send. (Already used by the Kajabi function.)
2. **Secret**: ensure `RESEND_API_KEY` is set for edge functions
   (`supabase secrets set RESEND_API_KEY=...`, or the project's existing secret).
3. **Deploy**: `supabase functions deploy lead-notify` (or the Supabase MCP `deploy_edge_function`).
4. **Webhook**: Supabase Dashboard → Database → Webhooks → *Create*:
   - Table `public.leads`, event **INSERT**.
   - Type **HTTP Request** → the `lead-notify` function URL.
   - Add header `Authorization: Bearer <service-role-or-anon as required>` per project config.
5. **Test**: submit `/apply` with your own email; confirm both emails arrive. Check function
   logs (`get_logs` / dashboard) if not.

## Notes
- The function returns 200 even on error so the webhook never retry-storms the pipeline; check
  logs for `[lead-notify]` if mail isn't arriving.
- To change copy, edit the template files **and** the inline strings in `index.ts`, then redeploy.
- Alternative to a webhook: a Postgres `AFTER INSERT` trigger using `pg_net`. The webhook is
  simpler and needs no SQL.
