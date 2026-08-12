/*!
 * Premier Dental Academy — the Texas RDA credential timeline.
 *
 * Ordered steps from "no training" to "registered and working", with what to have in hand at
 * each one. Designed to be printed and ticked off.
 *
 * SOURCING RULE FOR THIS FILE
 * Every requirement here is set by the Texas State Board of Dental Examiners, not by PDA, and
 * TSBDE changes them. Nothing in this file may state a fee, a processing time, or a deadline —
 * those are exactly the details that go stale and that somebody would plan their money around.
 * The page tells the reader to confirm current details at tsbde.texas.gov before paying for
 * anything, and every step carries a link there.
 *
 * Requirements below reflect TSBDE's published dental assistant registration requirements as
 * checked on the date in SOURCE.checked. They match the framing already used in
 * blog/texas-dental-assistant-certifications-checklist.html — keep the two consistent.
 */
(function () {
  'use strict';

  var SOURCE = {
    authority: 'Texas State Board of Dental Examiners (TSBDE)',
    url: 'https://tsbde.texas.gov',
    checked: '2026-08-12',
    caveat: 'Requirements, fees and processing times are set by TSBDE and change. Confirm the ' +
            'current details at tsbde.texas.gov before you pay for anything.'
  };

  var STEPS = [
    {
      id: 'diploma',
      title: 'High school diploma or GED',
      what: 'The baseline TSBDE asks for before you can register as a dental assistant.',
      bring: ['Your diploma or GED certificate', 'A photo ID that matches the name on it'],
      note: 'Not finished yet? Free adult-education and GED classes run across East Texas — dial 211 or ask Workforce Solutions. This does not have to stop you starting.',
      whoDecides: 'Your school district or GED testing centre issues it.'
    },
    {
      id: 'training',
      title: 'Complete a TSBDE-approved registration course',
      what: 'The training programme itself. This is the part Premier Dental Academy does — about 12 weeks in person at the Longview campus, or self-paced online as distance education.',
      bring: ['Enrolment paperwork', 'Your tuition arrangement — $3,000 paid in full or $3,500 on a plan'],
      note: 'A school certificate and state registration are two different things. Finishing here proves you completed training; the state credential comes from TSBDE and no school can hand it to you.',
      whoDecides: 'Your course provider confirms completion. TSBDE decides whether the course is approved.',
      ours: true
    },
    {
      id: 'bls',
      title: 'Hands-on BLS / CPR certification',
      what: 'A current basic life support course. It has to be the hands-on kind.',
      bring: ['Your BLS or CPR card, in date'],
      note: 'A course delivered entirely online is not accepted. Book the version where you physically practise compressions with an instructor.',
      whoDecides: 'The training organisation that runs the course (American Heart Association, Red Cross and similar).'
    },
    {
      id: 'exam',
      title: 'Pass the registration examination',
      what: 'The exam covers three areas: jurisprudence, infection control and radiology.',
      bring: ['Whatever ID and confirmation the testing provider asks for'],
      note: 'This is the exam our practice questions and drills are built around. Work the per-topic report rather than re-sitting the whole thing each time.',
      whoDecides: 'TSBDE sets the exam; the approved provider administers it.'
    },
    {
      id: 'radiology',
      title: 'Dental Assistant Radiology Certificate',
      what: 'A separate TSBDE credential. You need it to legally position or expose dental x-rays in Texas.',
      bring: ['Proof you completed the radiology requirement'],
      note: 'People assume registration covers x-rays. It is its own certificate, and taking radiographs without it is not something an office can let you do.',
      whoDecides: 'TSBDE issues the certificate.'
    },
    {
      id: 'jurisprudence',
      title: 'Texas Jurisprudence Assessment — if your course was over a year ago',
      what: 'If more than a year has passed between your course exam and your application, TSBDE asks for the Jurisprudence Assessment from its website, or a current DANB CDA card.',
      bring: ['Your jurisprudence assessment result, or your current DANB CDA card'],
      note: 'This is the step that catches people who trained, took a break, and came back to it. If you finished a while ago, check this before you apply rather than after.',
      whoDecides: 'TSBDE.'
    },
    {
      id: 'apply',
      title: 'Apply to TSBDE for registration',
      what: 'Submit the application with your supporting documents and the fee TSBDE is charging at the time.',
      bring: ['Course completion proof', 'BLS/CPR card', 'Exam results', 'Radiology certificate', 'Photo ID', 'The application fee'],
      note: 'We deliberately do not print the fee or a processing time here — both are set by TSBDE and both change. Check the current figures on their site before you budget.',
      whoDecides: 'TSBDE. This is the milestone that lets you work as an RDA in Texas.'
    },
    {
      id: 'renew',
      title: 'Keep it current',
      what: 'RDA registration renews on a two-year cycle, with continuing education required each period. Human trafficking prevention training is also required for renewal.',
      bring: ['Your CE certificates from approved providers'],
      note: 'Twelve CE hours every two years with a board-approved provider is the figure TSBDE has published. Verify the current requirement at renewal time — this is the kind of detail that changes.',
      whoDecides: 'TSBDE sets the renewal cycle and the CE requirement.'
    }
  ];

  var API = { SOURCE: SOURCE, STEPS: STEPS };

  if (typeof window !== 'undefined') window.PDA_RDA_TIMELINE = API;
  else globalThis.PDA_RDA_TIMELINE = API;
})();
