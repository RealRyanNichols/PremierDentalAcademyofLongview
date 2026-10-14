# Amanda performance release — October 13, 2026

Canonical production site: https://www.premierdentalacademyoflongview.com

## Release status

The existing DigitalOcean Caddy media and cache routes are live. Thirty HTTPS checks verified the new media URLs, response headers, and byte-range delivery. Source publication through `main` is in progress; the release owner will record the confirmed deployed revision and follow-up measurements when verification finishes.

The original Amanda website release remains documented in [the video release note](amanda-video-release-2026-10-13.md). This performance release adds lighter playback assets, compiled CSS, and controlled preparation of a visible player. It does not create leads, payments, student records, or new backend workflows.

## Compiled public styles

624 public pages replace the development Tailwind CDN runtime with versioned local CSS: 621 use the shared stylesheet and three use separate scoped styles. Public marketing pages, watch pages, the resource hub, and study tools retain their content and functional scripts. Private, admin, noindex, and other utility pages remain outside the public migration.

Tailwind is locked to version 3.4.19. The final shared asset is `assets/pda-tailwind.v3.4.19.f38a435875f24b40.min.css` (70,685 bytes). Its `body[data-pda-video-in-view]` rule hides both automatic prompts, `#ap-teaser` and `#pda-sp-toast`, while a player is in view; the visitor can still use the chat button.

The three scoped assets preserve existing component rules and distinct tool palettes:

| Page | Versioned stylesheet | Bytes |
| --- | --- | ---: |
| PracticePro | `assets/pda-tailwind-practice-pro.v3.4.19.5fc902fc90ab8c5e.min.css` | 39,576 |
| ChairSide | `assets/pda-tailwind-chairside.v3.4.19.ac8014bf8a3a5ed9.min.css` | 34,548 |
| Career Plan | `assets/pda-tailwind-career-plan.v3.4.19.8e98b4b7a2073e6b.min.css` | 28,584 |

Shared navigation classes and the audited dynamically constructed alert/blog palette classes are included in the build. The public selector always excludes these three scoped pages from the shared stylesheet pass. Scoped checks verify their input, label, button, focus, hover, alert, and palette rules.

Rebuild and validate locally before publishing a style or class change:

```sh
npm ci
npm run build:css
npm run build:css:scoped
npm run check:css:scoped
npm test
```

Commit the generated content-hashed CSS with its updated page references. Production serves the checked-in files; no new server dependencies, production environment variables, providers, infrastructure, or costs are needed. The scoped CSS check requires the local development dependencies and is separate from the production autopull's `npm test` gate.

## Playback assets and loading

Ten 720p web playback files total 145,036,677 bytes, compared with 443,860,731 bytes for the ten 1080p exports: 67.32% smaller. Ten WebP playback posters total 497,652 bytes, compared with 996,021 bytes for the JPEG posters: 50.04% smaller. The high-quality original 1080p files, complete ZIP, original recording, and production files are preserved privately and unchanged.

New media is served from the existing archive folder at `/mnt/archive/client-deliveries/premier-dental-academy/2026-10-13-amanda`. Narrow Caddy routes cover `/videos/stream/*-web-v1.mp4` and `/videos/thumbnails/*-poster-v1.webp`; versioned media and compiled CSS, including the scoped stylesheets, receive one-year immutable caching. Only finished public assets are served. The original recording and analysis paths remain private.

`videos/video-loading.js` prepares metadata for one nearby visible player, or when a visitor hovers over or focuses a player. Automatic preparation is skipped for Save-Data and slow-2g/2g connections. Playback remains under the visitor's control: players do not autoplay, and the HTML begins with `preload="none"`. The visibility observer also controls both automatic prompt rules without removing the manual chat button.

421 broken Vercel-only analytics script tags were removed from public compiled pages after their actual URLs returned HTTP 404. The existing PDA GA4 and Meta integrations remain in place; no provider IDs or measurement events were replaced.

## Validation and measurements

The full `npm test` suite and the CSS checks passed for the prepared source changes. Existing legacy heading and unrelated fact warnings remain; this release does not claim to resolve those warnings. Native local review verified practice-exam entry and cancellation, flashcard flipping, the PracticePro chart, ChairSide forms and welcome modal, and Career Plan colors. These checks did not submit a lead, payment, or student record.

The live media routes passed 30 HTTPS response/header/byte-range checks. Source deployment and final live layout/playback checks are still separate release steps. Existing GA4 and Meta video-start, progress, and completion HTTP receipts were verified for the original public video release; those receipts do not establish provider dashboard reporting, enrollment results, or revenue.

The baseline phone video cold start was 7.496 seconds under simulated 1.6 Mbps bandwidth, 150 ms latency, and 4× CPU slowdown. The comparable after-release measurement is pending. File-size reductions are verified asset measurements, not a claim about the final visitor startup time.

Google Search Console remains pending sign-in to the user-authorized `hello@premierdentalacademyoflongview.com` account. Google recognizes the account and requires its password in the browser. No property verification or sitemap submission is claimed, and neither the release nor its metadata guarantees indexing or rankings.

## Release and rollback

The existing `pda-autopull.timer` validates a candidate checkout with `npm test` before fast-forwarding `/srv/sites/pda` from `main`. Static HTML and checked-in assets are served by Caddy. The Node API continues to use `/opt/pda-api/server.mjs` and `pda-api.service`; this performance work does not change its enrollment, payment, or student-data behavior.

Before source publication, retain the prior source revision and the saved PDA Caddy configuration. After publication, record the deployed revision, native live checks, and comparable after-release measurement in this note or the handoff receipt.

To roll back source behavior, revert the performance release through normal Git history and let the existing validation/deployment process run. Restore the matching prior HTML and CSS references together. To roll back routing or cache behavior, restore only the saved PDA Caddy configuration, validate the complete configuration, and reload Caddy. Retain prior and new finished assets on the archive volume so cached versioned asset URLs continue to resolve. Preserve the original recording, ZIP, and private production files unchanged.
