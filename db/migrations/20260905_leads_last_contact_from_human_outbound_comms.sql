-- Applied 2026-09-05 (Amanda-approved go-live).
-- CRM: a human outbound touch (Quo call/text or an admin-logged call/text/note) always stamps
-- leads.last_contact_at, whichever surface logged it. Automated sources (sms-drip, quo-auto-*,
-- quo-ai-night, resend, buy-product, kajabi-webhook) never count as "we contacted them".
create or replace function public.touch_lead_last_contact()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.related_lead_id is not null
     and coalesce(new.direction, 'outbound') <> 'inbound'
     and coalesce(new.source, 'manual') in ('quo', 'admin_manual', 'manual') then
    update public.leads
       set last_contact_at = greatest(coalesce(last_contact_at, '-infinity'::timestamptz), coalesce(new.occurred_at, now()))
     where id = new.related_lead_id;
  end if;
  return new;
end $$;

drop trigger if exists trg_touch_lead_last_contact on public.communications;
create trigger trg_touch_lead_last_contact
  after insert on public.communications
  for each row execute function public.touch_lead_last_contact();

-- One-time backfill from existing human outbound touches (never moves a stamp backwards).
update public.leads l
   set last_contact_at = x.last_out
  from (
    select related_lead_id, max(occurred_at) as last_out
      from public.communications
     where related_lead_id is not null
       and coalesce(direction, 'outbound') <> 'inbound'
       and coalesce(source, 'manual') in ('quo', 'admin_manual', 'manual')
     group by related_lead_id
  ) x
 where x.related_lead_id = l.id
   and (l.last_contact_at is null or l.last_contact_at < x.last_out);

-- Rollback: drop trigger if exists trg_touch_lead_last_contact on public.communications;
--           drop function if exists public.touch_lead_last_contact();
