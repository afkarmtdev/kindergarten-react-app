-- Migration: Add landing_content to school_info
-- Stores the school's own landing page copy and identity sections:
-- hero text (EN/BM), Our Story + principal message, stats mode,
-- enabled feature cards, and team members. Shape is validated in
-- backend/src/routes/schoolInfo.ts (PUT /api/school-info/landing).

BEGIN;

ALTER TABLE school_info
  ADD COLUMN IF NOT EXISTS landing_content JSONB;

COMMIT;
