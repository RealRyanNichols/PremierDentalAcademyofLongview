# Amanda's Skills Lab tool updates (from 3 voice memos, 2026-06-26)

Source: Amanda voice memos — transcribed. Tools live in the repo at `skills-lab/`.

## 1. Virtual Operatory (`skills-lab/virtual-office.html`)
- Add a **separate sterilization room** (sterilization is NOT in the operatory).
  - Add an **ultrasonic**; label that side **"dirty."**
  - Keep the **autoclave** (right side of the picture); label it **"clean."**
- Add **more detail on sterilization + infection control** — emphasize it's a big part of the field and is on the **state board**.
- In the operatory, the computer says "charting" → **add the tooth chart** to show charting happens on the computer.
- The **colorful blocks** have no clear purpose → clarify or remove them.
- In the suction section, add an **HVE** and a **saliva ejector** (label the different sections; they currently just break off).
- On the **setup tray**, show some **instruments**.
- Add a **dental assistant** figure with **job duties**. Positioning: dentist at the head (or patient's right); **dental assistant on the left**.
- X-ray = good as-is. Op light = fine as-is.

## 2. Procedures (`skills-lab/procedures.html`)
- Currently ~6 scenarios (morning operatory setup, crown prep, composite filling, simple extraction, sterilization workflow, emergency appointment).
- Wants **more**: ~**15–20 scenarios**, and/or organized into **levels — beginner / intermediate / expert**.
- Goal: more questions to actually test student knowledge (6 is too short).

## 3. Tray Builder (`skills-lab/tray-builder.html`)
- **Basic exam setup** → only **3 instruments**: mirror, explorer, cotton pliers.
  - Remove the **perio probe** entirely (both of them).
  - Explorer = just an **explorer** icon (no explorer+perio-probe combo).
- **Mirror**: keep the existing "mirror 2x2" icon, but **add a second icon labeled just "mirror."**
- **Cotton pliers**: label **"cotton pliers"** only — remove **"(college)."**
- **Endo tray**: add **explorer, cotton pliers, anesthetic syringe**; **remove dry aids / cotton rolls** (not needed for endo).
- **Extraction tray**: rename **"Simple Extraction" → "Extraction"**; add **anesthetic syringe + mirror.**
- Add a new **"wedge"** icon — goes **with restorative only** (sits between teeth).
- Add a new **"bite block"** icon — holds the patient's mouth open; include in **restorative filling, crown, root canal**.
- **Shuffle the icon order** — keep instruments grouped at top and materials grouped, but randomize order within each group so students can't just click top-to-bottom in order (make it more challenging).
- The **"← All trays"** link at top is hard to see → make it a **visible button.**

---
Status: captured 2026-06-26. To be implemented on branch `claude/site-redesign` (or a tools branch), pushed to the Vercel preview for review.

---

## Virtual Dental Office — full renovation (2026-07-02)

Ryan asked for a complete renovation: "realistic people, realistic situations,
realistic word boxes asking questions that the person has to choose the
instrument for that situation." Shipped on branch
`claude/virtual-dental-office-redesign-vp2ii5`:

- **The Three.js block-figure 3D room is GONE.** `/skills-lab/virtual-office` now
  renders a realistic illustrated operatory (`assets/skills-lab/office-scene.js`,
  layered SVG): contoured patient chair with a reclined patient (bib + safety
  glasses), dentist masked/gloved at the head, the assistant ("you") on the
  patient's LEFT holding the HVE, op light, delivery unit + handpieces, tray with
  visible instruments, cabinetry/sink, x-ray arm, tooth-chart monitor. Same 9
  station pins/legend/progress + preview gating as before. Guided visits zoom the
  camera chairside and highlight whoever is speaking; each patient persona swaps
  into the chair (Emma renders as a child). A separate STERILIZATION ROOM view
  shows the one-way DIRTY -> CLEAN flow (receiving/rinse/ultrasonic -> wrap ->
  autoclave -> sterile storage) with a weekly spore-test log on the wall.
- **Realistic people** (`assets/skills-lab/people-art.js`, `window.SL_PEOPLE`):
  illustrated portrait busts for Dr. Williams, Renee, Carla, "you" and all 8
  patient personas, used in every dialogue box, visit picker, day-shift schedule
  and procedures cards. No more emoji faces.
- **Realistic instruments** (`assets/skills-lab/instrument-art.js`,
  `window.SL_ART`, overrides `SL_ICON_FOR`): full-length vector art for all 67
  instruments/materials, used across the instrument library, tray builder,
  quizzes thumbs and the new instrument questions.
- **Choose-the-instrument word boxes**: the scenario player renders every step as
  a conversation (portrait + speech bubble). New step type `instrument` = the
  dentist describes the moment ("Time for the cord — I need to seat it into the
  sulcus before we take the impression. Hand me…") and the student picks the
  right instrument off a stainless tray strip. 29 of these are woven through the
  scenarios + day-shift appointments; distractors are plausible same-tray
  instruments; every answer is clinically correct.
- **Tray Builder**: setting the tray is now visual — a stainless tray with a teal
  liner on a counter, instruments lie full-length in order of use with ✓/✗
  grading in place, and the shelf is a supply drawer with organizer bins.
- 3D leftovers (importmap/three.js CDN dependency) removed; everything is
  self-hosted vector art, so it renders identically on phones and school
  computers with no WebGL/CDN dependency.

Earlier items below are superseded by this renovation but kept for history.

---

## Virtual Operatory — 3D geometry status (2026-06-27)

DONE in `skills-lab/virtual-office.html` (Three.js scene builder):
- **Tooth chart on the operatory computer** — the monitor screen now renders a real
  charting-software tooth chart (two arches, a highlighted tooth #14 MOD, schedule
  /insurance footer) via a CanvasTexture (`chartTexture()`).
- **Removed the colorful blocks** — the blue/green/purple counter cubes are now a
  clean off-white glove-box dispenser rack (S/M/L) with a teal opening lip. Red
  sharps container kept (realistic).

REMAINING 3D (best implemented against the live Vercel preview — they need visual
iteration this headless env can't render: WebGL + the three.js CDN aren't available
locally, so coordinates can't be eyeballed here):
- **Separate sterilization ROOM.** Today the autoclave sits on the back counter,
  which contradicts the station copy ("you never sterilize chairside"). Add a small
  partitioned alcove (e.g., behind the back-right wall, reached past the door) split
  DIRTY → CLEAN: DIRTY side = ultrasonic cleaner (small box + lid) near a rinse sink;
  CLEAN side = the autoclave (move the existing autoclave there) + pouch storage.
  Add a one-way arrow decal. Re-point the `steri` anchor to the new location.
- **Distinct HVE + saliva-ejector tips.** The two delivery hoses exist; add a wide
  angled HVE tip and a thinner saliva-ejector tip at the hose ends so they read as
  the two suction types the copy teaches.
- **Dental-assistant figure on the patient's LEFT.** A stool exists (currently x≈+1.2,
  delivery-unit side). Add a seated DA figure (mirror the dentist figure build) on the
  patient's left and confirm the side on the preview; wire its existing "assistant"
  duties hotspot to it.

Guardrail: keep `assets/skills-lab/data/virtual-office.js` valid JS; don't change the
station copy (already approved). Verify each change on the PR #137 preview before merge.
