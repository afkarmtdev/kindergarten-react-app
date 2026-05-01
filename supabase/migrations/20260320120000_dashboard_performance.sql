-- ═══════════════════════════════════════════════════════════════════
-- 009 — Dashboard Performance: Composite Indexes + RPC Functions
-- ═══════════════════════════════════════════════════════════════════
--
-- Purpose: Moves all admin dashboard aggregation from JavaScript into
-- the database. At 500K+ students the JS approach serialises full
-- table scans over the network; these indexes and RPC functions let
-- PostgreSQL do a single server-side pass and return a small result.
--
-- All statements are idempotent:
--   - Indexes:    CREATE INDEX IF NOT EXISTS
--   - Functions:  CREATE OR REPLACE FUNCTION
-- ═══════════════════════════════════════════════════════════════════

BEGIN;

-- ═══════════════════════════════════════════════════════════════════
-- Section 1: Composite Indexes
-- ═══════════════════════════════════════════════════════════════════

-- Attendance: date + status for summary / trend GROUP BY queries
CREATE INDEX IF NOT EXISTS idx_attendance_date_status
  ON attendance(date, status)
  WHERE deleted_at IS NULL;

-- Fee records: due_date + status for summary / trend aggregation
CREATE INDEX IF NOT EXISTS idx_fee_records_due_date_status
  ON fee_records(due_date, status)
  WHERE deleted_at IS NULL;

-- Students: status for fast active-student COUNT
CREATE INDEX IF NOT EXISTS idx_students_status_active
  ON students(status)
  WHERE deleted_at IS NULL;

-- Students: expression index on month + day for birthday lookups
CREATE INDEX IF NOT EXISTS idx_students_dob_month_day
  ON students (EXTRACT(MONTH FROM date_of_birth), EXTRACT(DAY FROM date_of_birth))
  WHERE deleted_at IS NULL AND status = 'active';

-- Students: class_id for fast per-class counting (active only)
CREATE INDEX IF NOT EXISTS idx_students_class_id_active
  ON students(class_id)
  WHERE deleted_at IS NULL AND status = 'active';


-- ═══════════════════════════════════════════════════════════════════
-- Section 2: RPC Functions
-- ═══════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────
-- Function 1: dashboard_attendance_summary
--
-- Returns a jsonb object mapping each attendance status to its count
-- within the given date range.
--
-- Example return:
--   {"present": 8500, "absent": 300, "late": 150, "excused": 50}
-- ───────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION dashboard_attendance_summary(
  p_start_date date,
  p_end_date   date
)
RETURNS jsonb
LANGUAGE sql STABLE
AS $$
  SELECT COALESCE(
    jsonb_object_agg(status, cnt),
    '{}'::jsonb
  )
  FROM (
    SELECT
      status,
      COUNT(*) AS cnt
    FROM attendance
    WHERE date        >= p_start_date
      AND date        <= p_end_date
      AND deleted_at  IS NULL
    GROUP BY status
  ) sub;
$$;


-- ───────────────────────────────────────────────────────────────────
-- Function 2: dashboard_attendance_trend
--
-- Returns one row per calendar month within the date range with the
-- total records, the present+late count, and the attendance rate
-- rounded to the nearest integer percentage.
-- ───────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION dashboard_attendance_trend(
  p_start_date date,
  p_end_date   date
)
RETURNS TABLE(
  month   text,
  total   bigint,
  present bigint,
  rate    int
)
LANGUAGE sql STABLE
AS $$
  SELECT
    to_char(date, 'YYYY-MM')                                            AS month,
    COUNT(*)                                                            AS total,
    COUNT(*) FILTER (WHERE status IN ('present', 'late'))               AS present,
    CASE
      WHEN COUNT(*) > 0
        THEN ROUND(
               COUNT(*) FILTER (WHERE status IN ('present', 'late'))::numeric
               / COUNT(*)::numeric * 100
             )::int
      ELSE 0
    END                                                                 AS rate
  FROM attendance
  WHERE date       >= p_start_date
    AND date       <= p_end_date
    AND deleted_at IS NULL
  GROUP BY to_char(date, 'YYYY-MM')
  ORDER BY month;
$$;


