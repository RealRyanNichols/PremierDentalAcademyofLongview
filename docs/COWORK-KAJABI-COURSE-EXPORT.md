# Cowork prompt — FULL Kajabi course export (visual fidelity + the book)
*(July 11, 2026 — owner directive: the site courses must contain EVERYTHING the Kajabi
courses contain — pictures, videos, graphs, charts, wording, the Modern Dental Assisting
14th-edition chapter downloads, quizzes — and look like them. Paste the prompt below into
a browser-capable Claude (Cowork / local agent mode) on Amanda's Mac.)*

The site is already ready to receive all of it: lessons have an `attachments` field
(signed downloads from the private `course-assets` bucket), the player renders images/
video/quizzes, and the ingest work order is at the bottom of this file.

---

## PROMPT — copy everything below this line

You are exporting Premier Dental Academy's complete Kajabi courses so they can be
rebuilt with full fidelity on the school's own website. Use Chrome. Work
methodically — one lesson at a time, nothing skipped. Everything you capture goes in
one export folder on the Desktop: `kajabi-export/`.

### Setup
1. Open Chrome and sign in at app.kajabi.com (Amanda's login).
2. On the Desktop create `kajabi-export/` with subfolders `in-person/` and `online/`.
3. You will produce, for EACH course: one folder per week/module, an `INDEX.md`
   manifest, full-page screenshots, lesson HTML, every image, every download (the
   book chapters!), every video URL, and every quiz.

### Course 1 (do this one FIRST): the 12-Week In-Person course
Kajabi → Products → the Registered Dental Assistant Program (product id 2149312762).

For EVERY module/week, in order:
1. Screenshot the module outline (the lesson list) BEFORE opening anything —
   save as `in-person/week01/_outline.png`. This captures the true lesson ORDER.
2. Open EVERY lesson in the module, one by one, and for each:
   a. **View it as a student sees it** (use the post preview if available) and take
      full-page screenshots — scroll and capture everything, top to bottom. Save as
      `in-person/week01/03-chapter-2-dental-healthcare-team.png` (number = its
      position in the module, then a slug of its title). Multi-part screenshots:
      add `-2`, `-3`.
   b. **Copy the lesson body HTML**: open the lesson in the editor, use the HTML/
      code view of the content editor, copy ALL of it, save as the matching
      `.html` file (same name as the screenshot). If there is no code view, use
      DevTools (right-click the content area → Inspect → copy outerHTML of the
      content container).
   c. **Download every attached file** — THIS IS CRITICAL: each chapter lesson
      contains the matching **Modern Dental Assisting, 14th edition** chapter as a
      download (the full book is distributed across the chapters). Download every
      one and name it `mda14-ch02.pdf`, `mda14-ch03.pdf`, … matching the chapter
      number. Non-book downloads (worksheets, packets, resume files) keep a clear
      name: `week11-resume-pack.zip`. Save into the week folder.
   d. **Save every image** in the lesson body (diagrams, charts, photos): download
      each (right-click → Save image as, or collect the image URLs from the HTML)
      into `in-person/week01/img/` with names like `03-fig1-tooth-numbering.png`.
   e. **Record every video**: note the video URL and host (YouTube / Wistia /
      Kajabi-hosted) in the manifest. If it is Kajabi/Wistia-hosted (not YouTube),
      ALSO download the video file if a download option exists — those must move
      to our own video host (Mux) before Kajabi is canceled.
   f. **Quizzes/assessments**: open each quiz in the builder and capture EVERY
      question — the question text, all choices, the correct answer, and any
      explanation. Best: copy into `in-person/week01/04-chapter-2-quiz.md` as a
      list. Also screenshot each question as backup.
3. Append every lesson to `in-person/INDEX.md` as you go:
   `| week | position | lesson title | type | files saved | video url/host | downloads |`

### Course 2 (same treatment): the Online 12-Week course
Kajabi → Products → Online Dental Assistant Program (product id 2149362906).
Repeat the exact same process into `online/`. Where a lesson is byte-identical to the
in-person version, you may note "same as in-person weekNN/NN" in the INDEX instead of
re-saving files — but screenshots of every outline are still required (the ORDER may
differ, and the site must match it).

### Also grab (10 minutes)
- Products → any **free download products** (Resume Pack, LinkedIn Kit, Career Tools):
  download their files into `kajabi-export/downloads/`.
- Settings → API (or Integrations): if the API credential has permission/scope
  checkboxes, enable read access to Courses/Products/Posts and note that you did —
  it lets the website sync automatically later.

### Deliver the export
Binaries are large (the book PDFs + images), so split the delivery:
1. **All PDFs, images, videos, downloads** → upload to Supabase Storage:
   supabase.com → project `lmbsuwslsycukynzpzik` → Storage → bucket `course-assets`
   → create folder `kajabi-export/` → drag the whole Desktop folder in (keep the
   folder structure). This bucket is PRIVATE — the book chapters must never go in a
   public bucket or the GitHub repo.
2. **HTML files, INDEX.md manifests, quiz .md files, outline screenshots** → also
   upload to `course-assets/kajabi-export/` (they ride along fine).
3. Post a completion report: lesson counts per course (must match the outlines),
   number of book-chapter PDFs captured, any lesson you could not export and why,
   and the list of Kajabi/Wistia-hosted videos found.

Do not cancel or change anything inside Kajabi — this is a read-and-copy job only.

---

## After the export lands — work order for the next Claude Code session

```
Work in RealRyanNichols/PremierDentalAcademyofLongview (read CLAUDE.md + this file).
The kajabi-export/ folder is in the course-assets bucket. Rebuild full visual fidelity:

1. RECONCILE ORDER: read every _outline.png + INDEX.md; make course_modules/
   course_lessons order match Kajabi exactly for both courses (update sort/
   lesson_number; add any lesson Kajabi has that the site lacks, using the exported
   HTML as its content).
2. BOOK CHAPTERS: for every chapter lesson, set course_lessons.attachments =
   [{"path":"kajabi-export/.../mda14-chNN.pdf","label":"Read Chapter NN — Modern
   Dental Assisting (14th ed.)"}]. The /learn player already renders these as signed
   -URL download buttons (private bucket, signed 1-hour links, students only).
3. IMAGES/CHARTS/GRAPHS: for each lesson with exported images, move them to
   course-assets/lesson-media/<course>/<week>/, and rebuild the lesson's
   content_html to include them via <img> at the right positions (compare the
   full-page screenshot to placement). Public rendering: use signed URLs is NOT
   viable inside content_html — instead copy lesson images to a PUBLIC bucket
   folder (lesson media images are illustrative; the BOOK stays private) or inline
   small diagrams as data URIs. Match the screenshot layout.
4. WORDING: where the exported Kajabi HTML differs from the site lesson, the KAJABI
   version wins (owner directive) — replace content_html with the exported body,
   then keep the site's extra sections (Exam focus, tool links) BELOW it.
5. QUIZZES: replace quiz_json with the exported Kajabi questions verbatim
   (converted to [{question,choices,correct_index,explanation}]); keep site-authored
   questions only where Kajabi had no quiz.
6. VIDEOS: YouTube URLs stay in video_url. Kajabi/Wistia-hosted videos: upload the
   downloaded files to Mux (tokens are in Vercel env by then), set mux_playback_id.
7. VERIFY: /learn week by week against the screenshots — same order, same images,
   same downloads, same quizzes. npm test, CHANGELOG, PR.
```
