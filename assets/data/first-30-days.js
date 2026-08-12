/*!
 * Premier Dental Academy — the first-30-days checklist, as shared data.
 *
 * This used to live inline in tools/first-30-days.html and was rendered by JavaScript, which
 * meant the entire checklist was invisible to search engines and to anyone browsing without
 * scripts. It now lives here so two things can read it: the page (which adds the tick-boxes and
 * progress bar) and scripts/build-static-content.mjs (which writes the list into the HTML so it
 * ships in the initial response). Edit the content HERE — the page has no copy of its own.
 */
(function () {
  'use strict';

  var WEEKS = [
    { t: 'Week 1 — Show up ready', items: [
      'Arrive 10–15 minutes early every day',
      'Learn every coworker\'s name and what they do',
      'Nail PPE + hand hygiene without being reminded',
      'Ask where everything lives (instruments, materials, forms)',
      'Read the next day\'s schedule before you leave' ] },
    { t: 'Week 2 — Master the basics', items: [
      'Set up the correct tray before the dentist sits down',
      'Keep the field dry — HVE suction + retraction',
      'Practice four-handed instrument transfer',
      'Learn the office\'s sterilization flow (dirty → clean)',
      'Greet and seat patients so they feel calm' ] },
    { t: 'Week 3 — Own the systems', items: [
      'Pull up charts and mark findings as the dentist calls them',
      'Watch how insurance claims get submitted',
      'Take a diagnostic radiograph with no retake',
      'Mix/prep materials before you\'re asked',
      'Restock your operatory at the end of the day' ] },
    { t: 'Week 4 — Become indispensable', items: [
      'Anticipate the next instrument before the dentist reaches',
      'Own at least one procedure setup start to finish',
      'Ask your dentist: "What can I do better?"',
      'Help the front desk when chairs are empty',
      'Write down what you\'ve learned — you\'ll be training someone soon' ] }
  ];

  var API = { WEEKS: WEEKS, TOTAL: WEEKS.reduce(function (n, w) { return n + w.items.length; }, 0) };

  if (typeof window !== 'undefined') window.PDA_FIRST30 = API;
  else globalThis.PDA_FIRST30 = API;
})();
