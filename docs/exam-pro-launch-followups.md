# Exam Pro ($29) — launch follow-ups (config, not code)

The `/exam-pro` buy page and the hardened `buy-exam-pro` edge function (v3) are
live-ready. Two items are Ryan/Amanda config decisions, not code — the page
degrades gracefully without them, but they polish the experience:

## 1. Supabase Auth redirect allowlist (optional, UX polish)
`/exam-pro`'s Step-1 sign-in calls `signInWithOtp({ emailRedirectTo: origin + '/exam-pro' })`.
If `/exam-pro` isn't in **Supabase → Authentication → URL Configuration → Redirect
URLs**, the magic link lands the buyer on the Site URL (or `/dashboard`) instead of
back on the checkout. The page copy already handles this ("come back to this page —
it unlocks checkout once you're signed in"), so checkout still works; adding
`https://www.premierdentalacademyoflongview.com/exam-pro` (or a `/**` wildcard)
just makes the round-trip seamless.

## 2. Enrollment doesn't stamp `profiles.program` (known gap)
`api/enroll.js` (the $3,000/$397 Square enrollment) writes to Square only — it never
touches Supabase, so a site-enrolled student's `profiles.program` stays `preview`
and the "included free when you enroll" entitlement check
(`program !== 'preview'`) won't recognize them automatically. Mitigations shipped:
- The buy page shows an amber note: *"Enrolled PDA student? It's included free — if
  checkout still asks you to pay after signing in, text Amanda before paying."*
- `profiles.exam_pro` and Kajabi-synced `program` values DO grant access, so
  students who came through Kajabi are covered.
Real fix (future): have `api/enroll.js` (or the Square webhook) upsert
`profiles.program` on enrollment, or add an `is_enrolled` RPC the check can call.

## What shipped (code, in this PR)
- `/exam-pro` public checkout → existing `buy-exam-pro` edge function.
- `buy-exam-pro` **v3** (deployed): durable `purchases` row per sale (feeds the KPI
  revenue tile + a double-charge guard), an urgent `admin_tasks` row when auto-grant
  fails so "Amanda has been notified" is actually true, and the pre-charge
  already-paid short-circuit.
- Free practice-exam upsell now enforces real entitlement (RLS-backed) instead of
  unlocking the timed mock for any signed-in session; non-entitled users get the
  $29 offer or a free-bank drill.
- Card declines (400/401/402) now reset the form for retry instead of locking it;
  Square-SDK-blocked shows a real message.
