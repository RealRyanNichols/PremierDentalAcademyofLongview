# Amanda performance release — October 13, 2026

Canonical production site: https://www.premierdentalacademyoflongview.com

## Release status

The existing DigitalOcean Caddy media and cache routes are live. Thirty HTTPS checks verified the new media URLs, response headers, and byte-range delivery. Performance source revision `30be31e2a0b68f05b2a038de4ddcd69c9bd425ab` was published through `main` and confirmed at `/srv/sites/pda`. The existing autopull reported `Result=success` and `ExecMainStatus=0`. A follow-up removes four remaining broken Vercel requests from the two scoped study tools; the final deployed revision is recorded in the client handoff receipt.

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

Ten 720p web playback files total 145,036,677 bytes, compared with 443,860,731 bytes for the ten 1080p exports: 67.32% smaller. Ten WebP playback posters total 497,652 bytes, compared with 996,021 bytes for the JPEG posters: 50.04% smaller. The high-quality 1080p exports and complete ZIP are retained unchanged. The later public-sharing update removed download offers from the pages and blocks public ZIP/SRT routes; playback MP4s and VTT captions remain available. The original recording and internal production files remain private.

New media is served from the existing archive folder at `/mnt/archive/client-deliveries/premier-dental-academy/2026-10-13-amanda`. Narrow Caddy routes cover `/videos/stream/*-web-v1.mp4` and `/videos/thumbnails/*-poster-v1.webp`; versioned media and compiled CSS, including the scoped stylesheets, receive one-year immutable caching. Only finished public assets are served. The original recording and analysis paths remain private.

`videos/video-loading.js` prepares metadata for one nearby visible player, or when a visitor hovers over or focuses a player. Automatic preparation is skipped for Save-Data and slow-2g/2g connections. Contextual and library players begin with `preload="none"`; individual watch-page players begin with `preload="metadata"`. Playback remains under the visitor's control and players do not autoplay. The visibility observer also controls both automatic prompt rules without removing the manual chat button.

Eight lazy campus-gallery photos on the homepage use `fetchpriority="low"` so browsers can prioritize requested playback over nearby secondary photos. Existing photo dimensions, formats, and lazy loading are retained.

425 broken Vercel-only analytics script tags were removed from public compiled pages after their actual URLs returned HTTP 404. The existing PDA GA4 and Meta integrations remain in place; no provider IDs or measurement events were replaced.

## Validation and measurements

The full `npm test` suite and the CSS checks passed for the prepared source changes. Existing legacy heading and unrelated fact warnings remain; this release does not claim to resolve those warnings. Native local review verified practice-exam entry and cancellation, flashcard flipping, the PracticePro chart, ChairSide forms and welcome modal, and Career Plan colors. These checks did not submit a lead, payment, or student record.

The live media routes passed 30 HTTPS response/header/byte-range checks. Live native review confirmed optimized watch-page playback through its complete 14.613-second duration, `ended=true`, and no media error. The public sharing controls and enrollment CTA remain present. A read-only merge audit preserved 20 sharing groups, 28 caption tracks, all ten transcripts, and `nodownload` on all 28 players. Existing GA4 and Meta video-start, progress, and completion HTTP receipts were verified for the original public video release; those receipts do not establish provider dashboard reporting, enrollment results, or revenue.

Controlled native-browser observations:

| Observation | Before | After |
| --- | ---: | ---: |
| Homepage DOMContentLoaded | 4.059 s | 1.870 s |
| Fresh first-video click, 1.6 Mbps / 150 ms / 4× CPU | 7.496 s | 7.774 s |
| First-video click after visible-player preparation, same slow profile | Not measured | 0.276 s |
| Fresh first-video click, normal connection and CPU | Not measured | 1.425 s |

The slow fresh-click test does **not** establish a startup improvement. Automatic preparation greatly reduces the delay once it has completed; immediate playback still depends on available bandwidth and competing page requests. These are individual laboratory observations, not field performance, LCP, CrUX, or a guarantee. The baseline viewport was 385×988 and after viewport 390×844, so page-timing differences should be treated as indicative. CSS/media reductions, byte delivery, and playback correctness are verified independently. No false immediate-click observation from same-document anchor navigation is used.

Google Search Console remains pending sign-in to the user-authorized `hello@premierdentalacademyoflongview.com` account. Google recognizes the account; its uncompleted sign-in session expired during website work. The Academy account must finish Google sign-in in the browser. No property verification or sitemap submission is claimed, and neither the release nor its metadata guarantees indexing or rankings.

## Release and rollback

The existing `pda-autopull.timer` validates a candidate checkout with `npm test` before fast-forwarding `/srv/sites/pda` from `main`. Static HTML and checked-in assets are served by Caddy. The Node API continues to use `/opt/pda-api/server.mjs` and `pda-api.service`; this performance work does not change its enrollment, payment, or student-data behavior.

Before source publication, retain the prior source revision and the saved PDA Caddy configuration. After publication, record the deployed revision, native live checks, and comparable after-release measurement in this note or the handoff receipt.

To roll back source behavior, revert the performance release through normal Git history and let the existing validation/deployment process run. Restore the matching prior HTML and CSS references together. To roll back routing or cache behavior, change only the performance handlers in the current PDA configuration, preserve later sharing/download restrictions and Markdown denial, validate the complete configuration, and reload Caddy. A full older-file restore could discard concurrent changes. Retain prior and new finished assets on the archive volume so cached versioned asset URLs continue to resolve. Preserve the high-quality exports and ZIP unchanged, and keep the original recording and internal production files private.

Final code follow-up `38f44d1e0c6193cdd3946f7f002a307bed2830e8` is confirmed live. Nineteen HTTPS source/asset checks passed, including all four compressed CSS files with matching hashes and immutable cache headers; three private-path checks returned 404. The existing Markdown denial was extended to nested paths after a check found an internal note accessible. This change was validated against the current Caddy configuration, retaining the concurrent public ZIP/SRT restrictions. A later immediate-click observation did not activate the native play control and was excluded from startup measurements; it is retained as an invalid observation in the private evidence folder.
