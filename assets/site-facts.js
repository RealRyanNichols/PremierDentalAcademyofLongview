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
      inPerson: { name: "In-Person", location: "Longview campus", schedule: "Call (903) 913-6444 for current class times", format: "Live, hands-on training" },
      online:   { name: "Online",    location: "From home",      schedule: "Self-paced",      format: "Same curriculum, fully online" }
    },

    pricing: {
      // July 1, 2026 price change — must match api/enroll.js (the payment engine).
      // Pay in full: $3,000. Payment plan: $3,500 total = $500 down + $3,000 balance.
      inPerson: { total: 3000, totalDisplay: "$3,000", totalCents: 300000, downPayment: 500, downDisplay: "$500", pifDisplay: "$3,000", planTotal: 3500, planTotalDisplay: "$3,500", planTotalCents: 350000, balance: 3000, balanceDisplay: "$3,000" },
      online:   { price: 397, priceDisplay: "$397", priceCents: 39700, regularPrice: 997, regularDisplay: "$997", sale: true, saleLabel: "limited-time sale" }
    },

    paymentPlan: {
      text: "Pay in full for $3,000, or go on a plan ($3,500): $500 down holds your seat, then the $3,000 balance in simple weekly or monthly payments (up to 12). No big lump sum.",
      cadence: "weekly or monthly",
      splitPay: ["Klarna", "Afterpay", "Affirm"]
    },

    transferRefund: {
      online: "Online ($397) is non-refundable; 100% transfers as credit toward In-Person tuition within 90 days.",
      inPerson: "In-Person ($3,000, or $3,500 on a plan) is pro-rated per the Terms.",
      source: "terms.html"
    },

    // ── OWNER CONFIRMATION REQUIRED ──────────────────────────────────────────
    programLength: {
      weeks: 12,
      display: "about 12 weeks",
      needsOwnerConfirmation: true,
      note: "CONFLICT: the live site uniformly says ~12 weeks (kept here as the latest production value). The owner mentioned older source material says 14 weeks. The string '14 weeks' is NOT present anywhere in this repo. Online self-paced may run longer (one blog references 24 weeks). DO NOT change silently — confirm with Amanda/Ryan."
    },

    cohortSeats: {
      value: 8, display: "8 seats per class",
      verified: false,
      note: "Marketing claim in calendar.html. Real per-cohort seat counts come from the Supabase 'cohorts' table (capacity/enrolled_count). Confirm the '8 per class' cap before relying on it."
    },

    employer: {
      promise: "Hire a dental assistant who is trained on real office workflows.",
      requestPath: "/employers/request-graduate",
      noPlacementFee: { claim: null, verified: false, note: "No explicit 'no placement fee' claim was found in the repo. Do NOT assert it until Amanda confirms." }
    },

    placementStat: {
      display: "85%+", verified: false,
      note: "Hard-coded in index, enroll, practice-exam, night-class, teach, graduates. A data-driven value also exists (Supabase overview.placement_rate_pct). VERIFY the real number; prefer the live data value over the hard-coded one."
    },

    graduateCount: {
      display: null, foundValues: ["406+", "400+"], verified: false,
      note: "Inconsistent in repo: '406+' (enroll, practice-exam) vs '400+' (marketing email). Choose ONE verified value; until then do not display."
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
      ogImage: "https://www.premierdentalacademyoflongview.com/assets/og-cover.png",
      twitterCard: "summary_large_image"
    },

    _meta: {
      updated: "2026-07-02",
      maintainer: "docs/business-facts-source-of-truth.md",
      rule: "Do not hard-code these facts in pages. Read from window.PDA_FACTS."
    }
  };

  // Browser global (classic script). Node validator reads via indirect eval.
  if (typeof window !== "undefined") window.PDA_FACTS = FACTS;
  else if (typeof globalThis !== "undefined") globalThis.PDA_FACTS = FACTS;
})();
