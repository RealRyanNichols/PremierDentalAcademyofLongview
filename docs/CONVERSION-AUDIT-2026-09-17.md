# Conversion audit — Facebook traffic (Sep 17–19, 2026)

Amanda's brief: the Facebook feed posts 6–8× a day; a click that lands on a broken or
contradictory page is wasted. This is the inventory of every conversion-killer found on
`main`, the authoritative value for each, and where it now lives. Increment 1 shipped the
items marked ✅. Items marked ⏳ are staged for the next increment; items marked 🔒 need
Amanda's explicit approval because they change what the checkout charges or the database.

## Authoritative values (assets/site-facts.js → `window.PDA_FACTS`)

| Fact | Value | Key |
|---|---|---|
| In-person, paid in full | $3,000 | `pricing.inPerson.totalDisplay` / `totalCents` 300000 |
| In-person, payment plan | $3,500 = $500 down + $3,000 balance, up to 12 payments | `pricing.inPerson.planTotalDisplay`, `downDisplay`, `balanceDisplay` |
| Online | $997 regular (live checkout charges this). $397 promotional exists as a switch: `pricing.online.sale = true` | `pricing.online.priceDisplay` (derived) |
| Phone | (903) 913-6444 | `phone.display` |
| Address | 2800 Gilmer Rd, Suite 106, Longview, TX 75604 | `address.full` |
| Class dates / seats | Supabase `public.cohorts` only, never typed | `cohorts.source` + fallback copy |
| Class hours | Mon/Wed/Fri 8:30 AM–12:30 PM; Tue/Thu 9:00 AM–3:00 PM (the only approved strings) | `programs.inPerson.schedule` |

`scripts/check-pricing.mjs` fails the build if `api/enroll.js` or `enroll.html` carry
different integers, or if any root / `go/` / `tools/` page says "$500 down" without "$3,500".
`scripts/check-claims.mjs` fails the build if a retired claim, old contact detail, or a typed
countdown date reappears on a public page.

## 🔒 Online price: $397 promo vs $997 regular

Amanda's brief lists online as "$397 promotional / $997 regular". Production has charged
$997 since the Aug 22, 2026 flip: `products.online_program.price_cents = 99700`, and
`supabase/functions/buy-product` charges that row. Showing $397 while charging $997 would be
worse than either price, so the site stays at $997 until Amanda says go. To flip:

1. Approve the staged migration `db/pending/20260917_online_price_397_promo.sql`
   (sets `products.online_program.price_cents = 39700`, keeps `reg_price_cents = 99700`).
2. Set `pricing.online.sale: true` in `assets/site-facts.js` and update `api/enroll.js`
   `onlineCents` to 39700 (check:pricing enforces they match).
3. Deploy. Every page, the chatbot, JSON-LD and checkout change together.

## Inventory

