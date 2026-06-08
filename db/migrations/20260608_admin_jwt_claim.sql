-- Recognize admins from their JWT (app_metadata), not only a live DB read.
--
-- Problem: getSession() can hand the front-end an expired access token; a
-- profiles read with it returns no row, and the owner gets dropped into the
-- student view. app_metadata is service-role-only and Supabase stamps it into
-- every access token, so the client can trust an is_admin claim even when the
-- DB read fails.
--
-- 1) Backfill the claim for current admins.
update auth.users u
set raw_app_meta_data = coalesce(u.raw_app_meta_data, '{}'::jsonb)
                        || jsonb_build_object('is_admin', true, 'pda_role', 'admin')
from public.profiles p
where p.id = u.id and p.is_admin = true;

-- 2) Keep it in sync whenever profiles.is_admin changes (and for new admins).
create or replace function public.sync_admin_claim()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update auth.users
  set raw_app_meta_data = case
        when coalesce(NEW.is_admin, false)
          then coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('is_admin', true, 'pda_role', 'admin')
          else (coalesce(raw_app_meta_data, '{}'::jsonb) - 'is_admin' - 'pda_role')
      end
  where id = NEW.id;
  return NEW;
end;
$$;

drop trigger if exists trg_sync_admin_claim on public.profiles;
create trigger trg_sync_admin_claim
  after insert or update of is_admin on public.profiles
  for each row execute function public.sync_admin_claim();
