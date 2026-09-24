-- STAGED — NOT APPLIED. Requires Amanda's approval (permission change on the live database).
--
-- What this closes (security advisor + manual check, 2026-09-24):
--   A. public.campaign_performance and public.campaign_link_clicks are SECURITY DEFINER views
--      (they run as their owner, so they skip row security) and the anon key can SELECT them.
--      Anyone holding the public anon key — and any signed-in student — can read every email
--      campaign's subject, internal title, recipient count, delivered/opened/clicked/bounced/
--      complained counts, and every clicked URL. The tables underneath are owner/admin-only
--      (email_campaigns: is_pda_owner(); email_sends + email_events: admins).
--      Fix: make both views run with the reader's permissions (security_invoker) and revoke
--      anon. Amanda, as owner + admin, still sees everything through them; students and anon
--      see nothing. No page in this repo reads either view (checked 2026-09-24).
--   B. Three trigger functions are callable through the API by anon and signed-in users:
--      pda_commission_from_enrollment, pda_commission_from_purchase, pda_guard_profile_roles.
--      A trigger function cannot actually run outside a trigger, so this is hygiene, not a
--      hole. Revoking EXECUTE does not stop the triggers: the same revoke was applied to
--      touch_lead_last_contact on 2026-09-05 and staff-logged contacts still stamp leads
--      (4 rows since, checked 2026-09-24).
--   C. Eight backup / one-time staging tables still carry SELECT grants to anon and
--      authenticated. Row security with no policies already returns zero rows, so nothing is
--      readable today; the grants only matter if RLS is ever switched off on one of them.
--      Several hold names, emails and phone numbers. Revoke the grants; KEEP the tables
--      (whether to keep, export or delete them is a separate owner decision).
--
-- Deliberately NOT touched — these stay callable by the anon key:
--   pda_public_stats, social_proof_feed, pda_class_started, scoreboard_public_daily,
--   scoreboard_public_capture_coverage, is_pda_owner.
--   scoreboard_public_daily is The LeadFlow Pro's only integration with PDA; revoking it
--   silently breaks that product. Also left public by design: course_catalog (lesson titles
--   only, see 20260710_public_course_catalog_view.sql), public_testimonials (feedback the
--   student marked [TESTIMONIAL OK]), translation_coverage (counts only).
--
-- Not in this file: pg_net stays where it is. None of its objects are in the public schema
-- (all 12 functions are in net), and every caller uses net.http_post (3 functions, 4 cron
-- jobs). Moving it means drop + recreate, which wipes the request queue and response log and
-- breaks those callers for the duration — for no security gain.

begin;

-- A. Email campaign metrics: owner/admin only.
alter view public.campaign_performance set (security_invoker = true);
alter view public.campaign_link_clicks set (security_invoker = true);
revoke all on public.campaign_performance from anon;
revoke all on public.campaign_link_clicks from anon;

-- B. Trigger functions: not callable through the API.
revoke execute on function public.pda_commission_from_enrollment() from public, anon, authenticated;
revoke execute on function public.pda_commission_from_purchase()   from public, anon, authenticated;
revoke execute on function public.pda_guard_profile_roles()        from public, anon, authenticated;

-- C. Backup / staging tables: no API grants (tables and data untouched).
revoke all on public.account_merge_backup_20260720           from anon, authenticated;
revoke all on public.course_lessons_backup_20260822_preclean from anon, authenticated;
revoke all on public.import_candidates_aug2026               from anon, authenticated;
revoke all on public.kajabi_contacts_staging                 from anon, authenticated;
revoke all on public.online_restructure_backup_20260721      from anon, authenticated;
revoke all on public.price_flip_backup_20260822              from anon, authenticated;
revoke all on public.quiz_backup_20260721                    from anon, authenticated;
-- (communications_call_backup_20260922 already has no anon/authenticated grants.)

commit;

-- VERIFY (read-only; every row should say true):
--   select has_table_privilege('anon', 'public.campaign_performance', 'select') = false,
--          has_table_privilege('anon', 'public.campaign_link_clicks', 'select') = false,
--          (select reloptions from pg_class where oid = 'public.campaign_performance'::regclass) @> array['security_invoker=true'],
--          has_function_privilege('anon', 'public.pda_guard_profile_roles()', 'execute') = false,
--          has_function_privilege('anon', 'public.scoreboard_public_daily(integer)', 'execute') = true,   -- LeadFlow Pro still works
--          has_function_privilege('anon', 'public.pda_public_stats()', 'execute') = true,
--          has_table_privilege('anon', 'public.import_candidates_aug2026', 'select') = false;
--   Then run the security advisor: the two campaign views and the three trigger functions drop off.
--   Then, signed in as the owner, open /admin/emails and /admin/kpi: nothing should change.

-- ROLLBACK (restores today's exact grants and view behavior)
-- begin;
-- alter view public.campaign_performance reset (security_invoker);
-- alter view public.campaign_link_clicks reset (security_invoker);
-- grant all on public.campaign_performance to anon;
-- grant all on public.campaign_link_clicks to anon;
-- grant execute on function public.pda_commission_from_enrollment() to public, anon, authenticated;
-- grant execute on function public.pda_commission_from_purchase()   to public, anon, authenticated;
-- grant execute on function public.pda_guard_profile_roles()        to public, anon, authenticated;
-- grant all on public.account_merge_backup_20260720           to anon, authenticated;
-- grant all on public.course_lessons_backup_20260822_preclean to anon, authenticated;
-- grant all on public.import_candidates_aug2026               to anon, authenticated;
-- grant all on public.kajabi_contacts_staging                 to anon, authenticated;
-- grant all on public.online_restructure_backup_20260721      to anon, authenticated;
-- grant all on public.price_flip_backup_20260822              to anon, authenticated;
-- grant all on public.quiz_backup_20260721                    to anon, authenticated;
-- commit;
