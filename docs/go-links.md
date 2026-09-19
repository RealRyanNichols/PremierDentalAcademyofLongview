# Short links for Facebook posts — `/go/<slug>`

Every Facebook (or Instagram) post should link to a `/go/` short link, not a raw page URL.
The short link adds the campaign tags for you, so the KPI page can show which post produced
which lead, and the URL is short enough to type into a caption without typos.

## Links that exist today

| Paste this in the post | Lands on | Shows up in KPI as |
|---|---|---|
| `premierdentalacademyoflongview.com/go/fb-home` | Homepage | fb_home |
| `…/go/fb-apply` | Free application | fb_apply |
| `…/go/fb-enroll` | Checkout | fb_enroll |
| `…/go/fb-plan` | Checkout, payment-plan view ($500 down on the $3,500 plan) | fb_plan |
| `…/go/fb-online` | Online program ($997 one time) | fb_online |
| `…/go/fb-classes` | Class dates | fb_classes |
| `…/go/fb-calendar` | Calendar | fb_calendar |
| `…/go/fb-tour` | Book a tour | fb_tour |
| `…/go/fb-exam` | Free practice exam | fb_exam |
| `…/go/fb-salary` | Salary calculator | fb_salary |
| `…/go/fb-tuition` | Tuition planner | fb_tuition |
| `…/go/fb-sponsor` | Sponsor-a-Student | fb_sponsor |
| `…/go/fb-employers` | Offices requesting a graduate | fb_employers |
| `…/go/fb-blog` | Blog | fb_blog |
| `…/go/fb-moms`, `fb-single-moms`, `fb-fresh-start`, `fb-career-change`, `fb-laid-off`, `fb-da` | Persona funnel pages | moms_lp, singlemoms_lp, … |

Instagram or another channel? Use the same link and add `?utm_source=instagram`. To tell two
posts apart, add `?utm_content=video-2` (anything short, lowercase).

A typo in a slug is not a dead link: it lands on the homepage tagged `unknown-<slug>`, so
it shows up in the KPI page as something to fix.

## How it works

- `data/go-links.mjs` is the table: slug → page + campaign name.
- `api/go.js` answers `/go/<slug>` with a 302 to the page plus `utm_source=facebook`,
  `utm_medium=social`, `utm_campaign=<row>`. Click ids (`fbclid`) pass through. It logs the
  hit to `page_visits` as `go|<slug>` and never redirects off the site.
- `vercel.json` has the `/go/:slug` rewrite. Real files under `go/` (the persona funnel
  pages) are served first, so a slug can never shadow one; `npm test` (check:go) enforces it.
- On the page, `assets/pda-analytics.js` stores the tags as **last touch** and, once per
  browser, the **first touch** (first landing page + referrer + tags). Every lead form sends
  both in `leads.utm` and `leads.landing_page`; `/admin/kpi` charts leads by campaign and by
  landing page; the new-lead email shows the campaign line.

## Adding a link

1. Add a row to `data/go-links.mjs` (slug, `to`, `utm_campaign`, a note).
2. Run `npm test`. check:go confirms the page exists, has Open Graph tags (the Facebook
   preview), and the slug does not collide with a funnel page.
3. Push. It is live on the next deploy.
