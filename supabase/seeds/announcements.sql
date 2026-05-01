-- Seed: 4 announcements (pinned event, general, holiday, reminder)
-- To remove: DELETE FROM announcements WHERE title LIKE '[SEED]%';

BEGIN;

INSERT INTO announcements (title, body, category, is_pinned, expires_at) VALUES
  ('[SEED] Sports Day 2026',
   'Join us for our annual Sports Day on Saturday, 17 May 2026 at the school field. Activities include sack race, tug-of-war, and parent-child games. Light refreshments will be served. Please dress your child in their house colour t-shirt.',
   'event', true, '2026-05-17'),

  ('[SEED] Term 2 Reopening',
   'School reopens on Monday, 5 May 2026 after the mid-term break. All students are expected to be in full uniform. Reminder: please ensure homework folders and reading books are returned.',
   'general', false, '2026-05-05'),

  ('[SEED] Hari Raya Aidilfitri Holiday',
   'School will be closed from 1 to 4 May 2026 in observance of Hari Raya Aidilfitri. Selamat Hari Raya Aidilfitri to all our families. Maaf zahir dan batin.',
   'holiday', false, '2026-05-04'),

  ('[SEED] Payment Reminder — May Tuition',
   'Friendly reminder that May tuition fees are due by 10 May 2026. Late payments incur a RM10 surcharge. You can pay via bank transfer, e-wallet, or in person at the office.',
   'reminder', false, '2026-05-10');

COMMIT;
