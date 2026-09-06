# db/pending — written, reviewed, NOT APPLIED

SQL staged here has **not** been run against the live Supabase project. Each file
says what it changes, who it affects, and how to roll it back. Run one only after
Amanda approves that exact action, then move the file to `db/migrations/` with a
note that it was applied (date + by whom).

Files (Sep 6, 2026):

| File | What it does | Gate |
|---|---|---|
| `2026-09-06_move_selena_to_sep29.sql` | Moves one real student's enrollment from Sept 14 to Sept 29 and closes her open "assign a cohort" task. | Amanda approval (real student record). |

Applied and moved to `db/migrations/`: `20260906_october_cohorts.sql` (Sep 6, 2026).
