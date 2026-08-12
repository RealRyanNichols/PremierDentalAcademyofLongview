/* ============================================================================
   PREMIER DENTAL ACADEMY OF LONGVIEW — SKILLS LAB · INSTRUMENT LIBRARY
   ----------------------------------------------------------------------------
   WHAT THIS IS
   The single data source for the instrument-identification trainer: 84 items a
   dental assistant handles chairside, sorted into 10 categories. Plain browser
   global (no ES modules, no build step) — exposes window.SL_INSTRUMENTS.

   WHY IT EXISTS
   Students do not fail instrument ID because they cannot name a mouth mirror.
   They fail on the LOOK-ALIKE PAIRS — hatchet vs. gingival margin trimmer,
   sickle scaler vs. curette, condenser vs. burnisher, paper point vs. gutta-
   percha. So every item carries a `recognise` field that names the instrument
   it is most often confused with and gives the PHYSICAL tell that separates
   them (blade shape, bevel, hinge, ratchet, serrations, number of ends).
   That field is the lesson. `use` is there for context.

   SHAPE
     window.SL_INSTRUMENTS = {
       CATEGORIES: [ { id, title, blurb } ],           // 10
       ITEMS:      [ { id, name, category, use, recognise, emoji } ]   // 84
     }
   `emoji` is a fallback glyph — this trainer is text-based today; when photos
   land in /assets/skills-lab/virtual-office/ the glyph is the placeholder.

   RULES FOR EDITING
   • IDs ARE A CONTRACT. The tray setups in assets/skills-lab/data/virtual-office.js
     reference instruments by id. Renaming an id silently breaks the tray builder.
     Add new ids freely; never rename or delete an existing one.
   • The first 67 ids here mirror the INSTRUMENTS array in data/virtual-office.js
     one-for-one (same id, same name, same use text). Keep the two in step.
   • Instrument names, tray setups and manufacturer designs VARY between offices.
     Where a design has more than one common name, both are given. Nothing here
     should be taught as a universal standard beyond the physical description.
   ============================================================================ */
