-- Seed: Tadika Arif Ilmu, Bandar Sri Damansara
-- Real-school content transcribed from the school's admission brochure
-- ("After School Care.pdf", 6 pages). Covers school_info, landing_content
-- (Settings > Website) and testimonials.
--
-- Requires migration 20260913120000_landing_content.sql.
--
-- Run order: this file replaces school_info.sql + landing_content.sql +
-- testimonials.sql. Do not run those three alongside it.
--
-- Not in the brochure (fill in via Settings > General after seeding):
--   - street address, email, principal name, registration number
--   - operating hours (brochure only says "early drop-offs" and
--     "after school care"; 07:30-18:00 below is a placeholder)
--   - Google Maps embed, Facebook / Instagram links
--   - team and story photos (upload via Settings > Website; the PDF
--     renders are too compressed to reuse)
--   - gallery photos (same reason; ask the school for originals)
--
-- Testimonials are transcribed from WhatsApp screenshots on page 6 and
-- lightly tidied (shorthand expanded, "Alif Ilmu" typo corrected). Where a
-- parent's name was not visible, the row is labelled by the child; update
-- parent_name once the school confirms.
--
-- To reset:
--   UPDATE school_info SET landing_content = NULL;
--   DELETE FROM testimonials WHERE parent_role LIKE 'Parent of %';

BEGIN;

-- ─── school_info ─────────────────────────────────────────────────────────────

INSERT INTO school_info (school_name)
SELECT 'Tadika Arif Ilmu'
WHERE NOT EXISTS (SELECT 1 FROM school_info);

UPDATE school_info
SET
  school_name          = 'Tadika Arif Ilmu',
  address              = '3, Persiaran Cempaka, Bandar Sri Damansara, 52200 Kuala Lumpur',
  phone                = '011-3666 1759',
  email                = '',
  whatsapp_number      = '601136661759',
  principal_name       = '',
  registration_number  = '',
  operating_hours      = jsonb_build_object(
    'monday',    jsonb_build_object('open', '07:30', 'close', '18:00'),
    'tuesday',   jsonb_build_object('open', '07:30', 'close', '18:00'),
    'wednesday', jsonb_build_object('open', '07:30', 'close', '18:00'),
    'thursday',  jsonb_build_object('open', '07:30', 'close', '18:00'),
    'friday',    jsonb_build_object('open', '07:30', 'close', '18:00'),
    'saturday',  jsonb_build_object('open', '',      'close', ''),
    'sunday',    jsonb_build_object('open', '',      'close', '')
  ),
  facebook_url         = '',
  instagram_url        = '',
  google_maps_embed_url = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3983.6143665793015!2d101.60849759999999!3d3.1955942999999993!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31cc45a8e680c379%3A0x90ee5d3439c2f5c1!2sTadika%20Arif%20Ilmu!5e0!3m2!1sen!2smy!4v1789299562503!5m2!1sen!2smy',
  updated_at           = now()
WHERE id = (SELECT id FROM school_info LIMIT 1);

-- ─── landing_content ─────────────────────────────────────────────────────────

