-- RECOVERED FROM LIVE on 2026-09-24. Applied 2026-09-08 23:26 UTC, but the file was never committed.
-- Source: supabase_migrations.schema_migrations version 20260908232624 ("restrict_company_financials_to_owner").
-- ALREADY APPLIED — never run it again. It is here so the repo shows what the database holds.
-- Moves purchases, failed_payments, daily_stats and email_campaigns from admin to owner-only access.
-- Everything below the marker line is byte-identical to the stored statement
-- (md5 25d0711d5d1db5f0faa1eead65babdc6); scripts/check-migrations.mjs verifies that on every npm test.
-- ---- recovered statement below ----
-- Company-wide money stays with the owner. Reps see their own commissions
-- (public.commissions) and the shared contact history, not total revenue.

drop policy if exists purchases_admin_all on public.purchases;
create policy purchases_owner_all on public.purchases
  for all to authenticated
  using (public.is_pda_owner()) with check (public.is_pda_owner());

drop policy if exists purchases_self on public.purchases;
create policy purchases_self on public.purchases
  for select to authenticated
  using (auth.uid() = student_id or public.is_pda_owner());

drop policy if exists failed_payments_admin_all on public.failed_payments;
create policy failed_payments_owner_all on public.failed_payments
  for all to authenticated
  using (public.is_pda_owner()) with check (public.is_pda_owner());

drop policy if exists daily_stats_admin_read on public.daily_stats;
create policy daily_stats_owner_read on public.daily_stats
  for select to authenticated
  using (public.is_pda_owner());

drop policy if exists email_campaigns_admin on public.email_campaigns;
create policy email_campaigns_owner on public.email_campaigns
  for all to authenticated
  using (public.is_pda_owner()) with check (public.is_pda_owner());
