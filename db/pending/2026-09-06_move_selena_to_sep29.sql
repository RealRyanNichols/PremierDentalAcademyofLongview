-- ============================================================================
-- NOT APPLIED. APPROVAL-GATED: this touches a real student's enrollment record.
--
-- Who: Selena (enrollment 2fd402eb-baed-4fd9-ba38-967360f143b3; paid $500 down on
--      Sep 1, 2026 through the website checkout).
-- Why: she texted on Sep 1, 2026 at 3:09 PM CT that the checkout put her in the
--      September 14 class but she cannot start until September 29. She had asked
--      about the September 29 class earlier that same day.
-- Verified on Sep 6, 2026 (live DB):
--   * enrollment is still on cohort a808608c… (September 14, 2026 — In-Person (MWF))
--   * profiles.cohort for her is NULL → no second write needed (the guard below
--     re-checks so it stays correct if that changes before this runs)
--   * an open, never-worked admin task exists for her: "In-person program purchase —
--     assign a cohort" (4e60add0-2aee-428c-b1cf-3a1ddd35d6d8)
--
-- Effects:
--   * enrollments.cohort_id → 69d28988… (September 29, 2026 — In-Person (T/Th))
--   * trigger enrollments_sync_cohort_count recalculates enrolled_count on BOTH
--     cohorts automatically (Sept 14 goes down one, Sept 29 goes up one)
--   * her open "assign a cohort" task is closed as done
--   * NOTHING is emailed or texted by this SQL — her correction email is a Gmail
--     draft for Amanda to send AFTER this runs (see docs/labor-day-2026-offer.md)
--
-- Rollback: re-run with the two cohort ids swapped, and set the task back to 'open'.
-- ============================================================================

begin;

-- 1) Move the enrollment. The cohort_id guard makes this a no-op if she was
--    already moved by hand.
update public.enrollments
   set cohort_id = '69d28988-f34c-49f4-a7bf-f99333f87585'   -- September 29, 2026 — In-Person (T/Th)
 where id        = '2fd402eb-baed-4fd9-ba38-967360f143b3'   -- Selena
   and cohort_id = 'a808608c-df03-40de-822e-f587c7e64395';  -- guard: only if still on Sept 14

-- 2) Keep the redundant free-text profiles.cohort in step IF it is populated.
--    (NULL today, so this normally changes nothing. Views such as admin_gradebook.cohort
--    and class_posts.cohort key off this text.)
update public.profiles p
   set cohort = 'September 29, 2026 — In-Person (T/Th)'
  from public.enrollments e
 where e.id = '2fd402eb-baed-4fd9-ba38-967360f143b3'
   and p.id = e.student_id
   and p.cohort is not null
   and p.cohort <> 'September 29, 2026 — In-Person (T/Th)';

-- 3) Close her open "assign a cohort" task (it is now done).
update public.admin_tasks
   set status = 'done',
       notes  = coalesce(notes, '') || E'\n\nClosed ' || to_char(now() at time zone 'America/Chicago', 'YYYY-MM-DD HH24:MI') ||
                ' CT: moved to September 29, 2026 — In-Person (T/Th) at the student''s request (text of Sep 1, 2026).'
 where id = '4e60add0-2aee-428c-b1cf-3a1ddd35d6d8'
   and status = 'open';

commit;

-- Verify:
-- select e.id, c.name, c.enrolled_count from public.enrollments e join public.cohorts c on c.id = e.cohort_id
--  where e.id = '2fd402eb-baed-4fd9-ba38-967360f143b3';
-- select name, enrolled_count from public.cohorts where id in ('a808608c-df03-40de-822e-f587c7e64395','69d28988-f34c-49f4-a7bf-f99333f87585');
-- select id, status from public.admin_tasks where id = '4e60add0-2aee-428c-b1cf-3a1ddd35d6d8';

-- NOTE (separate decision, not part of this file): an identical open task exists for
-- Linsey Jaimes (eaaf5dc0-8612-45c9-b52a-c0b5710dc936). She IS on the Sept 14 class in
-- enrollments and nothing says she wants to move, so the task can simply be closed as
-- done once Amanda confirms Sept 14 is right for her:
--   update public.admin_tasks set status = 'done' where id = 'eaaf5dc0-8612-45c9-b52a-c0b5710dc936' and status = 'open';
