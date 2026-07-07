# TODO: Meta Lead Ads Webhook → Supabase → Kajabi (build this weekend)

**Status:** NOT BUILT. Saved 2026-07-03 after Lead #1 (Mandy Saxo) proved the gap.
**Why:** FB instant-form leads land ONLY in Meta Leads Center. They do NOT reach
/admin/leads (Supabase) and the Meta "CRM connection" did NOT sync to Kajabi.
Lead #1 was bridged by hand. This webhook makes it automatic.

## Target flow
FB instant form submit
  → Meta `leadgen` webhook fires
  → Supabase Edge Function `meta-lead-webhook`
  → 1) INSERT into public.leads (source: 'facebook_ad', utm from form/ad ids)
  → 2) POST lead to Kajabi form "FB Lead Ad" (form endpoint submit)
       → Kajabi workflow 813105 ("FB Lead Ad → 30-Day Enrollment Drip", Published)
       → auto-subscribes contact to sequence 2148853717 → Day 0 email fires

## Build steps (est. 45-60 min)

### 1. Meta side (needs Amanda's FB Business access — the account you'll be in)
- developers.facebook.com → the app tied to business 1682755105672464
  (or create "PDA Lead Sync" app, type Business)
- App must have `leads_retrieval` + `pages_manage_metadata` permissions
- Generate a long-lived Page access token for the "Premier Dental Academy
  of Longview" page (id 180743142587539)
- Webhooks product → subscribe to object `page`, field `leadgen`,
  callback URL = Supabase function URL (step 2), verify token = pick one
- Subscribe the PAGE to the app (POST /{page-id}/subscribed_apps)

### 2. Supabase side (project lmbsuwslsycukynzpzik)
- New Edge Function `meta-lead-webhook`:
  - GET: echo hub.challenge when hub.verify_token matches (Meta verification)
  - POST: verify X-Hub-Signature-256 (app secret HMAC)
  - Extract leadgen_id → call Graph API
    GET /{leadgen_id}?access_token=PAGE_TOKEN → field_data
  - Map: full_name/email/phone_number + custom question answers
    (schedule pick / payment method / tour yes-no)
  - INSERT public.leads: source='facebook_ad',
    utm={"utm_source":"facebook","utm_medium":"paid",
         "utm_campaign":"july-class-leads-v2"},
    message = the 3 form answers, pipeline_stage='new'
  - POST to Kajabi form "FB Lead Ad" (get form's POST endpoint from its
    embed code in Kajabi → Marketing → Forms) with name/email/phone
    → triggers workflow 813105 → drip subscription
- Secrets to set: META_PAGE_TOKEN, META_APP_SECRET, META_VERIFY_TOKEN
- Optional: also text Amanda via Quo API on each new lead

### 3. Test
- Meta "Lead Ads Testing Tool" (developers.facebook.com/tools/lead-ads-testing)
  → fire test lead → confirm row in public.leads AND new Kajabi contact
  subscribed to sequence 2148853717
- Delete the test contact after

## Interim (until built)
- Zapier: FB Lead Ads (premium trigger) → Google Sheet row +
  Webhooks-POST to Kajabi "FB Lead Ad" form endpoint → same workflow fires
- Or manual: Leads Center → add Kajabi contact → sequence Add Subscribers
  → Custom Segment → "Email contains" their email (exactly how Lead #1 was done)

## Reference IDs
- Ad account: act_1439074857790304 · Business: 1682755105672464
- Page: 180743142587539 · Pixel: 1290830552877730
- Kajabi site: 2148779127 · Sequence: 2148853717 · Workflow: 813105
- Instant form: "PDA | July v2 | Payment+Schedule+Tour" (lead form id 1291670476381354)
- Supabase: lmbsuwslsycukynzpzik (public.leads)
