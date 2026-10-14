# Public Amanda videos: watch and share

The public `/videos/` library and ten watch pages offer native sharing, Facebook, X, and copying the canonical watch-page link. They do not offer MP4, SRT, VTT or ZIP downloads. The eight contextual Amanda placements keep their inline players.

Only public `video[data-pda-video-id]` players use `controlslist="nodownload"` and suppress their context menu. This removes ordinary save affordances where the browser supports it. It does not prevent copying publicly playable stream bytes or screen recording. Do not promise absolute prevention.

Caption tracks, transcripts, playback URLs, search metadata, enrollment links, student access, payment flows and private deliverables remain separate. Do not apply these restrictions to student downloads or private customer deliveries.

## Authoritative source and future changes

The authored sources are `videos/index.html`, `videos/<id>/index.html`, and the Amanda placements in `index.html`, `about.html`, `classes.html`, `enroll.html` and `tools/index.html`. No checked-in video-page generator creates these pages. Preserve the shared `videos/video-sharing.js` and `videos/video-sharing.css` references when changing them. `scripts/check-video-sharing.mjs` is part of `npm test`; it checks public download boundaries, all 28 current public player placements, the 20 canonical share groups and share/clipboard fallback behavior.

`assets/pda-videos.js` is an older generic player renderer and is not used for the authored Amanda library. The dedicated Amanda source pages and their regression checks are authoritative for this release.

## Existing hosting and reversible publication

The DigitalOcean static source is `/srv/sites/pda`. The existing `/usr/local/bin/pda-autopull` fetches GitHub main, tests an isolated candidate with `npm test`, then fast-forwards the static source. Its enabled timer checks every five minutes. Publishing a commit to main can therefore publish it; retain the reviewed source SHA and file inventory. These page changes require no API restart, DNS change, new service or payment change.

The media is outside Git at `/mnt/archive/client-deliveries/premier-dental-academy/2026-10-13-amanda`. A separately reviewed narrow change to `/etc/caddy/sites/pda.caddy` withdraws only the public SRT and complete ZIP routes, with `404` and `no-store`; MP4, VTT and poster delivery stay available for inline playback. Preserve archived media. Back up the exact Caddy file, validate the entire Caddy configuration, and reload only after source publication checks. Roll source back with a normal revert commit through the existing validation path; restore the exact prior Caddy configuration, validate, and reload to undo the route restriction.
