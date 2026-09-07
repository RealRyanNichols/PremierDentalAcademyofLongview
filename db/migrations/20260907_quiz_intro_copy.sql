-- APPLIED 2026-09-07 (course content pass, Amanda: "go through all the courses, update content").
--
-- Why: 40 live "Chapter N Quiz" lessons (39 in rda-program, 1 in online-rda-12-week)
-- carried a stale yellow notice saying the quiz "is being moved over from our previous
-- system and will be live here shortly" while the graded Knowledge Check was in fact
-- live directly underneath it. Students read "not live yet" and stopped. This replaces
-- the notice with a real one-paragraph intro built from the chapter title, the question
-- count and the pass mark, in the same style as the Chapter 2 quiz intro.
--
-- Only rows still carrying the old notice AND holding a real quiz_json are touched.
-- Rollback: set content_html back to the notice below on the same rows (do not; it was wrong).
--   '<div class="lesson-body"><div class="notice" style="background:#fffbeb;border:1px solid #fcd34d;border-radius:12px;padding:16px 20px;margin:16px 0;"><strong>Quiz:</strong> This knowledge check is being moved over from our previous system and will be live here shortly. Your instructor has the current version.</div></div>'

with topic as (
  select l.id,
         substring(l.title from 'Chapter (\d+)') as chap,
         m.course_id
    from public.course_lessons l
    join public.course_modules m on m.id = l.module_id
   where l.lesson_type = 'quiz'
     and l.content_html like '%being moved over from our previous system%'
     and l.quiz_json is not null and jsonb_array_length(l.quiz_json) > 0
), src as (
  select t.id,
         (select regexp_replace(s.title, '^Chapter \d+:\s*', '')
            from public.course_lessons s
            join public.course_modules sm on sm.id = s.module_id
           where sm.course_id = t.course_id
             and s.lesson_type <> 'quiz'
             and s.title ~ ('^Chapter ' || t.chap || ':')
           order by s.active desc, s.sort limit 1) as topic
    from topic t
)
update public.course_lessons q
   set content_html = '<div class="pda-lesson"><p><strong>' || q.title || '.</strong> '
        || jsonb_array_length(q.quiz_json) || ' questions'
        || case when s.topic is not null then ' on ' || s.topic else '' end
        || '. You get one attempt and need ' || coalesce(q.quiz_pass_pct, 80) || '% to pass, so re-read the lesson first if you want a refresher. Your score counts toward your weekly progress.</p></div>'
  from src s
 where s.id = q.id;
