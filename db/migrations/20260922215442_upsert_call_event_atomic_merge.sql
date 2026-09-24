-- RECOVERED FROM LIVE on 2026-09-24. Applied 2026-09-22 21:54 UTC, but the file was never committed.
-- Source: supabase_migrations.schema_migrations version 20260922215442 ("upsert_call_event_atomic_merge").
-- ALREADY APPLIED — never run it again. It is here so the repo shows what the database holds.
-- Required by quo-inbound-webhook v13+. The claim table and unique indexes that function also needs were created outside any migration; see 20260922000000_reconstructed_live_objects_without_migration.sql.
-- Everything below the marker line is byte-identical to the stored statement
-- (md5 5b6b250cd3dca3f351271ce55068c077); scripts/check-migrations.mjs verifies that on every npm test.
-- ---- recovered statement below ----
-- One atomic write per Quo call event. Summary and transcript events for the same
-- call land within milliseconds of each other; merging them in the edge function
-- (read row, merge in JS, write whole row back) let whichever wrote last erase the
-- other's summary or transcript. This merges under a row lock instead.
create or replace function public.upsert_call_event(
  p_call_id text,
  p_patch jsonb,
  p_summary_body text default null,
  p_default_body text default null,
  p_duration integer default null,
  p_direction text default null,
  p_phone text default null,
  p_lead uuid default null,
  p_name text default null,
  p_email text default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_phone text;
  v_lead uuid;
  v_summary text;
  v_tied boolean := false;
  v_has_phone boolean := nullif(p_phone, '') is not null;
begin
  if coalesce(p_call_id, '') = '' then
    raise exception 'upsert_call_event: call id required';
  end if;

  insert into public.communications
    (contact_phone, contact_name, contact_email, channel, direction, body, source,
     duration_seconds, related_lead_id, metadata)
  values
    (nullif(p_phone, ''),
     case when v_has_phone then p_name end,
     case when v_has_phone then p_email end,
     'call', coalesce(p_direction, 'inbound'),
     coalesce(nullif(p_summary_body, ''), p_default_body, '[Call]'), 'quo',
     nullif(coalesce(p_duration, 0), 0), p_lead,
     coalesce(p_patch, '{}'::jsonb)
       || jsonb_build_object('call_id', p_call_id, 'pending_party', not v_has_phone))
  on conflict ((metadata->>'call_id')) where channel = 'call' and coalesce(metadata->>'call_id', '') <> ''
  do nothing
  returning id into v_id;

  if v_id is not null then
    return jsonb_build_object('id', v_id, 'created', true, 'tied', v_has_phone,
      'lead_id', p_lead, 'summary', p_patch->>'summary');
  end if;

  -- The row already exists. Lock it so events for the same call apply one at a time.
  select id, nullif(contact_phone, ''), related_lead_id
    into v_id, v_phone, v_lead
  from public.communications
  where channel = 'call' and metadata->>'call_id' = p_call_id
  for update;

  if v_id is null then
    return jsonb_build_object('id', null, 'created', false, 'tied', false, 'lead_id', null, 'summary', null);
  end if;

  v_tied := v_phone is null and v_has_phone;

  update public.communications c set
    metadata = coalesce(c.metadata, '{}'::jsonb) || coalesce(p_patch, '{}'::jsonb)
      || case when v_phone is not null or v_has_phone
              then jsonb_build_object('pending_party', false) else '{}'::jsonb end,
    body = case
      when nullif(p_summary_body, '') is not null then p_summary_body
      when (c.body is null or c.body in ('[Call]', '[Missed call]')) and p_default_body is not null then p_default_body
      else c.body end,
    duration_seconds = nullif(greatest(coalesce(c.duration_seconds, 0), coalesce(p_duration, 0)), 0),
    direction = coalesce(p_direction, c.direction),
    contact_phone = coalesce(v_phone, nullif(p_phone, '')),
    related_lead_id = coalesce(c.related_lead_id, p_lead),
    contact_name = case when c.related_lead_id is null and p_lead is not null
                        then coalesce(c.contact_name, p_name) else c.contact_name end,
    contact_email = case when c.related_lead_id is null and p_lead is not null
                         then coalesce(c.contact_email, p_email) else c.contact_email end
  where c.id = v_id
  returning c.metadata->>'summary' into v_summary;

  return jsonb_build_object('id', v_id, 'created', false, 'tied', v_tied,
    'lead_id', coalesce(v_lead, p_lead), 'summary', v_summary);
end
$$;

revoke all on function public.upsert_call_event(text, jsonb, text, text, integer, text, text, uuid, text, text) from public, anon, authenticated;
grant execute on function public.upsert_call_event(text, jsonb, text, text, integer, text, text, uuid, text, text) to service_role;