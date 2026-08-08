# Office Hub — analytics (first-party only)

One server route ingests everything: `POST /api/hub/events` →
`hub_analytics_events` (service-role insert; the table has no client policies).
Event names live in ONE place: `assets/hub/hub-events.mjs` (allowlist enforced
server-side). No third-party scripts. No PII in props (server strips
PII-shaped keys), no quiz answers, no free-text notes.

- **Idempotency**: client sends `idempotency_key` per logical action
  (e.g. `signoff:{employee_skill_id}:{to_state}:{date}`); the unique index
  dedupes and a duplicate is a silent success.
- **Activation** = `first_skill_signed_off` (fired by the app the first time a
  workspace records any sign-off; key `first-signoff:{org_id}` makes it
  once-per-org by construction).
- **Retention** = `weekly_training_action`, derived server-side from the SQL
  view `hub_weekly_training_actions` (sign-offs ∪ quiz attempts ∪ check-ins ∪
  task completions per org per ISO week). A view, not a cron, per the MVP spec.
- **Attribution**: first-touch UTM params ride the generator query string and
  land in `hub_generator_leads.source`; `workspace_started` carries the same
  keys in props when present.
- **Meta CAPI future**: events are flat `{event_name, props, anon_id, at}` —
  compatible with a later Conversions API relay (TODO-META-LEAD-WEBHOOK.md).
  Not implemented here.

## Event list (MVP)
Public funnel: `hub_landing_viewed`, `generator_started`, `generator_completed`,
`generator_email_submitted`, `tutorial_viewed`, `tutorial_completed`,
`tutorial_feedback_submitted`, `hub_contact_clicked`.

Product: `workspace_started`, `invite_sent`, `invite_accepted`,
`template_applied`, `plan_created`, `task_completed`, `first_skill_signed_off`,
`skill_signed_off`, `needs_coaching_flagged`, `quiz_passed`, `checkin_created`,
`sop_created`, `report_generated`, `member_archived`, `support_grant_created`,
`upgrade_viewed`, `deletion_requested`.

## Open item (needs the D5 doc)
`deliverable-5-seo-growth-package.md` §15 defines the canonical event names
(public 15 + product 17), but the file is not in the repo. The list above
covers everything the Deliverable-7 prompt names explicitly, plus the obvious
funnel steps, under our own names. **Reconcile against D5 §15 before launch** —
renames are one-line changes in `hub-events.mjs` plus the call sites.
The extended tutorial-telemetry events (D4 §11) are later-phase by spec; MVP
ships only `tutorial_completed` + the confusing-step feedback write.
