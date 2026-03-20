-- ============================================================================
-- Migration: Parent-Level Portal Accounts
-- Moves portal auth from student-scoped to parent-scoped
-- ============================================================================

-- Step 1: Create parents table
create table if not exists parents (
  id              uuid primary key default uuid_generate_v4(),
  full_name       text not null,
  email           text,
  phone           text not null,
  access_code     text unique,
  portal_pin_hash text,
  created_at      timestamptz default now()
);

create index if not exists idx_parents_access_code on parents(access_code);
create index if not exists idx_parents_email on parents(email);

alter table parents enable row level security;
drop policy if exists "Auth users manage parents" on parents;
create policy "Auth users manage parents" on parents for all to authenticated using (true) with check (true);

-- Step 2: Create junction table
create table if not exists parent_students (
  id           uuid primary key default uuid_generate_v4(),
  parent_id    uuid not null references parents(id) on delete cascade,
  student_id   uuid not null references students(id) on delete cascade,
  relationship text not null default 'parent',
  created_at   timestamptz default now(),
  unique(parent_id, student_id)
);

create index if not exists idx_parent_students_parent on parent_students(parent_id);
create index if not exists idx_parent_students_student on parent_students(student_id);

alter table parent_students enable row level security;
drop policy if exists "Auth users manage parent_students" on parent_students;
create policy "Auth users manage parent_students" on parent_students for all to authenticated using (true) with check (true);

-- Step 3: Add parent_id to parent_sessions (keep student_id for now)
alter table parent_sessions add column if not exists parent_id uuid references parents(id) on delete cascade;

-- ============================================================================
-- Step 4: Data migration — derive parents from existing student records
-- ============================================================================

-- 4a: Create parent rows grouped by email (most reliable dedup key)
insert into parents (full_name, email, phone)
select distinct on (lower(trim(parent_email)))
  parent_name, lower(trim(parent_email)), parent_phone
from students
where parent_email is not null and trim(parent_email) != ''
order by lower(trim(parent_email)), created_at asc
on conflict do nothing;

-- 4b: Create parent rows for students without email (one parent per student)
insert into parents (full_name, phone)
select parent_name, parent_phone
from students
where parent_email is null or trim(parent_email) = ''
on conflict do nothing;

-- 4c: Link students to parents (email-based matches)
insert into parent_students (parent_id, student_id)
select p.id, s.id
from students s
join parents p on lower(trim(p.email)) = lower(trim(s.parent_email))
where s.parent_email is not null and trim(s.parent_email) != ''
on conflict do nothing;

-- 4d: Link students to parents (no-email, matched by name+phone)
insert into parent_students (parent_id, student_id)
select p.id, s.id
from students s
join parents p on p.full_name = s.parent_name and p.phone = s.parent_phone
where (s.parent_email is null or trim(s.parent_email) = '')
  and p.email is null
on conflict do nothing;

-- 4e: Copy access codes and PIN hashes from students to their parents
update parents p
set access_code = sub.access_code,
    portal_pin_hash = sub.portal_pin_hash
from (
  select distinct on (ps.parent_id)
    ps.parent_id,
    s.access_code,
    s.portal_pin_hash
  from parent_students ps
  join students s on s.id = ps.student_id
  where s.access_code is not null
  order by ps.parent_id, s.created_at asc
) sub
where p.id = sub.parent_id;

-- 4f: Map existing sessions to parent_id
update parent_sessions ps
set parent_id = pst.parent_id
from parent_students pst
where ps.student_id = pst.student_id;

-- ============================================================================
-- Step 5: Make parent_id NOT NULL on parent_sessions (run after verifying migration)
-- ============================================================================
-- Uncomment after confirming data migration is correct:
-- alter table parent_sessions alter column student_id drop not null;
-- alter table parent_sessions alter column parent_id set not null;

-- ============================================================================
-- Step 6: Cleanup (Phase 5 — run AFTER app code is fully migrated)
-- ============================================================================
-- alter table students drop column access_code;
-- alter table students drop column portal_pin_hash;
-- alter table parent_sessions drop column student_id;

-- ============================================================================
-- Step 7: Drop parent contact columns from students table
-- (run AFTER deploying code that reads parent info via parent_students → parents join)
-- ============================================================================
-- alter table students drop column if exists parent_name;
-- alter table students drop column if exists parent_email;
-- alter table students drop column if exists parent_phone;
