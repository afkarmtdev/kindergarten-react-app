-- Seed 20 students matching the art wall seed data (seeds/art_wall.sql + seeds/art_wall_2.sql)
-- Classes: Mawar (6 students), Melur (6 students), Kenanga (8 students)
-- Delete these after testing: DELETE FROM students WHERE parent_email LIKE '%seed.test%';
--
-- After running this, run the UPDATE block below to link art_wall rows to these students via student_id.

INSERT INTO students (full_name, date_of_birth, gender, class_name, parent_name, parent_email, parent_phone) VALUES
  -- Mawar
  ('Ali bin Ahmad',        '2020-04-12', 'male',   'Mawar',   'Ahmad bin Yusof',         'ahmad.yusof@seed.test',    '+60123456701'),
  ('Nurul Aisyah',         '2020-08-03', 'female', 'Mawar',   'Rahimah binti Kadir',     'rahimah.kadir@seed.test',  '+60123456702'),
  ('Muhammad Irfan',       '2019-11-20', 'male',   'Mawar',   'Roslan bin Hamid',        'roslan.hamid@seed.test',   '+60123456703'),
  ('Siti Fatimah',         '2020-02-14', 'female', 'Mawar',   'Zulkifli bin Othman',     'zulkifli.othman@seed.test','+60123456704'),
  ('Adam Danish',          '2021-01-07', 'male',   'Mawar',   'Danish bin Suhaimi',      'danish.suhaimi@seed.test', '+60123456705'),
  ('Nur Aliya',            '2020-06-25', 'female', 'Mawar',   'Suhaila binti Noor',      'suhaila.noor@seed.test',   '+60123456706'),

  -- Melur
  ('Amir Hakimi',          '2019-09-15', 'male',   'Melur',   'Hakimi bin Razali',       'hakimi.razali@seed.test',  '+60123456707'),
  ('Puteri Hana',          '2020-03-30', 'female', 'Melur',   'Norzahra binti Ismail',   'norzahra.ismail@seed.test','+60123456708'),
  ('Zain Arif',            '2021-05-18', 'male',   'Melur',   'Arif bin Saad',           'arif.saad@seed.test',      '+60123456709'),
  ('Maisarah',             '2020-10-09', 'female', 'Melur',   'Fauziah binti Wahab',     'fauziah.wahab@seed.test',  '+60123456710'),
  ('Harith Danial',        '2019-12-01', 'male',   'Melur',   'Danial bin Azmi',         'danial.azmi@seed.test',    '+60123456711'),
  ('Aisyah Zahra',         '2020-07-22', 'female', 'Melur',   'Nabilah binti Zainudin',  'nabilah.zainudin@seed.test','+60123456712'),

  -- Kenanga
  ('Danish Haikal',        '2021-02-11', 'male',   'Kenanga', 'Haikal bin Mohd Noor',    'haikal.mohd@seed.test',    '+60123456713'),
  ('Sofea Nabila',         '2020-05-04', 'female', 'Kenanga', 'Nabila binti Fauzi',      'nabila.fauzi@seed.test',   '+60123456714'),
  ('Mikhail Yusof',        '2019-08-27', 'male',   'Kenanga', 'Yusof bin Zainol',        'yusof.zainol@seed.test',   '+60123456715'),
  ('Nur Batrisyia',        '2020-11-16', 'female', 'Kenanga', 'Hafizah binti Salleh',    'hafizah.salleh@seed.test', '+60123456716'),
  ('Razif Amsyar',         '2021-03-08', 'male',   'Kenanga', 'Amsyar bin Bakar',        'amsyar.bakar@seed.test',   '+60123456717'),
  ('Insyirah Liana',       '2020-09-19', 'female', 'Kenanga', 'Liana binti Hashim',      'liana.hashim@seed.test',   '+60123456718'),
  ('Hafiy Zarif',          '2019-06-30', 'male',   'Kenanga', 'Zarif bin Mansor',        'zarif.mansor@seed.test',   '+60123456719'),
  ('Amira Syazwani',       '2020-12-05', 'female', 'Kenanga', 'Syazwani binti Nordin',   'syazwani.nordin@seed.test','+60123456720');


