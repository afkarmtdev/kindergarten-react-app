-- Seed: ~2 weeks of attendance for all seeded students (weekdays only)
-- Random-ish status: 85% present, 8% late, 4% absent, 3% excused
-- Requires: at least one admin user in auth.users (recorded_by is NOT NULL).
-- To remove: DELETE FROM attendance WHERE date BETWEEN '2026-04-20' AND '2026-04-30';

BEGIN;

INSERT INTO attendance (student_id, date, status, recorded_by)
SELECT
  s.id,
  d.date,
  CASE
    WHEN r.r < 0.85 THEN 'present'
    WHEN r.r < 0.93 THEN 'late'
    WHEN r.r < 0.97 THEN 'absent'
    ELSE                  'excused'
  END,
  (SELECT id::text FROM auth.users ORDER BY created_at LIMIT 1)
FROM students s
CROSS JOIN (VALUES
  ('2026-04-20'::date),  -- Mon
  ('2026-04-21'::date),  -- Tue
  ('2026-04-22'::date),  -- Wed
  ('2026-04-23'::date),  -- Thu
  ('2026-04-24'::date),  -- Fri
  ('2026-04-27'::date),  -- Mon
  ('2026-04-28'::date),  -- Tue
  ('2026-04-29'::date),  -- Wed
  ('2026-04-30'::date)   -- Thu
) AS d(date)
CROSS JOIN LATERAL (SELECT random() AS r) AS r
WHERE s.parent_email LIKE '%seed.test%'
ON CONFLICT (student_id, date) DO NOTHING;

COMMIT;
