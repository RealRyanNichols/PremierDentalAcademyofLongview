# Navigation QA — one shell per audience (July 2026)

The "different site on every click" problem came from every page hand-rolling its
own header. Fixed by giving each audience ONE shared shell:

| Audience | Shell | Where it renders |
|---|---|---|
| Visitors (marketing) | `assets/pda-nav.js` (existing) | Every public page + blog + tools; auto-injects header, footer, urgency bar |
| Students (signed-in) | `assets/student-nav.js` (new) | `/dashboard`, `/portal`, all 8 `skills-lab/*` pages |
| Amanda / staff | `assets/admin-nav.js` (new) | `/admin` + all 9 admin subpages (incl. KPI + Questions) |

## Admin shell (`assets/admin-nav.js`)
- Replaces each page's hand-rolled `<nav>` with an identical sticky dark header:
  Home · KPI · Leads · Questions · Students · Progress · Instructors · Chat ·
  Feedback · Brain, plus `#user-label`, a 🎒 link back to the student dashboard,
  and Sign out.
- Active page is highlighted teal. On phones the link row scrolls sideways —
  no button ever disappears.
- Keeps the `#user-label` / `#signout` ids so every page's existing JS still works.
- The old floating `admin-quicknav.js` pill is REMOVED (this shell replaces it).

## Student shell (`assets/student-nav.js`)
- One identical top bar: Dashboard · Skills Lab · Tools · My courses ·
  Ask teacher + the account avatar menu (same ids the dashboard JS expects).
- On `/dashboard` it replaces the page's own nav (the page JS null-guards for
  this); on portal/skills-lab it slots in above the page's local header.
- Self-wires the avatar dropdown + signout and stamps identity from the
  Supabase session, so it works even on pages with no auth JS of their own.

## Marketing audit (grep -L "pda-nav.js")
Pages intentionally WITHOUT the marketing nav (all verified deliberate):
- `admin.html` + `admin/*` — use the admin shell instead
- `tools/practice-pro.html`, `tools/chairside.html` — full-screen trainer apps
  with their own app chrome
- `tools/share-your-win.html` — self-contained share-card experience
- `employers/*` — deliberate B2B shell with its own header (distinct audience)
- `logout.html`, `feed.html`, `night-class.html`,
  `blog/gi-bill-veterans-benefits-dental-assistant-school.html` — utility /
  redirect stubs
Everything else loads `pda-nav.js`; the shared footer renders consistently.

## QA matrix (re-run after any nav change)
For each page class, at 375px and desktop, click every nav item and confirm no
dead ends and no menu-shape change:
- [ ] Marketing: `/`, `/classes`, `/enroll`, a blog post, a tool page
- [ ] Student: `/dashboard`, `/portal`, `/skills-lab`, a skills-lab subpage
- [ ] Admin: `/admin`, `/admin/leads`, `/admin/kpi`, `/admin/questions`
Checks: active highlight correct · avatar/signout works · urgency bar only on
marketing pages · admin bar sticky · mobile rows scroll (nothing hidden).
