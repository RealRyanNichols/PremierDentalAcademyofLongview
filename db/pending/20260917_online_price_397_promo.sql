-- STAGED — NOT APPLIED. OWNER PRICING DECISION — not an engineering call.
-- ── APPROVAL (checked 2026-09-24) ────────────────────────────────────────────────────────
-- Only Amanda can approve this, in words that name the price and the date it starts. It
-- changes what paying customers are charged. No engineer, agent or reviewer may apply it as
-- "cleanup", "sync" or "matching the brief", and never on its own (see ship-together below).
-- Today, verified in the database and code on 2026-09-24:
--   • products.online_program: price_cents 99700, reg_price_cents 99700 (checkout charges $997)
--   • assets/site-facts.js pricing.online.sale = false (every page shows $997)
--   • api/enroll.js onlineCents() = 99700
-- They agree. Applying this file alone would make checkout charge $397 while every page
-- still says $997 — a price the customer was never shown.
-- Before applying, also decide: does the $397 have an end date? CLAUDE.md: no fake
-- countdowns; if it ends, build a date-gated flip (the July 1 / Aug 22 pattern).
-- ──────────────────────────────────────────────────────────────────────────────────────────
--
-- Flip the online program to the $397 promotional price (regular $997) that her Sep 17, 2026
-- brief lists. supabase/functions/buy-product charges products.online_program.price_cents,
-- so this row is the payment authority for online.
--
-- Ship TOGETHER, in one deploy, or the site will show one number and charge another:
--   1. this migration
--   2. assets/site-facts.js  → pricing.online.sale = true   (every page, the chatbot, JSON-LD
--      and calculators derive $397 from that one switch)
--   3. api/enroll.js         → onlineCents = () => 39700    (npm test / check:pricing fails
--      until 2 and 3 agree with site-facts)
-- Rollback: run the statement in the ROLLBACK block and set sale = false / 99700 again.

begin;

update public.products
   set price_cents     = 39700,
       reg_price_cents = 99700
 where key = 'online_program'
   and price_cents = 99700;   -- guard: only flips from the current $997

-- expect: UPDATE 1
commit;

-- ROLLBACK
-- update public.products set price_cents = 99700, reg_price_cents = 99700 where key = 'online_program';
