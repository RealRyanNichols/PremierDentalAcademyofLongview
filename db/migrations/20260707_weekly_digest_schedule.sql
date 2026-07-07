-- Weekly owner digest schedule (applied to production via Supabase MCP on
-- 2026-07-07; captured here for reproducibility — the real DIGEST_TOKEN value
-- lives ONLY in public.app_secrets, never in the repo).
--
-- Monday 12:00 UTC (7am Central) → pg_net http_post → weekly-digest edge
-- function (supabase/functions/weekly-digest), which emails Amanda the week's
-- visitors, top pages, tools, leads by source, purchases, waiting student
-- questions, and seat status via Resend. Verified end-to-end 2026-07-07
-- (function 200, Resend 200).
create extension if not exists pg_net;

-- insert into public.app_secrets (key, value) values ('DIGEST_TOKEN', '<generate one>')
--   on conflict (key) do nothing;

select cron.schedule(
  'weekly-owner-digest',
  '0 12 * * 1',
  $$select net.http_post(
      url := 'https://lmbsuwslsycukynzpzik.supabase.co/functions/v1/weekly-digest?key=' || (select value from public.app_secrets where key = 'DIGEST_TOKEN'),
      body := '{}'::jsonb
    )$$
);
