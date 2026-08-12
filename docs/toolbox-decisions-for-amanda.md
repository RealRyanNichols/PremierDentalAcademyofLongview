# Toolbox build — decisions Amanda needs to make

Everything in this build is on the branch `claude/pda-toolbox-port-fix-build-tt19gb` and is
visible on the Vercel preview only. Nothing has been merged or promoted.

The items below could not be settled without someone who knows how PDA actually teaches and
how the local offices actually work. They are ordered by how much they matter.

---

## 1. Three cohorts in Supabase still publish evening class times — BLOCKING

`CLAUDE.md` says PDA no longer offers night or evening classes and that the cohort schedule
strings were neutralised on 6 July 2026. Three rows were missed, and all three are
`status = 'current'`, so they render live on `/classes` and `/calendar`:

| Cohort | `schedule` currently in Supabase |
|---|---|
| May 25, 2026 | `Mon/Wed/Fri 6:00 – 9:00pm + Sat 9:00am – 1:00pm` |
| June 2, 2026 | `Tue/Thu 5:30 – 9:00pm + Sat 9:00am – 1:00pm` |
| June 22, 2026 | `Mon/Wed/Fri 6:00 – 9:00pm + Sat 9:00am – 1:00pm` |

This build did **not** change them — editing live Supabase data was out of scope and needs your
say-so. The fix is to set all three to the approved neutral wording:

> Daytime classes — call or text (903) 913-6444 for current class days & times

The static snapshot this build added (`data/cohorts.json`) already carries only the neutral
wording, so nothing generated here publishes an evening time. But the live pages read Supabase
directly and will keep showing the old strings until the rows are updated.

## 2. The 90 exam questions need your review before that page goes public

`/tools/rda-practice-exam` is built and works, but it is **noindexed and will not start**.
The bank carries `reviewStatus: "DRAFT - requires review by Amanda Williams"`, and the page
reads that field and refuses to run while it says DRAFT.

To publish once you have read the questions:

1. Review `assets/exam/rda-question-banks.js` (90 questions, 3 banks of 30, 8 domains).
2. Change `reviewStatus` to anything not beginning with `DRAFT`.
3. Remove the `noindex,nofollow` meta tag from `tools/rda-practice-exam.html`.
4. Remove `draft: true` from the `rda-practice-exam` entry in `assets/data/toolbox.js`.
5. Run `npm run build:static && npm test`.

## 3. Four charting abbreviations need a local call

The abbreviation reference was expanded from 42 to 96 terms. A clinical review pass corrected
several outright errors, and flagged four where the right answer depends on what PDA teaches
and what the Longview-area offices actually write:

| Term | The question |
|---|---|
| **PNC** — Post and Core | Most charts write `P&C` or `PC`. Is `PNC` what local offices use, or should it read `P&C / PNC`? |
| **PVC** — Porcelain Veneer Crown | Appears in older textbooks, but modern charts usually mean PFM or all-ceramic, and most people read "PVC" as the plastic. Keep it if it is still in the curriculum; otherwise swap for a current material such as E.MAX or ZIR. |
| **PX** — Prophy | Correct in dental charting, but `Px` means *prognosis* in general medical shorthand. Worth a parenthetical? |
| **C / COMP** — Composite | In some charting keys a bare `C` means caries or crown rather than composite. The page-level "offices vary" caveat probably covers this, but you may want it spelled out. |

## 4. The "85%+" and "406+" statistics on existing pages

Not part of this build, and nothing was changed — but the new compliance check reports them as
an advisory every time it runs, so they will keep showing up:

- `about.html` — "85%+"
- `index.html` — "85%+"
- `enroll.html` — "85%+", "406+"
- `graduates.html` — "85%+", "406+"
- `teach.html` — "85%+", "406+"

Both numbers are already flagged `verified: false` in `assets/site-facts.js`. FTC 16 CFR
254.4(e) wants a dated substantiating source rendered on the same page as any outcome claim.
Two options: substantiate them with a dated source, or remove them. Your call — this is your
marketing copy, and rewriting the homepage was not something this build should do uninvited.

Related: `/tools/is-it-for-me` says dental assisting is "always in demand" with no source
attached. Same category of claim, same fix.

## 5. BLS figures on the careers page

`/tools/healthcare-careers` publishes median wages and growth projections for ten occupations.
The figures came from BLS via web search (bls.gov itself is blocked from this build
environment), and each card links to its BLS page so a reader can check.

They are recorded in `assets/data/healthcare-careers.js` with a `checked` date of 2026-08-12
that renders on the page. Worth spot-checking two or three against bls.gov before promoting,
and refreshing when BLS publishes the next annual release.

## 6. Old domain and third-party listings

Carried over from the growth notes in `CLAUDE.md`, still outstanding and not something this
build could do:

- `premierdentalacademy.net` still resolves — 301 it to the main domain once the registrar is found.
- The old 1405 McCann Rd address survives in third-party listings (BBB, Longview Chamber,
  Waze/HERE, Instagram bio).

---

## What this build deliberately did not touch

- No Supabase schema, RLS, policy or data changes.
- No payment code. No Square anything.
- No DNS, domains or environment variables.
- No emails sent.
- No existing tool deleted or rewritten beyond the rendering fix.
- Nothing merged to `main`, nothing promoted in Vercel.
