-- RECOVERED FROM LIVE on 2026-09-24. Applied 2026-09-08 23:24 UTC, but the file was never committed.
-- Source: supabase_migrations.schema_migrations version 20260908232441 ("lead_ownership_claim_and_release").
-- ALREADY APPLIED — never run it again. It is here so the repo shows what the database holds.
-- Partly superseded: 20260922_revoke_anon_crm_rpcs.sql later revoked EXECUTE from PUBLIC/anon on these functions and fixed release_lead's NULL-owner fall-through. The hourly pda-release-stale-leads job that calls release_stale_leads(48) is not in this file (see 20260922000000_reconstructed_live_objects_without_migration.sql).
-- Everything below the marker line is byte-identical to the stored statement
-- (md5 3c8e8c644de7a06d021a82ba833dd76f); scripts/check-migrations.mjs verifies that on every npm test.
-- ---- recovered statement below ----
-- Lead ownership: one rep owns a lead at a time so nobody gets double-texted.
-- A claim goes stale 48h after the last logged contact and returns to the open pool.

alter table public.leads
  add column if not exists owner_id       uuid references public.profiles(id) on delete set null,
  add column if not exists claimed_at     timestamptz,
  add column if not exists released_at    timestamptz,
  add column if not exists release_reason text;

create index if not exists leads_owner_idx on public.leads(owner_id) where owner_id is not null;

comment on column public.leads.owner_id is
  'Rep currently working this lead. Null = open, anyone may claim it.';

-- The claim clock restarts every time contact is logged.
create or replace function public.pda_lead_clock(p_claimed timestamptz, p_contact timestamptz)
returns timestamptz language sql immutable as $$
  select greatest(p_claimed, coalesce(p_contact, p_claimed));
$$;

-- Auto-release. Enrolled leads keep their owner so commission attribution survives.
create or replace function public.release_stale_leads(p_hours integer default 48)
returns integer language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  with released as (
    update public.leads
       set owner_id       = null,
           claimed_at     = null,
           released_at    = now(),
           release_reason = 'auto: no contact logged within ' || p_hours || ' hours'
     where owner_id is not null
       and coalesce(pipeline_stage,'new') <> 'enrolled'
       and public.pda_lead_clock(claimed_at, last_contact_at)
             < now() - make_interval(hours => p_hours)
    returning 1
  ) select count(*) into n from released;
  return coalesce(n,0);
end $$;

-- Claim a lead. Releases stale claims first so the pool is honest at claim time.
create or replace function public.claim_lead(p_lead uuid)
returns table(ok boolean, message text, owner_id uuid)
language plpgsql security definer set search_path = public as $$
declare v_owner uuid; v_name text; v_me uuid := auth.uid();
begin
  if not (public.is_pda_admin() or public.is_pda_owner()) then
    return query select false, 'Not allowed.', null::uuid; return;
  end if;
  perform public.release_stale_leads(48);

  select l.owner_id into v_owner from public.leads l where l.id = p_lead for update;
  if not found then
    return query select false, 'That lead no longer exists.', null::uuid; return;
  end if;

  if v_owner is not null and v_owner <> v_me then
    select trim(coalesce(p.first_name,'') || ' ' || coalesce(p.last_name,''))
      into v_name from public.profiles p where p.id = v_owner;
    return query select false,
      'Already being worked by ' || coalesce(nullif(v_name,''),'another rep') || '.', v_owner;
    return;
  end if;

  update public.leads
     set owner_id = v_me,
         claimed_at = coalesce(claimed_at, now()),
         released_at = null,
         release_reason = null
   where id = p_lead;

  return query select true, 'Lead is yours. Log a call or text within 48 hours to keep it.', v_me;
end $$;

