/*
 * East Texas town data for the local-SEO city pages.
 * Consumed by scripts/generate-city-pages.mjs (run: node scripts/generate-city-pages.mjs).
 *
 * RULES:
 *  - ONE campus: Longview. Every page is honest about that ("a short drive from X").
 *  - Distances/drive times are approximate, hedged with "about", measured from the
 *    campus at 2800 Gilmer Rd, Longview. Sanity-check against a map before editing.
 *  - Every `intro`, `commute`, and FAQ answer is hand-written and town-specific so
 *    generated pages are genuinely distinct (no doorway-page boilerplate).
 *  - No invented stats. Pricing/contact facts come from the generator, which mirrors
 *    assets/site-facts.js values. Local hooks are widely known town facts only.
 *
 * `band`: near (≤25 min) | mid (25–50 min) | far (55+ min — online-first framing).
 * `existing: true` entries are the hand-built pages already live; the generator does
 * NOT overwrite them — they're here for the /locations hub and the nearby-town mesh.
 */

export const CAMPUS = {
  town: "Longview",
  address: "2800 Gilmer Rd, Suite 106, Longview, TX 75604",
};

export const CITIES = [
  // ── Existing hand-built pages (not regenerated) ─────────────────────────────
  { slug: "tyler", town: "Tyler", county: "Smith", path: "/dental-assistant-school-tyler-tx",
    miles: 40, minutes: 45, existing: true, blurb: "East Texas' biggest city — train in-person in Longview or fully online." },
  { slug: "marshall", town: "Marshall", county: "Harrison", path: "/dental-assistant-school-marshall-tx",
    miles: 25, minutes: 30, existing: true, blurb: "A straight shot down US-80 to our Longview campus." },
  { slug: "kilgore", town: "Kilgore", county: "Gregg", path: "/dental-assistant-school-kilgore-tx",
    miles: 12, minutes: 20, existing: true, blurb: "Practically next door — evening class fits around a Kilgore day job." },
  { slug: "henderson", town: "Henderson", county: "Rusk", path: "/dental-assistant-school-henderson-tx",
    miles: 30, minutes: 35, existing: true, blurb: "US-259 north to Longview, or train online from home." },
  { slug: "gladewater", town: "Gladewater", county: "Gregg", path: "/dental-assistant-training-gladewater-tx",
    miles: 12, minutes: 18, existing: true, blurb: "The Antique Capital is minutes from our side of Longview." },

  // ── Generated pages ─────────────────────────────────────────────────────────
  {
    slug: "hallsville", town: "Hallsville", county: "Harrison", band: "near",
    miles: 12, minutes: 20, route: "US-80 East",
    blurb: "Bobcat country — about 20 minutes from our classroom door.",
    intro: "Hallsville folks are already used to the short hop into Longview for work, shopping, and Friday errands — and that same easy drive is all that sits between you and a dental assisting career. Train hands-on at our Longview campus, with evening options built for people who already have a day job, or take the whole program online from your living room in Bobcat country.",
    commute: "From Hallsville it's a straight run west on US-80 — about 12 miles, roughly 20 minutes to our campus at 2800 Gilmer Rd. That's shorter than a lot of daily commutes people in Hallsville already make, which is why our evening options work so well here: get off work, make the drive, train chairside, and still get home at a reasonable hour.",
    faqs: [
      { q: "How far is the school from Hallsville?", a: "About 12 miles — a roughly 20-minute drive west on US-80 to our Longview campus at 2800 Gilmer Rd, Suite 106. Most Hallsville students find it an easy after-work drive, and evening options are available." },
      { q: "Can I keep my job in Hallsville while I train?", a: "Yes — that's exactly what the evening options are for. Many of our students work full-time and train in the evenings. If even that doesn't fit, the 100% online program ($397, self-paced) lets you study on your own schedule." },
      { q: "Do I need any dental experience to start?", a: "No. Students from Hallsville and all over Harrison County start with zero dental background. We teach charting, radiology basics, chairside assisting, infection control, and front-office software from the ground up." },
      { q: "Are there dental assistant jobs near Hallsville?", a: "Dental offices across Longview, Marshall, and the rest of Harrison and Gregg counties hire assistants regularly — you'd be job-hunting in the same corridor you'd train in. See our salary page for what East Texas offices typically pay." },
    ],
    nearby: ["marshall", "white-oak", "tatum"],
  },
  {
    slug: "white-oak", town: "White Oak", county: "Gregg", band: "near",
    miles: 7, minutes: 12, route: "US-80 / Hwy 42",
    blurb: "Roughneck country — closer to our campus than most of Longview is.",
    intro: "If you live in White Oak, you're closer to our classroom than a lot of Longview residents are — our campus sits on Gilmer Rd, on the west side of town, barely past the White Oak city limits. That makes Premier Dental Academy about as close to a hometown dental assisting school as Roughneck country will ever get: real chairside training, evening options, about a 12-minute drive.",
    commute: "The drive is about 7 miles — roughly 12 minutes door to door. No highway slog, no big-city traffic. It's close enough that some students run home between work and evening class. And if you'd still rather skip the drive entirely, the same curriculum is available 100% online, self-paced.",
    faqs: [
      { q: "How close is the campus to White Oak?", a: "Very — about 7 miles, a 12-minute drive. Our campus is at 2800 Gilmer Rd, Suite 106, on the west side of Longview, which is the White Oak side. For most White Oak students it's the closest hands-on dental training there is." },
      { q: "Is there an evening class so I can keep working?", a: "Yes. Evening options are built for working adults — plenty of our students clock out, drive the few minutes over, and train chairside in the evening. Online ($397, self-paced) is there if even evenings don't fit." },
      { q: "What will I actually learn?", a: "Charting, dental radiology basics, chairside assisting, infection control, and the front-office software real offices run. It's hands-on from the start — typodonts, trays, instruments, the works." },
      { q: "What does it cost from White Oak?", a: "Same as everywhere: in-person is $3,000 paid in full, or $500 down on a $3,500 payment plan with simple weekly or monthly payments. The fully online program is $397. WIOA workforce funding may be an option — ask us." },
    ],
    nearby: ["gladewater", "kilgore", "hallsville"],
  },
  {
    slug: "gilmer", town: "Gilmer", county: "Upshur", band: "mid",
    miles: 22, minutes: 30, route: "TX-300 (Gilmer Rd)",
    blurb: "Our campus literally sits on the road named after your town.",
    intro: "Here's a fun fact for Gilmer folks: our campus address is 2800 Gilmer Rd — the Longview end of the same road that runs straight up to the Upshur County courthouse square. If you can drive to the Yamboree, you can drive to dental assisting school. Train hands-on with evening options, or take the full program online from home.",
    commute: "TX-300 south out of Gilmer turns into Gilmer Rd, and our campus is right on it — about 22 miles, roughly a 30-minute drive with no interstate required. It's one road, door to door. Evening options mean Upshur County students can work a full day and still make class.",
    faqs: [
      { q: "How long is the drive from Gilmer?", a: "About 22 miles straight down TX-300/Gilmer Rd — roughly 30 minutes, one road the whole way. Our campus is at 2800 Gilmer Rd, Suite 106, on the northwest side of Longview, the Gilmer side of town." },
      { q: "I work days in Gilmer — can I still train?", a: "Yes. Evening options exist for exactly this. And the 100% online program ($397, self-paced) covers the same curriculum if the drive or schedule doesn't work — several Upshur County students go that route." },
      { q: "Is WIOA funding available for Upshur County residents?", a: "Depending on your situation you may qualify for WIOA workforce funding through your local Workforce Solutions office — we can't promise eligibility, but we're glad to point you in the right direction before you spend a dime." },
      { q: "Where would I work after graduating?", a: "Gilmer has dental offices of its own, and Longview's larger market is a commutable 30 minutes away — so you'd have both small-town and city offices in range. Our salary page shows typical East Texas assistant pay." },
    ],
    nearby: ["diana", "big-sandy", "gladewater"],
  },
  {
    slug: "big-sandy", town: "Big Sandy", county: "Upshur", band: "mid",
    miles: 20, minutes: 28, route: "US-80 East",
    blurb: "A quiet US-80 town about half an hour from real chairside training.",
    intro: "Big Sandy is a small town, and small towns don't usually get career schools — but you don't need one in town when real, hands-on dental assisting training is about half an hour east. Premier Dental Academy trains at one campus in Longview, with evening options for working folks, and a 100% online program for anyone who'd rather learn from home off Highway 80.",
    commute: "It's about 20 miles east on US-80, through Gladewater and into Longview's west side — roughly 28 minutes, and our campus at 2800 Gilmer Rd is on the near side of town, so you never fight cross-town traffic. Evening class after a workday is very doable from Big Sandy.",
    faqs: [
      { q: "How far is the drive from Big Sandy?", a: "About 20 miles east on US-80 — roughly 28 minutes. The campus (2800 Gilmer Rd, Suite 106) is on the west side of Longview, the first side you reach coming from Big Sandy." },
      { q: "Can I do the whole thing online from Big Sandy?", a: "Yes — the online program is $397, self-paced, and 100% from home. Same curriculum as in-person. A lot of small-town students start online and visit the campus when they want hands-on time." },
      { q: "Do I need a college degree first?", a: "No. No degree, no dental experience required. We teach charting, radiology basics, chairside assisting, infection control, and front-office software from zero." },
      { q: "What's the payment setup?", a: "In-person: $3,000 paid in full, or $500 down on a $3,500 plan with weekly or monthly payments. Online: $397 flat. No hidden fees, and WIOA workforce funding may be an option depending on your situation." },
    ],
    nearby: ["gladewater", "gilmer", "white-oak"],
  },
  {
    slug: "diana", town: "Diana", county: "Upshur", band: "near",
    miles: 16, minutes: 22, route: "US-259 North",
    blurb: "Eagle country — about 22 minutes down 259 to the classroom.",
    intro: "Diana sits just far enough out that everything — work, shopping, school — means a drive down US-259. The good news: dental assisting training is on the near end of that drive. Our Longview campus is about 22 minutes from New Diana, with evening options for folks who work days, and a fully online program if you'd rather train from the house.",
    commute: "US-259 south into Longview, then a few minutes over to Gilmer Rd — about 16 miles, roughly 22 minutes total. It's the same drive Diana folks already make for groceries. Evening options mean you can keep your day job while you train chairside.",
    faqs: [
      { q: "How far is the school from Diana?", a: "About 16 miles — roughly a 22-minute drive down US-259 to our campus at 2800 Gilmer Rd, Suite 106, on Longview's northwest side. It's one of the shorter commutes among the towns we serve." },
      { q: "I've never worked in a dental office. Is that a problem?", a: "Not at all. Most students start with zero experience. You'll learn charting, radiology basics, chairside assisting, infection control, and the software real front desks run — hands-on, from the beginning." },
      { q: "What if I can't make the drive regularly?", a: "The 100% online program ($397, self-paced) covers the same curriculum from home. Some students mix it: online lessons at home, campus visits when they want hands-on practice." },
      { q: "How much does it cost?", a: "In-person is $3,000 paid in full, or $500 down on a $3,500 payment plan (weekly or monthly). Online is $397. Depending on your situation, WIOA workforce funding may help — we'll point you in the right direction." },
    ],
    nearby: ["ore-city", "gilmer", "jefferson"],
  },
  {
    slug: "ore-city", town: "Ore City", county: "Upshur", band: "mid",
    miles: 22, minutes: 30, route: "US-259 North",
    blurb: "Lake O' the Pines country, half an hour from hands-on training.",
    intro: "Ore City folks live near Lake O' the Pines and don't mind a drive when it's worth it. This one is: about 30 minutes down US-259 gets you real chairside dental assisting training at our Longview campus — the kind of hands-on class you can't get from a video alone. Evening options fit around a workday, and there's a full online program if the lake life wins.",
    commute: "Head south on US-259 about 22 miles into Longview and cut over to Gilmer Rd — roughly 30 minutes door to door. Coming from Ore City you hit our side of town first, so the drive is simpler than it sounds. Plenty of students from up the 259 corridor pair the evening class with a full-time job.",
    faqs: [
      { q: "How long is the drive from Ore City?", a: "About 22 miles down US-259 — roughly 30 minutes to our campus at 2800 Gilmer Rd, Suite 106, Longview. You come in on the northwest side of town, which is where the campus sits." },
      { q: "Is there a class schedule that works with a job?", a: "Yes — evening options are designed for working adults. Train after work and still get home to Upshur County at a decent hour. The online program ($397, self-paced) is the fallback if evenings don't fit." },
      { q: "What do dental assistants around here earn?", a: "Pay varies by office and experience — see our salary page for typical East Texas numbers rather than a promise. Offices in Longview, Gilmer, and Jefferson all hire within commuting range of Ore City." },
      { q: "Do I need anything before I enroll?", a: "No degree and no dental experience. Bring the willingness to learn; we cover charting, radiology basics, chairside assisting, infection control, and front-office software from scratch." },
    ],
    nearby: ["diana", "jefferson", "gilmer"],
  },
  {
    slug: "overton", town: "Overton", county: "Rusk", band: "mid",
    miles: 22, minutes: 30, route: "TX-135 North",
    blurb: "Oil-boom roots, and a new career about 30 minutes away.",
    intro: "Overton grew up on the East Texas oil boom — a town built by people willing to work with their hands. Dental assisting is that same kind of work: skilled, hands-on, and in demand in every town around here. Our Longview campus is about half an hour away, with evening options for working folks and a fully online program if the drive doesn't suit.",
    commute: "Take TX-135 north through Kilgore and on into Longview — about 22 miles, roughly 30 minutes. Kilgore students make a shorter version of the same drive every week. Evening options mean an Overton day job and chairside training can coexist.",
    faqs: [
      { q: "How far is the campus from Overton?", a: "About 22 miles — roughly a 30-minute drive up TX-135 through Kilgore to our Longview campus at 2800 Gilmer Rd, Suite 106. Evening options are available so the drive happens outside work hours." },
      { q: "Can I train online instead?", a: "Yes — the online program is $397, self-paced, 100% from home, with the same curriculum as in-person. Several Rusk County students choose it and save the windshield time." },
      { q: "How fast could I be working in a dental office?", a: "The program is measured in months, not years — online is self-paced, and in-person runs on a scheduled cohort. Either way you're looking at a real career change on a short timeline, not a two-year degree." },
      { q: "What does it cost?", a: "In-person: $3,000 paid in full, or $500 down on a $3,500 payment plan with weekly or monthly payments. Online: $397. WIOA workforce funding may be an option depending on your situation." },
    ],
    nearby: ["kilgore", "henderson", "tatum"],
  },
  {
    slug: "tatum", town: "Tatum", county: "Rusk", band: "near",
    miles: 17, minutes: 25, route: "TX-149 North",
    blurb: "Between Martin Creek Lake and a 25-minute drive to a new career.",
    intro: "Tatum sits quietly between Longview and Carthage, close to Martin Creek Lake — and about 25 minutes from the only hands-on dental assisting classroom in the area. Plenty of Tatum folks already commute to Longview for work; this is the same drive with a career at the end of it. Evening options keep your day job intact, and the online program skips the drive altogether.",
    commute: "TX-149 north runs you straight into Longview — about 17 miles, roughly 25 minutes to our campus on Gilmer Rd. It's an easy, familiar road, and evening class times mean you're driving it against traffic, not with it.",
    faqs: [
      { q: "How long is the drive from Tatum?", a: "About 17 miles up TX-149 — roughly 25 minutes to our campus at 2800 Gilmer Rd, Suite 106, Longview. Evening options are available for students working days in Tatum or at the plants nearby." },
      { q: "I work shifts — what are my options?", a: "Two: evening in-person classes at the Longview campus, or the 100% online program ($397, self-paced) that bends around any shift pattern. Same curriculum either way." },
      { q: "Do I need experience or a degree to start?", a: "No. We start from zero: charting, radiology basics, chairside assisting, infection control, and front-office software. Most students have never set foot behind a dental chair before day one." },
      { q: "Where are the jobs once I finish?", a: "Longview, Carthage, Henderson, and Marshall all have dental offices within commuting range of Tatum — you'd be able to job-hunt in four directions. Our salary page shows typical East Texas pay." },
    ],
    nearby: ["hallsville", "carthage", "henderson"],
  },
  {
    slug: "carthage", town: "Carthage", county: "Panola", band: "mid",
    miles: 35, minutes: 45, route: "US-79 / TX-149",
    blurb: "Home of the Texas Country Music Hall of Fame — and 45 minutes from ours.",
    intro: "Carthage put Panola County on the map with the Texas Country Music Hall of Fame. For a dental assisting career, the map points 45 minutes northwest: our Longview campus, where you train hands-on with real instruments and real software. If the drive is too much on top of work and family, the same curriculum runs 100% online — a route plenty of Panola County students take.",
    commute: "The common route is TX-149 through Tatum into Longview — about 35 miles, roughly 45 minutes. That's a real drive, so be honest with yourself: if you'd make it twice a week for a career, the evening options are built for you. If not, start online ($397) and train from Carthage.",
    faqs: [
      { q: "Is Longview really the closest hands-on program to Carthage?", a: "For this kind of chairside, instruments-in-hand training, our Longview campus (about 45 minutes away) is a short drive by East Texas standards — closer than Shreveport or Tyler for most of Panola County. And the online program means distance never has to be the blocker." },
      { q: "Can I do the whole program online from Carthage?", a: "Yes — $397, self-paced, 100% online, same curriculum. It's the most popular option for students who live 40+ minutes out and are juggling work or kids." },
      { q: "What about paying for it?", a: "In-person is $3,000 paid in full or $500 down on a $3,500 plan (weekly or monthly payments). Online is $397 flat. Depending on your situation, WIOA workforce funding may help cover training — worth asking before you assume you can't afford it." },
      { q: "Are dental offices hiring in Panola County?", a: "Carthage has its own dental offices, and Longview and Henderson widen the market considerably. Dental assisting is one of those roles nearly every town needs — see our salary page for typical East Texas pay." },
    ],
    nearby: ["tatum", "henderson", "marshall"],
  },
  {
    slug: "jefferson", town: "Jefferson", county: "Marion", band: "mid",
    miles: 37, minutes: 45, route: "US-59 / TX-49",
    blurb: "The historic riverboat town, about 45 minutes from the classroom.",
    intro: "Jefferson knows history better than any town in East Texas — riverboats, bed-and-breakfasts, brick streets. But history doesn't pay next month's bills, and Marion County doesn't have a dental assisting school of its own. The nearest hands-on classroom is ours, about 45 minutes south in Longview, with evening options — and the full program is also available online from home.",
    commute: "Most Jefferson folks run US-59 south toward Marshall and cut over, or take TX-49 to US-259 — either way it's about 37 miles, roughly 45 minutes. That's commitment, not convenience, so weigh the online option ($397, self-paced) honestly; several students from the lakes country train entirely from home.",
    faqs: [
      { q: "How far is Jefferson from the campus?", a: "About 37 miles — roughly 45 minutes, whether you come down through Marshall or via US-259. The campus is at 2800 Gilmer Rd, Suite 106 in Longview. Evening options exist so the drive doesn't collide with a workday." },
      { q: "Is online training legit for becoming a dental assistant?", a: "Yes — our online program ($397) covers the same curriculum as in-person, self-paced from home. Texas RDA registration requirements (radiology, jurisprudence, infection control) are covered either way; see our Texas RDA guide for the state's official steps." },
      { q: "I work in tourism/hospitality in Jefferson. Why switch?", a: "Dental assisting offers weekday hours, steady year-round demand, and a skill that transfers to any town — things seasonal tourism work rarely promises. It's a common career-change path for exactly that reason." },
      { q: "What's the total cost?", a: "In-person: $3,000 paid in full, or $500 down on a $3,500 payment plan. Online: $397. No hidden fees, and WIOA workforce funding may be an option depending on your situation." },
    ],
    nearby: ["ore-city", "diana", "marshall"],
  },
  {
    slug: "lindale", town: "Lindale", county: "Smith", band: "mid",
    miles: 38, minutes: 45, route: "I-20 West",
    blurb: "The Blackberry Capital of Texas, one interstate hop from training.",
    intro: "Lindale has boomed along I-20 — new neighborhoods, new shops, and plenty of new families looking for careers that don't require moving away or two years of college. Dental assisting fits that bill, and the training is one straight interstate hop east: our Longview campus, about 45 minutes door to door. Or skip I-20 entirely and take the program 100% online.",
    commute: "It's the easiest kind of drive: I-20 east about 35 miles, exit at Longview, and you're minutes from campus — roughly 45 minutes total. Cruise control the whole way. Evening options mean you're driving home after rush hour, not during it. And if the interstate commute isn't happening, online ($397, self-paced) is the same curriculum from your kitchen table.",
    faqs: [
      { q: "Why drive to Longview when Tyler is closer to Lindale?", a: "Fair question. Students choose us for the hands-on, small-class training style, the evening options, and straightforward pricing — $3,000 in-person paid in full ($500 down on a plan) or $397 fully online. Compare programs honestly; our cost-vs-community-college guide lays out the tradeoffs." },
      { q: "How long is the drive from Lindale?", a: "About 38 miles, roughly 45 minutes — almost all of it on I-20, which makes it a low-stress drive. The campus is at 2800 Gilmer Rd, Suite 106, on Longview's west side (the Lindale side)." },
      { q: "Can I train fully online from Lindale?", a: "Yes — $397, self-paced, 100% online, same curriculum as in-person. It's a popular choice for Smith County parents scheduling study time around school pickup." },
      { q: "Do I need experience?", a: "No. We teach charting, radiology basics, chairside assisting, infection control, and front-office software from zero. Most students start with no dental background at all." },
    ],
    nearby: ["tyler", "big-sandy", "gladewater"],
  },
  {
    slug: "hughes-springs", town: "Hughes Springs", county: "Cass", band: "mid",
    miles: 42, minutes: 50, route: "US-259 North",
    blurb: "Spring City — where Cass County meets a career path.",
    intro: "Hughes Springs — Spring City — sits where Cass County rolls into the piney lakes country, a good way from any career school. Ours is the closest hands-on dental assisting classroom: about 50 minutes down US-259 in Longview. That's a real commitment twice a week, which is why many students from up north mix it: online lessons from home, campus time when it counts.",
    commute: "US-259 south through Ore City and Diana into Longview — about 42 miles, roughly 50 minutes. It's a pretty drive and a familiar one for anybody who already comes to Longview for shopping or doctors. Evening options put the drive outside work hours; the online program ($397) removes it entirely.",
    faqs: [
      { q: "Is there anything closer to Hughes Springs?", a: "For hands-on chairside training with evening options, our Longview campus (about 50 minutes) is the practical choice for most of Cass County — closer than Texarkana's options for many. The 100% online program is the zero-drive alternative." },
      { q: "Can I really learn this online from home?", a: "Yes. The online program ($397, self-paced) covers the same curriculum — charting, radiology basics, chairside concepts, infection control, front-office software — and you can visit the campus when you want hands-on practice." },
      { q: "What financial help exists?", a: "In-person is $500 down on a $3,500 plan (or $3,000 paid in full); online is $397. Depending on your situation, WIOA workforce funding through your local Workforce Solutions office may help — always worth checking before ruling training out." },
      { q: "Where would I work afterward?", a: "Dental offices in Daingerfield, Pittsburg, Mount Pleasant, Gilmer, and Longview are all within commuting range of Hughes Springs — small-town offices regularly hire trained assistants. See our salary page for typical East Texas pay." },
    ],
    nearby: ["pittsburg", "ore-city", "mount-pleasant"],
  },
  {
    slug: "pittsburg", town: "Pittsburg", county: "Camp", band: "mid",
    miles: 42, minutes: 50, route: "US-271 / TX-155",
    blurb: "Hot-links country, about 50 minutes from hands-on training.",
    intro: "Pittsburg has fed East Texas for generations — hot links, poultry, hard work. What Camp County doesn't have is a dental assisting school, and ours is the nearest hands-on classroom: about 50 minutes south in Longview, with evening options for working folks. The full curriculum also runs 100% online, which many Camp County students prefer over the drive.",
    commute: "Most folks take TX-155/US-271 south toward Gilmer and follow TX-300 into Longview — about 42 miles, roughly 50 minutes. If twice-a-week isn't realistic on top of a job, start with the online program ($397, self-paced) and come down for hands-on time when you can.",
    faqs: [
      { q: "How far is Pittsburg from the campus?", a: "About 42 miles — roughly 50 minutes via Gilmer. The campus is at 2800 Gilmer Rd, Suite 106, Longview, on the northwest side of town (your side, coming from Camp County)." },
      { q: "Is the online program the same thing?", a: "Same curriculum — charting, radiology basics, chairside assisting, infection control, front-office software — self-paced from home for $397. In-person adds live chairside practice at the Longview campus." },
      { q: "I work in the poultry industry — is dental assisting a realistic switch?", a: "It's one of the most common career changes we see: production and food-industry workers already have the discipline, and dental assisting adds weekday hours, cleaner conditions, and a skill every town needs. No prior experience required." },
      { q: "What does it cost, all-in?", a: "In-person: $3,000 paid in full, or $500 down on a $3,500 payment plan (weekly or monthly). Online: $397. WIOA workforce funding may be an option depending on your situation — we'll point you to the right office." },
    ],
    nearby: ["gilmer", "hughes-springs", "mount-pleasant"],
  },
  {
    slug: "mount-pleasant", town: "Mount Pleasant", county: "Titus", band: "far",
    miles: 52, minutes: 60, route: "US-271 South",
    blurb: "Titus County's hub — train online from home, or make the drive that's worth it.",
    intro: "Mount Pleasant is the biggest town in its corner of Northeast Texas, but dedicated hands-on dental assisting training still means a drive — about an hour down US-271 to our Longview campus. For a lot of Titus County students, the smarter starting point is our 100% online program: the same curriculum, self-paced from home, with the campus there when you want in-person time.",
    commute: "US-271 south through Pittsburg and Gilmer, then TX-300 into Longview — about 52 miles, roughly an hour. Students who choose in-person from this far out usually stack their reasons: they want live chairside reps, they carpool, or they pair class with errands in Longview. Everyone else starts online ($397) and keeps the gas money.",
    faqs: [
      { q: "An hour is a long drive. What do Mount Pleasant students actually do?", a: "Most start with the online program ($397, self-paced) — same curriculum, zero commute. Some switch to or add in-person later for live chairside practice; the online tuition transfers as credit toward in-person within 90 days." },
      { q: "Is online dental assistant training respected by employers?", a: "What employers care about is whether you can chart, assist, and run their software from week one — which is exactly what the curriculum teaches, online or in-person. Texas RDA registration (radiology, jurisprudence, infection control) is a state process you complete either way." },
      { q: "How much does each option cost?", a: "Online: $397 flat. In-person at the Longview campus: $3,000 paid in full, or $500 down on a $3,500 plan with weekly or monthly payments. WIOA workforce funding may be an option depending on your situation." },
      { q: "Are there dental jobs in Titus County?", a: "Mount Pleasant is a regional hub with its own dental offices, plus Pittsburg, Daingerfield, and Mount Vernon nearby — trained assistants don't have to leave the county to find work. See our salary page for typical East Texas pay." },
    ],
    nearby: ["pittsburg", "hughes-springs", "gilmer"],
  },
  {
    slug: "nacogdoches", town: "Nacogdoches", county: "Nacogdoches", band: "far",
    miles: 68, minutes: 75, route: "US-259 South",
    blurb: "The oldest town in Texas — start a new career from it, mostly online.",
    intro: "Nacogdoches is the oldest town in Texas and a college town through and through — but not everyone wants (or can afford) a multi-year degree path. Dental assisting is the shortcut into healthcare: months of training, not years. From Nacogdoches, the practical route is our 100% online program; the Longview campus is about an hour and 15 minutes up US-259 for those who want hands-on days.",
    commute: "US-259 north runs straight from Nacogdoches to Longview — about 68 miles, roughly 1 hour 15 minutes. We'll be honest: that's a long haul for a regular evening class. Most Nacogdoches students train online ($397, self-paced) and treat campus visits as optional hands-on boosts rather than a commute.",
    faqs: [
      { q: "Should I even consider the in-person program from Nacogdoches?", a: "Only if the drive genuinely works for you — it's about 75 minutes each way. For most Nacogdoches students the online program ($397, same curriculum, self-paced) is the realistic path, and online tuition transfers as credit toward in-person within 90 days if you change your mind." },
      { q: "How is this different from a community-college dental program?", a: "Speed and cost. This is focused career training measured in months, at $397 online or $3,000 in-person — versus semesters of prerequisites. Our cost-vs-community-college guide walks the comparison honestly, tradeoffs included." },
      { q: "Does SFA student life fit around this?", a: "The online program is self-paced, so students (or staff) at SFA fit lessons around class and work schedules all the time. There's no fixed login time — you study when you can." },
      { q: "What are the Texas requirements to become an RDA?", a: "Texas requires radiology, jurisprudence, and infection-control coursework and registration with the TSBDE. Our Texas RDA guide covers the official steps; the curriculum is built around them." },
    ],
    nearby: ["henderson", "carthage", "tatum"],
  },
  {
    slug: "athens", town: "Athens", county: "Henderson", band: "far",
    miles: 70, minutes: 80, route: "TX-31 East",
    blurb: "The black-eyed pea capital — go online, or make Longview a day trip.",
    intro: "Athens claims the original hamburger and the black-eyed pea crown, and it anchors its own corner of East Texas an hour-plus from ours. That distance is exactly why our online program exists: the full dental assisting curriculum, self-paced from home in Henderson County, for $397. The Longview campus — about 80 minutes east on TX-31 — is there for students who want occasional hands-on days.",
    commute: "TX-31 east through Tyler and on to Longview is about 70 miles — call it 1 hour 20 minutes. Nobody should sugar-coat that as a casual commute. Start online, and if you find yourself wanting live chairside reps, the online tuition transfers as credit toward the in-person program within 90 days.",
    faqs: [
      { q: "Is the drive from Athens realistic?", a: "For a weekly class, usually not — it's about 80 minutes each way. That's why we'd point most Athens students to the online program first: $397, self-paced, same curriculum, and it transfers as credit toward in-person within 90 days if you upgrade." },
      { q: "Can I really become a dental assistant training mostly from home?", a: "Yes. The curriculum — charting, radiology basics, chairside assisting concepts, infection control, front-office software — is built to be learned online, and free tools like our practice exam and charting trainers let you drill skills from anywhere." },
      { q: "What about the Texas RDA registration steps?", a: "Texas requires radiology, jurisprudence, and infection-control courses plus TSBDE registration — a state process you complete regardless of where you trained. Our Texas RDA guide lays out each step." },
      { q: "What does it cost from Athens?", a: "Online: $397 flat. In-person in Longview: $3,000 paid in full or $500 down on a $3,500 plan. Depending on your situation, WIOA workforce funding through your local Workforce Solutions office may help." },
    ],
    nearby: ["tyler", "lindale", "palestine"],
  },
  {
    slug: "palestine", town: "Palestine", county: "Anderson", band: "far",
    miles: 78, minutes: 90, route: "US-79 North",
    blurb: "Dogwood country — train online from home, visit when you want.",
    intro: "Palestine has the dogwood trails, the Texas State Railroad, and a long history of doing things its own way. What Anderson County doesn't have nearby is a hands-on dental assisting school — ours in Longview is about an hour and a half up US-79. So for Palestine, we lead with the honest recommendation: start with the 100% online program and let the campus be a field trip, not a commute.",
    commute: "US-79 north through Jacksonville and Henderson to Longview runs about 78 miles — roughly 90 minutes. That's a day-trip distance, not a class-night distance. The online program ($397, self-paced) delivers the same curriculum at your kitchen table, and online tuition transfers as credit toward in-person within 90 days if you decide you want regular hands-on training.",
    faqs: [
      { q: "Why is a Longview school advertising to Palestine?", a: "Because the online program serves Anderson County without the drive — same curriculum, $397, self-paced — and because some Palestine students genuinely do want occasional hands-on days at a real campus, even 90 minutes out. We're upfront that the campus is in Longview and only Longview." },
      { q: "How does the online program actually work?", a: "Self-paced video lessons and coursework covering charting, radiology basics, chairside assisting, infection control, and front-office software, plus free practice tools (practice exam, charting trainers) you can use from anywhere. Start whenever; move at your speed." },
      { q: "What jobs exist in Anderson County for dental assistants?", a: "Palestine and Jacksonville both have dental offices, and trained assistants are one of the roles small-city practices consistently need. See our salary page for typical East Texas pay ranges rather than promises." },
      { q: "What are the real costs?", a: "Online: $397. In-person (Longview campus): $3,000 paid in full, or $500 down on a $3,500 payment plan. WIOA workforce funding may be an option depending on your situation — check with your local Workforce Solutions office." },
    ],
    nearby: ["athens", "henderson", "tyler"],
  },
];
