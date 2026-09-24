# db/pending — written, reviewed, NOT APPLIED

SQL staged here has **not** been run against the live Supabase project. Each file
says what it changes, who it affects, its prerequisites, and how to roll it back. Run one
only after Amanda approves that exact action, then move the file to `db/migrations/`
with a note that it was applied (date + by whom) and flip its row in
`db/migrations/MANIFEST.json` from `staged` to `applied` (npm test checks the manifest).

| File | What it does | Gate | Prerequisite |
|---|---|---|---|
| `20260919_lead_notify_reliability.sql` | Logs every new-lead alert attempt, retries undelivered ones every 10 min (max 3), moves the lead-notify secret from the URL to a header | Amanda (DB change + scheduled job) | lead-notify must accept the `x-lead-secret` header — live v5 does (verified 2026-09-24); run the no-email pre-flight in the file header first |
| `20260917_online_price_397_promo.sql` | Online program checkout $997 → $397 | **Amanda only — pricing decision** | Ship in one change with `site-facts.js` `sale: true` and `api/enroll.js` `onlineCents = 39700` |
| `20260924_close_anon_campaign_metrics.sql` | Takes the two email-campaign metric views away from anonymous visitors | Amanda (permission change) | None; admin pages keep working (rollback in file) |

Applied and moved to `db/migrations/`: `20260906_october_cohorts.sql`, `20260906_move_selena_to_sep29.sql` (Sep 6, 2026).
