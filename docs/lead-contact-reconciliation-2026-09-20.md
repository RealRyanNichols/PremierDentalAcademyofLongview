# Why "New (uncontacted)" was wrong — reconciliation, Sep 20, 2026

Amanda: "a lot of these that you say I haven't contacted, I have." She is right.

## What the KPI page was doing
`/admin/kpi` bucketed the pipeline by `leads.pipeline_stage` alone. Almost nothing moves
that field: the forms create leads as `new`, and only the Quo webhook (on an inbound text
or a call with a Sona summary) or a manual stage change in the inbox moves it. So a lead
Amanda called, texted, or answered stayed "New (uncontacted)" forever.

## What the records actually show (488 leads in stage `new` on Sep 20)

| Evidence | Leads | Notes |
|---|---|---|
| A. Human contact logged out (Amanda's Quo calls, admin Call/Text/Note buttons) | 56 | 51 already had a contact stamp |
| B. The lead called or texted IN on Quo (a conversation exists) | 241 | 225 already had a contact stamp; Amanda replies by text personally |
| C. Automated text/email only (SMS drip, Resend sequence) | 50 | Not personal contact; all but one older than 30 days |
| D. No record anywhere we can see | 141 | 21 carry a contact stamp of unknown origin; 24 are under a week old |

Cross-checked against the hello@ Gmail mailbox for every lead in C + D with an email
(169 people): hello@ sent mail to 8 of them (a batch on Aug 17 and one on Aug 31; one
bounced). No lead in C + D has ever emailed hello@.

Net: **330 of the 488 "uncontacted" leads have contact on record** (299 stamped + 21
matched to a logged call/text + 10 emailed from hello@). 158 remain with no record:
48 got automated texts only, ~110 nothing at all. Of those 110, 75 are Facebook lead-ad
leads and 67 are practice-exam sign-ups — the two sources most likely to have been
answered on Facebook Messenger, which we cannot see.

## What we can and cannot see
- **Quo calls and texts — visible**, with one hole: Amanda's OUTBOUND texts. The webhook
  has logged outbound texts since Sep 18, but zero have arrived, which means the Quo
  webhook subscription is not sending outbound (`message.delivered`) events. Until it
  does, her replies are invisible and only the lead's inbound message proves a conversation.
  **Fix (Quo dashboard, Ryan/Amanda):** open the webhook that points at
  `quo-inbound-webhook` and add the outbound message event.
- **Site forms, chatbot, admin buttons — visible.**
- **hello@ Gmail — visible** (searched). Email sent from a personal inbox is not.
- **Facebook Messenger / Instagram DMs — NOT visible.** There is no Messenger
  integration. Options: (1) tap "I handled this" on the lead in `/admin/leads` after a
  Messenger reply, (2) a Meta Conversations API connection (page token; a Cowork request).
- **"Claude"** — earlier assistant sessions sent through hello@ Gmail; those are covered
  by the Gmail search above.

## What changed in this branch
1. `/admin/kpi` now calls a lead **contacted** when there is any evidence (stamp, logged
   call/text either way, matched by id, phone, or email), not only when the stage was
   moved. Label is now "New (no contact on record)". The "uncontacted older than 48h"
   nudge uses the same rule. Automated drips do not count.
2. Quo webhook source (`supabase/functions/quo-inbound-webhook/index.ts`): an outbound
   text from Amanda, or any completed call, now stamps the lead and moves `new →
   contacted`. **Needs deploy approval** (edge function).
3. `db/pending/20260920_reconcile_contacted_leads.sql` — STAGED: moves the 330 to
   `contacted`, fills missing stamps from the evidence time, notes the basis on each
   lead. **Needs Amanda's approval** before it is applied.

## Still to decide (Amanda)
- Apply the reconciliation (item 3)? Rollback is one statement (in the file).
- Deploy the webhook change (item 2)?
- Add the outbound message event in Quo so her texts are recorded going forward.
- How to record Messenger replies: the "I handled this" habit, or connect Meta.
