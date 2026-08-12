/* ============================================================================
   PREMIER DENTAL ACADEMY OF LONGVIEW — RDA PRACTICE QUESTION BANKS
   ----------------------------------------------------------------------------
   WHAT THIS IS
   90 multiple-choice practice questions written at Registered Dental Assistant
   credentialing-exam level, split into three banks of 30. Every item carries a
   rationale that explains why the keyed answer is correct and, where a
   distractor is a predictable confusion, why the tempting wrong answer fails.

   WHY IT EXISTS
   The Skills Lab bank (assets/skills-lab/data.js) is a mixed-format practice
   deck built around day-one job readiness. This file is separate and narrower:
   four-option multiple choice at exam level, tagged by DOMAIN so a student can
   be shown a per-domain score report ("infection control 8/12, radiography
   5/15") and sent back to the right module. No question here duplicates the
   Skills Lab deck.

   HOW TO USE IT
   Plain browser global — no build step, no ES modules. Load with a normal
   <script src="/assets/exam/rda-question-banks.js"></script> and read
   window.PDA_EXAM_BANKS.

   SHAPE
     window.PDA_EXAM_BANKS = {
       reviewStatus: string,
       DOMAINS: [ { id, title, blurb } ],
       BANKS:   [ { id, title, blurb, questions: [
                    { id, domain, difficulty, q, options[4], answer, rationale }
                  ] } ]
     }
   `answer` is the ZERO-BASED index into `options`.
   `difficulty` is 'beginner' | 'intermediate' | 'advanced'.
   `domain` matches a DOMAINS[].id so scores can be rolled up per domain.

   *** REVIEW GATE — DO NOT REMOVE ***
   `reviewStatus` is load-bearing. The consuming page reads it and refuses to
   render publicly while it still begins with "DRAFT". This content has NOT been
   reviewed by the school owner. Amanda Williams must read all 90 items and sign
   off before this is shown to students; when she does, change reviewStatus (and
   record the date) — do not delete the field.

   ACCURACY NOTES FOR THE REVIEWER
   - DANB reports results as a SCALED SCORE (400 to pass on a 100-900 scale),
     never a percent correct. No item here implies a percentage cut score.
   - Charting symbols and colors are NOT nationally standardized; they vary by
     office and by software. Items touching documentation say so.
   - Texas jurisprudence items reflect the general structure of Texas State Board
     of Dental Examiners rules. Rules change — verify current requirements at
     tsbde.texas.gov before this goes live, and re-verify at each annual review.
   ============================================================================ */
