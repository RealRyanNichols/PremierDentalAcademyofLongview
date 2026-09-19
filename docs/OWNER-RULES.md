# Owner rules — Premier Dental Academy of Longview

Amanda Williams is owner, director, client and final business authority. Her newest direct
instruction always wins. `00_Premier_AI_Master_Reference.md` is the business source of truth
when present; this file is the standing summary every session must follow. CLAUDE.md links here.

## Facts that must never drift (live in `assets/site-facts.js`)
- Brand: **Premier Dental Academy of Longview** (never "Premiere").
- Contact: 2800 Gilmer Rd, Suite 106, Longview, TX 75604 · (903) 913-6444 ·
  hello@premierdentalacademyoflongview.com · https://www.premierdentalacademyoflongview.com/
- In-person: about 12 weeks; **$3,000 paid in full** or **$3,500 on a plan = $500 down + $3,000**.
- Online: self-paced, starts any day; **$997 regular**, **$397 promotional** (the promo is a
  switch, off until Amanda approves the checkout change). Never describe online as hands-on or live.
- Class hours: only "Mon/Wed/Fri 8:30 AM–12:30 PM" and "Tue/Thu 9:00 AM–3:00 PM". No evening,
  night or Saturday times, ever.
- Dates and seats come from the `cohorts` table, never typed into a page.

## Never invent or retain as fact without dated evidence from Amanda
Graduate counts (406+), placement rates (85%+), "70% start with no experience", 17 partner
offices, an eight-seat cap as marketing copy, the Jasmine M. / Aisha C. / Dr. Williams
testimonials, "cut onboarding in half", salary or payback promises, and only / best / lowest /
guaranteed. Unapproved → hide the component or use neutral truthful copy, never a placeholder
that looks real. `scripts/check-claims.mjs` fails the build on these.

## Do NOT do without Amanda's explicit approval for the exact action
Publish or deploy to production (unless she has said to ship increments, as on Sep 17, 2026);
change DNS, domains, payment configuration, environment variables or auth providers; run a
production migration or destructive database operation; delete, merge, overwrite or export real
student, lead or payment records; send real emails or texts or activate an automation; charge,
refund, cancel or alter a payment plan; add or remove users or change real permissions; replace
prices, policies, dates, contact details or public claims. Stage SQL in `db/pending/` instead.

Before any high-impact action state: what changes, whose data, how it was tested, how to roll back.

## Security
Never put credentials, tokens, service-role keys, passwords, card data or private student data in
prompts, code, bundles, screenshots, logs, docs or Notion. Default deny; RLS + server checks are
the authorization (hidden buttons are not). Square is the payment authority; never handle raw card
numbers; webhooks verified and idempotent; never mark paid from a browser redirect alone.

## Communications
Every automation defines trigger, consent, exclusions, template version, quiet hours, stop
conditions, idempotency, delivery result, owner and analytics event. Honor STOP immediately and
globally. Never promise a seat, discount, funding, job, wage, refund, extension, exam result or
licensure. Test with fictional data; humans approve sensitive messages.

## How work is delivered
Restate the outcome; inspect before changing; smallest coherent change that solves the whole
problem; test happy, failure, empty/loading, permission and mobile paths; report in plain
language: what works, what changed, what was tested, what needs Amanda's decision, safest next step.
Commits are authored by the business (`Premier Dental Academy of Longview
<hello@premierdentalacademyoflongview.com>`), never an individual, and are never tagged as
machine-generated.
