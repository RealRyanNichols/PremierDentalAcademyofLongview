-- Kajabi migration Phase 1 (additive only). APPLIED to live project lmbsuwslsycukynzpzik.
-- 1) career_vault entitlement flag on profiles (same pattern as exam_prep/study_pack),
--    set true on Career Vault purchase; read by /learn to gate the career-vault course.
-- 2) products admin-write RLS so /admin/courses can create the auto product row from the
--    signed-in admin's session (mirrors courses_admin_all / lessons_admin_all). products
--    previously had only a public-read policy.
-- Re-runnable / idempotent.

alter table public.profiles
  add column if not exists career_vault boolean not null default false;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'products'
      and policyname = 'products_admin_all'
  ) then
    create policy products_admin_all on public.products
      for all to authenticated
      using  (exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin))
      with check (exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin));
  end if;
end $$;
