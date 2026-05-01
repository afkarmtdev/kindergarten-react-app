-- ═══════════════════════════════════════════════════════════════════
-- Storage Policies — resumes bucket
-- ═══════════════════════════════════════════════════════════════════
-- Bucket must be created manually in Supabase dashboard (PRIVATE).
-- This migration adds RLS policies for the resumes bucket.
--
-- Access model:
--   - Anon users can upload to applications/ folder only (public applicants)
--   - Authenticated users can read (admin downloads via signed URLs)
--   - Authenticated users can update/delete (admin management)
-- ═══════════════════════════════════════════════════════════════════

BEGIN;

-- Upload: anon (public applicants) + authenticated, scoped to applications/ folder
DROP POLICY IF EXISTS "Anyone can upload resumes" ON storage.objects;
CREATE POLICY "Anyone can upload resumes"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    bucket_id = 'resumes'
    AND (storage.foldername(name))[1] = 'applications'
  );

-- Read: authenticated only (admins access via signed URLs)
DROP POLICY IF EXISTS "Anyone can read resumes" ON storage.objects;
DROP POLICY IF EXISTS "Auth users can read resumes" ON storage.objects;
CREATE POLICY "Auth users can read resumes"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'resumes');

-- Update: authenticated only (admin)
DROP POLICY IF EXISTS "Auth users can update resumes" ON storage.objects;
CREATE POLICY "Auth users can update resumes"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'resumes');

-- Delete: authenticated only (admin)
DROP POLICY IF EXISTS "Auth users can delete resumes" ON storage.objects;
CREATE POLICY "Auth users can delete resumes"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'resumes');

COMMIT;
