-- Seed: 3 classrooms + 20 students for visual testing
-- Run AFTER art_wall.sql + art_wall_2.sql to backfill student_id on artwork rows.
--
-- To remove later:
--   DELETE FROM students   WHERE parent_email LIKE '%seed.test%';
--   DELETE FROM classrooms WHERE name IN ('Mawar', 'Melur', 'Kenanga');

BEGIN;

-- ── 3 classrooms ────────────────────────────────────────────────────────────
INSERT INTO classrooms (name, academic_year, teacher_name, capacity)
SELECT * FROM (VALUES
  ('Mawar',   '2026', 'Cikgu Aminah',  15),
  ('Melur',   '2026', 'Cikgu Faridah', 15),
  ('Kenanga', '2026', 'Cikgu Suriani', 20)
) AS v(name, academic_year, teacher_name, capacity)
WHERE NOT EXISTS (SELECT 1 FROM classrooms c WHERE c.name = v.name);

-- ── 20 students linked to classrooms via class_id ───────────────────────────
INSERT INTO students (full_name, date_of_birth, gender, class_id, parent_name, parent_email, parent_phone)
VALUES
  -- Mawar
  ('Ali bin Ahmad',     '2020-04-12', 'male',   (SELECT id FROM classrooms WHERE name = 'Mawar'   LIMIT 1), 'Ahmad bin Yusof',        'ahmad.yusof@seed.test',     '+60123456701'),
  ('Nurul Aisyah',      '2020-08-03', 'female', (SELECT id FROM classrooms WHERE name = 'Mawar'   LIMIT 1), 'Rahimah binti Kadir',    'rahimah.kadir@seed.test',   '+60123456702'),
  ('Muhammad Irfan',    '2019-11-20', 'male',   (SELECT id FROM classrooms WHERE name = 'Mawar'   LIMIT 1), 'Roslan bin Hamid',       'roslan.hamid@seed.test',    '+60123456703'),
  ('Siti Fatimah',      '2020-02-14', 'female', (SELECT id FROM classrooms WHERE name = 'Mawar'   LIMIT 1), 'Zulkifli bin Othman',    'zulkifli.othman@seed.test', '+60123456704'),
  ('Adam Danish',       '2021-01-07', 'male',   (SELECT id FROM classrooms WHERE name = 'Mawar'   LIMIT 1), 'Danish bin Suhaimi',     'danish.suhaimi@seed.test',  '+60123456705'),
  ('Nur Aliya',         '2020-06-25', 'female', (SELECT id FROM classrooms WHERE name = 'Mawar'   LIMIT 1), 'Suhaila binti Noor',     'suhaila.noor@seed.test',    '+60123456706'),

  -- Melur
  ('Amir Hakimi',       '2019-09-15', 'male',   (SELECT id FROM classrooms WHERE name = 'Melur'   LIMIT 1), 'Hakimi bin Razali',      'hakimi.razali@seed.test',   '+60123456707'),
  ('Puteri Hana',       '2020-03-30', 'female', (SELECT id FROM classrooms WHERE name = 'Melur'   LIMIT 1), 'Norzahra binti Ismail',  'norzahra.ismail@seed.test', '+60123456708'),
  ('Zain Arif',         '2021-05-18', 'male',   (SELECT id FROM classrooms WHERE name = 'Melur'   LIMIT 1), 'Arif bin Saad',          'arif.saad@seed.test',       '+60123456709'),
  ('Maisarah',          '2020-10-09', 'female', (SELECT id FROM classrooms WHERE name = 'Melur'   LIMIT 1), 'Fauziah binti Wahab',    'fauziah.wahab@seed.test',   '+60123456710'),
  ('Harith Danial',     '2019-12-01', 'male',   (SELECT id FROM classrooms WHERE name = 'Melur'   LIMIT 1), 'Danial bin Azmi',        'danial.azmi@seed.test',     '+60123456711'),
  ('Aisyah Zahra',      '2020-07-22', 'female', (SELECT id FROM classrooms WHERE name = 'Melur'   LIMIT 1), 'Nabilah binti Zainudin', 'nabilah.zainudin@seed.test','+60123456712'),

  -- Kenanga
  ('Danish Haikal',     '2021-02-11', 'male',   (SELECT id FROM classrooms WHERE name = 'Kenanga' LIMIT 1), 'Haikal bin Mohd Noor',   'haikal.mohd@seed.test',     '+60123456713'),
  ('Sofea Nabila',      '2020-05-04', 'female', (SELECT id FROM classrooms WHERE name = 'Kenanga' LIMIT 1), 'Nabila binti Fauzi',     'nabila.fauzi@seed.test',    '+60123456714'),
  ('Mikhail Yusof',     '2019-08-27', 'male',   (SELECT id FROM classrooms WHERE name = 'Kenanga' LIMIT 1), 'Yusof bin Zainol',       'yusof.zainol@seed.test',    '+60123456715'),
  ('Nur Batrisyia',     '2020-11-16', 'female', (SELECT id FROM classrooms WHERE name = 'Kenanga' LIMIT 1), 'Hafizah binti Salleh',   'hafizah.salleh@seed.test',  '+60123456716'),
  ('Razif Amsyar',      '2021-03-08', 'male',   (SELECT id FROM classrooms WHERE name = 'Kenanga' LIMIT 1), 'Amsyar bin Bakar',       'amsyar.bakar@seed.test',    '+60123456717'),
  ('Insyirah Liana',    '2020-09-19', 'female', (SELECT id FROM classrooms WHERE name = 'Kenanga' LIMIT 1), 'Liana binti Hashim',     'liana.hashim@seed.test',    '+60123456718'),
  ('Hafiy Zarif',       '2019-06-30', 'male',   (SELECT id FROM classrooms WHERE name = 'Kenanga' LIMIT 1), 'Zarif bin Mansor',       'zarif.mansor@seed.test',    '+60123456719'),
  ('Amira Syazwani',    '2020-12-05', 'female', (SELECT id FROM classrooms WHERE name = 'Kenanga' LIMIT 1), 'Syazwani binti Nordin',  'syazwani.nordin@seed.test', '+60123456720');

-- ── Backfill art_wall.student_id by name match (idempotent) ────────────────
UPDATE art_wall a
   SET student_id = s.id
  FROM students s
 WHERE a.student_name = s.full_name
   AND a.student_id IS NULL;

COMMIT;
