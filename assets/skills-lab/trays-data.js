/* ============================================================================
   PREMIER DENTAL ACADEMY — SKILLS LAB · PROCEDURE TRAY SETUPS
   ----------------------------------------------------------------------------
   Which instruments belong on the tray for each procedure, and how they are
   arranged once they get there. This file exists so tray setups live in ONE
   place: the tray-builder drill grades against it, the procedures pages read
   from it, and a correction made here shows up everywhere at once.

   The five original setups in data/virtual-office.js (exam, restorative, crown,
   endo, extraction) are preserved here — same ids, same instruments — and the
   list is expanded to the fourteen procedures an assistant sets up in a general
   practice.

   Plain global script (the site does not use ES modules in the browser) —
   exposes window.SL_TRAYS = { RULES, SETUPS }.

   Shape:
     RULES  — [ { id, rule, why } ]
              The four arrangement conventions the trainer grades against, each
              with the practical reason a working office does it that way.

     SETUPS — [ { id, procedure, blurb, instrumentIds, sequence, notes } ]
              instrumentIds — every item that belongs on the setup. Each one is
                              an id from INSTRUMENTS in data/virtual-office.js.
              sequence      — the correct LEFT-TO-RIGHT order of the instrument
                              row, used for grading. Any id in instrumentIds
                              that does NOT appear in sequence is a top-row
                              item (cotton products, gauze) placed across the
                              top of the tray under the cotton-top rule.
              notes         — chairside points a student should carry into the
                              operatory with this setup.

   Two honest caveats, and they matter:
   1. Tray layout is a strong teaching convention, not a national standard.
      Offices and instructors vary in the details. Learn the arrangement your
      own office uses before you set a tray for a live patient.
   2. Single-use items dispensed at the chair — prophy angles and paste, sealant
      applicator syringes, scalpel blades, suture needles, anesthetic cartridges
      and needles, impression putty — are materials rather than instruments, so
      some of them are described in `notes` instead of appearing in
      `instrumentIds`.

   14 setups. When editing: every id must exist in INSTRUMENTS, and `sequence`
   must be a subset of `instrumentIds`.
   ============================================================================ */
