/* ============================================================================
   PREMIER DENTAL ACADEMY — SKILLS LAB · CHARTING ABBREVIATIONS DATA
   ----------------------------------------------------------------------------
   The shorthand a dental assistant reads and writes every day, in one place.
   This file exists so the abbreviation set lives in ONE place instead of being
   hard-coded inside /skills-lab/abbreviations.html — the reference page, the
   flashcard deck and the quiz hub can all read the same list, so a correction
   made here shows up everywhere at once.

   Plain global script (the site does not use ES modules in the browser) —
   exposes window.SL_ABBREV = { NOTE, GROUPS }.

   Shape:
     NOTE   — the office-variation caveat, shown at the top of the page.
     GROUPS — [ { id, icon, title, blurb, items: [ { a, m, note } ] } ]
              a    = the abbreviation as it appears on a chart
              m    = what it stands for
              note = one short clarifying line a student can use at the chair

   96 abbreviations across 10 categories. When adding to this file: only
   include shorthand genuinely used in US dental practice, and keep notes
   factual — students study from this before they work on real patients.
   ============================================================================ */
(function () {
  'use strict';

  window.SL_ABBREV = {

    NOTE: 'Charting abbreviations, symbols and colors are not standardized nationally — they vary from office to office and between software packages, so treat this as a starting point and always learn the convention your own office uses before you chart.',

    GROUPS: [

      {
        id: 'surfaces', icon: '🦷', title: 'Surfaces & directional',
        blurb: 'Where on the tooth — used together (e.g. "MOD") to describe a cavity or filling.',
        items: [
          { a: 'M', m: 'Mesial', note: 'Toward the midline of the arch.' },
          { a: 'D', m: 'Distal', note: 'Away from the midline of the arch.' },
          { a: 'I', m: 'Incisal', note: 'The biting edge of a front tooth.' },
          { a: 'O', m: 'Occlusal', note: 'The chewing surface of a back tooth.' },
          { a: 'F', m: 'Facial', note: 'Toward the lips/cheek (outer side).' },
          { a: 'B', m: 'Buccal', note: 'Toward the cheek (facial side of back teeth).' },
          { a: 'L', m: 'Lingual', note: 'Toward the tongue (inner side).' },
          { a: 'P', m: 'Palatal', note: 'Toward the palate — the word many offices use for the lingual surface of an upper tooth.' },
          { a: 'MO', m: 'Mesio-occlusal', note: 'A two-surface cavity or filling involving the mesial and the occlusal.' },
          { a: 'DO', m: 'Disto-occlusal', note: 'A two-surface cavity or filling involving the distal and the occlusal.' },
          { a: 'MOD', m: 'Mesio-occluso-distal', note: 'A three-surface restoration that crosses the mesial, occlusal and distal.' },
          { a: 'Prox', m: 'Proximal', note: 'The surface facing the neighboring tooth — mesial or distal.' },
          { a: 'Cerv', m: 'Cervical', note: 'The neck of the tooth, where the crown meets the root near the gumline.' }
        ]
      },

      {
        id: 'quadrants', icon: '🔲', title: 'Quadrants & areas',
        blurb: 'The four sections of the mouth, viewed from the patient.',
        items: [
          { a: 'Quad', m: 'Quadrant', note: 'One of the four sections of the mouth.' },
          { a: 'UR', m: 'Upper Right', note: 'Maxillary right quadrant.' },
          { a: 'UL', m: 'Upper Left', note: 'Maxillary left quadrant.' },
          { a: 'LL', m: 'Lower Left', note: 'Mandibular left quadrant.' },
          { a: 'LR', m: 'Lower Right', note: 'Mandibular right quadrant.' },
          { a: 'Max', m: 'Maxillary', note: 'The upper jaw and the upper arch of teeth.' },
          { a: 'Mand', m: 'Mandibular', note: 'The lower jaw and the lower arch of teeth.' },
          { a: 'Ant', m: 'Anterior', note: 'The front teeth — incisors and canines.' },
          { a: 'Post', m: 'Posterior', note: 'The back teeth — premolars and molars.' }
        ]
      },

      {
        id: 'materials', icon: '🛠️', title: 'Materials & restorations',
        blurb: 'What the tooth is restored with — fillings, crowns and more.',
        items: [
          { a: 'C / COMP', m: 'Composite', note: 'Tooth-colored resin filling.' },
          { a: 'AM / AMAL', m: 'Amalgam', note: 'Silver-colored metal filling.' },
          { a: 'CR/BR', m: 'Crown & Bridge', note: 'Cap on a tooth (crown) or span across a gap (bridge).' },
          { a: 'FGC', m: 'Full Gold Crown', note: 'Crown made entirely of gold alloy.' },
          { a: 'PFM', m: 'Porcelain Fused to Metal', note: 'Metal substructure under tooth-colored porcelain.' },
          { a: 'PVC', m: 'Porcelain Veneer Crown', note: 'Crown faced with porcelain for esthetics.' },
          { a: 'SSC', m: 'Stainless Steel Crown', note: 'Prefab metal crown, often used on baby teeth.' },
          { a: 'BU', m: 'Buildup', note: 'Material added to rebuild a tooth to support a crown.' },
          { a: 'PNC', m: 'Post and Core', note: 'Post in the canal plus a core to retain a crown.' },
          { a: 'S', m: 'Sealant', note: 'Protective coating in the pits and grooves.' },
          { a: 'GI / GIC', m: 'Glass Ionomer', note: 'A fluoride-releasing material used for fillings, liners and cementing.' },
          { a: 'IRM', m: 'Intermediate Restorative Material', note: 'A reinforced zinc oxide–eugenol material mixed chairside for temporary fillings.' },
          { a: 'TEMP', m: 'Temporary', note: 'A short-term crown or filling worn while the final restoration is made.' },
          { a: 'RPD', m: 'Removable Partial Denture', note: 'Replaces some missing teeth in an arch; the patient takes it out to clean it.' },
          { a: 'CD', m: 'Complete Denture', note: 'Replaces all of the teeth in one arch.' }
        ]
      },

      {
        id: 'procedures', icon: '🪥', title: 'Procedures',
        blurb: 'What was done — or what is planned.',
        items: [
          { a: 'RCT', m: 'Root Canal Treatment', note: 'Removes infected pulp and fills the canal.' },
          { a: 'SRP', m: 'Scaling and Root Planing', note: 'Deep cleaning below the gumline.' },
          { a: 'EXT', m: 'Extraction', note: 'Removal of a tooth.' },
          { a: 'PX', m: 'Prophy (prophylaxis)', note: 'A routine cleaning.' },
          { a: 'FL / FL2', m: 'Fluoride', note: 'Topical fluoride treatment.' },
          { a: 'IMP', m: 'Impression', note: 'A mold of the teeth used to make models or appliances.' },
          { a: 'TX', m: 'Treatment', note: 'Care provided to the patient (also "Tx").' },
          { a: 'ENDO', m: 'Endodontics', note: 'The specialty and procedures that treat the pulp and root canals.' },
          { a: 'OS', m: 'Oral Surgery', note: 'Surgical care such as extractions, biopsies and implant placement.' },
          { a: 'ORTHO', m: 'Orthodontics', note: 'Braces and aligners that move teeth into position.' },
          { a: 'RECEM', m: 'Recement', note: 'Re-cementing a crown, bridge or band that has come loose.' },
          { a: 'ADJ', m: 'Adjustment', note: 'Reshaping a restoration, denture or bite so it fits and functions comfortably.' }
        ]
      },

      {
        id: 'conditions', icon: '⚠️', title: 'Conditions & diagnoses',
        blurb: "What's wrong — chief complaints and findings.",
        items: [
          { a: 'TA', m: 'Toothache', note: 'Pain in or around a tooth.' },
          { a: 'DS', m: 'Dry Socket', note: 'Lost blood clot after an extraction (alveolar osteitis).' },
          { a: 'ABS', m: 'Abscess', note: 'A localized pocket of pus from infection.' },
          { a: 'V', m: 'Class V (five)', note: 'A cavity in the gingival third of any tooth.' },
          { a: 'CC', m: 'Chief Complaint', note: "Why the patient says they came in, recorded in the patient's own words." },
          { a: 'DX', m: 'Diagnosis', note: 'The provider\'s conclusion about what the problem is (also written "Dx").' },
          { a: 'FX', m: 'Fracture', note: 'A broken or cracked tooth or restoration.' },
          { a: 'PARL', m: 'Periapical Radiolucency', note: 'A dark area at the root tip on a radiograph that can signal infection.' },
          { a: 'TMJ', m: 'Temporomandibular Joint', note: 'The jaw joint; pain or dysfunction there is usually charted as TMD.' },
          { a: 'BRUX', m: 'Bruxism', note: 'Clenching or grinding, often noted alongside worn or flattened surfaces.' }
        ]
      },

      {
        id: 'radiographs', icon: '🩻', title: 'Radiographs (x-rays)',
        blurb: 'The image types you take and chart.',
        items: [
          { a: 'FMX', m: 'Full Mouth Series', note: 'A complete set of x-rays of all teeth.' },
          { a: 'BWX / BW', m: 'Bitewing X-ray', note: 'Checks for decay between the back teeth.' },
          { a: 'PANO', m: 'Panoramic X-ray', note: 'One wide image of the entire upper and lower jaws.' },
          { a: 'PA', m: 'Periapical X-ray', note: 'Shows a whole tooth from the crown to the root tip plus the surrounding bone.' },
          { a: 'OCC', m: 'Occlusal X-ray', note: 'A larger image that captures a broad section of one arch at a time.' },
          { a: 'CBCT', m: 'Cone Beam Computed Tomography', note: 'A 3-D scan used for implant planning, impactions and surgery.' },
          { a: 'CEPH', m: 'Cephalometric X-ray', note: 'A side view of the head and jaws, used mostly in orthodontics.' }
        ]
      },

      {
        id: 'scheduling', icon: '📅', title: 'Scheduling & admin',
        blurb: 'Front-desk and schedule shorthand.',
        items: [
          { a: 'NP', m: 'New Patient', note: 'First visit to the practice.' },
          { a: 'RS', m: 'Reschedule', note: 'Move the appointment to another time.' },
          { a: 'CA', m: 'Cancel', note: 'A canceled appointment.' },
          { a: 'BA', m: 'Broken Appointment', note: 'Missed or canceled on short notice.' },
          { a: 'NS', m: 'No-Show', note: 'Patient did not arrive.' },
          { a: 'RC', m: 'Recall / Recare', note: 'A returning patient due for a routine exam and cleaning.' },
          { a: 'ASAP', m: 'As Soon As Possible', note: 'On the short-call list — the patient will come in early if a slot opens.' },
          { a: 'EOB', m: 'Explanation of Benefits', note: 'The insurance statement showing what the plan paid and what the patient owes.' },
          { a: 'Pre-D', m: 'Predetermination', note: "A request for the insurance plan's written estimate before treatment starts." }
        ]
      },

      {
        id: 'perio', icon: '🩸', title: 'Periodontal',
        blurb: 'The gum and bone measurements you record during a perio charting.',
        items: [
          { a: 'Perio', m: 'Periodontal / Periodontics', note: 'The gums and supporting bone — and the specialty that treats them.' },
          { a: 'PD', m: 'Probing Depth', note: 'The millimeter reading from the gum margin to the base of the sulcus or pocket (also called pocket depth).' },
          { a: 'CAL', m: 'Clinical Attachment Level', note: 'Depth measured from the CEJ instead of the gum margin, so it reflects true attachment loss.' },
          { a: 'CEJ', m: 'Cementoenamel Junction', note: 'Where the enamel of the crown meets the cementum of the root — the landmark for attachment readings.' },
          { a: 'BOP', m: 'Bleeding on Probing', note: 'Bleeding when the site is probed — a sign of active inflammation.' },
          { a: 'REC', m: 'Recession', note: 'Gum tissue that has moved apically, leaving root surface exposed.' },
          { a: 'MOB', m: 'Mobility', note: 'How much a tooth moves when tested; recorded by class in the chart.' },
          { a: 'FURC', m: 'Furcation', note: 'Where the roots of a multi-rooted tooth divide; bone loss there is graded by class.' },
          { a: 'MGJ', m: 'Mucogingival Junction', note: 'The line where firm attached gingiva meets the looser alveolar mucosa.' }
        ]
      },

      {
        id: 'anesthesia', icon: '💉', title: 'Anesthesia & sedation',
        blurb: 'What the provider is asking you to set up — and what it numbs.',
        items: [
          { a: 'N2O', m: 'Nitrous Oxide', note: 'Inhalation conscious sedation ("laughing gas").' },
          { a: 'LA', m: 'Local Anesthetic', note: 'Numbing medication injected to block pain in one area while the patient stays awake.' },
          { a: 'IANB', m: 'Inferior Alveolar Nerve Block', note: 'Numbs the lower teeth on one side, along with that side of the lower lip and chin.' },
          { a: 'PSA', m: 'Posterior Superior Alveolar (block)', note: 'Numbs the upper molars on one side; the mesiobuccal root of the first molar sometimes needs a second injection.' },
          { a: 'Infil', m: 'Infiltration', note: 'Anesthetic deposited near the root tip, used most often on the upper arch.' },
          { a: 'Epi', m: 'Epinephrine', note: 'A vasoconstrictor added to some anesthetics to extend the numbness and reduce bleeding.' }
        ]
      },

      {
        id: 'status', icon: '📝', title: 'Charting status & symbols',
        blurb: 'The state of a tooth or finding in the record — check your own office key before you chart.',
        items: [
          { a: 'TP', m: 'Treatment Plan(ned)', note: 'Work that has been proposed and charted but not done yet.' },
          { a: 'EXIST', m: 'Existing', note: 'A restoration already in the mouth when the patient was first charted here.' },
          { a: 'MISS', m: 'Missing', note: 'The tooth is not present; many offices mark it with an X or a line through the tooth.' },
          { a: 'WATCH', m: 'Watch', note: 'A finding being monitored at each visit rather than treated now.' },
          { a: 'WNL', m: 'Within Normal Limits', note: 'Charted when an exam finding shows nothing abnormal.' },
          { a: 'NKDA', m: 'No Known Drug Allergies', note: 'Recorded on the health history when the patient reports no drug allergies.' }
        ]
      }

    ]
  };

})();
