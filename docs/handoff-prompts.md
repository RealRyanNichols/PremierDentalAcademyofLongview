# Claude-coworker handoff prompts

Two things can't be finished from the headless repo agent: (1) verifying the **logged-in
student dashboard** in a real browser, and (2) confirming **business facts only Amanda
knows**. Paste each prompt below into a browser-capable / owner-facing Claude. Each is
self-contained.

---

## Prompt 1 — Verify & polish the student dashboard (needs a logged-in session)

```
You're working on the Premier Dental Academy of Longview site (static HTML + Tailwind +
Supabase, hosted on Vercel; repo branch claude/nifty-babbage-qzf2ay). Log in as a STUDENT
at https://www.premierdentalacademyoflongview.com/login (use a real student account or have
Amanda seed one) and open /dashboard. Then verify and fix the student hub:

CONTEXT / KNOWN ISSUE: dashboard.html ships its own student top-bar as the page's first
<nav> (avatar menu, Dashboard/Practice Pro/ChairSide/Flashcards/Support, sign-out). But
assets/pda-nav.js REPLACES the first <nav> on every page with the marketing nav. So on the
dashboard, the student bar may be getting swapped for the prospect nav (Programs/Calendar/
Free tools/Enroll…). The dashboard JS was just null-guarded so it no longer crashes either
way — but the right UX is undecided.

DO:
1. Confirm what actually renders on /dashboard: the custom student bar, or the marketing nav?
   Open dev console and check for errors.
2. Decide the intended nav for logged-in students and make it consistent. Recommended: keep
   the purpose-built STUDENT bar on /dashboard (Dashboard, the trainers, Support, avatar/
   sign-out) and do NOT show the prospect marketing nav there. Implement by either:
     (a) giving pda-nav.js a "skip replacement" rule (e.g. honor a data-pda-keep attribute on
         the existing <nav>, and skip injecting the marketing mobile menu/CTA bar there), or
     (b) removing pda-nav.js from dashboard.html and giving it its own footer/analytics include.
   Whichever keeps the student bar intact AND still loads analytics (pda-analytics.js).
3. Verify the rest of the hub works logged in: avatar dropdown opens, Sign out → /logout,
   admin link shows only for admins, the Kajabi "My courses" library loads (kajabi-my-courses
   edge function), the stat tiles (actions/patients/streak) and achievement level populate,
   and the feedback widget mounts.
4. Add data-event tracking to the dashboard's primary tool CTAs (e.g. data-event="tool_start"
   with the tool name) so engagement is captured by the analytics layer.
5. Run `npm test` (must stay green: facts, links, analytics, seo, a11y, sitemap), commit as
   Ryan Nichols <hello@premierdentalacademyoflongview.com>, PR, and squash-merge to main.

Report what rendered before/after and exactly what you changed.
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

### Status of these items in the headless work
- The dashboard JS was hardened (null-guards) so it can't crash — but the nav-strategy + the
  logged-in verification are in Prompt 1.
- No business facts were invented. They remain flagged in `assets/site-facts.js`
  (`check:facts` warnings) and `docs/known-decisions-needed.md` until confirmed via Prompt 2.
