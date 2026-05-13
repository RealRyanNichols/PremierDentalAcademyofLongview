-- ============================================================
-- PDA Simulator persistence tables
-- Apply via: https://supabase.com/dashboard/project/lmbsuwslsycukynzpzik/sql/new
-- ============================================================

-- Per-student fictional patient roster (shared schema for both
-- Practice Pro and ChairSide; the `app` column distinguishes them).
CREATE TABLE IF NOT EXISTS pp_patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  app TEXT CHECK (app IN ('practice_pro','chairside')),
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE pp_patients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "students see own patients" ON pp_patients;
CREATE POLICY "students see own patients"
  ON pp_patients FOR ALL
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);
CREATE INDEX IF NOT EXISTS pp_patients_student_app_idx
  ON pp_patients (student_id, app);

-- Track which procedures the student has practiced.
CREATE TABLE IF NOT EXISTS pp_practice_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  app TEXT,
  action TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE pp_practice_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "students log own actions" ON pp_practice_log;
CREATE POLICY "students log own actions"
  ON pp_practice_log FOR ALL
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);
CREATE INDEX IF NOT EXISTS pp_practice_log_student_idx
  ON pp_practice_log (student_id, created_at DESC);

-- Instructor-authored scenarios (snapshot a patient state for student practice).
CREATE TABLE IF NOT EXISTS pp_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  app TEXT CHECK (app IN ('practice_pro','chairside')),
  title TEXT NOT NULL,
  description TEXT,
  data JSONB NOT NULL,
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE pp_scenarios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anyone reads public scenarios" ON pp_scenarios;
CREATE POLICY "anyone reads public scenarios"
  ON pp_scenarios FOR SELECT
  USING (is_public = TRUE OR auth.uid() = author_id);
DROP POLICY IF EXISTS "authors manage their scenarios" ON pp_scenarios;
CREATE POLICY "authors manage their scenarios"
  ON pp_scenarios FOR ALL
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);
