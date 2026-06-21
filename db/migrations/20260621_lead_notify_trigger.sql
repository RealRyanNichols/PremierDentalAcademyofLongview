-- Lead-notify trigger (applied to the live project 2026-06-21).
-- Fires the lead-notify edge function on each new public.leads row, asynchronously via
-- pg_net. security definer so it can read the gated secret; exception-safe so a
-- notification failure can never block or roll back a lead insert.
--
-- Prerequisite (set once, not in this migration since it holds a secret value):
--   insert into public.app_secrets(key, value)
--   select 'LEAD_NOTIFY_SECRET', <random token>
--   where not exists (select 1 from public.app_secrets where key = 'LEAD_NOTIFY_SECRET');
-- The edge function reads LEAD_NOTIFY_SECRET + RESEND_API_KEY from public.app_secrets.

create or replace function public.notify_new_lead()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_secret text;
  v_url text;
begin
  select value into v_secret from public.app_secrets where key = 'LEAD_NOTIFY_SECRET';
  if v_secret is null then
    return new;
  end if;
  v_url := 'https://lmbsuwslsycukynzpzik.supabase.co/functions/v1/lead-notify?secret=' || v_secret;
  perform net.http_post(
    url := v_url,
    body := jsonb_build_object('record', to_jsonb(new)),
    headers := jsonb_build_object('Content-Type', 'application/json')
  );
  return new;
exception
  when others then
    return new;  -- never block a lead insert on a notification failure
end;
$$;

drop trigger if exists trg_notify_new_lead on public.leads;
create trigger trg_notify_new_lead
after insert on public.leads
for each row execute function public.notify_new_lead();
