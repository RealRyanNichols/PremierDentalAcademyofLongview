-- 2026-09-05 · Security-advisor hygiene for the two trigger functions added
-- today (touch_lead_last_contact → leads.last_contact stamping,
-- guard_skills_verified → skills_lab_progress.verified protection).
--
-- Both are SECURITY DEFINER and were callable through PostgREST RPC by anon
-- and signed-in users. Calling a trigger function directly only returns an
-- error ("trigger functions can only be called as triggers"), but there is no
-- reason to expose them at all. Postgres checks EXECUTE on a trigger function
-- only when the trigger is created, never when it fires, so the triggers
-- themselves keep working (verified with a rolled-back probe before applying).
--
-- Rollback: grant execute on function public.<name>() to authenticated;

revoke execute on function public.touch_lead_last_contact() from public, anon, authenticated;
revoke execute on function public.guard_skills_verified()   from public, anon, authenticated;
