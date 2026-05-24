CREATE TABLE IF NOT EXISTS transcript_students (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name          TEXT NOT NULL,
  student_no    TEXT DEFAULT '',
  year_group    TEXT DEFAULT '',
  academic_year TEXT DEFAULT '',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transcript_courses (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id     UUID NOT NULL REFERENCES transcript_students(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  half_year_avg  DECIMAL(5,2),
  teaching_hours DECIMAL(4,1) NOT NULL DEFAULT 1,
  final_avg      DECIMAL(5,2),
  sort_order     INT DEFAULT 0
);
