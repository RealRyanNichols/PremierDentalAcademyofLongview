# PDA Practice Management Trainers — Changelog

Two single-file web simulators that PDA students use to learn the dental
practice management software they'll see on day one in any East Texas office.

| Tool                | File                                     | Mirrors            |
| ------------------- | ---------------------------------------- | ------------------ |
| PDA Practice Pro    | `05_Live_Site/tools/practice-pro.html`   | Dentrix Ascend / G7|
| PDA EagleNest       | `05_Live_Site/tools/eaglesoft.html`      | Patterson EagleSoft|

---

## v2 — 2026-05-04

Foundation push. Shared assets and persistence wired up before either trainer
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
