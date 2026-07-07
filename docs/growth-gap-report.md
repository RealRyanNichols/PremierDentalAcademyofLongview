# Growth Engine — Phase 0 gap report (July 2026)

Audit of the repo against the Growth Engine master brief. Short version: the site is
much further along than the brief assumes — the big genuine gaps are the **city-page
scale-out**, the **internal-link mesh**, the **owner dashboard**, and everything that
needs third-party write access (Kajabi contacts, Quo outbound, Square reporting).

## Already built (don't rebuild)
- **Answer/blog hub (brief C.2):** ~60 posts in `blog/` already cover nearly every
  target query — how-to-become, how-long, cost, cost-vs-community-college, salary,
  radiology cert, jurisprudence, WIOA, GI Bill, online-vs-in-person, is-it-worth-it,
  career change, job outlook. Gap is internal linking + a few comparison angles, not
  new content volume.
- **Comparison pages (C.3):** `dental-assistant-school-cost-vs-community-college-texas`
  and `online-vs-in-person-dental-assistant-training` exist. Missing: a dedicated
  "12 weeks vs 2 years" decision page (program-length fact is still
  `needsOwnerConfirmation` — blocked on Amanda/Ryan).
- **Lead-magnet tools (C.4):** 18 tools live under `/tools/` + skills-lab. Practice-exam
  already gates on lead capture. Gap: uniform email-capture on the other tools and the
  Kajabi push (blocked on the Kajabi API "create contacts" 403).
- **Funnels (C.6):** Meta pixel is site-wide with `InitiateCheckout` + `Purchase`;
  `/waitlist`, `/apply`, `/tour`, `/study-guide` all insert into `public.leads`.
  `TODO-META-LEAD-WEBHOOK.md` already specs the Meta lead webhook build.

## Real gaps (this branch starts closing them)
1. **Local SEO scale-out (C.1)** — only 6 city pages existed for a ~30-town commuter
   region. → Built in this PR: `data/cities.mjs` + `scripts/generate-city-pages.mjs`
   generating 17 new distinct town pages, a `/locations` hub, and a nearby-towns link
   mesh. Per-city salary pages: deferred (salary figures are `verified:false` in
   site-facts — don't multiply an unverified number across 20 pages).
2. **Reviews/social proof (C.5)** — testimonials are placeholders; no review-capture
   flow, no `AggregateRating`. Needs REAL reviews first (owner action) before any
   schema ships — rule 4 (real-only marketing) blocks fabricating this.
3. **Owner dashboard (C.7)** — `admin/` has leads/progress/students, but no KPI
   cockpit (Square revenue, Kajabi list growth, Meta spend). Needs server-side
   aggregation (edge function) so no secrets touch the client.
4. **Student portal renovation (C.8)** — `portal.html` is functional but plain; Square
   payment status needs a per-student edge function.
5. **Speed-to-lead SMS (C.6)** — `quo-inbound-webhook` exists; outbound-on-new-lead not
   wired. Extend `lead-notify` → Quo send once outbound is approved.
6. **Exam Pro $29 page** — `buy-exam-pro` edge function exists; the public page doesn't.

## Blocked on humans (not code)
- Kajabi API app: enable "create contacts" write permission (currently 403s).
- Program length 12 vs 14 weeks; placement %; graduate count (406+ vs 400+); salary
  range source — all flagged in `site-facts.js`, all block copy that uses them.
- Real reviews/testimonials + student-spotlight consent.
- Night-class $1,497 offer stays HELD (no real checkout link yet).

## Order of operations recommended
1. City-page engine + link mesh (this PR — pure static, zero risk to checkout).
2. Exam Pro page (revenue, small surface).
3. Lead-capture unification on tools + Kajabi queue (`leads.kajabi_pushed` already the
   pattern) — flips on when the Kajabi perm is fixed.
4. Owner dashboard edge function + UI.
5. Portal renovation.
6. Review engine once real reviews exist.
