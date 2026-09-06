-- ============================================================================
-- APPLIED 2026-09-06 (Ryan: "push it all and make it go live"). Oct 5 was inserted with the
-- neutral schedule string 'Call or text (903) 913-6444 for current class days & times'
-- (the Jul 6, 2026 pattern) until Amanda confirms the MWF block; Oct 20 got the approved
-- Tue/Thu string. Update Oct 5 with:
--   update public.cohorts set schedule = 'Mon/Wed/Fri 8:30 AM – 12:30 PM' where start_date = '2026-10-05';
--
-- Adds the two October 2026 in-person cohorts Amanda named on Sep 6, 2026.
--   * Oct 5, 2026 is a MONDAY  → MWF track
--   * Oct 20, 2026 is a TUESDAY → T/Th track
-- Matches the existing alternating pattern (Sep 14 MWF / Sep 29 T/Th / Nov 9 MWF /
-- Nov 17 T/Th).
--
-- Conventions that MUST be preserved (verified against the live rows on Sep 6):
--   * name separator is an EM DASH  "—"  (U+2014):  'October 5, 2026 — In-Person (MWF)'
--   * schedule separator is an EN DASH "–" (U+2013): 'Tue/Thu 9:00 AM – 3:00 PM'
--   The square-webhook edge function assigns a buyer's cohort by EXACT string match on
--   cohorts.name, so a plain hyphen silently breaks cohort assignment for every buyer.
--   * capacity is 8 on every cohort (the column default is 12 — set it explicitly)
--   * end_date stays NULL (every future cohort leaves it NULL)
--   * instructor is 'Amanda Williams' — never another name
--   * location uses the column default (2800 Gilmer Rd, Suite 106, Longview, TX)
--
-- OPEN ITEM — the MWF time block is genuinely unknown. The MWF track has used two
-- different blocks in 2026 ('Mon/Wed/Fri 6:00 – 9:00pm + Sat 9:00am – 1:00pm' before
-- August, 'Mon/Wed/Fri 8:30 AM – 12:30 PM' since). The ONLY Amanda-approved daytime
-- strings (Sep 4, 2026) are:
--     Mon/Wed/Fri cohorts: 8:30 AM – 12:30 PM
--     Tue/Thu cohorts:     9:00 AM – 3:00 PM
-- The placeholder below deliberately fails (it is not a schedule string) until Amanda
-- confirms the October 5 block. Do NOT guess. Evening/night/Saturday times are never
-- allowed.
--
-- Rollback (safe only before anyone enrolls in them):
--   delete from public.cohorts where start_date in ('2026-10-05','2026-10-20');
-- ============================================================================

insert into public.cohorts
  (name, delivery_mode, start_date, capacity, status, program, schedule, instructor)
values
  ('October 5, 2026 — In-Person (MWF)',  'in_person', '2026-10-05', 8, 'upcoming', 'foundation',
   'Call or text (903) 913-6444 for current class days & times'  -- placeholder until Amanda confirms, 'Amanda Williams'),
  ('October 20, 2026 — In-Person (T/Th)', 'in_person', '2026-10-20', 8, 'upcoming', 'foundation',
   'Tue/Thu 9:00 AM – 3:00 PM', 'Amanda Williams');

-- Verify (both rows should appear with capacity 8, status upcoming, end_date NULL):
-- select name, start_date, capacity, status, schedule, instructor, end_date
--   from public.cohorts where start_date >= '2026-10-01' order by start_date;


-- ============================================================================
-- REUSABLE SNIPPET — adding any future in-person class
-- Amanda said she may give more dates. Copy ONE of the two blocks, change only the
-- date (and the name that repeats it), keep everything else byte-for-byte.
--
-- Naming rule:  '<Month> <day>, <year> — In-Person (MWF)'   for a Monday start
--               '<Month> <day>, <year> — In-Person (T/Th)'  for a Tuesday start
-- (em dash between the date and "In-Person"; the day-of-week must match the track.)
-- ============================================================================

-- MWF track (start date must be a Monday):
-- insert into public.cohorts (name, delivery_mode, start_date, capacity, status, program, schedule, instructor)
-- values ('December 7, 2026 — In-Person (MWF)', 'in_person', '2026-12-07', 8, 'upcoming', 'foundation',
--         'Mon/Wed/Fri 8:30 AM – 12:30 PM', 'Amanda Williams');

-- T/Th track (start date must be a Tuesday):
-- insert into public.cohorts (name, delivery_mode, start_date, capacity, status, program, schedule, instructor)
-- values ('December 15, 2026 — In-Person (T/Th)', 'in_person', '2026-12-15', 8, 'upcoming', 'foundation',
--         'Tue/Thu 9:00 AM – 3:00 PM', 'Amanda Williams');

-- Guard against a wrong weekday before inserting (returns the day name for a date):
-- select to_char(date '2026-12-07', 'Day');
