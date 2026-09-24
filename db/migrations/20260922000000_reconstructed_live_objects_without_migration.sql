-- RECONSTRUCTED FROM THE LIVE CATALOG on 2026-09-24. NOT the original text.
--
-- These objects exist in the live project (lmbsuwslsycukynzpzik) but appear in NO migration —
-- not in db/migrations, and not in supabase_migrations.schema_migrations. They were created
-- with ad-hoc SQL around 2026-09-22 (quo-inbound-webhook v11/v12) and 2026-09-08 (lead
-- ownership). Without this file, a database rebuilt from the repo would lack what the live
-- Quo webhook depends on (duplicate deliveries would create duplicate leads again).
--
-- The definitions below were read back from pg_catalog / cron.job on 2026-09-24
-- (pg_get_indexdef, pg_get_constraintdef, column list, grants). Every statement is guarded, so
-- running this against the live project changes nothing — but it is ALREADY LIVE: do not run it
-- there. Recorded as "reconstructed" in db/migrations/MANIFEST.json.

-- 1. One delivery per Quo event (quo-inbound-webhook v12+ claims body.id here first).
create table if not exists public.quo_webhook_events (
  evt         text not null primary key,
  type        text,
  received_at timestamptz not null default now()
);
alter table public.quo_webhook_events enable row level security;   -- no policies: service role only
revoke all on public.quo_webhook_events from anon, authenticated;

-- 2. One communications row per call and per text (v11+; upsert_call_event's ON CONFLICT uses the first).
create unique index if not exists communications_call_id_uniq on public.communications
  using btree (((metadata ->> 'call_id'::text)))
  where ((channel = 'call'::text) and (coalesce((metadata ->> 'call_id'::text), ''::text) <> ''::text));
create unique index if not exists communications_msg_id_uniq on public.communications
  using btree (((metadata ->> 'msg_id'::text)))
  where ((channel = 'sms'::text) and (coalesce((metadata ->> 'msg_id'::text), ''::text) <> ''::text));

-- 3. Scheduled jobs (pg_cron), exactly as cron.job lists them.
select cron.schedule('prune-quo-webhook-events', '23 4 * * *',
  $$delete from public.quo_webhook_events where received_at < now() - interval '14 days'$$)
 where not exists (select 1 from cron.job where jobname = 'prune-quo-webhook-events');
select cron.schedule('pda-release-stale-leads', '7 * * * *',
  $$select public.release_stale_leads(48)$$)
 where not exists (select 1 from cron.job where jobname = 'pda-release-stale-leads');