(function () {
  'use strict';

  window.SL_TRAYS = {

    /* ---- The four arrangement conventions the trainer grades against ---- */
    RULES: [

      {
        id: 'order-of-use',
        rule: 'Place the instruments left to right in the order they will be used.',
        why: 'The dentist reaches for the next instrument without looking away from the mouth. When the tray reads like the procedure, the next thing needed is always the next one down the row, so transfers happen by feel and stay fast. It is also the fastest way to check your own work — set the tray in order, walk the procedure in your head, and a missing item shows up as a gap before the patient is ever seated.'
      },

      {
        id: 'cotton-top',
        rule: 'Cotton products and gauze go across the TOP of the tray, above the instrument row.',
        why: 'Gauze, cotton rolls, dry angles and pellets get grabbed constantly and out of sequence — to dry a prep, wipe a working end, blot cement or apply pressure. Parking them along the top keeps them reachable without reaching over or breaking up the ordered row, and it keeps loose cotton fibres off the instrument tips.'
      },

      {
        id: 'hinged-right',
        rule: 'Hinged instruments — forceps, scissors, needle holders and hemostats — are grouped at the RIGHT end of the tray.',
        why: 'Hinged instruments are bulky and their handles spread open, so mixed into the row they push everything else apart and tangle together. Keeping them as one group on the right means the surgical instruments are always in the same place, even under a drape, and the assistant can hand off a whole group at once. The basic setup is the exception — mirror, explorer and cotton pliers stay at the far left because they are used first and travel as a unit.'
      },

      {
        id: 'group-by-function',
        rule: 'Group the instruments by function — examination, hand instruments, restorative or procedure-specific items, then the hinged group.',
        why: 'Grouping by job lets anyone audit a tray at a glance: the exam group is either there or it is not, the restorative group is either complete or it is missing a carver. It also tells you what to do when two rules disagree. On a surgical setup, function grouping and the hinged rule win over strict order of use — the forceps sit with the other hinged instruments on the right even though they are picked up before the sutures. Remember that offices and instructors vary in these details; match the convention where you work.'
      }

    ],

    /* ---- 14 procedure setups ---- */
    SETUPS: [

      {
        id: 'exam',
        procedure: 'Basic exam',
        blurb: 'The setup every operatory starts with — look, feel, measure, dry.',
        instrumentIds: ['mirror', 'explorer', 'cotton-pliers', 'periodontal-probe', 'air-water-syringe', 'saliva-ejector', 'gauze'],
        sequence: ['mirror', 'explorer', 'cotton-pliers', 'periodontal-probe', 'air-water-syringe', 'saliva-ejector'],
        notes: 'Mirror, explorer and cotton pliers are the classic basic setup, and they open almost every other tray in this file — learn those three cold and every setup after this is an addition to them. Most offices add a periodontal probe so the dentist can measure a pocket without a second tray. The mirror does three jobs at once: indirect vision, retraction of the cheek or tongue, and reflecting light onto the field. Many setups carry two mirrors so the dentist can retract with one and view with the other.'
      },

      {
        id: 'prophy',
        procedure: 'Prophylaxis (adult cleaning)',
        blurb: 'A routine recall cleaning — calculus removal, polish, floss, fluoride.',
        instrumentIds: ['mirror', 'explorer', 'cotton-pliers', 'periodontal-probe', 'scaler', 'low-speed-handpiece', 'floss', 'air-water-syringe', 'saliva-ejector', 'hve-tip', 'gauze', 'cotton-rolls'],
        sequence: ['mirror', 'explorer', 'cotton-pliers', 'periodontal-probe', 'scaler', 'low-speed-handpiece', 'floss', 'air-water-syringe', 'saliva-ejector', 'hve-tip'],
        notes: 'The prophy angle, rubber cup and paste are single-use items that snap onto the slow-speed motor, and fluoride varnish is dispensed from its own unit-dose package — neither lives on the instrument tray. Hand scalers remove calculus above the gumline and most offices add an ultrasonic scaler, which throws aerosol, so high-volume evacuation and eye protection matter here. Setting the room and the tray is the assistant\'s job; which clinical tasks a registered dental assistant may perform is set by the Texas State Board of Dental Examiners, so follow your own office\'s protocol.'
      },

      {
        id: 'sealants',
        procedure: 'Sealants',
        blurb: 'Sealing the pits and fissures of caries-free molars — an isolation procedure more than a cutting one.',
        instrumentIds: ['mirror', 'explorer', 'cotton-pliers', 'low-speed-handpiece', 'etch', 'curing-light', 'articulating-paper', 'floss', 'air-water-syringe', 'saliva-ejector', 'hve-tip', 'gauze', 'cotton-rolls', 'dri-aids', 'cotton-pellets'],
        sequence: ['mirror', 'explorer', 'cotton-pliers', 'low-speed-handpiece', 'air-water-syringe', 'hve-tip', 'saliva-ejector', 'etch', 'curing-light', 'articulating-paper', 'floss'],
        notes: 'Sealants go into the pits and fissures of teeth that are free of decay, most often permanent molars soon after they erupt. The sealant resin comes in its own single-use applicator syringe and is dispensed at the chair rather than laid on the tray. Anesthetic is normally not needed because no tooth structure is cut. Isolation decides whether the sealant lasts — saliva touching the etched enamel is a common reason sealants fail, which is why cotton rolls and dry angles are stacked across the top. Follow the manufacturer\'s instructions for etch and cure times, then check the sealed grooves with the explorer and the bite with articulating paper.'
      },

      {
        id: 'restorative',
        procedure: 'Composite restoration',
        blurb: 'A tooth-colored filling — etch, bond, layer, cure, carve, check the bite.',
        instrumentIds: ['high-speed-handpiece', 'low-speed-handpiece', 'hve-tip', 'saliva-ejector', 'air-water-syringe', 'gauze', 'cotton-rolls', 'dri-aids', 'cotton-pellets', 'mirror', 'explorer-probe', 'spoon-excavator', 'cotton-pliers', 'condenser', 'matrix-band', 'wedge', 'articulating-paper', 'anesthetic-syringe', 'etch', 'bond', 'curing-light', 'composite', 'flowable-composite', 'shade-guide', 'bite-block', 'floss'],
        sequence: ['mirror', 'explorer-probe', 'cotton-pliers', 'shade-guide', 'anesthetic-syringe', 'bite-block', 'high-speed-handpiece', 'air-water-syringe', 'hve-tip', 'saliva-ejector', 'spoon-excavator', 'matrix-band', 'wedge', 'etch', 'bond', 'curing-light', 'flowable-composite', 'composite', 'condenser', 'low-speed-handpiece', 'floss', 'articulating-paper'],
        notes: 'Take the shade first, before the tooth dries out — an isolated tooth dehydrates and lightens, and a shade matched late reads too light once the tooth rehydrates. Composite bonds chemically, so a contaminated field ruins the restoration: saliva on etched enamel means rinsing, drying and re-etching. The curing light is picked up more than once — after the bonding agent and again after each increment — and everyone looks away or uses the orange shield. Layering in small increments lets each one cure through and limits shrinkage stress. This tray has no hinged instruments, so the whole row is graded on order of use.'
      },

      {
        id: 'amalgam',
        procedure: 'Amalgam restoration',
        blurb: 'A silver filling — condensed, carved and burnished, with no bonding step.',
        instrumentIds: ['high-speed-handpiece', 'low-speed-handpiece', 'hve-tip', 'saliva-ejector', 'air-water-syringe', 'gauze', 'cotton-rolls', 'dri-aids', 'cotton-pellets', 'mirror', 'explorer-probe', 'cotton-pliers', 'spoon-excavator', 'anesthetic-syringe', 'bite-block', 'matrix-band', 'wedge', 'condenser', 'carver', 'floss', 'articulating-paper'],
        sequence: ['mirror', 'explorer-probe', 'cotton-pliers', 'anesthetic-syringe', 'bite-block', 'high-speed-handpiece', 'air-water-syringe', 'hve-tip', 'saliva-ejector', 'spoon-excavator', 'matrix-band', 'wedge', 'condenser', 'carver', 'floss', 'articulating-paper', 'low-speed-handpiece'],
        notes: 'The amalgam carrier, amalgam well and burnisher travel with this setup and are added from the restorative cassette. Amalgam is triturated from a pre-dosed capsule in an amalgamator and has a working time, so it is mixed when the dentist asks for it and not before. Notice what is missing compared with the composite tray: no etchant, no bonding agent, no curing light and no shade guide — amalgam self-hardens and does not get light-cured. Scrap amalgam goes into the amalgam separator or a sealed scrap container, never the trash, the sharps container or the suction line. Amalgam is placed far less than it once was, but general offices still place and replace it.'
      },

      {
        id: 'crown',
        procedure: 'Crown preparation and temporary',
        blurb: 'Prep the tooth, expose the margin, record it, then build the provisional that protects it.',
        instrumentIds: ['high-speed-handpiece', 'low-speed-handpiece', 'hve-tip', 'saliva-ejector', 'air-water-syringe', 'gauze', 'cotton-rolls', 'dri-aids', 'cotton-pellets', 'mirror', 'explorer-probe', 'spoon-excavator', 'cotton-pliers', 'condenser', 'cb-scissors', 'retraction-cord', 'cord-packer', 'ferric-sulfate', 'articulating-paper', 'anesthetic-syringe', 'heavy-body', 'light-body', 'bite-registration', 'temp-crown-material', 'impression-tray', 'floss', 'cement', 'curing-light', 'shade-guide', 'bite-block'],
        sequence: ['mirror', 'explorer-probe', 'cotton-pliers', 'shade-guide', 'anesthetic-syringe', 'bite-block', 'high-speed-handpiece', 'air-water-syringe', 'hve-tip', 'saliva-ejector', 'spoon-excavator', 'condenser', 'cord-packer', 'retraction-cord', 'ferric-sulfate', 'impression-tray', 'heavy-body', 'light-body', 'bite-registration', 'temp-crown-material', 'cb-scissors', 'low-speed-handpiece', 'cement', 'curing-light', 'floss', 'articulating-paper'],
        notes: 'Shade goes first, before the tooth dehydrates under isolation. Retraction cord pushes the gingiva away and controls fluid so the margin records cleanly; count the cord in and count it out, because a length left in the sulcus causes tissue trouble the patient blames on the crown. Heavy body fills the tray while light body is syringed around the prep to capture margin detail — many offices now replace both with a digital scan. The provisional is trimmed with crown and bridge scissors, which are hinged, so they sit at the right end of the row. Do not dismiss the patient without the temporary cemented, the excess cement flossed out and home-care instructions given.'
      },

      {
        id: 'crown-cementation',
        procedure: 'Crown cementation (seat and deliver)',
        blurb: 'The delivery appointment — off with the temporary, try in, adjust, cement, clean up.',
        instrumentIds: ['mirror', 'explorer', 'cotton-pliers', 'anesthetic-syringe', 'hemostat', 'spoon-excavator', 'scaler', 'high-speed-handpiece', 'low-speed-handpiece', 'air-water-syringe', 'hve-tip', 'saliva-ejector', 'floss', 'articulating-paper', 'cement', 'curing-light', 'gauze', 'cotton-rolls', 'dri-aids', 'cotton-pellets'],
        sequence: ['mirror', 'explorer', 'cotton-pliers', 'anesthetic-syringe', 'hemostat', 'spoon-excavator', 'scaler', 'air-water-syringe', 'hve-tip', 'saliva-ejector', 'floss', 'articulating-paper', 'high-speed-handpiece', 'low-speed-handpiece', 'cement', 'curing-light'],
        notes: 'The hemostat lifts the temporary off, and it is the one hinged instrument here, so it belongs at the right end. Every trace of temporary cement comes off the prep before the crown is tried in, or the crown will not seat fully. Floss and articulating paper are used twice — once at try-in and again after cementation — so the row shows them at the try-in position. The crown is checked for margin fit, contacts and occlusion before any cement is mixed, because after cementation the adjustment options shrink. Cement left in the sulcus is a well-known cause of later inflammation around a new crown: floss every contact and run the explorer or scaler around the margin. Cements differ — some are light-cured, some self-cure, some dual-cure — so follow the manufacturer\'s instructions on that specific product. Anesthetic is on the tray because some patients want it, but many crowns are seated without it.'
      },

      {
        id: 'extraction',
        procedure: 'Simple extraction',
        blurb: 'A tooth removed whole, without cutting tissue or bone — loosen, deliver, debride, control the bleeding.',
        instrumentIds: ['gauze', 'air-water-syringe', 'surgical-suction', 'mirror', 'cotton-pliers', 'anesthetic-syringe', 'cheek-retractor', 'elevator', 'surgical-curette', 'bone-file', 'forceps', 'rongeurs', 'hemostat', 'scissors', 'sutures'],
        sequence: ['mirror', 'cotton-pliers', 'anesthetic-syringe', 'cheek-retractor', 'surgical-suction', 'air-water-syringe', 'elevator', 'surgical-curette', 'bone-file', 'forceps', 'rongeurs', 'hemostat', 'scissors', 'sutures'],
        notes: 'This setup shows the rules arguing with each other. Strict order of use would put the forceps in the middle of the row, right after the elevator — but the hinged rule and function grouping win, so forceps, rongeurs, hemostat and scissors sit together as the hinged group on the right, in order of use among themselves. The periosteal elevator reflects tissue off the bone; most offices also lay out straight elevators or luxators to loosen the tooth before the forceps go on. Rongeurs, the bone file and sutures stay on the tray even for a routine case, because a tooth that was supposed to come out simply sometimes does not. Load plenty of gauze along the top: firm pressure on folded gauze is what forms the clot. Review the medical history for anticoagulants and bleeding disorders before the appointment starts, and count needles and blades in and out.'
      },

      {
        id: 'surgical-extraction',
        procedure: 'Surgical extraction',
        blurb: 'A flap is reflected and the tooth is sectioned or bone is removed — a sterile setup with a suturing group.',
        instrumentIds: ['gauze', 'air-water-syringe', 'surgical-suction', 'mirror', 'cotton-pliers', 'anesthetic-syringe', 'bite-block', 'cheek-retractor', 'elevator', 'high-speed-handpiece', 'surgical-curette', 'bone-file', 'forceps', 'rongeurs', 'hemostat', 'scissors', 'sutures'],
        sequence: ['mirror', 'cotton-pliers', 'anesthetic-syringe', 'bite-block', 'cheek-retractor', 'surgical-suction', 'air-water-syringe', 'elevator', 'high-speed-handpiece', 'surgical-curette', 'bone-file', 'forceps', 'rongeurs', 'hemostat', 'scissors', 'sutures'],
        notes: 'Add a scalpel handle with a fresh blade and a needle holder to this setup — both are dispensed sterile at the chair. Some offices suture with a hemostat instead of a dedicated needle holder; either way the instrument used for suturing joins the hinged group at the right. Bone removal and tooth sectioning are done with a surgical handpiece that vents its air away from the site; a standard air-driven high-speed is not used for surgical bone work because it can force air into the tissues. Sterile saline irrigation with the surgical suction keeps the bur cool and flushes bone debris out of the flap. The blade and the suture needle are both sharps: count them onto the tray and count them off it. The patient leaves with written post-operative instructions and a real after-hours number.'
      },

      {
        id: 'endo',
        procedure: 'Root canal (endodontic treatment)',
        blurb: 'Isolate with the dam, open the tooth, clean and shape the canals, fill and seal them.',
        instrumentIds: ['high-speed-handpiece', 'low-speed-handpiece', 'hve-tip', 'saliva-ejector', 'air-water-syringe', 'gauze', 'cotton-pellets', 'mirror', 'explorer', 'cotton-pliers', 'spoon-excavator', 'anesthetic-syringe', 'bite-block', 'endo-explorer', 'dental-dam', 'dam-frame', 'dam-punch', 'dam-clamp', 'floss', 'endo-files', 'barbed-broach', 'apex-locator', 'endo-measuring-block', 'rubber-stoppers', 'irrigation-syringe', 'paper-points', 'gutta-percha', 'root-canal-sealer', 'endo-plugger', 'glick', 'cavit'],
        sequence: ['mirror', 'explorer', 'cotton-pliers', 'anesthetic-syringe', 'bite-block', 'dam-punch', 'dental-dam', 'dam-clamp', 'dam-frame', 'floss', 'high-speed-handpiece', 'air-water-syringe', 'hve-tip', 'saliva-ejector', 'spoon-excavator', 'endo-explorer', 'barbed-broach', 'endo-measuring-block', 'rubber-stoppers', 'endo-files', 'apex-locator', 'irrigation-syringe', 'paper-points', 'gutta-percha', 'root-canal-sealer', 'endo-plugger', 'glick', 'cavit', 'low-speed-handpiece'],
        notes: 'The dental dam is the standard of care for root canal treatment. It keeps saliva out of the canal and, just as importantly, it protects the airway — an unclamped file that slips is an aspiration or swallowing emergency. Rubber dam forceps place and remove the clamp; they are hinged, so they belong with the hinged group. Tie a length of floss to the clamp bow so it can be retrieved if it comes loose. Files are counted onto the tray and counted off it, and each one carries a rubber stopper set to the working length measured on the endo block. The apex locator gives the working length electronically and is normally confirmed with a radiograph. The irrigant is usually sodium hypochlorite: it bleaches clothing and injures soft tissue, so protect the patient with a dam, a napkin and eyewear and keep the syringe under control. Cavit or IRM seals the access between visits.'
      },

      {
        id: 'impressions',
        procedure: 'Impressions and bite registration',
        blurb: 'Capturing the arch and the bite for study models, whitening trays, night guards or a lab case.',
        instrumentIds: ['mirror', 'cotton-pliers', 'impression-tray', 'heavy-body', 'light-body', 'bite-registration', 'cb-scissors', 'air-water-syringe', 'saliva-ejector', 'hve-tip', 'gauze', 'cotton-rolls'],
        sequence: ['mirror', 'cotton-pliers', 'impression-tray', 'air-water-syringe', 'saliva-ejector', 'hve-tip', 'heavy-body', 'light-body', 'bite-registration', 'cb-scissors'],
        notes: 'Try the empty tray in the mouth first — a tray that is too small distorts the case and a tray that is too large gags the patient. Alginate for study models is proportioned with the measuring scoop and water vial the manufacturer supplies: warmer water speeds the set and colder water slows it, so water temperature is how you control working time. Load the tray, seat the posterior first and then the anterior, and hold still without wiggling until the material has set. Alginate is dimensionally unstable — it distorts as it dries out or takes up water — so pour it promptly or store it the way your office protocol says. Rinse and disinfect every impression before it leaves for the lab. For a gagging patient, sit them slightly upright and coach nasal breathing. Many offices now capture all of this with a digital scanner instead. Crown and bridge scissors are hinged and sit at the right end of the row.'
      },

      {
        id: 'perio-scaling',
        procedure: 'Periodontal scaling and root planing',
        blurb: 'Quadrant therapy for periodontal disease — charting, anesthetic, deep scaling below the gumline.',
        instrumentIds: ['mirror', 'explorer', 'cotton-pliers', 'periodontal-probe', 'anesthetic-syringe', 'scaler', 'low-speed-handpiece', 'floss', 'air-water-syringe', 'saliva-ejector', 'hve-tip', 'gauze', 'cotton-rolls'],
        sequence: ['mirror', 'explorer', 'cotton-pliers', 'periodontal-probe', 'anesthetic-syringe', 'scaler', 'low-speed-handpiece', 'floss', 'air-water-syringe', 'saliva-ejector', 'hve-tip'],
        notes: 'Add area-specific and universal curettes to this setup — they are the instruments that do the subgingival work, and they are a completely different instrument from the surgical curette that debrides an extraction socket. Do not confuse the two. Scaling and root planing is usually delivered by quadrant with local anesthetic, so the appointment is longer than a routine cleaning and the patient leaves numb. A full periodontal chart records six sites per tooth — mesial, middle and distal on both the facial and lingual — and the assistant is often the one entering the numbers the clinician calls out, so enter exactly what is called at the site it belongs to. Ultrasonic scaling generates aerosol: use high-volume evacuation and eye protection. Which clinical tasks a registered dental assistant may perform is set by the Texas State Board of Dental Examiners; follow your own office\'s protocol.'
      },

      {
        id: 'emergency',
        procedure: 'Emergency and palliative visit',
        blurb: 'A patient in pain, worked into the schedule — find the source, relieve it, seal it, and plan the real appointment.',
        instrumentIds: ['mirror', 'explorer', 'cotton-pliers', 'periodontal-probe', 'anesthetic-syringe', 'high-speed-handpiece', 'spoon-excavator', 'cavit', 'articulating-paper', 'floss', 'air-water-syringe', 'saliva-ejector', 'hve-tip', 'gauze', 'cotton-rolls', 'cotton-pellets'],
        sequence: ['mirror', 'explorer', 'cotton-pliers', 'periodontal-probe', 'air-water-syringe', 'saliva-ejector', 'hve-tip', 'anesthetic-syringe', 'high-speed-handpiece', 'spoon-excavator', 'cavit', 'articulating-paper', 'floss'],
        notes: 'Palliative means relieving the symptom, not finishing the definitive treatment — the visit ends with the tooth comfortable, temporised and scheduled. Update the medical history before anything clinical happens, even on a walk-in, and take vitals. A periapical radiograph plus percussion and thermal testing come before treatment, and the air-water syringe supplies the puff of cold air used for a quick sensitivity check. The periodontal probe is on this tray for a reason: a deep isolated pocket points at a periodontal abscess rather than the pulp, and the two are treated differently. Cavit or IRM seals an opened tooth until the next visit. Assistants do not diagnose and do not prescribe. Escalate immediately rather than scheduling if there is facial swelling, fever, a swelling crossing the midline or under the jaw, difficulty swallowing or any trouble breathing — a spreading dental infection is a medical emergency. Send written home-care instructions and an after-hours number with every emergency patient.'
      },

      {
        id: 'pediatric-restorative',
        procedure: 'Pediatric restoration',
        blurb: 'A filling or a stainless steel crown on a primary tooth — smaller instruments, shorter appointment, different post-op talk.',
        instrumentIds: ['mirror', 'explorer', 'cotton-pliers', 'anesthetic-syringe', 'bite-block', 'high-speed-handpiece', 'low-speed-handpiece', 'spoon-excavator', 'matrix-band', 'wedge', 'etch', 'bond', 'flowable-composite', 'composite', 'condenser', 'curing-light', 'cb-scissors', 'cement', 'floss', 'articulating-paper', 'air-water-syringe', 'saliva-ejector', 'hve-tip', 'gauze', 'cotton-rolls', 'dri-aids', 'cotton-pellets'],
        sequence: ['mirror', 'explorer', 'cotton-pliers', 'anesthetic-syringe', 'bite-block', 'high-speed-handpiece', 'air-water-syringe', 'hve-tip', 'saliva-ejector', 'spoon-excavator', 'matrix-band', 'wedge', 'etch', 'bond', 'curing-light', 'flowable-composite', 'composite', 'condenser', 'cb-scissors', 'cement', 'low-speed-handpiece', 'floss', 'articulating-paper'],
        notes: 'Primary teeth have thinner enamel and dentin and a proportionally larger pulp chamber, so preparations are shallower and decay reaches the pulp sooner than it would in an adult tooth. Pedodontic matrix bands and smaller burs are used, and the appointment is kept short. A stainless steel crown is a common restoration for a badly broken-down primary molar: it is sized, trimmed and contoured with crown and bridge scissors, then cemented — which is why this tray carries both scissors and cement alongside the composite materials. The parent or guardian gives consent and hears the instructions. Use tell-show-do and plain words at the chair. Anesthetic dosing for a child is weight-based and is calculated by the dentist. Warn the family about the numb lip and cheek before they leave — children chew a numb lip without feeling it, and the sore that follows is a common and preventable call the next day.'
      }

    ]

  };

})();
