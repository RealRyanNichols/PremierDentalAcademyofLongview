-- Native email send pipeline: schedule the email-worker (applied to prod 2026-07-09).
-- The worker processes due 'scheduled' campaigns + due sequence steps, but is HARD-GATED:
-- it sends nothing unless app_secrets.EMAIL_SENDER_ENABLED='on' (and/or SEQUENCES_ENABLED='on').
-- Adding this job completes the pipeline so broadcasts fire the moment sending is enabled;
-- until then every tick returns "kill switches off — nothing sent".
-- Secret is pulled via subquery (never inlined). Mirrors the weekly-owner-digest job pattern.
select cron.schedule(
  'email-worker-tick',
  '*/5 * * * *',
  $cmd$select net.http_post(
      url := 'https://lmbsuwslsycukynzpzik.supabase.co/functions/v1/email-worker?secret=' || (select value from public.app_secrets where key = 'CRON_SECRET'),
      body := '{}'::jsonb
    )$cmd$
);

-- To pause: select cron.unschedule('email-worker-tick');
