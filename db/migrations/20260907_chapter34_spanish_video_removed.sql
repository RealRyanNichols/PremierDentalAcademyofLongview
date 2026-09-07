-- APPLIED 2026-09-07 ~12:10 AM CT (Amanda: "everything needs to be in English").
--
-- Why: student Destiny R. texted on 2026-09-04 that "chapter 5 lesson 5 the video is
-- in Spanish." Online course Week 5 · Lesson 5 is "Chapter 34: Dental Hand
-- Instruments", whose YouTube video (wH3Riu-GZ8Q) is in Spanish. The in-person
-- course (rda-program, Week 4 · Lesson 5) used the same video. Both lessons keep
-- their full English text, practice questions, the instrument-ID widget and the
-- ChairSide tool link; only the video was removed.
--
-- A replacement ENGLISH video is an owner/Cowork pick (see docs/course-video-audit.md).
-- To set it:  update public.course_lessons set video_url = '<english url>'
--             where id in ('1a320195-8484-4142-8686-21ff31e9372f','5ff77185-41a7-4d85-961e-0002a4c75c7b');
-- Rollback (restores the Spanish video — do not): set video_url back to
--   'https://www.youtube.com/watch?v=wH3Riu-GZ8Q' on the same two ids.

update public.course_lessons
   set video_url = null
 where id in ('1a320195-8484-4142-8686-21ff31e9372f',  -- online-rda-12-week · Week 5 · L5
              '5ff77185-41a7-4d85-961e-0002a4c75c7b')  -- rda-program · Week 4 · L5
   and video_url = 'https://www.youtube.com/watch?v=wH3Riu-GZ8Q';
