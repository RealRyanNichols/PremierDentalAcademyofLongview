-- Applied 2026-09-05 (Amanda-approved go-live).
-- Teachers (profiles.is_instructor) can read the student activity that admins can read,
-- answer student questions, and resolve quiz alerts. Additive policies; existing ones untouched.
create policy student_questions_instructor_read on public.student_questions
  for select to authenticated using (is_pda_instructor());
create policy student_questions_instructor_answer on public.student_questions
  for update to authenticated using (is_pda_instructor()) with check (is_pda_instructor());
create policy pea_instructor_read on public.practice_exam_attempts
  for select to authenticated using (is_pda_instructor());
create policy pp_practice_log_instructor_read on public.pp_practice_log
  for select to authenticated using (is_pda_instructor());
create policy lesson_reports_instructor_read on public.lesson_reports
  for select to authenticated using (is_pda_instructor());
create policy student_feedback_instructor_read on public.student_feedback
  for select to authenticated using (is_pda_instructor());
create policy admin_alerts_instructor_read on public.admin_alerts
  for select to authenticated using (is_pda_instructor());
create policy admin_alerts_instructor_resolve on public.admin_alerts
  for update to authenticated using (is_pda_instructor()) with check (is_pda_instructor());

-- Skills Lab: staff can read every student's progress row, and instructor sign-off lives in a
-- separate `verified` column that only staff can change (students keep owning the rest).
alter table public.skills_lab_progress add column if not exists verified jsonb not null default '{}'::jsonb;
create policy skills_lab_staff_read on public.skills_lab_progress
  for select to authenticated using (is_pda_admin() or is_pda_instructor());

create or replace function public.guard_skills_verified()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not (is_pda_admin() or is_pda_instructor()) then
    if tg_op = 'INSERT' then new.verified := '{}'::jsonb;
    elsif new.verified is distinct from old.verified then new.verified := old.verified;
    end if;
  end if;
  return new;
end $$;
drop trigger if exists trg_guard_skills_verified on public.skills_lab_progress;
create trigger trg_guard_skills_verified
  before insert or update on public.skills_lab_progress
  for each row execute function public.guard_skills_verified();

create or replace function public.verify_skill(p_student uuid, p_skill text, p_verified boolean, p_note text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_name text; v_out jsonb;
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and (coalesce(is_admin, false) or coalesce(is_instructor, false))) then
    raise exception 'not authorized';
  end if;
  if p_skill is null or length(p_skill) = 0 or length(p_skill) > 80 then raise exception 'bad skill id'; end if;
  select coalesce(nullif(trim(coalesce(first_name, '') || ' ' || coalesce(last_name, '')), ''), email)
    into v_name from public.profiles where id = auth.uid();
  insert into public.skills_lab_progress (student_id) values (p_student) on conflict (student_id) do nothing;
  if p_verified then
    update public.skills_lab_progress
       set verified = coalesce(verified, '{}'::jsonb) || jsonb_build_object(p_skill, jsonb_build_object('by', auth.uid(), 'by_name', v_name, 'at', now(), 'note', left(p_note, 500))),
           updated_at = now()
     where student_id = p_student
     returning verified into v_out;
  else
    update public.skills_lab_progress
       set verified = coalesce(verified, '{}'::jsonb) - p_skill, updated_at = now()
     where student_id = p_student
     returning verified into v_out;
  end if;
  return coalesce(v_out, '{}'::jsonb);
end $$;
revoke all on function public.verify_skill(uuid, text, boolean, text) from public;
grant execute on function public.verify_skill(uuid, text, boolean, text) to authenticated;

-- Rollback: drop the eight policies above by name; drop trigger trg_guard_skills_verified;
--           drop function guard_skills_verified(), verify_skill(uuid,text,boolean,text);
--           alter table public.skills_lab_progress drop column verified;
