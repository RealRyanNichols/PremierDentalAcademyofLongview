-- Lesson attachments (Kajabi parity). APPLIED to live project 2026-07-11.
-- Each lesson can carry downloads — e.g. the Modern Dental Assisting 14th-edition
-- chapter PDF that each Kajabi chapter lesson includes.
-- Format: [{"path":"kajabi-export/in-person/week07/mda14-ch44.pdf",
--           "label":"Read Chapter 44 — Modern Dental Assisting (14th ed.)"}]
-- Files live in the PRIVATE course-assets bucket (admin-write / authenticated-read);
-- the /learn player mints 1-hour signed URLs for signed-in students. The book must
-- never be placed in a public bucket or the repo. Additive + idempotent.
alter table public.course_lessons
  add column if not exists attachments jsonb not null default '[]'::jsonb;
