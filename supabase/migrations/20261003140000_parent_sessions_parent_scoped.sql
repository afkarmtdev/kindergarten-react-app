-- Migration: finish moving parent_sessions from student-scoped to parent-scoped
-- This is Step 5 of 002_parents.sql, which was left commented out. Portal login now
-- inserts sessions with parent_id only, so the original NOT NULL on student_id rejects
-- every login with "Failed to create session".
-- Sessions are ephemeral, so any legacy row that never got a parent_id is dropped
-- (it could not load a parent's children anyway) before parent_id becomes NOT NULL.
-- student_id stays for now; dropping it is Step 6 of 002.

BEGIN;

alter table parent_sessions alter column student_id drop not null;

delete from parent_sessions where parent_id is null;

alter table parent_sessions alter column parent_id set not null;

COMMIT;
