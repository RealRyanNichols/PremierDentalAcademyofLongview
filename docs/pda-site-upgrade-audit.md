# Premier Dental Academy of Longview — Pre-Upgrade Site Audit

_Audit date: 2026-06-21 · Branch: `claude/nifty-babbage-qzf2ay`_

This is a read-first audit before any redesign. It documents the framework, routes,
data sources, business facts, risks, and a recommended sequence. **Nothing destructive
was changed to produce this document.**

---

## Executive summary

Premier Dental Academy of Longview is a **static, no-build website**, not a framework
app. It is plain HTML (130 `.html` files) styled with **Tailwind via CDN** and enhanced
with **vanilla JS modules** in `assets/`. Hosting is **Vercel** (`vercel.json` with
`cleanUrls:true`), with three **Supabase edge functions** and one **Vercel serverless
function** (`api/enroll.js`, Square payments). Data lives in **Supabase** (client uses
the public publishable/anon key; RLS enforced).

**Biggest takeaways:**
1. **No framework / no build step.** `package.json` has no dependencies and no scripts.
   There is no TypeScript, no ESLint, no test runner, no bundler. The queued upgrade
   prompts that say "create `src/lib/siteConfig.ts`" or "run lint, typecheck, build"
   must be **re-interpreted for a static site** (a shared `assets/*.js` module, a small
   Node validation script, and "build = Vercel serves the files"). See _Recommended
   implementation sequence_.
2. **Business facts are hard-coded and duplicated across ~100 files** (prices, phone,
   address, program length, placement %, graduate count, salary). This is the highest
   maintenance/consistency risk and should be centralized first.
3. **Program length is consistently "~12 weeks" everywhere in the repo.** The "14 weeks"
   figure the owner mentioned is **not present anywhere in the codebase** — it appears to
   be off-repo legacy material. Source-of-truth status: live site = 12 weeks; treat the
   12-vs-14 question as **owner-confirmation needed**, do NOT silently change it.
4. **Several unverified marketing stats are hard-coded and slightly inconsistent**
   ("85%+ job placement"; "406+ graduates" vs "400+ graduates"; salary "$42,000" vs
   "$36,000–$44,000" vs "$38,000–$46,000"). These are the main compliance/trust risks.
5. **The codebase is otherwise healthy:** 0 npm vulnerabilities, all key JS files pass
   `node --check`, no secrets committed, no `lorem`/`TODO` placeholders, and **no legacy
   Wix-style nav** ("New Page / Forum / Groups / Book Online") exists in this repo.

**Does it "build"?** There is no build to run — it's static. Equivalent checks pass:
`npm install` (0 deps), `npm audit` (0 vulns), `node --check` on all core JS (pass).

---

## Current route map

**Stack:** static HTML + Tailwind CDN + vanilla JS. Package manager: npm (no deps).
Host: Vercel (`cleanUrls` → `/foo` serves `foo.html`). Analytics: Vercel Web Analytics
+ Speed Insights on all pages.

### Public marketing pages (root, 33)
`index`, `about`, `apply`, `classes`, `calendar`, `contact`, `enroll`, `enroll-success`,
`congrats`, `thank-you`, `night-class`, `salary`, `graduates`, `hiring-partners`,
`teach`, `guide`, `feed`, `blog`, `become-a-dental-assistant-in-texas`, `privacy`,
`terms`, `unsubscribe`, `404`, and **5 city landing pages**
(`dental-assistant-school-{henderson,kilgore,marshall,tyler}-tx`,
`dental-assistant-training-gladewater-tx`).

### Auth / member surfaces (root)
`login`, `logout`, `dashboard`, `portal` (gated by `assets/pda-portal-guard.js` →
`my_portal_access` RPC).

### Student tools (`tools/`, 7)
`practice-pro` (front-desk/PMS trainer, ~4k lines), `chairside`, `practice-exam`,
`flashcards`, `how-to-chart`, `resume-builder`, `share-your-win`.

### Skills Lab (`skills-lab/`, 8)
`index`, `quizzes`, `instruments`, `tray-builder`, `procedures`, `virtual-office`,
`day-shift`, `abbreviations`. Engine in `assets/skills-lab/` (`data.js`, `store.js`,
`quiz-engine.js`, `scenario-player.js`, `tray-builder.js`, `ui.js`, `access.js`,
`virtual-office/`).

