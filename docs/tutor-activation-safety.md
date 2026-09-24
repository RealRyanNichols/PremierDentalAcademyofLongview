# Tutor activation and lead credential failures

This patch is a preparation/acceptance gate, not authorization to turn on paid AI.

## Tutor stays disabled until an operator opts in

`PDA_TUTOR_ENABLED` must equal the literal string `true`. Absent, false, differently cased, or any other value returns HTTP 503 `tutor_disabled` with the existing instructor-contact fallback. Disabled requests do not read Auth, database, model secrets, or the model provider. Restoring `SUPABASE_SERVICE_ROLE_KEY` or adding a direct Anthropic key alone cannot activate the tutor.

Do not set this flag until the deployment owner has accepted the authorization checks and cost exposure. No new paid service is introduced. Existing `ANTHROPIC_API_KEY`, or its existing `app_secrets` fallback, remains the model credential source only after authorization and budget checks pass.

When enabled, `/api/tutor` requires:

1. POST with a question of at most 1,000 characters and a bounded lesson ID. Client-supplied lesson title/text is rejected.
2. A Supabase Bearer session verified through Auth. All lesson/access reads use the public key plus this caller's token, never the service role.
3. The exact lesson returned through existing `course_lessons` RLS, its course relation, and the caller-scoped `my_portal_access()` result and own profile.
4. For non-admins, active portal status, active lesson/course, and exactly one existing entitlement: `online_program` requires `enrolled`; `career_vault` requires the existing profile flag. Unknown future flags fail closed. Admin access still requires the verified server-side admin result and RLS-readable lesson.
5. Non-staff callers must also pass the existing zero-argument `pda_class_started()` RPC with their own token. It is internally scoped to `auth.uid()` and excludes online/canceled cohorts. No caller-supplied identity is passed to it.
6. A process-local budget before either AI-secret lookup or provider use: 6 requests/minute/user, 1 concurrent request/user, 20 concurrent requests/process, and at most 5,000 retained user budget records. Limit responses are 429 with `Retry-After`.

The limiter retains only user IDs, counters, and timestamps. It resets on process restart and is not shared across workers. **It is not a durable quota, monetary budget, or billing cap.** Access checks happen before this budget, so this is not a complete request/DoS limiter. Model output remains capped at 500 tokens. Auth/access/secret calls have 10-second timeouts; the model call has 20 seconds; credential-bearing tutor fetches reject redirects. Question/answer contents are not logged by these server handlers.

The suspension rule and denial of unknown future entitlement flags are deliberate safety tightening relative to the older browser course gate. They do not add paid tiers or change tuition. Browser tutoring sends only question + lesson ID with its session token, displays 400/401/403/429/unavailable errors, and records a tutor Q&A only after a successful answer. Old cached page code must be refreshed because client-provided lesson context is no longer accepted.

## Acceptance evidence and remaining boundaries

The migration operator checked live catalog metadata on 2026-09-24 without customer rows: `pda_class_started()` is zero-argument, boolean, authenticated-callable, caller-scoped; current course flags are `career_vault` and `online_program`; lesson/course active fields are NOT NULL. This is live audit evidence, not a schema migration included in this patch. Reverify if the backend changes.

Membership fields have broad SQL column grants, with a trigger that freezes non-admin updates to role/program/portal/paid flags. The inspected signup trigger creates a preview profile, no self-delete profile policy was found, and the operator reported no missing profiles. No current self-insert escalation path was demonstrated. The profile INSERT trigger's lack of equivalent paid/program-field resetting remains defensive hardening to assess before relying on a different signup/profile-creation path. The mutable profile `cohort` field is not used by this patch; the authoritative enrollment/class RPC is used instead.

Before opt-in, verify the current real-role behavior, existing RLS/function grants and membership write protections. Synthetic tests establish implementation behavior, not live entitlement ownership or provider acceptance. Do not run a payment, email, webhook, or billable AI request as an accidental migration smoke test.

## Lead semantics

The shared service-key validator rejects placeholders, public/user keys, malformed or expired legacy service-role JWTs, wrong hosted-project refs, and implausible secret-key shapes before privileged requests. Legacy validation checks structure/claims, **not the signature**; provider acceptance is still necessary. Supabase 401/403 on privileged REST becomes a generic service-configuration error, without exposing credentials/provider text.

`/api/lead` handles malformed/rejected privileged credentials as explicit 503 `service_configuration_error`, `ok:false`, `persisted:false`, before sending any fallback email. The existing browser then tries its direct public-policy insert. This intentionally prevents broken configuration from becoming a stream of email-only success. A direct API client must handle 503; this patch does not assert a lead was accepted in that case.

| Outcome | API result | Browser behavior |
| --- | --- | --- |
| Stored, or verified duplicate | 200 `ok:true`, `persisted:true`, `delivery:database` | Existing success, no additional insert |
| Ordinary database failure, fallback email succeeds | 200 `ok:true`, `persisted:false`, `delivery:email` | Existing accepted-by-email success; no retry/double notification; caller receives provenance |
| Malformed/rejected configured privileged key | 503 `ok:false`, `persisted:false` | Existing direct hosted-Supabase insertion attempt |
| Database and email fallback fail | Existing 502 `ok:false` | Existing direct insert, then local retry/error if that also fails |
| Service key absent | Existing public-key insert path | No new service credential required |

Shared form analytics keeps legacy `saved:true` as its existing receipt/notification-success signal for compatibility. It now emits explicit `databaseSaved` and `delivery`; **do not use legacy `saved` alone as proof of a CRM row**. An email-only result has `databaseSaved:false`. The existing customer-facing success text and fallback email subject are unchanged. Database and email failures are logged with fixed codes/numeric statuses only, not user-controlled source strings or provider messages.

The key families and API-key versus user-identity distinction are documented by [Supabase](https://supabase.com/docs/guides/getting-started/api-keys). A local format check is not a replacement for server-side authorization or provider authentication.