(function () {
  'use strict';

  /* Categories, in teaching order. id is what ITEMS[].category points at. */
  var CATEGORIES = [
    { id: 'exam',        title: 'Examination & diagnostic',
      blurb: 'The basic setup — what the dentist looks with, feels with and measures with before anything else happens.' },
    { id: 'cutting',     title: 'Cutting instruments — hand & rotary',
      blurb: 'Everything that cuts tooth structure: the handpieces and burs, plus the hand cutting instruments that refine a preparation.' },
    { id: 'restorative', title: 'Restorative placement & carving',
      blurb: 'Packing a restoration into the prep, then carving anatomy back into it and smoothing the surface.' },
    { id: 'amalgam',     title: 'Amalgam',
      blurb: 'The mix-and-deliver chain for a silver amalgam filling, plus the matrix that rebuilds a missing wall.' },
    { id: 'composite',   title: 'Composite & bonding',
      blurb: 'Etch, bond, shade, place and light-cure a tooth-colored resin restoration.' },
    { id: 'surgical',    title: 'Surgical & extraction',
      blurb: 'Extractions and minor oral surgery: loosening, removing, cleaning the site and closing it.' },
    { id: 'perio',       title: 'Periodontal',
      blurb: 'Removing calculus and treating the tissue around the tooth, by hand and with power.' },
    { id: 'endo',        title: 'Endodontic (root canal)',
      blurb: 'Isolate the tooth, find the canals, clean and shape them, then fill and seal.' },
    { id: 'ortho',       title: 'Orthodontic',
      blurb: 'Braces chairside: seating bands, placing brackets, and placing, bending and cutting archwire.' },
    { id: 'materials',   title: 'Dental materials, isolation & accessories',
      blurb: 'Moisture control, evacuation, impressions, cements and the disposables that make every other tray work.' }
  ];

  /* it(id, name, category, use, recognise, emoji) */
  function it(id, name, category, use, recognise, emoji) {
    return { id: id, name: name, category: category, use: use, recognise: recognise, emoji: emoji };
  }

  var ITEMS = [

    /* ---------------------------------------------------------------- exam -- */
    it('mirror', 'Mouth mirror', 'exam',
      'Indirect vision, retraction of cheek/tongue, and reflecting light onto the field',
      'The one instrument on the basic setup with a round reflective disc instead of a point or a blade. A front-surface mirror shows one crisp image; a plane (rear-surface) mirror shows a faint second ghost image behind it.',
      '🪞'),

    it('explorer', 'Explorer', 'exam',
      'Detecting caries, calculus & checking margins by feel',
      'Ends in a fine, sharp, UNMARKED point — the #23 has one curved shepherd-hook end. Confused with the periodontal probe, which is blunt-tipped and banded with millimeter marks. Sharp and unmarked = explorer.',
      '🧷'),

    it('explorer-probe', 'Explorer / perio-probe combo', 'exam',
      'Double-ended instrument: explorer end checks decay & margins, probe end measures sulcus depth',
      'Double-ended with two DIFFERENT tips: a sharp unmarked point on one end, a blunt millimeter-marked probe on the other. If both ends are the same kind of tip, it is a single-purpose instrument, not the combo.',
      '🧷'),

    it('cotton-pliers', 'Cotton pliers', 'exam',
      'Carrying & placing cotton, pellets and other small items in the mouth',
      'Tweezer-style: it springs open on its own and has NO ratchet lock. A hemostat looks similar from across the tray but has ring handles and a ratchet that clicks shut; tissue forceps have small gripping teeth at the tip.',
      '🤏'),

    it('periodontal-probe', 'Periodontal probe', 'exam',
      'Measuring sulcus/pocket depth in millimeters',
      'Blunt, rounded working end with millimeter markings banded along it so it can be read against the gum line. The explorer lying beside it is sharp and carries no markings.',
      '📏'),

    /* ------------------------------------------------------------- cutting -- */
    it('high-speed-handpiece', 'High-speed handpiece', 'cutting',
      'Cutting tooth/old restorations and crown preps (with water spray)',
      'Runs with a water spray while it cuts and takes a smooth-shanked friction-grip bur that pushes straight into the head. The low-speed takes a latch-type or long straight bur and does not spray water to cut.',
      '🌀'),

    it('low-speed-handpiece', 'Low-speed handpiece', 'cutting',
      'Polishing, slow caries removal, lab and finishing work',
      'A motor with interchangeable attachments screwed on — straight nose cone, contra-angle, or prophy angle. It turns far more slowly with more torque. The high-speed is one sealed piece with a small fixed head.',
      '🌀'),

    it('dental-bur', 'Dental bur (carbide / diamond)', 'cutting',
      'Rotary cutting tip locked into the handpiece to cut tooth structure and old restorations',
      'Two families: a carbide bur has machined blades and flutes you can count on a shiny metal head, while a diamond bur has no blades and is coated in dull gray grit like sandpaper. Shank tells you the handpiece — smooth friction-grip for the high-speed, notched latch-type for the contra-angle.',
      '⚙️'),

    it('spoon-excavator', 'Spoon excavator', 'cutting',
      'Removing soft decay & temporary material',
      'The working end is a small sharpened SPOON with a hollow, concave face for scooping soft dentin out. The discoid end of a discoid-cleoid carver is a flat disc used to shave set amalgam, not a bowl.',
      '🥄'),

    it('enamel-hatchet', 'Enamel hatchet', 'cutting',
      'Hand cutting instrument that planes and shapes the enamel walls of a preparation',
      'A single straight blade whose cutting edge runs square across the end, in the same plane as the handle, beveled on one side. The gingival margin trimmer is its twin except the blade is curved and its edge is set at an ANGLE, not square.',
      '🪓'),

    it('gingival-margin-trimmer', 'Gingival margin trimmer', 'cutting',
      'Bevels and smooths the gingival cavosurface margin at the base of a preparation',
      'Looks like an enamel hatchet, but the blade is curved and the cutting edge is angled instead of square. They come in mesial/distal PAIRS, so two near-identical instruments with edges angled opposite ways is the giveaway.',
      '📐'),

    /* --------------------------------------------------------- restorative -- */
    it('condenser', 'Condenser (plugger)', 'restorative',
      'Packing/condensing restorative material into the prep',
      'The working end is a short nib with a FLAT face, often serrated so material grips it, and it is used with straight pressure. A burnisher of the same size is smooth and rounded; a carver has a sharpened edge.',
      '🔨'),

    it('carver', 'Carver', 'restorative',
      'Carving anatomy into a restoration',
      'Has a sharpened edge or point that cuts set material away. Held next to a burnisher of the same silhouette, the carver edge will catch a fingernail and the burnisher will not.',
      '🔪'),

    it('discoid-cleoid', 'Discoid-cleoid carver', 'restorative',
      'Carves occlusal grooves and cusp anatomy into a freshly placed amalgam',
      'Double-ended and MISMATCHED: one end is a round sharpened disc (discoid), the other a pointed claw shape (cleoid). A spoon excavator has a concave bowl instead of a flat disc, and is used inside the tooth, not on top of it.',
      '🌕'),

    it('burnisher', 'Burnisher (ball / football / acorn)', 'restorative',
      'Smooths the surface of a restoration and adapts the matrix band against the tooth',
      'The working end is smooth and rounded — ball, football or acorn shaped — with no cutting edge anywhere on it. A carver of the same size has a sharpened edge; a condenser has a flat, often serrated face.',
      '🥚'),

    /* ------------------------------------------------------------- amalgam -- */
    it('amalgamator', 'Amalgamator (triturator)', 'amalgam',
      'Countertop machine that mixes (triturates) the alloy and mercury sealed inside an amalgam capsule',
      'It is equipment, not a hand instrument: a small box with a lidded cradle that shakes the capsule and a time setting on the front. The curing light, the other machine on the counter, is a wand you hold in the mouth.',
      '⚙️'),

    it('amalgam-carrier', 'Amalgam carrier', 'amalgam',
      'Picks up mixed amalgam and delivers it into the preparation',
      'A hollow barrel with a lever or plunger that ejects a plug of material out the tip. The composite compule gun that sits near it holds a disposable tip and is shaped like a small caulking gun with a trigger.',
      '💉'),

    it('amalgam-well', 'Amalgam well', 'amalgam',
      'Holds the freshly triturated amalgam at chairside while it is loaded into the carrier',
      'A heavy, weighted dish with a deep sloped bowl that stays put when the carrier is dragged through it. A dappen dish is smaller, lighter, straight-sided, and holds liquids.',
      '🥣'),

    it('matrix-band', 'Matrix band & retainer (Tofflemire)', 'amalgam',
      'Recreating the missing wall of a tooth so a filling can be packed',
      'A metal band locked into a slotted retainer with a knurled spindle and an adjusting knob — two pieces that assemble. The clear Mylar strip used for front-tooth composite is a single plastic strip and needs no retainer.',
      '➰'),

    it('wedge', 'Wedge', 'amalgam',
      'Placed between the teeth to adapt the matrix band and create a tight contact for a filling',
      'A small triangular wood or plastic piece pushed in from the side, at the gum line, BETWEEN two neighboring teeth. A bite block is far larger and goes between the upper and lower arches.',
      '🪵'),

    /* ----------------------------------------------------------- composite -- */
    it('etch', 'Etchant', 'composite',
      'Phosphoric-acid gel that micro-roughens enamel/dentin for bonding',
      'A thick, brightly tinted gel in a syringe with a fine needle tip — it holds its shape on the tooth and is RINSED off. Bonding agent, its partner, is a thin runny liquid that is cured, never rinsed.',
      '🧪'),

    it('bond', 'Bonding agent', 'composite',
      'Resin adhesive that bonds composite to the etched tooth',
      'A watery resin in a light-shielded bottle or single-use well, brushed on with a micro applicator and light-cured. The etchant beside it is a thick colored gel that gets washed off first.',
      '🧴'),

    it('composite', 'Composite', 'composite',
      'Tooth-colored resin restorative material placed and light-cured in increments',
      'Comes in shade-numbered syringes or compules and behaves like stiff putty — it stays where it is placed. Flowable composite from the same kit slumps and runs on its own.',
      '🦷'),

    it('flowable-composite', 'Flowable composite', 'composite',
      'Thin, flowable resin used as a liner or in small/hard-to-reach areas',
      'Dispensed through a very thin needle-style tip and it self-levels into the prep. Packable composite from the same shade family holds a shape and has to be pushed into place.',
      '💧'),

    it('shade-guide', 'Shade guide', 'composite',
      'Tabbed guide for matching restoration color to the patient\'s teeth',
      'A fan of numbered tooth-colored tabs on a pin — A1, B2, C3 and so on. The articulating paper holder near it also fans out, but holds thin colored carbon film rather than tooth-shaped tabs.',
      '🎨'),

    it('curing-light', 'Curing light', 'composite',
      'Blue light that light-cures bonded composite and resin cement',
      'A cordless wand with a swiveling light guide and an orange shield collar, run on a timer. The orange shield is the tell — nothing else on the tray has one.',
      '🔦'),

    /* ------------------------------------------------------------ surgical -- */
    it('forceps', 'Extraction forceps', 'surgical',
      'Grasping & removing a tooth from the socket',
      'Hinged and plier-like, with two curved beaks contoured to grip the crown of one specific tooth — beaks are blunt and shaped, not sharp. Rongeurs look similar but their beaks have sharp cutting edges and spring handles.',
      '🦷'),

    it('elevator', 'Periosteal elevator', 'surgical',
      'Reflecting & lifting the gum tissue (periosteum) off the bone for access',
      'Double-ended and thin: one pointed end to start the tissue, one broad flat rounded end to peel it back. It works against BONE. The straight elevator beside it has one thick concave blade on a heavy handle and works against the TOOTH.',
      '🪛'),

    it('straight-elevator', 'Straight elevator', 'surgical',
      'Loosens (luxates) a tooth in its socket before the forceps are applied',
      'A single heavy round handle carrying one thick, concave, spoon-shaped blade in line with the shank. The periosteal elevator is double-ended and much thinner; it lifts tissue, not teeth.',
      '⚒️'),

    it('cheek-retractor', 'Cheek retractor', 'surgical',
      'Holds the cheeks and lips back for access and visibility',
      'A large plastic or wire frame shaped to sit inside both lips and hold everything back at once, hands-free. A mouth mirror also retracts, but one small area at a time and it has a reflective disc.',
      '🪝'),

    it('rongeurs', 'Rongeurs', 'surgical',
      'Plier-like instrument that trims and removes sharp bone edges',
      'Spring handles that push themselves back open, with sharp beaks that BITE pieces of bone away. Extraction forceps have no spring and their beaks are blunt gripping surfaces.',
      '🦴'),

    it('bone-file', 'Bone file', 'surgical',
      'Smooths rough bone margins after an extraction',
      'Small and double-ended with a ridged, rasping working surface, used with a PULL stroke. A surgical curette of similar size ends in a smooth sharpened scoop instead of ridges.',
      '🪚'),

    it('hemostat', 'Hemostat', 'surgical',
      'Grasping & holding tissue, suture or items securely',
      'Ring handles with a ratchet that clicks and LOCKS shut, plus long serrated beaks. Cotton pliers spring open and never lock. A needle holder locks the same way but its beaks are short, stout and cross-hatched.',
      '🗜️'),

    it('scissors', 'Surgical scissors', 'surgical',
      'Cutting suture, cord and soft tissue',
      'Two hinged blades that slide past each other to shear, with long straight or gently curved beaks. Crown and bridge scissors do the same job with much shorter, sharply curved beaks for working inside the mouth.',
      '✂️'),

    it('sutures', 'Sutures', 'surgical',
      'Stitches that close the surgical site to aid healing',
      'A sealed foil packet holding a curved needle already swaged onto the thread — needle and thread arrive as one piece. Plain retraction cord on a spool is thread with no needle and is never used to close tissue.',
      '🧷'),

    it('surgical-curette', 'Surgical curette', 'surgical',
      'Scooping granulation tissue & debris from the extraction socket',
      'A sharpened scoop on a long handle sized to reach into a socket. The spoon excavator it resembles is much smaller and works inside a tooth; a bone file has a ridged surface rather than a scoop.',
      '🥄'),

    it('surgical-suction', 'Surgical suction tip', 'surgical',
      'Narrow-bore surgical suction for blood and debris at an extraction/surgical site',
      'A narrow tip with a much smaller bore than the HVE, so it clears blood without pulling the forming clot out of the socket. The HVE tip beside it is a wide, rigid, beveled tube.',
      '🩸'),

    /* --------------------------------------------------------------- perio -- */
    it('scaler', 'Scaler', 'perio',
      'Removing supragingival calculus',
      'The sickle type comes to a sharp POINT with a triangular cross-section and two cutting edges, for deposits above the gum line. A curette has a rounded toe and a rounded back so it can be worked below the gum line safely.',
      '⛏️'),

    it('universal-curette', 'Universal curette', 'perio',
      'Removing calculus above and below the gum line on any tooth surface',
      'Rounded toe, rounded back, and a blade face set at about 90 degrees to the lower shank so BOTH cutting edges can be used anywhere. A sickle scaler ends in a sharp point; a Gracey is offset and works from one edge.',
      '🥄'),

    it('gracey-curette', 'Gracey curette (area-specific)', 'perio',
      'Scaling and root planing on the specific tooth surfaces each number is designed for',
      'The blade face is offset to roughly 70 degrees from the lower shank, so a single cutting edge does the work, and the instruments come numbered in pairs (1/2, 11/12, 13/14). A universal curette is one design used everywhere.',
      '🪃'),

    it('ultrasonic-scaler', 'Ultrasonic scaler', 'perio',
      'Powered handpiece whose vibrating tip, with a water spray, breaks up calculus and stain',
      'It is tethered by a cord to a power unit and sprays water while the tip vibrates. Hand scalers and curettes are unpowered and cut by dragging a sharpened edge across the deposit.',
      '📳'),

    /* ---------------------------------------------------------------- endo -- */
    it('endo-explorer', 'Endo explorer (DG16)', 'endo',
      'Sharp double-ended explorer for locating canal orifices',
      'Double-ended with two straight, very sharp points bent at abrupt angles so they can drop into the pulp chamber floor. The #23 explorer on the exam tray has one long curved shepherd-hook end.',
      '🧷'),

    it('dental-dam', 'Dental dam', 'endo',
      'Thin sheet that isolates the tooth and protects the airway during endo',
      'A flat square sheet of latex or latex-free rubber, usually green or blue, with a matte side and a shiny side. Everything else in the dam kit is rigid — the dam is the single flexible sheet.',
      '🟩'),

    it('dam-frame', 'Dental dam frame', 'endo',
      'Frame that holds the dam stretched and out of the working field',
      'A rigid U-shaped or oval frame with prongs around its outer edge that the sheet hooks onto. It sits OUTSIDE the mouth and never touches a tooth; the clamp is the small metal piece that does.',
      '🖼️'),

    it('dam-punch', 'Dental dam punch', 'endo',
      'Punches holes in the dam to fit over the tooth/teeth being isolated',
      'Plier-like with a rotating wheel of graduated hole sizes and a sharp pin that drives through the sheet. Dam forceps are also plier-like but have thin beaks with round tips and no wheel.',
      '🕳️'),

    it('dam-clamp', 'Dental dam clamps', 'endo',
      'Metal clamps that anchor the dam to the tooth being treated',
      'A small metal ring with two jaws joined by a bow, and a hole in each wing for the forceps beaks. It is tooth-sized; the frame it is confused with in a photo is hand-sized and made of plastic or wire.',
      '🗜️'),

    it('endo-files', 'Endo files', 'endo',
      'Tapered files that clean, shape and enlarge the root canal',
      'Thin tapered metal shafts with spiral cutting flutes and a color-coded, size-numbered handle. A barbed broach beside them has a smooth shaft with tiny raised barbs and no flutes.',
      '📍'),

    it('barbed-broach', 'Barbed broach', 'endo',
      'Disposable barbed instrument that removes pulp tissue from the canal',
      'A smooth tapered wire with tiny barbs raised out of it, angled back toward the handle to snag tissue. It never shapes the canal. Files have machined spiral flutes and numbered handles.',
      '🪝'),

    it('apex-locator', 'Apex locator', 'endo',
      'Electronic device that measures canal working length to the root apex',
      'A small electronic unit with a display, a lip clip and a file clip on a lead — it is equipment on the cart, not an instrument on the tray. The measuring block does the same job mechanically, with a printed ruler.',
      '📟'),

    it('endo-measuring-block', 'Endo measuring block', 'endo',
      'Block/ruler for setting and measuring file working lengths',
      'A rigid block with a millimeter scale stamped along one edge and slots or foam to stand the files in. The rubber stoppers it is used with are the tiny silicone discs on the files themselves.',
      '📐'),

    it('rubber-stoppers', 'Rubber stoppers', 'endo',
      'Silicone stops set on files to mark the working length',
      'Tiny silicone discs already threaded onto the file shaft — they are the MARKER that slides. The measuring block is the separate item carrying the millimeter scale they are set against.',
      '🛑'),

    it('irrigation-syringe', 'Irrigation syringe', 'endo',
      'Syringe (often with sodium hypochlorite) to disinfect & flush the canal',
      'An all-plastic syringe with a BLUNT, side-vented needle tip and a luer lock. The anesthetic syringe is a metal aspirating syringe with a thumb ring, a harpoon and a sharp needle.',
      '💉'),

    it('paper-points', 'Paper points', 'endo',
      'Absorbent paper cones used to dry the canal before filling',
      'Stiff white paper cones in a size-numbered box; they wick liquid up and go limp when wet. Gutta-percha cones are the same shape but rubbery, pinkish-tan, and bend without soaking anything up.',
      '🔻'),

    it('gutta-percha', 'Gutta-percha', 'endo',
      'Rubbery cones used to obturate (fill & seal) the cleaned canal',
      'Slightly flexible pinkish-tan cones that bend and spring back rather than tearing. Paper points are the stiff white paper cones used just before them, to dry the canal.',
      '🟧'),

    it('root-canal-sealer', 'Root canal sealer', 'endo',
      'Cement that seals gutta-percha to the canal walls',
      'Mixed to a thin cement and coated onto the points before they go in. The temporary that follows it (Cavit/IRM) is a thick putty for the access opening, not for the canal.',
      '🧴'),

    it('endo-plugger', 'Endo plugger', 'endo',
      'Condenses/compacts gutta-percha into the canal',
      'Long, thin and often millimeter-marked, with a FLAT blunt tip that pushes points down. An endodontic spreader is the same silhouette but tapers to a point so it can wedge sideways.',
      '🔨'),

    it('glick', 'Glick #1', 'endo',
      'Double-ended endo instrument for placing & shaping temporaries and gutta-percha',
      'Double-ended and mismatched: a flat paddle for temporary material on one end, a long thin plugger on the other, usually with millimeter marks on the plugger end.',
      '🔧'),

    it('cavit', 'Cavit / IRM (temporary)', 'endo',
      'Temporary filling material that seals the access between endo visits',
      'Cavit arrives ready-mixed as a putty in a tube or jar and sets from moisture in the mouth; IRM is a powder and liquid mixed at chairside. Either way it is a soft plug, unlike luting cement, which is mixed thin to seat a crown.',
      '🩹'),

    /* --------------------------------------------------------------- ortho -- */
    it('ortho-bracket-tweezers', 'Bracket placement tweezers', 'ortho',
      'Carries a bracket to the tooth and holds it in position in the adhesive',
      'Tweezer-style with a shaped, slotted tip that cradles the bracket body, and many are reverse-action — squeezing OPENS them, so they grip when relaxed. Cotton pliers have plain pointed tips and spring open on their own.',
      '🧷'),

    it('ortho-band-seater', 'Band pusher / band seater', 'ortho',
      'Seats an orthodontic band down onto the molar',
      'A stout handle ending in a small flat SERRATED pad that the operator pushes on so the metal does not skid. A bite stick does the same job with a plastic block the patient bites down on.',
      '⬇️'),

    it('ortho-weingart', 'Weingart pliers', 'ortho',
      'Places and removes the archwire in the brackets',
      'Long, angled beaks, serrated on the inside and rounded at the tip — they grip and guide but do NOT cut. If the beaks meet as two sharp blades, it is a cutter, not Weingart pliers.',
      '🔧'),

    it('ortho-distal-end-cutter', 'Distal end cutter', 'ortho',
      'Cuts the archwire flush behind the last molar tube',
      'A heavy angled cutting head that HOLDS the cut piece of wire so it is not dropped in the mouth. A ligature cutter has fine pointed blades, cuts much thinner wire, and lets the piece fall free.',
      '✂️'),

    it('ortho-bird-beak', 'Bird-beak pliers', 'ortho',
      'Bends and forms archwire and clasps',
      'The two beaks do not match: one is a round cone, the other a flat-sided pyramid, so the wire bends around the cone. Matching beaks mean it is a different plier.',
      '🦅'),

    /* ----------------------------------------------------------- materials -- */
    it('gauze', '2x2 gauze', 'materials',
      'Wiping instruments, isolation, packing the socket and applying bite pressure',
      'A folded square of loose woven cotton mesh. Cotton rolls are tight cylinders, dry angles are stiff triangles with a shiny backing, and pellets are pea-sized balls.',
      '🧻'),

    it('cotton-rolls', 'Cotton rolls', 'materials',
      'Isolating the tooth and absorbing saliva to keep the field dry',
      'Tight cylinders of rolled cotton laid in the vestibule beside the tooth. A dry angle does the same job but is a flat TRIANGLE and goes against the cheek, not in the vestibule.',
      '🧵'),

    it('dri-aids', 'Dri-aids (dry angles)', 'materials',
      'Triangular pads placed over the parotid duct to block saliva and keep the cheek dry',
      'Triangular pads with a shiny colored backing that faces the cheek. Cotton rolls are cylinders. The triangle shape and the shiny side are the two tells.',
      '🔺'),

    it('cotton-pellets', 'Cotton pellets', 'materials',
      'Drying the prep, applying or blotting medicaments and cement',
      'Small cotton balls, pea-sized or smaller, always handled with cotton pliers. A cotton roll is the long cylinder; a pellet is the ball that fits inside a prep.',
      '⚪'),

    it('bite-block', 'Bite block', 'materials',
      'Rubber block the patient bites on to hold the mouth open and rest the jaw during longer procedures',
      'A solid rubber block, often on a safety string, that goes between the UPPER and LOWER arches. The restorative wedge it is sometimes confused with in a photo is tiny and goes between two neighboring teeth.',
      '🧱'),

    it('articulating-paper', 'Articulating paper & holder', 'materials',
      'Marking high spots so the bite (occlusion) can be checked & adjusted',
      'Thin blue or red carbon film held in a forceps-style holder — it transfers color ONTO the teeth. The shade guide it sits near is a fan of solid tooth-colored tabs that transfer nothing.',
      '🟦'),

    it('anesthetic-syringe', 'Anesthetic syringe', 'materials',
      'Aspirating dental syringe the dentist uses to deliver local anesthetic',
      'A metal syringe with a thumb ring, a harpoon that grips the cartridge stopper, and an open window showing the cartridge. The irrigation syringe is all plastic with a blunt tip and no cartridge.',
      '💉'),

    it('air-water-syringe', 'Air-water syringe tip', 'materials',
      'Rinsing & drying the field with air, water or spray',
      'A short disposable tip with TWO channels running through it, snapped onto the syringe handle on the unit. Suction tips are single hollow tubes that push onto a hose and pull rather than push.',
      '💨'),

    it('saliva-ejector', 'Saliva ejector', 'materials',
      'Low-volume continuous suction to remove pooled saliva',
      'A thin, bendable plastic straw with a slotted or perforated end that can be shaped and parked in the floor of the mouth. The HVE tip is a wide, rigid, beveled tube that must be held.',
      '💧'),

    it('hve-tip', 'HVE (high-volume evacuator) tip', 'materials',
      'High-volume evacuation — keeps the field dry, clear and aerosol-controlled',
      'A wide-bore rigid tube with a beveled end, held by the assistant throughout. The saliva ejector is the narrow bendable straw that gets parked and left alone.',
      '🌬️'),

    it('cb-scissors', 'Crown & bridge scissors', 'materials',
      'Trimming crowns, matrix bands, cord and retraction material',
      'Short, sharply curved, sometimes serrated beaks on small ring handles, made to work inside the mouth. Surgical scissors are longer with straighter beaks.',
      '✂️'),

    it('retraction-cord', 'Retraction cord', 'materials',
      'Gingival cord packed in the sulcus to expose the margin & control fluid',
      'Braided or knitted cord on a spool marked with a size number (000 up through 3). Dental floss is a smooth, thin, waxed strand with no braid and no size numbering.',
      '🧶'),

    it('cord-packer', 'Cord packer', 'materials',
      'Serrated instrument that seats retraction cord into the sulcus',
      'A blunt thin blade with a SERRATED (notched) edge so the cord cannot slip off as it is tucked down. The same silhouette with a smooth edge is a placement or plastic instrument, not a packer.',
      '〰️'),

    it('ferric-sulfate', 'Ferric sulfate', 'materials',
      'Hemostatic agent that controls minor gingival bleeding before impressions',
      'A small bottle or syringe of dark liquid or gel, dabbed on TISSUE with a pellet or micro tip to stop bleeding. Etchant is also a gel in a syringe, but it goes on the tooth and is rinsed away.',
      '🩹'),

    it('heavy-body', 'Heavy body impression material', 'materials',
      'Thick tray material that forms the bulk of a crown/bridge impression',
      'Stiff, putty-thick material loaded into the tray, which holds a shape when you scoop it. The light body used in the same impression is runny and comes through a syringe tip.',
      '🟪'),

    it('light-body', 'Light body impression material', 'materials',
      'Thin wash material syringed around the prep to capture fine margin detail',
      'Runny wash dispensed through an automix tip directly around the margin. Heavy body is the stiff material that fills the tray behind it.',
      '🔷'),

    it('bite-registration', 'Bite registration material', 'materials',
      'Fast-set material that records how the upper & lower teeth bite together',
      'Fast-setting material squeezed straight onto the biting surfaces with NO tray to carry it. The heavy body impression material it sits beside is loaded into a tray, and the light body wash is syringed around the prep before that tray is seated.',
      '🟨'),

    it('temp-crown-material', 'Temporary crown material', 'materials',
      'Resin used to fabricate a provisional crown that protects the prep',
      'A tooth-shaded automix cartridge of resin used to BUILD the provisional. The cement that follows it is a separate, thinner material used to stick the finished provisional down.',
      '👑'),

    it('impression-tray', 'Impression tray', 'materials',
      'Holds impression material to capture the arch (or seat a provisional)',
      'A rigid arch-shaped tray with a raised rim and retention holes or rim lock, sized to an arch. The bite registration taken at the same appointment uses no tray at all.',
      '🍽️'),

    it('floss', 'Dental floss', 'materials',
      'Checking & clearing interproximal contacts and cement; retrieving cord',
      'A smooth, thin waxed or unwaxed strand pulled from a dispenser. Retraction cord looks similar on the tray but is thicker, visibly braided, and sold in numbered sizes.',
      '🧵'),

    it('cement', 'Cement', 'materials',
      'Luting cement used to seat a crown, provisional or final restoration',
      'Mixed (or automixed) to a thin, creamy consistency so a crown can seat fully down onto the prep. Temporary filling material such as Cavit is a thick putty that plugs an opening instead.',
      '🪣')
  ];

  window.SL_INSTRUMENTS = { CATEGORIES: CATEGORIES, ITEMS: ITEMS };
})();
