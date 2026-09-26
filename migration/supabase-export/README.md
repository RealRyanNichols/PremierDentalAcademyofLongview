# Supabase export: all 45 live server functions (Sep 26, 2026)

Premier Dental Academy of Longview and The LeadFlow Pro are moving off Supabase and Vercel to a
DigitalOcean droplet (Amanda, Sep 26, 2026). Supabase ran 45 server functions ("edge functions").
**35 of them existed nowhere else**: not in GitHub, not on anyone's computer. This folder holds the
code that was actually running for all 45, captured before Supabase is switched off, so the port
starts from what really runs and nothing is lost.

- `functions/<name>/index.ts`: the deployed code, exactly as it ran, except the redactions below.
- `MANIFEST.json`: for every file, the live version number, the sha256 of the live code, the
  sha256 of the committed copy, and which lines were redacted (11 lines in 8 files; see below).
- `INVENTORY.md`: what each function does, who calls it, what it needs, and whether it is
  still needed. This is the porting checklist.

## How the copies were checked

- Everything was read-only against Supabase project `lmbsuwslsycukynzpzik`. Nothing there was
  changed.
- **35 Supabase-only functions**: each one was copied twice, independently. The two copies were
  compared byte for byte, and all 35 were identical. Each copy's version matched the live version
  on Sep 26, 2026.
- **10 functions already in the repo**: `buy-exam-pro`, `buy-product`, `enroll-paperwork`,
  `enroll-welcome`, `kajabi-webhook`, `lead-notify`, `meta-lead-webhook`,
  `quo-inbound-webhook`, `run-automations`, `weekly-digest`.
  - Their code comes from copies whose sha256 equals the recorded live fingerprint. Each one
    was confirmed by at least two independent copies.
  - Their live versions had not changed on Sep 26.

## Use these copies, not `supabase/functions/` on main

Several copies under `supabase/functions/` on `main` are not what was running:

- `buy-product` (the checkout engine for every product) differs from the live code in both
  directions.
- `quo-inbound-webhook`, `lead-notify`, `enroll-welcome`, `kajabi-webhook` and
  `meta-lead-webhook` on `main` also differ from live.

Port from this folder. PR #163 adds two small improvements on top of the live
`quo-inbound-webhook` and `lead-notify`. Carry them over on the droplet if still wanted:

- `quo-inbound-webhook`: a completed call or an outbound text moves a lead out of "new".
- `lead-notify`: campaign, landing page and first visit in the alert email, plus a Text button.

## Redacted: 8 lines in 7 functions

Hardcoded shared secrets, guard keys and a test-account password were replaced with
`REDACTED-see-migration/supabase-export/README`:

| Function | Line | What it was |
|---|---|---|
| `cal-webhook` | 6 | shared webhook secret |
| `fb-schedule` | 20 | guard key |
| `meta-conversions` | 22 | guard key |
| `meta-discover` | 10 | guard key |
| `seed-test-student` | 8, 19 | shared secret; test-account password |
| `quo-inbound-webhook` | 79 | Quo webhook shared secret |
| `kajabi-webhook` | 36 | legacy shared secret |

On the droplet, **generate new values** and read them from environment variables. Do not reuse
the old ones:

- The Quo and Kajabi secrets are also in the copies under `supabase/functions/` on `main`
  today (checked Sep 26, 2026), so they are already in GitHub.
- Two live database scheduled jobs carry secrets written into their commands: `sms-worker-5min`
  and `meta-conversions-hourly`.

Treat all of these as exposed and rotate them during the move.

### Also removed: private people named in code comments (3 lines)

The live code carried two students' names with payment dates (`square-webhook` lines 9 and 136)
and a lead's full name (`quo-inbound-webhook` line 38) in explanatory comments. The names were
replaced ("two students", "a student's case", "one lead"); the rest of each sentence is kept.
When porting, do not copy names of students or leads into code or comments. This repository is
public.

Otherwise the only people named are the owner, in business email copy and signatures, and a
staff first name used for a test account. The only contact details are the business's own
address and phone, a `test@` address on the business domain, and an example number.

## Still to export before Supabase is switched off (owner steps; never into GitHub)

This folder is code only. These live on Supabase too and need their own move:

1. **The database**: every table's structure and data, including student, lead and payment
   records and the login accounts. The usual tool is `pg_dump` with the connection string from
   the Supabase dashboard. The dump holds personal data and password hashes: keep it encrypted,
   move it over an encrypted connection, and never commit it.
2. **Stored secrets**: the 37 keys in the `app_secrets` table and each function's environment
   variables. They go into the droplet's secret store, never into GitHub. Rotate the ones listed
   above.
3. **Scheduled jobs (pg_cron)**, 10 of them, rebuilt on the droplet:
   - `pda_kajabi_hourly`
   - `rollup-page-visits`
   - `weekly-owner-digest`
   - `email-worker-tick`
   - `sms-worker-5min`
   - `meta-conversions-hourly`
   - `prune-webhook-rate-limits`
   - `exam-intent-enroll`
   - `pda-release-stale-leads`
   - `prune-quo-webhook-events`
4. **Stored files**, if any Supabase Storage buckets are in use.
5. **Outside services that call Supabase addresses**: re-point each one to the droplet once it is
   tested. This means the Square, Quo, Meta lead ads, Resend, Mux and Cal.com webhooks, plus any
   site pages that call `…supabase.co/functions/v1/…`. INVENTORY.md lists who calls what.
6. **The Vercel side**: the website itself and its `/api` functions (checkout `api/enroll.js`,
   lead intake `api/lead.js`, `/go` links, email jobs) and their Vercel environment variables.

Do not switch Supabase off until the droplet is tested and Square payments reach it.
