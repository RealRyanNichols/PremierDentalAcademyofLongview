-- Adds the missing index on the main per-lead history join path.
-- Additive and reversible. Apply only with Amanda's approval.
create index concurrently if not exists communications_related_lead_id_idx
  on public.communications (related_lead_id);
-- Rollback: drop index concurrently if exists public.communications_related_lead_id_idx;
