-- Public course-catalog view (APPLIED to the live project 2026-07-10).
-- Powers the /courses public curriculum preview: logged-out visitors can browse every
-- course/module/lesson TITLE, overview, type, and video duration — but by construction
-- the view exposes NO content_html, video_url, mux ids, quiz_json, or tool links, and
-- only active courses/lessons. Verified: role anon reads the view but 0 rows of the
-- underlying tables (their RLS is untouched).

create or replace view public.course_catalog as
select
  c.slug          as course_slug,
  c.title         as course_title,
  c.description   as course_description,
  c.entitlement_flag,
  c.cert_enabled,
  c.sort          as course_sort,
  m.module_number,
  m.title         as module_title,
  m.subtitle      as module_subtitle,
  m.sort          as module_sort,
  l.lesson_number,
  l.title         as lesson_title,
  l.overview      as lesson_overview,
  l.lesson_type,
  l.duration_seconds,
  (l.video_url is not null or l.mux_playback_id is not null) as has_video,
  (l.quiz_json is not null)                                   as has_quiz,
  l.sort          as lesson_sort
from public.courses c
join public.course_modules m on m.course_id = c.id
left join public.course_lessons l on l.module_id = m.id and l.active
where c.active;

grant select on public.course_catalog to anon, authenticated;
