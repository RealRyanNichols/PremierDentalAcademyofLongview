-- Leads → automations wiring (APPLIED to the live project 2026-07-10; verified end-to-end
-- with a test facebook_lead_ad lead: tag "FB Lead Ad" added + enrolled in
-- fb-lead-enrollment-drip, then cleaned up).
--
-- On each new public.leads row WITH an email, fire the run-automations edge function
-- asynchronously via pg_net (same pattern as trg_notify_new_lead). The function maps
-- leads.source to the seeded form_submitted rules (facebook_lead_ad → fb-lead-ad →
-- enrollment drip, homepage → get-class-info → 30-day follow-up) and enrolls the lead
-- as a subscriber. Exception-safe: an automation failure can never block a lead insert.
--
-- The shared secret is GENERATED IN-DATABASE (gen_random_bytes) — no secret value in
-- the repo. run-automations reads app_secrets.AUTOMATIONS_SECRET.

insert into public.app_secrets(key, value)
select 'AUTOMATIONS_SECRET', encode(gen_random_bytes(24), 'hex')
where not exists (select 1 from public.app_secrets where key = 'AUTOMATIONS_SECRET');

create or replace function public.automate_new_lead()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_secret text;
begin
  if new.email is null or position('@' in new.email) = 0 then
    return new;  -- calls/texts without an email can't join email automations
  end if;
  select value into v_secret from public.app_secrets where key = 'AUTOMATIONS_SECRET';
  if v_secret is null then
    return new;
  end if;
  perform net.http_post(
    url := 'https://lmbsuwslsycukynzpzik.supabase.co/functions/v1/run-automations?secret=' || v_secret,
    body := jsonb_build_object('record', to_jsonb(new)),
    headers := jsonb_build_object('Content-Type', 'application/json')
  );
  return new;
exception
  when others then
    return new;  -- never block a lead insert on an automation failure
end;
$$;

drop trigger if exists trg_automate_new_lead on public.leads;
create trigger trg_automate_new_lead
after insert on public.leads
for each row execute function public.automate_new_lead();
