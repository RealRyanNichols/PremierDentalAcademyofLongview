# Enrollment welcome email + automations — runbook

Status: **function source ready; not yet deployed/wired.** Activation is gated on
Amanda confirming the school supply list. Mirrors the proven `lead-notify` setup.

## 1. Welcome email — `supabase/functions/enroll-welcome`
Sends a newly-enrolled student their welcome email with their **chosen start date**
and the **school supply list**, BCCing Amanda. Online enrollments get a "start any
day" variant (no class date).

### Before deploying
1. **[VERIFY: Amanda — supply list]** Replace the placeholder `SUPPLY_LIST` array in
   `index.ts` with Amanda's real list. Do not invent items.
2. Add a secret to `public.app_secrets`:
   - `ENROLL_WELCOME_SECRET` = a long random string (like `LEAD_NOTIFY_SECRET`).
   - `RESEND_API_KEY` already exists (shared with lead-notify).

### Deploy
```
supabase functions deploy enroll-welcome --no-verify-jwt
```
(or via the Supabase MCP `deploy_edge_function`). `verify_jwt` is OFF because it's
called server-side with the shared secret, exactly like `lead-notify`.

### Test (no real charge)
```
curl -X POST "https://lmbsuwslsycukynzpzik.functions.supabase.co/enroll-welcome?secret=THE_SECRET" \
  -H "content-type: application/json" \
  -d '{"name":"Test Student","email":"you@example.com","plan":"in-person","startDate":"2026-08-04","cohortName":"August In-Person"}'
```

## 2. Wire it to enrollment (fail-safe — protects the charge)
`api/enroll.js` must NEVER error after a successful Square charge. So call this
function **fire-and-forget, fully wrapped**, right before returning the success
response. Drop this in after `out`/the success payload is built and before
`res.status(200).json(...)`:

```js
// Fire-and-forget welcome email. Wrapped so it can NEVER affect the charge result.
try {
  const wf = process.env.ENROLL_WELCOME_URL;      // .../functions/v1/enroll-welcome?secret=...
  if (wf) {
    // Do not await long: cap it so a slow email never delays the buyer's receipt.
    await Promise.race([
      fetch(wf, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name, email, plan,
          startDate: firstPaymentDate || '',   // student's chosen start
          cohortName: cohortName || '',
        }),
      }).catch(() => {}),
      new Promise((r) => setTimeout(r, 2500)),
    ]);
  }
} catch (_e) { /* swallow — the charge already succeeded */ }
```
Set `ENROLL_WELCOME_URL` in Vercel env (includes `?secret=ENROLL_WELCOME_SECRET`).
If the env var is unset, nothing happens — safe to merge before activation.

> Alternative (zero payment-code change): insert each enrollment into a new
> `public.enrollments` table and fire `enroll-welcome` from an `AFTER INSERT`
> trigger via `pg_net`, exactly like `notify_new_lead` → `lead-notify`. Preferred
> once an `enrollments` table exists.

## 3. Automations (build on existing analytics + leads)
The new tools already emit analytics events (`funding_finder_run`,
`fit_quiz_complete`, `take_home_pay_run`, etc.) and lead inserts already email
Amanda. Planned sequences (each a small secret-gated edge function + a `pg_cron`
schedule):

- **Lead nurture** — Day 0 autoresponder (live via `lead-notify`); add Day 2 / Day 5
  / Day 10 touches (story, tools, funding) for leads with no enrollment yet.
- **Abandoned application** — for `leads` with `interest_path` set but no matching
  Square customer after 48h, send a gentle "still here when you're ready" + call CTA.
- **Tool-completion follow-up** — when a visitor fires a tool-complete event and
  leaves an email (funding-finder / fit-quiz capture), send the matching next step
  (funding → apply; fit-quiz "yes" → enroll; take-home-pay → calendar).

Each needs Amanda's copy + a test pass before activation; none should send without
the secret gate. Keep all sends idempotent (dedupe on lead id + step) so a cron
retry can't double-send.
