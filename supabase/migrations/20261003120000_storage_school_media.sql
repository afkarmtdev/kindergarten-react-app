-- ═══════════════════════════════════════════════════════════════════
-- Storage — school-media bucket (replaces school-logo for new uploads)
-- ═══════════════════════════════════════════════════════════════════
--
-- Holds everything the school uploads for its website: the logo, the
-- principal / Our Story / team photos, and the hero video. "school-logo"
-- undersold that, so new uploads go here.
--
-- Creates the bucket itself, so no dashboard step is needed:
--   public             true    landing page visitors are not logged in
--   file_size_limit    25 MB   above the app's 20 MB hero video check, so
--                              the app's own error message fires first
--   allowed_mime_types image/jpeg (every photo is re-encoded to JPEG by
--                              the crop/compress step), video/mp4, video/webm
--
-- The school-logo bucket and its policies stay: URLs already saved in
-- school_info point at it. Public only opens reads; uploads, replacements
-- and deletes are limited to signed-in admins by the policies below.
-- ═══════════════════════════════════════════════════════════════════

BEGIN;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'school-media',
  'school-media',
  true,
  26214400,
  ARRAY['image/jpeg', 'video/mp4', 'video/webm']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Upload: authenticated only (admin)
DROP POLICY IF EXISTS "Auth users can upload school media" ON storage.objects;
CREATE POLICY "Auth users can upload school media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'school-media');

-- Read: anyone (landing page, portal, receipts)
DROP POLICY IF EXISTS "Anyone can read school media" ON storage.objects;
CREATE POLICY "Anyone can read school media"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'school-media');

-- Update: authenticated only (admin replaces a file)
DROP POLICY IF EXISTS "Auth users can update school media" ON storage.objects;
CREATE POLICY "Auth users can update school media"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'school-media');

-- Delete: authenticated only (admin removes a file)
DROP POLICY IF EXISTS "Auth users can delete school media" ON storage.objects;
CREATE POLICY "Auth users can delete school media"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'school-media');

COMMIT;
