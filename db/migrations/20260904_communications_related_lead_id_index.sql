-- Adds the missing index on the main per-lead history join path.
-- Additive and reversible. Approved by Amanda and applied 2026-09-05.
-- (Plain CREATE INDEX, not CONCURRENTLY: the table is ~6k rows so the build is
-- instant, and the Supabase migration runner wraps statements in a transaction.)
create index if not exists communications_related_lead_id_idx
  on public.communications (related_lead_id);
-- Rollback: drop index if exists public.communications_related_lead_id_idx;
