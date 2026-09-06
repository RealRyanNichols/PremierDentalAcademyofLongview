# Labor Day 2026 offer — runbook, action pack, and findings

Prepared Sunday, September 6, 2026 (America/Chicago). Branch `feat/labor-day-offer-2026-09`.
Nothing here is deployed or applied. Amanda approves each production step separately.

## The offer (locked decisions)

- $100 reserves a seat in the **September 14** or **September 29** in-person class instead of the usual $500 down.
- $100 today + $3,000 balance = **$3,100 on a plan**, a real $400 discount off the $3,500 plan price. Installments are the already-published $3,000-balance tables, unchanged.
- The $100 is sold as a **tuition credit**. The word "nonrefundable" is never used anywhere (Tex. Educ. Code §132.061: every buyer who signs Sun Sep 6 or Mon Sep 7 has a full-refund right through **midnight Thursday, September 10, 2026**, because Labor Day is a legal holiday and the three counted days are Tue/Wed/Thu).
- Ends **Monday, September 7 at 11:59:59 PM CT** (`2026-09-08T04:59:59Z`).
- No program length, no seat counts, no placement/salary/graduate claims, no TWC number, no other instructor's name in any promo copy.
- October 5 (MWF) and October 20 (T/Th) are created at the normal $500 down, and act as overflow: if a September class fills, the same $100 holds an October seat (handled by phone; the page says so on a full class).

## Where the offer lives (single source of truth)

`assets/site-facts.js` → `laborDay2026`. Every surface reads it:

| Surface | File | Shows when |
|---|---|---|
| Landing page `/labor-day` | `labor-day.html` | offer live (date window + `active`). Expired → "this offer has ended" panel pointing at `/enroll`. |
| Site-wide top bar (every page except the homepage, admin, login) | `assets/pda-nav.js` → `injectPromoBar()` | offer live **and** at least one eligible class has a Square link in `cohorts.deposit_link_url` and is not full |
| Homepage top bar | `index.html` (`#laborday-bar`) | same two conditions; hides the online strike banner while it shows |

Three independent off-switches, no human action needed at the deadline:

1. **Clock.** Every consumer compares `Date.now()` to `endsAtISO` (an absolute instant with the Chicago offset, so a visitor's clock cannot extend it). Open tabs remove the bar at the exact second.
2. **`active` flag.** `laborDay2026.active = false` kills everything instantly (one-line change, deploy).
3. **Build guard.** `npm test` (`check:facts`) fails if `active` is still true after the deadline, so a deploy on Tuesday cannot ship a dead offer. `vercel.json` already serves HTML with `max-age=0, must-revalidate`, so no CDN copy outlives a flip.

**Hard ordering constraint, enforced by data:** the bars only render when a real `deposit_link_url` exists. Until Amanda pastes the Square links, the page shows "call or text to reserve" cards and the bars stay hidden. A "$100" bar can never appear while checkout would charge $500.

## Amanda's launch steps (in order)

1. **Create two Square payment links** (Square Dashboard → Payment Links → Checkout link), one per class:
   - Item name must contain **"In-Person"** (the webhook classifies the program from the order line-item text): e.g. `PDA RDA Program — In-Person — Labor Day seat reservation (September 14, 2026 — In-Person (MWF))`.
   - Price **$100.00**, quantity fixed at 1, collect buyer **name, email and phone**.
   - Repeat for `September 29, 2026 — In-Person (T/Th)`.
2. **Paste each link into the class record**: `/admin/cohorts` → the class → `deposit_link_url` (or SQL: `update public.cohorts set deposit_link_url = '<link>' where id = '<cohort id>';`).
   - Sept 14 id: `a808608c-df03-40de-822e-f587c7e64395`
   - Sept 29 id: `69d28988-f34c-49f4-a7bf-f99333f87585`
3. **Deploy `main`** once this branch is merged (Ryan). The moment both a deploy and the links exist, the page sells and the bars appear. Nothing else to flip.
4. **After each $100 payment**: open `/admin/payments`. A Labor Day buyer will show as an in-person payment with the class **not assigned** (see "Known gap" below). Assign the class on `/admin/cohorts`, then set up their balance plan in Square (invoices or a subscription) so the page's "no balance schedule" flag clears.
5. **Kill switch** at any time: disable the Square link (instant, no deploy), or set `active:false` and deploy.

## Known gap: the webhook cannot auto-assign a class from a payment link

`square-webhook` v6 (live, read on Sep 6) resolves the class only from the Square **customer note** (`Cohort: <exact cohort name>`). A hosted payment link does not set that note, so every Labor Day buyer will land in `enrollments` with `cohort_id = NULL` and their welcome email will carry no start date. `/admin/payments` flags these as "not assigned". If Amanda wants automatic assignment, the fix is a small webhook change (read the cohort name from the order line-item text as well); that is a separate, approval-gated deploy and is **not** part of this build.

**Amount-based program inference is still present in v6** but only as the last fallback (`if (!path) path = amount === 39700 || amount === 99700 ? "online" : "in-person"`), after the customer note, the lead's `path_preference`, and the order line-item text. A $100 Labor Day payment therefore cannot be misclassified as online. It classifies correctly by item name, and falls back to in-person anyway. The residual risk is the **other** $100 product (the online plan's first $100 payment on `square.link/u/V47Vjqx3`): it classifies correctly only if its line-item name contains "Online". Amanda should confirm that item name says "Online" before both $100 products are live at once.

