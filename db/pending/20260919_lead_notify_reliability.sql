-- STAGED — NOT APPLIED. Requires Amanda's approval (database change; adds a scheduled job).
--
-- ── PREREQUISITE (verified 2026-09-24 — re-verify on the day you apply) ───────────────────
-- This moves the lead-notify secret out of the URL and into the x-lead-secret header. The
-- function must accept that header BEFORE this runs, or every new-lead alert gets a 401 and
-- stops. It does, in both copies that matter:
--   • live lead-notify v5:   const provided = url.searchParams.get("secret") || req.headers.get("x-lead-secret") || "";
--   • reconciled repo copy (supabase/functions/lead-notify, repo_ahead): same line, and
--     scripts/check-edge-behavior.mjs fails npm test if either the ?secret= or the header path stops working.
-- So this can ship before OR after the lead-notify redeploy, and any future lead-notify
-- deploy must keep BOTH paths for at least one release after this is applied.
-- Pre-flight, no email is sent (a record with no email/phone is skipped before any send):
--   select net.http_post(
--     url := 'https://lmbsuwslsycukynzpzik.supabase.co/functions/v1/lead-notify',
--     body := '{"record":{}}'::jsonb,
--     headers := jsonb_build_object('Content-Type','application/json','x-lead-secret',
--                (select value from public.app_secrets where key = 'LEAD_NOTIFY_SECRET')));
--   -- then, a few seconds later, with the id it returned:
--   select status_code, content from net._http_response where id = <id>;
--   -- expect 200 {"skipped":"no contact info"}. A 401 means STOP: do not apply.
-- ──────────────────────────────────────────────────────────────────────────────────────────
--
-- Problem: the new-lead email is one fire-and-forget hop: trg_notify_new_lead →
-- notify_new_lead() → net.http_post(lead-notify). If the edge function is briefly down, the
-- lead is SAVED but the alert never goes out and nothing tells anyone.
--
-- This migration keeps the lead insert exactly as fast and safe as today and adds:
--   1. lead_notify_log — one row per delivery attempt (lead_id, pg_net request id, attempt #).
--   2. notify_lead_post() — the single place that posts to lead-notify (used by the trigger
--      and by the retry). Uses the x-lead-secret header, so the secret is not in the URL
--      (today it sits in the URL of every queued pg_net request).
--   3. retry_lead_notifications() — every 10 minutes re-posts any lead from the last 5 hours
--      whose attempts never got a 2xx (max 3 attempts). 5 hours stays inside pg_net's
--      response retention (pg_net.ttl = 6 hours), so a delivered alert is never mistaken
--      for a missing one.
--   4. lead_notify_status view — leads (last 5 h) with no confirmed delivery (SQL/service role).
--
-- Safety changes made 2026-09-24 (vs. the Sep 19 draft):
--   a. EXECUTE revoked from PUBLIC/anon/authenticated on the two new SECURITY DEFINER functions.
--      Without it, anyone holding the public anon key could call notify_lead_post with a made-up
--      lead and make the school email any address (the same hole 20260922_revoke_anon_crm_rpcs
--      closed for the CRM functions).
--   b. Only leads whose first attempt was logged are retried. The draft would have re-sent the
--      alert AND the prospect autoresponder for every lead from the 5 hours before it was
--      applied (those have no log rows yet).
--   c. timeout_milliseconds 20000 (pg_net default 5000). lead-notify sends two emails in a row;
--      a slow send that pg_net times out still sends, then gets retried → duplicate emails.
--   d. The rollback restores the live trigger function verbatim (read from the database on
--      2026-09-24), not a file that may differ from it.
--
-- Known limits (by design): lead-notify answers 200 even when Resend refuses a send (the error
-- is in the JSON body), so this retries transport failures — function down, boot error, 5xx,
-- timeout — not a rejected email. A call that times out but did send can still be re-sent, up
-- to 3 attempts in total.

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
    url                  := 'https://lmbsuwslsycukynzpzik.supabase.co/functions/v1/lead-notify',
    body                 := jsonb_build_object('record', to_jsonb(p_lead)),
    headers              := jsonb_build_object('Content-Type', 'application/json', 'x-lead-secret', v_secret),
    timeout_milliseconds := 20000
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
      join public.lead_notify_log g on g.lead_id = l.id          -- only leads whose first attempt was logged
     where l.created_at > now() - interval '5 hours'
       and coalesce(l.source, '') not ilike '%quo%'              -- Quo webhook notifies separately
       and (l.email is not null or l.phone is not null)
     group by l.id, l.created_at
    having max(g.attempt) < 3
       and max(g.created_at) < now() - interval '10 minutes'
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

-- Server-side only: never callable through the public API.
revoke execute on function public.notify_lead_post(public.leads, int) from public, anon, authenticated;
revoke execute on function public.retry_lead_notifications() from public, anon, authenticated;

-- Leads (last 5 h) with no confirmed delivery yet. SQL / service role only.
create or replace view public.lead_notify_status with (security_invoker = true) as
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

-- Verify after applying (read-only):
--   select * from cron.job where jobname = 'retry-lead-notifications';          -- 1 row, active
--   select has_function_privilege('anon', 'public.notify_lead_post(public.leads,int)', 'execute');  -- false
--   -- after the next real lead: one lead_notify_log row with attempt 1 and a 200 in net._http_response.

-- ROLLBACK (run in this order)
-- select cron.unschedule('retry-lead-notifications');
-- drop view if exists public.lead_notify_status;
-- drop function if exists public.retry_lead_notifications();
-- -- restore the live trigger function exactly as it was on 2026-09-24:
-- create or replace function public.notify_new_lead()
--  returns trigger
--  language plpgsql
--  security definer
--  set search_path to 'public'
-- as $function$
-- declare
--   v_secret text;
--   v_url text;
-- begin
--   select value into v_secret from public.app_secrets where key = 'LEAD_NOTIFY_SECRET';
--   if v_secret is null then
--     return new;
--   end if;
--   v_url := 'https://lmbsuwslsycukynzpzik.supabase.co/functions/v1/lead-notify?secret=' || v_secret;
--   perform net.http_post(
--     url := v_url,
--     body := jsonb_build_object('record', to_jsonb(new)),
--     headers := jsonb_build_object('Content-Type', 'application/json')
--   );
--   return new;
-- exception
--   when others then
--     return new;
-- end;
-- $function$;
-- drop function if exists public.notify_lead_post(public.leads, int);
-- drop table if exists public.lead_notify_log;
