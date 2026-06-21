# How to paste Weeks 7–12 into Kajabi

These files are **draft content** for the **Online Dental Assistant Program**
(Kajabi product `2149362906`). Kajabi has no API for creating lessons/quizzes,
so each file is pasted by hand (or by a browser agent). Work through
`INDEX.md` top to bottom and check off each item as you go.

> Everything here is **DRAFT for Ryan/Amanda review**. Read each lesson before
> publishing, and resolve every **`[VERIFY: Amanda]`** note first. Leave lessons
> set to **Draft** in Kajabi until you've reviewed them.

## Paste a LESSON (`.html` files)
1. In Kajabi: **Products → Online Dental Assistant Program**.
2. Open the correct **week module** (Week 7, Week 8, …).
3. **Add Content → Lesson**. Title it to match `INDEX.md` (e.g. "Ch 44 — Dental Liners, Bases & Bonding Systems").
4. Click into the lesson's rich-text editor. If there's a source/code (`< >`) view, switch to it and paste the file's HTML there; otherwise paste into the normal editor (the markup is simple — headings, paragraphs, lists).
5. Open the `.html` file, copy **all** of it, paste it in.
6. Remove any `[VERIFY: Amanda]` notes only **after** you've confirmed/edited the fact they flag.
7. Leave the lesson **Draft**. Save.

## Paste a QUIZ (`*-quiz.json` files)
Kajabi quizzes are built question-by-question; the JSON is the question bank to copy from.
1. In the same week module: **Add Content → Quiz** (or Assessment). Title it to match `INDEX.md` (e.g. "Ch 44 Quiz").
2. Open the `*-quiz.json` file. For each object in the array:
   - **Add Question** → paste the `question` text.
   - Add each string in `choices` as an answer option (multiple choice).
   - Mark the option at `correctIndex` (0-based: 0 = first choice) as the correct answer.
   - If Kajabi supports answer feedback/explanations, paste the `rationale` there.
3. Repeat for all questions in the file.
4. Leave the quiz **Draft**. Save.

## Week 12
Week 12 is a **placeholder only** — open `week12/week12-state-board-prep-PLACEHOLDER.html`,
which lists what Amanda needs to insert from the official TSBDE materials. Do **not**
publish fabricated licensing rules, fees, or procedures.

## Tips
- Paste in the order shown in `INDEX.md` so the module lessons land in sequence.
- After pasting a week, preview it as a student to confirm formatting.
- Keep the whole set Draft until Ryan/Amanda sign off, then publish per week.
