-- Lets a signed-in student read their own GUEST purchases (rows written by guest
-- checkout with student_id = null and only contact_email set). Today the only
-- SELECT policy on purchases is purchases_self (auth.uid() = student_id OR admin),
-- so the dashboard's "student_id OR contact_email" query can never see those rows.
-- Additive (policies OR together) and reversible. Apply only with Amanda's approval.
-- Relies on the auth email being verified (magic link / confirm-on-signup).
create policy purchases_self_email on public.purchases
  for select to authenticated
  using (contact_email is not null and lower(contact_email) = lower(auth.jwt() ->> 'email'));
-- Rollback: drop policy if exists purchases_self_email on public.purchases;
