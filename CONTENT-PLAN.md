# Premier Dental Academy — Blog & Content Plan

The blog is our top-of-funnel engine: it earns Google traffic from people researching a
dental-assisting career in East Texas and routes them to **/apply** and **/enroll**.

## How the blog is built (static, no CMS)
1. **One file per post:** `blog/<slug>.html`. Copy any existing post as the template
   (e.g. `blog/how-to-become-a-dental-assistant-in-texas.html`). Only change the
   `<title>`, meta description, canonical/OG/Twitter URLs (use the new slug), the header
   chip (category · date · read time), the `<h1>`, the lead paragraph, and the `.prose`
   body. Leave the `<script>`/nav/footer lines untouched.
2. **Add a card** to `blog.html` (the “Latest articles” grid) with the slug, category,
   title, one-line description, and date.
3. **Add the URL** to `sitemap.xml`.
4. Every post ends with the teal CTA block linking to **/apply** (free) — never publish a
   post without a call to action.

## Rules (non-negotiable)
- **Real and accurate only.** No fabricated statistics, salary numbers, student names, or
  testimonials. For pay, link to `/salary`. For exam specifics, link to the official TSBDE
  site. When unsure, speak generally.
- Honest, warm, plain-spoken East Texas / Longview voice. No hype.
- Internal links in every post: at least `/apply` or `/enroll`, plus 2–3 of
  `/salary`, `/skills-lab`, `/calendar`, and related blog posts.

## Published (10)
- how-much-do-dental-assistants-make-east-texas · texas-rda-registration-guide
- why-east-texas-offices-hire-pda-graduates · day-in-the-life-dental-assistant
- how-to-become-a-dental-assistant-in-texas · how-long-is-dental-assistant-school-texas
- dental-assistant-vs-dental-hygienist · online-vs-in-person-dental-assistant-training
- dental-assistant-first-day-what-to-expect · pass-texas-dental-jurisprudence-exam

## Backlog (publish on a rolling basis — pull from the top)
**Career / decision (high intent):**
- is-dental-assisting-a-good-career
- dental-assistant-job-outlook-texas
- can-you-become-a-dental-assistant-with-no-experience
- dental-assistant-career-path-how-to-advance
- what-does-a-dental-assistant-do

**How-to / exam prep:**
- how-to-get-dental-radiology-certification-texas
- cpr-bls-certification-for-dental-assistants
- how-to-write-a-dental-assistant-resume (link /tools/resume-builder)
- dental-assistant-interview-questions-and-answers
- dental-instruments-every-assistant-should-know (link /skills-lab/tray-builder)
- how-to-chart-teeth-for-beginners (link /tools/how-to-chart)

**Money / value:**
- how-much-does-dental-assistant-school-cost-in-texas
- dental-assistant-pay-by-city-east-texas (link /salary)
- is-dental-assistant-school-worth-it

**Local SEO (pair with the location pages):**
- dental-assistant-school-longview-tx
- best-dental-assistant-programs-east-texas
- dental-assistant-jobs-in-longview-tyler

**Day in the life / student stories (real only):**
- what-its-like-to-be-a-dental-assistant
- dental-assistant-externship-what-to-expect
- a-week-in-pda-skills-lab (link /skills-lab)

**Employer-facing (feeds /employers):**
- how-to-hire-a-dental-assistant-east-texas
- what-to-look-for-in-a-new-rda-hire

## Cadence
Publish new posts on an ongoing basis (target: several per week, working down the backlog
newest-intent-first). Each publish updates `blog.html` + `sitemap.xml`. The blog index is
marked `changefreq: daily` in the sitemap so Google re-crawls for fresh content.

> Note: true unattended daily auto-posting would require a scheduled job + a generation
> step. Today, posting is done per working session from this backlog. If we want it fully
> automated later, options are a GitHub Action on a cron that opens a draft post from a
> queue for review, or a lightweight CMS.
