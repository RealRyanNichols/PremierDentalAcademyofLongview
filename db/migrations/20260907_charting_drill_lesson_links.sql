-- APPLIED 2026-09-07 (Amanda: "there needs to be charting exercises ... put where things should be").
--
-- Points the five charting chapters, in BOTH the in-person and online courses, at the
-- new /tools/charting-drills levels. The lesson's "Open the trainer" card in /learn uses
-- tool_url + tool_label. Each link carries a return path so the drill's result screen
-- sends the student straight back to the lesson.
--
-- Rollback (previous values):
--   Chapter 11  https://www.premierdentalacademyoflongview.com/tools/how-to-chart  'Practice tooth numbering'
--   Chapter 12  https://www.premierdentalacademyoflongview.com/tools/how-to-chart  'Practice charting tooth surfaces'
--   Chapter 28  https://www.premierdentalacademyoflongview.com/tools/practice-pro  'Build a treatment plan in Practice Pro'
--   Chapter 48  https://www.premierdentalacademyoflongview.com/tools/practice-pro  'Run a full visit in Practice Pro'
--   Chapter 50  https://www.premierdentalacademyoflongview.com/tools/practice-pro  'Chart a crown prep in Practice Pro'

with target as (
  select l.id, c.slug, m.module_number, l.lesson_number,
         case
           when l.title ~ '^Chapter 11:' then 1
           when l.title ~ '^Chapter 12:' then 2
           when l.title ~ '^Chapter 48:' then 3
           when l.title ~ '^Chapter 28:' then 4
           when l.title ~ '^Chapter 50:' then 5
         end as level
    from public.course_lessons l
    join public.course_modules m on m.id = l.module_id
    join public.courses c on c.id = m.course_id
   where c.slug in ('rda-program', 'online-rda-12-week')
     and l.title ~ '^Chapter (11|12|28|48|50):'
)
update public.course_lessons q
   set tool_url = '/tools/charting-drills?level=' || t.level
                  || '&return=' || replace(replace(replace('/learn?c=' || t.slug || '&m=' || t.module_number || '&l=' || t.lesson_number, '/', '%2F'), '?', '%3F'), '&', '%26'),
       tool_label = case t.level
         when 1 then 'Charting drill: find the tooth (Level 1)'
         when 2 then 'Charting drill: name the surface (Level 2)'
         when 3 then 'Charting drill: chart existing work in blue (Level 3)'
         when 4 then 'Charting drill: chart the treatment plan in red (Level 4)'
         when 5 then 'Charting drill: full-mouth dictation (Level 5)'
       end
  from target t
 where t.id = q.id and t.level is not null;
