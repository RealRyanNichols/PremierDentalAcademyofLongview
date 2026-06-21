-- Skills Lab progress persistence (cross-device).
-- Apply via: https://supabase.com/dashboard/project/lmbsuwslsycukynzpzik/sql/new
--
-- Skills Lab progress (student profile, quiz attempts, competency passport) used
-- to live only in the browser's localStorage, so it never followed a student to
-- another device. This stores the whole Skills Lab state as one row per student.
-- The client keeps using localStorage as the instant, offline-friendly cache and
-- writes through to this row when the student is signed in (see
-- assets/skills-lab/sync.js). One JSONB row per student mirrors the simple
-- localStorage shape and makes the write-through trivially correct (upsert on
-- the student_id primary key).

CREATE TABLE IF NOT EXISTS skills_lab_progress (
  student_id   UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  student      JSONB NOT NULL DEFAULT '{}'::jsonb,   -- { name, gradDate }
  attempts     JSONB NOT NULL DEFAULT '[]'::jsonb,   -- QuizAttempt[]  (most recent last)
  competencies JSONB NOT NULL DEFAULT '{}'::jsonb,   -- { [skillId]: { status, date, reflection, note } }
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE skills_lab_progress ENABLE ROW LEVEL SECURITY;

-- A student can only ever read/write their own row (same pattern as pp_patients).
DROP POLICY IF EXISTS "students manage own skills-lab progress" ON skills_lab_progress;
CREATE POLICY "students manage own skills-lab progress"
  ON skills_lab_progress FOR ALL
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);
