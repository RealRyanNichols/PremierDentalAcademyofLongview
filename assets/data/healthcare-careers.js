/*!
 * Premier Dental Academy — short-path healthcare careers, with figures from the BLS.
 *
 * WHY THE SOURCING MATTERS HERE
 * Every wage and growth figure on this page is an outcome claim about someone's future income.
 * FTC 16 CFR 254.4(e) requires those to be substantiated, and the rule this repo enforces
 * (scripts/check-compliance.mjs) will fail the build if a page states one without a dated
 * authoritative source rendered alongside it. So: no figure goes in this file without a source,
 * a date, and a link a reader can check for themselves.
 *
 * Wages are median ANNUAL wages from the BLS Occupational Employment and Wage Statistics survey,
 * May 2024. Growth is the BLS Employment Projections figure for 2024–2034. Both were current at
 * the time of writing; BLS republishes annually, so `asOf` is printed on the page and this file
 * should be refreshed when the next release lands.
 *
 * A median is the midpoint: half of workers in that job earned more, half earned less. It is not
 * a starting wage and it is not a promise — the page says so in as many words.
 */
(function () {
  'use strict';

  var SOURCE = {
    wages: 'U.S. Bureau of Labor Statistics, Occupational Employment and Wage Statistics',
    wagesAsOf: 'May 2024',
    growth: 'U.S. Bureau of Labor Statistics, Employment Projections',
    growthAsOf: '2024–2034',
    checked: '2026-08-12',
    allOccupationsMedian: 49500,
    allOccupationsGrowth: 3
  };

  // path = how someone actually gets in, in plain words. BLS "typical entry-level education".
  var CAREERS = [
    {
      id: 'dental-assistant', name: 'Dental assistant', emoji: '🦷',
      medianAnnual: 47300, growthPct: 6,
      education: 'Postsecondary nondegree award',
      typicalMonths: '3–12 months',
      what: 'Works chairside with the dentist: setting up trays, keeping the field clear, taking x-rays, charting, and looking after the patient in the chair.',
      path: 'A career-school programme, then registration with the Texas State Board of Dental Examiners to work as an RDA.',
      url: 'https://www.bls.gov/ooh/healthcare/dental-assistants.htm',
      ours: true
    },
    {
      id: 'medical-assistant', name: 'Medical assistant', emoji: '🩺',
      medianAnnual: 44200, growthPct: 12,
      education: 'Postsecondary nondegree award',
      typicalMonths: '9–12 months',
      what: 'Splits the day between clinical work — vitals, injections, prepping patients — and the front office in a doctor\'s practice.',
      path: 'A certificate programme at a community college or career school; certification is voluntary but widely asked for.',
      url: 'https://www.bls.gov/ooh/healthcare/medical-assistants.htm'
    },
    {
      id: 'phlebotomist', name: 'Phlebotomist', emoji: '💉',
      medianAnnual: 43660, growthPct: 6,
      education: 'Postsecondary nondegree award',
      typicalMonths: '4–8 months',
      what: 'Draws blood for tests, transfusions and donations, and keeps the samples labelled and tracked correctly.',
      path: 'A short certificate programme, then a certification exam that most employers expect.',
      url: 'https://www.bls.gov/ooh/healthcare/phlebotomists.htm'
    },
    {
      id: 'pharmacy-technician', name: 'Pharmacy technician', emoji: '💊',
      medianAnnual: 43460, growthPct: 6,
      education: 'High school diploma or equivalent',
      typicalMonths: '3–12 months',
      what: 'Fills and labels prescriptions under a pharmacist, handles insurance claims, and manages stock.',
      path: 'On-the-job training or a short programme; Texas requires registration with the State Board of Pharmacy.',
      url: 'https://www.bls.gov/ooh/healthcare/pharmacy-technicians.htm'
    },
    {
      id: 'nursing-assistant', name: 'Nursing assistant (CNA)', emoji: '🧑‍⚕️',
      medianAnnual: 39530, growthPct: 2,
      education: 'Postsecondary nondegree award',
      typicalMonths: '4–12 weeks',
      what: 'Provides hands-on daily care in nursing homes and hospitals: bathing, moving, feeding, and watching for changes.',
      path: 'A state-approved training programme and a competency exam. Often the quickest way into healthcare at all.',
      url: 'https://www.bls.gov/ooh/healthcare/nursing-assistants.htm'
    },
    {
      id: 'emt', name: 'Emergency medical technician', emoji: '🚑',
      medianAnnual: 41340, growthPct: 5,
      education: 'Postsecondary nondegree award',
      typicalMonths: '3–6 months',
      what: 'Answers emergency calls, assesses and stabilises patients, and gets them to hospital.',
      path: 'An EMT programme plus CPR certification, then state licensure. Paramedic is a further step up.',
      note: 'The growth figure covers EMTs and paramedics together. Paramedics had a higher median annual wage of $58,410 in May 2024.',
      url: 'https://www.bls.gov/ooh/healthcare/emts-and-paramedics.htm'
    },
    {
      id: 'surgical-technologist', name: 'Surgical technologist', emoji: '🔬',
      medianAnnual: 62830, growthPct: 5,
      education: 'Postsecondary nondegree award',
      typicalMonths: '12–24 months',
      what: 'Prepares the operating room, sterilises equipment, and passes instruments to the surgeon during operations.',
      path: 'A certificate or associate programme; most employers ask for certification.',
      url: 'https://www.bls.gov/ooh/healthcare/surgical-technologists.htm'
    },
    {
      id: 'lpn', name: 'Licensed vocational nurse (LVN)', emoji: '🏥',
      medianAnnual: 62340, growthPct: 3,
      education: 'Postsecondary nondegree award',
      typicalMonths: '12–18 months',
      what: 'Provides basic nursing care under a registered nurse or doctor — monitoring, wound care, medications.',
      path: 'A state-approved programme, then the NCLEX-PN exam and Texas licensure. Called LVN in Texas, LPN elsewhere.',
      url: 'https://www.bls.gov/ooh/healthcare/licensed-practical-and-licensed-vocational-nurses.htm'
    },
    {
      id: 'medical-records', name: 'Medical records specialist', emoji: '🗂️',
      medianAnnual: 50250, growthPct: 7,
      education: 'Postsecondary nondegree award',
      typicalMonths: '9–18 months',
      what: 'Organises and codes patient records and handles the billing side so claims are paid correctly.',
      path: 'A certificate or associate programme; coding certification is commonly expected.',
      url: 'https://www.bls.gov/ooh/healthcare/medical-records-and-health-information-technicians.htm'
    },
    {
      id: 'veterinary-assistant', name: 'Veterinary assistant', emoji: '🐾',
      medianAnnual: 37320, growthPct: 9,
      education: 'High school diploma or equivalent',
      typicalMonths: 'On the job',
      what: 'Looks after animals in a clinic or lab: feeding, restraining, cleaning, and helping the vet during exams.',
      path: 'Usually learned on the job, so the way in is applying rather than enrolling.',
      url: 'https://www.bls.gov/ooh/healthcare/veterinary-assistants-and-laboratory-animal-caretakers.htm'
    }
  ];

  var API = { SOURCE: SOURCE, CAREERS: CAREERS };

  if (typeof window !== 'undefined') window.PDA_CAREERS = API;
  else globalThis.PDA_CAREERS = API;
})();
