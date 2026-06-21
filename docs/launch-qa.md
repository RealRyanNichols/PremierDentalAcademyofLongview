# Launch QA runbook

Run this before announcing/relaunching, and as a spot-check after any big change.

## 1. Automated gates (must pass)
```
npm test
```
Runs 5 static validators — all must be green:
- `check:facts` — business facts present (warnings = owner-confirm items in `docs/known-decisions-needed.md`)
- `check:links` — 0 broken internal links
- `check:analytics` — analytics module loads, no-op safe
- `check:seo` — every indexable page has title/description/canonical/OG
- `check:a11y` — `<html lang>`, viewport, `<img alt>`, single `<h1>`

## 2. Post-deploy HTTP 200 checks
After `main` deploys, confirm these return 200:
```
/  /night-class  /calendar  /about  /classes  /salary  /graduates  /blog
/apply  /waitlist  /tour  /study-guide  /enroll  /api/enroll
/employers  /employers/request-graduate
/skills-lab  /tools/practice-exam  /tools/flashcards  /tools/practice-pro
/login  /dashboard  /admin
```
Plus the city pages: `/dental-assistant-school-tyler-tx`, `-marshall-tx`, `-kilgore-tx`,
`-henderson-tx`, `/dental-assistant-training-gladewater-tx`.

## 3. Manual QA (real device + desktop)
- **Nav/footer**: consistent on every page; hamburger opens/closes on mobile; "More" dropdown works; footer shows address/phone/email/Privacy/Terms + "Trainers use fictional data only. No real PHI."
- **Lead forms** — submit a test on each and confirm it lands in `/admin/leads`:
  `/apply`, `/waitlist`, `/tour`, `/study-guide`, `/employers/request-graduate`, and the
  practice-exam unlock. Each tags `source` and folds UTM attribution into `message`.
- **Honeypot**: forms still submit normally for humans (the hidden field is empty).
- **Calendar**: shows real upcoming cohorts with seats-left; full classes route to `/waitlist`.
- **Practice exam**: unlock → start → finish shows score + review; lead saved.
- **Payments**: `/enroll` loads; a real card test charges once (never errors after charge).
- **Analytics**: set `assets/analytics-config.js` `debug:true` (or check Vercel Analytics)
  and confirm `page_view` + CTA events (`apply_click`, `enroll_click`, etc.) fire.

## 4. Owner confirmations (accuracy/compliance)
Work through `docs/known-decisions-needed.md` (program length, placement %, salary figure +
source, graduate count, "no placement fee", seats, funding, social links). Update
`assets/site-facts.js` as each is confirmed.

## 5. Optional activations (Supabase/admin)
- **New-lead emails** (alert to Amanda + applicant autoresponder): `docs/lead-email-runbook.md`.
- **Analytics pixels** (GA4/Meta/TikTok): copy `assets/analytics-config.example.js` →
  `assets/analytics-config.js`, fill public IDs.

## 6. Rollback
Every change ships as a squash-merged PR to `main`. To roll back, revert the offending
merge commit on `main`; Vercel redeploys automatically.
