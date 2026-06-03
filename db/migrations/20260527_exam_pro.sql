-- ============================================================
-- Exam Pro: entitlement flag + premium question bank
-- Apply via: https://supabase.com/dashboard/project/lmbsuwslsycukynzpzik/sql/new
-- (Already applied to the live project; this file keeps the repo reproducible.)
-- ============================================================

-- Entitlement flag. Pro access is granted to enrolled students
-- (profiles.program <> 'preview'), admins, or anyone with this flag set.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS exam_pro BOOLEAN DEFAULT FALSE;

-- Premium practice questions, served only to Pro users (gated by RLS below).
CREATE TABLE IF NOT EXISTS exam_questions_pro (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic TEXT NOT NULL,
  question TEXT NOT NULL,
  options JSONB NOT NULL,        -- array of answer strings
  answer INTEGER NOT NULL,       -- 0-based index into options
  explanation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE exam_questions_pro ENABLE ROW LEVEL SECURITY;

-- Read access only for Pro users; never expose the bank to anon visitors.
DROP POLICY IF EXISTS "exam_pro_read" ON exam_questions_pro;
CREATE POLICY "exam_pro_read"
  ON exam_questions_pro FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
      AND (p.exam_pro = TRUE OR p.is_admin = TRUE
           OR (p.program IS NOT NULL AND p.program <> 'preview'))
  ));

-- NOTE: the premium questions themselves are seeded separately as content
-- (30 rows across 11 topics at launch); they are not part of this schema migration.
