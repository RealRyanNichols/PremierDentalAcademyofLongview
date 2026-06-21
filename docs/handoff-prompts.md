# Claude-coworker handoff prompts

Two things can't be finished from the headless repo agent: (1) verifying the **logged-in
student dashboard** in a real browser, and (2) confirming **business facts only Amanda
knows**. Paste each prompt below into a browser-capable / owner-facing Claude. Each is
self-contained.

---

## Prompt 1 — Verify the student dashboard in a browser (the code fix is DONE)

**The nav conflict + tracking were fixed in code (see "What was already done" below).** This
prompt is now just a logged-in VISUAL verification — the only part that genuinely needs a
real browser session. If it all looks right, there's nothing to change.

```
You're working on the Premier Dental Academy of Longview site (static HTML + Tailwind +
Supabase, hosted on Vercel; repo branch claude/nifty-babbage-qzf2ay). The student-dashboard
nav conflict was already FIXED in code: assets/pda-nav.js now honors a data-pda-keep
attribute (it skips replacing the nav + skips the prospect chrome, but still loads analytics
and renders the shared footer), and dashboard.html's student <nav> carries data-pda-keep.
Tool CTAs on the dashboard now have data-event="tool_start". Your job is to log in as a
STUDENT at https://www.premierdentalacademyoflongview.com/login (use a real student account
or have Amanda seed one), open /dashboard, and VERIFY it renders correctly:

1. Confirm the STUDENT top-bar renders (logo, Dashboard/Practice Pro/ChairSide/Flashcards/
   Support, avatar circle) — NOT the marketing nav (Programs/Calendar/Free tools/Enroll).
   Open the dev console and confirm zero errors.
2. Click the avatar → dropdown opens (name/email, Account settings, Get help, Sign out).
   Click "Sign out" → lands on /logout and the session clears. (These were dead before the
   fix because the nav was being swapped out; confirm they now work.)
3. Confirm the "Admin dashboard" link in the avatar dropdown shows ONLY for admins.
4. Confirm the rest of the hub populates: the Kajabi "My courses" library loads
   (kajabi-my-courses edge function), the stat tiles (actions/patients/streak) and the
   achievement level show real values, and the feedback widget mounts.
5. Confirm the shared dark footer now appears at the bottom of /dashboard (Programs / Free
   trainers / More / Privacy / Terms), and that the mobile "Apply now" bar + exit-intent
   modal do NOT appear on the dashboard.
6. Only if you find a defect: fix it, run `npm test` (must stay green: facts, links,
   analytics, seo, a11y, sitemap), commit as Ryan Nichols
   <hello@premierdentalacademyoflongview.com>, PR, and squash-merge to main.

Report what rendered and whether anything needed changing.
```

---

## Prompt 2 — Confirm business facts, then bake into site-facts.js

```
You're updating Premier Dental Academy of Longview's single source of truth for business
facts: assets/site-facts.js (window.PDA_FACTS), validated by `npm run check:facts`. The repo
has unverified marketing claims flagged in docs/known-decisions-needed.md. RULE: never invent
a number — only set values Amanda confirms. Ask Amanda these, then update site-facts.js and
clear each item's needsOwnerConfirmation flag ONLY once confirmed:

1. Program length — is it 12 weeks or 14 weeks? (The whole live site currently says 12; "14"
   appears nowhere. Confirm the real number.)
2. Job-placement rate — the site says "85%+". Is there a real, dated figure + how it's
   measured? If not, we must soften to non-numeric ("most graduates work in East Texas
   offices") everywhere it appears (index, enroll, teach, night-class, graduates,
   tools/practice-exam).
3. Salary figures — "$42k+" and "$36,000–$44,000". Confirm the range is current and give a
   citable source (e.g. BLS/TWC East-Texas RDA wage) to add to salary.html.
4. Graduate count — the site uses both "406+" and "400+". Pick ONE verified current number.
5. "No placement fee" (employers pages) — confirm this is the standing policy.
6. "Only 8 seats per class" (calendar) — confirm real per-cohort capacity (should match
   cohorts.capacity).
7. Funding programs named anywhere (TWC / GI Bill® / WIOA) — confirm approval/eligibility
   before asserting.
8. Official social media URLs (Facebook/Instagram/etc.) for the footer.

For each: update assets/site-facts.js, fix every page listed in docs/known-decisions-needed.md,
run `npm test` (must stay green), commit as Ryan Nichols
<hello@premierdentalacademyoflongview.com>, PR, and squash-merge to main.
```

---

### What was already done (headless) for Prompt 1
- **Nav conflict fixed.** `assets/pda-nav.js` now honors a `data-pda-keep` attribute on a
  page's `<nav>`: it skips replacing that nav and skips injecting the prospect chrome
  (marketing nav, mobile menu, Call/Apply bar, urgency bar, exit-intent), but STILL loads
  analytics + site-facts and renders the shared footer. `dashboard.html`'s student `<nav>`
  now carries `data-pda-keep`.
- **This also restored two dead controls.** Because the student bar was previously being
  swapped out, the avatar dropdown and Sign-out button had nothing to bind to (their JS was
  null-guarded, so it silently no-op'd). With the bar preserved, they work again.
- **Tracking added.** The dashboard's primary tool CTAs (hero buttons + the "Continue
  learning" grid + the Skills Lab grid) now carry `data-event="tool_start"`; the analytics
  layer auto-captures the tool from each link's href.
- **The dashboard also gained the shared footer** (it previously had none).
- Remaining in Prompt 1 = a logged-in BROWSER spot-check only.

### Status of Prompt 2
- No business facts were invented. They remain flagged in `assets/site-facts.js`
  (`check:facts` warnings) and `docs/known-decisions-needed.md` until confirmed via Prompt 2.
