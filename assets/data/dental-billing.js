/*!
 * Premier Dental Academy — dental bill and insurance terms, decoded.
 *
 * Two audiences, one page. Patients arrive from search trying to work out why a bill says what
 * it says. Dental assistants and front-office staff need the same vocabulary to explain it at
 * the desk without guessing — which is a genuinely valuable skill and one nobody teaches.
 *
 * WHAT THIS FILE MUST NOT DO
 * It must not state what any particular plan covers, quote percentages as if they were
 * universal, or tell somebody what they will owe. Every plan is different, and the
 * authority on a specific plan is that plan's own benefit booklet and nothing else. Each term explains what the
 * mechanism IS and what question to ask; none of them predicts a number.
 */
(function () {
  'use strict';

  var TERMS = [
    {
      id: 'deductible', term: 'Deductible',
      short: 'The amount you pay yourself before the plan starts paying.',
      long: 'A fixed amount you cover out of pocket each plan year before the insurance contributes anything. Once it is met, it is met for the rest of that year.',
      example: 'If your deductible is $50 and your first visit of the year comes to $200, you typically pay the first $50 and the plan considers the rest.',
      ask: 'Has my deductible been met this year, and does it apply to this particular treatment?',
      gotcha: 'Many plans waive the deductible for preventive visits like cleanings and exams, so it tends to bite when you need actual treatment — which is exactly when people are not expecting it.'
    },
    {
      id: 'annual-max', term: 'Annual maximum',
      short: 'The most the plan will pay in a year. Everything above it is yours.',
      long: 'A ceiling on what the plan pays out across a plan year. It is the opposite of a medical out-of-pocket maximum: in dental, hitting the maximum means the plan STOPS paying, not that you stop paying.',
      example: 'On a plan with a $1,500 annual maximum, once it has paid out $1,500 the rest of that year is on you.',
      ask: 'How much of my annual maximum is left, and when does the plan year reset?',
      gotcha: 'This one catches people out badly. Plenty of dental maximums have not moved in decades while treatment costs have, so a single crown can use a large share of a year\'s benefit.'
    },
    {
      id: 'waiting-period', term: 'Waiting period',
      short: 'A stretch after joining where certain treatment is not covered yet.',
      long: 'A period after coverage starts before particular categories become available. Preventive care is often available straight away, while major work such as crowns can carry a wait.',
      example: 'A plan might cover cleanings from day one, fillings after six months, and crowns after twelve.',
      ask: 'Is there a waiting period on this category, and what date did my coverage start?',
      gotcha: 'Worth checking before booking major treatment on a new plan. It is also why some people time a job change around a dental problem.'
    },
    {
      id: 'downgrade', term: 'Downgrade clause',
      short: 'The plan pays for the cheaper material, and you pay the difference.',
      long: 'Also called an alternate benefit provision or "least expensive alternative treatment". Where more than one material would do the job, the plan pays its share based on the cheaper one, even if you and the dentist choose the other.',
      example: 'A tooth-coloured composite filling on a back tooth may be paid at the rate for a silver amalgam, leaving you the difference.',
      ask: 'Does my plan downgrade this, and if so what is the difference in what I would owe?',
      gotcha: 'This is the single most common reason a patient says "but I thought it was covered". It IS covered — just at the other material\'s rate. Being able to explain that calmly at the desk is a real front-office skill.'
    },
    {
      id: 'ucr', term: 'UCR (usual, customary and reasonable)',
      short: 'The plan\'s own idea of a fair price for a procedure in your area.',
      long: 'A benchmark fee the plan uses to decide what it will pay against. Plans set their own UCR figures and do not generally publish how they arrive at them. With an out-of-network dentist, anything charged above UCR can be billed to you.',
      example: 'If a dentist charges $1,200 for a crown and the plan\'s UCR is $1,000, the plan calculates its share from $1,000.',
      ask: 'Is this dentist in network, and if not, how does my plan handle charges above UCR?',
      gotcha: 'In-network dentists agree contracted fees, which is why staying in network usually makes the arithmetic more predictable rather than simply cheaper.'
    },
    {
      id: 'coinsurance', term: 'Coinsurance',
      short: 'The share of the cost you keep paying after the deductible.',
      long: 'A percentage split between you and the plan, which usually differs by category — preventive, basic and major treatment are commonly split differently.',
      example: 'At 80/20 coinsurance on a basic procedure, the plan pays 80% of the amount it recognises and you pay 20%.',
      ask: 'What is the coinsurance for this specific category on my plan?',
      gotcha: 'The percentage applies to the amount the plan recognises, not necessarily the amount on the bill. With UCR and downgrades in play those can be two different numbers.'
    },
    {
      id: 'preauth', term: 'Pre-authorisation / predetermination',
      short: 'Asking the plan in writing what it will pay, before treatment.',
      long: 'The office sends the proposed treatment to the plan and gets back an estimate of what it would cover. It does not commit the plan to pay, but it removes most of the surprise.',
      example: 'Before a crown, the office submits a predetermination and the plan responds with its estimated share.',
      ask: 'Can we send a predetermination before I commit to this?',
      gotcha: 'For anything expensive and non-urgent, this is the single most useful thing a patient can ask for — and offering it before they ask is what good front-office staff do.'
    },
    {
      id: 'eob', term: 'EOB (explanation of benefits)',
      short: 'The statement from the plan explaining what it paid and why.',
      long: 'Sent after a claim is processed. It shows the charge, the amount the plan recognised, what it paid, and what is left with you. It is a statement, not a bill.',
      example: 'An EOB might show a $200 charge, $160 allowed, $128 paid by the plan, and $72 as patient responsibility.',
      ask: 'Can we go through this EOB line by line against what I was actually charged?',
      gotcha: '"This is not a bill" is printed on them for a reason, and people still panic. Reading one confidently is a skill worth having on either side of the desk.'
    },
    {
      id: 'in-network', term: 'In network / out of network',
      short: 'Whether the dentist has a fee agreement with your plan.',
      long: 'In-network dentists have agreed contracted fees with the plan. Out-of-network dentists have not, so the plan pays against its own UCR figure and the balance can land with you.',
      example: 'The same crown can leave you owing different amounts at two practices purely because of the network agreement.',
      ask: 'Are you in network with my specific plan — not just my insurance company?',
      gotcha: 'An insurer can run several plans and a practice may be in network for some and not others. "We take your insurance" and "we are in network with your plan" are different sentences.'
    },
    {
      id: 'coordination', term: 'Coordination of benefits',
      short: 'The rules for when you are covered by two plans.',
      long: 'When somebody has coverage under two plans, one is primary and pays first, and the other may consider what is left. It does not mean everything is covered twice.',
      example: 'A child covered by both parents\' plans has one designated primary, commonly by a birthday rule.',
      ask: 'Which of my plans is primary, and has the secondary claim been sent?',
      gotcha: 'Two plans very rarely means no cost. Coordination rules cap the combined payment.'
    }
  ];

  var API = { TERMS: TERMS };

  if (typeof window !== 'undefined') window.PDA_BILLING = API;
  else globalThis.PDA_BILLING = API;
})();
