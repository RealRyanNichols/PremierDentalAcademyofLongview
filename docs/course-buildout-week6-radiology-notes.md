# Course buildout — Week 6 (Radiology) + box/aspect-ratio pass

Session date: 2026-07-14 · Branch: `claude/pda-build-order-1u4n8u`

This is the running progress note for the "make every chapter feel like Chapter 2"
+ box-consistency build. It records what shipped, the key curriculum finding, the
video situation (and exactly how to finish it), sources, and the remaining backlog.

## What shipped this session

### Stream B — Week 6 lifted to the "Chapter 2" gold-standard bar (both courses)
Week 6 ("Radiography Applied") is the **review + graded-quiz** companion to Week 5,
which already holds the full, deep teaching of Chapters 38–41 (Week 5 lessons are
~39/14/29/13 KB — already at the gold-standard bar). So Week 6 was lifted to the
**visual quality bar as a review week** — original diagrams + recap + quiz — rather
than duplicating Week 5's teaching. All four review lessons were rebuilt in
`course_lessons.content_html` for **both** `rda-program` and `online-rda-12-week`
(identical content, kept in sync; writes verified byte-for-byte by md5):

| Lesson (Week 6 review) | content_html before → after | Original visuals added |
|---|---|---|
| Ch 38 · Foundations & Safety | 4.5 KB → **21.5 KB** | x-ray tubehead/production diagram, kVp-vs-mA dial chart, operator safe-position operatory scene, radiation-units traditional↔SI table, filtration-vs-collimation cards, Time/Distance/Shielding cards |
| Ch 39 · Imaging & Processing | 3.4 KB → **16.6 KB** | latent-image→develop/rinse/fix/wash/dry flow ("developer makes it, fixer keeps it"), film-vs-digital (CCD/CMOS/PSP) comparison, "reading a bad film" fault grid, density-vs-contrast strips |
| Ch 40 · Legal / QA / Infection | 3.5 KB → **16.2 KB** | record-ownership diagram, operatory barrier map, Spaulding classification tiers (sensor = semicritical), QA-loop cycle diagram |
| Ch 41 · Intraoral Imaging | 2.9 KB → **16.3 KB** | image-types chart (PA/BW/occlusal/FMX), paralleling-vs-bisecting geometry, angulation-error chart (foreshortening/elongation/overlap/cone-cut), SLOB-rule callout |

Each lesson now has: plain-English intro, teal objectives box (5–7 testable outcomes),
Fraunces headers / Inter body with bolded key terms, 3–4 **original drawn-to-teach
inline SVG figures** in white figure-cards with italic captions, an exam-tip callout,
a key-terms `<dl>`, and a "Watch & learn" video card (see video note below).
`estimated_minutes` bumped to 12–14. The existing **graded quizzes** (separate "Quiz"
lessons, 8 well-written questions each) and the review lessons' **`practice_json`**
were left intact — they were already accurate and strong.

Every lesson was render-verified before shipping with a local headless-Chromium
harness (see `scratchpad/preview/` — not committed) that mirrors `learn.html`'s
`.lesson-body` CSS, at both desktop (960px) and mobile (390px) widths.

### `learn.html` — interactive widget + responsive media (Stream A + bug fix)
- **Implemented the `radiography_positioning` interactive** — a vertical-angulation
  trainer (steeper beam → foreshortening, flatter → elongation, centered → correct
  length). Week 5 Ch 41 already set `interactive_key='radiography_positioning'` but
  `learn.html` never implemented it, so it silently rendered nothing. Now wired into
  `renderInteractive()` and **also enabled on the Week 6 Ch 41 review**.
- Added responsive `.lesson-body` media CSS so lesson figures/images/inline-iframes
  never overflow and inline videos render as a consistent responsive 16:9 box (this
  is also what makes `video_url`-independent inline embeds behave per the style
  contract when you add them — see video note).

### Stream A — `contact.html` box/aspect-ratio consistency
- Call / Email / Campus info cards now use the same fixed rounded icon-tile as the
  `courses.html` / `learn.html` catalog cards (`w-11 h-11 rounded-xl bg-teal-50`).
- The Google-Maps embed switched from a fixed `height="240"` to a responsive
  `aspect-ratio:4/3` (plus an iframe `title` for a11y) so it scales with the column.

