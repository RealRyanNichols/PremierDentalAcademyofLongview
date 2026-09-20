-- STAGED — NOT APPLIED. Requires Amanda's approval (updates real lead records).
--
-- Why: /admin/kpi showed 485 leads as "New (uncontacted)". 330 of them HAVE contact on
-- record; the chart read pipeline_stage alone and nobody moves that field by hand.
-- Evidence used (Sep 20, 2026 reconciliation, docs/lead-contact-reconciliation-2026-09-20.md):
--   • leads.last_contact_at already stamped (set by the Quo webhook or admin buttons)  299
--   • a logged human contact in communications matched by lead id / phone / email:
--       Amanda's Quo calls out, admin Call/Text/Note buttons, or the lead calling /
--       texting IN on Quo (a conversation exists)                                    +21
--   • an email SENT from hello@ to the lead (Gmail, Aug 17 + Aug 31 outreach)        +10
-- Automated drips (sms-drip, Resend sequences) are NOT counted as contact.
-- This sets pipeline_stage = 'contacted' and fills a missing last_contact_at with the
-- latest evidence time. It never touches leads that already left "new".
-- Dry run first (the SELECT). Expected: ~330 rows. Rollback at the bottom.

create temp table _reconcile as
with new_leads as (
  select l.id, lower(l.email) as email, l.last_contact_at,
         right(regexp_replace(coalesce(l.phone,''), '\D', '', 'g'), 10) as ph
    from public.leads l
   where l.pipeline_stage = 'new'
), comms as (
  select related_lead_id, lower(contact_email) as em,
         right(regexp_replace(coalesce(contact_phone,''), '\D', '', 'g'), 10) as ph,
         direction, source as csrc, coalesce(occurred_at, created_at) as at
    from public.communications
), evidence as (
  select l.id, l.last_contact_at, l.email,
         max(c.at) filter (where (c.direction = 'outbound' and c.csrc in ('quo','admin_manual'))
                              or (c.direction = 'inbound'  and c.csrc = 'quo')) as evidence_at
    from new_leads l
    left join comms c on (c.related_lead_id = l.id)
                      or (l.ph <> '' and c.ph <> '' and l.ph = c.ph)
                      or (l.email is not null and c.em = l.email)
   group by l.id, l.last_contact_at, l.email
), gmail as (
  -- Emails sent from hello@ (Gmail "Sent"), verified Sep 20, 2026.
  select * from (values
    ('jetercrystal61@gmail.com',      timestamptz '2026-08-31 00:00:55+00'),
    ('creminor1979@gmail.com',        timestamptz '2026-08-17 21:25:10+00'),
    ('monicabrown67@gmail.com',       timestamptz '2026-08-17 21:25:01+00'),
    ('azaleamiller.444@gmail.com',    timestamptz '2026-08-17 21:24:49+00'),
    ('kayla.mitchell5@outlook.com',   timestamptz '2026-08-17 21:24:39+00'),
    ('maycie090@gmail.com',           timestamptz '2026-08-17 21:24:29+00'),
    ('mayteespinoza39@gmail.com',     timestamptz '2026-08-17 21:25:17+00')
  ) as g(email, sent_at)
)
select e.id,
       coalesce(e.last_contact_at, e.evidence_at, g.sent_at) as contact_at,
       case when e.last_contact_at is not null then 'stamped'
            when e.evidence_at is not null then 'communications'
            else 'gmail' end as basis
  from evidence e
  left join gmail g on g.email = e.email
 where e.last_contact_at is not null or e.evidence_at is not null or g.email is not null;

-- DRY RUN — look at this before the UPDATE below.
select basis, count(*) from _reconcile group by basis order by 1;

begin;
update public.leads l
   set pipeline_stage  = 'contacted',
       last_contact_at = coalesce(l.last_contact_at, r.contact_at),
       amanda_notes    = concat_ws(E'\n', l.amanda_notes,
                          '[2026-09-20 reconciliation] moved new → contacted; basis: ' || r.basis)
  from _reconcile r
 where l.id = r.id
   and l.pipeline_stage = 'new';
-- expect: UPDATE ~330
commit;

-- ROLLBACK (same session or later):
-- update public.leads set pipeline_stage = 'new'
--  where amanda_notes like '%[2026-09-20 reconciliation]%' and pipeline_stage = 'contacted';
-- (last_contact_at values filled from evidence are true facts; leave them.)