(function () {
  'use strict';

  /* ---- DOMAINS — score-report buckets ---- */
  var DOMAINS = [
    { id: 'infection_control', title: 'Infection Control',
      blurb: 'Hand hygiene, PPE, instrument reprocessing, sterilization monitoring, surface and waste management.' },
    { id: 'safety', title: 'Occupational Safety & Emergencies',
      blurb: 'OSHA bloodborne pathogens and hazard communication, sharps handling, hazardous materials, medical emergency response.' },
    { id: 'jurisprudence', title: 'Texas Jurisprudence & Scope of Practice',
      blurb: 'Who regulates dental assistants in Texas, what may and may not be delegated, records, privacy and mandatory reporting.' },
    { id: 'radiography', title: 'Radiography',
      blurb: 'Radiation physics and protection, exposure factors, projection technique, receptors and image quality.' },
    { id: 'dental_anatomy', title: 'Dental & Head-Neck Anatomy',
      blurb: 'Tooth morphology, dentitions and eruption, supporting structures, radiographic landmarks, nerves and muscles.' },
    { id: 'chairside', title: 'Chairside Assisting',
      blurb: 'Ergonomics and zones, isolation and evacuation, instrument delivery, anesthesia support, procedure sequencing.' },
    { id: 'dental_materials', title: 'Dental Materials',
      blurb: 'Impression materials, gypsum, cements, liners and bases, restorative materials and their handling.' },
    { id: 'patient_management', title: 'Patient Management & Documentation',
      blurb: 'Communication, consent, medical history red flags, behavior guidance, vital signs and record keeping.' }
  ];

  /* =========================================================================
     BANK 1 — INFECTION CONTROL, SAFETY, AND JURISPRUDENCE
     ========================================================================= */
  var BANK_1 = [
    { id: 'b1q01', domain: 'infection_control', difficulty: 'beginner',
      q: 'Your hands are visibly soiled after a procedure. Which hand hygiene method is appropriate?',
      options: [
        'An alcohol-based hand rub, because it is faster',
        'Washing with soap and water',
        'A second pair of gloves over the first',
        'A surface disinfectant wipe on the hands'
      ],
      answer: 1,
      rationale: 'CDC hand hygiene guidance: when hands are visibly soiled with blood, saliva, or other material, wash with soap and water. Alcohol rubs are convenient and effective on hands that are not visibly soiled, but alcohol does not remove physical debris — that is why option A is the tempting wrong answer. Never substitute a surface disinfectant, which is formulated for hard surfaces and not for skin.' },

    { id: 'b1q02', domain: 'infection_control', difficulty: 'beginner',
      q: 'How must a high-speed handpiece be reprocessed between patients?',
      options: [
        'Wiped with an intermediate-level surface disinfectant',
        'Sprayed with lubricant and reused',
        'Heat-sterilized after cleaning and lubrication per the manufacturer',
        'Soaked in a holding solution until the end of the day'
      ],
      answer: 2,
      rationale: 'Handpieces and other devices that attach to air and waterlines must be heat-sterilized between patients — they draw in and expel patient material internally, so surface wiping cannot reach the contamination. Surface disinfection (option A) is the common wrong answer because the outside of a handpiece looks clean once wiped; it is not sufficient.' },

    { id: 'b1q03', domain: 'infection_control', difficulty: 'intermediate',
      q: 'Which spore-forming organism is used in the biological indicator that tests a steam autoclave?',
      options: [
        'Geobacillus stearothermophilus',
        'Staphylococcus aureus',
        'Mycobacterium tuberculosis',
        'Candida albicans'
      ],
      answer: 0,
      rationale: 'Geobacillus stearothermophilus spores are highly resistant to moist heat, so their destruction is meaningful evidence that a steam cycle worked. The distractors are all clinically important organisms but none is a heat-resistant spore former; Mycobacterium tuberculosis tempts students because it is the benchmark for tuberculocidal SURFACE disinfectants, which is a different test entirely.' },

    { id: 'b1q04', domain: 'infection_control', difficulty: 'advanced',
      q: 'A weekly spore test on the office autoclave comes back POSITIVE (growth). What is the correct response?',
      options: [
        'Run the load again and release the instruments if the tape changes color',
        'Take the sterilizer out of service, repeat the test, and recall and reprocess items back to the last negative biological indicator',
        'Continue using the sterilizer while waiting for the next weekly test',
        'Increase the cycle time and keep using the current packages'
      ],
      answer: 1,
      rationale: 'A failed biological indicator means the sterilizer cannot be trusted, so it goes out of service, the failure is investigated and retested, and every load processed since the last negative spore test is retrieved and reprocessed. Option A is the trap: process indicator tape shows a package was exposed to heat, not that spores died, so it cannot clear a failed load.' },

    { id: 'b1q05', domain: 'infection_control', difficulty: 'intermediate',
      q: 'In instrument reprocessing, which step must be completed BEFORE instruments are packaged for sterilization?',
      options: [
        'Thorough cleaning to remove all bioburden',
        'Application of a surface disinfectant',
        'Air-drying overnight on an open tray',
        'Labeling with the patient name'
      ],
      answer: 0,
      rationale: 'The reprocessing order is transport, cleaning (ultrasonic unit or instrument washer), inspection and drying, packaging, sterilization, then storage. Blood and debris insulate microorganisms from steam, so a dirty instrument can survive a perfect cycle. Surface disinfectant is intended for operatory surfaces, not for instruments headed to an autoclave.' },

    { id: 'b1q06', domain: 'infection_control', difficulty: 'beginner',
      q: 'Which gloves are appropriate for cleaning the operatory and handling contaminated instruments?',
      options: [
        'The same examination gloves worn during the procedure',
        'No gloves, as long as hands are washed afterward',
        'Sterile surgical gloves',
        'Heavy-duty puncture-resistant utility gloves'
      ],
      answer: 3,
      rationale: 'Utility gloves are thicker and puncture-resistant, which matters when you are handling sharp contaminated instruments and chemicals. Thin examination gloves (option A) tear easily and are designed for patient contact, not cleanup. Utility gloves may be washed, disinfected, and reused by the same worker until they show signs of cracking or wear.' },

    { id: 'b1q07', domain: 'infection_control', difficulty: 'intermediate',
      q: 'When using a surface disinfectant between patients, the "contact time" (wet time) on the label means the surface must:',
      options: [
        'Be sprayed for that many seconds',
        'Remain visibly wet with the product for the stated time',
        'Be scrubbed for that many minutes and then rinsed',
        'Air-dry for that long before the product is applied'
      ],
      answer: 1,
      rationale: 'A disinfectant achieves its label kill claim after remaining in continuous wet contact with the surface for the stated time — commonly one to ten minutes depending on the product. Wiping a surface and letting it dry in twenty seconds is the frequent real-world error. If the surface dries early, reapply.' },

    { id: 'b1q08', domain: 'infection_control', difficulty: 'advanced',
      q: 'A clinical contact surface has visible blood on it. What level of disinfectant is indicated?',
      options: [
        'A low-level, EPA-registered hospital disinfectant',
        'An EPA-registered hospital disinfectant with a tuberculocidal claim (intermediate level)',
        'Plain soap and water',
        'A high-level disinfectant used for immersion of semi-critical items'
      ],
      answer: 1,
      rationale: 'CDC guidance calls for an intermediate-level product — one carrying a tuberculocidal claim — when a surface is contaminated with blood, after the blood is first cleaned up with absorbent material. Low-level products (option A) are acceptable for surfaces without visible blood, which is why they are the tempting choice. High-level disinfectants are for immersing heat-sensitive semi-critical instruments, not for wiping counters.' },

    { id: 'b1q09', domain: 'infection_control', difficulty: 'beginner',
      q: 'How often should a surgical mask be changed?',
      options: [
        'Once per half day',
        'When it becomes visibly contaminated, and between patients or when it becomes damp',
        'When the elastic loops break',
        'At the end of each week'
      ],
      answer: 1,
      rationale: 'Masks are changed between patients and any time they become wet or soiled, because a damp mask loses filtration efficiency and wicks contamination toward the face. Wearing one mask for a half day is a widespread habit and a genuine infection control failure.' },

    { id: 'b1q10', domain: 'infection_control', difficulty: 'intermediate',
      q: 'Contaminated instruments are being carried from the operatory to the sterilization area. They must be transported in a container that is:',
      options: [
        'Open, so the instruments can begin air-drying',
        'Covered, puncture-resistant, leak-proof, and labeled with the biohazard symbol',
        'Made of paper so it can be discarded',
        'Wrapped in a sterilization pouch'
      ],
      answer: 1,
      rationale: 'OSHA requires contaminated sharps and instruments to be moved in a closed, puncture-resistant, leak-proof, labeled container so no one is stuck or splashed in transit. An open tray (option A) is common practice in some offices and is a citable hazard.' },

    { id: 'b1q11', domain: 'infection_control', difficulty: 'advanced',
      q: 'Extracted teeth that are NOT being returned to the patient should be:',
      options: [
        'Placed in the regular trash after rinsing',
        'Handled as regulated medical waste, with teeth containing amalgam kept out of any waste stream that will be incinerated',
        'Autoclaved and then placed in the sharps container regardless of restorations',
        'Stored in the operatory for use as teaching models without further handling'
      ],
      answer: 1,
      rationale: 'Extracted teeth are potentially infectious and are managed as regulated medical waste. Teeth containing amalgam are kept out of incineration streams because heating amalgam releases mercury vapor — they go to an amalgam recycler instead. Teeth returned to the patient are exempt from the regulated-waste requirement, which is a distinction students often miss.' },

    { id: 'b1q12', domain: 'infection_control', difficulty: 'advanced',
      q: 'The aluminum foil test performed periodically on an ultrasonic cleaner is used to check:',
      options: [
        'Whether the solution has reached sterilizing temperature',
        'Whether the unit is generating cavitation activity throughout the tank',
        'Whether the instruments are made of stainless steel',
        'Whether the solution pH is correct'
      ],
      answer: 1,
      rationale: 'A strip of foil suspended in the tank should show uniform pitting and small holes after a short cycle, showing that cavitation is occurring across the tank. An ultrasonic cleaner does not sterilize and does not need to reach a sterilizing temperature, so option A misreads the purpose of the device entirely: it cleans, and cleaning precedes sterilization.' },

    { id: 'b1q13', domain: 'safety', difficulty: 'beginner',
      q: 'Under the OSHA Bloodborne Pathogens Standard, the hepatitis B vaccination series must be:',
      options: [
        'Purchased by the employee before the first day of work',
        'Offered by the employer at no cost to the employee, within 10 working days of assignment to duties with exposure risk',
        'Required of every employee with no option to decline',
        'Offered after the first documented exposure incident'
      ],
      answer: 1,
      rationale: 'The employer offers the series free of charge within 10 working days of initial assignment to tasks with occupational exposure. An employee may decline, but must sign the OSHA declination statement. Option C is the common misunderstanding — the vaccine is offered, not compelled — and option D reverses the point of a preventive vaccine.' },

    { id: 'b1q14', domain: 'safety', difficulty: 'intermediate',
      q: 'You sustain a needlestick from a contaminated needle. What is the correct immediate sequence?',
      options: [
        'Squeeze the wound to force out blood, then apply bleach',
        'Wash the area with soap and water, report the exposure immediately, and obtain a confidential medical evaluation',
        'Finish the procedure, then note it in the log at the end of the day',
        'Rinse with an alcohol hand rub and continue working'
      ],
      answer: 1,
      rationale: 'Wash, report, and get evaluated promptly — post-exposure prophylaxis decisions are time-sensitive, and the employer must provide the evaluation at no cost. Squeezing the wound and applying caustic agents such as bleach is folk practice with no evidence of benefit and real risk of tissue damage. Delaying the report until end of day (option C) can put effective prophylaxis out of reach.' },

    { id: 'b1q15', domain: 'safety', difficulty: 'beginner',
      q: 'If a needle must be recapped between injections on the same patient, the accepted method is:',
      options: [
        'Two-handed recapping while looking directly at the needle',
        'A one-handed scoop technique or a mechanical recapping device',
        'Bending the needle first so it will not roll',
        'Passing the uncapped syringe to a coworker to cap'
      ],
      answer: 1,
      rationale: 'OSHA prohibits two-handed recapping. The one-handed scoop, or a recapping device or forceps, keeps the free hand away from the needle path. Bending or breaking needles is specifically prohibited, and handing off an uncapped syringe simply transfers the risk to someone else.' },

    { id: 'b1q16', domain: 'safety', difficulty: 'intermediate',
      q: 'A sharps container must be:',
      options: [
        'Clear glass so the contents are visible',
        'Closable, puncture-resistant, leak-proof on the sides and bottom, labeled or color-coded, and replaced before it is overfilled',
        'Emptied into the regular trash at the end of each week',
        'Stored in a locked cabinet away from the operatory'
      ],
      answer: 1,
      rationale: 'Those construction and labeling requirements come straight from the Bloodborne Pathogens Standard, and containers are routinely replaced at roughly three-quarters full so nothing protrudes. Storing the container far from the point of use (option D) is the subtle wrong answer: sharps containers belong as close as practical to where sharps are used, which is what reduces injuries.' },

    { id: 'b1q17', domain: 'safety', difficulty: 'beginner',
      q: 'Where do you look up the health hazards, first-aid measures, and handling requirements for a chemical used in the office?',
      options: [
        'The Safety Data Sheet (SDS) for that product',
        'The sterilization log',
        'The patient record',
        'The product invoice'
      ],
      answer: 0,
      rationale: 'Under the OSHA Hazard Communication Standard, every hazardous chemical has a Safety Data Sheet in a standardized 16-section format, and the office must keep them readily accessible to employees during every shift. Knowing where the SDS binder or digital library lives is a first-week task in any dental office.' },

    { id: 'b1q18', domain: 'safety', difficulty: 'intermediate',
      q: 'On a GHS-compliant chemical label, the signal word "Danger" compared with "Warning" indicates:',
      options: [
        'A more severe hazard',
        'A less severe hazard',
        'A flammable product specifically',
        'A product that requires no personal protective equipment'
      ],
      answer: 0,
      rationale: 'GHS labels use two signal words: "Danger" for the more severe hazard categories and "Warning" for the less severe ones. Students sometimes assume the words are interchangeable emphasis; they are defined terms, and a label carries one or the other, never both.' },

    { id: 'b1q19', domain: 'safety', difficulty: 'intermediate',
      q: 'Scrap amalgam removed during a restorative procedure should be:',
      options: [
        'Rinsed down the operatory drain',
        'Placed in the red biohazard bag',
        'Collected in a labeled, covered container and sent to an amalgam recycler, with chairside traps and an amalgam separator in use',
        'Autoclaved and discarded with regular waste'
      ],
      answer: 2,
      rationale: 'Amalgam waste is a mercury issue, not an infection issue. It is stored dry or per the recycler instruction in a covered, labeled container and recycled, and EPA rules require an amalgam separator on the wastewater line. Options A, B, and D each route mercury somewhere it does not belong — the drain, an incinerator, or a heat cycle that volatilizes it.' },

    { id: 'b1q20', domain: 'safety', difficulty: 'advanced',
      q: 'The primary purpose of a scavenging system on a nitrous oxide unit is to:',
      options: [
        'Increase the concentration delivered to the patient',
        'Capture and vent exhaled gas so occupational exposure to the dental team is reduced',
        'Warm the gas before delivery',
        'Filter bacteria out of the nitrous oxide supply'
      ],
      answer: 1,
      rationale: 'Scavenging removes exhaled nitrous oxide at the mask and vents it outside, which is the central control for chronic occupational exposure, along with leak checking, adequate ventilation, and asking the patient to limit talking during administration. It does nothing to the concentration the patient receives, which is set by the flowmeter.' },

    { id: 'b1q21', domain: 'safety', difficulty: 'advanced',
      q: 'A patient becomes pale, sweaty, and loses consciousness in the chair. Assuming no trauma and the airway is clear, the appropriate immediate positioning is:',
      options: [
        'Sitting fully upright',
        'Supine with the legs slightly elevated',
        'Face down on the chair',
        'Standing with support'
      ],
      answer: 1,
      rationale: 'Syncope is a transient drop in cerebral blood flow. Placing the patient supine with the legs slightly elevated restores that flow, and the team then checks airway, breathing, and circulation, loosens tight clothing, and considers oxygen while summoning help per office protocol. Sitting the patient up (option A) feels intuitive if you think of nausea, but it works against perfusion and prolongs the episode.' },

    { id: 'b1q22', domain: 'safety', difficulty: 'intermediate',
      q: 'A patient develops hives, swelling of the lips and tongue, and difficulty breathing minutes after a medication is given. The drug the team prepares is:',
      options: [
        'Nitroglycerin',
        'Epinephrine',
        'Albuterol alone',
        'Aromatic ammonia'
      ],
      answer: 1,
      rationale: 'Epinephrine is the definitive drug for anaphylaxis, and emergency medical services are activated at the same time. Albuterol may help bronchospasm in an asthma attack but does not treat the airway edema and cardiovascular collapse of anaphylaxis, which makes it the plausible trap here. Nitroglycerin is for angina and aromatic ammonia is for simple syncope.' },

    { id: 'b1q23', domain: 'safety', difficulty: 'advanced',
      q: 'A patient with a history of angina reports crushing chest pain during treatment. The medication the team would expect the dentist to consider from the emergency kit is:',
      options: [
        'Sublingual nitroglycerin',
        'An antihistamine',
        'A bronchodilator inhaler',
        'Oral glucose'
      ],
      answer: 0,
      rationale: 'Nitroglycerin is a vasodilator used for anginal chest pain, given sublingually, alongside stopping treatment, positioning the patient comfortably, and administering oxygen per protocol. Oral glucose is for a conscious hypoglycemic patient and a bronchodilator is for bronchospasm — both are correct drugs for the wrong emergency. If pain does not resolve, the team treats it as a possible myocardial infarction and activates emergency medical services.' },

    { id: 'b1q24', domain: 'safety', difficulty: 'beginner',
      q: 'An emergency eyewash station in the sterilization area must be able to:',
      options: [
        'Deliver a fine mist for 30 seconds',
        'Flush both eyes continuously for about 15 minutes with tepid water',
        'Be activated with two hands',
        'Dispense a disinfectant solution'
      ],
      answer: 1,
      rationale: 'The standard is a hands-free, continuous flush of both eyes for roughly 15 minutes with tepid, potable water. Two-handed activation (option C) defeats the purpose, since a person with a chemical splash needs a free hand to hold the eyelids open. Never irrigate an eye with a disinfectant.' },

    { id: 'b1q25', domain: 'jurisprudence', difficulty: 'beginner',
      q: 'Which agency registers and regulates dental assistants in Texas?',
      options: [
        'The Texas State Board of Dental Examiners (TSBDE)',
        'The Dental Assisting National Board (DANB)',
        'The Texas Workforce Commission (TWC)',
        'The American Dental Association (ADA)'
      ],
      answer: 0,
      rationale: 'TSBDE is the state agency that licenses dentists and hygienists and registers dental assistants, and it writes the rules that define what may be delegated. DANB is the national certifying organization whose examinations Texas may recognize — it is a testing body, not a regulator, which is the usual point of confusion. TWC regulates career schools; the ADA is a professional association.' },

    { id: 'b1q26', domain: 'jurisprudence', difficulty: 'beginner',
      q: 'In Texas, a dental assistant who makes dental radiographic exposures on patients must:',
      options: [
        'Hold current registration with the state board for that duty',
        'Simply be employed by a licensed dentist',
        'Hold a hygiene license',
        'Have five years of chairside experience'
      ],
      answer: 0,
      rationale: 'Texas requires a dental assistant to be registered with the state board before exposing radiographs — employment by a dentist alone is not enough, which is exactly the assumption option B captures and the reason many assistants get caught out. A hygiene license is a different and broader credential. Confirm the current registration requirements and any renewal obligations directly with TSBDE, since rules are amended periodically.' },

    { id: 'b1q27', domain: 'jurisprudence', difficulty: 'intermediate',
      q: 'A patient asks the assistant, "Is this dark spot on my x-ray a cavity?" The assistant may:',
      options: [
        'Interpret the radiograph and tell the patient what it shows',
        'Describe what the image shows and recommend a filling',
        'Explain that the dentist reviews and interprets the images, and bring the dentist in',
        'Compare it to a previous patient case to reassure them'
      ],
      answer: 2,
      rationale: 'Diagnosis and treatment planning require the professional judgment of a dentist and cannot be delegated to an assistant. Options A and B are both diagnosis in plain clothes — describing findings and recommending treatment is functionally telling the patient what is wrong. The assistant supports the dentist, reinforces the diagnosis once made, and never issues it. Option D would also breach patient privacy.' },

    { id: 'b1q28', domain: 'jurisprudence', difficulty: 'intermediate',
      q: 'Which task is OUTSIDE the scope of a registered dental assistant in Texas?',
      options: [
        'Exposing radiographs with the appropriate registration',
        'Administering a local anesthetic injection',
        'Taking an alginate impression when delegated by the dentist',
        'Placing a surface barrier and disinfecting the operatory'
      ],
      answer: 1,
      rationale: 'Administering local anesthesia by injection is not within the dental assistant scope in Texas. Radiography with proper registration, delegated impressions, and infection control are routine assistant duties. Note that certain additional duties require a separate board-issued certificate beyond basic registration, so "the dentist told me to" is never by itself authorization — verify the current delegation rules with TSBDE.' },

    { id: 'b1q29', domain: 'jurisprudence', difficulty: 'advanced',
      q: 'How does the Dental Assisting National Board report a candidate score on its examinations?',
      options: [
        'As a percentage of questions answered correctly',
        'As a letter grade',
        'As a scaled score, where 400 is the passing score on a 100 to 900 scale',
        'As a pass or fail with no numeric result'
      ],
      answer: 2,
      rationale: 'DANB reports a scaled score on a 100 to 900 scale, with 400 as the passing score. Scaling adjusts for small differences in difficulty between exam forms so that the passing standard means the same thing across every administration. This is why the widely repeated claim that a particular percentage of questions correct is required to pass is false: the raw number of items correct that maps to a scaled 400 varies from form to form and is never reported as a percentage. Option A is the belief most candidates arrive with, and it is worth unlearning early.' },

    { id: 'b1q30', domain: 'jurisprudence', difficulty: 'intermediate',
      q: 'A dental assistant in Texas notices injuries on a child patient that raise a suspicion of abuse. Texas law requires that:',
      options: [
        'The assistant report the suspicion, because Texas requires any person who suspects child abuse or neglect to report it',
        'The dentist alone may report, and a staff member concern stops there',
        'Nothing be reported without proof',
        'The parent be confronted before any report is made'
      ],
      answer: 0,
      rationale: 'Texas imposes a universal duty to report: any person who has cause to believe a child is being abused or neglected must report it, and professionals face a shortened reporting deadline. Suspicion is the trigger, not proof, so option C states the law backward. Confronting a caregiver first can place the child at greater risk and is not the required path. Know your office protocol and the state reporting number before you ever need them.' }
  ];

  /* =========================================================================
     BANK 2 — RADIOGRAPHY AND DENTAL ANATOMY
     ========================================================================= */
  var BANK_2 = [
    { id: 'b2q01', domain: 'radiography', difficulty: 'beginner',
      q: 'The principle of ALARA directs the dental team to:',
      options: [
        'Always take a full-mouth series on new patients',
        'Keep radiation exposure as low as reasonably achievable while still obtaining diagnostic images',
        'Avoid radiographs entirely on patients under 18',
        'Use the shortest cone available in every situation'
      ],
      answer: 1,
      rationale: 'ALARA balances two duties at once: minimize dose, and still produce an image the dentist can diagnose from. It is not a rule to avoid radiographs, and it is not satisfied by a routine protocol applied to everyone, which is why option A fails — image selection is based on the individual patient history and clinical findings.' },

    { id: 'b2q02', domain: 'radiography', difficulty: 'beginner',
      q: 'During an exposure, where should the operator stand if there is no protective barrier?',
      options: [
        'Beside the patient, holding the tube head steady',
        'At least six feet away, at an angle of 90 to 135 degrees to the primary beam',
        'Directly behind the tube head in line with the beam',
        'Anywhere in the room, since the exposure is brief'
      ],
      answer: 1,
      rationale: 'Standing at least six feet away and in the 90 to 135 degree zone relative to the primary beam places the operator where scatter radiation is least. Standing in line with the primary beam (option C) is the dangerous confusion — it feels "behind the machine" but it is the path the beam travels. Behind a proper barrier is preferable whenever one exists.' },

    { id: 'b2q03', domain: 'radiography', difficulty: 'beginner',
      q: 'A patient cannot hold the sensor in place because of a strong gag reflex. The operator should:',
      options: [
        'Hold the sensor for the patient during the exposure',
        'Have another staff member hold it',
        'Use a receptor holder, and if a person must assist, have the patient’s accompanying adult hold it with appropriate protection',
        'Skip the image and chart that it was refused'
      ],
      answer: 2,
      rationale: 'Dental personnel never hold a receptor or the tube head during an exposure — repeated occupational exposure accumulates over a career. A receptor holding device is the first solution; if a person truly must stabilize the receptor, it is the patient or an accompanying adult, not a staff member, and never the same person repeatedly. Charting a refusal that the patient did not make (option D) falsifies the record.' },

    { id: 'b2q04', domain: 'radiography', difficulty: 'advanced',
      q: 'Compared with a round position-indicating device, rectangular collimation:',
      options: [
        'Increases the area of tissue irradiated',
        'Reduces the area of tissue irradiated to approximately the size of the receptor',
        'Increases the density of the resulting image',
        'Eliminates the need for a receptor holder'
      ],
      answer: 1,
      rationale: 'Rectangular collimation restricts the beam to roughly the receptor dimensions, cutting the irradiated tissue area substantially and reducing scatter, which also improves image quality. It does raise the risk of cone cut, so it makes a beam-alignment holder more important, not less — option D reverses that relationship.' },

    { id: 'b2q05', domain: 'radiography', difficulty: 'advanced',
      q: 'Aluminum filtration in the x-ray tube head serves to:',
      options: [
        'Remove low-energy photons that would be absorbed by the patient without contributing to the image',
        'Restrict the size and shape of the beam',
        'Increase the number of photons produced',
        'Convert x-rays into visible light'
      ],
      answer: 0,
      rationale: 'Filtration, commonly 1.5 to 2.5 millimeters of aluminum equivalent depending on the kilovoltage, absorbs long-wavelength, low-energy photons that lack the energy to reach the receptor and would otherwise deposit dose in skin and soft tissue. Restricting beam size and shape (option B) is COLLIMATION — filtration and collimation are the two dose-reduction features students most often swap.' },

    { id: 'b2q06', domain: 'radiography', difficulty: 'advanced',
      q: 'Increasing the kilovoltage (kVp) while holding other factors constant produces an image with:',
      options: [
        'Higher contrast and fewer shades of gray',
        'Lower contrast, with more shades of gray (long-scale contrast)',
        'No change in contrast',
        'Reduced beam penetration'
      ],
      answer: 1,
      rationale: 'Higher kVp raises the energy and penetrating power of the beam, producing long-scale, low-contrast images with many shades of gray — useful for evaluating periodontal bone levels. Lower kVp produces short-scale, high-contrast images that many clinicians prefer for caries detection. The trap in option A is remembering that kVp affects contrast but reversing the direction.' },

    { id: 'b2q07', domain: 'radiography', difficulty: 'intermediate',
      q: 'Milliamperage and exposure time together control primarily the:',
      options: [
        'Contrast of the image',
        'Quantity of photons produced, and therefore image density',
        'Sharpness of the image outline',
        'Amount of magnification'
      ],
      answer: 1,
      rationale: 'Milliamperage times seconds determines how many photons are produced, which drives overall density — how dark the image is. kVp governs beam quality and contrast. Sharpness is driven by focal spot size and by object, receptor, and source distances, and magnification by those distances, so options C and D belong to geometry rather than exposure settings.' },

    { id: 'b2q08', domain: 'radiography', difficulty: 'advanced',
      q: 'By the inverse square law, if the source-to-receptor distance is doubled, the intensity of the beam at the receptor becomes:',
      options: [
        'Half as intense',
        'One-fourth as intense',
        'Twice as intense',
        'Unchanged'
      ],
      answer: 1,
      rationale: 'Intensity varies inversely with the square of the distance, so doubling the distance leaves one-fourth of the intensity. Option A is the intuitive but incorrect linear answer. This is why switching from a short to a long position-indicating device requires an exposure adjustment on machines that are not automatically compensated.' },

    { id: 'b2q09', domain: 'radiography', difficulty: 'intermediate',
      q: 'In the paralleling technique, the receptor is positioned:',
      options: [
        'Against the lingual surfaces of the teeth, with the beam aimed at a bisector',
        'Parallel to the long axis of the tooth, with the central ray directed perpendicular to both the tooth and the receptor',
        'At a 45 degree angle to the occlusal plane',
        'Outside the mouth against the cheek'
      ],
      answer: 1,
      rationale: 'Paralleling places the receptor parallel to the long axis of the tooth and directs the central ray perpendicular to both, which is why it produces the least dimensional distortion and is the preferred intraoral technique. It requires a holding device and a longer source-to-object distance to offset the increased object-to-receptor distance. Option A describes the bisecting technique.' },

    { id: 'b2q10', domain: 'radiography', difficulty: 'intermediate',
      q: 'In the bisecting technique, the central ray is directed perpendicular to:',
      options: [
        'The long axis of the tooth',
        'The plane of the receptor',
        'An imaginary line bisecting the angle formed by the long axis of the tooth and the plane of the receptor',
        'The occlusal plane'
      ],
      answer: 2,
      rationale: 'Bisecting relies on the geometric rule of isometry: aiming perpendicular to the bisector of the angle between tooth and receptor yields an image the same length as the tooth. Aiming perpendicular to the tooth itself elongates the image and aiming perpendicular to the receptor foreshortens it — options A and B are precisely the two errors this technique is designed to avoid.' },

    { id: 'b2q11', domain: 'radiography', difficulty: 'advanced',
      q: 'Using the buccal object rule (SLOB), if the tube head is shifted mesially and an object appears to move mesially as well, the object is located:',
      options: [
        'On the buccal',
        'On the lingual',
        'Within the pulp chamber',
        'Outside the alveolar bone'
      ],
      answer: 1,
      rationale: 'SLOB stands for Same Lingual, Opposite Buccal: an object that shifts in the SAME direction as the tube head lies lingual, and one that shifts in the OPPOSITE direction lies buccal. Two images at different horizontal angles give the dentist the third dimension a single film cannot. Students commonly recall the acronym but invert which half applies.' },

    { id: 'b2q12', domain: 'radiography', difficulty: 'beginner',
      q: 'Between patients, a digital intraoral sensor should be:',
      options: [
        'Heat-sterilized in the autoclave',
        'Covered with an FDA-cleared barrier during use, then cleaned and disinfected per the manufacturer instructions',
        'Wiped with an alcohol pad and reused immediately',
        'Immersed in a high-level disinfectant for 30 minutes'
      ],
      answer: 1,
      rationale: 'Solid-state sensors are heat and immersion sensitive; autoclaving or soaking destroys them, which rules out options A and D even though those are correct answers for many other semi-critical items. The accepted approach is a single-use barrier plus cleaning and disinfection between patients per the manufacturer, because barriers can leak.' },

    { id: 'b2q13', domain: 'radiography', difficulty: 'intermediate',
      q: 'A photostimulable phosphor (PSP) plate is prepared for reuse after scanning by:',
      options: [
        'Rinsing it under running water',
        'Exposing it to bright light to erase the residual image',
        'Placing it in the autoclave',
        'Wiping it with etchant'
      ],
      answer: 1,
      rationale: 'PSP plates store a latent image that is read out by the scanner and then erased by exposure to a bright light source before the plate is reused. Skipping the erase step leaves ghost images of the previous exposure on the next patient image. Water, heat, and chemicals damage the phosphor layer.' },

    { id: 'b2q14', domain: 'radiography', difficulty: 'beginner',
      q: 'On a radiograph, an amalgam restoration appears:',
      options: [
        'Radiolucent (dark), because metal absorbs few x-rays',
        'Radiopaque (light or white), because metal absorbs many x-rays',
        'The same density as enamel',
        'Invisible'
      ],
      answer: 1,
      rationale: 'Dense materials such as amalgam, gold, and enamel absorb x-rays and appear light or white — radiopaque. Less dense structures such as the pulp chamber, the periodontal ligament space, and carious lesions let more photons through and appear dark — radiolucent. Reversing the two terms is the single most common vocabulary error in radiographic interpretation.' },

    { id: 'b2q15', domain: 'radiography', difficulty: 'beginner',
      q: 'An occlusal radiograph is most useful for:',
      options: [
        'Measuring periodontal pocket depth',
        'Viewing a large area of the maxilla or mandible, such as to locate an impacted or supernumerary tooth',
        'Detecting interproximal caries between posterior teeth',
        'Evaluating the temporomandibular joint'
      ],
      answer: 1,
      rationale: 'An occlusal image covers a broad segment of an arch and is used to locate impacted, supernumerary, or unerupted teeth, salivary stones, fractures, and the extent of lesions, and it is helpful for patients who cannot tolerate periapical placement. Interproximal caries detection is the job of the bitewing (option C), and pocket depth is measured with a probe, not an image.' },

    { id: 'b2q16', domain: 'dental_anatomy', difficulty: 'beginner',
      q: 'How many roots does a typical permanent maxillary first molar have?',
      options: ['One', 'Two', 'Three', 'Four'],
      answer: 2,
      rationale: 'The maxillary first molar typically has three roots: mesiobuccal, distobuccal, and palatal. Mandibular molars typically have two, mesial and distal — that mandibular pattern is why option B is the frequent wrong pick. Root count matters when you are setting up for endodontics or an extraction and when you are interpreting a periapical image.' },

    { id: 'b2q17', domain: 'dental_anatomy', difficulty: 'intermediate',
      q: 'The permanent mandibular first molar typically has how many cusps?',
      options: ['Three', 'Four', 'Five', 'Six'],
      answer: 2,
      rationale: 'The mandibular first molar characteristically has five cusps: mesiobuccal, distobuccal, distal, mesiolingual, and distolingual. The extra distal cusp distinguishes it from the mandibular second molar, which typically has four. This is a classic tooth identification item on credentialing examinations.' },

    { id: 'b2q18', domain: 'dental_anatomy', difficulty: 'advanced',
      q: 'The cusp of Carabelli, when present, is found on the:',
      options: [
        'Mesiolingual cusp of the maxillary first molar',
        'Distobuccal cusp of the mandibular first molar',
        'Lingual surface of the maxillary canine',
        'Buccal surface of the mandibular second premolar'
      ],
      answer: 0,
      rationale: 'The cusp of Carabelli is a supplemental fifth cusp on the mesiolingual cusp of the maxillary first molar. It is a normal anatomical variant, not pathology, and it is not present in every patient. Confusing it with the extra distal cusp of the MANDIBULAR first molar (option B) is the predictable mix-up, since both are described as a "fifth cusp."' },

    { id: 'b2q19', domain: 'dental_anatomy', difficulty: 'intermediate',
      q: 'Which permanent tooth has the longest root?',
      options: [
        'Maxillary central incisor',
        'Maxillary canine',
        'Mandibular first molar',
        'Maxillary second premolar'
      ],
      answer: 1,
      rationale: 'The maxillary canine has the longest root of any tooth in the permanent dentition, which is one reason it is a strong abutment and often the last tooth retained. That length also means a periapical image of the canine frequently requires careful vertical placement to capture the apex — a practical point when a retake is avoidable.' },

    { id: 'b2q20', domain: 'dental_anatomy', difficulty: 'beginner',
      q: 'The three rounded projections seen on the incisal edge of a newly erupted permanent incisor are called:',
      options: ['Mamelons', 'Cusps', 'Cingula', 'Tubercles'],
      answer: 0,
      rationale: 'Mamelons are the three rounded bumps on a newly erupted incisal edge; they wear away with normal function. They are a normal developmental feature, not chipping or damage — worth knowing when a parent asks about a child’s "bumpy" new front teeth. The cingulum, by contrast, is the bulge on the lingual cervical third of an anterior tooth.' },

    { id: 'b2q21', domain: 'dental_anatomy', difficulty: 'advanced',
      q: 'Which permanent teeth are NOT succedaneous (that is, they do not replace a primary tooth)?',
      options: [
        'The permanent incisors',
        'The permanent canines',
        'The permanent premolars',
        'The permanent molars'
      ],
      answer: 3,
      rationale: 'Succedaneous teeth succeed a primary predecessor: the permanent incisors, canines, and premolars, 20 teeth in all. The 12 permanent molars erupt distal to the primary dentition and have no predecessor. Note that the permanent premolars replace the primary MOLARS, which is why option C looks wrong to students who expect a premolar to replace a premolar — primary dentition contains no premolars at all.' },

    { id: 'b2q22', domain: 'dental_anatomy', difficulty: 'beginner',
      q: 'The first permanent tooth to erupt in most children is the:',
      options: [
        'Maxillary central incisor at about age 5',
        'First permanent molar at about age 6',
        'Second permanent molar at about age 9',
        'Permanent canine at about age 7'
      ],
      answer: 1,
      rationale: 'The first permanent molar erupts around age six, distal to the primary second molar, which is why it is called the six-year molar. Because no primary tooth is shed to make room, parents often do not realize a permanent tooth has arrived, and these molars are frequently the first permanent teeth to develop caries — a key reason sealants are recommended soon after eruption.' },

    { id: 'b2q23', domain: 'dental_anatomy', difficulty: 'intermediate',
      q: 'The periodontium consists of the:',
      options: [
        'Enamel, dentin, cementum, and pulp',
        'Gingiva, periodontal ligament, cementum, and alveolar bone',
        'Gingiva, tongue, and hard palate',
        'Pulp chamber, root canal, and apical foramen'
      ],
      answer: 1,
      rationale: 'The periodontium is the supporting apparatus of the tooth: gingiva, periodontal ligament, cementum, and alveolar bone. Option A lists the tissues OF the tooth, which is the common confusion — note that cementum belongs to both lists, since it is the root surface into which the ligament fibers insert.' },

    { id: 'b2q24', domain: 'dental_anatomy', difficulty: 'intermediate',
      q: 'Sensation from the teeth is carried by which cranial nerve?',
      options: [
        'Cranial nerve V, the trigeminal nerve',
        'Cranial nerve VII, the facial nerve',
        'Cranial nerve IX, the glossopharyngeal nerve',
        'Cranial nerve XII, the hypoglossal nerve'
      ],
      answer: 0,
      rationale: 'The trigeminal nerve supplies sensation to the teeth and much of the face, through its maxillary (V2) and mandibular (V3) divisions — the target of every dental injection. The facial nerve (option B) supplies the muscles of facial expression, which is why an inadvertently deposited inferior alveolar injection near the parotid can cause temporary facial droop. That single distinction explains a common chairside emergency call.' },

    { id: 'b2q25', domain: 'dental_anatomy', difficulty: 'advanced',
      q: 'Which of these is NOT one of the four muscles of mastication?',
      options: ['Masseter', 'Temporalis', 'Buccinator', 'Lateral pterygoid'],
      answer: 2,
      rationale: 'The four muscles of mastication are the masseter, temporalis, medial pterygoid, and lateral pterygoid. The buccinator is a muscle of facial expression; it compresses the cheek and keeps food on the occlusal table, which makes it feel like a chewing muscle and makes it the strongest distractor here. It is innervated by the facial nerve, while the muscles of mastication are innervated by the mandibular division of the trigeminal nerve.' },

    { id: 'b2q26', domain: 'dental_anatomy', difficulty: 'intermediate',
      q: 'The area where the roots of a multi-rooted tooth divide is called the:',
      options: ['Furcation', 'Cingulum', 'Embrasure', 'Apical foramen'],
      answer: 0,
      rationale: 'The furcation is the point of root division; bone loss that reaches into it is furcation involvement, graded and recorded during periodontal charting. An embrasure is the V-shaped space between adjacent teeth at the contact area, and the apical foramen is the opening at the root tip where vessels and nerves enter — both are real structures, which is what makes them plausible options.' },

    { id: 'b2q27', domain: 'dental_anatomy', difficulty: 'advanced',
      q: 'In the FDI two-digit notation system, tooth 36 is the:',
      options: [
        'Permanent mandibular left first molar',
        'Permanent maxillary right first molar',
        'Primary mandibular left first molar',
        'Permanent mandibular right second premolar'
      ],
      answer: 0,
      rationale: 'In FDI notation the first digit is the quadrant and the second is the tooth position counting from the midline. Quadrant 3 is the permanent lower left, and position 6 is the first molar, so 36 is the permanent mandibular left first molar — Universal number 19. Quadrants 5 through 8 designate the primary dentition, which is why option C is incorrect. Many laboratories, implant systems, and imaging platforms use FDI, so assistants read it even in offices that chart with the Universal system.' },

    { id: 'b2q28', domain: 'dental_anatomy', difficulty: 'advanced',
      q: 'On a periapical radiograph, the thin radiopaque line that outlines the tooth socket is the:',
      options: [
        'Lamina dura',
        'Periodontal ligament space',
        'Alveolar crest',
        'Cementoenamel junction'
      ],
      answer: 0,
      rationale: 'The lamina dura is the layer of dense cortical bone lining the socket, seen as a thin white line following the root. Immediately inside it is the periodontal ligament space, a thin dark line — students routinely name the dark line when asked about the light one. A break in the continuity of the lamina dura is a finding the dentist evaluates.' },

    { id: 'b2q29', domain: 'dental_anatomy', difficulty: 'advanced',
      q: 'A round radiolucent area appears near the apex of a mandibular second premolar on a periapical image. Before assuming pathology, the dentist would consider that this may be the:',
      options: [
        'Mental foramen',
        'Maxillary sinus',
        'Genial tubercles',
        'Coronoid process'
      ],
      answer: 0,
      rationale: 'The mental foramen is a normal radiolucent opening on the buccal mandible near the premolar apices and is a classic mimic of periapical pathology. The distinguishing features are that the lamina dura and periodontal ligament space stay intact and continuous around the apex — a true periapical lesion interrupts that continuity — and that the tooth usually tests vital. The maxillary sinus is a maxillary structure and cannot appear on a mandibular image, which makes option B an anatomy check as much as a radiographic one.' },

    { id: 'b2q30', domain: 'dental_anatomy', difficulty: 'intermediate',
      q: 'A large radiolucent area with a thin radiopaque border appearing above the apices of the maxillary posterior teeth is most likely the:',
      options: [
        'Maxillary sinus',
        'Mandibular canal',
        'Nasal cavity',
        'Zygomatic arch'
      ],
      answer: 0,
      rationale: 'The maxillary sinus is an air-filled space that appears radiolucent above the maxillary posterior root apices, bounded by a thin radiopaque cortical floor that sometimes appears to overlap the roots. The mandibular canal (option B) is the equivalent landmark in the opposite arch and is the frequent mix-up when a student is working quickly and has not oriented the image.' }
  ];

  /* =========================================================================
     BANK 3 — CHAIRSIDE ASSISTING, DENTAL MATERIALS, PATIENT MANAGEMENT
     ========================================================================= */
  var BANK_3 = [
    { id: 'b3q01', domain: 'chairside', difficulty: 'intermediate',
      q: 'For a right-handed operator using clock concept zones, the transfer zone is located at:',
      options: [
        '12 to 2 o’clock',
        '2 to 4 o’clock',
        '4 to 7 o’clock',
        '7 to 12 o’clock'
      ],
      answer: 2,
      rationale: 'With the patient’s head at 12, a right-handed operator works from 7 to 12, the assistant sits at 2 to 4, instruments pass in the transfer zone at 4 to 7 over the patient’s upper chest, and 12 to 2 is the static zone where the mobile cart sits. Zones are mirrored for a left-handed operator. Instruments are never passed over the patient’s face, which is the practical reason the transfer zone is defined where it is.' },

    { id: 'b3q02', domain: 'chairside', difficulty: 'beginner',
      q: 'At what height should the dental assistant be seated in relation to the operator?',
      options: [
        'At the same eye level as the operator',
        'Four to six inches higher than the operator',
        'Four to six inches lower than the operator',
        'Standing throughout the procedure'
      ],
      answer: 1,
      rationale: 'Sitting four to six inches above the operator lets the assistant see over the operator’s hands into the oral cavity, which is what makes anticipatory transfer and effective evacuation possible. Sitting level or lower (options A and C) means you are guessing at what the dentist needs next instead of seeing it.' },

    { id: 'b3q03', domain: 'chairside', difficulty: 'beginner',
      q: 'Instruments are arranged on the procedure tray:',
      options: [
        'Alphabetically',
        'From left to right in the order they will be used',
        'By size, largest first',
        'In whatever arrangement fits the tray'
      ],
      answer: 1,
      rationale: 'Sequential left-to-right placement means the assistant can reach for the next instrument without searching, and any team member can read the tray. It is also how a missing instrument becomes obvious during setup rather than mid-procedure, which is the whole point of a systematic setup.' },

    { id: 'b3q04', domain: 'chairside', difficulty: 'intermediate',
      q: 'During a restorative procedure, the high-volume evacuator tip is generally positioned:',
      options: [
        'After the dentist has placed the handpiece in the mouth',
        'Before the dentist positions the handpiece',
        'At whatever moment the patient signals a need to swallow',
        'On the opposite side of the mouth from the tooth being treated'
      ],
      answer: 1,
      rationale: 'The assistant places the evacuator tip first so the dentist can bring the handpiece into an already-controlled field. Placing it second means bumping the handpiece and interrupting the operator, and it lets the first burst of water spray go uncontrolled. Waiting for a swallow signal (option C) is reactive assisting rather than four-handed assisting.' },

    { id: 'b3q05', domain: 'chairside', difficulty: 'advanced',
      q: 'Why are patients advised not to close their lips tightly around a saliva ejector tip?',
      options: [
        'It can dislodge a restoration',
        'A seal can create a partial vacuum that allows previously suctioned fluid to flow back into the mouth',
        'It reduces the suction available to the operator',
        'It causes the tip to overheat'
      ],
      answer: 1,
      rationale: 'CDC guidance notes that when a patient forms a seal around a low-volume saliva ejector, pressure differences can cause backflow of previously suctioned material into the patient’s mouth. It is a small, easily prevented risk: coach the patient to rest the lips loosely. Reduced suction (option C) is a real annoyance but is not the infection control concern.' },

    { id: 'b3q06', domain: 'chairside', difficulty: 'advanced',
      q: 'Before a dental dam clamp is placed, a length of dental floss is tied to the clamp bow because:',
      options: [
        'It helps stretch the dam material',
        'It provides a means of retrieval if the clamp breaks or slips toward the throat',
        'It marks which tooth is being isolated',
        'It keeps the clamp sterile'
      ],
      answer: 1,
      rationale: 'A ligature gives the team a way to retrieve a clamp that fractures or is displaced, protecting the airway. Airway protection is the reason this step is non-negotiable even though a clamp rarely fails. Nothing about the floss keeps the clamp sterile — it is placed after the clamp has already been handled, so option D misunderstands the sequence.' },

    { id: 'b3q07', domain: 'chairside', difficulty: 'advanced',
      q: 'The dentist aspirates before depositing local anesthetic solution in order to:',
      options: [
        'Confirm the needle is not within a blood vessel',
        'Warm the anesthetic solution',
        'Test the sharpness of the needle',
        'Reduce the volume of solution required'
      ],
      answer: 0,
      rationale: 'Aspiration draws back slightly on the plunger; blood entering the cartridge signals the needle lumen is in a vessel and the needle must be repositioned. Depositing an anesthetic containing a vasoconstrictor directly into the vascular system can produce a systemic reaction. This is also why larger-diameter needles are preferred for blocks — reliable aspiration depends on lumen size.' },

    { id: 'b3q08', domain: 'chairside', difficulty: 'advanced',
      q: 'Comparing a 25-gauge and a 30-gauge dental needle, the 25-gauge needle has:',
      options: [
        'A smaller lumen diameter',
        'A larger lumen diameter',
        'The same diameter but a shorter length',
        'No lumen at all'
      ],
      answer: 1,
      rationale: 'Gauge runs inversely to diameter: the smaller the gauge number, the larger the needle. A 25-gauge needle is therefore wider than a 30-gauge and is often selected for blocks, where deflection is a concern and reliable aspiration matters. Assuming a bigger number means a bigger needle (option A) is the near-universal first-week mistake when the assistant is asked to load the syringe.' },

    { id: 'b3q09', domain: 'chairside', difficulty: 'intermediate',
      q: 'A standard dental anesthetic cartridge contains approximately:',
      options: [
        '0.5 mL of solution',
        '1.7 to 1.8 mL of solution',
        '5 mL of solution',
        '10 mL of solution'
      ],
      answer: 1,
      rationale: 'A dental cartridge holds roughly 1.7 to 1.8 mL, depending on manufacturer. Knowing the volume lets the assistant record the number of cartridges accurately in the chart, which is how the dentist tracks the total dose administered — a real safety calculation for small children and medically complex patients.' },

    { id: 'b3q10', domain: 'chairside', difficulty: 'beginner',
      q: 'When applying topical anesthetic before an injection, the assistant should:',
      options: [
        'Apply it to wet mucosa and remove it immediately',
        'Dry the tissue, apply a small amount with a cotton applicator, and leave it in contact for the time stated by the manufacturer, commonly one to two minutes',
        'Apply it to the entire arch for full coverage',
        'Have the patient swish it around the mouth'
      ],
      answer: 1,
      rationale: 'Topical works on dried tissue with a limited, targeted amount held in place long enough to take effect. Applying it broadly or having the patient swish (options C and D) increases the amount absorbed systemically without improving the injection site, and topical anesthetics do carry a dose consideration, especially in children.' },

    { id: 'b3q11', domain: 'chairside', difficulty: 'intermediate',
      q: 'An inferior alveolar nerve block anesthetizes:',
      options: [
        'The maxillary molars on that side',
        'The mandibular teeth on that side, along with the lower lip and chin on that side',
        'Both arches on the injected side',
        'The soft palate'
      ],
      answer: 1,
      rationale: 'The inferior alveolar block anesthetizes the mandibular teeth of that quadrant plus, by way of the mental nerve, the lower lip and chin on that side. The tongue on that side is typically affected as well because the lingual nerve lies nearby. Knowing the expected distribution lets the assistant give accurate post-operative cautions about biting a numb lip, which is the single most common post-injection injury in children.' },

    { id: 'b3q12', domain: 'dental_materials', difficulty: 'beginner',
      q: 'Alginate impression material is classified as a(n):',
      options: [
        'Irreversible hydrocolloid',
        'Reversible hydrocolloid',
        'Elastomeric polyvinyl siloxane',
        'Gypsum product'
      ],
      answer: 0,
      rationale: 'Alginate sets by a chemical reaction and cannot be returned to its original state by heating — that is what "irreversible" means. Reversible hydrocolloid (agar) can be reheated and reused, which is the distinction the terminology is drawing. Polyvinyl siloxane is an elastomeric material used where higher accuracy is needed, such as crown impressions.' },

    { id: 'b3q13', domain: 'dental_materials', difficulty: 'intermediate',
      q: 'Using water that is warmer than the manufacturer specifies when mixing alginate will:',
      options: [
        'Slow the set and lengthen working time',
        'Speed the set and shorten working time',
        'Have no effect on setting time',
        'Prevent the material from setting at all'
      ],
      answer: 1,
      rationale: 'Water temperature is the practical control over alginate setting time: warmer water accelerates the set, cooler water slows it. If you are still seating a tray when the material begins to gel, you get a distorted impression and a remake — which is why an assistant who is working a difficult arch may deliberately use slightly cooler water within the manufacturer range.' },

    { id: 'b3q14', domain: 'dental_materials', difficulty: 'advanced',
      q: 'An alginate impression that will not be poured immediately should be:',
      options: [
        'Left on the counter to air-dry',
        'Submerged in a container of water until ready',
        'Disinfected, then wrapped in a damp paper towel in a sealed bag, and poured as soon as practical',
        'Refrigerated for up to a week'
      ],
      answer: 2,
      rationale: 'Alginate distorts in both directions: it loses water and shrinks (syneresis) if left in air, and it absorbs water and swells (imbibition) if submerged, so options A and B are the two classic failures. Storage at one hundred percent humidity limits both, but the material is still dimensionally unstable, so prompt pouring is the real answer and long storage is never acceptable.' },

    { id: 'b3q15', domain: 'dental_materials', difficulty: 'advanced',
      q: 'A polyvinyl siloxane (PVS) impression fails to set properly in one area. A likely cause is:',
      options: [
        'Contamination from latex gloves handling the material or the tissue',
        'Mixing with water that was too cold',
        'Using a rigid impression tray',
        'Taking the impression on the mandibular arch'
      ],
      answer: 0,
      rationale: 'Sulfur compounds in latex inhibit the platinum-catalyzed polymerization of PVS, producing a sticky, unset zone. Use vinyl or nitrile gloves and keep latex away from the prep, and be aware that some hemostatic and retraction agents can inhibit the set as well. Water temperature (option B) is the alginate variable, not the PVS one — mixing the two materials’ handling rules is a frequent error.' },

    { id: 'b3q16', domain: 'dental_materials', difficulty: 'advanced',
      q: 'A tooth will receive a bonded resin restoration at the next visit. Which temporary cement should be avoided for the provisional?',
      options: [
        'A non-eugenol temporary cement',
        'A zinc oxide eugenol cement',
        'A resin-based temporary cement',
        'A calcium hydroxide liner'
      ],
      answer: 1,
      rationale: 'Eugenol inhibits the polymerization of resin, so residual eugenol on the preparation can compromise the bond of the later resin restoration. Use a non-eugenol provisional cement when a bonded restoration is planned. This is easy to overlook because zinc oxide eugenol is otherwise an excellent, soothing temporary material, which is exactly why it remains stocked in most offices.' },

    { id: 'b3q17', domain: 'dental_materials', difficulty: 'intermediate',
      q: 'A property that distinguishes glass ionomer from most other restorative cements is that it:',
      options: [
        'Releases fluoride and bonds chemically to tooth structure',
        'Requires no isolation from moisture at any stage',
        'Sets by light exposure alone in every formulation',
        'Cannot be used near the gingival margin'
      ],
      answer: 0,
      rationale: 'Glass ionomer chemically bonds to enamel and dentin and releases fluoride over time, which is why it is often chosen for root-surface lesions and for patients at elevated caries risk. It still requires reasonable moisture control during placement and initial set, so option B overstates a genuine advantage — a common way this material gets misused chairside.' },

    { id: 'b3q18', domain: 'dental_materials', difficulty: 'advanced',
      q: 'Zinc phosphate cement is mixed on a cool glass slab, adding powder to liquid in small increments over a wide area, because:',
      options: [
        'The reaction is exothermic and the technique dissipates heat, extending working time',
        'The powder will not otherwise dissolve',
        'It prevents the cement from bonding chemically',
        'A warm slab would make the mix too thin'
      ],
      answer: 0,
      rationale: 'The zinc phosphate setting reaction gives off significant heat, and heat accelerates the set. Spreading the mix over a cool slab and incorporating powder gradually pulls that heat away, giving the dentist enough working time to seat the casting completely. A warm slab (option D) does not thin the mix — it shortens working time, which is the opposite of what is stated.' },

    { id: 'b3q19', domain: 'dental_materials', difficulty: 'intermediate',
      q: 'Calcium hydroxide is placed as a liner in a deep preparation primarily to:',
      options: [
        'Provide thermal insulation as a thick base',
        'Stimulate the formation of reparative dentin and protect the pulp',
        'Bond the restoration to enamel',
        'Whiten the underlying dentin'
      ],
      answer: 1,
      rationale: 'Calcium hydroxide is placed in the deepest portion of a preparation for its effect on the pulp, encouraging reparative dentin formation. It is a thin liner, not a bulk base — insulating thickness is the job of a base material such as a glass ionomer or a reinforced zinc oxide eugenol, which is why option A describes the right idea applied to the wrong material.' },

    { id: 'b3q20', domain: 'dental_materials', difficulty: 'beginner',
      q: 'Trituration of dental amalgam is the process of:',
      options: [
        'Carving the anatomy into the set restoration',
        'Mechanically mixing the alloy powder with mercury in an amalgamator',
        'Polishing the restoration at a later appointment',
        'Etching the preparation before placement'
      ],
      answer: 1,
      rationale: 'Trituration is the mechanical mixing of alloy and mercury that produces the plastic mass carried to the preparation. Time and speed settings matter: an overtriturated mix is hot and has a shortened working time, an undertriturated mix is dull, grainy, and weak. Carving comes after placement and condensation, so option A names a real step in the wrong position of the sequence.' },

    { id: 'b3q21', domain: 'dental_materials', difficulty: 'intermediate',
      q: 'When is composite shade selection performed?',
      options: [
        'After the rubber dam has been placed and the tooth has been isolated for several minutes',
        'Early in the appointment, before isolation and before the tooth dehydrates',
        'After the preparation is complete',
        'At the following appointment'
      ],
      answer: 1,
      rationale: 'Teeth dehydrate under isolation and become lighter and more opaque, so a shade chosen at that point will look too light once the tooth rehydrates over the following hours. Selecting early, in good lighting and with the tooth moist, gives an accurate match. Option A describes the exact condition that produces the mismatched restorations patients notice a day later.' },

    { id: 'b3q22', domain: 'dental_materials', difficulty: 'advanced',
      q: 'Which gypsum product is used to fabricate a die for a crown or bridge because of its high strength and low setting expansion?',
      options: [
        'Type I impression plaster',
        'Type II model plaster',
        'Type III dental stone',
        'Type IV die stone'
      ],
      answer: 3,
      rationale: 'Type IV die stone is the high-strength, low-expansion product used for dies, where the margin detail determines whether the casting fits. Type III dental stone is used for working casts and Type II model plaster for study models and mounting. The higher the type number, the denser and stronger the set material, because the particles are progressively less porous and require less mixing water.' },

    { id: 'b3q23', domain: 'patient_management', difficulty: 'beginner',
      q: 'The behavior guidance technique of showing a child the prophy angle, letting them feel it on a fingernail, and then using it is called:',
      options: [
        'Tell-show-do',
        'Voice control',
        'Positive reinforcement',
        'Distraction'
      ],
      answer: 0,
      rationale: 'Tell-show-do explains in age-appropriate words, demonstrates on something non-threatening, then performs the procedure — it reduces fear of the unknown, which is what most pediatric anxiety is. The other three are all legitimate techniques, which is why they are plausible here: voice control uses tone and volume, positive reinforcement rewards cooperation, and distraction shifts attention.' },

    { id: 'b3q24', domain: 'patient_management', difficulty: 'intermediate',
      q: 'Who is responsible for explaining the risks, benefits, and alternatives of a proposed treatment and obtaining informed consent?',
      options: [
        'The dental assistant',
        'The front office coordinator',
        'The dentist',
        'The insurance carrier'
      ],
      answer: 2,
      rationale: 'Informed consent flows from the diagnosis and treatment plan, so it is the dentist’s responsibility. The assistant may prepare the form, answer procedural and logistical questions, witness the signature, and document the exchange in the record — a real and important supporting role that is nonetheless not the same thing as obtaining consent.' },

    { id: 'b3q25', domain: 'patient_management', difficulty: 'intermediate',
      q: 'When communicating with a patient who has a hearing impairment and reads lips, the assistant should:',
      options: [
        'Speak loudly from behind the chair while working',
        'Face the patient, get their attention first, and lower the mask when speaking outside of treatment',
        'Write every instruction and avoid speaking',
        'Ask a family member to relay everything without addressing the patient'
      ],
      answer: 1,
      rationale: 'Face-to-face contact, a clear line of sight to the mouth, and reduced background noise do more than volume. Shouting from behind the patient (option A) removes every visual cue at once. Speaking to a companion rather than the patient (option D) is both ineffective and disrespectful — address the patient directly and use written notes as a supplement rather than a substitute.' },

    { id: 'b3q26', domain: 'patient_management', difficulty: 'advanced',
      q: 'A patient’s health history indicates a latex allergy. An appropriate accommodation is to:',
      options: [
        'Use latex products but change gloves more often',
        'Schedule the patient as the first appointment of the day and use a latex-free operatory and latex-free products',
        'Treat the patient in the same room used all morning',
        'Ask the patient to take an antihistamine before the visit'
      ],
      answer: 1,
      rationale: 'Airborne latex particles accumulate through the day, so a first-appointment slot in an operatory prepared with latex-free gloves, dams, prophy cups, and cartridge stoppers reduces exposure. Premedicating with an antihistamine (option D) treats a reaction the office should be preventing and is not the assistant’s call. Latex allergy is also a reason to check the dental dam, since traditional dam material is latex.' },

    { id: 'b3q27', domain: 'patient_management', difficulty: 'intermediate',
      q: 'You realize you entered a note in the wrong patient’s paper chart. The correct way to fix it is to:',
      options: [
        'Use correction fluid and write the entry over it',
        'Erase the entry completely',
        'Draw a single line through the entry so it remains legible, write the correction, and initial and date the change',
        'Remove the page and start a new one'
      ],
      answer: 2,
      rationale: 'A dental record is a legal document. Errors are corrected in a way that preserves the original entry and shows who changed what and when; obliterating an entry looks like concealment if the record is ever reviewed. Electronic records handle this through an audit trail rather than a pen stroke. Related point: charting symbols and colors are not nationally standardized and vary by office and software, so learn the key used where you work rather than assuming the convention from school carries over.' },

    { id: 'b3q28', domain: 'patient_management', difficulty: 'intermediate',
      q: 'A patient with a strong gag reflex is scheduled for a full-mouth radiographic series. A helpful approach is to:',
      options: [
        'Expose the most posterior images first to get them over with',
        'Expose anterior images first, work toward the posterior, place the receptor decisively without dragging it along the palate, and coach the patient to breathe through the nose',
        'Ask the patient to hold their breath for the entire series',
        'Take the images with the patient lying flat'
      ],
      answer: 1,
      rationale: 'Starting anterior builds patient confidence before you approach the sensitive posterior palate and tongue base, and decisive placement avoids the slow drag that triggers the reflex. Nasal breathing and a distraction such as raising a leg or focusing on a fixed point also help. Starting posterior (option A) usually ends the appointment early, and holding the breath increases the sensation of gagging rather than reducing it.' },

    { id: 'b3q29', domain: 'patient_management', difficulty: 'beginner',
      q: 'A normal resting pulse rate for a healthy adult is generally:',
      options: [
        '20 to 40 beats per minute',
        '60 to 100 beats per minute',
        '100 to 140 beats per minute',
        '140 to 180 beats per minute'
      ],
      answer: 1,
      rationale: 'Sixty to one hundred beats per minute is the accepted adult resting range; children run faster and well-conditioned athletes may run slower. Recording a rate outside the expected range is not a diagnosis — the assistant documents the reading and brings it to the dentist’s attention, which is the entire point of taking vital signs at the start of an appointment.' },

    { id: 'b3q30', domain: 'patient_management', difficulty: 'advanced',
      q: 'While updating a health history, a patient mentions taking a bisphosphonate medication for osteoporosis. The assistant should:',
      options: [
        'Record it and flag it for the dentist before any surgical treatment',
        'Ignore it, since it is not a dental medication',
        'Tell the patient to stop the medication before an extraction',
        'Note it as an allergy'
      ],
      answer: 0,
      rationale: 'Bisphosphonates and related antiresorptive drugs are associated with medication-related osteonecrosis of the jaw, so the dentist needs to know before extractions or other bone surgery. Advising a patient to stop a prescribed medication (option C) is practicing medicine and is outside the assistant scope in every state — that decision belongs to the prescribing physician in consultation with the dentist. A medication is also not an allergy, and misfiling it there means the alert never reaches the right place in the record.' }
  ];

  var BANKS = [
    { id: 'bank1', title: 'Bank 1 — Infection Control, Safety & Jurisprudence',
      blurb: 'Thirty items on hand hygiene and PPE, instrument reprocessing and sterilization monitoring, OSHA bloodborne pathogen and hazard communication rules, hazardous materials, medical emergencies, and Texas scope of practice.',
      questions: BANK_1 },
    { id: 'bank2', title: 'Bank 2 — Radiography & Dental Anatomy',
      blurb: 'Thirty items on radiation protection, exposure factors, projection technique and receptors, plus tooth morphology, dentitions, supporting structures, and the landmarks you see on an image.',
      questions: BANK_2 },
    { id: 'bank3', title: 'Bank 3 — Chairside Assisting, Materials & Patient Management',
      blurb: 'Thirty items on zones and ergonomics, isolation and evacuation, anesthesia support, impression materials, cements and liners, restorative materials, behavior guidance, consent, and documentation.',
      questions: BANK_3 }
  ];

  window.PDA_EXAM_BANKS = {
    /* Load-bearing. The consuming page checks this before rendering.
       Do not change until the school owner has read and approved all 90 items. */
    reviewStatus: 'DRAFT - requires review by Amanda Williams',
    DOMAINS: DOMAINS,
    BANKS: BANKS
  };
})();