### Employers (`employers/`, 2)
`index`, `request-graduate`.

### Admin (`admin/`, 7, all `noindex`)
`leads`, `students`, `progress`, `instructors`, `chat`, `feedback`, `brain`.

### Blog (`blog/`, 43 posts) + `blog.html` index.

### Marketing email assets (`marketing/`)
`email-enroll-invite.html`, `email-upcoming-classes.html`, and `marketing/series/`
(28 daily broadcast files + `README.md`). **Not web pages — Kajabi paste fragments.**

### Server / data
- `api/enroll.js` — Vercel serverless, Square down-payment + installment invoice.
- `supabase/functions/`: `kajabi-webhook` (purchase → portal access),
  `quo-inbound-webhook` (calls/texts → leads), `buy-exam-pro` (Exam Pro purchase).
- `db/migrations/` — 10 SQL migrations (simulator tables, exam pro, feedback, social
  proof, admin JWT claim, student progress, leads RLS, brain events, portal/Kajabi).
- Shared JS: `assets/pda-nav.js`, `pda-seo.js`, `pda-shared.js`, `pda-portal-guard.js`,
  `pda-engage.js`, `pda-feedback.js`, `pda-social-proof.js`, `pda-videos.js`,
  `ask-premier.js`, `pda-seed-patients.js`, `seat-mask.js`, `auth.js`.

---

## Current data / source-of-truth map

> **There is no central config today.** These facts are hard-coded in many files. This
> is the #1 thing to fix (see the next queued prompt). Locations are examples, not
> exhaustive.

| Fact | Current value(s) | Where (examples) | Risk |
|---|---|---|---|
| Academy name | Premier Dental Academy of Longview | everywhere | low |
| Founder | **Amanda Williams, RDA** | `about.html`, `skills-lab/index.html:452` | low |
| Phone | **(903) 913-6444** (`tel:+19039136444`) | ~80 pages | low (consistent) |
| Email | hello@premierdentalacademyoflongview.com | footers | **case differs** in `contact.html` (`hello@PremierDentalAcademyOfLongview.com`) |
| Address | 2800 Gilmer Rd, Suite 106, Longview, TX 75604 | footers, city pages | low (consistent) |
| Cities served | Longview, Tyler, Marshall, Kilgore, Henderson, Gladewater (+Overton, Tatum, etc.) | city pages, `teach.html` | low |
| In-person tuition | **$1,997**, **$200 down**, weekly/monthly plan | `classes`, `apply`, `enroll`, `night-class`, city pages, emails | **duplicated everywhere** |
| Online tuition | **$397** ("limited-time sale"; "regular $997" in `kajabi-webhook`) | same | **duplicated**; sale vs regular not centralized |
| Payment math | $200 + $1,920 = $2,120 (weekly 12×$160 / monthly 3×$640) | `api/enroll.js:126` | medium (logic + copy can drift) |
| Refund/transfer | Online $397 non-refundable (90-day transfer credit); In-person pro-rated | `terms.html:70-74` | medium |
| **Program length** | **~12 weeks** (uniform). `PT12W` schema. "11½–12" in emails; one "12-week (or 24-week)" for online self-paced | `index`, `night-class`, `apply`, `graduates`, `teach`, blog, `enroll.html:71` | **SOURCE-OF-TRUTH: owner says old material = 14 wks; repo = 12 wks. CONFIRM, do not auto-change.** No "14 week" string exists in repo. |
| Cohort seats | "8 seats per class"; live seat counts from Supabase `cohorts.capacity/enrolled_count` | `classes.html`, `night-class.html` | low (data-driven) but "8 seats" claim should be centralized |
| Placement stat | **"85%+ job placement"** (hard-coded) AND data-driven `overview.placement_rate_pct` | `index:339`, `enroll:137`, `practice-exam:85`, `night-class:120`, `teach:147`, `graduates:78` | **HIGH — unverified, hard-coded in 6+ places** |
| Graduate count | **"406+ graduates"** vs **"400+ graduates"** | `enroll:136`, `practice-exam:85` vs `marketing email:34` | **HIGH — inconsistent + unverified** |
| Salary | **$42,000** ($38k–$46k); also "$36,000–$44,000"; "$42k+" | `salary.html:147`, `index:651`, `index:783` | **HIGH — inconsistent figures, need source + disclaimer** |
| Texas RDA reqs | radiology, jurisprudence, infection control + TSBDE registration | `become-a-dental-assistant-in-texas.html`, blog | medium (kept fairly safe; needs disclaimer pass) |
| Tools | Practice Pro, ChairSide, Skills Lab, Practice Exam, Competency Passport, Graduate Transcript, Student Hub/portal | tool/skills-lab pages | low |
| Funding claim | "TWC, GI Bill, WIOA" | `dental-assistant-school-henderson-tx.html:36` | **VERIFY — named programs, owner-confirm** |

