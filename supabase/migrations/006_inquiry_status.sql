-- Migration: Add status column to inquiries table
-- Values: 'new' (default), 'contacted', 'enrolled', 'closed'

BEGIN;

ALTER TABLE inquiries
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'contacted', 'enrolled', 'closed'));

-- Backfill: all existing inquiries are 'new'
UPDATE inquiries SET status = 'new' WHERE status IS NULL;

-- Add audit columns for status changes (modified_at, modified_by)
ALTER TABLE inquiries
  ADD COLUMN IF NOT EXISTS modified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS modified_by UUID;

-- Index for filtering by status
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries (status);

COMMIT;
