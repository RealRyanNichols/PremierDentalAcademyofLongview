-- Nightly page_visits rollup + 180-day raw retention (applied to production
-- via Supabase MCP on 2026-07-07; captured here for reproducibility).
-- daily_stats keeps one row per (day, page-string) — tiny forever — so the
-- KPI page reads aggregates instead of scanning raw events.
create extension if not exists pg_cron;

create table if not exists public.daily_stats (
  day date not null,
  page text not null,
  hits int not null default 0,
  uniques int not null default 0,
  primary key (day, page)
);

alter table public.daily_stats enable row level security;
drop policy if exists "daily_stats_admin_read" on public.daily_stats;
create policy "daily_stats_admin_read" on public.daily_stats
  for select to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
    or coalesce((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false)
  );

create or replace function public.rollup_page_visits() returns void
language sql security definer set search_path = public as $$
  insert into public.daily_stats (day, page, hits, uniques)
  select visited_at::date, page, count(*), count(distinct visitor_hash)
  from public.page_visits
  where visited_at >= current_date - interval '2 days' and visited_at < current_date
  group by 1, 2
  on conflict (day, page) do update set hits = excluded.hits, uniques = excluded.uniques;

  delete from public.page_visits where visited_at < current_date - interval '180 days';
$$;

-- Backfill everything before today once.
insert into public.daily_stats (day, page, hits, uniques)
select visited_at::date, page, count(*), count(distinct visitor_hash)
from public.page_visits
where visited_at < current_date
group by 1, 2
on conflict (day, page) do update set hits = excluded.hits, uniques = excluded.uniques;

-- 08:15 UTC ≈ 3:15am Central, nightly. cron.schedule upserts by job name.
select cron.schedule('rollup-page-visits', '15 8 * * *', 'select public.rollup_page_visits()');