-- Link art_wall rows to the inserted students via student_id.
-- Run this AFTER the INSERT above so the students exist.
UPDATE art_wall SET student_id = (SELECT id FROM students WHERE full_name = 'Ali bin Ahmad'       LIMIT 1) WHERE student_name = 'Ali bin Ahmad';
UPDATE art_wall SET student_id = (SELECT id FROM students WHERE full_name = 'Nurul Aisyah'        LIMIT 1) WHERE student_name = 'Nurul Aisyah';
UPDATE art_wall SET student_id = (SELECT id FROM students WHERE full_name = 'Muhammad Irfan'      LIMIT 1) WHERE student_name = 'Muhammad Irfan';
UPDATE art_wall SET student_id = (SELECT id FROM students WHERE full_name = 'Siti Fatimah'        LIMIT 1) WHERE student_name = 'Siti Fatimah';
UPDATE art_wall SET student_id = (SELECT id FROM students WHERE full_name = 'Adam Danish'         LIMIT 1) WHERE student_name = 'Adam Danish';
UPDATE art_wall SET student_id = (SELECT id FROM students WHERE full_name = 'Nur Aliya'           LIMIT 1) WHERE student_name = 'Nur Aliya';
UPDATE art_wall SET student_id = (SELECT id FROM students WHERE full_name = 'Amir Hakimi'         LIMIT 1) WHERE student_name = 'Amir Hakimi';
UPDATE art_wall SET student_id = (SELECT id FROM students WHERE full_name = 'Puteri Hana'         LIMIT 1) WHERE student_name = 'Puteri Hana';
UPDATE art_wall SET student_id = (SELECT id FROM students WHERE full_name = 'Zain Arif'           LIMIT 1) WHERE student_name = 'Zain Arif';
UPDATE art_wall SET student_id = (SELECT id FROM students WHERE full_name = 'Maisarah'            LIMIT 1) WHERE student_name = 'Maisarah';
UPDATE art_wall SET student_id = (SELECT id FROM students WHERE full_name = 'Harith Danial'       LIMIT 1) WHERE student_name = 'Harith Danial';
UPDATE art_wall SET student_id = (SELECT id FROM students WHERE full_name = 'Aisyah Zahra'        LIMIT 1) WHERE student_name = 'Aisyah Zahra';
UPDATE art_wall SET student_id = (SELECT id FROM students WHERE full_name = 'Danish Haikal'       LIMIT 1) WHERE student_name = 'Danish Haikal';
UPDATE art_wall SET student_id = (SELECT id FROM students WHERE full_name = 'Sofea Nabila'        LIMIT 1) WHERE student_name = 'Sofea Nabila';
UPDATE art_wall SET student_id = (SELECT id FROM students WHERE full_name = 'Mikhail Yusof'       LIMIT 1) WHERE student_name = 'Mikhail Yusof';
UPDATE art_wall SET student_id = (SELECT id FROM students WHERE full_name = 'Nur Batrisyia'       LIMIT 1) WHERE student_name = 'Nur Batrisyia';
UPDATE art_wall SET student_id = (SELECT id FROM students WHERE full_name = 'Razif Amsyar'        LIMIT 1) WHERE student_name = 'Razif Amsyar';
UPDATE art_wall SET student_id = (SELECT id FROM students WHERE full_name = 'Insyirah Liana'      LIMIT 1) WHERE student_name = 'Insyirah Liana';
UPDATE art_wall SET student_id = (SELECT id FROM students WHERE full_name = 'Hafiy Zarif'         LIMIT 1) WHERE student_name = 'Hafiy Zarif';
UPDATE art_wall SET student_id = (SELECT id FROM students WHERE full_name = 'Amira Syazwani'      LIMIT 1) WHERE student_name = 'Amira Syazwani';
