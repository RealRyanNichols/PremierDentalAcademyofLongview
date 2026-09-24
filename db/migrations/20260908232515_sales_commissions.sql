-- RECOVERED FROM LIVE on 2026-09-24. Applied 2026-09-08 23:25 UTC, but the file was never committed.
-- Source: supabase_migrations.schema_migrations version 20260908232515 ("sales_commissions").
-- ALREADY APPLIED — never run it again. It is here so the repo shows what the database holds.
-- Commission amounts ($100 in-person / $50 online) are owner-set values recorded in commission_rates.
-- Everything below the marker line is byte-identical to the stored statement
-- (md5 c56de050c943650018a32bac49ad1583); scripts/check-migrations.mjs verifies that on every npm test.
-- ---- recovered statement below ----
-- Sales commissions: $100 per in-person enrollment, $50 per online enrollment,
-- credited to the rep who owned the lead. Earned when real money lands.

create table if not exists public.commission_rates (
  id             uuid primary key default gen_random_uuid(),
  program_type   text not null check (program_type in ('in_person','online')),
  amount_cents   integer not null check (amount_cents >= 0),
  effective_from timestamptz not null default now(),
  effective_to   timestamptz,
  note           text,
  created_by     uuid references public.profiles(id),
  created_at     timestamptz not null default now()
);

insert into public.commission_rates (program_type, amount_cents, note)
select v.t, v.c, 'Set by Amanda, September 8 2026'
from (values ('in_person',10000),('online',5000)) as v(t,c)
where not exists (select 1 from public.commission_rates r
                  where r.program_type = v.t and r.effective_to is null);