UPDATE school_info
SET
  landing_content = jsonb_build_object(

    -- Hero. Brochure cover: "School Admission, now open for registration",
    -- three tiers (Playschool 2-3, Kindergarten 4-6, After School Care).
    'hero', jsonb_build_object(
      'tagline', jsonb_build_object(
        'en', 'Now open for registration · Bandar Sri Damansara',
        'ms', 'Pendaftaran kini dibuka · Bandar Sri Damansara'
      ),
      'headline_start', jsonb_build_object(
        'en', 'Little learners,',
        'ms', 'Pelajar kecil,'
      ),
      'headline_highlight', jsonb_build_object(
        'en', 'big futures',
        'ms', 'masa depan besar'
      ),
      'headline_end', jsonb_build_object(
        'en', 'in Bandar Sri Damansara',
        'ms', 'di Bandar Sri Damansara'
      ),
      'subtitle', jsonb_build_object(
        'en', 'Playschool for ages 2 to 3, kindergarten for ages 4 to 6, and after school care, all under one roof. An integrated syllabus rooted in Islamic values and early childhood education, since 2022.',
        'ms', 'Playschool untuk umur 2 hingga 3 tahun, tadika untuk umur 4 hingga 6 tahun, dan jagaan selepas sekolah, semuanya di bawah satu bumbung. Sukatan bersepadu berteraskan nilai Islam dan pendidikan awal kanak-kanak, sejak 2022.'
      )
    ),

    -- Our Story. Text from "Who We Are" and "Why Choose Us" (pages 2-3).
    -- Principal message left blank (not in brochure); the block is hidden
    -- until the school writes one.
    'about', jsonb_build_object(
      'enabled', true,
      'founded_year', 2022,
      'story', jsonb_build_object(
        'en', E'Established in 2022, Tadika Arif Ilmu is a trusted early childhood education centre in Bandar Sri Damansara. We are a preferred choice for working parents and organisations, including the employees of Amanah Ikhtiar Malaysia, because of our professional service, strong parent communication and reliability. Parents trust our structured daily routines, quality care and dedication to each child\'s progress, academically and personally.',
        'ms', E'Ditubuhkan pada 2022, Tadika Arif Ilmu ialah pusat pendidikan awal kanak-kanak yang dipercayai di Bandar Sri Damansara. Kami menjadi pilihan ibu bapa yang bekerja dan organisasi, termasuk kakitangan Amanah Ikhtiar Malaysia, kerana perkhidmatan profesional, komunikasi yang rapat dengan ibu bapa dan kebolehpercayaan kami. Ibu bapa yakin dengan rutin harian yang teratur, penjagaan berkualiti dan dedikasi kami terhadap perkembangan setiap anak, dari segi akademik dan peribadi.'
      ),
      'approach', jsonb_build_object(
        'en', E'More than academic learning: an integrated syllabus rooted in Islamic values and early childhood education that nurtures spiritual, emotional and social development alongside a strong academic foundation. Classrooms are child-centred, interactive and safe, and every child is seen, heard and valued.',
        'ms', E'Lebih daripada pembelajaran akademik: sukatan bersepadu berteraskan nilai Islam dan pendidikan awal kanak-kanak yang memupuk perkembangan rohani, emosi dan sosial di samping asas akademik yang kukuh. Bilik darjah berpusatkan kanak-kanak, interaktif dan selamat, dan setiap anak dilihat, didengar dan dihargai.'
      ),
      'principal_message', jsonb_build_object('en', '', 'ms', ''),
      'principal_photo_url', NULL,
      'photo_urls', jsonb_build_array()
    ),

    -- Numbers strip. Six teaching staff on page 5. No rating in brochure
    -- (0 hides the tile). Students and classes count live from the DB.
    'stats', jsonb_build_object(
      'mode', 'live',
      'students', 0,
      'classes', 0,
      'staff', 6,
      'rating', 0
    ),

    -- Programme cards, in display order. Mapped from page 4 curriculum:
    --   learn   -> Language & Literacy, Mathematics, Science Discovery
    --   play    -> play-based learning (Playschool tier)
    --   arts    -> Arts & Crafts, Music & Movement
    --   safe    -> "Safe, Stimulating & Nurturing Environment"
    --   outdoor -> Field Trips, Sports Day
    -- No card yet for Islamic Studies & Moral Values, STEM or Practical
    -- Life Skills; those are covered in the approach text above.
    'features', jsonb_build_object(
      'enabled', jsonb_build_array('learn', 'play', 'arts', 'safe', 'outdoor')
    ),

    -- Meet the team (page 5). Photos to be uploaded via Settings > Website.
    'team', jsonb_build_object(
      'enabled', true,
      'members', jsonb_build_array(
        jsonb_build_object(
          'id', 'arif-joanne',
          'name', 'Joanne Lim',
          'role', jsonb_build_object('en', 'Music & Movement', 'ms', 'Muzik & Pergerakan'),
          'photo_url', NULL
        ),
        jsonb_build_object(
          'id', 'arif-amalina',
          'name', 'Nur Amalina',
          'role', jsonb_build_object('en', 'Pre 3 · 6 years', 'ms', 'Pra 3 · 6 tahun'),
          'photo_url', NULL
        ),
        jsonb_build_object(
          'id', 'arif-norazleen',
          'name', 'Che Norazleen',
          'role', jsonb_build_object('en', 'Playschool · 2 to 3 years', 'ms', 'Playschool · 2 hingga 3 tahun'),
          'photo_url', NULL
        ),
        jsonb_build_object(
          'id', 'arif-asyiqin',
          'name', 'Nurul Asyiqin',
          'role', jsonb_build_object('en', 'Pre 1 · 4 years', 'ms', 'Pra 1 · 4 tahun'),
          'photo_url', NULL
        ),
        jsonb_build_object(
          'id', 'arif-umairah',
          'name', 'Nur Umairah',
          'role', jsonb_build_object('en', 'Pre 2 · 5 years', 'ms', 'Pra 2 · 5 tahun'),
          'photo_url', NULL
        ),
        jsonb_build_object(
          'id', 'arif-hanim',
          'name', 'Hanim Faaramira',
          'role', jsonb_build_object('en', 'Assistant Teacher', 'ms', 'Guru Pembantu'),
          'photo_url', NULL
        )
      )
    )
  ),
  updated_at = now()
WHERE id = (SELECT id FROM school_info LIMIT 1);

-- ─── testimonials (page 6) ───────────────────────────────────────────────────

