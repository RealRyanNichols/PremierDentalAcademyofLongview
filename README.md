# Premier Dental Academy of Longview

Production website for Premier Dental Academy of Longview — a Registered Dental Assistant (RDA) training school in Longview, TX.

- Static site (HTML + Tailwind via CDN; Inter / Fraunces fonts)
- Supabase backend (auth, student dashboard, admin) — RLS enforced, admin-only data access
- Deployed on Vercel; clean URLs via `vercel.json`

## Structure
- `*.html` — pages, served at clean URLs (`/night-class`, `/dashboard`, `/login`, `/enroll`, `/admin`, …)
- `assets/` — shared JS and images
- `tools/` — student practice tools (charting, flashcards, etc.)
- `admin/`, `blog/` — admin pages and blog posts

## Deploy
Static deploy on Vercel. `vercel.json` enables clean URLs.

> Note: the Square enrollment serverless function (`api/enroll.js`) is being restored separately and is not yet in this repo.
