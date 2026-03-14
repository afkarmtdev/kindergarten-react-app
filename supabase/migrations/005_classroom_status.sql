-- Migration: Add academic_year and status columns to classrooms table

ALTER TABLE classrooms
  ADD COLUMN IF NOT EXISTS academic_year TEXT NOT NULL DEFAULT '2026',
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'graduated'));

-- Index for filtering by status
CREATE INDEX IF NOT EXISTS idx_classrooms_status ON classrooms (status);
