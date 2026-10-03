# Site audit — October 3, 2026

Premier Dental Academy of Longview · public site, trainers, student dashboard, admin lead inbox.

**What this covers.** Everything in this repository (`05_Live_Site/`) plus a read-only look at the
live Supabase project the pages talk to (tables, row-level-security policies, security advisories,
cohort rows, profile counts). Nothing in the database was changed.

**What this does not cover.** The course portal (lessons, quizzes, module progress, payments,
email campaigns) is not in this repository. The database holds those tables, and the LeadFlow
repo's droplet notes refer to a `pda-api` service and a "Premier staging site" running on the
droplet, so that code lives somewhere else. It needs its own pass.

---

## 1. Fixed in this pull request

Navigation, access, and honesty fixes only. No price, program, policy, or claim wording changed.

| Area | What was wrong | What it does now |
| --- | --- | --- |
| Sign-in page | The file contained **two complete copies** of the page stacked on top of each other (an older copy without "Forgot password" had been appended). Two login cards, duplicate IDs, two sets of event handlers fighting. | One page. Also honours `/login?next=/admin/leads` so staff land back where they were. |
| Site menu | Every page had a different menu. Homepage: 9 links. Classes/Calendar/Graduates: 4 links, no About/Contact/Blog. About: "Pricing". Apply, Enroll, Contact, Salary, Guide, Hiring partners, Privacy, Terms, blog posts: only "← Back to home". "Sign in" existed only on the homepage and directory pages, and only the homepage swapped it to "Dashboard" when signed in. At tablet width the 9-link row overflowed the header. | One menu, defined once in `assets/pda-nav.js`: Programs · Classes · Calendar · Graduates · Resources ▾ (Blog, Salary calculator, Free guide, Dental office directory, Career archives, For dental offices, Try the free trainer) · About · Contact. Current page highlighted. Hamburger + drawer on every page that has a header, including the focused pages. "Sign in" ↔ "⌂ Dashboard" swaps everywhere based on the stored session. Desktop row shows from 1024px; below that the hamburger takes over, so nothing overlaps on tablets. |
| Dashboard menu | The mobile drawer on the signed-in dashboard showed marketing links: "Sign in", "Try the free trainer", "Apply now". | Portal mode: the drawer shows the dashboard's own links, "Public site", and "Sign out". |
| Dashboard labels | Amanda's own account (admin, no program value) and the two instructor accounts were shown as "Free preview — Enroll to unlock". | Admin / instructor flags win; shows "PDA Admin" / "PDA Staff". Enrolled students with a program value the page didn't recognise are labelled "Enrolled student" instead of "Free preview". Suspended accounts see "Access paused" with the phone number instead of preview copy. |
| Homepage countdown | Hard-coded "Aug 19" in the bar, and the script fell back to **Aug 19, 2026** (already past), so it read "starts today" every day. It also trusted a cohort's `upcoming` status even when the start date had passed. | Reads the next class whose start date is today or later (Central time), fills the real date, counts down. If none is posted, the bar says so and links to the calendar. |
| Classes & Calendar pages | A class whose status was never rolled over showed as "upcoming — reserve your seat" after it had already started (two September classes are in that state right now). Calendar page replaced the **whole page, header included**, with "Could not load classes." on any error. | Only classes that haven't started are offered as upcoming. Error and empty states stay inside the page with the phone number. |
| Apply, Contact, Classes reservation, Hiring-partner request, Salary, Free guide, Blog subscribe | All of them showed "Success!" (or redirected to the thank-you page) **even when the save failed**. Apply also had dead code after its redirect. | Each one checks the result. On failure the person's entries stay in the form and a plain message offers retry, phone, and email. Already-subscribed addresses still count as success. |
| Graduates page | On a load error the page sat on a grey "loading…" box forever. | Shows a clear message; shows an honest empty state when there are no visible placements. |
| Admin inbox | Changing a lead's status looked saved even when the database refused it (row-level security lets admins update only leads assigned to them; only the owner can update any lead). Sign-in wall went to `/login` and then dumped staff on the dashboard. No way back to the dashboard. | Reports "not saved" and reverts the dropdown. Sign-in returns to the inbox. "⌂ Dashboard" link in the header. Marked noindex. |
| Chatbot placement | The prospect chatbot ("Ask Premier") loaded on the dashboard and sign-in pages. | Public pages only. |
| Plumbing | `auth.js` signed out to `/login.html` while every other link uses clean URLs. `sitemap.xml` listed `/login` and `/dashboard`. Breadcrumb labels missing for newer pages. Directory generator used Python's per-run-salted `hash()` for SVG gradient IDs, so every regeneration rewrote all 232 profile pages. | Clean URL. Private pages out of the sitemap and marked noindex. Labels added. Generator uses a stable hash (profiles were **not** regenerated in this PR; the first regeneration after this will be a one-time full diff, then stable). Generator's static menu matches the shared one. |

