-- Migration: make the legacy parent contact columns on students nullable
-- Parent details live in parents + parent_students since 002_parents.sql, and the
-- students route no longer writes parent_name/parent_email/parent_phone on the student
-- row, so the original NOT NULL constraints reject every new student.
-- The columns stay for now (old rows keep their values); dropping them is Step 7 of 002.

BEGIN;

alter table students alter column parent_name drop not null;
alter table students alter column parent_email drop not null;
alter table students alter column parent_phone drop not null;

COMMIT;
