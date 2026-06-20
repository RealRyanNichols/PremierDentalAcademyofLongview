# Student Portal · Kajabi Sync · Lead Pipeline — how it connects

This documents the June 2026 build: the authenticated **student portal**, the
**Kajabi → website** purchase sync, and **Amanda's lead pipeline** (calls + texts
+ web/Kajabi leads), plus the **text-logging-without-auto-reply** behavior.

Most of this was already live on Supabase project `lmbsuwslsycukynzpzik`; this
change set version-controls the two webhook functions, hardens them, and adds the
portal gate + lead grading. Nothing here stores secrets in the repo.

---

## 1. Student portal (Task 1)

- **Auth + member records:** Supabase `profiles` (one row per `auth.users`).
  Relevant columns: `program` (`preview | foundation | career_track | staff |
  admin`), `enrolled_at`, `cohort`, `kajabi_id`, `is_admin`, and **new**
  `portal_status` (`active | suspended | pending`).
- **"Enrolled member" = ** a real `program` (anything but `preview`) **or**
  staff/admin, **and** `portal_status = 'active'`.
- **The gate:** `assets/pda-portal-guard.js` exposes
  `PDAPortal.requireEnrolled()`. It reads the server-side RPC
  `public.my_portal_access()` (SECURITY DEFINER, scoped to `auth.uid()`), so the
  client can't spoof access. Not signed in → `/login`; signed in but not enrolled
  → `/enroll`.
- **The hub:** `portal.html` (served at `/portal`) links the website-only tools
  (PDA Practice Pro, ChairSide, mock state board, flashcards, résumé builder) and
  is gated by the guard. Content is hidden until access is confirmed (no flash).
- The public **preview** trainers are intentionally left ungated — prospects can
  still try them logged-out. The portal is the gated, enrolled-only surface.

## 2. Kajabi → website sync (Task 2)

- **Receiver:** Supabase edge function `kajabi-webhook`
  (`supabase/functions/kajabi-webhook/index.ts`).
- **Endpoint:** `https://lmbsuwslsycukynzpzik.functions.supabase.co/kajabi-webhook`
  Configure in Kajabi → Settings → Webhooks/Automations for purchase /
  offer-granted events.
- **Auth / signature:** accepts **either** an HMAC-SHA256 signature header
  (`X-Kajabi-Signature` / `X-Webhook-Signature` / `X-Signature`, hex or base64,
  optional `sha256=` prefix) verified against `KAJABI_WEBHOOK_SECRET`, **or** the
  shared `?secret=<KAJABI_WEBHOOK_SECRET>` query token (back-compatible with the
  current setup; legacy literal still accepted until the secret row is set).
- **Idempotent:** dedupes on `purchases.external_payment_id` (also enforced by a
  partial unique index), so re-delivered webhooks never double-grant.
- **On purchase it:** finds/creates the auth user → upserts the profile and
  **grants portal access** (`program` from the offer: online→`career_track`,
  in-person→`foundation`; `enrolled_at`, `kajabi_id`, `portal_status='active'`) →
  records the `purchases` row → **emails the buyer** (Resend) a one-tap portal
  magic link + instructions about the website portal and its extra tools.
- **Failed payments** branch to `failed_payments` + an urgent `admin_tasks` row.

## 3. Lead pipeline + text logging (Task 3)

- **Admin dashboard:** `admin/leads.html` (also embedded in `dashboard.html` for
  admins). Shows every inbound lead/call/text, what they wanted, pipeline stages
  (`new · interested · tour_booked · paying · contacted · lost`), a "hot" strip,
  and the messages inbox (now with a 📞 icon for calls).
- **New grading:** `leads.lead_grade` (`hot | qualified | non_qualified`) and
  `leads.ready_timeline` (`ready_now` or `YYYY-MM` for "wants to start <month>").
  Amanda sets these per row; the Quo webhook may seed them from a call summary
  but only when still blank.
- **Quo/Sona ingestion:** `quo-inbound-webhook`
  (`supabase/functions/quo-inbound-webhook/index.ts`).
  - **Calls:** `call.completed` / `call.transcript.completed` /
    `call.summary.completed` → one `communications` row per `call_id` (transcript
    + summary merge in), lead upserted, an `admin_tasks` row on completion, and
    Sona's captured fields (email/name/program/timeline) seed the lead.
  - **Texts:** `message.received` → **logged** to `communications` (channel
    `sms`) + lead/task. **Auto-reply stays OFF.** The after-hours AI reply path
    exists but is gated behind `app_secrets.QUO_AUTOREPLY_ENABLED` (standing
    value: `off`) and only fires after-hours on high-confidence intents. Logging
    happens regardless of the switch.
  - **Endpoint:** `…/quo-inbound-webhook?secret=pda-quo-2026` (matches the live
    Quo subscription).
  - **Re-add the text subscription (Quo side):** in the Quo/OpenPhone dashboard
    (or API), re-enable the **`message.received`** event to this webhook URL.
    Confirm `QUO_AUTOREPLY_ENABLED=off` so texts are logged but never
    auto-answered.

---

## Secrets (Supabase `app_secrets` table — never in the repo)

| Key | Used by | Purpose |
|---|---|---|
| `KAJABI_WEBHOOK_SECRET` | `kajabi-webhook` | shared `?secret=` token **and** HMAC key |
| `RESEND_API_KEY` | `kajabi-webhook`, `enroll-welcome`, `send-welcome-email` | transactional email |
| `QUO_API_KEY` | `quo-inbound-webhook`, `quo-send-sms` | OpenPhone/Quo API (outbound) |
| `QUO_AUTOREPLY_ENABLED` | `quo-inbound-webhook` | `off`/`on` kill switch for the after-hours AI (keep `off`) |
| `SQUARE_ACCESS_TOKEN` | `api/enroll.js`, `buy-exam-pro` | Square payments (existing) |
| `KAJABI_CLIENT_ID/SECRET`, `KAJABI_SITE_ID/URL` | `kajabi-sync`, `kajabi-my-courses` | Kajabi API (existing) |

Platform-provided to every edge function: `SUPABASE_URL`,
`SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`. The browser uses only the
**publishable** anon key (safe to ship), as in `auth.js`.

## Database (migration `db/migrations/20260620_portal_kajabi_pipeline.sql`)

Additive + idempotent (safe to re-run):
- `profiles.portal_status` + check constraint; `public.my_portal_access()` RPC.
- `purchases` partial unique index on `external_payment_id` (Kajabi idempotency).
- `leads.lead_grade` + check, `leads.ready_timeline`, supporting indexes.
- RLS unchanged — existing admin-only `leads` policies are column-agnostic.

## Deploy / verify

- Static site auto-deploys from `main` on Vercel.
- Edge functions: `supabase functions deploy kajabi-webhook` and
  `quo-inbound-webhook` (or via the Supabase dashboard / MCP).
- Migration: apply `20260620_portal_kajabi_pipeline.sql`.
- Smoke test: `/portal` redirects logged-out users to `/login`; a Kajabi test
  purchase creates the user + emails the portal link; an inbound text appears in
  the admin inbox with **no** auto-reply.
