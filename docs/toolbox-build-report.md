# The PDA Toolbox — build report

**Branch:** `claude/pda-toolbox-port-fix-build-tt19gb` · **Pull request:** #159 (draft)
**Preview:** https://premier-dental-academyof-longview-git-cl-e1edae-realryannichols.vercel.app
**Nothing is live.** Nothing merged to `main`, nothing promoted in Vercel. Amanda does that herself.

Written for a non-engineer. Decisions that need Amanda are in
[`toolbox-decisions-for-amanda.md`](./toolbox-decisions-for-amanda.md).

---

## The headline

**The website was telling Google it was empty.**

The site is built as plain HTML files with no server behind them, so what Google downloads is
literally the file sitting on the disk. Sixteen pages built their content with JavaScript *after*
the page arrived. A person with a normal browser saw the real thing. Google, and anyone whose
phone was struggling, saw the blank version underneath.

The quiz hub told Google it had **0 questions**. It has 98. The charting reference — a genuinely
useful page — was an **empty box** to search engines. So was the student resource hub, the one
listing childcare help, food assistance, rent help, the 988 crisis line and the domestic-violence
hotline. Someone on a locked-down phone looking for those numbers saw nothing at all.

Most enquiries arrive through Google. This was the most expensive thing wrong with the site, and
it is fixed.

---

## What changed, in business terms

### The invisible pages are now visible

| Page | Google used to see | Google now sees |
|---|---|---|
| Practice quiz hub | "0 questions in the bank" | 98 questions, all 13 categories |
| Charting abbreviations | *nothing* | 96 abbreviations across 10 groups |
| Instrument list | "0 instruments & materials" | 84 instruments |
| Procedure walkthroughs | *nothing* | all 13 scenarios |
| Tray setups | *nothing* | all 14 setups |
| First 30 days | *nothing* | the whole week-by-week plan |
| Student resource hub | *nothing* | every crisis and assistance number |
| Class list | "loading…" | real class dates with seats left |
| Homepage banner | "18 days left" (wrong, and stuck) | the real next class date |

A test now fails the build if any page ever ships blank like that again — including the quiet
version, where a page ships an empty box with no telltale "loading" text to search for.

### A false claim about the exam is gone

`/tools/practice-exam` said *"Most state exams require about 75% to pass."* That is simply wrong.
DANB reports a scaled score — at least 400 on a scale of 100 to 900 — not a percentage, and Texas
publishes no percentage passing score at all. Replaced with the accurate wording, and a test now
blocks the build if it or any variant reappears anywhere on the site.

### A contradiction is gone

`/tools` advertised the practice exam as "Free · no signup" while the exam asked for a name and an
email or phone. Per Ryan's decision the lead capture stays, so the card now says "Free · quick
signup" and explains what it collects and why.

### Two dead links fixed

- `/night-class` now returns a proper permanent redirect to `/classes` instead of a stub page.
- `/blank` — a page that never existed but is stuck in Google's index — now returns "410 Gone",
  which tells Google to drop it. A normal 404 gets retried for months.

---

## What was built

**`/toolbox`** — the hub, and the point of the whole exercise. 46 tools grouped by *where somebody
actually is*: working out if this is for them, working out the money, making the time work,
learning the job, the exam, getting hired, and once they are working. People arrive with a
problem, not a tool category, so that is the primary sort; the type filter sits on top. With
JavaScript switched off you still get the full grouped page.

**Five decision tools**

- **What it really costs** — tuition plus the wages given up, the fuel, the childcare, then how
  many months the new job takes to earn it back.
- **The 168-hour check** — adds up what a week is already spoken for and shows what is left. If it
  does not add up, it says so.
- **Short-path healthcare careers** — ten jobs compared on real government pay figures. It says
  plainly that two of them pay more than dental assisting, because somebody choosing a career
  deserves the whole picture.
- **How people pay for it** — seven funding routes, each naming **who actually decides**. We decide
  on two of the seven. Saying so saves people a fortnight of ringing the wrong number.
- **Your finish plan** — the things that genuinely stop people finishing (childcare falls through,
  the car dies, a shift moves) with something concrete to arrange before it happens.

**Three practice drills** — 96 charting abbreviations, 84 instruments, and 14 procedure trays
graded against the four real arrangement rules. Each drill reports by category, weakest first, so
a student knows where to spend the next ten minutes.

**Four more**

- **Tooth numbering converter** — Universal, Palmer and FDI, with a drill and the full chart.
- **Texas RDA credential timeline** — printable, in order, with what to bring to each step.
- **Dental bill & insurance decoder** — ten terms that decide what a patient owes.
- **A subscribable class calendar** (`/calendar.ics`) — class dates land in someone's own diary.

---

## What was tested, and what the tests found