## Selena: correction email (Gmail draft, NOT sent) + text (NOT sent)

Gmail draft created Sep 6 in the hello@ inbox, subject **"Your start date is September 29 (corrected)"**, to her enrollment email. **Send it only after `db/pending/2026-09-06_move_selena_to_sep29.sql` has been applied**, so the email and the record agree.

Text to send on her existing Quo thread, after the SQL is applied and inside 8 AM to 6 PM CT (staged here, not sent, not queued):

> Hi Selena, this is Amanda at Premier Dental Academy. Got your text, and I am sorry about the mix-up. You are now in the September 29 class: Tuesdays and Thursdays, 9:00 AM to 3:00 PM, at 2800 Gilmer Rd, Suite 106. Your $500 down is not affected. Please ignore the September 14 date in the welcome email. I just sent you a corrected email too. Text or call me here with any questions.

## Instructor gradebook access: it already works

Checked live on Sep 6: `admin_student_progress()` and `admin_student_activity()` both admit `is_admin OR is_instructor`, and `/admin/progress` admits instructors. Both instructor accounts are `is_instructor = true`, active, and have signed in recently (Alexis Griffin on Aug 17; Emelia, filed as Escalona, on Sep 2). **Send them the URL: https://www.premierdentalacademyoflongview.com/admin/progress** (they sign in with their existing accounts). No migration shipped.

Two things Amanda has **not** decided, so nothing was changed: instructors cannot see `purchases` (no instructor policy), and `is_instructor` has no JWT claim (only `is_admin` does). Also note the `trg_pda_auto_admin_hello` trigger hard-denies `is_admin` for every email except hello@, so a plain `UPDATE profiles SET is_admin = true` for anyone else silently writes false.

## Findings Amanda needs to know (not fixed in this build)

1. **Roughly $9,000 of down-payment balances have no scheduled collection in Square.** Selena ($500, Sep 1), Linsey ($500, Sep 3), Madisyn ($500, Aug 24) and Crystal S. ($500 Aug 25 + $1,000 Sep 1) have **no invoices and no subscription** under their Square customer ids. `/admin/payments` shows this live under "No balance schedule in Square".
2. **Real payments are missing from our database.** Completed Square payments with no `purchases` row as of Sep 6: Madisyn $500 (8/24), Crystal S. $500 (8/25), Fayth D. $300 (8/28), Ashley G. $150 (8/21), one $150 invoice payment (9/4), and two $175 point-of-sale payments (8/15, 8/21). Every dashboard total that reads `purchases` is understated by at least $1,000 and in fact by more. `/admin/payments` lists them under "In Square but not in our records".
3. `purchases` has **no unique index on `square_payment_id`** (only on `external_payment_id`), so a webhook re-fire can double-record. Add a partial unique index this week.
4. The `tuition-reserve` edge function still defaults to **$1,997 total / $200 down** when a caller omits the amount fields. The promo never touches it; retire or fix it this week.
5. RLS: `subscribers` (913 rows) and `chat_messages` (311) are readable by every signed-in user, and `subscribers` is publicly UPDATE-able. Security fix this week.

## Rollbacks

| Item | Rollback |
|---|---|
| Offer constant + helper (`site-facts.js`, `check-facts.mjs`) | set `active:false`, or revert the commit |
| `/labor-day` page | delete `labor-day.html` |
| Site-wide and homepage bars | `active:false` (no deploy needed once links are removed), or revert |
| Calendar/classes stale strings, blog count | revert the commit |
| `/admin/payments` + `api/admin-payments.js` + nav entry | delete the three additions |
| Meta pixel id in `analytics-config.js` | set it back to `""` |
| October cohorts SQL | `delete from public.cohorts where start_date in ('2026-10-05','2026-10-20');` (before anyone enrolls) |
| Selena move SQL | re-run with the two cohort ids swapped; reopen the task |
| Gmail draft | delete the draft |
