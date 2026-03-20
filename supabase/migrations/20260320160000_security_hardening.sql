-- ═══════════════════════════════════════════════════════════════════
-- Security Hardening — Patch for issues found during security review
-- ═══════════════════════════════════════════════════════════════════
--
-- This migration fixes vulnerabilities identified across existing
-- migrations. All statements are idempotent and safe to re-run.
-- Wrapped in a transaction — any error rolls back all changes.
-- ═══════════════════════════════════════════════════════════════════

BEGIN;


-- ═══════════════════════════════════════════════════════════════════
-- CRITICAL: Resume storage — restrict read to authenticated only
-- (anon could previously read all resumes = PII exposure)
-- ═══════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Anyone can read resumes" ON storage.objects;
DROP POLICY IF EXISTS "Auth users can read resumes" ON storage.objects;
CREATE POLICY "Auth users can read resumes"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'resumes');

-- CRITICAL: Resume storage — add path scoping to uploads
-- (anon could previously upload anywhere in the bucket)
DROP POLICY IF EXISTS "Anyone can upload resumes" ON storage.objects;
CREATE POLICY "Anyone can upload resumes"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    bucket_id = 'resumes'
    AND (storage.foldername(name))[1] = 'applications'
  );


-- ═══════════════════════════════════════════════════════════════════
-- HIGH: Anon policies missing deleted_at IS NULL
-- (soft-deleted records were visible to landing page visitors)
-- ═══════════════════════════════════════════════════════════════════

-- Announcements
DROP POLICY IF EXISTS "Anyone can read active announcements" ON announcements;
CREATE POLICY "Anyone can read active announcements" ON announcements
  FOR SELECT TO anon
  USING ((expires_at IS NULL OR expires_at >= current_date) AND deleted_at IS NULL);

-- Gallery
DROP POLICY IF EXISTS "Anyone can read visible gallery" ON gallery_items;
CREATE POLICY "Anyone can read visible gallery" ON gallery_items
  FOR SELECT TO anon
  USING (is_visible = true AND deleted_at IS NULL);

-- Testimonials
DROP POLICY IF EXISTS "Anyone reads visible testimonials" ON testimonials;
CREATE POLICY "Anyone reads visible testimonials" ON testimonials
  FOR SELECT TO anon
  USING (is_visible = true AND deleted_at IS NULL);

-- Art wall
DROP POLICY IF EXISTS "Anyone can read visible art_wall" ON art_wall;
CREATE POLICY "Anyone can read visible art_wall" ON art_wall
  FOR SELECT TO anon
  USING (is_visible = true AND deleted_at IS NULL);


-- ═══════════════════════════════════════════════════════════════════
-- HIGH: Dashboard RPC functions — revoke anon EXECUTE
-- (anon could call via PostgREST and extract financial/PII data)
-- ═══════════════════════════════════════════════════════════════════

-- Add SECURITY INVOKER + search_path to all functions
CREATE OR REPLACE FUNCTION dashboard_attendance_summary(p_start_date date, p_end_date date)
RETURNS jsonb LANGUAGE sql STABLE
SECURITY INVOKER SET search_path = public
AS $$
  SELECT COALESCE(jsonb_object_agg(status, cnt), '{}'::jsonb)
  FROM (
    SELECT status, COUNT(*) AS cnt
    FROM attendance
    WHERE date >= p_start_date AND date <= p_end_date AND deleted_at IS NULL
    GROUP BY status
  ) sub;
$$;

CREATE OR REPLACE FUNCTION dashboard_attendance_trend(p_start_date date, p_end_date date)
RETURNS TABLE(month text, total bigint, present bigint, rate int)
LANGUAGE sql STABLE
SECURITY INVOKER SET search_path = public
AS $$
  SELECT
    to_char(date, 'YYYY-MM') AS month,
    COUNT(*) AS total,
    COUNT(*) FILTER (WHERE status IN ('present', 'late')) AS present,
    CASE WHEN COUNT(*) > 0
      THEN ROUND(COUNT(*) FILTER (WHERE status IN ('present', 'late'))::numeric / COUNT(*)::numeric * 100)::int
      ELSE 0
    END AS rate
  FROM attendance
  WHERE date >= p_start_date AND date <= p_end_date AND deleted_at IS NULL
  GROUP BY to_char(date, 'YYYY-MM')
  ORDER BY month;
