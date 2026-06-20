/* ============================================================================
   PREMIER DENTAL ACADEMY — SKILLS LAB · VIRTUAL OFFICE DATA (single source)
   ----------------------------------------------------------------------------
   Everything the Virtual Office and the Procedures page render comes from here:
   staff, patients, instruments, trays, and dialogue-driven scenarios. Plain
   global script (no ES modules in the browser) — exposes window.SL_VO_DATA.

   Realistic images are dropped into /assets/skills-lab/virtual-office/ to match
   manifest.json. Until then every image falls back to an emoji (see
   scenario-player.js). To add content, edit THIS file only.

   // TODO (Supabase project lmbsuwslsycukynzpzik): these shapes map to tables
   //   vo_patients, vo_instruments, vo_trays, vo_scenarios (steps jsonb).
   ============================================================================ */
(function () {
  'use strict';
  var IMG = '/assets/skills-lab/virtual-office/';

  /* ---- Staff (the people who speak to you in the room) ---- */
  var STAFF = {
    dentist:   { id:'dentist',   name:'Dr. Williams', role:'Dentist',          photo:IMG+'staff-dentist.png',   emoji:'🧑‍⚕️' },
    assistant: { id:'assistant', name:'You',           role:'Dental Assistant', photo:IMG+'staff-assistant.png', emoji:'🦷' },
    hygienist: { id:'hygienist', name:'Renee',         role:'Hygienist',        photo:IMG+'staff-hygienist.png', emoji:'🪥' },
    frontdesk: { id:'frontdesk', name:'Carla',         role:'Front Desk',       photo:IMG+'staff-frontdesk.png', emoji:'💁' },
    narrator:  { id:'narrator',  name:'Your shift',     role:'',                 photo:null,                       emoji:'🏥' }
  };

  /* ---- Patients (real-looking charts; sim personas, not real people) ---- */
  var PATIENTS = [
    { id:'p_crown', name:'Maria Alvarez', age:52, photo:IMG+'patient-01.png', emoji:'👩', meds:['Lisinopril'], allergies:['Penicillin'], reason:'Crown preparation, tooth #19' },
    { id:'p_comp',  name:'Darnell Carter', age:34, photo:IMG+'patient-02.png', emoji:'👨', meds:[], allergies:['None reported'], reason:'Composite filling, tooth #14' },
    { id:'p_ext',   name:'Joyce Bennett', age:67, photo:IMG+'patient-03.png', emoji:'👵', meds:['Warfarin','Metformin'], allergies:['Sulfa'], reason:'Simple extraction, tooth #3' },
    { id:'p_emerg', name:'Tyler Nguyen', age:28, photo:IMG+'patient-04.png', emoji:'🧑', meds:[], allergies:['None reported'], reason:'Severe lower-left toothache since last night' },
    { id:'p_exam',  name:'Priya Patel', age:41, photo:IMG+'patient-05.png', emoji:'👩', meds:[], allergies:['Latex'], reason:'New-patient exam & full x-ray series' },
    { id:'p_hyg',   name:'Frank Russo', age:58, photo:IMG+'patient-06.png', emoji:'👨', meds:['Atorvastatin'], allergies:['None reported'], reason:'Six-month cleaning & perio check' },
    { id:'p_pedo',  name:'Emma Wright', age:9,  photo:IMG+'patient-07.png', emoji:'🧒', meds:[], allergies:['None reported'], reason:'Recall exam & fluoride' },
    { id:'p_endo',  name:'Gloria Sims', age:47, photo:IMG+'patient-08.png', emoji:'👩', meds:['Levothyroxine'], allergies:['Codeine'], reason:'Evaluation for possible root canal, tooth #30' }
  ];
  var PATIENT_BY_ID = {}; PATIENTS.forEach(function (p) { PATIENT_BY_ID[p.id] = p; });

  /* ---- Instruments (library + tray builder) ---- */
  function ins(id, name, usedFor, emoji) { return { id:id, name:name, usedFor:usedFor, image:IMG+'instr-' + id + '.png', emoji:emoji }; }
  var INSTRUMENTS = [
    ins('mirror','Mouth mirror','Indirect vision, retraction, reflecting light','🪞'),
    ins('explorer','Explorer','Detecting caries, calculus & checking margins by feel','🪡'),
    ins('cotton-pliers','Cotton (college) pliers','Carrying & placing cotton, small items','🤏'),
    ins('periodontal-probe','Periodontal probe','Measuring sulcus/pocket depth in millimeters','📏'),
    ins('spoon-excavator','Spoon excavator','Removing soft decay & temporary material','🥄'),
    ins('condenser','Condenser (plugger)','Packing/condensing restorative material','🔨'),
    ins('carver','Carver','Carving anatomy into a restoration','🔪'),
    ins('scaler','Scaler','Removing supragingival calculus','⛏️'),
    ins('forceps','Extraction forceps','Grasping & removing a tooth','🦷'),
    ins('elevator','Elevator','Loosening a tooth from the socket','🔧'),
    ins('scissors','Surgical scissors','Cutting suture & cord','✂️'),
    ins('hemostat','Hemostat','Grasping & holding tissue/items securely','🗜️'),
    ins('impression-tray','Impression tray','Holding impression material to capture the arch','🍽️'),
    ins('curing-light','Curing light','Light-curing bonded composite','🔦'),
    ins('high-speed-handpiece','High-speed handpiece','Cutting tooth/old restorations (with water)','🌀'),
    ins('low-speed-handpiece','Low-speed handpiece','Polishing, caries removal, lab work','🌀'),
    ins('air-water-syringe','Air-water syringe','Rinsing & drying the field','💨'),
    ins('saliva-ejector','Saliva ejector','Low-volume continuous suction','💧'),
    ins('hve-tip','HVE tip','High-volume evacuation — keeps the field dry & clear','🌬️'),
    ins('matrix-band','Matrix band & retainer','Recreating the wall of a tooth for a filling','➰')
  ];
  var INSTRUMENT_BY_ID = {}; INSTRUMENTS.forEach(function (i) { INSTRUMENT_BY_ID[i.id] = i; });

  /* ---- Trays (procedure → required instruments) ---- */
  var TRAYS = [
    { id:'exam',       procedure:'Basic Exam',          image:IMG+'tray-exam.png',       requiredInstrumentIds:['mirror','explorer','cotton-pliers','periodontal-probe'] },
    { id:'restorative',procedure:'Restorative Filling', image:IMG+'tray-restorative.png',requiredInstrumentIds:['mirror','explorer','cotton-pliers','spoon-excavator','condenser','carver','matrix-band','curing-light'] },
    { id:'crownprep',  procedure:'Crown Preparation',   image:IMG+'tray-crownprep.png',  requiredInstrumentIds:['mirror','explorer','cotton-pliers','high-speed-handpiece','spoon-excavator','impression-tray'] },
    { id:'crownseat',  procedure:'Crown Seat / Cementation', image:IMG+'tray-crownseat.png', requiredInstrumentIds:['mirror','explorer','cotton-pliers','condenser','scaler'] },
    { id:'extraction', procedure:'Simple Extraction',   image:IMG+'tray-extraction.png', requiredInstrumentIds:['mirror','cotton-pliers','elevator','forceps','hemostat'] },
    { id:'endo',       procedure:'Root Canal (Endo)',   image:IMG+'tray-endo.png',       requiredInstrumentIds:['mirror','explorer','cotton-pliers','spoon-excavator','low-speed-handpiece'] },
    { id:'impression', procedure:'Impression',          image:IMG+'tray-impression.png', requiredInstrumentIds:['mirror','cotton-pliers','impression-tray','air-water-syringe'] },
    { id:'hygiene',    procedure:'Hygiene / Cleaning',  image:IMG+'tray-hygiene.png',    requiredInstrumentIds:['mirror','explorer','periodontal-probe','scaler'] }
  ];

  /* ====================================================================
     SCENARIOS — Dr. Williams (and the patient) walk you through a visit.
     step.speaker: 'dentist' | 'patient' | 'assistant' | 'narrator'
     step.type:    'choose' (single) | 'multi' | 'order' | 'identify'
     ==================================================================== */
  var SCENARIOS = [
    {
      id:'morning-setup', icon:'🌅', title:'Morning operatory setup', level:'Beginner', room:'Operatory 1', patientId:null,
      blurb:'Open the office before the first patient — PPE, waterlines, barriers, the spore test and the first tray.',
      competencies:['room_turnover','room_lines','ic_surface','ster_monitor'],
      steps:[
        { speaker:'narrator', category:'Morning Setup', type:'choose',
          prompt:'You arrive 30 minutes early. The FIRST thing you do to plan the day is:',
          options:['Pull up the day\'s schedule','Sit down and wait for the first patient','Guess what procedures are coming','Set up a crown tray just in case'],
          answer:0, explanation:'Reading the schedule first tells you the setups, materials and x-rays each appointment needs, so you can prep ahead and the provider never waits. Anticipation is the assistant\'s superpower.' },
        { speaker:'narrator', category:'Morning Setup', type:'choose',
          prompt:'Now, before you touch any operatory surfaces, you:',
          options:['Perform hand hygiene and don PPE','Switch on the overhead light','Sit down in the assistant\'s chair','Start flushing waterlines bare-handed'],
          answer:0, explanation:'Hand hygiene and PPE come before handling anything — clean hands and barriers protect you and every patient all day.' },
        { speaker:'narrator', category:'Morning Setup', type:'choose',
          prompt:'The waterlines sat stagnant overnight. Before attaching handpieces you should:',
          options:['Flush every waterline for about 2 minutes','Skip it — overnight water is fine','Only flush if a patient complains','Wipe the lines with alcohol'],
          answer:0, explanation:'Flushing waterlines ~2 minutes each morning clears overnight biofilm and standing water before the first patient.' },
        { speaker:'narrator', category:'Morning Setup', type:'choose',
          prompt:'Now you ready the operatory surfaces for the day. You:',
          options:['Place fresh surface barriers and disinfect touch surfaces','Just wipe everything with water','Replace barriers only on Fridays','Leave yesterday\'s barriers — they still look clean'],
          answer:0, explanation:'Fresh barriers on touch surfaces (light handles, chair buttons, tubing) plus disinfection = a clean start and fast turnover.' },
        { speaker:'dentist', category:'Morning Setup', type:'choose',
          prompt:'"Before we see anyone — did infection control get its weekly check?" To prove the autoclave truly sterilizes, this morning you:',
          options:['Run and log a biological (spore) test','Run a paper towel through to "test" it','Trust the temperature gauge','Skip it — modern autoclaves are automatic'],
          answer:0, explanation:'A biological (spore) test is the only proof of true sterilization. Run it and log the result — this is exactly what an inspector checks.' },
        { speaker:'dentist', category:'Morning Setup', type:'multi',
          prompt:'"First up is a new-patient exam. Set the tray." Select every instrument a basic exam tray needs.',
          options:['Mouth mirror','Explorer','Cotton (college) pliers','Surgical forceps','Amalgam carrier'],
          answer:[0,1,2], explanation:'Basic exam = mirror + explorer + cotton pliers. Forceps and a carrier belong to surgical and restorative trays.' }
      ]
    },
    {
      id:'crown-prep', icon:'👑', title:'Crown preparation', level:'Intermediate', room:'Operatory 1', patientId:'p_crown',
      blurb:'Assist Maria\'s crown from tray setup and anesthetic through prep, isolation, the impression and the temporary.',
      competencies:['proc_crown','four_transfer','four_isolation','tray_amalgam'],
      steps:[
        { speaker:'dentist', category:'Crown Prep', type:'multi',
          prompt:'"We\'re prepping #19 for a crown. Beyond the basic setup, what do I need on this tray?" Select all that apply.',
          options:['High-speed handpiece with a diamond bur','Retraction cord & placement instrument','Impression tray & material (or a scanner)','A biological spore strip','A rubber prophy cup'],
          answer:[0,1,2], explanation:'A crown prep cuts the tooth (diamond bur), exposes the margin (cord) and captures it (impression/scan). Spore strips and prophy cups belong elsewhere.' },
        { speaker:'narrator', category:'Crown Prep', type:'choose',
          prompt:'You seat Maria and take her vitals before treatment. Her blood pressure reads 178/104. You:',
          options:['Flag it to Dr. Williams before proceeding — that\'s high enough to reconsider elective treatment today','Ignore it and start the prep','Write it down but say nothing','Keep re-taking it until it reads lower'],
          answer:0, explanation:'Taking and recording blood pressure is part of seating every patient. A hypertensive reading like 178/104 should be flagged to the dentist before elective treatment — stress and anesthetic can push it higher.' },
        { speaker:'patient', category:'Crown Prep', type:'choose',
          prompt:'Maria looks tense: "Is this going to hurt? I really hate needles." The best response is:',
          options:['"Dr. Williams will get the area completely numb first, and I\'ll be right here with you the whole time."','"Probably, but it\'s quick."','"Don\'t worry about it."','Ignore her and prep the tray.'],
          answer:0, explanation:'Acknowledge the fear, explain what happens, and reassure. Calm, honest communication lowers anxiety and builds trust.' },
        { speaker:'dentist', category:'Crown Prep', type:'choose',
          prompt:'"I\'m ready for the anesthetic." During the injection, your role is to:',
          options:['Pass the syringe in the transfer zone, recapped safely, and reassure Maria','Give the injection yourself','Step out of the room','Hold the patient down'],
          answer:0, explanation:'Assistants prepare and transfer the anesthetic syringe safely (one-handed recap) and keep the patient calm — the dentist administers it.' },
        { speaker:'dentist', category:'Crown Prep', type:'choose',
          prompt:'"Starting the prep." As the high-speed runs, keep my field clear by:',
          options:['Using HVE suction with the air-water syringe and retracting the cheek/tongue','Packing gauze in the mouth and waiting','Brightening the overhead light only','Relying on the saliva ejector alone'],
          answer:0, explanation:'High-volume evacuation plus retraction keeps the prep dry and visible. A dry field means the dentist can see — faster, safer work.' },
        { speaker:'dentist', category:'Crown Prep', type:'choose',
          prompt:'"Margin\'s ready — before the impression, what goes in?"',
          options:['Retraction cord to expose the margin and control fluid','The final cemented crown','Fluoride varnish','A rubber dam clamp on the gum'],
          answer:0, explanation:'Retraction cord gently pushes the gingiva away and controls moisture so the margin records cleanly in the impression or scan.' },
        { speaker:'dentist', category:'Crown Prep', type:'choose',
          prompt:'"The lab will make the crown. Last step before Maria leaves?"',
          options:['Make and cement a temporary crown and give care instructions','Schedule nothing and send her out','Peel off the barriers and reuse them','Dismiss her with the prepped tooth exposed'],
          answer:0, explanation:'A temporary protects the prepped tooth and holds the space until the lab crown returns. Always finish with clear home-care instructions.' }
      ]
    },
    {
      id:'composite', icon:'🦷', title:'Composite filling', level:'Intermediate', room:'Operatory 2', patientId:'p_comp',
      blurb:'Assist Darnell\'s tooth-colored filling — isolation, the etch-bond-cure sequence, layering and the bite check.',
      competencies:['tray_amalgam','mat_etch','four_isolation','four_transfer'],
      steps:[
        { speaker:'dentist', category:'Composite', type:'multi',
          prompt:'"Composite on #14. Build the tray beyond mirror/explorer/pliers." Select all that apply.',
          options:['Placement instrument, condenser & carver','Etch, bonding agent, composite & curing light','Articulating paper to check the bite','A surgical elevator','A spore strip'],
          answer:[0,1,2], explanation:'Composite needs placement/condensing/carving instruments, the bonding materials + curing light, and articulating paper for the bite. Elevators and spore strips don\'t belong.' },
        { speaker:'dentist', category:'Composite', type:'choose',
          prompt:'"Why am I so picky about isolation on a composite?"',
          options:['Bonding fails if the prep is contaminated by saliva or moisture','It only makes the filling look nicer','Composite doesn\'t need isolation','It just saves suction time'],
          answer:0, explanation:'Composite chemically bonds to the tooth. Even a little saliva contamination ruins the bond — a dry, isolated field is non-negotiable.' },
        { speaker:'dentist', category:'Composite', type:'order',
          prompt:'"Walk me through the bonding sequence — put these in order." Drag/use the arrows to order the steps.',
          options:['Etch','Rinse & dry','Apply bonding agent','Light-cure the bond','Place & cure composite'],
          answer:[0,1,2,3,4], explanation:'Etch to micro-roughen enamel, rinse/dry, apply bonding agent and cure it, then place and cure the composite. Order is everything for a lasting bond.' },
        { speaker:'dentist', category:'Composite', type:'choose',
          prompt:'"You\'re running the curing light — key safety step?"',
          options:['Use the orange shield and look away to protect everyone\'s eyes','Stare at the tip to confirm it\'s on','Aim it toward the patient\'s eyes','No precautions needed'],
          answer:0, explanation:'The curing light is intense blue light. Use the orange shield and avoid looking directly at it to protect your eyes and the patient\'s.' },
        { speaker:'dentist', category:'Composite', type:'choose',
          prompt:'"I\'m placing it in small increments — why not one big mass?"',
          options:['It cures fully and reduces shrinkage and voids','It uses more material','It\'s faster','No real reason'],
          answer:0, explanation:'Layering lets each increment cure completely and limits shrinkage stress, giving a stronger, longer-lasting filling.' },
        { speaker:'dentist', category:'Composite', type:'choose',
          prompt:'"Carved and cured. What\'s the final check before Darnell leaves?"',
          options:['Check the bite with articulating paper and adjust high spots','Skip it — composites self-adjust','Only confirm the shade','Move to the next patient'],
          answer:0, explanation:'Articulating paper marks high spots so the dentist adjusts the bite. A filling that\'s "too tall" causes pain — always verify occlusion.' }
      ]
    },
    {
      id:'extraction', icon:'🩹', title:'Simple extraction', level:'Intermediate', room:'Operatory 2', patientId:'p_ext',
      blurb:'Assist Joyce\'s extraction — confirm & consent, manage the field, control bleeding and give post-op care.',
      competencies:['proc_extraction','four_isolation','comm_postop','mh_alert'],
      steps:[
        { speaker:'dentist', category:'Extraction', type:'multi',
          prompt:'"Extracting #3 today. Set the tray." Select every item that belongs.',
          options:['Mirror, explorer & cotton pliers','Elevators (periosteal / straight)','Extraction forceps for that tooth','Surgical curette & gauze','A composite curing light'],
          answer:[0,1,2,3], explanation:'Extractions use elevators to loosen, forceps to remove, a curette to debride and gauze for hemostasis. A curing light has no role here.' },
        { speaker:'dentist', category:'Extraction', type:'choose',
          prompt:'"Joyce takes Warfarin. Before we touch anything, what matters most?"',
          options:['Flag the blood thinner & confirm consent, correct tooth and anesthesia','Her lunch order','Nothing — just start','Sort it out afterward'],
          answer:0, explanation:'Warfarin raises bleeding risk — flag it to the dentist. Right tooth, informed consent, current history and anesthesia are verified every time.' },
        { speaker:'dentist', category:'Extraction', type:'choose',
          prompt:'"During the extraction, what are your main chairside jobs?"',
          options:['Retraction, suction, clear visibility and steadying/reassuring Joyce','Pulling the forceps with me','Leaving to chart','Charting only, ignoring the field'],
          answer:0, explanation:'You retract, suction, keep the site visible and support the patient. Four-handed teamwork keeps the procedure smooth and safe.' },
        { speaker:'dentist', category:'Extraction', type:'choose',
          prompt:'"Tooth\'s out. Control the bleeding."',
          options:['Place folded gauze over the socket; have her bite firm pressure','Have her rinse vigorously right away','Pack a cotton roll and forget it','Do nothing and dismiss her'],
          answer:0, explanation:'Firm gauze pressure over the socket forms the clot. Vigorous early rinsing can dislodge it and cause a painful dry socket.' },
        { speaker:'patient', category:'Extraction', type:'multi',
          prompt:'Joyce asks, "What do I do at home tonight?" Select the correct post-op instructions.',
          options:['Bite on gauze 30–60 min; replace as needed','No smoking, spitting or straws','Soft diet & no vigorous rinsing for 24 hours','Resume intense exercise right away'],
          answer:[0,1,2], explanation:'Pressure, protecting the clot (no suction/straws/smoking) and a gentle 24-hour routine prevent dry socket. Strenuous activity raises bleeding risk.' },
        { speaker:'patient', category:'Extraction', type:'choose',
          prompt:'"And if it bleeds a lot or really hurts tonight?"',
          options:['Give written instructions plus the office / emergency number to call','Tell her to just wait a week','Say nothing — it\'ll be fine','Suggest she search online'],
          answer:0, explanation:'Always send written post-op instructions and a real after-hours number. Clear communication is part of the standard of care.' }
      ]
    },
    {
      id:'sterilization', icon:'♨️', title:'Sterilization workflow', level:'Beginner', room:'Sterilization', patientId:null,
      blurb:'Process contaminated instruments correctly — heavy PPE, one-directional flow, cleaning, packaging, autoclave, spore test.',
      competencies:['ster_clean','ster_monitor','ic_ppe'],
      steps:[
        { speaker:'narrator', category:'Sterilization', type:'choose',
          prompt:'You carry a tray of used, contaminated instruments into the steri area. The PPE for processing is:',
          options:['Heavy utility gloves, mask, eye protection and a gown','No gloves in the steri area','Thin exam gloves only','Just a mask'],
          answer:0, explanation:'Reprocessing dirty, sharp instruments calls for puncture-resistant utility gloves plus mask, eyewear and gown.' },
        { speaker:'narrator', category:'Sterilization', type:'order',
          prompt:'Processing flows in ONE direction. Put the workflow in the correct order.',
          options:['Receiving / cleaning','Packaging','Sterilizing (autoclave)','Clean storage'],
          answer:[0,1,2,3], explanation:'Dirty enters at one end and clean exits at the other, never crossing back. One-directional flow is the heart of a sterilization area.' },
        { speaker:'narrator', category:'Sterilization', type:'choose',
          prompt:'The safest way to remove debris before sterilizing is:',
          options:['An ultrasonic cleaner or instrument washer','Scrubbing each one by hand in the patient sink','Wiping with a dry paper towel','Skipping cleaning and going straight to the autoclave'],
          answer:0, explanation:'Ultrasonic/automated cleaning removes bioburden while keeping hands away from sharps. Instruments must be clean before they can be sterilized.' },
        { speaker:'narrator', category:'Sterilization', type:'choose',
          prompt:'You package instruments for the autoclave. Each pouch needs:',
          options:['A chemical indicator plus date/load info, sealed properly','Nothing — just toss them in','Tape and the patient\'s name','To be left open so steam gets in'],
          answer:0, explanation:'A sealed pouch with a chemical indicator (and date/load) shows it was processed and keeps contents sterile until use.' },
        { speaker:'dentist', category:'Sterilization', type:'choose',
          prompt:'"How do we prove — weekly — that the autoclave actually kills everything?"',
          options:['Run a biological (spore) test and log the result','Watch the steam','Check the clock advanced','Ask a coworker if it seemed hot'],
          answer:0, explanation:'Only a biological (spore) test confirms living spores were killed — the gold standard of sterilization monitoring. Log every result.' },
        { speaker:'narrator', category:'Sterilization', type:'choose',
          prompt:'A sterilized pouch comes out of the autoclave wet. You:',
          options:['Reprocess it — a wet or torn pouch is considered contaminated','Use it anyway','Leave it on the dirty side','Dry it with a towel and store it'],
          answer:0, explanation:'A wet or torn pouch is considered contaminated and must be reprocessed. Otherwise store sealed, dated pouches clean and use oldest first.' }
      ]
    },
    {
      id:'emergency', icon:'🚑', title:'Emergency appointment', level:'Intermediate', room:'Operatory 3', patientId:'p_emerg',
      blurb:'Tyler walks in with a severe toothache. Triage it, set the room and tray, brief the doctor and keep him comfortable.',
      competencies:['mh_review','mh_alert','comm_phone','four_isolation'],
      steps:[
        { speaker:'frontdesk', category:'Emergency', type:'choose',
          prompt:'Carla: "Tyler called — severe lower-left pain since last night, can we squeeze him in?" Your first step when he arrives:',
          options:['Review & update his medical history before anything clinical','Send him straight back to a chair','Take an x-ray with no history','Tell him to come back tomorrow'],
          answer:0, explanation:'Every patient — especially a walk-in emergency — needs a current medical history first: meds, allergies, conditions that change care.' },
        { speaker:'patient', category:'Emergency', type:'choose',
          prompt:'Tyler: "It\'s a sharp, throbbing pain in my lower left, worse with cold. It kept me up all night." You relay to the doctor that this most likely needs:',
          options:['A focused exam + x-ray of the lower-left to find the source','An immediate extraction, no imaging','Just a cleaning','Nothing — give him aspirin and send him home'],
          answer:0, explanation:'Throbbing, cold-sensitive pain points to pulpal involvement. The doctor needs a focused exam and a radiograph to diagnose before treatment.' },
        { speaker:'dentist', category:'Emergency', type:'choose',
          prompt:'"Get me a periapical of the lower-left." Following ALARA, you:',
          options:['Place the lead apron, position the sensor, and step behind the barrier','Skip the apron to save time','Hold the sensor in his mouth with your finger','Take ten images to be safe'],
          answer:0, explanation:'ALARA = As Low As Reasonably Achievable: lead apron on the patient, correct positioning, and you step back/behind the barrier. Never hold the sensor.' },
        { speaker:'dentist', category:'Emergency', type:'choose',
          prompt:'"Looks like an irreversible pulpitis on #18 — likely a root canal or extraction." While I finish the exam, you:',
          options:['Set up the right room and tray and keep Tyler informed and comfortable','Book his 6-month cleaning','Start the procedure yourself','Leave the room'],
          answer:0, explanation:'Anticipate the likely treatment, ready the room/tray, and keep the anxious patient informed. Smooth support is what makes an emergency go well.' },
        { speaker:'patient', category:'Emergency', type:'choose',
          prompt:'Tyler, anxious: "Am I going to lose the tooth? How much will this cost?" Best response:',
          options:['"Dr. Williams will walk you through the options and the estimate before anything is done."','"Probably, and it\'s expensive."','"I can\'t talk about that."','Guess at a price yourself.'],
          answer:0, explanation:'Reassure and defer treatment-plan and cost specifics to the dentist/front desk. Never guess fees or prognosis — set the handoff and keep him calm.' },
        { speaker:'dentist', category:'Emergency', type:'multi',
          prompt:'"Before he leaves today, what does he need?" Select all that apply.',
          options:['Clear instructions for managing pain until the next visit','The treatment plan & next appointment scheduled','An after-hours number if it worsens','A prescription you write yourself'],
          answer:[0,1,2], explanation:'He leaves with pain-management guidance, a plan and next appointment, and an emergency contact. Assistants never prescribe — the dentist does.' }
      ]
    }
  ];
  var SCENARIO_BY_ID = {}; SCENARIOS.forEach(function (s) { SCENARIO_BY_ID[s.id] = s; });

  /* ====================================================================
     DAY SHIFT — "Your shift": a schedule of patients. Each appointment is
     a short, chart-personalized set of decisions run by the ScenarioPlayer.
     ==================================================================== */
  var DAY_SHIFT = [
    {
      id:'shift-exam', time:'8:30a', icon:'🪥', title:'New-patient exam', patientId:'p_exam',
      competencies:['ic_ppe','tray_exam','mh_alert','room_turnover'],
      steps:[
        { speaker:'narrator', category:'Day Shift', type:'choose',
          prompt:'Priya is your first patient of the day. Before you seat her, you:',
          options:['Perform hand hygiene, don PPE, and confirm fresh barriers are set','Go straight to taking x-rays','Seat her without checking the room','Reuse the last patient\'s barriers'],
          answer:0, explanation:'Every patient starts with clean hands, PPE and a barriered, disinfected room. It protects Priya and you.' },
        { speaker:'dentist', category:'Day Shift', type:'choose',
          prompt:'"New-patient exam — set the tray."',
          options:['Basic exam: mirror, explorer, cotton pliers, periodontal probe','A crown-prep tray','Extraction forceps and elevators','A surgical setup'],
          answer:0, explanation:'A new-patient exam uses the basic exam tray. The other setups are for specific procedures.' },
        { speaker:'narrator', category:'Day Shift', type:'choose',
          prompt:'Priya\'s chart flags a LATEX allergy. You:',
          options:['Use non-latex (nitrile) gloves and latex-free supplies, and alert the team','Ignore it — she\'ll probably be fine','Use regular latex gloves to save time','Only react if she has a reaction'],
          answer:0, explanation:'A latex allergy means latex-free gloves and supplies for the whole visit — and make sure the team knows before you start.' },
        { speaker:'dentist', category:'Day Shift', type:'choose',
          prompt:'"Exam\'s done. Before the next patient?"',
          options:['Disinfect and re-barrier the room, and process the used instruments','Leave it for the end of the day','Just wipe the chair arm','Reuse the instruments on the next patient'],
          answer:0, explanation:'Turn the room over between every patient: disinfect, fresh barriers, and reprocess instruments. Never reuse un-sterilized instruments.' }
      ]
    },
    {
      id:'shift-crown', time:'10:00a', icon:'👑', title:'Crown preparation', patientId:'p_crown',
      competencies:['tray_amalgam','mh_alert','proc_crown','comm_postop'],
      steps:[
        { speaker:'dentist', category:'Day Shift', type:'choose',
          prompt:'"Maria\'s here for the crown on #19. Build the tray."',
          options:['Crown prep: high-speed with diamond bur, retraction cord, impression material','Basic exam tray only','Extraction forceps','A hygiene/cleaning setup'],
          answer:0, explanation:'A crown prep cuts the tooth, exposes the margin (cord) and captures it (impression/scan).' },
        { speaker:'patient', category:'Day Shift', type:'choose',
          prompt:'Maria, nervous: "I really hate the numbing shot." You:',
          options:['Acknowledge it, explain Dr. Williams will get it fully numb, and stay with her','Tell her it\'ll hurt a little','Tell her not to be a baby','Say nothing and keep prepping'],
          answer:0, explanation:'Empathy + a clear explanation + your presence lowers anxiety. That\'s real chairside care.' },
        { speaker:'narrator', category:'Day Shift', type:'choose',
          prompt:'Maria\'s chart notes a PENICILLIN allergy. Why keep it flagged today?',
          options:['If any antibiotic is prescribed, penicillin-class drugs must be avoided — keep it visible for the dentist','It doesn\'t matter for dental treatment','It means she can\'t be numbed','It means she can\'t have x-rays'],
          answer:0, explanation:'Allergies drive prescribing decisions. A flagged penicillin allergy prevents a dangerous antibiotic choice.' },
        { speaker:'dentist', category:'Day Shift', type:'choose',
          prompt:'"Prep\'s done — the lab will make the crown. Before Maria leaves?"',
          options:['Place a temporary crown and give home-care instructions','Send her out with nothing','Strip the barriers to reuse them','Dismiss her with the prepped tooth exposed'],
          answer:0, explanation:'A temporary protects the tooth until the lab crown is ready — always paired with clear home-care instructions.' }
      ]
    },
    {
      id:'shift-extraction', time:'11:30a', icon:'🩹', title:'Simple extraction', patientId:'p_ext',
      competencies:['mh_alert','proc_extraction','comm_postop','four_isolation'],
      steps:[
        { speaker:'narrator', category:'Day Shift', type:'choose',
          prompt:'Joyce\'s chart shows she takes WARFARIN (a blood thinner). Your move before the extraction:',
          options:['Flag the bleeding risk to the dentist before anything starts','Ignore it — it\'s just a pill','Cancel the appointment yourself','Give her an aspirin'],
          answer:0, explanation:'Warfarin raises bleeding risk. Flagging it lets the dentist plan for hemostasis — a key safety catch.' },
        { speaker:'dentist', category:'Day Shift', type:'choose',
          prompt:'"Set the extraction tray for #3."',
          options:['Mirror & pliers, elevators, forceps, curette and gauze','A crown-prep tray','A composite/bonding setup','A hygiene tray'],
          answer:0, explanation:'Elevators loosen, forceps remove, the curette debrides, and gauze controls bleeding.' },
        { speaker:'dentist', category:'Day Shift', type:'choose',
          prompt:'"Tooth\'s delivered — control the bleeding."',
          options:['Folded gauze over the socket with firm bite pressure','Have her rinse vigorously right away','Pack a cotton roll and forget it','Do nothing'],
          answer:0, explanation:'Firm gauze pressure forms the clot. Early vigorous rinsing can dislodge it and cause a dry socket.' },
        { speaker:'patient', category:'Day Shift', type:'multi',
          prompt:'Joyce: "What do I do at home?" Select the correct post-op instructions.',
          options:['Bite on gauze 30–60 minutes, replacing as needed','No smoking, spitting or straws','Soft diet and gentle (no vigorous) rinsing for 24h','Hit the gym hard this afternoon'],
          answer:[0,1,2], explanation:'Protect the clot: pressure, no suction/straws/smoking, and an easy 24 hours. Strenuous activity raises bleeding risk.' }
      ]
    },
    {
      id:'shift-emergency', time:'1:30p', icon:'🚑', title:'Emergency walk-in', patientId:'p_emerg',
      competencies:['mh_review','comm_phone','mh_alert','comm_postop'],
      steps:[
        { speaker:'frontdesk', category:'Day Shift', type:'choose',
          prompt:'Carla squeezes in Tyler — severe lower-left pain. When he arrives, your first step:',
          options:['Review and update his medical history before anything clinical','Send him straight back to a chair','Take an x-ray with no history','Tell him to come back tomorrow'],
          answer:0, explanation:'Even an emergency walk-in needs a current medical history first — meds, allergies, conditions that change care.' },
        { speaker:'dentist', category:'Day Shift', type:'choose',
          prompt:'"I need a periapical of the lower-left." Following ALARA, you:',
          options:['Place the lead apron, position the sensor, and step behind the barrier','Skip the apron to save time','Hold the sensor in his mouth with your finger','Take ten images to be safe'],
          answer:0, explanation:'ALARA: apron on, correct positioning, you step back. Never hold the sensor for the patient.' },
        { speaker:'patient', category:'Day Shift', type:'choose',
          prompt:'Tyler, anxious: "Am I going to lose the tooth? How much will this cost?"',
          options:['"Dr. Williams will walk you through the options and the estimate before anything is done."','"Probably, and it\'s expensive."','"I can\'t talk about that."','Guess a price for him'],
          answer:0, explanation:'Reassure and hand treatment-plan and cost questions to the dentist/front desk. Never guess fees or prognosis.' },
        { speaker:'dentist', category:'Day Shift', type:'multi',
          prompt:'"Before Tyler leaves today, what does he need?" Select all that apply.',
          options:['Clear pain-management instructions until the next visit','A treatment plan and next appointment','An after-hours number if it worsens','A prescription you write yourself'],
          answer:[0,1,2], explanation:'He leaves with pain guidance, a plan and appointment, and a way to reach the office. Assistants never prescribe — the dentist does.' }
      ]
    }
  ];

  window.SL_VO_DATA = {
    IMG_BASE: IMG,
    STAFF: STAFF,
    PATIENTS: PATIENTS, PATIENT_BY_ID: PATIENT_BY_ID,
    INSTRUMENTS: INSTRUMENTS, INSTRUMENT_BY_ID: INSTRUMENT_BY_ID,
    TRAYS: TRAYS,
    SCENARIOS: SCENARIOS, SCENARIO_BY_ID: SCENARIO_BY_ID,
    DAY_SHIFT: DAY_SHIFT,
    resolveSpeaker: function (key, scenario) {
      if (key === 'patient' && scenario && scenario.patientId) return PATIENT_BY_ID[scenario.patientId] || STAFF.narrator;
      return STAFF[key] || STAFF.narrator;
    }
  };
})();
