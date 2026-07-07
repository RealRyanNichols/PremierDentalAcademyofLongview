# Cowork Request — July 7, 2026 (paste this whole file into Claude Cowork)

You are Claude Cowork with browser access, working for Premier Dental Academy of
Longview (Amanda Williams / Ryan Nichols). Claude Code has built everything that
can be built from the repo and Supabase — the tasks below need a BROWSER and
logged-in accounts, which only you have. Work top to bottom; each task says
exactly where its output goes. **Never paste tokens/secrets into chat — store
them straight into Supabase `public.app_secrets` (SQL editor:
`insert into app_secrets (key, value) values ('KEY','value') on conflict (key)
do update set value = excluded.value;`).**

---

## A. DO THESE — Cowork-only tasks (in priority order)

### A1. Activate the Meta Lead Ads webhook (~45 min) — leads currently die in Meta
The receiving function is DEPLOYED and waiting: `meta-lead-webhook` (fails
closed until secrets exist). Full spec: `TODO-META-LEAD-WEBHOOK.md` in the repo.
1. developers.facebook.com → business 1682755105672464 → use/create app
   "PDA Lead Sync" (type Business) with `leads_retrieval` +
   `pages_manage_metadata` permissions.
2. Generate a **long-lived Page access token** for page 180743142587539.
3. Pick a random verify token string.
4. Store in app_secrets: `META_PAGE_TOKEN`, `META_APP_SECRET` (the app secret),
   `META_VERIFY_TOKEN`.
5. Webhooks product → object `page`, field `leadgen`, callback URL
   `https://lmbsuwslsycukynzpzik.supabase.co/functions/v1/meta-lead-webhook`,
   verify token = yours. Then POST /{page-id}/subscribed_apps.
6. In Kajabi → Marketing → Forms → "FB Lead Ad" form → copy the form's POST
   endpoint from its embed code → store as app_secrets `KAJABI_FB_FORM_URL`.
7. Test with the Lead Ads Testing Tool → confirm a row lands in
   `public.leads` (source `facebook_ad`) AND the Kajabi contact joins
   sequence 2148853717. Delete the test lead row + Kajabi test contact after.

### A2. Pay the Kajabi balance — $291.54, suspends July 22 (5 min, do not skip)

### A3. Kajabi online course weeks 6–12 (the big one, ~2-3 hrs)
The online RDA course is missing modules 6–12; in-person has all 12 built.
Clone the in-person lessons into the online product. Complete runbook:
`docs/HANDOFF-kajabi-online-course-buildout.md`.

### A4. Launch the persona ad campaigns in Meta Ads Manager (~1 hr)
Five funnels are LIVE and instrumented. For each, create an ad set →
destination URL + ready-made copy (3 headlines + 2 primary texts each) in
`marketing/ad-copy/<persona>.md`:
- /go/moms · /go/single-moms · /go/fresh-start · /go/career-change · /go/laid-off
Pixel 1290830552877730 is already firing PageView/ViewContent/InitiateCheckout
on all of them, and each carries its own utm_campaign — results split cleanly
in /admin/kpi. Start small budgets; the funnels report per-persona conversion.

### A5. Vercel project settings (10 min)
Project `premier-dental-academyof-longview` → enable **Web Analytics** and
**Speed Insights** toggles (script tags are already on the pages). While
there: confirm today's production deploy succeeded and spot-check these live:
`/paperwork`, `/go/moms`, `/admin/kpi`, `/tools/tuition-planner`,
`/sponsor-a-student`, dashboard "Ask your teacher".

### A6. Figma seat (5 min, decision)
The Figma Starter plan hit its MCP tool-call cap mid-design-session. Either
upgrade the plan (unblocks automated design work in
"PDA — Shareable Tool & Offer Cards") or reply "keep Starter" and Claude Code
will keep rendering final graphics via HTML instead.

### A7. Buy-flow smoke test with Amanda's consent (15 min)
Per the sprint list: one real $29 Exam Pro purchase on /exam-pro (guest
checkout), confirm the entitlement + email arrive, then refund it in the
Square Dashboard. Log the result in CHANGELOG.md.

### A8. Print/post the paperwork QR (5 min)
Generate a QR for `https://www.premierdentalacademyoflongview.com/paperwork`
(any QR generator), print it big, and put it on the front desk — students
scan it on day one and the whole enrollment flow runs itself.

---

## B. WISH LIST — access that would let Claude Code do MORE automatically
(Each of these converts a recurring manual chore into something the repo agent
handles end-to-end. Grant what you're comfortable with.)

1. **Kajabi API credentials with course-edit scope** (or a Kajabi MCP
   connection) → course buildouts, broadcast scheduling, and drip edits become
   repo tasks instead of handoffs. This is the single biggest unlock.
2. **Quo API key in app_secrets (`QUO_API_KEY`)** → new-lead and new-paperwork
   events can TEXT Amanda instead of waiting in a dashboard (the
   `quo-send-sms` function already exists).
3. **Meta Marketing API token** (ads_management) → Claude Code could rotate ad
   copy, pause losers, and report spend-vs-leads in the weekly digest.
4. **Google Business Profile access** → local-SEO posting + review replies for
   the 22 city pages' towns.
5. **The 6–8 phone photos** (typodont hands, X-ray gear, operatory, teaching
   moment, front door, Pack flat-lay) → drop-in slots are already built.
6. **Owner confirmations** (15 min with Amanda, `docs/known-decisions-needed.md`):
   placement %, graduate count, 12-vs-14 weeks, salary source, 8-seat cap,
   no-placement-fee, official social links → unlocks stronger honest claims
   site-wide.
7. **Approval to delete stale branches**: 8 fully-merged + ~42 superseded
   (list in the July 7 session log); Claude Code can execute the deletions
   itself the moment approval is given.

---

## C. WHEN YOU'RE DONE — reply back in exactly this format

Post (in Cowork chat AND as a new file `docs/COWORK-RESULTS-2026-07-07.md`
committed to main):

```
COWORK COMPLETE — 2026-07-07
| # | Task | Status | Notes |
|---|------|--------|-------|
| A1 | Meta webhook | ✅/⚠️/❌ | secrets stored: yes/no · test lead landed: yes/no |
| A2 | Kajabi balance | ... | |
| A3 | Weeks 6–12 | ... | modules completed: n/7 |
| A4 | Persona ads | ... | campaigns live: which |
| A5 | Vercel | ... | analytics on: yes/no · live pages verified: list |
| A6 | Figma | ... | upgraded / keep Starter |
| A7 | Buy-flow test | ... | purchase id · refunded: yes/no |
| A8 | Paperwork QR | ... | |
Wish-list granted: [numbers]
Blocked on: [anything]
```

Then tell Claude Code (next session prompt): **"Cowork finished the July 7
request — read docs/COWORK-RESULTS-2026-07-07.md and continue: wire everything
that new access unlocks, starting with SMS notifications if QUO_API_KEY exists
and ad-performance reporting if the Meta token exists."**