-- ───────────────────────────────────────────────────────────────────
-- Function 3: dashboard_fees_summary
--
-- Returns a jsonb object with aggregated fee totals and an overdue
-- count. Both date params may be NULL for an all-time summary.
-- ───────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION dashboard_fees_summary(
  p_start_date date DEFAULT NULL,
  p_end_date   date DEFAULT NULL
)
RETURNS jsonb
LANGUAGE sql STABLE
AS $$
  SELECT jsonb_build_object(
    'total_owed',
      COALESCE(SUM(amount_owed), 0),
    'total_paid',
      COALESCE(SUM(amount_paid), 0),
    'total_outstanding',
      COALESCE(
        SUM(
          CASE
            WHEN status NOT IN ('paid', 'waived')
              THEN amount_owed
                   - COALESCE(discount_amount, 0)
                   - amount_paid
            ELSE 0
          END
        ),
        0
      ),
    'overdue_count',
      COUNT(*) FILTER (
        WHERE status   IN ('unpaid', 'partial')
          AND due_date IS NOT NULL
          AND due_date  < CURRENT_DATE
      )
  )
  FROM fee_records
  WHERE deleted_at IS NULL
    AND (p_start_date IS NULL OR due_date >= p_start_date)
    AND (p_end_date   IS NULL OR due_date <= p_end_date);
$$;


-- ───────────────────────────────────────────────────────────────────
-- Function 4: dashboard_fees_trend
--
-- Returns one row per calendar month with total amount owed and total
-- amount collected, grouped by due_date month within the date range.
-- ───────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION dashboard_fees_trend(
  p_start_date date,
  p_end_date   date
)
RETURNS TABLE(
  month     text,
  owed      numeric,
  collected numeric
)
LANGUAGE sql STABLE
AS $$
  SELECT
    to_char(due_date, 'YYYY-MM') AS month,
    SUM(amount_owed)             AS owed,
    SUM(amount_paid)             AS collected
  FROM fee_records
  WHERE deleted_at IS NULL
    AND due_date   >= p_start_date
    AND due_date   <= p_end_date
  GROUP BY to_char(due_date, 'YYYY-MM')
  ORDER BY month;
$$;


-- ───────────────────────────────────────────────────────────────────
-- Function 5: dashboard_birthdays_today
--
-- Returns active students whose birthday month and day match the
-- supplied values, joined with their classroom name.
-- ───────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION dashboard_birthdays_today(
  p_month int,
  p_day   int,
  p_limit int DEFAULT 20
)
RETURNS TABLE(
  id            uuid,
  full_name     text,
  photo_url     text,
  class_name    text,
  date_of_birth date
)
LANGUAGE sql STABLE
AS $$
  SELECT
    s.id,
    s.full_name,
    s.photo_url,
    c.name         AS class_name,
    s.date_of_birth
  FROM students    s
  LEFT JOIN classrooms c ON c.id = s.class_id
  WHERE EXTRACT(MONTH FROM s.date_of_birth) = p_month
    AND EXTRACT(DAY   FROM s.date_of_birth) = p_day
    AND s.deleted_at IS NULL
    AND s.status    = 'active'
  ORDER BY s.full_name
  LIMIT p_limit;
$$;


-- ───────────────────────────────────────────────────────────────────
-- Function 6: dashboard_birthday_count
--
-- Returns the count of active students whose birthday falls on the
-- given month and day. Cheaper than fetching full rows when only the
-- count badge is needed.
-- ───────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION dashboard_birthday_count(
  p_month int,
  p_day   int
)
RETURNS bigint
LANGUAGE sql STABLE
AS $$
  SELECT COUNT(*)
  FROM students
  WHERE EXTRACT(MONTH FROM date_of_birth) = p_month
    AND EXTRACT(DAY   FROM date_of_birth) = p_day
    AND deleted_at IS NULL
    AND status     = 'active';
$$;


-- ───────────────────────────────────────────────────────────────────
-- Function 7: dashboard_class_student_counts
--
-- Returns the active student count for each class_id in the supplied
-- array. Used by the dashboard to show per-class headcounts without
-- N separate queries.
-- ───────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION dashboard_class_student_counts(
  p_class_ids uuid[]
)
RETURNS TABLE(
  class_id      uuid,
  student_count bigint
)
LANGUAGE sql STABLE
AS $$
  SELECT
    class_id,
    COUNT(*) AS student_count
  FROM students
  WHERE class_id   = ANY(p_class_ids)
    AND deleted_at IS NULL
    AND status     = 'active'
  GROUP BY class_id;
$$;


-- ───────────────────────────────────────────────────────────────────
-- Function 8: dashboard_active_student_count
--
-- Returns the total number of active, non-deleted students.
-- Hits idx_students_status_active for a sub-millisecond index scan.
-- ───────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION dashboard_active_student_count()
RETURNS bigint
LANGUAGE sql STABLE
AS $$
  SELECT COUNT(*)
  FROM students
  WHERE deleted_at IS NULL
    AND status     = 'active';
$$;

COMMIT;
