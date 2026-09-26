# Porting inventory: the 45 Supabase server functions

What each function does, who calls it, what it needs, and whether it still has to run on the
DigitalOcean droplet. Code for all 45 is in `functions/` (see README.md).

How this was built (Sep 26, 2026): reviewers read each function's deployed code in full,
searched this repository for pages and scripts that call it, and checked Supabase's function
logs for Sep 24–26, 2026 to see what is actually being called. "Still needed" is a judgment from
that evidence. Confirm with Amanda before dropping anything marked "Probably not" or "Unclear".

**Totals:** 14 yes, 3 probably, 1 unclear, 6 probably not, 21 no.

## Must-fix items when porting (apply to every function you move)

- **Replace every shared secret** named in README.md with a new value from the droplet's environment. Never hardcode one again.
- **Drop the Kajabi steps.** Kajabi was retired Aug 16, 2026, but several live functions still call `api.kajabi.com` (see "Outside services" below).
- **Replace function-to-function calls** to `…/functions/v1/<name>` with direct calls on the droplet.
- **Replace Supabase-only pieces** (the `supabase-js` service client, `auth.admin`, Supabase Storage, JWT checks by Supabase) with the droplet's equivalents. Each function lists its own below.
- **Compare webhook signatures in constant time**, not with `!==`.
- **`tuition-reserve` falls back to retired prices** ($1,997 in person, $200 down, $397 online) when a caller leaves out the amount. It has no caller today. If it is ever revived, it must take prices from `assets/site-facts.js` or require the amount.
- **No names of students or leads in code or comments.** This repository is public.

## Summary

