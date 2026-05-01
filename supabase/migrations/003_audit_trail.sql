-- ============================================================================
-- Migration: Audit Trail + Soft Delete
-- Adds created_by, modified_at, modified_by, deleted_at, deleted_by to all tables
-- ============================================================================

BEGIN;

-- ── Helper: reusable DO block to add audit columns if they don't exist ──────
-- We use a DO block per table to keep it idempotent (safe to re-run).

-- 1. students
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS created_by TEXT,
  ADD COLUMN IF NOT EXISTS modified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS modified_by TEXT,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by TEXT;

CREATE INDEX IF NOT EXISTS idx_students_deleted_at ON students(deleted_at) WHERE deleted_at IS NULL;

-- 2. classrooms
ALTER TABLE classrooms
  ADD COLUMN IF NOT EXISTS created_by TEXT,
  ADD COLUMN IF NOT EXISTS modified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS modified_by TEXT,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by TEXT;

CREATE INDEX IF NOT EXISTS idx_classrooms_deleted_at ON classrooms(deleted_at) WHERE deleted_at IS NULL;

-- 3. attendance
ALTER TABLE attendance
  ADD COLUMN IF NOT EXISTS created_by TEXT,
  ADD COLUMN IF NOT EXISTS modified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS modified_by TEXT,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by TEXT;

CREATE INDEX IF NOT EXISTS idx_attendance_deleted_at ON attendance(deleted_at) WHERE deleted_at IS NULL;

-- 4. gallery_items
ALTER TABLE gallery_items
  ADD COLUMN IF NOT EXISTS created_by TEXT,
  ADD COLUMN IF NOT EXISTS modified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS modified_by TEXT,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by TEXT;

CREATE INDEX IF NOT EXISTS idx_gallery_items_deleted_at ON gallery_items(deleted_at) WHERE deleted_at IS NULL;

-- 5. announcements
ALTER TABLE announcements
  ADD COLUMN IF NOT EXISTS created_by TEXT,
  ADD COLUMN IF NOT EXISTS modified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS modified_by TEXT,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by TEXT;

CREATE INDEX IF NOT EXISTS idx_announcements_deleted_at ON announcements(deleted_at) WHERE deleted_at IS NULL;

-- 6. document_numbering (no delete, but add created_by + modified_by)
ALTER TABLE document_numbering
  ADD COLUMN IF NOT EXISTS created_by TEXT,
  ADD COLUMN IF NOT EXISTS modified_by TEXT;
-- document_numbering already has updated_at; no soft delete needed (config table)

-- 7. fee_plans
ALTER TABLE fee_plans
  ADD COLUMN IF NOT EXISTS created_by TEXT,
  ADD COLUMN IF NOT EXISTS modified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS modified_by TEXT,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by TEXT;

CREATE INDEX IF NOT EXISTS idx_fee_plans_deleted_at ON fee_plans(deleted_at) WHERE deleted_at IS NULL;

-- 8. fee_records
ALTER TABLE fee_records
  ADD COLUMN IF NOT EXISTS created_by TEXT,
  ADD COLUMN IF NOT EXISTS modified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS modified_by TEXT,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by TEXT;

CREATE INDEX IF NOT EXISTS idx_fee_records_deleted_at ON fee_records(deleted_at) WHERE deleted_at IS NULL;

-- 9. school_info (no delete, but add created_by + modified_by)
ALTER TABLE school_info
  ADD COLUMN IF NOT EXISTS created_by TEXT,
  ADD COLUMN IF NOT EXISTS modified_by TEXT;
-- school_info already has updated_at; no soft delete needed (single-row config)

-- 10. testimonials
ALTER TABLE testimonials
  ADD COLUMN IF NOT EXISTS created_by TEXT,
  ADD COLUMN IF NOT EXISTS modified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS modified_by TEXT,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by TEXT;

CREATE INDEX IF NOT EXISTS idx_testimonials_deleted_at ON testimonials(deleted_at) WHERE deleted_at IS NULL;

-- 11. inquiries (no delete, but add soft delete for archiving)
ALTER TABLE inquiries
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by TEXT;

CREATE INDEX IF NOT EXISTS idx_inquiries_deleted_at ON inquiries(deleted_at) WHERE deleted_at IS NULL;

-- 12. art_wall
ALTER TABLE art_wall
  ADD COLUMN IF NOT EXISTS created_by TEXT,
  ADD COLUMN IF NOT EXISTS modified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS modified_by TEXT,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by TEXT;

CREATE INDEX IF NOT EXISTS idx_art_wall_deleted_at ON art_wall(deleted_at) WHERE deleted_at IS NULL;

-- 13. daily_reports
ALTER TABLE daily_reports
  ADD COLUMN IF NOT EXISTS created_by TEXT,
  ADD COLUMN IF NOT EXISTS modified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS modified_by TEXT,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by TEXT;

CREATE INDEX IF NOT EXISTS idx_daily_reports_deleted_at ON daily_reports(deleted_at) WHERE deleted_at IS NULL;

-- 14. portfolio_entries
ALTER TABLE portfolio_entries
  ADD COLUMN IF NOT EXISTS created_by TEXT,
  ADD COLUMN IF NOT EXISTS modified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS modified_by TEXT,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by TEXT;

CREATE INDEX IF NOT EXISTS idx_portfolio_entries_deleted_at ON portfolio_entries(deleted_at) WHERE deleted_at IS NULL;

-- 15. portfolio_reports (no delete route, but add audit columns)
ALTER TABLE portfolio_reports
  ADD COLUMN IF NOT EXISTS created_by TEXT,
  ADD COLUMN IF NOT EXISTS modified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS modified_by TEXT;
-- No soft delete — upsert-only table

-- 16. parents
ALTER TABLE parents
  ADD COLUMN IF NOT EXISTS created_by TEXT,
  ADD COLUMN IF NOT EXISTS modified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS modified_by TEXT,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by TEXT;

CREATE INDEX IF NOT EXISTS idx_parents_deleted_at ON parents(deleted_at) WHERE deleted_at IS NULL;

-- 17. parent_students (junction table — add soft delete for unlinking audit)
ALTER TABLE parent_students
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by TEXT;

CREATE INDEX IF NOT EXISTS idx_parent_students_deleted_at ON parent_students(deleted_at) WHERE deleted_at IS NULL;

-- 18. parent_sessions (no soft delete — sessions are ephemeral, hard delete is fine for logout/revoke)
-- No changes needed.

-- ============================================================================
-- NOTE: Run this migration in Supabase SQL editor BEFORE deploying new code.
-- All columns use IF NOT EXISTS — safe to re-run.
-- ============================================================================

COMMIT;
