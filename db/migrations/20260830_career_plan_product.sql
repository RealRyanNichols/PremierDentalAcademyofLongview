-- The Career Direction Plan — $20 workbook that monetizes the free
-- what-should-i-do-after-high-school quiz (blog). Applied to production via
-- Supabase MCP on 2026-08-30; captured here for reproducibility. Idempotent.
--
-- Same shape as study_pack: delivery='website_entitlement', the full workbook
-- lives in /career-plan behind the profiles.career_plan gate, and the deployed
-- buy-product function grants profiles.career_plan = true after charging.
--
-- STAYS active=false until Amanda approves activation. While inactive,
-- buy-product answers "That product isn't available." before any charge, so
-- nothing is buyable. Activation (reversible):
--   update public.products set active = true  where key = 'career_plan';
--   update public.products set active = false where key = 'career_plan';

alter table public.profiles
  add column if not exists career_plan boolean not null default false;

insert into public.products
  (key, name, price_cents, reg_price_cents, blurb, delivery, entitlement_flag, sales_url, active, sort)
values
  ('career_plan',
   'The Career Direction Plan (All Four Paths + Worksheets)',
   2000, 2900,
   'The complete workbook behind the after-high-school quiz: all four directions explained honestly, with a decision worksheet, a test-it-cheap week, East Texas resources, and a parent one-pager for each.',
   'website_entitlement', 'career_plan', '/career-plan', false, 14)
on conflict (key) do nothing;
