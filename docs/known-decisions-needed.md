# Known decisions needed — owner confirmation before "final" launch

These are marketing/data claims currently live on the site that the project rules
(`docs/CLAUDE_PROJECT_RULES.md`, rule: *real-only, no fabricated stats*) flag as
**unverified**. The site still runs fine; this is a list for Amanda/Ryan to confirm or
correct. `npm run check:facts` also surfaces these. Once a value is confirmed, update
`assets/site-facts.js` (clear its `needsOwnerConfirmation` flag) so it becomes canonical.

| # | Claim | Where it appears | Why flagged | Recommended action |
|---|-------|------------------|-------------|--------------------|
| 1 | **Program length "12 weeks"** | `index.html`, `apply.html`, `enroll.html`, others (TODO comments added near the copy) | Older material said **14 weeks**; "14 weeks" not found in repo. Inconsistent source of truth. | Confirm the real length. Set `site-facts.js → programLength`. One number everywhere. |
| 2 | **Placement rate "85%+"** | `index.html`, `enroll.html`, `teach.html`, `night-class.html`, `graduates.html`, `tools/practice-exam.html` | Specific percentage with no documented methodology/source. Regulatory risk for a career school. | Provide a real, dated figure + how it's measured, **or** soften to non-numeric ("most graduates work in East Texas offices"). |
| 3 | **Salary "$42k+" / "$36,000–$44,000"** | `index.html`, `salary.html`, `blog.html` | Specific earnings claims. `salary.html`/`enroll.html` already carry a disclaimer; homepage now does too (this batch). Still needs a **cited source** (e.g., BLS/TWC East-Texas RDA wage). | Add the source citation on `salary.html`; confirm the range is current. |
| 4 | **Graduate count "406+" vs "400+"** | `employers/index.html`, `employers/request-graduate.html`, `blog.html`, `graduates.html` | Two different numbers used. | Pick one verified, current number; use it everywhere (ideally drive from data). |
| 5 | **"No placement fee"** | `employers/index.html`, `employers/request-graduate.html` | Asserted as policy; not independently verified in repo. Likely true (Amanda's model). | Confirm it is the standing policy. If yes, no change. |
| 6 | **"Only 8 seats per class"** | `calendar.html` scarcity copy | Capacity claim used for urgency. Should match real cohort `capacity`. | Confirm 8 is the real per-cohort capacity (matches `cohorts.capacity`). |
| 7 | **Named funding (TWC / GI Bill® / WIOA)** | (confirm — referenced in some marketing) | Naming specific funding programs implies approval/eligibility. | Confirm approval status for each named program before asserting eligibility. |
| 8 | **Official social links** | footer / social icons | Handles not verified in repo. | Provide the official Facebook/Instagram/etc. URLs. |

## How this is enforced
- `npm run check:facts` fails if a required fact is blank and **warns** on each item above
  (the `needsOwnerConfirmation` flags in `assets/site-facts.js`).
- When a value is confirmed: edit `assets/site-facts.js`, set the real value, and remove its
  `needsOwnerConfirmation` flag. The warning clears automatically.

## Not blocking launch
None of these break the site. They are accuracy/compliance confirmations. The protective
disclaimers (earnings vary / not guaranteed) are in place on the salary-bearing pages.
