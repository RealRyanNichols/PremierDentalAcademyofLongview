-- Hide internal/test accounts from the teacher gradebook.
--
-- The only test account is on the school's own domain
-- (test@premierdentalacademyoflongview.com); real preview users sign up with
-- personal emails (gmail/yahoo/icloud) and must keep showing. This replaces
-- admin_student_progress() with an added WHERE filter that drops any account on
-- the @premierdentalacademyoflongview.com domain or literally named "Test".
-- Function body is otherwise identical to 20260608_admin_student_progress.sql.
create or replace function public.admin_student_progress()
returns table (
  id uuid, first_name text, last_name text, email text, phone text,
  program text, cohort text, enrolled_at timestamptz, created_at timestamptz,
  last_sign_in_at timestamptz, total_actions bigint, last_active_at timestamptz,
  active_days bigint, module_flags jsonb, best_exam_pct int, last_exam_pct int,
  exam_attempts bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and is_admin = true) then
    raise exception 'not authorized';
  end if;

  return query
  with act as (
    select
      l.student_id,
      count(*)                                                               as total_actions,
      max(l.created_at)                                                      as last_active_at,
      count(distinct ((l.created_at at time zone 'America/Chicago')::date))  as active_days,
      jsonb_build_object(
        'Patient check-in', coalesce(bool_or(l.action ~* 'patient|created|edit_demographics'), false),
        'Medical history',  coalesce(bool_or(l.action ~* 'medical|allergy|vitals'), false),
        'Tooth chart',      coalesce(bool_or(l.action ~* 'chart|tooth|surface'), false),
        'Perio',            coalesce(bool_or(l.action ~* 'perio'), false),
        'Imaging',          coalesce(bool_or(l.action ~* 'imaging|fmx'), false),
        'Treatment plan',   coalesce(bool_or(l.action ~* 'tx_|treatment'), false),
        'Insurance/claims', coalesce(bool_or(l.action ~* 'claim|eob'), false),
        'Ledger',           coalesce(bool_or(l.action ~* 'procedure|payment|posted|walkout'), false),
        'Communication',    coalesce(bool_or(l.action ~* 'text|call|email|comm_logged'), false),
        'Schedule',         coalesce(bool_or(l.action ~* 'appt|sched'), false),
        'Documentation',    coalesce(bool_or(l.action ~* 'smartdoc|form_sign|note'), false),
        'Analytics',        coalesce(bool_or(l.action ~* 'report'), false)
      ) as module_flags
    from public.pp_practice_log l
    group by l.student_id
  ),
  exams as (
    select e.student_id, max(e.score_pct) as best_exam_pct,
      (array_agg(e.score_pct order by e.created_at desc))[1] as last_exam_pct,
      count(*) as exam_attempts
    from public.practice_exam_attempts e group by e.student_id
  )
  select
    p.id, p.first_name, p.last_name, p.email, p.phone, p.program, p.cohort,
    p.enrolled_at, p.created_at, u.last_sign_in_at,
    coalesce(a.total_actions, 0), a.last_active_at, coalesce(a.active_days, 0),
    coalesce(a.module_flags, '{}'::jsonb), ex.best_exam_pct, ex.last_exam_pct,
    coalesce(ex.exam_attempts, 0)
  from public.profiles p
  left join auth.users u  on u.id = p.id
  left join act a         on a.student_id = p.id
  left join exams ex      on ex.student_id = p.id
  where coalesce(p.is_admin, false) = false
    and coalesce(lower(p.email), '') not like '%@premierdentalacademyoflongview.com'
    and coalesce(lower(p.first_name), '') <> 'test'
    and coalesce(lower(p.last_name), '')  <> 'test'
  order by (a.last_active_at is null), a.last_active_at desc nulls last, p.created_at desc;
end;
$$;

revoke execute on function public.admin_student_progress() from public;
revoke execute on function public.admin_student_progress() from anon;
grant  execute on function public.admin_student_progress() to authenticated;