| Function | Live version | Still needed? | Who calls it |
|---|---|---|---|
| `buy-exam-pro` | v5 | Yes | Browser: exam-pro.html (~line 331) when the buyer has a session. |
| `buy-product` | v6 | Yes | Browser pages: enroll.html:970 (online program, $997), career-vault.html:187, study-pack.html:533, exam-prep-course.html:227, career-plan.h… |
| `email-worker` | v6 | Yes | pg_cron job email-worker-tick (via pg_net), every 5 minutes, POST to functions/v1/email-worker with ?secret=CRON_SECRET in the URL. |
| `enroll-paperwork` | v2 | Yes | Browser: paperwork.html:192 (public, noindex page students fill in on their phones on day one). |
| `enroll-welcome` | v4 | Yes | Other functions, over HTTP with body.secret: enroll-paperwork after day-one paperwork, and square-webhook after a paid enrollment. |
| `import-students` | v4 | Yes | Browser admin page admin/students.html:286 (the 'Add student' form, via sb.functions.invoke). |
| `lead-notify` | v5 | Yes | Mainly the DB trigger trg_notify_new_lead (public.notify_new_lead(), security definer) through pg_net on every leads insert, with ?secret=L… |
| `meta-leadgen` | v6 | Yes | The Meta Lead Ads webhook (Page 'leadgen' subscription on Meta app 1373520258018547). |
| `quo-inbound-webhook` | v13 | Yes | Quo/OpenPhone webhook subscriptions: two of them (API v3 and v4) send the same events, both with ?secret= in the URL. |
| `quo-send-sms` | v2 | Yes | Admin pages, through sb.functions.invoke('quo-send-sms'): admin/leads.html:1207 and :1337, admin/students.html:243, admin/progress.html:493… |
| `send-welcome-email` | v2 | Yes | Browser admin page admin/students.html line 341, in the 'Add student' modal: sb.functions.invoke('send-welcome-email', {email, first_name})… |
| `sms-worker` | v5 | Yes | pg_cron job sms-worker-5min, which POSTs every 5 minutes via pg_net with the cron secret in the query string (?secret=). |
| `square-webhook` | v6 | Yes | Square webhook subscription (payment.* and invoice.* events) that POSTs to the Supabase function URL. |
| `weekly-digest` | v2 | Yes | pg_cron job 'weekly-owner-digest' ('0 12 * * 1' UTC, labeled 7am CT) through pg_net net.http_post with ?key=DIGEST_TOKEN (db/migrations/202… |
| `meta-conversions` | v4 | Probably | pg_cron job meta-conversions-hourly (pg_net POST to functions/v1/meta-conversions?key=...). |
| `resend-webhook` | v4 | Probably | Meant for a Resend webhook pointed at /functions/v1/resend-webhook. |
| `run-automations` | v2 | Probably | DB trigger trg_automate_new_lead (public.automate_new_lead(), security definer) through pg_net on each leads insert that has an email, with… |
| `fb-schedule` | v7 | Unclear | Manual or assistant-driven admin calls (bulk social scheduling). |
| `cal-webhook` | v2 | Probably not | Cal.com webhook (configured in the Cal.com dashboard with the secret in the URL query). |
| `export-reader` | v2 | Probably not | SQL through pg_net during the July 2026 course-content build (a one-off pipeline importing the Kajabi export). |
| `meta-discover` | v2 | Probably not | One-off/manual GET with ?key= (diagnostic run around Jul 2026). |
| `resend-domain-tracking` | v2 | Probably not | Manual/one-off (admin with the shared secret; the comment says pg_net could call it with a header). |
| `translate-course` | v1 | Probably not | Manual only: a GET (status check) or POST (translate the next N lessons) with ?key=. |
| `translate-message` | v1 | Probably not | Nothing found. |
| `create-amanda-account` | v3 | No | Nothing. |
| `create-students-batch` | v3 | No | Nothing (a one-off that was already run). |
| `kajabi-my-courses` | v3 | No | Formerly the student dashboard/portal 'My courses' cards. |
| `kajabi-pull` | v2 | No | One-off/manual POST with ?secret= (built 2026-08-08 for the Kajabi exit). |
| `kajabi-push-contacts` | v2 | No | One-off/manual POST with JSON {secret, limit}. |
| `kajabi-roster-temp` | v4 | No | Nothing. |
| `kajabi-sync` | v2 | No | Designed for an admin page (CORS, admin JWT) or a service-role cron. |
| `kajabi-webhook` | v6 | No | Kajabi webhook automation, endpoint lmbsuwslsycukynzpzik.functions.supabase.co/kajabi-webhook?secret=... |
| `lesson-bulk-update` | v3 | No | Nothing. |
| `meta-lead-webhook` | v3 | No | Nothing live. |
| `migrate-students-temp` | v3 | No | Nothing. |
| `mux-upload` | v2 | No | Nothing today. |
| `mux-webhook` | v3 | No | Mux webhook, if one is configured (URL form /functions/v1/mux-webhook?secret=...). |
| `run-seed-emails` | v3 | No | Nothing. |
| `seed-test-student` | v3 | No | Manual/dev only (a caller needs a valid Supabase JWT plus the hardcoded x-pda-secret header). |
| `send-welcome-batch` | v4 | No | Nothing now. |
| `site` | v7 | No | Nothing found. |
| `site-uploader` | v3 | No | Nothing now. |
| `social-proof` | v2 | No | Nothing now. |
| `test-html` | v3 | No | Nothing. |
| `tuition-reserve` | v4 | No | No caller in the current repo or its git history; the old calculator page that used it is gone. |

## Functions to port (yes, probably, unclear)

### `buy-exam-pro`: yes

- **What it does:** $29 Exam Pro checkout for a signed-in student. It charges Square, sets profiles.exam_pro=true, and records the purchase. A pending purchase row written before the charge prevents double charges, and an admin task is opened if the grant fails after payment.
- **Who calls it:** Browser: exam-pro.html (~line 331) when the buyer has a session. Guests on the same page go to buy-product with product_key 'exam_pro' instead. No cron or trigger. Source read from all45/live10/deployed-b (identical copies); it is not in export-a or deployed-a.
- **Why / port notes:** /exam-pro is a live buy page and this handles its signed-in path. On the droplet it could be folded into buy-product, which already sells exam_pro to guests, as long as the pending-marker and never-error-after-charge guarantees are kept.
- **How callers are checked:** verify_jwt=true at the Supabase gateway, then the code calls auth.getUser() with the caller's bearer token. Access is granted only to that user id, never to a client-supplied id.
- **Stored keys it reads (`app_secrets`):** `SQUARE_ACCESS_TOKEN`
- **Environment variables:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`
- **Tables:** `profiles`, `purchases`, `admin_tasks`, `communications`, `app_secrets`
- **Database functions (RPC):** none
- **Storage buckets:** none
- **Outside services:** Square Payments API (connect.squareup.com/v2/payments, Square-Version 2025-04-16, location 2P2ZE3FJNEYTV)
- **Supabase-specific parts to replace:** Gateway JWT verification (verify_jwt=true); auth.getUser() on an anon-key client carrying the user's Supabase session token (exam-pro.html gets it from sb.auth.getSession()). The droplet needs its own session/JWT verification.; supabase-js service-role client; Square token is read from the public.app_secrets table

### `buy-product`: yes

- **What it does:** Guest checkout for every row in public.products. It charges Square, finds or creates the buyer's account, sets the entitlement flag (online_program also grants exam_pro, study_pack and exam_prep), optionally grants Kajabi offers and signs a 7-day download link, records the purchase, and emails a magic-link access email through Resend.
- **Who calls it:** Browser pages: enroll.html:970 (online program, $997), career-vault.html:187, study-pack.html:533, exam-prep-course.html:227, career-plan.html:996, exam-pro.html:331 (guest path). No cron or trigger. Source read from deployed-a (live v6, identical to all45).
- **Why / port notes:** It is the only checkout for the online program and every digital product. Before porting: (1) reconcile the drift between live v6 and the repo copy. The repo adds buyer automations/tags, an enrolled check and a /learn course link that live v6 lacks (deployed-record.json marks it 'diverged'). (2) Drop the Kajabi offer-grant code and the 'Your course is in Kajabi' delivery branch (Kajabi retired Aug 16). (3) Replace listUsers, which only scans the first 1000 users. Also check: live verify_jwt is true, but this is guest checkout and the pages send only the sb_publishable key, which is not a JWT, mostly as an apikey header with no Authorization header. It is worth confirming the Supabase gateway accepts these calls; a probe from here was blocked by the proxy. On the droplet this must be a public endpoint with its own abuse and rate controls.
- **How callers are checked:** Gateway verify_jwt=true in the live deploy, but the code does no caller-identity check. It is a guest checkout protected only by the Square card token and a deterministic idempotency key (product + email + nonce). CORS *.
- **Stored keys it reads (`app_secrets`):** `SQUARE_ACCESS_TOKEN`, `RESEND_API_KEY`, `KAJABI_CLIENT_ID`, `KAJABI_CLIENT_SECRET`, `KAJABI_SITE_ID`
- **Environment variables:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- **Tables:** `products`, `app_secrets`, `profiles`, `purchases`, `communications`, `auth.users (via admin API)`
- **Database functions (RPC):** none
- **Storage buckets:** `products (private; bucket and path come from products.storage_path)`
- **Outside services:** Square Payments API (connect.squareup.com/v2/payments, location 2P2ZE3FJNEYTV); Kajabi API (api.kajabi.com/v1 oauth/token, contacts, contacts/{id}/relationships/offers) - retired; Resend emails API
- **Supabase-specific parts to replace:** auth.admin.listUsers (first page of 1000 only), auth.admin.createUser, auth.admin.generateLink (magic link redirecting to /dashboard); storage.from(bucket).createSignedUrl for a 7-day download from the private 'products' bucket, with the path from products.storage_path; supabase-js service-role client plus jsr edge-runtime types; Secrets are read from the public.app_secrets table; Gateway verify_jwt=true

### `email-worker`: yes

- **What it does:** The native email engine that replaced Kajabi. Each tick it sends due scheduled broadcast campaigns to subscribers through Resend (100 per batch call, with List-Unsubscribe headers) and advances drip sequences (sequence_subscriptions/sequence_emails), logging every send to email_sends. It also has a single-address test/preview mode for one campaign or one drip step.
- **Who calls it:** pg_cron job email-worker-tick (via pg_net), every 5 minutes, POST to functions/v1/email-worker with ?secret=CRON_SECRET in the URL. Edge logs show 285 calls in the last 24h, all HTTP 200. The test-send mode can also be called with an admin JWT, but no repo page does this (admin/emails.html only reads and writes the tables directly). lead-notify only shares its EMAIL_FROM/EMAIL_REPLY_TO app_secrets records.
- **Why / port notes:** It is live and heavily used: 38k email_sends rows, 1,070 sequence_subscriptions, and resend-webhook receiving about 770 events a day. The run-automations drips depend on it, so it must be ported with its cron schedule. It overlaps with the Vercel api/cron-send-scheduled.js and api/cron-process-sequences.js, which are dormant. Pick one engine on the droplet and keep the EMAIL_SENDER_ENABLED / SEQUENCES_ENABLED kill switches. Known weaknesses to fix while porting: a campaign is set to 'sending' before sending and stays stuck if the run crashes; the drip loop makes one Resend call per subscriber (up to 200 per tick); and the older tables email_sequence_steps/email_sequence_enrollments are unused by this engine.
- **How callers are checked:** verify_jwt=false. The cron/bulk path requires CRON_SECRET, passed as ?secret= or the x-cron-secret header (read from env first, then app_secrets). The test-send paths accept either CRON_SECRET or a Supabase user JWT whose profiles.is_admin is true. CORS is '*'. The cron job passes the secret in the URL query string, so it appears in plain text in the platform's edge request logs. On the droplet, pass it in a header instead and rotate it.
- **Stored keys it reads (`app_secrets`):** `CRON_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_REPLY_TO`, `SITE_URL`, `EMAIL_SENDER_ENABLED`, `SEQUENCES_ENABLED`
- **Environment variables:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_REPLY_TO`, `SITE_URL`, `EMAIL_SENDER_ENABLED`, `SEQUENCES_ENABLED`
- **Tables:** `app_secrets`, `profiles`, `subscribers`, `email_campaigns`, `email_sends`, `email_sequences`, `sequence_emails`, `sequence_subscriptions`
- **Database functions (RPC):** none
- **Storage buckets:** none
- **Outside services:** Resend (POST https://api.resend.com/emails/batch)
- **Supabase-specific parts to replace:** supabase-js service-role client (esm.sh @supabase/supabase-js@2); sb.auth.getUser(jwt) plus profiles.is_admin for the admin test path (Supabase Auth JWT); app_secrets table used as the secrets store and kill-switch store (env-first fallback); PostgREST embedded join email_sequences!inner and array .contains() on subscribers.tags; Triggered by pg_cron plus pg_net calling the *.supabase.co/functions/v1 URL; needs a droplet cron or systemd timer instead; Deno.serve runtime

### `enroll-paperwork`: yes

- **What it does:** Day-one electronic enrollment. It validates the /paperwork form, finds or creates the student's account, marks the profile as an in_person student with cohort and enrolled_at, stores the signed form in enrollment_forms, calls enroll-welcome, logs a note, and tells the page whether to send the student to /enroll checkout.
- **Who calls it:** Browser: paperwork.html:192 (public, noindex page students fill in on their phones on day one). No cron or trigger. Source read from all45/live10/deployed-b (identical copies); it is not in export-a or deployed-a.
- **Why / port notes:** Electronic day-one enrollment is a standing automation priority in CLAUDE.md. Harden it when porting. It is public, and for any email, including an existing account's, it overwrites name, phone and cohort and sets program='in_person'. Other code (for example buy-exam-pro) treats that as enrolled, so an unauthenticated POST can grant student access without payment. Consider a class-day code or staff confirmation. enrollment_forms holds DOB, address and emergency contact, so it must stay admin-only on the droplet.
- **How callers are checked:** None. verify_jwt=false, CORS *. Protected only by field validation and a 'website' honeypot field. No rate limit.
- **Stored keys it reads (`app_secrets`):** `ENROLL_WELCOME_SECRET`
- **Environment variables:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- **Tables:** `profiles`, `enrollment_forms`, `communications`, `app_secrets`, `auth.users (via admin API)`
- **Database functions (RPC):** none
- **Storage buckets:** none
- **Outside services:** enroll-welcome edge function (internal HTTP call)
- **Supabase-specific parts to replace:** auth.admin.listUsers (first 1000 only) and auth.admin.createUser; Function-to-function call to SUPABASE_URL + '/functions/v1/enroll-welcome'; supabase-js service-role client plus jsr edge-runtime types; Secret is read from the public.app_secrets table; Relies on RLS to keep enrollment_forms admin-only

### `enroll-welcome`: yes

- **What it does:** Sends the branded welcome email (magic sign-in link, start date, and the supply-list PDF for in-person students) plus a new-enrollment notice to hello@. Sends once per email, tracked in welcome_log, unless force=true.
- **Who calls it:** Other functions, over HTTP with body.secret: enroll-paperwork after day-one paperwork, and square-webhook after a paid enrollment. docs/enroll-welcome-runbook.md also shows a manual curl. No cron or trigger. Source read from deployed-a (live v4).
- **Why / port notes:** Every new enrollment's welcome and notice to the office goes through it. The email must be fixed before porting: it still sends students to the retired Kajabi library ('Your Course in Kajabi') instead of /learn, uses the apex SITE_URL instead of www, and hot-links the supply list from a Supabase Storage public URL. It also signs as 'Founder + Lead Instructor', a title Amanda should confirm given the no-overstating-instruction rule.
- **How callers are checked:** verify_jwt=false. body.secret must equal app_secrets.ENROLL_WELCOME_SECRET, a plain !== compare that is not constant-time. The same secret also gates square-webhook's call, kajabi-push-contacts and meta-leadgen, so split and rotate it on the droplet.
- **Stored keys it reads (`app_secrets`):** `ENROLL_WELCOME_SECRET`, `RESEND_API_KEY`
- **Environment variables:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`
- **Tables:** `app_secrets`, `welcome_log`, `communications`, `auth.users (magic link via admin API)`
- **Database functions (RPC):** none
- **Storage buckets:** `pda-assets (public; supply-list PDF read by URL)`
- **Outside services:** Resend emails API (student email with the attachment fetched by URL, plus the admin notice); Supabase Storage public object URL for the supply-list PDF
- **Supabase-specific parts to replace:** auth.admin.generateLink (magic link redirecting to /dashboard); SUPPLY_URL is hardcoded to lmbsuwslsycukynzpzik.supabase.co/storage/v1/object/public/pda-assets/PDA-School-Supply-List.pdf, so the file must move; supabase-js service-role client plus jsr edge-runtime types; Secrets are read from the public.app_secrets table

### `import-students`: yes

- **What it does:** Admin-only creation or update of student accounts from rows (email, name, phone, city, state, program, cohort, tags). For a new email it creates an auth user with a random password and a profile. For an existing one it merges tags and grants portal access (portal_status, program, enrolled_at, cohort, career_vault).
- **Who calls it:** Browser admin page admin/students.html:286 (the 'Add student' form, via sb.functions.invoke). That page then inserts the enrollments row and calls send-welcome-email. No invocations in the last 24h, but it is the only way the admin UI creates a student.
- **Why / port notes:** It is the core admin flow for adding a student, and Amanda's automation-first rule depends on it. It must be rebuilt on whatever auth system the droplet uses. Clean up while porting: the Kajabi leftovers (source 'kajabi_import' metadata, kajabi_id and Kajabi CSV header aliases), and a bug: the 'already registered' fallback calls auth.admin.listUsers() without pagination, so it only sees the first page of users (default 50; there are about 83 profiles). An existing auth user past page one therefore gets an error instead of being linked.
- **How callers are checked:** verify_jwt=true. It requires Authorization: Bearer <user JWT>, validated with an anon-key client's auth.getUser(), and profiles.is_admin must be true. POST only.
- **Stored keys it reads (`app_secrets`):** none
- **Environment variables:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`
- **Tables:** `profiles`, `auth.users (via the Auth admin API)`
- **Database functions (RPC):** none
- **Storage buckets:** none
- **Outside services:** none
- **Supabase-specific parts to replace:** auth.admin.createUser (email_confirm, random password, user_metadata); auth.admin.listUsers fallback (unpaginated); Anon-key client auth.getUser for caller identity; verify_jwt gate; profiles.id is keyed to the auth.users id; Frontend uses sb.functions.invoke('import-students'), which must be rewritten to the droplet endpoint; supabase-js via esm.sh; Deno.serve

### `lead-notify`: yes

- **What it does:** On every new public.leads row, emails a new-lead alert to hello@ (Amanda) and sends prospects with an email (not employer leads) an autoresponder, both through Resend; skips any lead whose source contains 'quo'.
- **Who calls it:** Mainly the DB trigger trg_notify_new_lead (public.notify_new_lead(), security definer) through pg_net on every leads insert, with ?secret=LEAD_NOTIFY_SECRET in the URL (db/migrations/20260621_lead_notify_trigger.sql). Secondary caller: api/lead.js emailFallback (Vercel serverless), which only calls it when the leads insert failed, RESEND_API_KEY is not set and LEAD_NOTIFY_SECRET is. That call uses the x-lead-secret header. scripts/check-lead-api.mjs mocks this call. The staged retry job in db/pending/20260919_lead_notify_reliability.sql would also call it, but that SQL is on hold and not applied.
- **Why / port notes:** This is the primary 'new lead' alert for every lead path: web forms, meta-leadgen, paperwork and the direct anon-insert fallback, all of which insert into leads and rely on the trigger. It also sends the prospect autoresponder. Amanda depends on it. The port needs a DB-side hook on the droplet: pg_net on self-hosted Postgres, LISTEN/NOTIFY, or an outbox table polled by a worker. For web forms, the send can also move inside the droplet's api/lead.js, which already has resendSend. Port from the deployed v5 copy. The repo file supabase/functions/lead-notify/index.ts is a stale mirror that hardcodes a sender Resend rejects (403). Note: the function returns HTTP 200 even when a send fails or it throws. Any retry logic on the new platform must read the admin/autoresponder flags in the response body, not the status code.
- **How callers are checked:** verify_jwt=false (live metadata 2026-09-24, v5). Shared secret LEAD_NOTIFY_SECRET, read from public.app_secrets at request time. The caller sends it as ?secret= (DB trigger) or as the x-lead-secret header (api/lead.js). The comparison is constant-time. Returns 401 if the secret is missing or wrong.
- **Stored keys it reads (`app_secrets`):** `RESEND_API_KEY`, `LEAD_NOTIFY_SECRET`, `EMAIL_FROM`, `EMAIL_REPLY_TO`
- **Environment variables:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`
- **Tables:** `app_secrets`
- **Database functions (RPC):** none
- **Storage buckets:** none
- **Outside services:** Resend (POST https://api.resend.com/emails)
- **Supabase-specific parts to replace:** supabase-js service-role client (npm:@supabase/supabase-js@2) reads config from public.app_secrets; SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are injected by the Supabase platform; Deno.serve, the jsr:@supabase/functions-js edge-runtime import and npm: specifiers (Deno-only); Caller is pg_net net.http_post inside a Postgres trigger, with the functions URL hardcoded to lmbsuwslsycukynzpzik.supabase.co/functions/v1/lead-notify; api/lead.js builds the URL as SUPABASE_URL + /functions/v1/lead-notify (function-to-function style URL); Only the Supabase request logs can show whether the trigger's HTTP call succeeded

### `meta-leadgen`: yes

- **What it does:** Live intake for Facebook/Instagram Instant-Form lead ads. It verifies the Meta webhook, then for each new leadgen_id re-fetches the lead from the Graph API with the Page token and inserts it into public.leads (source facebook_lead_ad, utm.meta_leadgen_id). It also accepts a secret-gated JSON path for Zapier/manual use, and it still submits each lead to a Kajabi 'FB Lead Ad' form.
- **Who calls it:** The Meta Lead Ads webhook (Page 'leadgen' subscription on Meta app 1373520258018547). Its GET handles the hub.verify handshake. Confirmed live: 3 POST 200s on Sep 21, 2026 in the function edge logs. Path B takes JSON POSTs from Zapier or by hand. No page in the repo calls it. Note: docs/COWORK-REQUEST-2026-07-07.md names meta-lead-webhook as the callback, but that function has verify_jwt=true, which Meta cannot pass, so meta-leadgen is the one actually receiving deliveries.
- **Why / port notes:** This is the live path for paid-ad leads; per its notes it carried 51 leads in 30 days, and leads came in on Sep 21. The port must: (1) drop kajabiFormSubmit, since Kajabi is retired and the native run-automations fb-lead-ad drip replaces it; (2) reproduce the side effects of inserting into leads, meaning trg_notify_new_lead -> lead-notify and trg_automate_new_lead -> run-automations; (3) get the Meta webhook callback URL changed to the droplet, which needs Meta App Dashboard access under Amanda's account and so her action; (4) keep the four security gates and preferably set META_APP_SECRET. It is pinned to Graph v19.0; check that version is still supported.
- **How callers are checked:** verify_jwt=false, since Meta cannot send a JWT. GET: hub.verify_token must equal app_secrets.META_VERIFY_TOKEN. Webhook POST: an X-Hub-Signature-256 HMAC-SHA256 over the raw body, compared in constant time, is enforced only when META_APP_SECRET exists; otherwise the POST runs unsigned. Unsigned POSTs must still pass an entry[].id == FB_PAGE_ID match, per-IP (20/h) and global (60/h) rate limits via the hit_rate_limit RPC, and a re-fetch of every field from Graph. The function also writes a daily admin_alerts warning while unsigned. JSON path B: body.secret must equal ENROLL_WELCOME_SECRET (plain compare).
- **Stored keys it reads (`app_secrets`):** `META_VERIFY_TOKEN`, `FB_PAGE_TOKEN`, `ENROLL_WELCOME_SECRET`, `META_APP_SECRET`, `FB_PAGE_ID`
- **Environment variables:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- **Tables:** `app_secrets`, `leads`, `admin_alerts`
- **Database functions (RPC):** `hit_rate_limit`
- **Storage buckets:** none
- **Outside services:** Meta Graph API v19.0 GET /{leadgen_id} (lead field_data); Meta Webhooks (inbound leadgen deliveries + hub.challenge verify); Kajabi hosted form scrape + POST (premierdentalacademyoflongview.mykajabi.com/forms/2149482473/form_submissions), retired
- **Supabase-specific parts to replace:** supabase-js service-role client (npm: import); jsr edge-runtime type import; RPC hit_rate_limit (Postgres function; its table is pruned by the prune-webhook-rate-limits pg_cron job); PostgREST JSONB containment filter .contains('utm', {meta_leadgen_id}); insert into leads fires DB triggers trg_notify_new_lead (pg_net -> lead-notify) and trg_automate_new_lead (pg_net -> run-automations), which are function-to-function URLs; Meta webhook callback URL points at the supabase.co functions/v1/meta-leadgen URL; client IP read from x-forwarded-for / cf-connecting-ip as set by the Supabase gateway (the droplet reverse proxy must set these); credentials in public.app_secrets; Deno.serve

### `quo-inbound-webhook`: yes

- **What it does:** Quo (OpenPhone) webhook. Logs every call event (completed/transcript/summary, merged into one row per call_id) and every inbound or outbound SMS on the PDA line (903) 913-6444 into communications. Also upserts leads by phone, seeds grade/timeline/path from the Sona summary, and opens admin tasks. After-hours SMS auto-reply exists but only runs when the app_secrets.QUO_AUTOREPLY_ENABLED kill switch is on (standing setting: off).
- **Who calls it:** Quo/OpenPhone webhook subscriptions: two of them (API v3 and v4) send the same events, both with ?secret= in the URL. Events are deduplicated on the event id in quo_webhook_events. The pg_cron job prune-quo-webhook-events cleans that table. sms-worker (cron sms-worker-5min) depends on the inbound SMS rows this function writes for its stop-on-reply gate. No site page calls it.
- **Why / port notes:** This is the only path that records Quo calls and texts in the database: communications, quo_call/quo_sms leads and admin tasks. The SMS drip's stop-on-reply check reads these rows, and the admin leads inbox shows them. Porting it requires: re-pointing BOTH Quo subscriptions to the droplet (and probably deleting the duplicate v3 or v4 one); porting the SQL function upsert_call_event, the unique indexes on communications metadata->>'call_id' and metadata->>'msg_id' (the code depends on 23505 conflicts), and the quo_webhook_events table with its prune job; moving the hardcoded secret to an env var and rotating it. Port from the deployed copy, which is v13 per the live metadata. The repo copy supabase/functions/quo-inbound-webhook/index.ts is a stale mirror that lacks the v11-v13 fixes, but it has two lead-stage 'stamps' that live does not have.
- **How callers are checked:** verify_jwt=false (live metadata, v13). Static shared secret in the ?secret= query string, hardcoded in the source and compared with plain equality. Returns 403 when it does not match. There is no HMAC/signature check of the Quo payload. Line filtering is by phoneNumberId PNhV3szhHa or by PDA's number among the parties.
- **Stored keys it reads (`app_secrets`):** `QUO_AUTOREPLY_ENABLED`, `QUO_API_KEY`
- **Environment variables:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- **Tables:** `quo_webhook_events`, `communications`, `leads`, `admin_tasks`, `app_secrets`
- **Database functions (RPC):** `upsert_call_event`
- **Storage buckets:** none
- **Outside services:** Quo/OpenPhone API POST https://api.openphone.com/v1/messages (after-hours auto-reply only, gated off); Inbound: Quo/OpenPhone webhooks (call.completed, call.transcript.completed, call.summary.completed, message.* events)
- **Supabase-specific parts to replace:** supabase-js service-role client, with PostgREST-specific query syntax: .filter('metadata->>call_id','eq',...), .ilike('phone','%digits%'), .rpc('upsert_call_event'), maybeSingle/single; Relies on PostgREST error objects (error.code '23505') for duplicate detection; SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are injected by the Supabase platform; Deno.serve, the jsr edge-runtime import and npm: specifiers; The Quo subscription URLs registered in the Quo workspace point at the lmbsuwslsycukynzpzik.supabase.co functions URL; The structured console.log/console.error shape logs go to Supabase function logs

### `quo-send-sms`: yes

- **What it does:** Admin-only outbound SMS through OpenPhone (Quo). It sends {to, body} from the business Quo number and logs the message to communications (channel sms, outbound, source admin-reply, optional related_lead_id/related_student_id, sent_by metadata).
- **Who calls it:** Admin pages, through sb.functions.invoke('quo-send-sms'): admin/leads.html:1207 and :1337, admin/students.html:243, admin/progress.html:493, admin/cohorts.html:660, admin/instructors.html:273.
- **Why / port notes:** This is how staff text leads, students, cohorts and instructors from the admin pages, so it must be ported and all 6 call sites repointed. It sends real texts, so testing on the droplet needs Amanda's approval for any real send. It falls back to the first number on the Quo account and caches that id. On a Quo account shared with The LeadFlow Pro that could pick the wrong line, so pin QUO_PHONE_NUMBER_ID explicitly.
- **How callers are checked:** verify_jwt=true at the gateway (confirmed live). The handler also calls auth.getUser() with the caller's Authorization header, then requires profiles.is_admin=true (403 otherwise).
- **Stored keys it reads (`app_secrets`):** `QUO_API_KEY`, `QUO_PHONE_NUMBER_ID`
- **Environment variables:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- **Tables:** `profiles`, `app_secrets`, `communications`
- **Database functions (RPC):** none
- **Storage buckets:** none
- **Outside services:** OpenPhone/Quo API: GET https://api.openphone.com/v1/phone-numbers; OpenPhone/Quo API: POST https://api.openphone.com/v1/messages
- **Supabase-specific parts to replace:** Gateway verify_jwt=true plus supabase-js auth.getUser for JWT validation (needs a droplet auth replacement); supabase-js service-role client (npm: specifier); Quo API key and phone id read from the app_secrets table, and the function writes the phone id back there (upsert); Browser calls use sb.functions.invoke (Supabase client SDK), which must be changed to plain fetch to a droplet URL on 6 admin pages; Deno.serve and the jsr edge-runtime types

### `send-welcome-email`: yes

- **What it does:** Admin-only endpoint. It generates a Supabase magic sign-in link for a new student and sends a branded welcome email through Resend, then logs the send to communications.
- **Who calls it:** Browser admin page admin/students.html line 341, in the 'Add student' modal: sb.functions.invoke('send-welcome-email', {email, first_name}) for any non-preview program. No cron or trigger calls it. No invocations appeared in the Sep 24-26 logs, so it runs only when an admin adds a student.
- **Why / port notes:** The live admin add-student flow calls it, so the droplet needs an equivalent, but the email must be rewritten before it is ported. As written it: (1) has a whole block pointing students to the retired Kajabi library (premierdentalacademyoflongview.mykajabi.com/library) and tells them to 'Open Kajabi and start Module 1' (Kajabi was retired Aug 16, 2026; use /learn); (2) signs as 'Founder + Lead Instructor', which conflicts with the documented instructor gap and owner claim rules; (3) links to /dashboard.html and /login.html instead of clean URLs; (4) stores the magic sign-in link in communications.metadata and returns it in the JSON response, which persists a live login credential in an admin-readable table and should be dropped. Consider folding it into enroll-welcome so there is one welcome path.
- **How callers are checked:** verify_jwt=true at the gateway, plus an in-code check. It resolves the caller from the Authorization bearer JWT with auth.getUser() on an anon client, then requires profiles.is_admin=true via the service-role client. The app_metadata admin claim is not honored. Returns 401 without a user and 403 for non-admins. CORS is open (*).
- **Stored keys it reads (`app_secrets`):** none
- **Environment variables:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`, `RESEND_API_KEY`
- **Tables:** `profiles`, `communications`
- **Database functions (RPC):** none
- **Storage buckets:** none
- **Outside services:** Resend API POST https://api.resend.com/emails
- **Supabase-specific parts to replace:** Supabase Auth: auth.getUser() on the caller JWT (anon client + Authorization header); Supabase Auth admin API: auth.admin.generateLink({type:'magiclink'}); the droplet needs its own passwordless-login mechanism; supabase-js service-role client (npm:@supabase/supabase-js@2); verify_jwt gateway enforcement; The caller uses supabase-js sb.functions.invoke(), so admin/students.html must be changed to call a droplet URL; jsr:@supabase/functions-js edge-runtime types; Deno.env / Deno.serve

### `sms-worker`: yes

- **What it does:** SMS drip engine. It sends the next due step of each active sms_subscriptions row through the Quo/OpenPhone API. Guardrails: a kill switch, a 9am-8pm Central send window, a fail-closed do-not-market check (students, staff, suppressions), stop on reply, opt-out or manual text, and failure/402-credit handling. A dryRun mode is included.
- **Who calls it:** pg_cron job sms-worker-5min, which POSTs every 5 minutes via pg_net with the cron secret in the query string (?secret=). The logs confirm 288 POST 200s per 24h on Sep 24-25 and Sep 25-26. It also accepts an x-cron-secret header.
- **Why / port notes:** It is the only SMS drip sender and it fires every 5 minutes today. It needs a droplet cron job and a worker. Whether it actually sends depends on the SMS_SENDER_ENABLED flag in app_secrets, which was not read here. The cron secret is written into the pg_cron command, so it is exposed and should be rotated. Port its v5 safety gates unchanged.
- **How callers are checked:** Shared secret. The ?secret= query param or x-cron-secret header must equal CRON_SECRET (read from env first, else app_secrets). verify_jwt=false.
- **Stored keys it reads (`app_secrets`):** `CRON_SECRET`, `SMS_SENDER_ENABLED`, `QUO_API_KEY`, `QUO_PHONE_NUMBER_ID`
- **Environment variables:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, `SMS_SENDER_ENABLED`, `QUO_API_KEY`, `QUO_PHONE_NUMBER_ID`
- **Tables:** `app_secrets`, `v_do_not_market`, `sms_subscriptions`, `sms_sequences`, `sms_steps`, `leads`, `communications`
- **Database functions (RPC):** none
- **Storage buckets:** none
- **Outside services:** Quo/OpenPhone GET https://api.openphone.com/v1/phone-numbers (only when QUO_PHONE_NUMBER_ID is unset; the result is cached back into app_secrets); Quo/OpenPhone POST https://api.openphone.com/v1/messages
- **Supabase-specific parts to replace:** supabase-js service-role client (https://esm.sh/@supabase/supabase-js@2); app_secrets table used as the secret store (env first, DB fallback) and written back via upsert for QUO_PHONE_NUMBER_ID; PostgREST embedded inner join select 'sms_sequences!inner(active,key)' plus ilike/gte/lte filters; v_do_not_market view (built on students/staff/marketing_suppressions) must exist in the new DB; Scheduled by pg_cron + pg_net calling the supabase.co function URL; rebuild as a droplet cron; Deno.env / Deno.serve

### `square-webhook`: yes

- **What it does:** Square payment/invoice webhook (v6). On a COMPLETED payment or PAID invoice it: verifies the HMAC signature; resolves the buyer email, name and cohort (from the Square customer note 'Cohort: <name>') and the online/in-person path; sends a deduped welcome through the enroll-welcome function; grants Kajabi offers; and auto-enrolls the student on the portal (profiles, enrollments, purchases, leads to enrolled). If there is no email or profile it raises admin_tasks, and it always logs to communications.
- **Who calls it:** Square webhook subscription (payment.* and invoice.* events) that POSTs to the Supabase function URL. The logs confirm 7 POSTs on Sep 24-25 and 4 on Sep 25-26, all 200. The URL it signs against is stored in app_secrets SQUARE_WEBHOOK_URL. api/enroll.js writes the Square customer note and buyer email that this function reads.
- **Why / port notes:** This is the critical payment-to-enrollment path. Every Square charge (checkout, invoices, installments) activates the student here, so it must be live on the droplet before Supabase is switched off. On port: (1) drop the Kajabi grant step (Kajabi retired Aug 16, 2026; it still calls api.kajabi.com if the KAJABI_* keys remain in app_secrets); (2) re-point the Square webhook subscription to the droplet URL and update the signed notification URL, since the HMAC covers URL + body, and issue a new signature key; (3) replace the function-to-function call to /functions/v1/enroll-welcome; (4) the planned 'laborday2026 = reserved' v7 behavior is not in the live code; (5) use a constant-time signature compare.
- **How callers are checked:** Square webhook signature. x-square-hmacsha256-signature must equal base64 HMAC-SHA256(SQUARE_WEBHOOK_SIGNATURE_KEY, SQUARE_WEBHOOK_URL + raw body), with both values read from app_secrets. The compare is plain !==. verify_jwt=false. Non-POST requests get 'ok'. It returns 200 'webhook not configured' if the key or URL is missing. It authenticates to enroll-welcome with ENROLL_WELCOME_SECRET in the JSON body.
- **Stored keys it reads (`app_secrets`):** `SQUARE_WEBHOOK_SIGNATURE_KEY`, `SQUARE_WEBHOOK_URL`, `ENROLL_WELCOME_SECRET`, `SQUARE_ACCESS_TOKEN`, `KAJABI_CLIENT_ID`, `KAJABI_CLIENT_SECRET`, `KAJABI_SITE_ID`
- **Environment variables:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- **Tables:** `app_secrets`, `welcome_log`, `cohorts`, `leads`, `profiles`, `enrollments`, `purchases`, `admin_tasks`, `communications`
- **Database functions (RPC):** none
- **Storage buckets:** none
- **Outside services:** Square GET https://connect.squareup.com/v2/customers/{id}; Square GET https://connect.squareup.com/v2/orders/{id}; Kajabi POST https://api.kajabi.com/v1/oauth/token (retired); Kajabi GET/POST https://api.kajabi.com/v1/contacts (retired); Kajabi POST https://api.kajabi.com/v1/contacts/{id}/relationships/offers (retired); Internal: POST SUPABASE_URL/functions/v1/enroll-welcome (sends the welcome email)
- **Supabase-specific parts to replace:** supabase-js service-role client (npm:@supabase/supabase-js@2); app_secrets table used as the secret/config store; Function-to-function URL: SUPABASE_URL + '/functions/v1/enroll-welcome'; The signed notification URL (SQUARE_WEBHOOK_URL) is the supabase.co function URL; it changes with the endpoint; jsr:@supabase/functions-js edge-runtime types; Deno.serve / Deno.env; crypto.subtle HMAC (portable)

### `weekly-digest`: yes

- **What it does:** Monday owner email to hello@ with the last 7 days: pageviews, top pages, top tool clicks, leads by source, completed purchases and revenue, unanswered student questions, and seats left in the next 3 upcoming cohorts. Sent through Resend.
- **Who calls it:** pg_cron job 'weekly-owner-digest' ('0 12 * * 1' UTC, labeled 7am CT) through pg_net net.http_post with ?key=DIGEST_TOKEN (db/migrations/20260707_weekly_digest_schedule.sql). No page calls it.
- **Why / port notes:** Automated weekly reporting to Amanda, which fits the automation-first standing priority. The data comes from daily_stats, which the rollup-page-visits cron produces, so that rollup has to be ported too, or the digest can query page visits directly. Note: 12:00 UTC is 7am only during daylight time. In winter it arrives at 6am CT. A droplet cron with TZ=America/Chicago would fix that.
- **How callers are checked:** verify_jwt=false (live metadata, v2). Token DIGEST_TOKEN from app_secrets, compared with plain equality against the ?key= query param. Any HTTP method is accepted. Returns 401 when it does not match, and 500 if RESEND_API_KEY is missing. The token appears in the URL, so it ends up in cron/pg_net request logs.
- **Stored keys it reads (`app_secrets`):** `DIGEST_TOKEN`, `RESEND_API_KEY`
- **Environment variables:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- **Tables:** `app_secrets`, `leads`, `purchases`, `daily_stats`, `student_questions`, `cohorts`
- **Database functions (RPC):** none
- **Storage buckets:** none
- **Outside services:** Resend (POST https://api.resend.com/emails)
- **Supabase-specific parts to replace:** supabase-js service-role client (npm:@supabase/supabase-js@2); SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are injected by the Supabase platform; Deno.serve, the jsr edge-runtime import and npm: specifiers; Scheduled with pg_cron + pg_net, with the URL hardcoded to lmbsuwslsycukynzpzik.supabase.co/functions/v1/weekly-digest

### `meta-conversions`: probably

- **What it does:** Meta Conversions API CRM lead-stage sync (v4). For Facebook lead-ad leads (utm.meta_leadgen_id), it reports each new pipeline stage change (Converted $3000 / Qualified / Disqualified) to the Meta dataset once, with hashed email and phone, so Meta optimizes ad delivery. Dedupe is keyed on meta_lead_stage_sent.
- **Who calls it:** pg_cron job meta-conversions-hourly (pg_net POST to functions/v1/meta-conversions?key=...). Confirmed live: 24 POST 200s in the last 24h of function edge logs. Also runs manually with ?dry=1 for a preview. No page in the repo calls it.
- **Why / port notes:** It is the feedback loop for the paid Facebook lead ads, which are still bringing in leads (meta-leadgen deliveries on Sep 21). It is live hourly. It is a silent no-op returning configured:false if META_DATASET_ID/META_CAPI_TOKEN are unset; confirm those are set before porting. Rebuild it as a droplet cron job. Porting notes: the leads query uses .limit(1000) with no ORDER BY, so newer leads can be missed once the table passes 1000 rows. Replace the hardcoded guard with an env secret.
- **How callers are checked:** verify_jwt=true at the gateway, so the cron call must carry a project JWT. In code, a ?key= query param must equal a HARDCODED guard constant. The key sits in the URL and therefore also in platform request logs. The CAPI token is sent as an access_token query param to Meta.
- **Stored keys it reads (`app_secrets`):** `META_DATASET_ID`, `META_CAPI_TOKEN`, `META_TEST_EVENT_CODE`
- **Environment variables:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- **Tables:** `app_secrets`, `leads`, `meta_lead_stage_sent`
- **Database functions (RPC):** none
- **Storage buckets:** none
- **Outside services:** Meta Graph API v21.0 POST /{dataset_id}/events (Conversions API, CRM lead events)
- **Supabase-specific parts to replace:** supabase-js service-role client (npm: import); jsr:@supabase/functions-js edge-runtime type import; verify_jwt gateway (the cron sends a Supabase JWT); pg_cron + pg_net job meta-conversions-hourly calling the functions/v1 URL (must become a droplet cron/systemd timer); credentials in public.app_secrets; Deno.serve

### `resend-webhook`: probably

- **What it does:** Resend email-event receiver. It verifies the Svix signature, logs delivered/opened/clicked/bounced/complained/deferred events to email_events, and on a bounce or complaint marks the subscriber bounced/complained and cancels their active drip subscriptions.
- **Who calls it:** Meant for a Resend webhook pointed at /functions/v1/resend-webhook. A read-only check of the Resend account holding updates.premierdentalacademyoflongview.com on Sep 26, 2026 found 0 webhooks configured, so nothing calls it today. No page, cron job or trigger calls it, and no repo page reads email_events.
- **Why / port notes:** Auto-suppressing bounces and complaints protects sender reputation while email-worker keeps sending drips and broadcasts, so it is worth porting and then registering a Resend webhook to the droplet URL (with a new signing secret). But it is not in the live path today (no Resend webhook exists), so nothing breaks if it lands after cutover. The email_sequence_enrollments update targets a table the code itself calls dead; drop it when porting.
- **How callers are checked:** verify_jwt=false. Svix HMAC-SHA256 signature check over id.timestamp.body using the whsec_ secret (env or app_secrets), with 5-minute timestamp tolerance and constant-time compare. Fails closed (500) when no secret is set and returns 401 on a bad signature.
- **Stored keys it reads (`app_secrets`):** `RESEND_WEBHOOK_SECRET`
- **Environment variables:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_WEBHOOK_SECRET`
- **Tables:** `app_secrets`, `email_events`, `subscribers`, `sequence_subscriptions`, `email_sequence_enrollments`
- **Database functions (RPC):** none
- **Storage buckets:** none
- **Outside services:** Resend (inbound webhook caller only, Svix-signed)
- **Supabase-specific parts to replace:** supabase-js service-role client (esm.sh import); app_secrets table fallback for the signing secret; Supabase function URL (/functions/v1/resend-webhook) would be registered in Resend; Deno.serve / Deno.env (crypto.subtle carries over to Node webcrypto unchanged)

### `run-automations`: probably

- **What it does:** Runs the public.automations rule engine for an event: ensures a subscribers row, applies add_tag (with tag_added cascades), subscribe_sequence and unsubscribe_sequence actions, and bumps each rule's run count. When called by the leads trigger it maps leads.source to a form_submitted value (facebook_lead_ad -> fb-lead-ad, homepage -> get-class-info).
- **Who calls it:** DB trigger trg_automate_new_lead (public.automate_new_lead(), security definer) through pg_net on each leads insert that has an email, with ?secret=AUTOMATIONS_SECRET (db/migrations/20260710_leads_automation_trigger.sql). It also has a direct server-to-server mode ({trigger_type, trigger_value, email}), but nothing in the repo calls that mode. The drip sequences it enrolls leads into are sent by email-worker (pg_cron email-worker-tick, every 5 min).
- **Why / port notes:** This is the only thing that enrolls new leads that have an email into the lead drip sequences (FB lead ad drip, get-class-info follow-up). The email-worker cron that sends those drips is live. Keep it if Amanda still wants these drips. I did not verify whether the automations rows are active, because running SQL was out of scope. The same rules engine exists in api/_automations.mjs, so on the droplet this can be an in-process call after the lead insert plus a DB hook for non-web lead paths, instead of a separate HTTP endpoint. It is only useful if email-worker and the sequence tables are ported too.
- **How callers are checked:** verify_jwt=false (live metadata, v2). POST only. Shared secret AUTOMATIONS_SECRET (generated in-database with gen_random_bytes) read from app_secrets and compared with plain equality against ?secret=. Returns 401 when it does not match. Anyone holding the secret can use the direct mode to tag or enroll any email address.
- **Stored keys it reads (`app_secrets`):** `AUTOMATIONS_SECRET`
- **Environment variables:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- **Tables:** `app_secrets`, `subscribers`, `automations`, `email_sequences`, `sequence_subscriptions`, `sequence_emails`
- **Database functions (RPC):** none
- **Storage buckets:** none
- **Outside services:** none
- **Supabase-specific parts to replace:** supabase-js service-role client (npm:@supabase/supabase-js@2); SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are injected by the Supabase platform; Deno.serve, the jsr edge-runtime import and npm: specifiers; Caller is pg_net net.http_post inside a Postgres trigger, with the URL hardcoded to lmbsuwslsycukynzpzik.supabase.co/functions/v1/run-automations

### `fb-schedule`: unclear

- **What it does:** Admin tool for the school's Facebook Page. mode=list returns the scheduled post times; mode=post bulk-schedules photo posts (url + caption + publish time) via the Graph API; mode=settoken stores a Page token in app_secrets.FB_POST_TOKEN.
- **Who calls it:** Manual or assistant-driven admin calls (bulk social scheduling). No repo page or script calls it, no cron job, and zero invocations in the last 24h.
- **Why / port notes:** It is not wired into the site or any schedule. It looks like a tool an assistant used for batches of Facebook posts. Port it only if Amanda wants droplet-side Facebook post scheduling. If it is ported, keep the tokens in droplet env, not a DB table, drop the hardcoded guard, and rotate both the guard and the Facebook tokens, as the code's own comment advises.
- **How callers are checked:** verify_jwt=true at the platform. The body 'guard' must equal a hardcoded literal (a speed bump, not a real secret), and the caller's Supabase JWT must resolve via auth.getUser to a user with profiles.is_admin=true. Settoken re-checks admin.
- **Stored keys it reads (`app_secrets`):** `FB_POST_TOKEN`, `FB_PAGE_TOKEN`
- **Environment variables:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- **Tables:** `app_secrets`, `profiles`
- **Database functions (RPC):** none
- **Storage buckets:** none
- **Outside services:** Facebook Graph API v19.0 (/me/accounts, /{page}?fields=access_token, /{page}/scheduled_posts, POST /{page}/photos)
- **Supabase-specific parts to replace:** verify_jwt platform gate plus sb.auth.getUser(jwt) and profiles.is_admin; app_secrets used as the token store, read and written (upsert FB_POST_TOKEN); supabase-js service-role client (npm:@supabase/supabase-js@2); Deno.serve plus jsr edge-runtime types

## Probably not needed or not needed

Keep the code in `functions/` for reference; do not port these unless Amanda asks.

| Function | Verdict | Why |
|---|---|---|
| `cal-webhook` | Probably not | public.tours holds 1 row, and no admin or public page in the repo reads tours. |
| `export-reader` | Probably not | The Kajabi export import was a one-time build step, and Kajabi was retired on Aug 16, 2026. |
| `meta-discover` | Probably not | It was a setup-time discovery tool whose findings (dataset id, lead forms) are already wired into meta-conversions and meta-leadgen. |
| `resend-domain-tracking` | Probably not | This is a one-time settings toggle, not a running service: one change in the Resend dashboard or a single API call does the same thing. |
| `translate-course` | Probably not | Amanda's Sep 7, 2026 rule is that all course content is English and a Spanish course is a separate future build. |
| `translate-message` | Probably not | It has never been wired into the leads inbox or the Quo/Resend send paths, so nothing depends on it. |
| `create-amanda-account` | No | It already does nothing except return 410. |
| `create-students-batch` | No | The one-time student creation is finished and the function was neutralized. |
| `kajabi-my-courses` | No | Kajabi was retired on Aug 16, 2026 and /learn replaced the Kajabi library. |
| `kajabi-pull` | No | Amanda retired Kajabi on Aug 16, 2026. |
| `kajabi-push-contacts` | No | Its only job is to copy lead and student emails and names INTO Kajabi, which was retired on Aug 16, 2026. |
| `kajabi-roster-temp` | No | The '-temp' one-time Kajabi migration tool is already neutralized to a 410 response, and its own header says to delete it. |
| `kajabi-sync` | No | Kajabi was retired on Aug 16, 2026. |
| `kajabi-webhook` | No | Kajabi was retired on Aug 16, 2026, so this should not be ported. |
| `lesson-bulk-update` | No | This was a one-off content import that finished on Jul 14, 2026 and was disabled; the code says 'safe to delete'. |
| `meta-lead-webhook` | No | Retired 2026-08-22. |
| `migrate-students-temp` | No | The live code (v3) is a 410 stub with no logic. |
| `mux-upload` | No | Superseded by api/admin-mux-upload.js plus api/admin-mux-asset.js. |
| `mux-webhook` | No | It only matches uploads created with passthrough=lesson_id, which only the unused mux-upload function set. |
| `run-seed-emails` | No | The live code (v3) is a 2-line 410 stub whose own note says the load finished 2026-07-09 and it is safe to delete. |
| `seed-test-student` | No | This is a seed-* dev tool that writes fabricated progress, exam and purchase records into production tables and resets a login to a hardcoded password. |
| `send-welcome-batch` | No | The body is already a 410 stub ('one-time welcome batch completed and retired'), so there is nothing to port. |
| `site` | No | The website is served as static files (Vercel today, the droplet's web server next). |
| `site-uploader` | No | It only feeds the unused 'site' bucket/host shim, and the droplet will deploy the site from GitHub. |
| `social-proof` | No | It is superseded by the social_proof_feed RPC plus assets/pda-social-proof.js (aggregate counts only) and has no traffic. |
| `test-html` | No | Test scaffolding, already replaced with a 410 stub on 2026-08-22 ('safe to delete outright'). |
| `tuition-reserve` | No | Its built-in defaults ($1,997 in-person total, $200 down, $397 online) contradict assets/site-facts.js ($3,000 paid in full, or $3,500 on a plan with $500 down; online $997), and docs/labor-day-2026-offer.md already say… |
