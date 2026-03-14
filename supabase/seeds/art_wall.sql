-- Seed art_wall with 12 placeholder images for visual testing
-- Uses picsum.photos for random placeholder images
-- Delete these after testing: DELETE FROM art_wall WHERE caption LIKE '[SEED]%';

INSERT INTO art_wall (photo_url, caption, student_name, artwork_date, display_order, is_visible, tilt_angle) VALUES
  ('https://picsum.photos/seed/art1/400/500', '[SEED] Rainbow butterfly', 'Ali bin Ahmad', '2026-03-01', 1, true, -3),
  ('https://picsum.photos/seed/art2/400/300', '[SEED] My family portrait', 'Nurul Aisyah', '2026-03-02', 2, true, 5),
  ('https://picsum.photos/seed/art3/350/450', '[SEED] Dinosaur adventure', 'Muhammad Irfan', '2026-02-28', 3, true, -7),
  ('https://picsum.photos/seed/art4/400/400', '[SEED] Underwater world', 'Siti Fatimah', '2026-02-25', 4, true, 2),
  ('https://picsum.photos/seed/art5/450/350', '[SEED] Space rocket', 'Adam Danish', '2026-02-20', 5, true, -10),
  ('https://picsum.photos/seed/art6/380/480', '[SEED] My pet cat', 'Nur Aliya', '2026-02-18', 6, true, 8),
  ('https://picsum.photos/seed/art7/420/320', '[SEED] Sunny garden', 'Amir Hakimi', '2026-02-15', 7, true, -4),
  ('https://picsum.photos/seed/art8/360/460', '[SEED] Castle in the clouds', 'Puteri Hana', '2026-02-12', 8, true, 12),
  ('https://picsum.photos/seed/art9/400/350', '[SEED] Fire truck', 'Zain Arif', '2026-02-10', 9, true, -6),
  ('https://picsum.photos/seed/art10/440/380', '[SEED] Flower bouquet', 'Maisarah', '2026-02-08', 10, true, 3),
  ('https://picsum.photos/seed/art11/380/500', '[SEED] Robot friend', 'Harith Danial', '2026-02-05', 11, true, -9),
  ('https://picsum.photos/seed/art12/420/420', '[SEED] Rainy day', 'Aisyah Zahra', '2026-02-01', 12, true, 6);

-- Patch tilt_angle for already-inserted seed rows (run this if you ran the INSERT above without tilt_angle)
UPDATE art_wall SET tilt_angle = -3  WHERE caption = '[SEED] Rainbow butterfly';
UPDATE art_wall SET tilt_angle = 5   WHERE caption = '[SEED] My family portrait';
UPDATE art_wall SET tilt_angle = -7  WHERE caption = '[SEED] Dinosaur adventure';
UPDATE art_wall SET tilt_angle = 2   WHERE caption = '[SEED] Underwater world';
UPDATE art_wall SET tilt_angle = -10 WHERE caption = '[SEED] Space rocket';
UPDATE art_wall SET tilt_angle = 8   WHERE caption = '[SEED] My pet cat';
UPDATE art_wall SET tilt_angle = -4  WHERE caption = '[SEED] Sunny garden';
UPDATE art_wall SET tilt_angle = 12  WHERE caption = '[SEED] Castle in the clouds';
UPDATE art_wall SET tilt_angle = -6  WHERE caption = '[SEED] Fire truck';
UPDATE art_wall SET tilt_angle = 3   WHERE caption = '[SEED] Flower bouquet';
UPDATE art_wall SET tilt_angle = -9  WHERE caption = '[SEED] Robot friend';
UPDATE art_wall SET tilt_angle = 6   WHERE caption = '[SEED] Rainy day';
