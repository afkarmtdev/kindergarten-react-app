-- ═══════════════════════════════════════════════════════════════════
-- Storage Policies — school-logo bucket
-- ═══════════════════════════════════════════════════════════════════
--
-- Bucket must be created manually in Supabase dashboard (public).
-- Anon read needed — landing page displays the school logo.
-- ═══════════════════════════════════════════════════════════════════

BEGIN;

-- Upload: authenticated only (admin)
DROP POLICY IF EXISTS "Auth users can upload school logo" ON storage.objects;
CREATE POLICY "Auth users can upload school logo"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'school-logo');

-- Read: anyone (landing page, portal, receipts)
DROP POLICY IF EXISTS "Anyone can read school logo" ON storage.objects;
CREATE POLICY "Anyone can read school logo"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'school-logo');

-- Update: authenticated only (admin replaces logo)
DROP POLICY IF EXISTS "Auth users can update school logo" ON storage.objects;
CREATE POLICY "Auth users can update school logo"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'school-logo');

-- Delete: authenticated only (admin removes logo)
DROP POLICY IF EXISTS "Auth users can delete school logo" ON storage.objects;
CREATE POLICY "Auth users can delete school logo"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'school-logo');

COMMIT;