### Integrations / where submissions go
- **Supabase** (`lmbsuwslsycukynzpzik`), client uses publishable anon key (safe to ship).
  - `apply.html`, `contact.html`, `night-class.html`, `employers/request-graduate.html` → `leads` table.
  - `guide.html` → `subscribers`. `teach.html` → `instructor_applications`.
  - `graduates.html` reads `placements` + `overview`. `classes`/`night-class` read `cohorts`.
  - `dashboard.html` → profile update. Auth via `auth.js`; admin via `profiles.is_admin` or JWT claim.
- **Square** → `api/enroll.js` (`SQUARE_ACCESS_TOKEN` in Vercel env, not in repo).
- **Kajabi** → `kajabi-webhook` + `buy-exam-pro`; official **Kajabi MCP** (mcp.kajabi.com)
  exists but is **not** wired into this repo.
- **Resend** (transactional email) and **Quo/OpenPhone** (`quo-inbound-webhook`) via edge functions.
- No secrets are committed; client only holds the publishable anon key (expected).

---

## Broken or incomplete areas
- **No legacy Wix nav found** ("New Page/Forum/Groups/Book Online/Members" → 0 hits).
  The "mixed old/new pages" concern is not reproduced in this repo; nav is Tailwind-based
  across pages, though header/footer markup is **copy-pasted per page** (no shared
  include), so drift is possible. (The nav-unify prompt should consolidate to a shared JS
  header/footer rather than fix "Wix pages.")
- **Empty/dash states until data loads:** `graduates.html` shows `—` for placement rate
  until Supabase responds; seat banners hidden until `cohorts` loads. Acceptable but the
  calendar/stat fallbacks should be made trust-building (see queued calendar prompt).
- **Email case inconsistency** in `contact.html` (`hello@PremierDentalAcademyOfLongview.com`).
- **Graduate-count drift** ("406+" vs "400+").
- **Salary figure drift** across `index.html` and `salary.html`.
- Spam protection (honeypot/timestamp) appears **absent** on the public Supabase-insert
  forms — flag for the application-flow prompt.

## Conversion issues
- Unverified social proof ("85%+", "406+") is doing heavy lifting; if challenged it's a
  trust/legal risk. Replace with verified numbers (from `overview`) or honest language.
- Salary inconsistency undercuts credibility on the highest-intent ROI claim.
- Header/footer duplicated per page → inconsistent nav ordering risk over time.

## Student learning-tool issues
- Tools save progress in **localStorage only** for anonymous users (21 files use it);
  logged-in sync exists via Supabase but anon progress is device-bound (expected for a
  free trial; note it in UI).
- Skills Lab, instruments, tray-builder, quizzes, virtual-office, day-shift exist and have
  data engines (`assets/skills-lab/`) — the queued prompts to "populate 40 competencies",
  "instrument library", "tray builder", "x-ray", "charting", "scheduling" should **extend
  the existing `assets/skills-lab/data.js` / data/ structures**, not rebuild from scratch.
- `practice-pro.html` is a single ~4,000-line file — large but functional; edit carefully.
- "Pro" exam unlock: `buy-exam-pro` edge function exists, so Exam Pro **is** wired to
  payment — confirm before labeling it "coming soon".

## Employer funnel issues
- `employers/index.html` + `employers/request-graduate.html` → `leads`. Solid.
  Centralize the "no-fee to hire" / hiring-promise language (currently page-local).

## SEO / local search issues
- Strong baseline: per-page `<title>`, meta description, canonical, OG/Twitter, JSON-LD
  (FAQ/Course) on most pages; `sitemap.xml`, `robots.txt`, `og.svg` present; 43 blog posts
  + 5 city pages for local SEO.
