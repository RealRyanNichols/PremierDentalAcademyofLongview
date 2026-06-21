# HANDOFF PROMPT — Build out the ONLINE course in Kajabi to mirror the IN-PERSON course

**Copy everything in the "PROMPT" block below and paste it to a browser-capable Claude
(Claude Code on the web / "Cowork") or hand it to a VA with Kajabi admin access.**
It is self-contained. The person/agent running it MUST be logged into the PDA Kajabi
account (only an admin can edit course content — this cannot be done from the website
repo or by an agent without Kajabi access).

---

## PROMPT (copy from here ⬇)

You are helping **Premier Dental Academy of Longview**, a Texas Registered Dental
Assistant (RDA) training school (website: premierdentalacademyoflongview.com). Their
courses are hosted in **Kajabi** (site: `premierdentalacademyoflongview.mykajabi.com`,
library at `/library`).

### The problem
There are two products that are supposed to teach the **same curriculum**:
- **In-Person RDA Program** — complete, all 12 modules built (videos + materials).
- **Online RDA Program** — **modules 6 through 12 are missing/empty.** Students are
  already entering week 6 this week with nothing there. This must be fixed now.

The published curriculum (identical for both programs, per the school's website) is
**12 modules**:

1. Patient check-in & greeting
2. Medical history & vitals
3. Tooth charting
4. Periodontal charting
5. Radiology & imaging
6. **Treatment planning**
7. **Insurance & claims**
8. **Ledger & financials**
9. **Patient communication**
10. **Scheduling & recall**
11. **Clinical documentation**
12. **Practice analytics**

Modules **6–12** (bold) are the ones to build in the Online product so it mirrors
In-Person: same module titles, same order, same content, same drip pace.

### Before you start — ask the owner (Amanda) these 3 questions
1. Are In-Person modules 6–12 fully built in Kajabi (videos + materials), so they can be
   **cloned/duplicated** into Online? Or do any lessons still need to be recorded?
2. Is the Online course **self-paced** (drip = "X days after enrollment") or tied to
   **live cohort dates**? What's the pace — about **one module per week**?
3. Confirm the **exact product names** in Kajabi for the in-person and online programs.

### Task A — Mirror the existing in-person content (PREFERRED, fastest, accurate)
1. Kajabi → **Products** → open the **In-Person RDA Program**. For modules 6–12, note
   each lesson's exact **title, order, description, attached video/PDF, and any quiz**,
   plus the **drip** setting.
2. Copy that content into the **Online RDA Program**. Two routes:
   - **(a) Clone the whole product:** Products → ⋯ on In-Person → **Clone**. Rename the
     clone, then move/copy its modules 6–12 into the live Online product. Best if Online
     is far behind.
   - **(b) Duplicate lesson-by-lesson:** In In-Person, open each module-6–12 lesson →
     **Duplicate** → then **Move to** the Online product (or recreate the lesson in
     Online and paste the same content/video). Best if Online's modules 1–5 are fine and
     you only need to add 6–12.
3. In Online, create modules/categories **6–12 with the SAME titles and order** as
   In-Person and place the copied lessons inside.
4. **Re-attach any video** that didn't carry over and **open each lesson to confirm the
   video plays** and files download.
5. Set the **drip** on Online modules 6–12 to match In-Person's pace (see Task C).

### Task B — If a lesson can't be copied (video-only / missing)
Build the module shell in Online with the title + the short description below + the
matching website tool + quiz (see the build map). **Do NOT invent clinical/dental
instruction.** If a video or material is missing, insert a clearly labeled
**"Video coming — see in-person"** placeholder and **flag it for Amanda** — never
fabricate medical/clinical teaching content, statistics, or credentials.

### Build map — modules 6–12 (titles + the interactive website tool & quiz to embed)
For each module, add a lesson that links the matching practice tool (open in a new tab)
and the matching quiz. To embed: in the Kajabi lesson editor add a **text/button** or
**Custom Code** block with a button linking to the URL. All tools are full web pages —
**link out in a new tab** (don't iframe).

- **6 — Treatment planning:** PDA Practice Pro (treatment-plan workflow)
  `premierdentalacademyoflongview.com/tools/practice-pro` + Skills Lab "Procedures"
  `/skills-lab/procedures` + the treatment/procedures quiz at `/skills-lab/quizzes`.
- **7 — Insurance & claims:** Practice Pro (claims/insurance) `/tools/practice-pro` +
  insurance/claims quiz `/skills-lab/quizzes`.
- **8 — Ledger & financials:** Practice Pro (ledger/reports) `/tools/practice-pro` +
  financials quiz `/skills-lab/quizzes`.
- **9 — Patient communication:** PDA ChairSide `/tools/chairside` + Skills Lab
  communication competencies + patient-communication quiz `/skills-lab/quizzes`.
- **10 — Scheduling & recall:** Practice Pro (scheduling/recall) `/tools/practice-pro` +
  scheduling quiz. **Interviews start around week 10** — add placement/résumé prep here:
  Résumé Builder `/tools/resume-builder`.
- **11 — Clinical documentation:** ChairSide SmartDoc notes `/tools/chairside` +
  charting/documentation quiz `/skills-lab/quizzes`.
- **12 — Practice analytics:** Practice Pro (reports/analytics) `/tools/practice-pro` +
  a final review quiz + the **Graduate Transcript / Competency Passport** wrap-up in the
  Skills Lab `/skills-lab`.

(While you're in there, verify modules **1–5** already exist in Online and match
In-Person. Tool map for those: 1 check-in & 2 vitals → Practice Pro; 3 tooth charting →
`/tools/practice-pro` + `/tools/how-to-chart`; 4 perio charting → Practice Pro; 5
radiology → Skills Lab "X-ray errors" quiz.)

### Task C — Drip / schedule (mirror in-person)
Match the Online drip cadence to In-Person. If In-Person uses **fixed cohort dates** and
Online is **start-any-day**, set Online drip to **"available N days after enrollment"**
at roughly **one module per week** so module 6 unlocks at the same relative time it does
in person. Confirm the exact cadence with Amanda before finalizing.

### Task D — Verify before you call it done
- Enroll a **test student** (or use Kajabi preview) in the Online product and confirm
  **all 12 modules appear**, each lesson has its content, **videos play**, tool/quiz
  links open, and the **drip unlocks correctly**.
- Confirm Online module **titles and order exactly match In-Person**.
- Confirm you did **not** alter or delete anything in the **In-Person** product.

### Guardrails (do not break)
- **Real only:** never fabricate dental/clinical instruction, stats, salary numbers, or
  credentials. Mirror in-person; flag gaps for Amanda instead of inventing.
- Don't change pricing/offers. In-person product is **read-only reference**.
- Keep student data private.

### Report back
A checklist: which of modules 6–12 you built, **how** (cloned vs duplicated vs shell +
flagged), any missing videos/materials you flagged for Amanda, the drip cadence you set,
and the result of the test-student verification.

## PROMPT (⬆ copy to here)

---

### Notes for Amanda (not part of the prompt)
- Source of the 12-module list: it's PDA's own published curriculum on the homepage
  (`index.html`), so it's safe to mirror — it's not invented.
- The single biggest unknown is whether In-Person modules 6–12 are fully built in Kajabi
  (then it's a fast clone) or partly unrecorded (then some lessons need real content from
  you). The prompt asks the operator to confirm this first.
- The website tools/quizzes referenced are already live and free, so they're perfect to
  embed as the "interactive" portion of each online module.
