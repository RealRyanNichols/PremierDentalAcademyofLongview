-- APPLIED 2026-09-07 (Labor Day final gate, item 7: "every $100 sale fires a false
-- priority-1 'assign a cohort' alert even when the cohort was assigned correctly").
--
-- Why: square-webhook v6 creates the enrollment WITH the cohort (from the Square
-- customer note) and THEN records the purchase. The purchases trigger
-- auto_enroll_on_purchase never looked at that enrollment, so every in-person sale
-- opened an "In-person program purchase — assign a cohort" task, burying real ones.
--
-- Change: for an in-person sale where the student already has a live enrollment with
-- a cohort, link the purchase to the student and stop. Everything else is unchanged:
-- online auto-enroll, "no matching student account", and the real "assign a cohort"
-- case (student found, no cohort yet) still open a task.
--
-- Rollback: re-create the function without the "already has a cohort" block
-- (previous body is the same minus that block).

create or replace function public.auto_enroll_on_purchase()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  target uuid;
  is_online boolean;
  is_program boolean;
  buyer_name text;
begin
  -- Only act on completed program purchases
  if coalesce(new.status,'') not in ('completed','active') then
    return new;
  end if;

  is_online  := (new.product_key = 'online_program')
                or (coalesce(new.product_label,'') ilike '%online%' and coalesce(new.product_label,'') ilike '%program%');
  is_program := is_online
                or (new.product_key in ('rdaWeekly','in_person_program'))
                or (coalesce(new.product_label,'') ilike '%RDA Program%');

  if not is_program then
    return new;   -- study packs, exam prep, etc. don't enroll anyone
  end if;

  -- Who is the student? Prefer the linked account, else match the buyer email.
  target := new.student_id;
  if target is null and coalesce(new.contact_email,'') <> '' then
    select p.id into target from public.profiles p
     where lower(p.email) = lower(new.contact_email) limit 1;
  end if;

  -- ONLINE: self-paced, no cohort to choose, so enroll automatically.
  if is_online and target is not null then
    update public.profiles set
      program = case when coalesce(program,'preview') = 'preview' then 'career_track' else program end,
      cohort  = coalesce(nullif(cohort,''), 'Online — Self-Paced'),
      portal_status = 'active',
      enrolled_at   = coalesce(enrolled_at, now()),
      updated_at    = now()
    where id = target;

    select trim(coalesce(first_name,'')||' '||coalesce(last_name,'')) into buyer_name
      from public.profiles where id = target;

    if not exists (select 1 from public.enrollments where student_id = target) then
      insert into public.enrollments
        (student_id, cohort_id, enrolled_at, status, delivery, source, student_name)
      values (target, null, now(), 'active', 'online', 'auto_purchase',
              nullif(buyer_name,''));
    end if;

    if new.student_id is null then
      update public.purchases set student_id = target where id = new.id;
    end if;
    return new;
  end if;

  -- IN-PERSON, cohort already assigned (the checkout webhook enrolls the student in
  -- the class from the Square customer note before it records the purchase): nothing
  -- for a human to do, so link the purchase and stop. No task.
  if target is not null and exists (
      select 1 from public.enrollments e
       where e.student_id = target
         and e.cohort_id is not null
         and coalesce(e.status,'') not in ('cancelled','canceled','dropped','refunded')) then
    if new.student_id is null then
      update public.purchases set student_id = target where id = new.id;
    end if;
    return new;
  end if;

  -- Couldn't identify the student, or it's an in-person sale that needs a cohort choice.
  insert into public.admin_tasks (title, notes, priority, status)
  values (
    case when target is null
         then 'Program purchase with no matching student account'
         else 'In-person program purchase — assign a cohort' end,
    'Product: ' || coalesce(new.product_label, new.product_key, '?') ||
    E'\nAmount: $' || to_char(coalesce(new.amount_cents,0)/100.0,'FM999999990.00') ||
    E'\nBuyer email: ' || coalesce(new.contact_email,'(none)') ||
    E'\nPurchase id: ' || new.id::text ||
    case when target is null
         then E'\n\nNo portal account matches this email — create the student, then enroll.'
         else E'\n\nStudent found, but an in-person sale needs a cohort assigned in Admin → Students.' end,
    1, 'open');

  return new;
end;
$function$;
