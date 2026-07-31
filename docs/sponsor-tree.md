# The Longview Sponsor Tree — how it works & how to run it

Shipped July 31, 2026. The /sponsor-a-student page is now the full "angel tree
for careers" it always described: an animated night-sky tree where every leaf is
a real student (consent-only, first name + last initial), leaves bloom gold when
fully sponsored, and sponsoring businesses glow as lanterns at the roots.
Sponsors can pay by card on the page (real Square checkout) or still request an
invoice/call. Everything rolls up automatically — zero manual math for Amanda.

## The pieces

| Piece | What it does |
|---|---|
| `/sponsor-a-student` | Public tree + board + online card checkout + both lead forms |
| `/admin/sponsors` | Amanda's console: applications → leaves → money (in admin nav) |
| `api/sponsor.js` | Square payment endpoint (variable amount, $25–$10,000) |
| `public.sponsorships` | Money ledger (pledged / invoiced / paid / canceled) — **admin-only RLS** |
| `public.sponsor_profiles` | The leaves (unchanged, from 20260702) |
| `sponsor_rollup()` trigger | paid money → `raised_cents` → auto-flip `approved` ⇄ `sponsored` at goal |
| `sponsor_tree_stats()` RPC | public aggregates: waiting / sponsored / raised / sponsor count |
| `sponsor_wall()` RPC | public list of recognition names — **opt-in (`public_thanks`) only** |

Migration: `db/migrations/20260731_sponsor_tree.sql` (applied to production via
Supabase MCP 2026-07-31; rollup trigger verified with an aborted-transaction
test; security advisors clean for the new objects).

## Amanda's flow (all in /admin/sponsors)

1. **Applications tab** — every `sponsor-student` / `sponsor-business` lead.
   Call/text/email straight from the card.
2. Student vetted + **written consent**? Click **"Hang her leaf"** → the editor
   pre-fills "First L." — write her approved blurb, check the consent box, set
   status `approved`. Her leaf appears on the public tree instantly.
   (The consent checkbox is enforced in the UI **and** by RLS — an
   unconsented row can never be read publicly.)
3. Money arrives:
   - **Online card** → recorded automatically as `paid` + receipt link; Amanda
     just gets the alert email.
   - **Invoice / cash / check** → "Record sponsorship" (or "Record payment" on
     the student's card), set status `paid` when it lands.
4. That's it. Raised bars, gold blooms, stats chips, and lanterns all update
   themselves from the ledger.

**Lanterns:** a business shows on the tree only when its sponsorship is `paid`,
`public_thanks` is checked, and a recognition name is set. Online sponsors
choose this themselves at checkout ("Light my lantern").

## api/sponsor.js — safety posture (same rules as api/enroll.js)

- Deterministic idempotency keys from the card nonce → a re-submit can't
  double-charge; `sponsorships.square_payment_id` is unique → can't
  double-record.
- **Never returns an error after a successful charge.** Post-charge failures
  (DB record, emails) return `ok: true` + a `warning`; JSON `error` responses
  only ever mean *no money moved*, so the front-end only re-enables the button
  in those cases. Unknown network state → "call Amanda, don't pay again."
- Records the ledger row with the service role; sends Amanda an alert + the
  sponsor a thank-you/receipt via Resend. The Resend key comes from Vercel env
  `RESEND_API_KEY`, **falling back to `public.app_secrets`** (the key
  lead-notify already uses live) — so alerts work even while the Vercel email
  engine env vars are pending.

## Env expectations (Vercel)

- `SQUARE_ACCESS_TOKEN` — already live (enroll uses it).
- `SUPABASE_SERVICE_ROLE_KEY` — needed to record ledger rows + resolve the
  chosen student. If missing, payments still succeed; the response carries a
  warning and Amanda reconciles from the Square receipt.
- `RESEND_API_KEY` / `RESEND_FROM` — optional (app_secrets fallback covers the
  key). Verified Resend domain: `updates.premierdentalacademyoflongview.com`;
  if sponsor emails don't arrive, set `RESEND_FROM` to an address on that
  domain.

Square location `2P2ZE3FJNEYTV` re-verified ACTIVE (credit-card capable) via
Square API on 2026-07-31.

## Rules that must not break

- **No PII on the public page, ever.** Leaves are first name + last initial,
  listed only with `consent_confirmed = true`. The `sponsorships` table (full
  sponsor contact info) has no public read path — only the aggregate RPCs.
- **Real data only.** The tree renders exactly what's in the database; empty
  states say "leaves are going up now" — never fake students, sponsors, or
  numbers. (The sample names in the local screenshot harness live only in the
  session scratchpad and are never deployed.)
- Sponsorships are **not** charitable donations (PDA is not a 501(c)(3)) — the
  paperwork note and FAQ language on the page were written with that in mind;
  keep them.

## Verify after deploy

1. `/sponsor-a-student` → 200, tree renders, stats chips only if real data.
2. `/admin/sponsors` → admin-gated, three tabs load.
3. Test the checkout with a real card for a small amount ($25) → Square receipt
   + admin email + row in `sponsorships` + (if aimed at a leaf) her bar moves.
   Refund from Square dashboard and flip the row to `canceled` — her bar drops
   back automatically (trigger handles it).
