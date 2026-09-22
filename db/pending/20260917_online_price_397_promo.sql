-- STAGED — NOT APPLIED. Requires Amanda's explicit approval: this changes what checkout charges.
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
