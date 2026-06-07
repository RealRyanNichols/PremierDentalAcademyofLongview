-- Privacy-safe source for the social-proof toast: aggregate inquiry counts +
-- already-public next-cohort info only. Never exposes names, emails, or rows.
-- Applied to production via Supabase MCP on 2026-06-07; captured for repro.

create or replace function public.social_proof_feed()
returns json
language sql
security definer
set search_path = public
as $$
  select json_build_object(
    'inquiries_24h', (select count(*) from public.leads where created_at > now() - interval '24 hours'),
    'inquiries_7d',  (select count(*) from public.leads where created_at > now() - interval '7 days'),
    'next_cohort', (
      select json_build_object(
        'name', c.name,
        'start_date', c.start_date,
        'capacity', c.capacity,
        'seats_left', greatest(0, coalesce(c.capacity, 0) - coalesce(c.enrolled_count, 0))
      )
      from public.cohorts c
      where c.start_date >= current_date
        and coalesce(c.status, 'open') <> 'cancelled'
      order by c.start_date asc
      limit 1
    )
  );
$$;

grant execute on function public.social_proof_feed() to anon, authenticated;
