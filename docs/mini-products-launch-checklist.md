# Mini-products launch checklist (the 8 dormant `ms_*` products + 2 friends)

Live in the `products` table with `active=false`. **Do NOT flip `active=true`
until every box for that product is checked** — the /tools hub and checkout
show anything active, and an active product without delivery charges people
for nothing.

Entitlement flags + `profiles` columns are DONE for all 10 (migration
`20260707_mini_product_entitlements.sql`), so the deployed `buy-product`
function grants access correctly on purchase. What remains per product:

| Key | Name | Price | Needs PDF asset | Needs page |
|---|---|---|---|---|
| ms_toothnum | Tooth Numbering Cheat Sheet | $12 | ☐ `products/ms-toothnum.pdf` | ☐ |
| ms_abbrev | Abbreviations & Charting Shorthand | $12 | ☐ | ☐ |
| ms_infection | Infection Control Quick-Guide | $12 | ☐ | ☐ |
| ms_spanish | Spanish ↔ English Dental Terms | $12 | ☐ | ☐ |
| ms_instruments | Instruments Flashcard Deck | $15 | ☐ | ☐ |
| ms_resume | Resume + Cover-Letter Templates | $15 | ☐ | ☐ |
| ms_interview | Interview Q&A Scripts | $15 | ☐ | ☐ |
| ms_hours | Clinical Hours Tracker + Checklist | $19 | ☐ | ☐ |
| money_plan | Broke-to-RDA Money Plan | $19 | ✅ has storage_path | ☐ |
| survival_planner | School-Life Survival Planner | $15 | ✅ has storage_path | ☐ |

## Launch steps per product
1. Upload the finished PDF to the **private** storage bucket and set
   `products.storage_path = 'products/<file>.pdf'` (buy-product signs a 7-day
   download URL from it).
2. Build the product page (clone `study-pack.html`: hero, what's inside,
   Square card form calling `buy-product` with the product key, member-area
   view gated on the profile flag). Add sitemap + og image + `pda-track.js`.
3. Add the key to the `META` map in `tools/index.html` so it appears in the
   hub with live pricing + owned state, and to the dashboard "My prep tools"
   `CATALOG` (dashboard.html) so owners see it there.
4. Test: guest purchase end-to-end in test mode, confirm flag flips +
   email delivery, THEN set `active=true`.

Content for the PDFs is REAL-ONLY: build from the existing repo tools
(tooth chart, abbreviations list, instruments deck data, interview-prep and
resume-builder content already in `tools/`) — no invented claims.