$$;

CREATE OR REPLACE FUNCTION dashboard_fees_summary(p_start_date date DEFAULT NULL, p_end_date date DEFAULT NULL)
RETURNS jsonb LANGUAGE sql STABLE
SECURITY INVOKER SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'total_owed', COALESCE(SUM(amount_owed), 0),
    'total_paid', COALESCE(SUM(amount_paid), 0),
    'total_outstanding', COALESCE(SUM(CASE WHEN status NOT IN ('paid', 'waived') THEN amount_owed - COALESCE(discount_amount, 0) - amount_paid ELSE 0 END), 0),
    'overdue_count', COUNT(*) FILTER (WHERE status IN ('unpaid', 'partial') AND due_date IS NOT NULL AND due_date < CURRENT_DATE)
  )
  FROM fee_records
  WHERE deleted_at IS NULL
    AND (p_start_date IS NULL OR due_date >= p_start_date)
    AND (p_end_date IS NULL OR due_date <= p_end_date);
$$;

CREATE OR REPLACE FUNCTION dashboard_fees_trend(p_start_date date, p_end_date date)
RETURNS TABLE(month text, owed numeric, collected numeric)
LANGUAGE sql STABLE
SECURITY INVOKER SET search_path = public
AS $$
  SELECT
    to_char(due_date, 'YYYY-MM') AS month,
    SUM(amount_owed) AS owed,
    SUM(amount_paid) AS collected
  FROM fee_records
  WHERE deleted_at IS NULL AND due_date >= p_start_date AND due_date <= p_end_date
  GROUP BY to_char(due_date, 'YYYY-MM')
  ORDER BY month;
$$;

CREATE OR REPLACE FUNCTION dashboard_birthdays_today(p_month int, p_day int, p_limit int DEFAULT 20)
RETURNS TABLE(id uuid, full_name text, photo_url text, class_name text, date_of_birth date)
LANGUAGE sql STABLE
SECURITY INVOKER SET search_path = public
AS $$
  SELECT s.id, s.full_name, s.photo_url, c.name AS class_name, s.date_of_birth
  FROM students s
  LEFT JOIN classrooms c ON c.id = s.class_id
  WHERE EXTRACT(MONTH FROM s.date_of_birth) = p_month
    AND EXTRACT(DAY FROM s.date_of_birth) = p_day
    AND s.deleted_at IS NULL AND s.status = 'active'
  ORDER BY s.full_name
  LIMIT LEAST(p_limit, 100);
$$;

CREATE OR REPLACE FUNCTION dashboard_birthday_count(p_month int, p_day int)
RETURNS bigint LANGUAGE sql STABLE
SECURITY INVOKER SET search_path = public
AS $$
  SELECT COUNT(*)
  FROM students
  WHERE EXTRACT(MONTH FROM date_of_birth) = p_month
    AND EXTRACT(DAY FROM date_of_birth) = p_day
    AND deleted_at IS NULL AND status = 'active';
$$;

CREATE OR REPLACE FUNCTION dashboard_class_student_counts(p_class_ids uuid[])
RETURNS TABLE(class_id uuid, student_count bigint)
LANGUAGE sql STABLE
SECURITY INVOKER SET search_path = public
AS $$
  SELECT class_id, COUNT(*) AS student_count
  FROM students
  WHERE class_id = ANY(p_class_ids)
    AND deleted_at IS NULL AND status = 'active'
  GROUP BY class_id;
$$;

CREATE OR REPLACE FUNCTION dashboard_active_student_count()
RETURNS bigint LANGUAGE sql STABLE
SECURITY INVOKER SET search_path = public
AS $$
  SELECT COUNT(*)
  FROM students
  WHERE deleted_at IS NULL AND status = 'active';
$$;

