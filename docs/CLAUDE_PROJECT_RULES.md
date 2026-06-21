# Claude Project Rules — Premier Dental Academy of Longview

Permanent working rules for any AI/dev work in this repo. Read before editing.

## Stack reality (so instructions get adapted correctly)
- This is a **static, no-build site**: plain HTML + **Tailwind via CDN** + vanilla JS in
  `assets/`. **No framework, no TypeScript, no bundler, no lint/typecheck/test runner.**
- Hosting is **Vercel** (`vercel.json`, `cleanUrls:true` → `/foo` serves `foo.html`).
  "Build" = Vercel serving static files. There is nothing to compile.
- When a task says "create `src/lib/*.ts`" or "run lint/typecheck/build", **translate it**
  to this stack: a shared `assets/*.js` ES module, a data file, and/or a small Node script
  under `scripts/` run with `node`. Confirm before introducing a framework/build step.
- Backend: Supabase (client uses the **publishable anon key only**; RLS enforced), Square
  via `api/enroll.js`, Kajabi/Resend/Quo via `supabase/functions/`. Secrets live in
  Vercel/Supabase env — **never commit secrets**.

## Content & honesty rules (non-negotiable)
- **Do not invent** testimonials, graduate names, partner offices, placement numbers, or
  salary stats. Use only values verified in the repo's source-of-truth, and link `/salary`
  for pay rather than quoting unverified figures.
- **Do not use real patient data or PHI.** All patient examples in trainers must be
  **fictional**.
- **Do not remove existing working features** without replacing them.
- **Do not create fake urgency or fake seat counts.** Seat counts come from real cohort
  data; show honest fallback text when there are no real dates.
- **Do not make Texas certification/legal claims** beyond the site's verified language.
  Point to TSBDE for official requirements; never guarantee licensure or jobs.
- Treat unverified stats (e.g., "85%+ placement", "406+ graduates") as
  **needs-verification** until confirmed by Amanda/Ryan; flag, don't amplify.

## Voice & copy rules
- Use **Amanda's voice**: practical, warm, direct, confidence-building — not corporate,
  not cheesy.
- Avoid generic AI copy (e.g., "superheroes behind the scenes").
- **Avoid em dashes in new marketing copy.**
- Use **short, clear sentences**.
- Preserve **local East Texas identity** (Longview, Tyler, Marshall, Kilgore, Henderson,
  Gladewater, and nearby towns).

## Design rules
- Avoid fake stock-photo-heavy design. **Prefer real student/campus photos** where
  available; use honest "content coming soon" placeholders rather than fake testimonials.
- No fake badges or unverified partner/accreditation logos.
- Brand: clean white, dental blue/teal, soft gray; confident healthcare feel, not childish.

## Product rules
- Every tool must be useful for at least one of: **prospective students, current students,
  graduates, or dental offices.**
- Trainers must carry a clear "fictional data only / not official exam questions / training
  practice, not certification" disclaimer where relevant.
- Save anonymous progress in `localStorage`; sync to the Supabase student system when
  logged in. Don't break existing local progress.

## The 12-vs-14 week rule
- The repo uniformly says **~12 weeks**; "14 weeks" does **not** appear in the codebase.
- **Do not silently change program length.** Keep the current production value (12) and
  mark it `needsOwnerConfirmation: true` in the source-of-truth with a developer note.

## Never-hardcode rule (going forward)
- New work must read business facts (name, phone, email, address, prices, program length,
  cities, stats) from the centralized source-of-truth module — not inline literals.
