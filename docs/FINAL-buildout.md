# Claude Code — FINISH THE PDA SITE TO COMPLETION (Figma + all coding tools)

Paste into Claude Code in the `PremierDentalAcademyOfLongview` repo. Continue on branch **`claude/site-redesign`** (draft **PR #137**, auto-builds a Vercel preview). Never push to `main`. Commit as **Ryan Nichols <hello@premierdentalacademyoflongview.com>** — do NOT tag as machine-generated. Run `npm test` before each push. Goal: take the WHOLE site to completion — **do not miss any page.**

## State / facts
- Repo `RealRyanNichols/PremierDentalAcademyofLongview` (public). Production = `main` (Vercel auto-deploys; per-branch previews). Root-level static HTML + **Tailwind Play CDN**; shared chrome in `assets/pda-nav.js` (nav/footer/CTA bar/urgency/exit-intent + Supabase auth) + `assets/site-facts.js` + `assets/pda-redesign.css` (pill CTAs + card hover, injected by pda-nav). Payments = Square `api/enroll.js`. Auth/leads = Supabase (lead inserts → `supabase/functions/lead-notify` emails Amanda + autoresponds). Skills-Lab tools = `skills-lab/*` + `assets/skills-lab/*` (data in `assets/skills-lab/data.js` and `assets/skills-lab/data/virtual-office.js`). ~43 posts in `blog/`. 5 city landing pages at root.

## Design source — Figma Make "PDA Website" (USE THE FIGMA MCP)
File key **`GYLeJSFvpEZSe2FYOACFu4`**. `get_design_context(fileKey="GYLeJSFvpEZSe2FYOACFu4", nodeId="0:1")` → read `src/app/App.tsx`, `src/styles/theme.css` (colors/tokens), `fonts.css`, `components/ui/button.tsx`/`card.tsx`. Translate the look into the existing Tailwind site; do NOT replace the static site or its Square/Supabase/SEO.

## ALREADY DONE on this branch — verify, don't redo
- Homepage payment calculator (12-week cap; Klarna/Afterpay extend) + same calculator on all 6 city pages.
- Site-wide pill CTA buttons + card hover (`assets/pda-redesign.css`).
- Hero "Virtual Dental Office" button; premium hero/animation passes on marketing pages.
- Contact copy → "as quickly as possible" (+ lead autoresponder).
- Tray Builder updates (instruments, Extraction rename, wedge + bite block, visible All-trays button, shuffled shelf).
- Procedures: 13 scenarios (added 7).
- Virtual Operatory station CONTENT (sterilization room/dirty-clean, HVE + saliva ejector, tooth chart).
- 8 NEW student tools at `/tools/`: funding-finder, take-home-pay, schedule-planner, interview-prep, career-paths, resource-hub, study-plan, is-it-for-me — all wired into nav/footer/sitemap + a homepage "Free tools for your life" section.
- New blog post: `blog/rda-first-30-days.html` (in blog index + sitemap).
- Specs in repo: `docs/REDESIGN-ROLLOUT.md`, `docs/Amanda-skills-lab-tool-updates.md`.

## BUILD TO COMPLETION — remaining (do not miss any page)
1. **Figma reskin across EVERY page.** Marketing pages, the 5 city pages, ALL `skills-lab/*` and `tools/*` (re-skin chrome/wrappers only — keep app logic), ALL ~43 `blog/` posts (apply the post template skin), and app pages (`dashboard`, `login`, `portal`, `admin`, `enroll-success`, `thank-you`, `congrats`, `404`, `tour`, `waitlist`, `night-class`, `study-guide`, `feed`, `unsubscribe`). Pull the look from the Figma Make. Seamless click-through everywhere.
2. **Sales pages — build out fully.** `enroll.html` and the program/pricing sales sections: strong conversion structure — hero promise, proof (real stats + testimonials), the payment calculator, financing/funding (Workforce/WIOA/GI Bill/Klarna/Afterpay), the "online transfers to in-person, never lost" guarantee, FAQ, and repeated clear CTAs. Keep the live Square `/api/enroll` flow intact.
3. **Calendar / classes — expand.** Pull real cohorts from the Supabase `cohorts` table; show per-cohort detail (date, format, seats left, urgency), an add-to-calendar action, and clear "reserve a seat" CTAs. No fabricated dates — use real data or `[VERIFY: Amanda]`.
4. **Welcome email + automations.** Build the enrollment welcome email that includes the student's **chosen start date** + the **school supply list** (`[VERIFY: Amanda — supply list]` until provided). Implement as a Supabase edge function (mirror `lead-notify` + Resend) triggered on enrollment, or via Kajabi. Then add automations for site + tools: lead nurture sequence, abandoned-application follow-up, and tool-completion follow-ups (the new tools fire analytics events like `funding_finder_run`, `fit_quiz_complete`, etc. — use them).
5. **Virtual Operatory 3D** (`skills-lab/virtual-office.html`, Three.js): separate sterilization room (ultrasonic "dirty" / autoclave "clean"), tooth chart on the operatory computer, modeled HVE + saliva ejector, a dental-assistant figure on the patient's left with a duties hotspot, remove/repurpose the colorful blocks, show instruments on the setup tray. (Station text already done.)
6. **Tools polish + next batch.** Ensure the 8 new tools match the Figma look; optional next tools: "new RDA first-30-days" companion checklist, family-conversation script, savings/emergency-fund starter.

## Guardrails
- Pricing ONLY: in-person **$1,997** ($200 down + installments **paid in full by graduation, ≤12 weeks**; only Klarna/Afterpay extend), online **$397** (sale; reg $997). Never $1,497/$1,500.
- Phone **(903) 913-6444** · email **hello@PremierDentalAcademyOfLongview.com** · 2800 Gilmer Rd, Suite 106, Longview, TX 75604 · owner **Amanda Williams**.
- Keep Square, Supabase auth, trainers, SEO/OG, `pda-nav.js` logic working. No invented stats/testimonials/dates — reuse real ones; flag gaps `[VERIFY: Amanda]`. Clinical content must stay accurate. Keep `assets/skills-lab/data/virtual-office.js` valid JS.

## Output
Commit page-by-page to `claude/site-redesign`; keep PR #137's description updated with a per-page status table; `npm test` green + Vercel preview builds before asking Ryan to merge.