-- Give a lead back to the pool. The rep who holds it, or Amanda, may do this.
create or replace function public.release_lead(p_lead uuid, p_reason text default null)
returns table(ok boolean, message text)
language plpgsql security definer set search_path = public as $$
declare v_owner uuid; v_me uuid := auth.uid();
begin
  select l.owner_id into v_owner from public.leads l where l.id = p_lead for update;
  if not found then return query select false, 'That lead no longer exists.'; return; end if;
  if not (public.is_pda_owner() or v_owner = v_me) then
    return query select false, 'That lead is not yours to release.'; return;
  end if;
  update public.leads
     set owner_id = null, claimed_at = null, released_at = now(),
         release_reason = coalesce(p_reason, 'released by rep')
   where id = p_lead;
  return query select true, 'Lead is back in the open pool.';
end $$;

-- Amanda only: hand a lead to a specific rep.
create or replace function public.assign_lead(p_lead uuid, p_rep uuid)
returns table(ok boolean, message text)
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_pda_owner() then
    return query select false, 'Only the owner can reassign a lead.'; return;
  end if;
  if p_rep is not null and not exists (
      select 1 from public.profiles where id = p_rep and coalesce(is_admin,false)) then
    return query select false, 'That person is not an admin.'; return;
  end if;
  update public.leads
     set owner_id = p_rep,
         claimed_at = case when p_rep is null then null else now() end,
         released_at = case when p_rep is null then now() else null end,
         release_reason = case when p_rep is null then 'reassigned to open pool by owner' else null end
   where id = p_lead;
  return query select true, case when p_rep is null then 'Lead returned to the pool.' else 'Lead assigned.' end;
end $$;

-- Log a call/text/email against a lead. Resets the 48-hour clock and writes the
-- shared contact history so two reps never repeat the same conversation.
create or replace function public.log_lead_contact(
  p_lead uuid, p_channel text, p_note text default null, p_direction text default 'outbound')
returns table(ok boolean, message text)
language plpgsql security definer set search_path = public as $$
declare v_owner uuid; v_me uuid := auth.uid(); l record;
begin
  if not (public.is_pda_admin() or public.is_pda_owner()) then
    return query select false, 'Not allowed.'; return;
  end if;
  if coalesce(p_channel,'') not in ('call','sms','email','voicemail','in_person','other') then
    return query select false, 'Unknown contact type.'; return;
  end if;

  select * into l from public.leads where id = p_lead for update;
  if not found then return query select false, 'That lead no longer exists.'; return; end if;

  v_owner := l.owner_id;
  if v_owner is not null and v_owner <> v_me and not public.is_pda_owner() then
    return query select false, 'Someone else is working this lead.'; return;
  end if;
  if v_owner is null then
    update public.leads set owner_id = v_me, claimed_at = now(),
           released_at = null, release_reason = null
     where id = p_lead;
    v_owner := v_me;
  end if;

  update public.leads
     set last_contact_at = now(),
         pipeline_stage  = case when coalesce(pipeline_stage,'new') = 'new'
                                then 'contacted' else pipeline_stage end
   where id = p_lead;

  insert into public.communications
    (occurred_at, contact_phone, contact_email, contact_name, channel, direction,
     body, source, related_lead_id, metadata)
  values
    (now(), l.phone, l.email,
     trim(coalesce(l.first_name,'') || ' ' || coalesce(l.last_name,'')),
     p_channel, coalesce(p_direction,'outbound'), p_note, 'admin_lead_log', p_lead,
     jsonb_build_object('logged_by', v_me));

  return query select true, 'Logged. Your claim is good for another 48 hours.';
end $$;

-- Reps see every lead (so the open pool is visible) but may only edit their own.
drop policy if exists leads_admin_update on public.leads;
create policy leads_owner_update on public.leads
  for update to authenticated
  using      (public.is_pda_owner() or (public.is_pda_admin() and owner_id = auth.uid()))
  with check (public.is_pda_owner() or (public.is_pda_admin() and owner_id = auth.uid()));

revoke all on function public.release_stale_leads(integer) from anon;
grant execute on function public.claim_lead(uuid)                        to authenticated;
grant execute on function public.release_lead(uuid, text)                to authenticated;
grant execute on function public.assign_lead(uuid, uuid)                 to authenticated;
grant execute on function public.log_lead_contact(uuid, text, text, text) to authenticated;
