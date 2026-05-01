-- Seed: school_info single-row config
-- Inserts only if no row exists. To reset: DELETE FROM school_info;

BEGIN;

INSERT INTO school_info (
  school_name,
  address,
  phone,
  email,
  whatsapp_number,
  principal_name,
  registration_number,
  operating_hours,
  facebook_url,
  instagram_url,
  google_maps_embed_url
)
SELECT
  'Tadika Cahaya Bestari',
  'No. 12, Jalan Suria 7, Taman Suria Indah, 43000 Kajang, Selangor',
  '+603-8765 4321',
  'hello@cahayabestari.edu.my',
  '60123456789',
  'Pn. Aminah binti Yusof',
  'KPM/PG/2018/0042',
  jsonb_build_object(
    'monday',    jsonb_build_object('open', '07:30', 'close', '18:00'),
    'tuesday',   jsonb_build_object('open', '07:30', 'close', '18:00'),
    'wednesday', jsonb_build_object('open', '07:30', 'close', '18:00'),
    'thursday',  jsonb_build_object('open', '07:30', 'close', '18:00'),
    'friday',    jsonb_build_object('open', '07:30', 'close', '18:00'),
    'saturday',  jsonb_build_object('open', '',      'close', ''),
    'sunday',    jsonb_build_object('open', '',      'close', '')
  ),
  'https://facebook.com/cahayabestari',
  'https://instagram.com/cahayabestari',
  ''
WHERE NOT EXISTS (SELECT 1 FROM school_info);

COMMIT;
