/*!
 * Premier Dental Academy — the finish plan.
 *
 * People rarely quit a course because it was too hard. They quit because the car died in week
 * five, or the childcare fell through, or a shift got moved and nobody had a plan for it. This
 * module holds the risks that actually end programmes, and for each one a concrete thing to
 * arrange BEFORE it happens rather than after.
 *
 * No scores, no grades, no "you are 73% likely to drop out" — that would be an invented
 * statistic and it would not help anyone. It sorts the risks somebody has flagged and hands
 * back a plan. Pure data and selection logic; the page does the rendering.
 */
(function () {
  'use strict';

  var RISKS = [
    {
      id: 'childcare',
      q: 'Childcare could fall through',
      why: 'The single most common reason people stop coming. One cancellation, and a week is gone.',
      plan: [
        'Name a backup person now, before you need one, and ask them this week rather than on the morning.',
        'Ask your local Workforce Solutions office about childcare assistance — Texas funds it for parents in training, and they decide, not us.',
        'Dial 211 for local childcare help. It is free and it is answered 24/7.',
        'Tell us early if a class day becomes impossible. A conversation in week two has options that the same conversation in week eight does not.'
      ]
    },
    {
      id: 'transport',
      q: 'The car might not make it',
      why: 'A breakdown turns into missed days, and missed days turn into falling behind.',
      plan: [
        'Work out one backup way to reach the campus at 2800 Gilmer Rd — a lift, a colleague, a relative on standby.',
        'Put a small amount aside each week specifically for tyres and repairs, separate from tuition.',
        'Swap numbers with someone in your cohort in week one. Students carpool constantly, and it is easier to arrange before you need it.'
      ]
    },
    {
      id: 'work',
      q: 'My work schedule could change',
      why: 'A manager moves a shift, it clashes with class, and suddenly you are choosing between rent and training.',
      plan: [
        'Give your manager your class dates in writing now, and ask for them in the rota rather than hoping.',
        'If you have not told work yet, that conversation is easier than it feels — the family-talk tool has the words for it.',
        'Ask whether your employer would put money towards the training. Some dental and medical employers do, and the ask has to come from you.'
      ]
    },
    {
      id: 'money',
      q: 'Money could get tight partway through',
      why: 'Tuition is not the problem — it is the fortnight where the tuition payment and the electricity bill land together.',
      plan: [
        'Pick the payment cadence that matches how you are paid: weekly instalments if you are paid weekly, monthly if monthly.',
        'Work out your real cost first, including fuel and childcare, so nothing surprises you in week six.',
        'If a payment is going to be late, ring us before it is late — (903) 913-6444. We can work with that. We cannot work with silence.',
        'Check the funding routes: Workforce Solutions, Vocational Rehabilitation, and employer sponsorship all decide separately from us.'
      ]
    },
    {
      id: 'study',
      q: 'I might fall behind on the material',
      why: 'Falling behind quietly is what turns a hard week into leaving. It is also the easiest one to fix early.',
      plan: [
        'Book one fixed study block a week in your calendar and treat it like a shift you cannot miss.',
        'Use the free drills between classes — the quiz hub, the flashcards and the charting reference are there for exactly this.',
        'Ask the question in the room. Somebody else has it too and is also not asking.',
        'Tell us in the week you start struggling, not the week you are ready to give up.'
      ]
    },
    {
      id: 'health',
      q: 'Health or a family emergency could hit',
      why: 'Nobody plans for this one, which is precisely why it ends programmes.',
      plan: [
        'Know the policy before you need it: talk to us about what happens if you have to miss time, and get the answer while it is hypothetical.',
        'Keep one person in your cohort updated so somebody notices when you go quiet.',
        'Read the transfer and refund terms now rather than in a crisis — they are on the Terms page.'
      ]
    },
    {
      id: 'alone',
      q: 'I might be doing this on my own',
      why: 'Isolation is a real risk factor. People who know somebody in their cohort finish more often than people who do not.',
      plan: [
        'Learn two names in week one. That is the whole intervention and it works.',
        'Tell the people at home what you are doing and what you will need from them — the family-talk tool walks through that conversation.',
        'Come and talk to Amanda. Being told you are not the first person to feel this way turns out to matter.'
      ]
    }
  ];

  /** Returns the flagged risks in the order they were listed, plus a plan for each. */
  function buildPlan(selectedIds) {
    var set = {};
    (selectedIds || []).forEach(function (id) { set[id] = true; });
    var picked = RISKS.filter(function (r) { return set[r.id]; });
    return {
      count: picked.length,
      risks: picked,
      // Everyone gets these two regardless — they are the ones that apply to every student.
      universal: [
        'Put the class dates in your phone calendar with a reminder the night before.',
        'Save (903) 913-6444 in your contacts now, so ringing us is not a decision you have to make under stress.'
      ]
    };
  }

  var API = { RISKS: RISKS, buildPlan: buildPlan };

  if (typeof window !== 'undefined') window.PDA_FINISH = API;
  else globalThis.PDA_FINISH = API;
})();