-- Revoke public (anon) access, grant only to authenticated
REVOKE EXECUTE ON FUNCTION dashboard_attendance_summary(date, date) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION dashboard_attendance_trend(date, date) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION dashboard_fees_summary(date, date) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION dashboard_fees_trend(date, date) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION dashboard_birthdays_today(int, int, int) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION dashboard_birthday_count(int, int) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION dashboard_class_student_counts(uuid[]) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION dashboard_active_student_count() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION dashboard_attendance_summary(date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION dashboard_attendance_trend(date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION dashboard_fees_summary(date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION dashboard_fees_trend(date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION dashboard_birthdays_today(int, int, int) TO authenticated;
GRANT EXECUTE ON FUNCTION dashboard_birthday_count(int, int) TO authenticated;
GRANT EXECUTE ON FUNCTION dashboard_class_student_counts(uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION dashboard_active_student_count() TO authenticated;


-- ═══════════════════════════════════════════════════════════════════
-- HIGH: Job applications — restrict anon INSERT to published postings
-- ═══════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Public submit applications" ON job_applications;
CREATE POLICY "Public submit applications" ON job_applications
  FOR INSERT TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM job_postings
      WHERE id = posting_id
        AND status = 'published'
        AND deleted_at IS NULL
    )
  );


-- ═══════════════════════════════════════════════════════════════════
-- MEDIUM: Careers indexes — add deleted_at IS NULL partial predicate
-- ═══════════════════════════════════════════════════════════════════

DROP INDEX IF EXISTS idx_job_postings_status;
CREATE INDEX IF NOT EXISTS idx_job_postings_status ON job_postings(status) WHERE deleted_at IS NULL;

DROP INDEX IF EXISTS idx_job_applications_posting;
CREATE INDEX IF NOT EXISTS idx_job_applications_posting ON job_applications(posting_id) WHERE deleted_at IS NULL;

DROP INDEX IF EXISTS idx_job_applications_status;
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON job_applications(status) WHERE deleted_at IS NULL;


-- ═══════════════════════════════════════════════════════════════════
-- MEDIUM: Inquiries — drop policy before altering columns it depends on
-- (recreated AFTER the ALTER TABLE block below)
-- ═══════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Anyone can submit an inquiry" ON inquiries;


-- ═══════════════════════════════════════════════════════════════════
-- MEDIUM: Audit columns — change TEXT to UUID for type safety
-- All audit columns store Supabase Auth UUIDs; TEXT is too permissive.
-- ═══════════════════════════════════════════════════════════════════

-- students
ALTER TABLE students
  ALTER COLUMN created_by TYPE UUID USING created_by::UUID,
  ALTER COLUMN modified_by TYPE UUID USING modified_by::UUID,
  ALTER COLUMN deleted_by TYPE UUID USING deleted_by::UUID;

-- classrooms
ALTER TABLE classrooms
  ALTER COLUMN created_by TYPE UUID USING created_by::UUID,
  ALTER COLUMN modified_by TYPE UUID USING modified_by::UUID,
  ALTER COLUMN deleted_by TYPE UUID USING deleted_by::UUID;

-- attendance
ALTER TABLE attendance
  ALTER COLUMN created_by TYPE UUID USING created_by::UUID,
  ALTER COLUMN modified_by TYPE UUID USING modified_by::UUID,
  ALTER COLUMN deleted_by TYPE UUID USING deleted_by::UUID;

-- gallery_items
ALTER TABLE gallery_items
  ALTER COLUMN created_by TYPE UUID USING created_by::UUID,
  ALTER COLUMN modified_by TYPE UUID USING modified_by::UUID,
  ALTER COLUMN deleted_by TYPE UUID USING deleted_by::UUID;

-- announcements
ALTER TABLE announcements
  ALTER COLUMN created_by TYPE UUID USING created_by::UUID,
  ALTER COLUMN modified_by TYPE UUID USING modified_by::UUID,
  ALTER COLUMN deleted_by TYPE UUID USING deleted_by::UUID;

-- document_numbering
ALTER TABLE document_numbering
  ALTER COLUMN created_by TYPE UUID USING created_by::UUID,
  ALTER COLUMN modified_by TYPE UUID USING modified_by::UUID;

-- fee_plans
ALTER TABLE fee_plans
  ALTER COLUMN created_by TYPE UUID USING created_by::UUID,
  ALTER COLUMN modified_by TYPE UUID USING modified_by::UUID,
  ALTER COLUMN deleted_by TYPE UUID USING deleted_by::UUID;

-- fee_records
ALTER TABLE fee_records
  ALTER COLUMN created_by TYPE UUID USING created_by::UUID,
  ALTER COLUMN modified_by TYPE UUID USING modified_by::UUID,
  ALTER COLUMN deleted_by TYPE UUID USING deleted_by::UUID;

-- testimonials
ALTER TABLE testimonials
  ALTER COLUMN created_by TYPE UUID USING created_by::UUID,
  ALTER COLUMN modified_by TYPE UUID USING modified_by::UUID,
  ALTER COLUMN deleted_by TYPE UUID USING deleted_by::UUID;

-- art_wall
ALTER TABLE art_wall
  ALTER COLUMN created_by TYPE UUID USING created_by::UUID,
  ALTER COLUMN modified_by TYPE UUID USING modified_by::UUID,
  ALTER COLUMN deleted_by TYPE UUID USING deleted_by::UUID;

-- inquiries
ALTER TABLE inquiries
  ALTER COLUMN modified_by TYPE UUID USING modified_by::UUID,
  ALTER COLUMN deleted_by TYPE UUID USING deleted_by::UUID;

-- daily_reports
ALTER TABLE daily_reports
  ALTER COLUMN created_by TYPE UUID USING created_by::UUID,
  ALTER COLUMN modified_by TYPE UUID USING modified_by::UUID,
  ALTER COLUMN deleted_by TYPE UUID USING deleted_by::UUID;

-- parent_students
ALTER TABLE parent_students
  ALTER COLUMN deleted_by TYPE UUID USING deleted_by::UUID;

-- parents
ALTER TABLE parents
  ALTER COLUMN created_by TYPE UUID USING created_by::UUID,
  ALTER COLUMN modified_by TYPE UUID USING modified_by::UUID,
  ALTER COLUMN deleted_by TYPE UUID USING deleted_by::UUID;

-- school_info
ALTER TABLE school_info
  ALTER COLUMN created_by TYPE UUID USING created_by::UUID,
  ALTER COLUMN modified_by TYPE UUID USING modified_by::UUID;

-- portfolio_entries
ALTER TABLE portfolio_entries
  ALTER COLUMN created_by TYPE UUID USING created_by::UUID,
  ALTER COLUMN modified_by TYPE UUID USING modified_by::UUID,
  ALTER COLUMN deleted_by TYPE UUID USING deleted_by::UUID;

-- portfolio_reports
ALTER TABLE portfolio_reports
  ALTER COLUMN created_by TYPE UUID USING created_by::UUID,
  ALTER COLUMN modified_by TYPE UUID USING modified_by::UUID;

-- student_medical
ALTER TABLE student_medical
  ALTER COLUMN created_by TYPE UUID USING created_by::UUID,
  ALTER COLUMN modified_by TYPE UUID USING modified_by::UUID,
  ALTER COLUMN deleted_by TYPE UUID USING deleted_by::UUID;

-- incidents
ALTER TABLE incidents
  ALTER COLUMN created_by TYPE UUID USING created_by::UUID,
  ALTER COLUMN modified_by TYPE UUID USING modified_by::UUID,
  ALTER COLUMN deleted_by TYPE UUID USING deleted_by::UUID;


-- ═══════════════════════════════════════════════════════════════════
-- MEDIUM: Inquiries — recreate policy after column type change
-- ═══════════════════════════════════════════════════════════════════

CREATE POLICY "Anyone can submit an inquiry" ON inquiries
  FOR INSERT TO anon
  WITH CHECK (deleted_at IS NULL AND modified_by IS NULL AND status = 'new');

COMMIT;
