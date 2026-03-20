-- ═══════════════════════════════════════════════════════════════════
-- 008 — Careers: Job Postings + Applications
-- ═══════════════════════════════════════════════════════════════════

-- Job Postings
CREATE TABLE IF NOT EXISTS job_postings (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title         TEXT NOT NULL,
  type          TEXT NOT NULL DEFAULT 'full_time'
                CHECK (type IN ('full_time','part_time','internship','contract')),
  department    TEXT,
  description   TEXT NOT NULL,
  requirements  TEXT,
  salary_min    NUMERIC(10,2),
  salary_max    NUMERIC(10,2),
  status        TEXT NOT NULL DEFAULT 'draft'
                CHECK (status IN ('draft','published','closed')),
  display_order INT DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT now(),
  created_by    UUID,
  modified_at   TIMESTAMPTZ,
  modified_by   UUID,
  deleted_at    TIMESTAMPTZ,
  deleted_by    UUID
);

CREATE INDEX IF NOT EXISTS idx_job_postings_status ON job_postings(status);

-- Job Applications
CREATE TABLE IF NOT EXISTS job_applications (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  posting_id      UUID NOT NULL REFERENCES job_postings(id),
  applicant_name  TEXT NOT NULL,
  email           TEXT NOT NULL,
  phone           TEXT NOT NULL,
  resume_url      TEXT,
  cover_message   TEXT,
  status          TEXT NOT NULL DEFAULT 'new'
                  CHECK (status IN ('new','reviewed','interviewed','hired','rejected')),
  created_at      TIMESTAMPTZ DEFAULT now(),
  created_by      UUID,
  modified_at     TIMESTAMPTZ,
  modified_by     UUID,
  deleted_at      TIMESTAMPTZ,
  deleted_by      UUID
);

CREATE INDEX IF NOT EXISTS idx_job_applications_posting ON job_applications(posting_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status  ON job_applications(status);

-- RLS
ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Auth users manage postings" ON job_postings;
CREATE POLICY "Auth users manage postings" ON job_postings FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Public read published postings" ON job_postings;
CREATE POLICY "Public read published postings" ON job_postings FOR SELECT TO anon USING (status = 'published' AND deleted_at IS NULL);

ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Auth users manage applications" ON job_applications;
CREATE POLICY "Auth users manage applications" ON job_applications FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Public submit applications" ON job_applications;
CREATE POLICY "Public submit applications" ON job_applications FOR INSERT TO anon WITH CHECK (true);
