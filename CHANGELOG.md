# PDA Practice Management Trainers — Changelog

Two single-file web simulators that PDA students use to learn the dental
practice management software they'll see on day one in any East Texas office.

| Tool                | File                                     | Style                |
| ------------------- | ---------------------------------------- | -------------------- |
| PDA Practice Pro    | `05_Live_Site/tools/practice-pro.html`   | Dark-navy ribbon UI  |
| PDA EagleNest       | `05_Live_Site/tools/eaglenest.html`      | Cyan ribbon UI       |

---

## Practice Pro v2 — first slice — 2026-05-04

The actual app shell is live. Open `/tools/practice-pro` to use it.

### Practice Pro
- Dark-navy top chrome with brand strip + signed-in user identity.
- Ribbon module switcher: Overview · Chart · Perio · Tx Plan · Ledger · Schedule · Recall · Documents.
- Sidebar patient list with instant search, status filter chips (All / Recall / New / Overdue), inline avatars, alert badge, balance and recall-due chip.
- Sticky patient banner: photo, name, preferred name, MRN chip, premed/allergy chips, DOB + age, sex, pronouns, phone, family, primary insurance + used/max progress, outstanding balance, alert row.
- Overview module: editable demographics (autosave on blur), snapshot card, structured medical history (allergies / meds / conditions / notes / premed flag), insurance summary with usage bar, recent ledger activity.
- Treatment plan view with phased grouping, priority chips, and live insurance estimate using a category-based coverage matrix.
- Ledger with full running balance, post-procedure modal (ADA typeahead with code + fee auto-fill), post-payment modal, and walkout-statement modal that exports a clean PDF via html2pdf.
- Recall module: lists patients with recare due in next 30 days, sortable by days-until-due.
- Cmd-K command palette: typeahead across all 25 patients, 50+ ADA codes, and quick actions (new patient, post procedure, walkout, open Chart/Ledger/Schedule).
- Keyboard shortcuts: ⌘K · N · F · T · L · S · P · 1–8 · ?
- Session audit log (every action timestamped, viewable from sidebar).
- Welcome toast with patient count on first load per session.
- Mobile responsive — sidebar collapses behind a hamburger on iPad/phone.

### Naming
- Renamed `tools/eaglesoft.html` → `tools/eaglenest.html` and stripped all references to copyrighted product names from user-facing copy and code comments.

### Coming next push
- Chart module (odontogram + click-to-mark surface marking with right-click → "Plan procedure")
- Perio chart (6-point, auto BOP%, auto avg pocket depth)
- Schedule grid with drag-drop appointments
- Document manager + imaging slot

---

## Foundation — 2026-05-04

Shared assets and persistence wired up before either trainer ships its v2 UI. Shared assets and persistence wired up before either trainer
ships its v2 UI.

### Added
- `db/migrations/20260504_pp_simulator_tables.sql` — `pp_patients`,
  `pp_practice_log`, `pp_scenarios` with row-level security so one student
  can never see another's practice data.
- `05_Live_Site/auth.js` — exposes `window.PDA` (Supabase client + auth
  helpers). Falls back to anonymous demo mode if no session.
- `05_Live_Site/assets/pda-shared.js` — persistence layer (Supabase with
  localStorage fallback), SVG icon factory, formatters, Dicebear avatars,
  toast notifications, html2pdf lazy-loader, insurance-portion calculator,
  and tooth/surface helpers.
- `05_Live_Site/assets/pda-seed-patients.js` — 25 fictional patients with the
  diversity matrix from the brief: 4 children, 6 teens/young adults, 9
  working-age adults, 6 seniors. Mix of insurance carriers (Delta, Cigna,
  MetLife, Aetna, Humana, MCNA Medicaid, TX-CHIP, self-pay). Three linked
  family groups. Five medically-complex patients (Warfarin, A-fib,
  bisphosphonates, T2DM uncontrolled, premedicate). Eight allergies. Mix
  of new / mid-treatment / maintenance / overdue. Ships with full ADA code
  catalogue (50+ codes) and SmartDoc note templates (15 categories).

### Notes
- All seed data is fictional. No real PHI.
- Trainer apps are in progress and will land in subsequent commits.
