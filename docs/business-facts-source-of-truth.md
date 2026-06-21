# Business facts — single source of truth

## Where business facts now live
- **`assets/site-facts.js`** is the one place that defines every business fact (name,
  founder, address, phone, email, cities, pricing, payment/refund terms, program length,
  tools, Texas RDA language, SEO defaults, etc.). In the browser it exposes
  **`window.PDA_FACTS`**.
- **`scripts/check-facts.mjs`** validates it and is wired to **`npm test`** (and
  `npm run check:facts`). It exits non-zero — i.e. **fails loudly** — if any required
  fact is blank, and prints **warnings** for facts that still need owner confirmation.

Because this is a static, no-build site (HTML + Tailwind CDN + vanilla JS — see
`docs/CLAUDE_PROJECT_RULES.md`), there is no bundler to `import` a config at build time.
Pages consume the facts at runtime:

```html
<!-- in <head>, before page scripts -->
<script src="/assets/site-facts.js"></script>
<script>
  const F = window.PDA_FACTS || {};
  el.textContent = F.pricing.inPerson.totalDisplay; // "$1,997"
</script>
```

`classes.html` is wired this way already (its pricing map reads `window.PDA_FACTS`, with
the old literals kept only as a fallback). Other pages will be migrated as they are
touched by later upgrade prompts (homepage, nav/footer, enroll, etc.).

## Which facts still need Amanda/Ryan confirmation
The validator flags these every run (they are **not** invented; they reflect what's in the
repo and must be confirmed before we lean on them):

| Fact | Status | Action |
|---|---|---|
| **Program length** | `12 weeks`, `needsOwnerConfirmation: true` | Confirm 12 vs 14 (see below). |
| **Placement stat** | `85%+`, `verified: false` | Confirm the real, current number; prefer the live Supabase `overview.placement_rate_pct`. |
| **Graduate count** | inconsistent: `406+` vs `400+`, `verified: false` | Pick ONE verified number. |
| **Salary** | `$42,000` / `$38k–$46k` (also `$36k–$44k` on homepage), `verified: false` | Provide a cited source + reconcile the range. |
| **Cohort seats** | `8 per class`, `verified: false` | Confirm the per-class cap. |
| **Employer no-fee** | not present, `verified: false` | Only assert "no placement fee" if true. |
| **Named funding** (TWC/GI Bill/WIOA) | appears on the Henderson city page | Confirm PDA is actually approved for these. |
| **Social links** | none found in repo | Add real profile URLs when available. |

## How to update pricing / cohort dates later
- **Pricing, phone, email, address, program length, etc.:** edit the values in
  `assets/site-facts.js`, then run `npm test` to confirm nothing required went blank.
  Pages that read `window.PDA_FACTS` update automatically; pages not yet migrated still
  have local copies (we're migrating them incrementally).
- **Cohort dates and seat counts are NOT in this file.** They live in the Supabase
  `cohorts` table and are rendered live by `calendar.html` / `classes.html` /
  `night-class.html`. Update them in Supabase (or the admin tools), not in code. A safe
  cohort data model + docs come in the calendar upgrade prompt.

## Where the 12-week vs 14-week conflict was found
- The repo says **~12 weeks everywhere**. There is **no "14 weeks" string anywhere** in
  the codebase — the 14-week figure is off-repo legacy/source material per the owner.
- 12-week references appear in (non-exhaustive): `index.html`, `night-class.html`,
  `apply.html`, `graduates.html`, `teach.html`, `salary.html`, `classes.html`,
  `become-a-dental-assistant-in-texas.html`, `tools/practice-exam.html`, several
  `blog/*` posts, and `enroll.html` schema (`courseWorkload: PT12W`). One blog
  (`texas-rda-registration-guide.html`) notes a "12-week (or 24-week)" online option.
- We **did not change** the displayed value. It stays 12 (latest production source) and is
  marked `needsOwnerConfirmation: true` with a developer note in `site-facts.js`. An
  invisible `<!-- TODO(owner-confirm) ... -->` HTML comment was added near the program-length
  mention on the main marketing pages.

## How to avoid hard-coding facts in future work
1. Never paste a price, phone, address, program length, or stat as a literal in a page.
   Read it from `window.PDA_FACTS` (include `/assets/site-facts.js` first).
2. If a fact isn't in `site-facts.js`, add it there (sourced, not invented) — don't inline it.
3. Run `npm test` before committing; it fails if a required fact is blank and warns on
   anything still pending owner confirmation.
4. Anything unverified must carry `verified: false` + a `note`. Don't promote it to a
   displayed claim until Amanda confirms.
