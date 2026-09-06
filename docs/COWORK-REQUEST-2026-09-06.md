# Cowork request — Labor Day offer go-live (Sunday, September 6, 2026)

Paste everything below the line into Claude Cowork (or hand it to Amanda in Claude). It is
written so Amanda can answer each item without opening the code. Every answer comes back to
Ryan or to the repo agent, which then finishes the wiring.

---

Hi Amanda. The Labor Day offer is deployed and waiting on three things only you can do.
Nothing charges $100 until step 1 is done, and the site shows "call or text to reserve"
until then, so there is no rush risk. Please do them in order.

## 1. Create the two $100 Square links (about 5 minutes, in Square)

Square Dashboard → Online → Payment Links → Create a link → "Collect a payment".

Make TWO links, one per class. For each:

- **Item name (copy exactly):**
  - Link A: `PDA RDA Program — In-Person — Labor Day seat reservation (September 14, 2026 — In-Person (MWF))`
  - Link B: `PDA RDA Program — In-Person — Labor Day seat reservation (September 29, 2026 — In-Person (T/Th))`
  The words "In-Person" must stay in the name. Our system reads that to know it is the in-person program.
- **Price:** $100.00, quantity fixed at 1.
- **Collect from the buyer:** name, email address, and phone number (turn all three on).
- Leave "nonrefundable" or any fine print OFF the link. The cancellation terms are already on the website page.

Then paste each link into the class record so the website picks it up automatically:

- Website → sign in as hello@ → `/admin/cohorts` → open **September 14, 2026 — In-Person (MWF)** → field **deposit_link_url** → paste Link A → save.
- Same for **September 29, 2026 — In-Person (T/Th)** → paste Link B → save.

The moment both are saved, the Labor Day bar appears on every page and the two "Reserve my
seat for $100" buttons go live on `/labor-day`. If you ever want it off instantly, disable
the link in Square.

Reply with: **"Links done"** (or paste the two links here and Ryan will save them).

## 2. Approve moving Selena to the September 29 class (one word)

Selena paid $500 on September 1 and texted the same day that the checkout put her in
September 14 but she cannot start until the 29th. Everything is staged:

- Her enrollment moves from September 14 to September 29 (seat counts fix themselves).
- Her open "assign a cohort" task closes.
- A corrected email is sitting as a DRAFT in the hello@ Gmail, subject
  "Your start date is September 29 (corrected)". It is not sent.
- A text for her thread is written (below) and not sent.

Reply with: **"Move Selena"** and the agent applies it. Then send the Gmail draft and this text
(between 8 AM and 6 PM):

> Hi Selena, this is Amanda at Premier Dental Academy. Got your text, and I am sorry about the mix-up. You are now in the September 29 class: Tuesdays and Thursdays, 9:00 AM to 3:00 PM, at 2800 Gilmer Rd, Suite 106. Your $500 down is not affected. Please ignore the September 14 date in the welcome email. I just sent you a corrected email too. Text or call me here with any questions.

Also: Linsey Jaimes has an identical open "assign a cohort" task and she IS on September 14.
If September 14 is right for her, reply **"Linsey stays"** and that task gets closed too.

## 3. One question: October 5 class hours

The October 5 (Mon/Wed/Fri) and October 20 (Tue/Thu) classes are created and live on the
calendar. October 20 shows the approved hours (9:00 AM to 3:00 PM). October 5 currently shows
"Call or text (903) 913-6444 for current class days & times" because the Mon/Wed/Fri block
for October has not been confirmed.

Reply with one of:
- **"October 5 is 8:30 to 12:30"** (same as the September 14 class), or
- the correct hours.

No evening, night, or Saturday times can be published.

## 4. Two money items to know about (no action tonight)

- Four students who paid deposits (Selena, Linsey, Madisyn, Crystal S.) have no balance
  invoices or subscription in Square. About $9,000 is not scheduled for collection.
  `/admin/payments` (new page, owner login) shows who, and a "open in Square" link for each.
- Seven completed Square payments were never recorded in our database (Madisyn $500,
  Crystal $500, Fayth $300, Ashley $150, a $150 invoice, two $175 point-of-sale). The same
  page lists them under "In Square but not in our records". Dashboard totals are understated
  until these are added.

## 5. Confirm the online $100 item name says "Online"

The online program's first $100 payment link (`square.link/u/V47Vjqx3`) must have "Online"
in its Square item name, otherwise a $100 online payment could be treated as in-person now
that two $100 products are live at once. Open that link's item in Square and reply
**"Online item name checked"** (or paste the name).
