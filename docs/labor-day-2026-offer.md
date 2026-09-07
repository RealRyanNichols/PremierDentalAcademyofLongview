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

## Status after verification (Sunday Sep 6, ~9:30 PM CT)

**The $100 links are ON HOLD.** Verified against the code and Square:

- Nothing in the codebase can save `cohorts.deposit_link_url`. `/admin/cohorts` is a read-only viewer (zero writes, zero mentions of the column). The only way to set it is SQL.
- Even with a link saved, the `square-webhook` (still v6) assigns the class only from the Square **customer note**, which a hosted payment link cannot set. A buyer would land with no class (`cohort_id NULL`), or, if they already have a stale customer note, in the wrong class. With `cohort_id NULL` the seat counter never moves, so the site would keep selling past 8 seats during a week when every buyer holds a full-refund right.
- A buyer with a website account is auto-enrolled with full course access, and the webhook has no refund branch. A $100 buyer could take the course library and claim the $100 back by Thursday.
- The real kill switch is nulling `deposit_link_url` (SQL), not disabling the Square link: a disabled link leaves the button pointing at a dead checkout.

**So the offer runs by phone.** The page stays in its "call or text to reserve" state, which it renders correctly, and Amanda assigns the class herself when she takes the $100 at (903) 913-6444. The bars stay hidden by design.

To turn the links on later, all three must be true first: a write path for `deposit_link_url` (SQL or a small admin field), a webhook change that reads the class from the order line item and does not grant course access on a $100 deposit, and the retired Square links below disabled.

## Retired prices still buyable in Square (needs Amanda's approval to disable)

Live hosted links found Sep 6: `square.link/u/BDrjqV0d` (full tuition one-time, retired price), `square.link/u/MyXAJViU`, `BNSrfAvW`, `UCHKPVPK` (the May 2026 $2,100 daily/monthly/weekly plans), and `V47Vjqx3` (online at the retired $397). Unarchived catalog items at $200 down, $425 "non-refundable deposit", $4,500, $4,800 and three any-amount items. The Square location also prints **+1 903-230-6444** on every receipt (the never-use number). Disabling links and fixing the phone are Square writes; the $2,100 weekly/monthly links may be what current students still pay through, so each one is reviewed with Amanda before it is turned off.

## Selena: correction email (Gmail draft, NOT sent) + text (NOT sent)

**The move was applied Sep 6 (Ryan's go).** Selena is on September 29; the Sept 14 seat count dropped by one and her open task is closed. Gmail draft `r7181875990320985896` in the hello@ inbox, subject **"Your start date is September 29 (corrected)"**, is ready to send **tomorrow between 8 AM and 6 PM CT**. Text only **+1 903-399-2992** (her thread). There is a second Selena in the system (Selena Gonzalez, +1 903-407-6758) with the same Tue/Thu preference; do not text that number.

Text to send on her existing Quo thread, after the SQL is applied and inside 8 AM to 6 PM CT (staged here, not sent, not queued):

> Hi Selena, this is Amanda at Premier Dental Academy. Got your text, and I am sorry about the mix-up. You are now in the September 29 class: Tuesdays and Thursdays, 9:00 AM to 3:00 PM, at 2800 Gilmer Rd, Suite 106. Your $500 down is not affected. Please ignore the September 14 date in the welcome email. I just sent you a corrected email too. Text or call me here with any questions.

## Instructor gradebook access: it already works

Checked live on Sep 6: `admin_student_progress()` and `admin_student_activity()` both admit `is_admin OR is_instructor`, and `/admin/progress` admits instructors. Both instructor accounts are `is_instructor = true`, active, and have signed in recently (Alexis Griffin on Aug 17; Emelia, filed as Escalona, on Sep 2). **Send them the URL: https://www.premierdentalacademyoflongview.com/admin/progress** (they sign in with their existing accounts). No migration shipped.

Two things Amanda has **not** decided, so nothing was changed: instructors cannot see `purchases` (no instructor policy), and `is_instructor` has no JWT claim (only `is_admin` does). Also note the `trg_pda_auto_admin_hello` trigger hard-denies `is_admin` for every email except hello@, so a plain `UPDATE profiles SET is_admin = true` for anyone else silently writes false.

## Linsey Jaimes: ask, do not assume

Every one of her communications is machine-generated; she has never sent a human message. Her Sept 14 seat was assigned by the webhook from a generic item name. Her roster name is "Linsey", her email says "lindsey", and her profile has no name. Text to send (8 AM to 6 PM):

> Hi, this is Amanda at Premier Dental Academy. Thank you for your $500 deposit. I have you down for the class starting Monday, September 14 (Mon/Wed/Fri, 8:30 AM to 12:30 PM). Is that the class you want, or would September 29 (Tue/Thu) fit better? Also, so your certificate is right: is your name spelled Linsey or Lindsey? Text or call me here any time.

## Balance plans: confirmed amounts

Zero invoices and zero subscriptions exist for all four. Correct balances if each is on the $3,500 plan: **Selena $3,000 · Linsey $3,000 · Madisyn $3,000 · Crystal S. $2,000** (Crystal has paid $1,500 and is a current August 25 student, not September). Only Crystal's $3,500 total is written down anywhere. The weekly/monthly choice for the other three was never stored. Confirm the agreed total and schedule with each student before any invoice is created.

## Findings Amanda needs to know (not fixed in this build)

1. **$11,000 of balances have no scheduled collection in Square** (Selena $3,000, Linsey $3,000, Madisyn $3,000, Crystal $2,000). The checkout's auto-pay step has never worked once: Square holds the $3,000 "remaining balance" orders for all four, but the installment invoice failed every time and the account has zero installment invoices in its history. `/admin/payments` shows this live under "No balance schedule in Square".
2. **The revenue table captures about one dollar in six.** Square has 53 completed payments since July 1 totalling $25,440; 12 ($4,142) are in `purchases`. `public.failed_payments` is empty while Square logged 20 failed payments ($6,998) in the same window, so nobody is followed up after a decline. All 1,604 `admin_tasks` are `status='open'`, so the queue carries no signal, and the cohort-assignment tasks have `related_student_id = NULL`. `/admin/payments` lists the gaps under "In Square but not in our records".
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
