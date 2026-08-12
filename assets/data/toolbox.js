/*!
 * Premier Dental Academy — the toolbox manifest.
 *
 * One entry per tool on the site. This is the source for /toolbox, which is generated into
 * static HTML by scripts/build-static-content.mjs — the hub is the main entry point from
 * search, so every tool name and description has to be in the initial response rather than
 * assembled by JavaScript afterwards.
 *
 * Fields:
 *   situation  which of the seven moments in the journey this belongs to. People arrive at
 *              the hub with a problem, not a tool category, so the primary sort is by problem.
 *   type       calculator / drill / reference / planner / course. This is the filter.
 *   cost       'free'  — open to anyone, no signup
 *              'gated' — free, but asks for contact details first
 *              'paid'  — a product, included free for enrolled students
 *   draft      true keeps it out of the published hub. Used for anything awaiting review.
 */
(function () {
  'use strict';

  var SITUATIONS = [
    { id: 'deciding',  title: 'Working out if this is for you',   blurb: 'Before you spend a penny, find out whether the job actually suits you — and what else is out there.' },
    { id: 'money',     title: 'Working out the money',            blurb: 'What it costs, what it really costs, and every route people use to pay for it.' },
    { id: 'time',      title: 'Making the time work',             blurb: 'Whether the week is there, and what to do about the weeks where it is not.' },
    { id: 'learning',  title: 'Learning the job',                 blurb: 'Instruments, charting, trays, x-rays and real chairside scenarios. Drill until it is automatic.' },
    { id: 'exam',      title: 'Getting through the exam',         blurb: 'Practice questions, study plans, and prep you can work through at your own pace.' },
    { id: 'hired',     title: 'Getting hired',                    blurb: 'The resume, the interview, and what to do in your first month.' },
    { id: 'working',   title: 'Once you are working',             blurb: 'Support when life gets in the way, and a place to share how it went.' }
  ];

  var TYPES = [
    { id: 'calculator', label: 'Calculators' },
    { id: 'drill',      label: 'Drills & practice' },
    { id: 'reference',  label: 'Reference' },
    { id: 'planner',    label: 'Planners' },
    { id: 'course',     label: 'Courses' }
  ];

  var TOOLS = [
    /* ── Deciding ─────────────────────────────────────────────────────────── */
    { id:'is-it-for-me', name:'Is it for you?', href:'/tools/is-it-for-me', emoji:'🤔', situation:'deciding', type:'reference', cost:'free',
      blurb:'Six honest questions about whether dental assisting suits who you are.' },
    { id:'healthcare-careers', name:'Short-path healthcare careers', href:'/tools/healthcare-careers', emoji:'🏥', situation:'deciding', type:'reference', cost:'free', isNew:true,
      blurb:'Ten jobs you can train for in under two years, compared on pay and training length using BLS figures.' },
    { id:'career-paths', name:'Career paths explorer', href:'/tools/career-paths', emoji:'🗺️', situation:'deciding', type:'reference', cost:'free',
      blurb:'Where dental assisting can lead, and what each step along the way involves.' },
    { id:'salary', name:'East Texas salary guide', href:'/salary', emoji:'📊', situation:'deciding', type:'reference', cost:'free',
      blurb:'What dental assistants earn around Longview, Tyler and the surrounding towns.' },
    { id:'family-talk', name:'The family talk', href:'/tools/family-talk', emoji:'🗣️', situation:'deciding', type:'reference', cost:'free',
      blurb:'How to explain this decision to the people who will worry about you.' },

    /* ── Money ────────────────────────────────────────────────────────────── */
    { id:'cost-of-training', name:'What it really costs', href:'/tools/cost-of-training', emoji:'💰', situation:'money', type:'calculator', cost:'free', isNew:true,
      blurb:'Tuition plus the wages, fuel and childcare it actually costs — then how long the new job takes to earn it back.' },
    { id:'paying-for-training', name:'How people pay for it', href:'/tools/paying-for-training', emoji:'🏛️', situation:'money', type:'reference', cost:'free', isNew:true,
      blurb:'Seven funding routes, and for each one the thing nobody tells you: who actually decides.' },
    { id:'funding-finder', name:'Funding finder', href:'/tools/funding-finder', emoji:'🔎', situation:'money', type:'reference', cost:'free',
      blurb:'Six questions to see whether WIOA or other funding might apply to you.' },
    { id:'take-home-pay', name:'Take-home pay calculator', href:'/tools/take-home-pay', emoji:'💵', situation:'money', type:'calculator', cost:'free',
      blurb:'What an East Texas dental assistant paycheck looks like after deductions.' },
    { id:'savings-starter', name:'Savings starter', href:'/tools/savings-starter', emoji:'🐖', situation:'money', type:'planner', cost:'free',
      blurb:'A week-by-week plan to put the $500 down payment together.' },
    { id:'tuition-planner', name:'Tuition planner', href:'/tools/tuition-planner', emoji:'🧮', situation:'money', type:'calculator', cost:'free',
      blurb:'Map the payment plan against your own pay dates.' },

    /* ── Time ─────────────────────────────────────────────────────────────── */
    { id:'hours-check', name:'168-hour reality check', href:'/tools/hours-check', emoji:'⏳', situation:'time', type:'calculator', cost:'free', isNew:true,
      blurb:'Add up what your week is already spoken for and see honestly what is left.' },
    { id:'schedule-planner', name:'Schedule planner', href:'/tools/schedule-planner', emoji:'📅', situation:'time', type:'planner', cost:'free',
      blurb:'See how class fits around your job, your children and everything else.' },
    { id:'finish-plan', name:'Your finish plan', href:'/tools/finish-plan', emoji:'🎯', situation:'time', type:'planner', cost:'free', isNew:true,
      blurb:'Plan for the things that actually derail people — before week five, not after.' },
    { id:'calendar', name:'Class calendar', href:'/calendar', emoji:'🗓️', situation:'time', type:'reference', cost:'free',
      blurb:'Every upcoming class date, with seats remaining.' },

    /* ── Learning the job ─────────────────────────────────────────────────── */
    { id:'skills-lab', name:'Skills Lab', href:'/skills-lab', emoji:'🧪', situation:'learning', type:'drill', cost:'free',
      blurb:'The whole practice environment: competencies, quizzes, badges and a skill passport.' },
    { id:'quizzes', name:'Practice quiz hub', href:'/skills-lab/quizzes', emoji:'⚡', situation:'learning', type:'drill', cost:'free',
      blurb:'Practice questions across every category an office cares about, with unlimited retakes.' },
    { id:'abbreviations', name:'Charting abbreviations', href:'/skills-lab/abbreviations', emoji:'✍️', situation:'learning', type:'reference', cost:'free',
      blurb:'The shorthand you will read and write on charts every day, grouped and explained.' },
    { id:'instruments', name:'Instrument identification', href:'/skills-lab/instruments', emoji:'🔧', situation:'learning', type:'reference', cost:'free',
      blurb:'Every instrument and material, with how to tell apart the ones people confuse.' },
    { id:'tray-builder', name:'Tray checklists', href:'/skills-lab/tray-builder', emoji:'🗄️', situation:'learning', type:'reference', cost:'free',
      blurb:'Work through each procedure tray as a checklist and tick it off as you learn it.' },
    { id:'procedures', name:'Procedure walkthroughs', href:'/skills-lab/procedures', emoji:'📋', situation:'learning', type:'drill', cost:'free',
      blurb:'Step through real appointments with the dentist talking you through them.' },
    { id:'day-shift', name:'A day on the schedule', href:'/skills-lab/day-shift', emoji:'🕘', situation:'learning', type:'drill', cost:'free',
      blurb:'Work a full day of patients back to back and see how you hold up.' },
    { id:'virtual-office', name:'Virtual office', href:'/skills-lab/virtual-office', emoji:'🏢', situation:'learning', type:'drill', cost:'free',
      blurb:'The whole practice, simulated — patients, staff and the day as it really runs.' },
    { id:'abbreviation-drill', name:'Charting abbreviation drill', href:'/skills-lab/abbreviation-drill', emoji:'🔤', situation:'learning', type:'drill', cost:'free', isNew:true,
      blurb:'All 96 abbreviations three ways: flip through, type from memory, or multiple choice.' },
    { id:'instrument-id', name:'Instrument ID trainer', href:'/skills-lab/instrument-id', emoji:'🔩', situation:'learning', type:'drill', cost:'free', isNew:true,
      blurb:'Identify all 84 instruments, and learn to tell apart the pairs everybody confuses.' },
    { id:'tray-setup', name:'Tray setup builder', href:'/skills-lab/tray-setup', emoji:'🍽️', situation:'learning', type:'drill', cost:'free', isNew:true,
      blurb:'Set the tray for 14 procedures and get marked against the four real arrangement rules.' },
    { id:'practice-pro', name:'Practice Pro', href:'/tools/practice-pro', emoji:'🖥️', situation:'learning', type:'drill', cost:'free',
      blurb:'A practice-management trainer with a working anatomical tooth chart.' },
    { id:'chairside', name:'ChairSide', href:'/tools/chairside', emoji:'🦷', situation:'learning', type:'drill', cost:'free',
      blurb:'Clinical workflow trainer — procedures, trays and the assisting steps in order.' },
    { id:'how-to-chart', name:'How to chart', href:'/tools/how-to-chart', emoji:'📈', situation:'learning', type:'reference', cost:'free',
      blurb:'Dental charting explained the way offices actually do it.' },
    { id:'flashcards', name:'RDA flashcards', href:'/tools/flashcards', emoji:'🃏', situation:'learning', type:'drill', cost:'free',
      blurb:'Instruments, terms and infection control — flip, recall, repeat.' },

    /* ── Exam ─────────────────────────────────────────────────────────────── */
    { id:'practice-exam', name:'Free practice exam', href:'/tools/practice-exam', emoji:'📝', situation:'exam', type:'drill', cost:'gated',
      blurb:'RDA-style questions with instant explanations and a weak-area breakdown.' },
    { id:'rda-practice-exam', name:'Full RDA practice exam', href:'/tools/rda-practice-exam', emoji:'🎓', situation:'exam', type:'drill', cost:'free', draft:true,
      blurb:'Ninety questions across three banks with per-domain reporting.' },
    { id:'study-plan', name:'Study plan builder', href:'/tools/study-plan', emoji:'🎯', situation:'exam', type:'planner', cost:'free',
      blurb:'Build a week-by-week study plan that fits around your actual schedule.' },
    { id:'study-guide', name:'Free study guide', href:'/study-guide', emoji:'📖', situation:'exam', type:'reference', cost:'gated',
      blurb:'The topics candidates get tripped up on, in one place.' },
    { id:'exam-pro', name:'Exam Pro', href:'/exam-pro', emoji:'⏱️', situation:'exam', type:'course', cost:'paid',
      blurb:'The timed mock state board with per-topic scoring and full explanations.' },
    { id:'study-pack', name:'Study Pack', href:'/study-pack', emoji:'📚', situation:'exam', type:'course', cost:'paid',
      blurb:'Cheat sheets and a study guide covering the whole syllabus.' },
    { id:'exam-prep-course', name:'Exam Prep Course', href:'/exam-prep-course', emoji:'🎓', situation:'exam', type:'course', cost:'paid',
      blurb:'A guided mini-course that walks you to exam day.' },

    /* ── Getting hired ────────────────────────────────────────────────────── */
    { id:'resume-builder', name:'Resume builder', href:'/tools/resume-builder', emoji:'📄', situation:'hired', type:'planner', cost:'free',
      blurb:'A dental-assistant resume that reads right to an office manager.' },
    { id:'interview-prep', name:'Interview prep', href:'/tools/interview-prep', emoji:'🎤', situation:'hired', type:'reference', cost:'free',
      blurb:'The questions East Texas offices ask, and answers that land.' },
    { id:'first-30-days', name:'Your first 30 days', href:'/tools/first-30-days', emoji:'🚀', situation:'hired', type:'planner', cost:'free',
      blurb:'A week-by-week checklist for your first month in a dental office.' },
    { id:'hiring-partners', name:'Hiring partners', href:'/hiring-partners', emoji:'🤝', situation:'hired', type:'reference', cost:'free',
      blurb:'The East Texas offices that hire from us.' },
    { id:'career-vault', name:'Career Vault', href:'/career-vault', emoji:'🗝️', situation:'hired', type:'course', cost:'paid',
      blurb:'Four career tracks and forty-four lessons mapping a whole dental career.' },

    /* ── Once you are working ─────────────────────────────────────────────── */
    { id:'resource-hub', name:'Student resource hub', href:'/tools/resource-hub', emoji:'📚', situation:'working', type:'reference', cost:'free',
      blurb:'Childcare, food, rent, and someone to talk to — real numbers that answer.' },
    { id:'share-your-win', name:'Share your win', href:'/tools/share-your-win', emoji:'🏆', situation:'working', type:'reference', cost:'free',
      blurb:'Tell us how it went. Your story is what convinces the next person to start.' }
  ];

  var API = {
    SITUATIONS: SITUATIONS,
    TYPES: TYPES,
    TOOLS: TOOLS,
    published: function () { return TOOLS.filter(function (t) { return !t.draft; }); }
  };

  if (typeof window !== 'undefined') window.PDA_TOOLBOX = API;
  else globalThis.PDA_TOOLBOX = API;
})();
