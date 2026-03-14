-- Migration: Add status column to students table
-- Values: 'active' (default), 'graduated', 'inactive'

ALTER TABLE students
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
  CHECK (status IN ('active', 'graduated', 'inactive'));

-- Backfill: all existing students are active
UPDATE students SET status = 'active' WHERE status IS NULL;

-- Index for filtering by status
CREATE INDEX IF NOT EXISTS idx_students_status ON students (status);