INSERT INTO testimonials (parent_name, parent_role, quote, display_order, is_visible) VALUES

  ('Jani Izwandy & Erni Rineelawati', 'Parent of Muhammad Ikhlas, 4',
   'Saya dan isteri sangat berpuas hati dengan perkembangan anak kami sejak mula dihantar ke Tadika Arif Ilmu. Pendekatan pembelajaran yang digunakan oleh guru-guru di sini amat sesuai dengan keperluan usia kanak-kanak. Aktiviti yang dijalankan bukan sahaja menyeronokkan, tetapi juga membantu membentuk asas yang kukuh dalam perkembangan sosial dan emosi anak kami. Yang paling penting, saya dan isteri rasa yakin dan tenang setiap kali meninggalkan anak di tadika ini kerana suasananya yang mesra, selamat dan penuh kasih sayang. Terima kasih kepada semua tenaga pengajar Tadika Arif Ilmu yang sangat berdedikasi dan prihatin.',
   1, true),

  ('Athirah', 'Parent of Muhammad Sulaiman Shah',
   'Today is Sulaiman''s last day at Tadika Arif Ilmu and I would like to take this moment to express our deepest gratitude to all the teachers who have played such an important role in his early learning journey. Thank you for your patience, kindness and dedication in guiding and teaching him. Your efforts have truly made a difference, and we will always appreciate everything you have done. Sulaiman will carry with him the valuable lessons and beautiful memories from his time here. Wishing Tadika Arif Ilmu and all the amazing teachers continued success in shaping and inspiring young minds.',
   2, true),

  ('Hanis', 'Parent of Muhammad Irsyad Iman',
   'Hari ini hari pertama Muhammad Irsyad Iman masuk Darjah 1. Jutaan terima kasih kami ucapkan kepada semua guru Tadika Arif Ilmu. Dengan kesabaran, ketekunan dan motivasi daripada guru-guru, Irsyad melangkah ke kelas dengan penuh yakin dan gembira. Jasa guru-guru tidak dapat kami balas; hanya Allah yang dapat memberi ganjaran terbaik atas ilmu dan pengalaman yang dicurahkan kepada Irsyad. Semoga Tadika Arif Ilmu terus berkembang dan maju jaya.',
   3, true),

  -- parent_name not on brochure
  ('Ibu Bapa Harraz', 'Parent of Muhammad Harraz, 7',
   'Alhamdulillah, Harraz ada progress sejak umur 5 tahun di Tadika Arif Ilmu. Sekarang dia 7 tahun dan dah lancar membaca BM, English dan Iqra. Terima kasih kepada teacher-teacher yang telah mengajar Harraz semasa dia di Tadika Arif Ilmu.',
   4, true),

  -- parent_name not on brochure
  ('Ayah Izara', 'Parent of Izara, 8',
   'Izara advanced daripada kawan-kawan yang lain masa Darjah 1 sebab dah pandai membaca English dan Bahasa. Sekarang umur 8 tahun Izara dah mula Al-Quran, dan ini bahagian yang saya paling seronok: saya dan wife dapat tahu salah satu teacher ada ajar Iqra pada Izara semasa dia 6 tahun. Dari situ urusan Izara mudah dari Darjah 1 sampailah sekarang. Terima kasih teacher dedahkan anak saya in a positive way.',
   5, true),

  -- parent_name not on brochure
  ('Ibu Bapa Naurah Medina', 'Parent of Naurah Medina',
   'Jutaan terima kasih kepada semua teacher Tadika Arif Ilmu yang banyak mengajar Naurah Medina sampai ke tahap yang sekarang. Terima kasih juga sebab melayan kerenah Naurah Medina sepanjang 3 tahun bersekolah di sini. Allah sahaja yang mampu membalas segala pengorbanan teacher-teacher semua. All the best to all Tadika Arif Ilmu teachers. You guys are the best. Jasamu akan selalu dikenang.',
   6, true),

  -- parent_name not on brochure
  ('Ibu Bapa Annur Kamelia', 'Parent of Annur Kamelia',
   'Thank you Teacher Lina, Teacher Izat, Teacher Nurul, Teacher Umaira, Teacher Leen, Teacher Aishah and Kak Riya for teaching and looking after Camellia so well. And thank you teachers for helping our children learn to read; terharu sangat balik rumah dengar anak baca buku.',
   7, true),

  -- parent_name not on brochure
  ('Ibu Bapa Husna & Fateh', 'Parent of Nur Fatihah Husna',
   'Terima kasih teachers atas segala ilmu yang dicurahkan kepada Husna dan Fateh. Terima kasih kawan-kawan Husna yang menjadi kawan yang sangat baik. Semoga bertemu lagi di lain waktu, insya-Allah. Terima kasih semua.',
   8, true);

COMMIT;