**58 automated checks on the content and the maths**, plus **61 checks driving a real browser**
across all 12 new pages.

Your hand-verified numbers are pinned exactly: total **$6,172**, payback **7.9 months**, monthly
gain **$780**; **135 hours committed, 33 left**. If anyone changes that maths, the build stops.

**The browser tests found four real bugs that would otherwise have shipped:**

1. **The toolbox filter did nothing at all.** Clicking "Calculators" changed nothing on screen.
   The centrepiece of the hub, broken, and invisible to any test that only reads the HTML.
2. **The active buttons failed the accessibility contrast standard.** White on that particular
   teal is 3.74:1 against a 4.5:1 requirement. Darkened one shade.
3. **Every calculator page scrolled sideways on a phone.** Two pixels of overhang was enough —
   on the device most of this traffic actually uses.
4. **Buttons were 43px where 44px is the minimum touch target**, and the shared navigation was
   shipping 19–33px controls across the *whole site*. Fixed site-wide.

**A clinical review of the study content caught worse.** The worst would have actively taught
students the wrong thing:

- The **amalgam tray had no amalgam carrier, well or burnisher** — the grader would have marked a
  student *wrong* for putting the carrier on an amalgam tray.
- The **scaling tray had no curettes**, which are the instruments that actually do the job.
- The **surgical extraction tray required the exact handpiece its own safety note forbade** (the
  note correctly warned about forcing air into tissue).
- The composite notes said bonding is **chemical**; it is **micromechanical**, and that distinction
  is the reason contamination matters.
- The Class V cavity definition was missing the surface restriction.

All fixed. Four judgement calls that need someone who knows the local offices are listed in the
decisions document.

---

## Amanda's pre-promotion checklist

1. **Click through `/toolbox` and three tools on your phone.** Try the filter buttons.
2. **Confirm the rendering fix.** Open `/skills-lab/quizzes` on the preview, right-click → View
   Page Source, and search for `98`. It should be in the source, not just on screen. That single
   check proves the whole fix.
3. **Confirm the "75% to pass" line is gone.** Search `/tools/practice-exam` for "75".
4. **Confirm you have reviewed the 90 exam questions** before `/tools/rda-practice-exam` goes
   public. It is currently hidden from Google and refuses to start until you sign it off.
5. **Confirm no existing page changed behaviour** — spot-check `/`, `/classes`, `/calendar`,
   `/enroll`, `/tools`.
6. **Supabase advisors clean** (nothing in this build touched the database, so they should be).
7. **Then merge PR #159 and promote in Vercel yourself.**

Also worth doing before or shortly after: clear the three cohorts still publishing evening class
times (decisions document, item 1). That one is live on the current site, not something this build
introduced.

---

## Rollback

Nothing here needs a database rollback, because **no migrations were written and no Supabase data
was touched**. The rollback is therefore just the deployment:

1. Vercel → the `premier-dental-academyof-longview` project → **Deployments**.
2. Find the deployment that was live before promoting.
3. **⋯ → Instant Rollback.** Live again within seconds.
4. If it has already been merged to `main` and you want the code gone too:
   `git revert -m 1 <merge-commit>` and push.

The only two files outside the new pages that change existing site behaviour are
`assets/pda-polish.css` (touch-target sizing) and `assets/pda-nav.js` (a link to the new hub).
Both are cosmetic and both revert with the deployment.

---

## Conflicts found between the brief and the repository

1. **No framework.** The brief asked for server-rendering. This site is static HTML on Vercel with
   no build step and no server. The equivalent — baking the content into the HTML at build time —
   achieves the identical result for Google, and a generator script now does it so the pages and
   the data cannot drift apart.
2. **The zip files were never attached.** `pda-student-tool-hub.zip` and `pda-content-packs.zip`
   were not in the session, so there was nothing to port. Everything was built from scratch against
   the written spec, which is why the test suite matters more here than it normally would.
3. **`/career-archives` does not 404.** The page exists, is in the sitemap and is linked from the
   navigation. Either that finding was stale or it is a production deployment issue.
4. **Branch name.** The brief said `feature/pda-toolbox`; the assigned working branch was
   `claude/pda-toolbox-port-fix-build-tt19gb`. Same preview, same review, different name.
5. **The rendering bug was wider than described** — 16 pages rather than 7.
6. **BLS figures came via search.** `bls.gov` is blocked from the build environment, so the wage
   data was gathered through search results citing BLS, and each card links to its BLS page. Worth
   spot-checking two or three before promoting.

## What this build deliberately did not do

No Supabase schema, policy or data changes. No payment code. No DNS, domains or environment
variables. No emails sent. No existing tool deleted or rewritten beyond the rendering fix. Nothing
merged, nothing promoted.
