# Claude Code prompt — Roll out the PDA redesign across the whole site

Paste into Claude Code in the `PremierDentalAcademyofLongview` repo. A redesign branch and a draft PR already exist — **continue on them**. Keep `main` deployable; never push to `main` directly.

---

You are continuing an approved visual redesign of the Premier Dental Academy of Longview website. The groundwork is done: write access works, the design source is committed, and the homepage already has the new interactive payment calculator live on the branch's Vercel preview. Your job is to apply the redesign to the remaining pages, safely and in place.

## Branch + state (don't recreate)
- Repo: `RealRyanNichols/PremierDentalAcademyofLongview` (public). Production branch: **`main`** (Vercel auto-deploys `main`; every branch gets a preview).
- Work on the existing branch **`claude/site-redesign`** (based on `main`). It already contains: `design-reference/` (the approved concept: `pda.css` + 13 reference pages) and a homepage commit adding the calculator.
- There's an open **draft PR → main**. Keep pushing to `claude/site-redesign`; the PR + Vercel preview update automatically.
- Commit as **Ryan Nichols <hello@premierdentalacademyoflongview.com>**. Do NOT tag commits/PRs/code as machine-generated. Run `npm test` (the repo's validators) before every push.

## How the site is actually built (verified — don't rediscover)
- Root-level **static HTML**, ~101 pages, no build step. Clean URLs via `vercel.json`.
- Styling = **Tailwind Play CDN** (`https://cdn.tailwindcss.com`) on each page + Google Fonts (Inter + Fraunces) + small per-page inline `<style>`. The brand is already navy / teal / amber + Fraunces headings.
- **Shared chrome = `assets/pda-nav.js`** — it runtime-injects the nav, mobile menu, footer, sticky Call/Apply bar, cohort urgency bar, exit-intent modal, and does Supabase auth-aware nav. Pages opt out of nav replacement with `data-pda-keep` (dashboard, etc.). **One source of truth — edit the chrome here, not per page.**
- Business facts: `assets/site-facts.js` (`window.PDA_FACTS`). SEO: `assets/pda-seo.js` + per-page meta + `sitemap.xml` / `robots.txt` / `assets/og-cover.png`. Analytics: `assets/pda-analytics.js` + `data-event` attributes.
- **Payments are LIVE — do not rebuild.** `api/enroll.js` charges $200 down then auto-charges the balance via a Square invoice (weekly $160×12 or monthly $640×3 on the $1,997 plan; online is one $397). Just **re-skin** `enroll.html`; keep the form logic + `/api/enroll` contract + the `enroll_plan_selected` / `begin_checkout` / `purchase` events intact.
- Auth/dashboard/leads = **Supabase** (RLS). Trainers = `tools/*` and `skills-lab/*` (interactive apps — re-skin chrome only, do not touch app logic).

## The redesign language to apply (match `design-reference/` + the homepage)
- **Buttons:** primary = amber, pill-shaped (`rounded-full`), soft shadow (the homepage "Reserve my spot" button is the reference). Secondary = teal or white/outline pill.
- **Hero / page headers:** navy gradient or the existing `gradient-hero`; Fraunces display headline with an italic amber or gradient accent; concise subhead; clear dual CTA.
- **Cards:** `rounded-2xl`, 1px slate border, soft shadow; featured = 2px teal border. Use for pricing, features, testimonials, tools.
- **Payment calculator:** reuse the `pdacalc` pattern already in `index.html` (plan picker → weekly/monthly toggle → slider → live "$200 down, then $X" result). Add it to the enroll/pricing context and the city landing pages.
- **Section rhythm:** generous vertical padding, centered section headers with a teal eyebrow.

## Critical: how to handle Tailwind
The whole site + the shared nav depend on the Tailwind Play CDN. Do **not** delete it and swap in `design-reference/pda.css` blindly — that would unstyle every page. Two acceptable paths (pick one and be consistent):
1. **Stay on Tailwind (lower risk):** express the redesign with Tailwind utility classes in place. Keep the CDN. (Fastest, safest.)
2. **Proper Tailwind build (removes the prod-CDN warning):** add a real compiled Tailwind step and switch pages to the built CSS — only if you can verify every page still renders. Never leave a page half-migrated.
Default to (1) unless asked.

## Rollout order (push after each group; verify the preview)
1. **City landing pages (5)** — `become-a-dental-assistant-in-texas`, `dental-assistant-school-{henderson,kilgore,marshall,tyler}-tx`, `dental-assistant-training-gladewater-tx`. High local-SEO value; add the calculator + pill CTAs. Keep `location_page_cta_click` events.
2. **Core marketing** — `enroll` (re-skin only; keep Square), `salary` (keep the calculator logic), `apply`, `calendar`, `classes`, `about`, `contact`, `graduates`, `hiring-partners`/`employers`, `guide`, `tour`, `waitlist`, `study-guide`, `night-class` (lead form only — the $1,497 offer stays HELD/unwired), `blog.html` index, `404`, `thank-you`, `congrats`, `enroll-success`.
3. **Shared chrome** — optionally restyle the nav/footer/CTA bar markup inside `pda-nav.js` to the pill/redesign look, preserving ALL logic (auth, analytics, dropdowns, mobile menu, urgency, exit-intent).
4. **Blog posts (~40 in `blog/`)** — apply the post template/skin; don't rewrite content.
5. **Tools + Skills Lab (`tools/*`, `skills-lab/*`)** — re-skin headers/wrappers only; do NOT touch the interactive app logic.
6. **App pages** (`dashboard`, `login`, `portal`, `admin`) — light polish; preserve auth + `data-pda-keep`.

## Per-page method
Reskin the page's markup to the redesign language → keep its real content, links, forms, scripts, SEO meta, and `data-event`s → verify mobile nav, tap targets, alt text, console clean → `npm test` → commit → push.

## Hard guardrails
- Pricing ONLY: in-person **$1,997** (or **$200 down** + installments), online **$397** (sale; reg **$997**). Never introduce $1,497 / $1,500 / other. Flag stray pricing.
- **Payment-plan timing (Amanda's rule):** the in-house $200-down installment plan must be **paid in full by graduation — within 12 weeks** (weekly or monthly; cap the term at 12 weeks / 3 months). Only **Klarna / Afterpay** may extend payments beyond graduation. The homepage calculator is already capped at 12 weeks; mirror this anywhere payment terms are shown, and use `api/enroll.js` as the source of truth for exact per-payment amounts (don't invent them).
- Phone **(903) 913-6444** · email **hello@PremierDentalAcademyOfLongview.com** · address **2800 Gilmer Rd, Suite 106, Longview, TX 75604** · owner **Amanda Williams**.
- No invented stats/testimonials — reuse the real ones (85%+ placement, ~12 weeks, 70% no experience, $36–44k; Jasmine M., Dr. Williams, Aisha C.). Flag gaps `[VERIFY: Amanda]`.
- Keep Square checkout, trainers, login/dashboard, sitemap, robots, OG tags working. Wire any placeholder forms to the real Supabase `public.leads` / Square endpoints.
- (Note: a `skills-lab-nav-and-icons.patch` referenced in an earlier brief is NOT in the repo — skip it unless Ryan provides it.)

## Output
- Keep committing page-by-page to `claude/site-redesign` (updates the draft PR + preview).
- Maintain a per-page status table in the PR description (done / preserved / `[VERIFY: Amanda]`).
- Confirm `npm test` is green and the Vercel preview builds before asking Ryan to merge.

Start by re-skinning the 5 city landing pages, push, and confirm the preview, then continue down the list.
