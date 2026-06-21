# Analytics & lead attribution

## What it is
`assets/pda-analytics.js` is a safe, provider-agnostic event layer. It is loaded
site-wide automatically by `assets/pda-nav.js`, so any element with a `data-event`
attribute is tracked on click with no extra wiring.

- **No provider configured → safe no-op** (events go to `console.debug` only). It never
  throws and never blocks the page.
- **Providers:** Vercel Web Analytics (already on the site) is used automatically if
  present. GA4 / Meta Pixel / TikTok fire when their **public** IDs are set in
  `window.PDA_ANALYTICS_CONFIG` (copy `assets/analytics-config.example.js` →
  `assets/analytics-config.js`). Only public pixel IDs go client-side — never secrets.

## API
```js
window.PDA.track("apply_click", { plan: "in-person" });
window.PDA.identifyLead({ city: "Longview" });
const attr = window.PDA.attribution(); // { utm_source, utm_medium, ..., referrer, landing_path }
```

## How to track a CTA (no JS needed)
```html
<a href="/apply" data-event="apply_click">Apply free</a>
```

## Standard event names
`page_view` · `apply_click` · `application_submit` · `waitlist_submit` · `tour_submit` ·
`call_click` · `email_click` · `enroll_click` · `checkout_start` · `practice_exam_start` ·
`practice_exam_complete` · `practice_exam_lead_submit` · `study_guide_submit` ·
`salary_calculator_used` · `salary_email_submit` · `skill_lab_open` · `tool_start` ·
`tool_complete` · `employer_request_submit` · `graduate_transcript_print` ·
`blog_cta_click` · `location_page_cta_click` · `enroll_plan_selected` · `apply_instead_click`

## Lead attribution (UTM)
- On every page load, `utm_source/medium/campaign/content/term` from the URL are saved to
  `localStorage` (`pda.utm`) with the referrer.
- Lead forms should attach `window.PDA.attribution()` to their payload so Amanda sees the
  source/referrer of each lead. (Added to the form flows in the lead-flow prompt.)
- Privacy: we store only campaign/referrer/landing path — no sensitive personal data.

## Validation
`npm run check:analytics` (and `npm test`) loads the script in a stubbed environment and
asserts `window.PDA.track` exists and runs without throwing.
