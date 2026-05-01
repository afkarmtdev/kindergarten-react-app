-- Seed: 1 fee plan + monthly tuition records for all seeded students
-- Mix of paid (5), partial (3), and unpaid (12) — gives the dashboard variety.
-- To remove:
--   DELETE FROM fee_records WHERE description LIKE '[SEED]%';
--   DELETE FROM fee_plans   WHERE name        LIKE '[SEED]%';

BEGIN;

-- ── Fee plan ────────────────────────────────────────────────────────────────
INSERT INTO fee_plans (name, type, amount, description)
SELECT '[SEED] Monthly Tuition', 'tuition', 150.00, 'Standard monthly tuition fee for all classes'
WHERE NOT EXISTS (SELECT 1 FROM fee_plans WHERE name = '[SEED] Monthly Tuition');

-- ── Fee records: April 2026 tuition for all 20 seeded students ─────────────
-- Status derivation (matches backend logic in lib/fees.ts):
--   waived  if discount >= owed
--   paid    if paid    >= owed - discount
--   partial if paid    >  0
--   unpaid  otherwise

-- 5 fully paid (paid_at + receipt number)
INSERT INTO fee_records (student_id, type, description, amount_owed, amount_paid, discount_amount, status, due_date, paid_at, receipt_number)
SELECT s.id, 'tuition', '[SEED] April 2026 tuition', 150.00, 150.00, 0, 'paid', '2026-04-10', '2026-04-08T10:30:00Z',
       'R-' || lpad((row_number() OVER (ORDER BY s.full_name))::text, 4, '0')
FROM students s
WHERE s.parent_email LIKE '%seed.test%'
ORDER BY s.full_name
LIMIT 5;

-- 3 partial payments (RM75 of RM150)
INSERT INTO fee_records (student_id, type, description, amount_owed, amount_paid, discount_amount, status, due_date, paid_at)
SELECT s.id, 'tuition', '[SEED] April 2026 tuition', 150.00, 75.00, 0, 'partial', '2026-04-10', '2026-04-15T14:20:00Z'
FROM students s
WHERE s.parent_email LIKE '%seed.test%'
  AND s.id NOT IN (SELECT student_id FROM fee_records WHERE description = '[SEED] April 2026 tuition')
ORDER BY s.full_name
LIMIT 3;

-- 12 unpaid (overdue — due date in the past)
INSERT INTO fee_records (student_id, type, description, amount_owed, amount_paid, discount_amount, status, due_date)
SELECT s.id, 'tuition', '[SEED] April 2026 tuition', 150.00, 0, 0, 'unpaid', '2026-04-10'
FROM students s
WHERE s.parent_email LIKE '%seed.test%'
  AND s.id NOT IN (SELECT student_id FROM fee_records WHERE description = '[SEED] April 2026 tuition');

COMMIT;
