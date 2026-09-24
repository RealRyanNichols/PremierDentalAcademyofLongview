# Edge functions — how the repo copy and the live copy stay the same

**A git push never deploys a Supabase edge function.** A green Vercel check proves the
*website* deployed and says nothing about functions. Only `deploy_edge_function` (Supabase
MCP) or `supabase functions deploy` changes what runs, and only `list_edge_functions` showing
the new version number proves it landed.

The record of what is live is `supabase/functions/DEPLOYED.json`. `npm test` holds the repo
to it (`scripts/check-edge-drift.mjs`) and runs the lead-path functions' real code against
fictional data (`scripts/check-edge-behavior.mjs`).

## Status meanings
| status | meaning | the file must… |
|---|---|---|
| `in_sync` | repo == live | have no DRIFT-STATUS block and no "DO NOT DEPLOY" text |
| `repo_ahead` | repo = live + the listed `additions`, waiting for an approved deploy | open with `// >>> DRIFT-STATUS: repo_ahead` |
| `live_ahead` | live has changes the repo lacks | open with the block; pull live down before editing |
| `diverged` | neither contains the other | open with the block; reconcile before anyone deploys |

The block is removed before hashing, so the warning never makes code look different from live.

## Before editing a function
1. `list_edge_functions` → compare with the record: save the JSON and run
   `node scripts/check-edge-drift.mjs --live <file>`. Any difference = someone deployed
   without updating the repo. Stop and pull.
2. `get_edge_function <slug>` → that source is your base, not the repo file, unless the record
   says `in_sync` and step 1 is clean.
3. Make the change, list it under `additions`, set `repo_ahead`, add the block, update
   `repo_sha256` (`node scripts/check-edge-drift.mjs --sha supabase/functions/<slug>/index.ts`).

## Deploying (owner-approved only)
1. `npm test` green, including `check:edge-behavior`.
2. Re-run step 1 above **right before deploying**. Live moved twice on 2026-09-22 (v12, v13)
   after the plan for v12 was written; deploying over an unseen version erases it.
3. Deploy the body without the block: `node scripts/check-edge-drift.mjs --body <slug>`.
   Keep the function's `verify_jwt` exactly as the record says.
4. `list_edge_functions` → the version went up by one. `get_edge_function` → the source equals
   the body you deployed (`--sha` on a saved copy matches `repo_sha256`).
5. Watch `query_logs` (function_edge_logs) for a few minutes: no 5xx, no boot errors.
6. Update the record: new `deployed_version`, `deployed_at`, `deployed_ezbr_sha256`,
   `deployed_sha256 = repo_sha256`, `status: in_sync`, drop `additions`; delete the block from
   the file. `npm test` refuses a half-done update.

## Rollback
Redeploy the previous version's source. Every `in_sync` record is the exact prior source in git
history; for a `repo_ahead` deploy, the prior live source is the file minus its `additions`
(the block says which) — or pull it from the dashboard's version history.

## Lead-path specifics
- `lead-notify`: the sender and reply-to come from `public.app_secrets` (`EMAIL_FROM`,
  `EMAIL_REPLY_TO`). Never hardcode a sender: the Resend account verifies the root domain, not
  `updates.*`, and a hardcoded `updates.*` sender silently stopped the alerts once (403).
  It accepts `?secret=` and the `x-lead-secret` header.
- `quo-inbound-webhook`: depends on `public.upsert_call_event`, `public.quo_webhook_events` and
  the unique indexes `communications_call_id_uniq` / `communications_msg_id_uniq`. Deploying an
  older copy that does not use them brings back duplicate rows and misfiled calls.
