-- Migration: store parent emails lower-cased
-- The student form finds a parent by lower-cased email (upsertParentLink in routes/students.ts),
-- but the Parents page saved emails as typed, so "Ali@gmail.com" was never matched and adding a
-- sibling created a second parent account. The API now lower-cases on save; this fixes old rows.
--
-- A row is skipped when another parent has the same email in any case (the same person
-- already exists twice). List those with the query at the bottom and merge them by hand:
-- move the parent_students links to one record, then delete the other from the Parents page.

BEGIN;

update parents p
set email = lower(trim(p.email))
where p.email is not null
  and p.email <> lower(trim(p.email))
  -- lower() on both sides: "Ali@x.com" and "ALI@x.com" must both be skipped, or the
  -- update would turn them into the same value and fail the unique constraint
  and not exists (
    select 1 from parents q
    where q.id <> p.id and lower(trim(q.email)) = lower(trim(p.email))
  );

COMMIT;

-- Duplicates left for a manual merge (read-only, safe to run any time):
-- select lower(trim(email)) as email, array_agg(id) as parent_ids,
--        array_agg(full_name) as names, array_agg(deleted_at) as deleted_at
-- from parents
-- where email is not null
-- group by lower(trim(email))
-- having count(*) > 1;