| # | Finding (July 21 backlog + Sep 17 sweep) | Where it was | Authoritative fix | Status |
|---|---|---|---|---|
| 1 | Homepage countdown hard-coded "Sep 29"; blank when the query failed; whole block died if the Supabase CDN script failed | index.html top bar + inline script | Plain REST fetch (no SDK), America/Chicago "today", 8 s timeout; fallbacks "being scheduled — call…" / "call … for the next date"; countdown shows "see calendar" instead of blank | ✅ |
| 2 | /classes stuck on "loading…" when the SDK/CDN or query failed (only one of two lists had an error state); classes flagged `upcoming` whose date had passed were still offered | classes.html | Guarded client creation, try/catch around the query, one honest call-us card in both lists; upcoming requires `start_date >= today` | ✅ |
| 3 | /calendar showed "No upcoming In-Person classes" on a network failure; prices typed | calendar.html | Error card separate from the empty state; `PRICE` read from site-facts; `delivery_mode` NULL rows no longer dropped | ✅ |
| 4 | /night-class blank next date | vercel.json | Page no longer exists; 301 → /classes already on main. Redirect test ⏳ | ✅ (existing) |
| 5 | "$500 down" shown without the $3,500 plan total (reads as $500 + $3,000 = $3,000) | index (pricing card, FAQ ×3, JSON-LD FAQ ×2), classes, calendar, go/moms, go/career-change, go/fresh-start, go/dental-assistant, labor-day, exam-pro, tools/index, enroll proof tile | Every mention states $3,500; tripwire added | ✅ |
| 6 | "$200 locks your seat" / $1,997 / $2,120 | none live (already removed) | Kept as retired values; tripwire | ✅ |
| 7 | 1405 McCann / (903) 230-6444 | none live (Tom Cotton Dentistry's own 1405 McCann listing in `directory/` is that office's real address) | Tripwire on public pages | ✅ |
| 8 | "406+ graduates" (394 typed override + 12 records) and "85%+ placement" (typed override) | index.html stats tiles fed by `public_stats_overrides` | Tiles removed; "Graduates on our wall" shows the count of visible placement records only; overrides no longer read | ✅ |
| 9 | "70% of students start with no experience" | index (FAQ + JSON-LD), enroll FAQ, ask-premier.js, 2 blog posts | "Many of our students…" | ✅ |
| 10 | "The only RDA program…", "lowest tuition in East Texas" | index h2 + meta/og description; og/twitter description on apply, 404, enroll-success, unsubscribe, privacy, terms, logout, thank-you, dashboard | Neutral descriptions | ✅ |
| 11 | "Pays for itself in 6 weeks", "$36,000–$44,000", "pays back in 4–8 weeks", "$42k+" | index pricing header + final CTA; funnel payback heading; pda-engage tool copy | Pricing header states both numbers and points to /salary; payback heading → "See how tuition compares" | ✅ |
| 12 | "interviewing in week 10", "offers within 2 weeks", "partner offices specifically request PDA candidates" | index FAQ + JSON-LD, ask-premier.js | "We help every graduate prepare for the job search and introduce them to hiring East Texas offices." | ✅ |
| 13 | Online described as "live video" | ask-premier.js, dashboard.html program labels | Self-paced, start any day | ✅ |
| 14 | "regular price price" typo + $997 struck through next to $997 | index pricing card | Fixed; price spans carry `js-online-price` so the sale switch can drive them | ✅ |
| 15 | Enroll JSON-LD: "Texas TDLR compliance prep", credential "Texas RDA" | enroll.html | TSBDE; credential = PDA Certificate of Completion | ✅ |
| 16 | Typed "8 seats each / seats left out of 8" | classes, calendar, enroll proof tile, September blog post | Live `capacity − enrolled_count` per class; copy says "small classes" | ✅ |
| 17 | Testimonials Jasmine M. / Aisha C. / Dr. Williams (Family Dental of Longview) | none live (design-reference only) | Retired in site-facts; tripwire | ✅ |
| 18 | Lead forms show "success" even when the insert fails (apply, contact, tour, waitlist, study-guide, hiring-partners, request-graduate, sponsor, practice-exam ×2, ask-premier, pda-engage) | each page's inline script | Shared `assets/pda-lead.js` + `api/lead.js` fallback with honest error state; classes reserve form fixed in this increment | ⏳ (classes ✅) |
| 19 | New-lead email to hello@ depends on one DB trigger → pg_net → edge function chain with no retry surface | `notify_new_lead()`, `lead-notify` edge fn | Working today (verified). Reliability migration staged, not applied | ⏳ 🔒 |
| 20 | UTM is last-touch only; no clean `/go/<slug>` short links for Facebook posts; OG tags inconsistent | assets/pda-analytics.js, vercel.json | First + last touch, fbclid; `api/go.js` + `data/go-links.json`; OG audit | ⏳ |
| 21 | Cohort rows still `current` from June/July carry old evening schedule strings ("Mon/Wed/Fri 6:00 – 9:00pm") that /classes renders for "in session" classes | Supabase `cohorts.schedule` (data, not code) | Amanda/Ryan to neutralize those rows or mark them `past`; no code change can fix data | 🔒 decision |

## Rollback

Every increment is one squash-merge on `main`. Revert that merge commit and Vercel
redeploys the previous site. No database change ships in increment 1.
