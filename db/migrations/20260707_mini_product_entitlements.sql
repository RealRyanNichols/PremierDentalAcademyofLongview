-- Mini-product entitlement wiring (applied to production via Supabase MCP on
-- 2026-07-07; captured here for reproducibility. Idempotent.)
--
-- Why: the products table carries 8 dormant "ms_*" mini-products (cheat
-- sheets, flashcard deck, templates — all active=false) plus money_plan and
-- survival_planner. Before this migration none of the ms_* rows had an
-- entitlement_flag and NO profile columns existed for any of the 10, so
-- activating one would have charged the buyer without granting or delivering
-- anything (the deployed buy-product function grants
-- profiles[entitlement_flag] = true after charging).
--
-- This makes the grant path safe. Each product must STAY active=false until
-- it also has:
--   1) a delivery asset — storage_path PDF in the private products bucket
--   2) a product page (like /study-pack) with checkout
-- See docs/mini-products-launch-checklist.md.

alter table public.profiles
  add column if not exists money_plan boolean not null default false,
  add column if not exists survival_planner boolean not null default false,
  add column if not exists ms_abbrev boolean not null default false,
  add column if not exists ms_hours boolean not null default false,
  add column if not exists ms_infection boolean not null default false,
  add column if not exists ms_instruments boolean not null default false,
  add column if not exists ms_interview boolean not null default false,
  add column if not exists ms_resume boolean not null default false,
  add column if not exists ms_spanish boolean not null default false,
  add column if not exists ms_toothnum boolean not null default false;

update public.products set entitlement_flag = key
  where key like 'ms\_%' and entitlement_flag is null;
