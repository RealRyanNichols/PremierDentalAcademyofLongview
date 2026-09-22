-- APPLIED 2026-09-22. Closes an RLS bypass on the CRM lead-ownership RPCs.
--
-- What was wrong
-- --------------
-- The Sep 8 migrations (20260908232441_lead_ownership_claim_and_release,
-- 20260908232515_sales_commissions, 20260908232243_roles_owner_admin_tier_and_profile_guard)
-- and 20260831004133_exam_intent_nurture_autoenroll left SECURITY DEFINER functions
-- reachable by the PUBLIC anon key over /rest/v1/rpc/.
--
-- The first migration DID try to revoke, but it named only `anon`:
--     revoke all on function public.release_stale_leads(integer) from anon;
-- Postgres grants EXECUTE to PUBLIC by default, and a revoke aimed at `anon` does not
-- remove the PUBLIC grant that `anon` inherits. The live ACL still read
-- `=X/postgres | ...` (the leading `=` IS the PUBLIC entry), so anon kept EXECUTE.
-- Every revoke below therefore names `public` first.
--
-- Confirmed reachable by an unauthenticated caller before this ran:
--   • pda_current_rate(text)       — returned the full commission_rates row. A real leak.
--   • release_stale_leads(integer) — no authorization check at all; release_stale_leads(0)
--                                    would clear owner_id on every claimed lead.
--   • release_lead(uuid,text)      — fell through its guard on NULL logic (fixed below).
--   • enroll_exam_intent_leads()   — no check; could insert sequence_subscriptions rows.
-- Blast radius was small (no lead is currently owned and no shipped code calls these),
-- but the grants were wrong and the guard was broken.
--
-- Deliberately NOT touched — these are anon-callable on purpose:
--   pda_public_stats(), social_proof_feed(), pda_class_started(),
--   scoreboard_public_daily(int), scoreboard_public_capture_coverage(int)
--     ^ the last two are the feed The LeadFlow Pro pulls; revoking them breaks it.
--   is_pda_owner() — helper used inside RLS policies, which are evaluated as the CALLING
--     role. Revoking it there would break admin access site-wide. It returns false for
--     anon and discloses nothing.
--   pda_commission_from_purchase/_from_enrollment/pda_guard_profile_roles — trigger
--     functions. PostgREST cannot call them ("trigger functions can only be called as
--     triggers"), and leaving the grant alone keeps trigger firing unquestionably intact.

-- 1. Admin-guarded CRM RPCs: staff only. They check is_pda_admin()/is_pda_owner()
--    internally, so `authenticated` keeps EXECUTE and the guard does the rest.
revoke all on function public.claim_lead(uuid)                         from public, anon;
revoke all on function public.assign_lead(uuid, uuid)                  from public, anon;
revoke all on function public.log_lead_contact(uuid, text, text, text) from public, anon;
revoke all on function public.release_lead(uuid, text)                 from public, anon;

-- 2. Ungated functions: no internal authorization at all, and nothing in the app calls
--    them. Service-role / maintenance only — not reachable from any browser session.
revoke all on function public.release_stale_leads(integer)      from public, anon, authenticated;
revoke all on function public.enroll_exam_intent_leads()        from public, anon, authenticated;
revoke all on function public.pda_current_rate(text)            from public, anon, authenticated;
revoke all on function public.pda_rep_for_contact(text, text)   from public, anon, authenticated;

-- 3. release_lead fell through its own guard. With auth.uid() NULL (anon) and an
--    unowned lead, `v_owner = v_me` is NULL, `false OR NULL` is NULL, `NOT NULL` is
--    NULL — and plpgsql does not take an IF branch whose condition is NULL, so control
--    reached the UPDATE. An unowned lead is now answered before the ownership test, and
--    the test itself requires a real caller.
create or replace function public.release_lead(p_lead uuid, p_reason text default null::text)
returns table(ok boolean, message text)
language plpgsql
security definer
set search_path to 'public'
as $function$
declare v_owner uuid; v_me uuid := auth.uid();
begin
  select l.owner_id into v_owner from public.leads l where l.id = p_lead for update;
  if not found then return query select false, 'That lead no longer exists.'; return; end if;
  if v_owner is null then
    return query select false, 'That lead is already in the open pool.'; return;
  end if;
  if not (public.is_pda_owner() or (v_me is not null and v_owner = v_me)) then
    return query select false, 'That lead is not yours to release.'; return;
  end if;
  update public.leads
     set owner_id = null, claimed_at = null, released_at = now(),
         release_reason = coalesce(p_reason, 'released by rep')
   where id = p_lead;
  return query select true, 'Lead is back in the open pool.';
end $function$;

revoke all on function public.release_lead(uuid, text) from public, anon;

-- ROLLBACK (only if something legitimate turns out to need these):
--   grant execute on function public.claim_lead(uuid) to anon;   -- etc. per function
-- The release_lead guard fix should NOT be rolled back; the prior version was exploitable.
