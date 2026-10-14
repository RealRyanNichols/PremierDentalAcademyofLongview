# Premier Dental Academy of Longview

Production website for Premier Dental Academy of Longview, a Registered Dental Assistant (RDA) training school in Longview, TX.

Canonical site: https://www.premierdentalacademyoflongview.com

- Static HTML, shared JavaScript, and locally compiled Tailwind CSS on public marketing and study pages.
- Existing DigitalOcean hosting: Caddy serves `/srv/sites/pda` and forwards `/api/*` to the existing Node API on `127.0.0.1:3200`.
- Source control: `RealRyanNichols/PremierDentalAcademyofLongview`, deployed from `main` through the existing validated autopull.
- Legacy Vercel and Supabase files remain in the repository for existing code and migration history. They are not instructions to create a new deployment or backend.

## Structure

- `*.html` — pages, served at clean URLs by Caddy (`/classes`, `/enroll`, `/night-class`, etc.).
- `assets/` — shared JavaScript, images, and checked-in versioned CSS.
- `styles/`, `tailwind.*.config.cjs` — sources for the shared stylesheet and three tools with separate styles.
- `tools/` — practice exams, flashcards, charting, and other study tools.
- `videos/`, `texas-rda/` — Amanda watch pages and the official-resource hub.
- `api/` — handlers loaded by the existing Node API wrapper, including `api/enroll.js`.
- `admin/`, `blog/` — existing admin pages and blog posts.
- `scripts/`, `docs/` — site checks, build scripts, and operating notes.

## Local validation

Use the locked dependencies to rebuild CSS before committing a style or utility-class change:

```sh
npm ci
npm run build:css
npm run build:css:scoped
npm run check:css:scoped
npm test
```

Tailwind is pinned to version 3.4.19. The build scripts generate content-hashed assets and update the relevant HTML references. Commit those generated assets with their page references. The scoped build preserves the PracticePro, ChairSide, and Career Plan component styles and palettes.

`npm test` runs the repository's available site checks, including links, facts, analytics, SEO, accessibility, sitemaps, pricing, claims, dates, and mocked API behavior. Separate native browser review covers playback and interactive study tools. The scoped CSS check uses local development dependencies; serving the checked-in assets does not require a compiler on the production server.

## Production deployment

The existing `pda-autopull.timer` fetches `main`, validates a candidate checkout with `npm test`, and fast-forwards the production checkout at `/srv/sites/pda`. Caddy serves the static files from that checkout using clean URL resolution. The existing `pda-api.service` runs `/opt/pda-api/server.mjs`; API handler changes require its restart, which the deployment script handles when API files change.

PDA Caddy routing lives in `/etc/caddy/sites/pda.caddy`, imported by `/etc/caddy/Caddyfile`. Finished Amanda media is served through narrowly matched routes from the existing archive volume; the original recording and internal production files stay private. Back up the current PDA configuration, validate the complete Caddy configuration, and reload only when a routing change is required. Do not follow the legacy Vercel deployment configuration for this production site.

The Amanda release and performance work do not change enrollment or payment behavior, provider IDs, student records, or billing infrastructure. No new production environment variables, providers, or paid services are required.

See [Amanda video release](docs/amanda-video-release-2026-10-13.md) and [performance release and rollback notes](docs/amanda-performance-2026-10-13.md) for media, validation, and release status.
