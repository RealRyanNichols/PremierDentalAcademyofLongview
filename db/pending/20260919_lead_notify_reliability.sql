-- STAGED — NOT APPLIED. Requires Amanda's approval (database change; adds a scheduled job).
--
-- Problem: the new-lead email is one fire-and-forget hop: trg_notify_new_lead →
-- notify_new_lead() → net.http_post(lead-notify). If the edge function is briefly down or
-- Resend hiccups, the lead is SAVED but the alert never goes out and nothing tells anyone.
--
-- This migration keeps the lead insert exactly as fast and safe as today and adds:
--   1. lead_notify_log — one row per delivery attempt (lead_id, pg_net request id, attempt #).
--   2. notify_lead_post() — the single place that posts to lead-notify (used by the trigger
--      and by the retry). Uses the x-lead-secret header, so the secret is not in the URL.
--   3. retry_lead_notifications() — every 10 minutes re-posts any lead from the last 5 hours
--      whose attempts never got a 2xx (max 3 attempts). 5 hours stays inside pg_net's
--      response retention, so a delivered alert is never mistaken for a missing one.
--   4. lead_notify_status view — for /admin: leads with no confirmed delivery.
-- Rollback at the bottom.

create extension if not exists pg_cron;

create table if not exists public.lead_notify_log (
  id          bigserial primary key,
  lead_id     uuid not null references public.leads(id) on delete cascade,
  request_id  bigint,
  attempt     int  not null default 1,
  created_at  timestamptz not null default now()
);
create index if not exists lead_notify_log_lead_idx on public.lead_notify_log (lead_id, created_at desc);
alter table public.lead_notify_log enable row level security;  -- no policies: SQL / service role only

create or replace function public.notify_lead_post(p_lead public.leads, p_attempt int)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_secret text;
  v_id bigint;
begin
  select value into v_secret from public.app_secrets where key = 'LEAD_NOTIFY_SECRET';
  if v_secret is null then
    return null;
  end if;
  select net.http_post(
    url     := 'https://lmbsuwslsycukynzpzik.supabase.co/functions/v1/lead-notify',
    body    := jsonb_build_object('record', to_jsonb(p_lead)),
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-lead-secret', v_secret)
  ) into v_id;
  insert into public.lead_notify_log (lead_id, request_id, attempt) values (p_lead.id, v_id, p_attempt);
  return v_id;
end;
$$;

-- Same trigger function name as today, so trg_notify_new_lead needs no change.
create or replace function public.notify_new_lead()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.notify_lead_post(new, 1);
  return new;
exception
  when others then
    return new;   -- a mail failure must never block or roll back a lead
end;
$$;

create or replace function public.retry_lead_notifications()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  n int := 0;
begin
  for r in
    select l.id, coalesce(max(g.attempt), 0) as attempts
      from public.leads l
      left join public.lead_notify_log g on g.lead_id = l.id
     where l.created_at > now() - interval '5 hours'
       and coalesce(l.source, '') not ilike '%quo%'          -- Quo webhook notifies separately
       and (l.email is not null or l.phone is not null)
     group by l.id, l.created_at
    having coalesce(max(g.attempt), 0) < 3
       and coalesce(max(g.created_at), l.created_at) < now() - interval '10 minutes'
       and not exists (
             select 1
               from public.lead_notify_log g2
               join net._http_response resp on resp.id = g2.request_id
              where g2.lead_id = l.id
                and resp.status_code between 200 and 299)
  loop
    perform public.notify_lead_post((select x from public.leads x where x.id = r.id), r.attempts + 1);
    n := n + 1;
  end loop;
  return n;
end;
$$;

-- Admin visibility: leads (last 5 h) with no confirmed delivery yet.
create or replace view public.lead_notify_status as
select l.id, l.created_at, l.source, l.first_name, l.last_name,
       coalesce(max(g.attempt), 0) as attempts,
       bool_or(resp.status_code between 200 and 299) as delivered
  from public.leads l
  left join public.lead_notify_log g on g.lead_id = l.id
  left join net._http_response resp on resp.id = g.request_id
 where l.created_at > now() - interval '5 hours'
 group by l.id;
revoke all on public.lead_notify_status from anon, authenticated;

select cron.schedule('retry-lead-notifications', '*/10 * * * *', $$select public.retry_lead_notifications();$$);

-- ROLLBACK
-- select cron.unschedule('retry-lead-notifications');
-- drop view if exists public.lead_notify_status;
-- drop function if exists public.retry_lead_notifications();
-- -- restore the original trigger function (db/migrations/20260621_lead_notify_trigger.sql)
-- drop function if exists public.notify_lead_post(public.leads, int);
-- drop table if exists public.lead_notify_log;
