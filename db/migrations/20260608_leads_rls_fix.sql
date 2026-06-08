-- Leads RLS fixes (admin inbox correctness + PII hardening)
--
-- 1) There was NO update policy on public.leads, so every edit from the admin
--    inbox (pipeline_stage, amanda_notes, last_contact_at) silently affected 0
--    rows. Add an admin-only UPDATE policy so the inbox actually saves.
--
-- 2) The "staff can read" SELECT policy used USING (true) for the authenticated
--    role, which let ANY signed-in user (including students) read every lead's
--    name, phone, message, notes and pay intent. Drop it; admin reads continue
--    via the existing admin-only "leads_admin_read" policy.

drop policy if exists "staff can read" on public.leads;

create policy "leads_admin_update" on public.leads
  for update to authenticated
  using (public.is_pda_admin())
  with check (public.is_pda_admin());