- Watch: JSON-LD answers repeat hard-coded facts (e.g., "12 weeks", tuition, drive-times,
  "TWC/GI Bill/WIOA") — when facts centralize, keep schema in sync.

## Compliance / legal / risk issues
1. **Unverified placement %** ("85%+") hard-coded in 6+ spots — needs a verified source or
   softer language + a `verified` flag.
2. **Graduate count** inconsistent + unverified.
3. **Salary claims** inconsistent + need a cited source + disclaimer.
4. **Named funding programs** (TWC/GI Bill/WIOA) — confirm PDA is actually approved.
5. **Texas RDA / TSBDE** language — keep to verified, non-guarantee phrasing.
6. **Refund terms** ($397 non-refundable; in-person pro-rated) — ensure consistent with
   what Square actually does and with `terms.html`.
7. Trainers use fictional patient data — keep it that way (no PHI).

---

## Recommended implementation sequence
Adapted to this **static, no-build** repo (no TS/lint/test pipeline exists):

1. **Centralize business facts** → `assets/site-facts.js` (a plain ES module exporting a
   `PDA_FACTS` object), plus a tiny `scripts/check-facts.mjs` Node validator that fails if
   required facts are blank. Mark `programLengthWeeks` with `needsOwnerConfirmation:true`
   and a note about the 12-vs-14 conflict. Swap hard-coded values to read from it where
   practical (data-attributes + a small hydration helper for static pages).
2. **Unify header/footer** into a shared JS partial (extend `assets/pda-nav.js`) so every
   page renders identical nav/footer; add a `scripts/check-links.mjs` route/link checker.
3. **Homepage rebuild** around "first-day-ready", reading facts/config.
4. **Application/waitlist/tour flows** with a submission abstraction + honeypot/timestamp.
5. **Cohort calendar** safe data model + honest empty states.
6. **Practice Exam** question-bank model + lead capture + breakdown.
7. **Flashcards + study guide** funnel.
8. **Skills Lab** competencies/passport/transcript completion.
9. **Instrument Library + Tray Builder** data.
10. **X-ray lab, Charting sim, Scheduling sim, Virtual operatory** trainers.

> Before adopting framework-shaped instructions (TS files, `npm run build`), confirm we
> are NOT migrating to a framework. If we keep static HTML, translate each prompt to:
> shared JS module + data file + Node validation script + Vercel static deploy.

---

## Commands run and results
```
git branch            → claude/nifty-babbage-qzf2ay (working tree clean before docs)
npm install           → "up to date, audited 1 package", found 0 vulnerabilities
npm audit             → found 0 vulnerabilities
npm run               → (no scripts defined)
node --check          → PASS: api/enroll.js, auth.js, assets/pda-nav.js,
                        assets/pda-seo.js, assets/pda-portal-guard.js,
                        assets/skills-lab/data.js
grep "14 week"        → 0 matches (no 14-week reference anywhere in repo)
grep legacy Wix nav   → 0 matches (New Page/Forum/Groups/Book Online)
grep secrets in client→ 0 matches (no service_role / Square token / Resend key client-side)
robots.txt/sitemap.xml/og.svg → present
```
There is **no** lint, typecheck, test, or build step configured; "build" is N/A for a
static site (Vercel serves files directly). Adding a minimal Node-based validate/lint
script is recommended (step 1–2 above).

## Files most likely to change in later prompts
- **New:** `assets/site-facts.js`, `scripts/check-facts.mjs`, `scripts/check-links.mjs`,
  `docs/business-facts-source-of-truth.md`.
- **Facts/nav swaps:** `index.html`, `enroll.html`, `classes.html`, `calendar.html`,
  `apply.html`, `night-class.html`, `salary.html`, `graduates.html`, `teach.html`,
  `about.html`, `contact.html`, the 5 city pages, `employers/*`, all `blog/*` footers,
  `assets/pda-nav.js`, `assets/pda-seo.js`.
- **Tool/skills work:** `tools/*`, `skills-lab/*`, `assets/skills-lab/*`.
- **Flows:** `apply.html`, `contact.html`, `night-class.html`, `enroll.html`, new
  `waitlist`/`tour` pages, email template files.
