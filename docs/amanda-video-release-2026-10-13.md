# Amanda video release

The public school site now features eight contextual placements of Amanda’s finished videos: homepage (introduction, next-step conversation, practical skills), About (career story), Classes (learning options), Tools (extra practice and interview support), and Enrollment (career-choice reassurance below the existing checkout).

`/videos/` lists all ten videos. Each `/videos/<id>/` watch page has one prominent player, accurate captions and transcript, enrollment links, a unique canonical URL, social metadata and VideoObject markup. `/texas-rda/` connects existing study tools to dated official TSBDE resources; the Board remains the registration authority.

## Hosting

HTML and engagement code stay in this repository. Forty finished media files and the 42-member ZIP live outside Git on the existing DigitalOcean archive volume at `/mnt/archive/client-deliveries/premier-dental-academy/2026-10-13-amanda`. Only MP4, caption, poster and ZIP routes are exposed by the narrowly matched Caddy media handler. No original recording or internal production files are served.

The Caddy handler strips `/videos` and serves that folder for `/videos/exports/*.mp4`, `/videos/captions/*.srt`, `/videos/captions/*.vtt`, `/videos/thumbnails/*.jpg`, and the complete ZIP. Existing site routing and APIs continue as before. Back up `/etc/caddy/sites/pda.caddy`, validate the complete Caddy configuration, and reload before publishing source pages. The site’s existing autopull validates `npm test` before fast-forwarding main.

## Measurement

`video-engagement.js` uses the existing PDA GA4/Meta adapter for starts, played-range milestones (25/50/75), completion, errors and video-associated CTA clicks. Each event contains a video ID, page placement and an action/percentage/code only. Repeated milestones are deduplicated and seeking to the end does not create a full-watch completion. These events do not create leads, purchases or verified revenue records.

The public video sitemap is `/videos/video-sitemap.xml`; robots.txt lists it and the main sitemap. Source pages, metadata and sitemap publication do not prove Google indexing or rankings. Search Console submission and reports require an authorized property account.

## Validation and rollback

Full site checks cover facts, links, analytics, SEO, accessibility, sitemap, pricing, claims, dates and mocked API behavior. Native mobile playback and desktop/mobile layouts are reviewed separately. Final media hashes match the approved local exports; the ZIP has ten videos and matching captions/posters, with no source footage.

Rollback source changes with a normal Git revert of this release, then let the existing deployment validation run. Restore the saved previous PDA Caddy configuration and validate/reload it to withdraw media routing. Retain the archived files and original recording. No DNS, payment, student data, enrollment logic, provider IDs or paid infrastructure changed.
