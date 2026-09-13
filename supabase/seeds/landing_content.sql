-- Seed: school_info.landing_content (Settings > Website)
-- Fills the landing page identity sections for the seeded school
-- (Tadika Cahaya Bestari, see school_info.sql — run that first).
--
-- Requires migration 20260913120000_landing_content.sql.
-- Photos use picsum.photos placeholders; replace via Settings > Website.
-- To reset: UPDATE school_info SET landing_content = NULL;

BEGIN;

UPDATE school_info
SET
  landing_content = jsonb_build_object(

    -- Hero copy. Blank strings fall back to the built-in translation.
    'hero', jsonb_build_object(
      'tagline', jsonb_build_object(
        'en', 'Enrolling for 2027 · Kajang',
        'ms', 'Pendaftaran 2027 · Kajang'
      ),
      'headline_start', jsonb_build_object(
        'en', 'Small class,',
        'ms', 'Kelas kecil,'
      ),
      'headline_highlight', jsonb_build_object(
        'en', 'big heart',
        'ms', 'hati besar'
      ),
      'headline_end', jsonb_build_object(
        'en', 'in Kajang',
        'ms', 'di Kajang'
      ),
      'subtitle', jsonb_build_object(
        'en', 'A bilingual, play-based tadika for ages 4 to 6, run by the same family since 2018. Ten minutes from Kajang town in Taman Suria Indah.',
        'ms', 'Tadika dwibahasa berasaskan bermain untuk umur 4 hingga 6 tahun, dikendalikan keluarga yang sama sejak 2018. Sepuluh minit dari pekan Kajang di Taman Suria Indah.'
      )
    ),

    -- Our Story section. Principal name comes from school_info.principal_name.
    'about', jsonb_build_object(
      'enabled', true,
      'founded_year', 2018,
      'story', jsonb_build_object(
        'en', E'We opened in 2018 with twelve children and two teachers in a corner-lot house in Taman Suria Indah. Today we have four classes and a proper garden, but we keep it small on purpose: every teacher knows every child by name, and most of our families come to us because a neighbour sent them.',
        'ms', E'Kami dibuka pada 2018 dengan dua belas orang anak dan dua orang guru di sebuah rumah lot tepi di Taman Suria Indah. Kini kami mempunyai empat kelas dan taman sendiri, tetapi kami sengaja kekal kecil: setiap guru kenal setiap anak dengan nama, dan kebanyakan keluarga datang kerana dicadangkan jiran.'
      ),
      'approach', jsonb_build_object(
        'en', 'KSPK 2026 curriculum, taught through play. Mornings in Bahasa Melayu, afternoons in English, Jawi twice a week. No worksheets before age 5.',
        'ms', 'Kurikulum KSPK 2026, diajar melalui bermain. Pagi dalam Bahasa Melayu, petang dalam Bahasa Inggeris, Jawi dua kali seminggu. Tiada lembaran kerja sebelum umur 5 tahun.'
      ),
      'principal_message', jsonb_build_object(
        'en', 'Parents ask me what makes us different. Honestly, it is that I am still here every morning at the gate. Come and see us at 7.30 on any weekday; that is the real tour.',
        'ms', 'Ibu bapa tanya apa yang membezakan kami. Sejujurnya, saya masih ada di pagar setiap pagi. Datanglah jam 7.30 pagi mana-mana hari bekerja; itulah lawatan yang sebenar.'
      ),
      'principal_photo_url', 'https://picsum.photos/seed/principal/400/400',
      'photo_urls', jsonb_build_array(
        'https://picsum.photos/seed/story1/600/600',
        'https://picsum.photos/seed/story2/600/600',
        'https://picsum.photos/seed/story3/600/600'
      )
    ),

    -- Numbers strip. 'live' counts active students + classes from the DB;
    -- staff and rating are always school-entered. Tiles at 0 are hidden.
    'stats', jsonb_build_object(
      'mode', 'live',
      'students', 0,
      'classes', 0,
      'staff', 7,
      'rating', 4.9
    ),

    -- Programme cards, in display order. Valid keys:
    -- learn | safe | arts | play | outdoor | class
    'features', jsonb_build_object(
      'enabled', jsonb_build_array('learn', 'class', 'outdoor', 'safe', 'arts')
    ),

    -- Meet the team section.
    'team', jsonb_build_object(
      'enabled', true,
      'members', jsonb_build_array(
        jsonb_build_object(
          'id', 'seed-aminah',
          'name', 'Pn. Aminah',
          'role', jsonb_build_object('en', 'Principal · Class 6 Bestari', 'ms', 'Pengetua · Kelas 6 Bestari'),
          'photo_url', 'https://picsum.photos/seed/team1/300/300'
        ),
        jsonb_build_object(
          'id', 'seed-nadia',
          'name', 'Cikgu Nadia',
          'role', jsonb_build_object('en', 'Class 5 Cerdik', 'ms', 'Kelas 5 Cerdik'),
          'photo_url', 'https://picsum.photos/seed/team2/300/300'
        ),
        jsonb_build_object(
          'id', 'seed-sulin',
          'name', 'Teacher Su Lin',
          'role', jsonb_build_object('en', 'English & Class 4 Ceria', 'ms', 'Bahasa Inggeris & Kelas 4 Ceria'),
          'photo_url', 'https://picsum.photos/seed/team3/300/300'
        ),
        jsonb_build_object(
          'id', 'seed-ros',
          'name', 'Kak Ros',
          'role', jsonb_build_object('en', 'Kitchen & nap time', 'ms', 'Dapur & waktu tidur'),
          'photo_url', NULL
        )
      )
    )
  ),
  updated_at = now()
WHERE id = (SELECT id FROM school_info LIMIT 1);

COMMIT;