`npm test` (facts, links, analytics, seo, a11y, sitemap, pricing) passes; the only
warnings are pre-existing (owner-confirmation facts + multi-`<h1>` on the SPA pages).
No pricing regressions — no `$1,997` anywhere.

## VIDEO — needs a human step to finish (please read)
Ryan asked for embedded YouTube video on every chapter. **From this build
environment I could not verify that any specific YouTube video is embeddable** — the
workspace egress policy blocks `youtube.com` (and the oEmbed/noembed check) with a
403 at the proxy, and the guardrail is explicit that every embedded video must be
verified to exist and be embeddable. Rather than gamble an unverifiable `<iframe>`
onto the live paid course (a non-embeddable ID renders "Video unavailable" to real
students), each Week 6 lesson ships a **safe "Watch & learn" link-card** that points
to a topic-scoped YouTube search — it can never render broken inline, and always
surfaces current, relevant videos.

**To turn these into true embeds (2-minute job, do this when you can eyeball them):**
1. Open the candidate below, confirm it plays and is embeddable (no "playback on
   other websites has been disabled", no age/region lock).
2. Easiest: in `/admin/courses`, set that lesson's **video_url** to the watch URL —
   `learn.html` renders it as the top player automatically (YouTube, Mux, Vimeo,
   `.mp4`, or a pasted embed all work).
3. Or embed inline in `content_html` (renders as responsive 16:9 thanks to the new
   `.lesson-body iframe` CSS):
   ```html
   <div style="aspect-ratio:16/9;width:100%;border-radius:12px;overflow:hidden;margin:20px 0;">
     <iframe src="https://www.youtube.com/embed/VIDEO_ID" title="…" loading="lazy"
       style="width:100%;height:100%;border:0" allowfullscreen
       allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"></iframe>
   </div>
   ```
4. **Prefer Amanda's own videos** wherever she has them — just drop the URL in
   `video_url`.

Candidate videos found via search (titles/channels indexed and real; **embeddability
still needs your eyeball**):
- Ch 38 (safety/ALARA): "How Safe Are Dental X-Rays? Understanding Radiation Exposure
  and the ALARA Principle" — `youtube.com/watch?v=g1QRDtkKEnw`
- Ch 41 (paralleling): "Dental Assisting: Dental Radiology 1 – Parallel Technique"
  `watch?v=25hPc1IITEs`; "Paralleling Technique and Periapical Radiograph"
  `watch?v=UwrxJ4H8Mtk`
- Ch 39 (processing/digital) & Ch 40 (radiography infection control): no single clean
  candidate surfaced — recommend Amanda's own or a curated pick.

## Sources (accuracy)
- Texas RDA radiology requirement: to place/expose dental x-rays you must hold the
  **TSBDE Dental Assistant Radiology Certificate**; RDA registration requires the
  TSBDE course (x-ray positioning/exposure + jurisprudence + infection control),
  current BLS/CPR, and a human-trafficking-prevention course (or DANB CDA + Texas
  Jurisprudence Assessment). Sources: tsbde.texas.gov (Registered Dental Assistant
  X-Ray Certification) and danb.org (Texas Registered Dental Assistant).
- Radiography subject matter follows the standard Modern Dental Assisting (14th ed.)
  curriculum for Chapters 38–41 (cited as companion reading in each lesson footer);
  Spaulding classification / sensor handling per CDC infection-control guidance.
- Regulatory specifics are framed as "confirm current requirements at tsbde.texas.gov"
  — no statute numbers, fees, or passing scores were invented.

## Remaining backlog (next sessions)
1. **Video pass across all 12 weeks** once there's a verification path (or Amanda's
   own videos) — the single most-requested missing element site-wide.
2. **Thin weeks:** expand Week 12 (state board prep), Week 11, Week 10; backfill
   online Week 4/5 quizzes and Week 11 quizzes.
3. **Polish** Weeks 2, 3, 7, 8, 9 up to the same visual bar (extra diagram/video where
   thin). Week 2 already has good interactive widgets.
4. **Stream A site-wide:** apply the `courses.html` card spec (equal-height rows via
   `items-stretch` + `flex flex-col`/`flex-1`, fixed `aspect-ratio` media, consistent
   radius/border/padding) to `index.html`, the `dental-assistant-school-*-tx` city
   pages, `about`, `graduates`, `apply`, `classes`, `tuition`, `for-offices`.
5. **career-vault** (6 modules / 44 lessons): lift text-only lessons to the same bar.