---

## 2. Pricing and program wording — DONE (Amanda's instruction, Oct 3, 2026)

Amanda's direction: remove every free / funded enrollment option (WIOA, TWC, GI Bill, scholarships,
in-house financing, "$0 out-of-pocket") and present exactly two ways to pay for the in-person
program: **$3,000 paid in full** or **$3,500 on the payment plan ($500 down + $3,000 balance)**.

Applied in this PR:

- One source of truth: `05_Live_Site/assets/pda-offer.js` (program name, 12 weeks, $3,000, plan
  $500 + $3,000 = $3,500, `fundingOffered: false`). The classes and calendar cards, the enroll
  page's checkout summary, and the Ask Premier chatbot read from it. Static copy on
  `index.html`, `enroll.html`, `apply.html` carries the same figures.
- Guard: `python3 scripts/check_offer.py` fails if retired prices, "Career Track", funding words
  ("WIOA", "TWC", "GI Bill", "scholarship", "0% financing", "out-of-pocket") or "Stripe" reappear
  on public pages, or if the approved figures go missing. Run it after any copy change.
- Rewritten: homepage structured data (organization price range, Course schema, FAQ schema),
  programs section ("One program. Two ways to pay."), tuition section (the $0 "Free Preview"
  pricing card and the Workforce / Veterans / 0% financing footnote are gone), comparison table
  (PDA cost cell; the "externship guarantee" row removed), FAQ answers, footer links; enroll page
  (two payment cards replace Foundation / Career Track / Workforce-Veterans; checkout summary no
  longer names Stripe); apply form ("How would you like to pay?" replaces the program picker, and
  the admin inbox + CSV show the answer); contact reasons; classes and calendar card labels and
  prices; chatbot answers for cost, duration, payment plan, funding (now a clear "we don't offer
  funded or free enrollment"), job placement, greeting, and quick replies; "Apply free" buttons
  now read "Apply now"; "scholarship deadlines" removed from newsletter copy; free-guide bullet;
  salary and graduates pages; the two blog posts that described Foundation / Career Track; nav
  label "Try the free trainer" → "Trainer demo".

Still open on this topic:

- `terms.html` still describes refund timing in Foundation / Career Track terms ("no refund after
  week 10 (Foundation) or week 20 (Career Track)"). Legal text should match the signed enrollment
  agreement, so it was left for Amanda to confirm the wording.
- `privacy.html` says payment information is "processed by Stripe". Square is the processor. Also
  legal text, so left for Amanda to confirm; the guard script lists it as a note until fixed.
- The **online self-paced program ($397 promo / $997 regular)** from the standing instructions was
  **not added**: Amanda's Oct 3 instruction named only the two in-person payment options, and the
  site had never offered online. Add it only on her say-so.
- Student records in the database still carry `program = foundation / career_track`; the
  dashboard labels those as before. Internal only; no change needed unless she wants to rename.
- The free-guide PDF itself (hosted outside this repo) may still discuss funding paths; its landing
  page bullet was updated.

## 3. Needs Amanda's decision — claims on the "never retain" list

All still live. Each needs dated evidence and an approval record, or neutral truthful copy.

| Claim | Where |
| --- | --- |
| "East Texas's only RDA training program…" / "The only RDA program with…" | `index.html` (meta description, hero, program section), `guide.html` meta, `assets/pda-seo.js` default description |
| "About 70% of our students come in with no prior dental background" | `index.html` FAQ (twice: schema + visible), `assets/ask-premier.js`, blog "how much do dental assistants make" |
| "8 seats per class. No more." | `calendar.html` hero. (Cohort rows do carry `capacity = 8`; the operational cap is fine, the marketing line is the claim.) |
| Testimonials "Jasmine M." and "Aisha C." and the office quote "cut our onboarding time in half" | `index.html` testimonials section |
| "Your investment in PDA pays back in 4–8 weeks of working"; salary ranges | `index.html` pricing section; `salary.html`; chatbot |
| "Guaranteed externship", "externship placement guaranteed" | `index.html` (program card, comparison table, pricing), `enroll.html`, chatbot |
| "14-day satisfaction / money-back guarantee … refund 100% … pro-rated after" | `index.html` FAQ + CTA, `enroll.html`, `classes.html` reserve modal, chatbot. Refund terms must come from the signed enrollment agreement, not marketing copy. |
| "406+ graduates" / "85% placement" | Not hard-coded on the pages any more — the homepage and graduates page compute from the `placements` table (12 visible rows). But the database still holds `public_stats_overrides` rows `graduates_extra = 394` and `placement_rate_pct = 85`, which is where "406+" and "85%" came from; anything that calls `pda_public_stats()` gets 394 added to the graduate count. |
| "17 partner offices" | Not on the pages; the database has 17 rows in `hiring_partners`. |
| Founder name "Amanda Williams", "20-year veteran" | `about.html`, `classes.html` default instructor, chatbot. Confirm this is correct and approved wording. |

---

## 4. Backend findings (Supabase, read-only) — need approval before any change

Supabase is being retired in favour of the droplet, so these are listed for the switchover plan
rather than fixed here.

**Data that makes pages look wrong**

- Cohort statuses are stale: "September 14, 2026" and "September 29, 2026" are still `upcoming`
  though they have started; "June 22", "July 7", "August 17", "August 25" are still `current`
  though a 12-week class from June would have ended. The pages now guard by date, but the rows
  should be rolled over (and whatever process is meant to do that, checked).
- `pda_public_stats()` counts cohorts with `status = 'open'`; the data uses `past / cancelled /
  current / upcoming`, so that function always reports 0 classes in session and 0 upcoming.
- `public_stats_overrides`: see the 406+/85% row above.
- No cohort has a Square payment link, so every "Reserve" button on classes/calendar is a lead form
  or the apply page, never a payment. Correct for now; worth knowing.

**Access that is wider than the pages assume**

- `subscribers`: policy "staff can read all" grants **any signed-in account** (every student)
  read access to the full subscriber list (emails). Same for `chat_messages`. The admin inbox hides
  the tab from non-admins, but the data is readable with any student session. Recommend restricting
  both to `is_pda_admin()`.
- `subscribers`: the public "unsubscribe by token" update policy is `USING (true)`, so an anonymous
  request that omits the token filter could mark every subscriber unsubscribed. Recommend matching
  `unsubscribe_token` in the policy or moving unsubscribe behind a function.
- `leads`: admins can only update leads where `owner_id` is themselves; only the owner account can
  update any lead. If the two staff admins are supposed to work the whole inbox, that policy needs
  to change (the inbox now tells them when a change was refused).
- Nine `SECURITY DEFINER` functions are executable by the anonymous role, including
  `is_pda_owner()`, `pda_guard_profile_roles()`, `pda_commission_from_*()`, `scoreboard_*()`,
  `social_proof_feed()`. Review which are meant to be public and revoke the rest.
- Five `SECURITY DEFINER` views flagged by the advisor (`course_catalog`, `public_testimonials`,
  `translation_coverage`, `campaign_performance`, `campaign_link_clicks`).
- Leaked-password protection is off in Auth settings.
- 21 backup/staging tables have RLS on with no policies (that is locked, which is fine); several
  carry "safe to drop after …" comments and can be cleaned up on schedule.

**Checked and sound**

- `profiles`: a trigger (`pda_guard_profile_roles`) freezes `is_admin`, `is_owner`,
  `is_instructor`, `program`, `portal_status`, and every entitlement flag for non-admin updates, so a
  student cannot promote themselves through the account form or the API. Only the owner can grant
  admin.
- `pp_patients` / `pp_practice_log`: students see only their own rows; admins and instructors can
  read all. (Each has a duplicate pair of identical policies; harmless, tidy later.)
- `cohorts` and visible `placements` are public-read by design; `leads` and `subscribers` accept
  anonymous inserts by design (the forms).

**Rule mismatch to decide**

- The trainers grant full "student" access to **any** signed-in account, including the 26
  `preview` accounts and the 12 `suspended` ones. The dashboard tells preview users to "Enroll to
  unlock save, PDFs, and your certificate", and the database function `my_portal_access()` says
  enrolled = admin, or program not preview, and portal status active. Pick the rule you want and
  the trainers/dashboard will follow it. Not changed here because it would lock people out.

---

## 5. Deployment checks for the droplet

- Clean URLs: every link on the site is extensionless (`/classes`, `/tools/practice-pro`). The
  web server must map `/x` → `/x.html` and `/x/` → `/x/index.html` (Vercel did this with
  `cleanUrls`). Also map 404s to `/404.html`.
- Trap: `/directory` is both a page (`directory.html`) and a folder (`directory/…`). A rewrite
  rule that tries the path as-is before trying `.html` will match the folder and serve a 404 or a
  listing for `/directory`. Try `{path}.html` first (my local test server hit exactly this).
- `/admin/` noindex was a Vercel header; the pages now carry `<meta name="robots">` themselves.
- Supabase Auth → URL configuration must allow `https://www.premierdentalacademyoflongview.com/reset-password`,
  `/dashboard`, `/login`, and `/admin/leads` as redirect targets, or password reset and magic links
  fail after the email click.
- The Plausible analytics snippet in `assets/pda-seo.js` points at `premierdentalacademyoflongview.com`;
  confirm an account exists or remove the beacon.
- Supabase URL + publishable key are repeated in 20 files; `auth.js` is the intended shim. Leave
  until the droplet switchover replaces them, then collapse to one place.
