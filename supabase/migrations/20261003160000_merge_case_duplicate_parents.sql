-- Migration: merge parents that are the same person by email (different letter case)
-- Before emails were lower-cased on save, "Ali@gmail.com" and "ali@gmail.com" could become two
-- parent records, each linked to some of the children and each with its own portal login.
-- 20261003150000 lower-cased every email it safely could and left these groups; this merges them.
--
-- In each group one record is kept, chosen in this order: not deleted, has working portal
-- access (code + PIN), email already lower-case, created first. For every other record:
--   - its live child links move to the kept record (re-activating an unlinked one if needed)
--   - its portal sessions move to the kept record when it was live (logged-in phones keep
--     working, now seeing all the children); sessions of an already-deleted record are removed
--   - it is soft-deleted with its email, access code and PIN cleared. Its own access code stops
--     working; that parent logs in with the kept record's code (Parents page shows it).
-- Then the kept record's email is lower-cased.
--
-- Also removes portal sessions that still belong to deleted parents: deleting a parent did not
-- log them out before (fixed in routes/parents.ts at the same time).
--
-- Every statement stands alone (no temp tables, no session state): the Supabase SQL Editor can
-- commit after each statement, which dropped the temp table an earlier version relied on.
-- Statement 1 is the whole merge, so it is atomic on its own; 2 and 3 are safe to re-run.
--
-- Preview the groups and which record is kept (read-only, run before this file):
-- select lower(trim(email)) as email, id, full_name, deleted_at, access_code, created_at
-- from parents
-- where email is not null and lower(trim(email)) in (
--   select lower(trim(email)) from parents where email is not null
--   group by lower(trim(email)) having count(*) > 1)
-- order by 1, (deleted_at is null) desc,
--   (access_code is not null and portal_pin_hash is not null) desc,
--   (email = lower(trim(email))) desc, created_at, id;

BEGIN;

-- 1. The merge. The data-modifying CTEs all run once, on the same snapshot, and each one
--    writes different rows: links of kept records, links of duplicates, sessions, duplicates.
WITH ranked AS (
  SELECT
    id,
    deleted_at,
    lower(trim(email)) AS norm_email,
    row_number() OVER (
      PARTITION BY lower(trim(email))
      ORDER BY
        (deleted_at IS NULL) DESC,
        (access_code IS NOT NULL AND portal_pin_hash IS NOT NULL) DESC,
        (email = lower(trim(email))) DESC,
        created_at ASC NULLS LAST,
        id ASC
    ) AS rank
  FROM parents
  WHERE email IS NOT NULL
),
parent_merge AS (
  SELECT d.id AS duplicate_id, d.deleted_at AS duplicate_deleted_at, s.id AS survivor_id
  FROM ranked d
  JOIN ranked s ON s.norm_email = d.norm_email AND s.rank = 1
  WHERE d.rank > 1
),
-- Live child links move to the kept record. DISTINCT ON: two duplicates linked to the same
-- child must become one row, or ON CONFLICT would hit it twice.
moved_links AS (
  INSERT INTO parent_students (parent_id, student_id, relationship, created_at)
  SELECT DISTINCT ON (m.survivor_id, ps.student_id)
    m.survivor_id, ps.student_id, ps.relationship, ps.created_at
  FROM parent_students ps
  JOIN parent_merge m ON m.duplicate_id = ps.parent_id
  WHERE ps.deleted_at IS NULL
  ORDER BY m.survivor_id, ps.student_id, ps.created_at
  ON CONFLICT (parent_id, student_id) DO UPDATE SET deleted_at = NULL, deleted_by = NULL
  RETURNING 1
),
unlinked AS (
  UPDATE parent_students ps
  SET deleted_at = now()
  FROM parent_merge m
  WHERE ps.parent_id = m.duplicate_id AND ps.deleted_at IS NULL
  RETURNING 1
),
-- A live duplicate's logged-in devices move to the kept record
moved_sessions AS (
  UPDATE parent_sessions s
  SET parent_id = m.survivor_id
  FROM parent_merge m
  WHERE s.parent_id = m.duplicate_id AND m.duplicate_deleted_at IS NULL
  RETURNING 1
),
-- Retire the duplicates; clearing the email frees it for statement 2
retired AS (
  UPDATE parents p
  SET deleted_at = coalesce(p.deleted_at, now()),
      email = NULL,
      access_code = NULL,
      portal_pin_hash = NULL,
      modified_at = now()
  FROM parent_merge m
  WHERE p.id = m.duplicate_id
  RETURNING 1
)
SELECT
  (SELECT count(*) FROM retired) AS duplicates_merged,
  (SELECT count(*) FROM moved_links) AS child_links_moved,
  (SELECT count(*) FROM moved_sessions) AS sessions_moved;

-- 2. Lower-case the kept records' emails. The duplicates' emails were cleared in statement 1,
--    so each kept email is now the only one of its kind (same rule as 20261003150000).
UPDATE parents p
SET email = lower(trim(p.email)), modified_at = now()
WHERE p.email IS NOT NULL
  AND p.email <> lower(trim(p.email))
  AND NOT EXISTS (
    SELECT 1 FROM parents q
    WHERE q.id <> p.id AND lower(trim(q.email)) = lower(trim(p.email))
  );

-- 3. Log deleted parents out of the portal (the duplicates retired above and parents deleted
--    earlier)
DELETE FROM parent_sessions s
USING parents p
WHERE s.parent_id = p.id AND p.deleted_at IS NOT NULL;

COMMIT;
