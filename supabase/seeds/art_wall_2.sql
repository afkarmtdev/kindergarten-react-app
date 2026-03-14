-- Seed art_wall with 8 additional placeholder images (batch 2)
-- Uses picsum.photos for random placeholder images
-- Delete these after testing: DELETE FROM art_wall WHERE caption LIKE '[SEED]%';

INSERT INTO art_wall (photo_url, caption, student_name, artwork_date, display_order, is_visible, tilt_angle) VALUES
  ('https://picsum.photos/seed/art13/400/400', '[SEED] My superhero', 'Danish Haikal', '2026-01-30', 13, true, -5),
  ('https://picsum.photos/seed/art14/400/400', '[SEED] Ocean waves', 'Sofea Nabila', '2026-01-28', 14, true, 7),
  ('https://picsum.photos/seed/art15/400/400', '[SEED] Jungle explorer', 'Mikhail Yusof', '2026-01-25', 15, true, -11),
  ('https://picsum.photos/seed/art16/400/400', '[SEED] Birthday cake', 'Nur Batrisyia', '2026-01-22', 16, true, 4),
  ('https://picsum.photos/seed/art17/400/400', '[SEED] Football match', 'Razif Amsyar', '2026-01-20', 17, true, -8),
  ('https://picsum.photos/seed/art18/400/400', '[SEED] Colouring the sky', 'Insyirah Liana', '2026-01-18', 18, true, 10),
  ('https://picsum.photos/seed/art19/400/400', '[SEED] Under the sea', 'Hafiy Zarif', '2026-01-15', 19, true, -3),
  ('https://picsum.photos/seed/art20/400/400', '[SEED] My dream house', 'Amira Syazwani', '2026-01-12', 20, true, 6);
