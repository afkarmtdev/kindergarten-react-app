-- ═══════════════════════════════════════════════════════════════════
-- Storage Policies — resumes bucket
-- ═══════════════════════════════════════════════════════════════════
-- Bucket must be created manually in Supabase dashboard (public).
-- This migration adds RLS policies for the resumes bucket.
--
-- Access model:
--   - Anon users can upload (public applicants submitting resumes)
--   - Anyone can read (public URLs for admin download)
--   - Authenticated users can update/delete (admin management)
-- ═══════════════════════════════════════════════════════════════════

-- Upload: anon (public applicants) + authenticated (admin)
DROP POLICY IF EXISTS "Anyone can upload resumes" ON storage.objects;
CREATE POLICY "Anyone can upload resumes"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'resumes');

-- Read: anyone (public URLs)
DROP POLICY IF EXISTS "Anyone can read resumes" ON storage.objects;
CREATE POLICY "Anyone can read resumes"
  ON storage.objects FOR SELECT
  TO anon, authenticated
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
