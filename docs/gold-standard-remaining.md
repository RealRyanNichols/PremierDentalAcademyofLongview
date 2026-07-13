# Gold-standard content pass — REMAINING lessons (resume list)

As of 2026-07-12, ~half of both 12-week RDA courses are rebuilt to the Chapter 2
gold standard (rich original content + inline SVG visuals + `<dl>` glossary +
ungraded practice MCQs), saved live to both `online-rda-12-week` and `rda-program`.
A parallel agent batch hit the Fable 5 usage cap mid-run; the lessons below are the
ones still at their thin pre-pass version and need the pass.

**How to finish (one clean batch, after usage resets):** for each lesson below, run
the gold-standard brief at `scratchpad/gold-standard-brief.md` (or inline the same
spec) — read Chapter 2 (`6087b627-2bc4-42b6-b99d-143f99c2a1cd`) as the reference,
fold in the Kajabi export substance via the `export-reader` edge function, write
original PDA-voice content with 1–2 original SVGs + glossary + 3–6 practice MCQs, and
save to BOTH the online and rda ids. Keep chapters 15k–25k; keep the four `Review`
lessons to 8k–12k. **Compliance:** concepts only — no specific TSBDE rule numbers /
fees stated as fact (one earlier lesson cited "Rule 108.24"; scan for and soften any
such citations across ALL rewritten lessons in the final verify pass).

## DONE (do not touch): Ch 2, 3, 4, 5, 11, 12, 16, 19, 20, 21, 23, 27, 33, 34, 35, 38, 39, 40, 41, 43, 44, 48, 49(wk7+wk8), 46, 50, 52, 55; Specialties/Duties companions; State Board Game Plan.

### WAVE 2026-07-13 (Opus main-thread, both course IDs, dollar-quoted SQL):
- Ch 5 Jurisprudence — 17.3k, 6 MCQs, concepts-only, no rule numbers ✅
- Ch 39 Imaging & Processing — 14.2k, 6 MCQs ✅
- Ch 41 Intraoral Imaging — 13.3k, 6 MCQs, interactive_key=radiography_positioning ✅
- Ch 23 Chemical & Waste Management — 12.4k, 6 MCQs ✅
- Ch 33 Delivering Dental Care — 11.9k, 6 MCQs ✅
- Ch 49 Review (wk8, online only) — copied from wk7 Ch 49 ✅

## REMAINING (online id · rda id)

### Full chapters (12k–20k)
- Ch 28 Oral Diagnosis & Treatment Planning — `2afaa478-76d2-47b8-b31d-9f769d627d50` · `81a4e85c-c044-4814-a703-ead2ae52eeda`
- Ch 32 The Dental Office — `5be03507-4fb3-46b2-9655-ea4b3a51c322` · `cdacb424-7629-4124-9421-d7b78e380896`
- Ch 47 Laboratory Materials & Procedures — `20e18008-3ea6-449a-94a1-8a4ada2be462` · `0f3d9273-516f-4d71-aeb9-88d3e8d519cd`
- Ch 51 Provisional Coverage — `2efc0d75-6d62-47bd-92d3-6eb7c18f6f94` · `5ded17ab-5dc7-42e8-bca4-ce0836f8c011`
- Ch 54 Endodontics — `16912307-1bc7-4e3e-8140-038f63dc0087` · `5e76edb5-7243-4425-96e1-692f21e3d035`
- Ch 56 Oral & Maxillofacial Surgery — `3bcf4699-e563-4441-9bf8-47ebdf006aa4` · `9b8b700f-f973-45f3-a1a2-92161bf5e78d`
- Ch 57 Pediatric Dentistry — `82f9fbb6-5819-432d-ba4b-8427eaca5085` · `20546f20-06c6-4ab4-bb67-5a30108901b0`
- Ch 59 Dental Sealants — `b456d3c7-2c8f-4548-bca6-cfa1305b22d7` · `64663ebf-3e53-4519-a11d-9afe3902bdfa`
- Ch 60 Orthodontics — `d4cf4970-4bed-4563-b235-62f1fefbaf08` · `4a0eb8c5-0bee-4efe-a57e-204b06428761`
- Ch 64 Marketing Your Skills (career) — `82651699-fdfb-4fb5-8c3a-6d2cb80cc05c` · `78d95de7-d0e2-4fb1-b64b-1b1a7c9815a0`

### Review lessons (8k–12k, exam-prep structure)
- Ch 38 Review — `f87668af-3431-445e-b9ec-c97252a644e7` · `cc3ba12c-482f-4e66-8177-26793f7d40e8`
- Ch 39 Review — `384a5c70-d91b-40af-98a8-22469eeaa869` · `7d4536ce-326b-4bd5-8b80-1ae5fec39f64`
- Ch 40 Review — `fd20b63a-626a-4033-b9f5-7d006c560a8f` · `57a7e045-9276-40da-88a0-d26a33c2f194`
- Ch 41 Review — `33e74edf-4ff6-49f6-b49d-7e26018a81f7` · `7cdd4567-f308-41df-a8e6-5f1c19235493`

### Career/exam action pages (5k–8k)
- Build Your Résumé — `124313a2-c8a7-4aa0-b7e5-515c37f60e83` · `cfbc89a1-2b1c-4980-af38-1ac03116fab7`
- Mock Interview Practice — `0b72d7c9-762d-4c67-9ee1-d5c789462beb` · `15e0c44e-0c62-49f0-9472-b36b5e96897b`
- Full Mock State Board Exam — `c37f3957-ecc2-4ee6-a0df-65e9d3023ee4` · `b5cbd43b-c559-4da9-9b18-a4d80154ffab`
- Flashcard Final Review — `f940f1a4-6655-4d19-ba3a-3ec029a88454` · `610dff81-7bd4-4b10-a873-032ef0492127`
- Graduation & Your Next Step — `cd6a7944-f1ef-48e0-a2fe-3b900be6dde6` · `a995fdb0-ab4b-4943-a126-b77c38978bcc`

### One-liner (online only): Ch 49 Review (wk 8) — copy the completed wk-7 Ch 49 content:
`update course_lessons set content_html=(select content_html from course_lessons where id='65a5bcbf-0215-4d55-8f07-8a88d1637c20'), practice_json=(select practice_json from course_lessons where id='65a5bcbf-0215-4d55-8f07-8a88d1637c20'), estimated_minutes=(select estimated_minutes from course_lessons where id='65a5bcbf-0215-4d55-8f07-8a88d1637c20') where id='f7667cf8-54f8-4351-b03f-3e0a2e8209d6';`

## Amanda's per-chapter handout PDFs (still needed to literally fold in her material)
Every agent found the exported Kajabi lesson bodies were thin overviews — the real
teaching substance lived in **downloadable PDFs** (e.g. `Chapter-12-Tooth-Morphology.pdf`,
`Chapter-16-Periodontal-Disease.pdf`, `Chapter-19-Disease-Transmission-and-Infection-Prevention.pdf`, `20-Principles-and-Techniques-of-Disinfection.pdf`, …). Those PDFs are
NOT in the `course-assets/kajabi-export/` upload (only `.html` page captures + `.meta.json`).
The current lessons are built from standard curriculum facts in original PDA words (safe,
complete). To mirror Amanda's exact handouts, add the per-chapter PDFs to
`course-assets/kajabi-export/<course>/weekNN/` and re-run a "fold-in" pass — the export
prompt in `docs/COWORK-KAJABI-COURSE-EXPORT.md` covers capturing them.
