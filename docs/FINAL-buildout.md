# Claude Code — FINAL build-out prompt (Premier Dental Academy)

Paste into Claude Code in the `PremierDentalAcademyofLongview` repo. Continue on the existing branch **`claude/site-redesign`** (draft **PR #137**, auto-builds a Vercel preview). Never push to `main`. Commit as **Ryan Nichols <hello@premierdentalacademyoflongview.com>** — do NOT tag commits/PRs/code as machine-generated. Run `npm test` before each push.

## State / facts (don't rediscover)
- Repo `RealRyanNichols/PremierDentalAcademyofLongview` (public). Production = `main` (Vercel auto-deploys; per-branch previews). Root-level static HTML + **Tailwind Play CDN**; shared chrome in `assets/pda-nav.js` (nav/footer/CTA bar/urgency/exit-intent + Supabase auth) + `assets/site-facts.js`. Payments = Square `api/enroll.js`. Auth/leads = Supabase. Skills-Lab tools = `skills-lab/*.html` + `assets/skills-lab/*` (data in `assets/skills-lab/data.js` and `assets/skills-lab/data/virtual-office.js`).
- **Design source = Figma Make "PDA Website"**, file key `GYLeJSFvpEZSe2FYOACFu4`. Pull via Figma Dev Mode MCP: `get_design_context(fileKey="GYLeJSFvpEZSe2FYOACFu4", nodeId="0:1")` → read `src/app/App.tsx`, `src/styles/theme.css`, `button.tsx`/`card.tsx`. Translate the look into the existing Tailwind site; do NOT replace the static site or its Square/Supabase/SEO.
- Specs already in the repo: `docs/REDESIGN-ROLLOUT.md` (page-by-page reskin plan) and `docs/Amanda-skills-lab-tool-updates.md` (Amanda's tool spec).

## ALREADY DONE on this branch — do NOT redo (verify, then build on top)
- Homepage interactive payment calculator (capped at 12 weeks; Klarna/Afterpay extend) + 6 city landing pages have it too.
- Site-wide pill CTA buttons + card hover (`assets/pda-redesign.css`, injected by `pda-nav.js`).
- Hero "Virtual Dental Office" button.
- Contact: "within 1 business day" → "as quickly as possible" (page + lead autoresponder).
- Tray Builder (`assets/skills-lab/data/virtual-office.js` + `tray-builder.js`): basic exam = mirror/explorer/cotton-pliers; "Simple Extraction"→"Extraction" (+mirror/+anesthetic syringe); endo +explorer/+cotton-pliers/+anesthetic-syringe (−dri-aids/−cotton-rolls); cleaned "college"/"x2" labels; added **Wedge** + **Bite block**; "All trays" is a visible button; shelf is shuffled.
- Procedures: 13 scenarios (added intake, med-history flags, bitewing series, alginate impression, perio charting, four-handed transfer, syncope).
- Virtual Operatory station CONTENT enriched (sterilization separate-room + ultrasonic=dirty/autoclave=clean + state-board note; suction HVE + saliva ejector; computer tooth chart).
- Premium redesign passes on marketing pages (aurora hero, animated counters, view transitions).

## REMAINING TO BUILD
1. **Finish the reskin on EVERY remaining page + the tool/Skills-Lab page chrome.** The marketing pages are reskinned, but the interactive tools (`skills-lab/*`, `tools/*`) still wear the old light look — re-skin their headers/wrappers/buttons to match the Figma design (dark hero/nav, pill buttons, fonts) WITHOUT touching the app logic. Also sweep the ~40 blog posts + any pages missed. Goal: clicking from a marketing page into a tool feels seamless.
2. **Virtual Operatory 3D (`skills-lab/virtual-office.html`, Three.js scene).** The station text is done; build the geometry to match Amanda:
   - A **separate sterilization room** (not in the operatory). On the **dirty** side place an **ultrasonic** labeled "dirty"; on the **clean** side the **autoclave** labeled "clean."
   - Show the **tooth chart** on the operatory **computer** screen (so it's clear charting happens there).
   - Model/label an **HVE** and a **saliva ejector** in the suction area (label the sections; they currently break off).
   - Add a **dental assistant** figure (dentist at the head or the patient's right; **assistant on the left**) with a duties panel/hotspot.
   - The **colorful blocks** have no purpose — remove them or give them a clear meaning.
   - Show **instruments on the setup tray**.
3. **Welcome-email automation (enrollment).** When a student enrolls online and **picks a start date**, an automated welcome email should send that includes **their start date** and the **school supply list**. Investigate whether this exists (likely a Kajabi automation/offer email, or it was never wired). If it isn't actually sending, build it: a Supabase edge function (mirror `supabase/functions/lead-notify` + Resend) triggered on enrollment, or wire Kajabi. **The supply-list content must come from Amanda — do not invent it; insert `[VERIFY: Amanda — supply list]` until provided.**
4. **Optional polish:** category-grouped (not full) shelf shuffle + a second plain "Mirror" option in Tray Builder; an SMS-to-Amanda alert on new leads (in addition to email).

## Guardrails
- Pricing ONLY: in-person **$1,997** ($200 down + installments **paid in full by graduation, ≤12 weeks**; only Klarna/Afterpay extend), online **$397** (sale; reg $997). Never $1,497/$1,500.
- Phone **(903) 913-6444**; email **hello@PremierDentalAcademyOfLongview.com**; **2800 Gilmer Rd, Suite 106, Longview, TX 75604**; owner **Amanda Williams**.
- Keep Square checkout, Supabase auth, the trainers, SEO/OG, and `pda-nav.js` logic working. No invented stats/testimonials — reuse the real ones; flag gaps `[VERIFY: Amanda]`. This is clinical content — keep dental facts accurate.
- Keep `assets/skills-lab/data/virtual-office.js` valid JS (it powers every Skills-Lab tool) — `npm test` + load each tool before pushing.

## Output
Commit page-by-page to `claude/site-redesign`; keep PR #137's description updated with a per-page status table; confirm `npm test` green and the Vercel preview builds before asking Ryan to merge.
