-- Security tightening (applied to production via Supabase MCP on 2026-07-08).
-- Two SECURITY DEFINER functions were needlessly callable by anon/authenticated
-- over /rest/v1/rpc. rollup_page_visits() DELETEs page_visits older than 180d
-- and re-aggregates daily_stats — only the pg_cron job (runs as owner) should
-- call it. sync_admin_claim() is a trigger function that should never be invoked
-- directly. pg_cron / triggers run as the owner, so revoking client EXECUTE is safe.
revoke execute on function public.rollup_page_visits() from anon, authenticated;
revoke execute on function public.sync_admin_claim() from anon, authenticated;
