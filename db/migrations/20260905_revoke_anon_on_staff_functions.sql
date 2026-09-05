-- Applied 2026-09-05. Staff-only RPCs and trigger helpers must not be callable by the anonymous
-- API role (each already raises 'not authorized' internally; this closes the door at the grant level).
revoke execute on function public.admin_student_activity(uuid) from anon;
revoke execute on function public.admin_student_progress() from anon;
revoke execute on function public.verify_skill(uuid, text, boolean, text) from anon;
revoke execute on function public.touch_lead_last_contact() from anon, authenticated;
revoke execute on function public.guard_skills_verified() from anon, authenticated;
-- Rollback: grant execute on the same functions back to anon / authenticated.
