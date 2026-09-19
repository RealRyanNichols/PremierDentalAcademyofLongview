/*!
 * Premier Dental Academy of Longview — SINGLE SOURCE OF TRUTH for business facts.
 *
 * Browser: include as a classic script (`<script src="/assets/site-facts.js"></script>`)
 *          BEFORE page scripts; it exposes `window.PDA_FACTS`.
 * Node (dev): `scripts/check-facts.mjs` evaluates this file and validates it.
 *
 * RULES (see docs/CLAUDE_PROJECT_RULES.md + docs/business-facts-source-of-truth.md):
 *  - Do NOT hard-code these facts in pages anymore. Read from window.PDA_FACTS.
 *  - Do NOT invent values. Anything unverified carries verified:false + a note.
 *  - programLength is owner-confirmation-pending (12 vs 14 week conflict).
 *    DO NOT change it silently.
 *
 * Values below are sourced ONLY from what already exists in this repo (audit 2026-06-21).
 */
(function () {
  var FACTS = {
    academyName: "Premier Dental Academy of Longview",
    shortName: "Premier Dental Academy",
    abbrev: "PDA",

    founder: { name: "Amanda Williams", credential: "RDA", title: "Founder & Lead Instructor" },

    address: {
      street: "2800 Gilmer Rd, Suite 106",
      city: "Longview", state: "TX", zip: "75604",
      full: "2800 Gilmer Rd, Suite 106, Longview, TX 75604"
    },

    phone: { display: "(903) 913-6444", href: "tel:+19039136444" },
    email: "hello@premierdentalacademyoflongview.com",

    citiesServed: ["Longview", "Tyler", "Marshall", "Kilgore", "Henderson", "Gladewater"],
    citiesServedNote: "Campus is in Longview. Students commute from surrounding East Texas towns (also Overton, Tatum, Hallsville, Waskom, etc.). Do NOT claim campuses in other cities.",

    programs: {
      inPerson: { name: "In-Person", location: "Longview campus", schedule: "Daytime classes — Mon/Wed/Fri 8:30 AM–12:30 PM or Tue/Thu 9:00 AM–3:00 PM (varies by cohort)", format: "Live, hands-on training" },
      online:   { name: "Online",    location: "From home",      schedule: "Self-paced",      format: "Same curriculum, fully online" }
    },

    pricing: {
      // July 1, 2026 price change — must match api/enroll.js (the payment engine).
      // Pay in full: $3,000. Payment plan: $3,500 total = $500 down + $3,000 balance.
      // scripts/check-pricing.mjs fails the build if api/enroll.js or enroll.html drift
      // from these numbers, and if any public page shows "$500 down" without "$3,500".
      inPerson: {
        total: 3000, totalDisplay: "$3,000", totalCents: 300000,
        downPayment: 500, downDisplay: "$500", downCents: 50000,
        pifDisplay: "$3,000",
        planTotal: 3500, planTotalDisplay: "$3,500", planTotalCents: 350000,
        balance: 3000, balanceDisplay: "$3,000", balanceCents: 300000,
        maxInstallments: 12,
        // One sentence every page should use when it mentions both numbers, so the
        // "$3,000 vs $3,500" confusion can never come back through copy drift.
        summary: "$3,000 paid in full, or $3,500 on a payment plan ($500 down + $3,000 balance)"
      },
      // ONLINE PRICE — one switch. The number shown on every page, in the chatbot, in
      // JSON-LD and in api/enroll.js comes from here. It MUST equal
      // products.online_program.price_cents in Supabase, because supabase/functions/
      // buy-product charges that row. Owner brief (Sep 17, 2026) lists the online offer as
      // "$397 promotional / $997 regular"; the live checkout has charged $997 since the
      // Aug 22, 2026 flip. Flipping `sale` to true (and salePrice/saleCents to $397) is a
      // payment-configuration change: do it together with the staged migration
      // db/pending/20260917_online_price_397_promo.sql, only on Amanda's explicit go.
      online: {
        regularPrice: 997, regularDisplay: "$997", regularCents: 99700,
        sale: false,
        salePrice: 397, saleDisplay: "$397", saleCents: 39700,
        saleLabel: "promotional price", saleEndsAtISO: null,
        // Effective values (derived below from `sale`) — pages read these:
        price: 997, priceDisplay: "$997", priceCents: 99700,
        format: "self-paced, start any day, no live class schedule"
      }
    },

    // ── APPROVED CLAIMS REGISTER ─────────────────────────────────────────────
    // Every statistic or outcome claim the site could show. Only status:"approved"
    // renders; anything else is HIDDEN or replaced by the neutral copy below.
    // To approve a claim Amanda supplies: the number, how it was measured, the period,
    // and an approval date. scripts/check-claims.mjs fails the build if a retired or
    // unapproved figure appears hard-coded on a public page.
    claims: {
      placementRate:    { status: "needs_evidence", display: null, retiredValues: ["85%+", "85%"], neutral: "Our graduates go to work in dental offices across East Texas.", note: "Was fed from public_stats_overrides.placement_rate_pct (85). No methodology or period on file." },
      graduateCount:    { status: "needs_evidence", display: null, retiredValues: ["406+", "400+", "406"], neutral: "Graduates on our placement wall are real people at real East Texas offices.", note: "Was placements + public_stats_overrides.graduates_extra (394). Only the placement records themselves are verified." },
      noExperiencePct:  { status: "needs_evidence", display: null, retiredValues: ["70%"], neutral: "Many of our students start with no dental background. The curriculum and trainers are built for someone walking in cold.", note: "No survey on file." },
      partnerOffices:   { status: "records",        display: null, neutral: "We introduce graduates to hiring East Texas offices.", note: "Rendered live from the hiring_partners table (verified = true). Not a typed number." },
      salaryPayback:    { status: "retired",        display: null, retiredValues: ["pays for itself", "pays back in", "$36,000 – $44,000", "$42k+"], neutral: "Pay varies by office, experience and role. Run your own numbers on the salary calculator.", note: "Earnings and payback claims are never shown as promises. /salary is an estimate tool with its sources listed." },
      seatCap:          { status: "records",        display: null, neutral: "Small classes.", note: "Seats come from cohorts.capacity / enrolled_count per class, never a typed '8 seats' line." },
      superlatives:     { status: "retired",        retiredValues: ["the only RDA program", "only RDA program", "lowest tuition", "the best", "guaranteed job", "guaranteed placement"], note: "Never claim only / best / lowest / guaranteed outcomes." },
      interviewTiming:  { status: "retired",        retiredValues: ["interviewing in week 10", "offers within 2 weeks"], neutral: "We help every graduate prepare for the job search and introduce them to hiring offices.", note: "Unverified outcome timing." }
    },

    // ── APPROVED TESTIMONIALS ────────────────────────────────────────────────
    // Only items with status:"approved" (consent + approval date on file) may render.
    // The former "Jasmine M." / "Aisha C." / "Dr. Williams" quotes are retired until
    // Amanda supplies written consent and a date.
    testimonials: {
      status: "needs_approval",
      items: [],
      retiredNames: ["Jasmine M.", "Aisha C.", "Dr. Williams"]
    },

    // ── RETIRED FACTS (tripwire list) ────────────────────────────────────────
    // Values that must NEVER appear on a public page again. scripts/check-claims.mjs
    // and scripts/check-pricing.mjs scan for these.
    retired: {
      addresses: ["1405 McCann"],
      phones: ["230-6444", "903-230-6444", "(903) 230-6444"],
      prices: ["$1,997", "$1,995", "$3,495", "$2,120", "$200 down", "$200 locks", "locks your seat", "$499"],
      spellings: ["Premiere Dental"]
    },

    // ── COHORT DATES: where they come from + honest fallback copy ────────────
    // Dates and seats are NEVER typed into pages. They come from the Supabase `cohorts`
    // table via assets/pda-cohorts.js. When that call fails or returns nothing, pages
    // show these strings (no dates) instead of a blank or a spinner.
    cohorts: {
      source: "supabase:public.cohorts (status upcoming|current|open, delivery_mode in_person, start_date >= today America/Chicago)",
      fallback: {
        loading: "Checking the next class date…",
        none: "New class dates are being scheduled. Call or text (903) 913-6444 and we'll tell you the next start.",
        error: "We couldn't load class dates right now. Call or text (903) 913-6444 for the next start date, or check the calendar.",
        nextLabel: "Next in-person class"
      },
      timeZone: "America/Chicago"
    },

    // ── Labor Day 2026 seat-reservation offer (owner-approved Sep 6, 2026) ──
    // $100 reserves a seat in the Sept 14 or Sept 29 in-person class instead
    // of the usual $500 down. $100 + $3,000 balance = $3,100 on a plan, a real
    // $400 promotional discount off the $3,500 plan price. Installments are the
    // published $3,000-balance tables, unchanged. The $100 is a TUITION CREDIT
    // (never call it nonrefundable — Tex. Educ. Code §132.061 gives every buyer
    // a full refund right; see docs/labor-day-2026-offer.md).
    // Deposits are collected by the regular /enroll checkout: api/enroll.js
    // applies the $100 server-side when (1) the offer window is open, (2) the
    // submitted cohortId is one of eligibleCohortIds, and (3) the buyer is on
    // the payment-plan path. Anything else charges the normal $500. That keeps
    // the class assignment correct (the checkout writes the Square customer
    // note the webhook reads). Hosted Square links were abandoned Sep 6.
    // The offer turns itself off three ways: `active`, the America/Chicago
    // end time below (all consumers compare Date.now() to endsAtISO), and
    // scripts/check-facts.mjs, which fails the build if `active` is still true
    // after the deadline. KILL SWITCH: set active:false (or disable the links).
    laborDay2026: {
      active: false,   // offer ended Sep 7, 2026 11:59:59 PM CT — kill switch flipped Sep 9 (check:facts requires it)
      key: "laborday2026",
      depositCents: 10000,          // $100
      depositDisplay: "$100",
      balanceCents: 300000,         // $3,000
      balanceDisplay: "$3,000",
      planTotalCents: 310000,       // $3,100 — owner-approved promo price
      planTotalDisplay: "$3,100",
      regularDownDisplay: "$500",
      savingsDisplay: "$400",
      startsAtISO: "2026-09-06T00:00:00-05:00",
      endsAtISO:   "2026-09-07T23:59:59-05:00",   // = 2026-09-08T04:59:59Z (CDT is UTC-5)
      endsDisplay: "Monday, September 7 at midnight",
      eligibleCohortIds: [
        "a808608c-df03-40de-822e-f587c7e64395",    // September 14, 2026 — In-Person (MWF)
        "69d28988-f34c-49f4-a7bf-f99333f87585"     // September 29, 2026 — In-Person (T/Th)
      ],
      // Three counted days after a Sun Sep 6 / Mon Sep 7 (Labor Day) signature:
      // Tue Sep 8, Wed Sep 9, Thu Sep 10 → full refund through midnight Thu Sep 10.
      cancellationDeadline: "midnight on Thursday, September 10, 2026",
      landingPath: "/labor-day",
      // Deep link into the pre-filled checkout; append &cohort=<id> per class.
      checkoutPath: "/enroll?plan=in-person&paymode=plan"
    },

    paymentPlan: {
      text: "Pay in full for $3,000, or go on a plan ($3,500): $500 down holds your seat, then the $3,000 balance in simple weekly or monthly payments (up to 12). No big lump sum.",
      cadence: "weekly or monthly",
      splitPay: ["Klarna", "Afterpay", "Affirm"]
    },

    transferRefund: {
      online: "Online tuition is non-refundable; 100% transfers as credit toward In-Person tuition within 90 days.",
      inPerson: "In-Person ($3,000, or $3,500 on a plan) is pro-rated per the Terms.",
      source: "terms.html"
    },

    // ── OWNER CONFIRMATION REQUIRED ──────────────────────────────────────────
    programLength: {
      weeks: 12,
      display: "about 12 weeks",
      needsOwnerConfirmation: false,
      note: "CONFIRMED by Amanda 2026-07-30: the program is 12 weeks. (Online self-paced pacing varies by student.)"
    },

    cohortSeats: {
      value: 8, display: "8 seats per class",
      verified: true,
      showAsStaticClaim: false,
      note: "VERIFIED 2026-08-16 against the Supabase 'cohorts' table: every upcoming cohort has capacity = 8. Per Amanda's Sep 17, 2026 brief the cap is not typed into marketing copy; pages show 'X of N seats' from each cohort row instead."
    },

    employer: {
      promise: "Hire a dental assistant who is trained on real office workflows.",
      requestPath: "/employers/request-graduate",
      noPlacementFee: { claim: null, verified: false, note: "No explicit 'no placement fee' claim was found in the repo. Do NOT assert it until Amanda confirms." }
    },

    placementStat: {
      display: null, verified: false,
      note: "Retired from every page 2026-09-17 (see claims.placementRate). Do not display until Amanda supplies a dated, measured figure."
    },

    graduateCount: {
      display: null, foundValues: ["406+", "400+"], verified: false,
      note: "Retired from every page 2026-09-17 (see claims.graduateCount). Only the visible placement records render."
    },

    salary: {
      annualTypical: 42000, annualTypicalDisplay: "$42,000",
      rangeLow: 38000, rangeHigh: 46000, rangeDisplay: "$38,000–$46,000",
      altRangeFound: "$36,000–$44,000 (index.html)",
      verified: false,
      source: "Internal estimate (no cited source in repo).",
      disclaimer: "Salary varies by employer, experience, location, and interview. See /salary."
    },

    tools: [
      { name: "PDA Practice Pro",                path: "/tools/practice-pro",  what: "Front-desk / practice-management trainer" },
      { name: "PDA ChairSide",                   path: "/tools/chairside",     what: "Clinical notes / chairside trainer" },
      { name: "Skills Lab",                      path: "/skills-lab",          what: "Competencies, quizzes, simulators" },
      { name: "Free Texas RDA Practice Exam",    path: "/tools/practice-exam", what: "Practice questions (not official exam questions)" },
      { name: "Competency Passport",             path: "/skills-lab",          what: "Skill progress record" },
      { name: "Graduate Transcript",             path: "/skills-lab",          what: "Printable skills transcript" },
      { name: "Student Hub",                     path: "/portal",              what: "Enrolled-student portal" },
      { name: "Flashcards",                      path: "/tools/flashcards",    what: "Terminology study" },
      { name: "Resume Builder",                  path: "/tools/resume-builder",what: "RDA resume tool" },
      { name: "Salary Calculator",               path: "/salary",              what: "East Texas RDA pay estimate" },
      { name: "Tuition Planner",                 path: "/tools/tuition-planner", what: "Build your exact $500-down payment schedule (same math as checkout)" }
    ],

    // ── The offer: what tuition includes + optional paid add-ons ────────────
    // REAL ONLY. Every bullet below already appears on live pages (enroll
    // format cards); add-ons are live Square products with their own pages.
    offer: {
      included: [
        "Live instruction (Longview campus) or same curriculum fully online",
        "Full Practice Pro + ChairSide trainer access",
        "Infection control + radiology training",
        "PDA Certificate of Completion",
        "Job placement help with East Texas offices"
      ],
      addOns: [
        { name: "Dental Assistant Study Pack",  path: "/study-pack",        price: 19, priceDisplay: "$19", what: "Instrument cheat sheets, tray setups, tooth numbering, abbreviations + state-board quick-study guide" },
        { name: "RDA Exam-Prep Mini-Course",    path: "/exam-prep-course",  price: 97, priceDisplay: "$97", what: "Walk into the state board ready — lifetime access" }
      ]
    },

    texasRda: {
      requiredCourses: ["Radiology", "Jurisprudence", "Infection control"],
      registration: "Register as a Registered Dental Assistant (RDA) with the Texas State Board of Dental Examiners (TSBDE).",
      disclaimer: "Students are responsible for completing applicable Texas state requirements. PDA does not guarantee licensure or employment. See the TSBDE for official requirements."
    },

    studentAccess: {
      kajabi: "Video lessons, quizzes, and curriculum are delivered in Kajabi.",
      portal: "The website Student Hub adds hands-on trainers that can't live in Kajabi.",
      note: "Do not duplicate paid Kajabi videos in the repo."
    },

    social: { note: "No official social profile URLs found in the repo at audit time. Add here once confirmed.", facebook: "", instagram: "", tiktok: "", youtube: "" },

    seo: {
      siteUrl: "https://www.premierdentalacademyoflongview.com",
      brand: "Premier Dental Academy of Longview",
      defaultTitle: "Premier Dental Academy of Longview | East Texas RDA Training",
      defaultDescription: "East Texas RDA training with practice-management trainers built to teach. Train hands-on in Longview or fully online. Premier Dental Academy of Longview.",
      ogImage: "https://www.premierdentalacademyoflongview.com/assets/og-cover.jpg",
      twitterCard: "summary_large_image"
    },

    _meta: {
      updated: "2026-09-17",
      maintainer: "docs/business-facts-source-of-truth.md",
      rule: "Do not hard-code these facts in pages. Read from window.PDA_FACTS."
    }
  };

  // Derive the effective online price from the `sale` switch so no page ever has to
  // choose between two numbers. Everything downstream reads price / priceDisplay /
  // priceCents; regularDisplay is shown struck-through only while sale is true.
  (function deriveOnline() {
    var o = FACTS.pricing.online;
    var onSale = o.sale === true;
    o.price = onSale ? o.salePrice : o.regularPrice;
    o.priceCents = onSale ? o.saleCents : o.regularCents;
    o.priceDisplay = onSale ? o.saleDisplay : o.regularDisplay;
    o.label = onSale ? o.saleLabel : "regular price";
  })();

  // Is a claim allowed to render? Only an explicitly approved claim with a display value.
  FACTS.claimApproved = function (key) {
    var c = FACTS.claims && FACTS.claims[key];
    return !!(c && c.status === "approved" && c.display);
  };
  // Neutral copy to use when a claim is not approved (never a fake-looking placeholder).
  FACTS.claimText = function (key) {
    var c = FACTS.claims && FACTS.claims[key];
    if (!c) return "";
    return FACTS.claimApproved(key) ? c.display : (c.neutral || "");
  };

  // Is a dated offer live right now? Compares the absolute instant only, so the
  // visitor's clock/timezone cannot extend it: endsAtISO carries its own UTC
  // offset (America/Chicago) and Date.parse resolves it to one exact moment.
  // `now` is injectable for tests. Returns false for anything malformed.
  FACTS.offerIsLive = function (offer, now) {
    if (!offer || offer.active !== true) return false;
    var t = (typeof now === "number") ? now : Date.now();
    var start = Date.parse(offer.startsAtISO || "");
    var end = Date.parse(offer.endsAtISO || "");
    if (!isFinite(end)) return false;
    if (isFinite(start) && t < start) return false;
    return t <= end;
  };

  // Browser global (classic script). Node validator reads via indirect eval.
  if (typeof window !== "undefined") window.PDA_FACTS = FACTS;
  else if (typeof globalThis !== "undefined") globalThis.PDA_FACTS = FACTS;
})();
