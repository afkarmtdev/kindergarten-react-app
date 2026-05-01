-- Seed: 3 parent testimonials for the landing page
-- To remove: DELETE FROM testimonials WHERE quote LIKE '[SEED]%';

BEGIN;

INSERT INTO testimonials (parent_name, parent_role, quote, display_order, is_visible) VALUES
  ('Ahmad bin Yusof', 'Parent of Ali (Mawar class)',
   '[SEED] My son has grown so much in confidence since joining. The teachers are warm, attentive, and treat every child like their own. The daily reports keep me connected even when I''m at work.',
   1, true),

  ('Norzahra binti Ismail', 'Parent of Puteri (Melur class)',
   '[SEED] We love the structured learning combined with creative play. Puteri comes home every day excited to share what she made or learned. The art wall is her favourite thing — she always shows me her latest piece.',
   2, true),

  ('Hafizah binti Salleh', 'Parent of Nur Batrisyia (Kenanga class)',
   '[SEED] The portal is fantastic — I can check attendance, fees, and progress reports anytime. Communication with teachers is seamless. Thank you for caring for our children so well.',
   3, true);

COMMIT;