create table if not exists public.commissions (
  id                       uuid primary key default gen_random_uuid(),
  rep_id                   uuid not null references public.profiles(id) on delete restrict,
  student_id               uuid references public.profiles(id) on delete set null,
  lead_id                  uuid references public.leads(id) on delete set null,
  enrollment_id            uuid references public.enrollments(id) on delete set null,
  purchase_id              uuid references public.purchases(id) on delete set null,
  program_type             text not null check (program_type in ('in_person','online')),
  amount_cents             integer not null check (amount_cents >= 0),
  rate_id                  uuid references public.commission_rates(id),
  status                   text not null default 'pending'
                             check (status in ('pending','earned','paid','void')),
  student_name             text,
  qualifying_payment_cents integer,
  earned_at                timestamptz,
  paid_at                  timestamptz,
  paid_note                text,
  voided_reason            text,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

comment on table public.commissions is
  'One row per sale credited to a rep. pending = enrolled, no money yet. earned = qualifying payment received. paid = Amanda has paid it out.';

create unique index if not exists commissions_one_per_sale
  on public.commissions(student_id, program_type)
  where status <> 'void' and student_id is not null;
create unique index if not exists commissions_purchase_uniq
  on public.commissions(purchase_id) where purchase_id is not null;
create index if not exists commissions_rep_idx on public.commissions(rep_id, status);

-- Which rep, if any, owns the lead behind this person.
create or replace function public.pda_rep_for_contact(p_email text, p_phone text)
returns table(rep_id uuid, lead_id uuid)
language sql stable security definer set search_path = public as $$
  select l.owner_id, l.id
    from public.leads l
   where l.owner_id is not null
     and ( (p_email is not null and l.email is not null
            and lower(l.email) = lower(p_email))
        or (p_phone is not null
            and length(regexp_replace(p_phone,'\D','','g')) >= 10
            and right(regexp_replace(coalesce(l.phone,''),'\D','','g'),10)
              = right(regexp_replace(p_phone,'\D','','g'),10)) )
   order by l.claimed_at desc nulls last, l.created_at desc
   limit 1;
$$;

create or replace function public.pda_current_rate(p_type text)
returns public.commission_rates language sql stable security definer set search_path = public as $$
  select * from public.commission_rates
   where program_type = p_type
     and effective_from <= now()
     and (effective_to is null or effective_to > now())
   order by effective_from desc limit 1;
$$;

-- Enrollment created -> pending commission (visible to the rep, not yet earned).
create or replace function public.pda_commission_from_enrollment()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_type text; v_rep uuid; v_lead uuid; v_rate public.commission_rates;
        v_email text; v_phone text; v_name text;
begin
  v_type := case new.delivery when 'online' then 'online'
                              when 'in_person' then 'in_person' else null end;
  if v_type is null or coalesce(new.status,'active') <> 'active' then return new; end if;

  select p.email, p.phone,
         nullif(trim(coalesce(p.first_name,'') || ' ' || coalesce(p.last_name,'')),'')
    into v_email, v_phone, v_name
    from public.profiles p where p.id = new.student_id;

  select r.rep_id, r.lead_id into v_rep, v_lead
    from public.pda_rep_for_contact(v_email, v_phone) r;
  if v_rep is null then return new; end if;      -- house lead, no commission

  v_rate := public.pda_current_rate(v_type);
  if v_rate.id is null then return new; end if;

  insert into public.commissions
    (rep_id, student_id, lead_id, enrollment_id, program_type,
     amount_cents, rate_id, status, student_name)
  values
    (v_rep, new.student_id, v_lead, new.id, v_type,
     v_rate.amount_cents, v_rate.id, 'pending',
     coalesce(v_name, new.student_name))
  on conflict do nothing;

  return new;
end $$;

-- Money lands -> the commission is earned.
create or replace function public.pda_commission_from_purchase()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_type text; v_rep uuid; v_lead uuid; v_rate public.commission_rates;
        v_email text; v_phone text; v_name text; v_hit integer;
begin
  v_type := case
    when new.product_key in ('in_person_program','rdaWeekly') then 'in_person'
    when new.product_key = 'online_program'                   then 'online'
    else null end;
  if v_type is null then return new; end if;
  if coalesce(new.status,'') not in ('completed','active','paid') then return new; end if;
  if coalesce(new.amount_cents,0) <= 0 then return new; end if;   -- real money only

  v_rate := public.pda_current_rate(v_type);
  if v_rate.id is null then return new; end if;

  -- Upgrade an existing pending credit for this student + program.
  update public.commissions c
     set status = 'earned', earned_at = now(),
         purchase_id = coalesce(c.purchase_id, new.id),
         qualifying_payment_cents = coalesce(c.qualifying_payment_cents, new.amount_cents),
         updated_at = now()
   where c.student_id = new.student_id
     and c.program_type = v_type
     and c.status = 'pending';
  get diagnostics v_hit = row_count;
  if v_hit > 0 then return new; end if;

  -- No pending row (payment arrived before/without an enrollment record).
  select p.email, p.phone,
         nullif(trim(coalesce(p.first_name,'') || ' ' || coalesce(p.last_name,'')),'')
    into v_email, v_phone, v_name
    from public.profiles p where p.id = new.student_id;
  v_email := coalesce(v_email, new.contact_email);

  select r.rep_id, r.lead_id into v_rep, v_lead
    from public.pda_rep_for_contact(v_email, v_phone) r;
  if v_rep is null then return new; end if;

  insert into public.commissions
    (rep_id, student_id, lead_id, purchase_id, program_type, amount_cents,
     rate_id, status, student_name, qualifying_payment_cents, earned_at)
  values
    (v_rep, new.student_id, v_lead, new.id, v_type, v_rate.amount_cents,
     v_rate.id, 'earned', v_name, new.amount_cents, now())
  on conflict do nothing;

  return new;
end $$;

drop trigger if exists trg_commission_from_enrollment on public.enrollments;
create trigger trg_commission_from_enrollment
  after insert or update of status, delivery on public.enrollments
  for each row execute function public.pda_commission_from_enrollment();

drop trigger if exists trg_commission_from_purchase on public.purchases;
create trigger trg_commission_from_purchase
  after insert or update of status, amount_cents on public.purchases
  for each row execute function public.pda_commission_from_purchase();

-- Permissions: a rep sees only their own money. Amanda sees and controls everything.
alter table public.commissions      enable row level security;
alter table public.commission_rates enable row level security;

drop policy if exists commissions_read      on public.commissions;
drop policy if exists commissions_owner_all on public.commissions;
create policy commissions_read on public.commissions
  for select to authenticated
  using (public.is_pda_owner() or rep_id = auth.uid());
create policy commissions_owner_all on public.commissions
  for all to authenticated
  using (public.is_pda_owner()) with check (public.is_pda_owner());

drop policy if exists rates_read      on public.commission_rates;
drop policy if exists rates_owner_all on public.commission_rates;
create policy rates_read on public.commission_rates
  for select to authenticated
  using (public.is_pda_admin() or public.is_pda_owner());
create policy rates_owner_all on public.commission_rates
  for all to authenticated
  using (public.is_pda_owner()) with check (public.is_pda_owner());

grant select on public.commissions, public.commission_rates to authenticated;
grant insert, update, delete on public.commissions, public.commission_rates to authenticated;
