-- Career Direction Plan pricing per Ryan (2026-08-30): launch price $19 with
-- a $47 regular-price anchor (left-digit pricing; $47 is the declared regular
-- price the product moves to after launch, so the anchor stays honest).
-- Applied to production via Supabase MCP on 2026-08-30. Idempotent.
-- Product remains active=false until Amanda approves activation.

update public.products
   set price_cents = 1900, reg_price_cents = 4700
 where key = 'career_plan';
