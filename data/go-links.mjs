// Clean short links for Facebook (and any social) posts: /go/<slug> → a site page with
// campaign tags attached, so every click is attributed and every post uses one short,
// typo-proof URL. Served by api/go.js via the /go/:slug rewrite in vercel.json.
// The persona funnel PAGES under go/*.html (moms, single-moms, …) are real files and are
// served first; a slug here must never reuse one of those names (check:go enforces it).
//
// How to add a link: add a row, run `npm test`, push. Post the link as
//   https://www.premierdentalacademyoflongview.com/go/<slug>
// Instagram? Append ?utm_source=instagram to the same link — query utm_* values win.
// Fields:
//   to            site path the visitor lands on (must be a real page; relative only)
//   utm_campaign  how this link shows up in /admin/kpi "Leads by campaign" (a-z0-9_-)
//   utm_content   optional — e.g. which post/creative
//   note          for humans
export const GO_LINKS = {
  'fb-home':      { to: '/',                          utm_campaign: 'fb_home',      note: 'Brand / general posts' },
  'fb-apply':     { to: '/apply',                     utm_campaign: 'fb_apply',     note: 'Free application' },
  'fb-enroll':    { to: '/enroll',                    utm_campaign: 'fb_enroll',    note: 'Straight to checkout ($3,000 / $3,500 plan / online $997)' },
  'fb-plan':      { to: '/enroll?plan=in-person&paymode=plan', utm_campaign: 'fb_plan', note: '$500-down payment-plan posts' },
  'fb-online':    { to: '/online',                    utm_campaign: 'fb_online',    note: 'Self-paced online program' },
  'fb-classes':   { to: '/classes',                   utm_campaign: 'fb_classes',   note: 'Next class dates (live from cohorts)' },
  'fb-calendar':  { to: '/calendar',                  utm_campaign: 'fb_calendar',  note: 'Pick a start date' },
  'fb-tour':      { to: '/tour',                      utm_campaign: 'fb_tour',      note: 'Book a campus tour' },
  'fb-exam':      { to: '/tools/practice-exam',       utm_campaign: 'fb_exam',      note: 'Free Texas RDA practice exam (lead magnet)' },
  'fb-salary':    { to: '/salary',                    utm_campaign: 'fb_salary',    note: 'Salary calculator (estimate tool)' },
  'fb-tuition':   { to: '/tools/tuition-planner',     utm_campaign: 'fb_tuition',   note: 'Build your $500-down schedule' },
  'fb-sponsor':   { to: '/sponsor-a-student',         utm_campaign: 'fb_sponsor',   note: 'Sponsor-a-Student (businesses + students)' },
  'fb-employers': { to: '/employers/request-graduate', utm_campaign: 'fb_employers', note: 'Offices requesting a graduate' },
  'fb-blog':      { to: '/blog',                      utm_campaign: 'fb_blog',      note: 'Blog index' },
  'fb-moms':      { to: '/go/moms',                   utm_campaign: 'moms_lp',      note: 'Persona funnel (page carries the same campaign)' },
  'fb-single-moms': { to: '/go/single-moms',          utm_campaign: 'singlemoms_lp', note: 'Persona funnel' },
  'fb-fresh-start': { to: '/go/fresh-start',          utm_campaign: 'freshstart_lp', note: 'Persona funnel (HS grads)' },
  'fb-career-change': { to: '/go/career-change',      utm_campaign: 'careerchange_lp', note: 'Persona funnel' },
  'fb-laid-off':  { to: '/go/laid-off',               utm_campaign: 'laidoff_lp',   note: 'Persona funnel' },
  'fb-da':        { to: '/go/dental-assistant',       utm_campaign: 'da_lp',        note: 'General funnel page' },
};

export const DEFAULTS = { utm_source: 'facebook', utm_medium: 'social' };
