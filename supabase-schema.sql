-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Classrooms
create table classrooms (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  teacher_name text not null,
  capacity int not null default 20,
  created_at timestamptz default now()
);

-- Students
create table students (
  id uuid primary key default uuid_generate_v4(),
  full_name text not null,
  date_of_birth date not null,
  gender text check (gender in ('male', 'female')) not null,
  class_name text not null,
  parent_name text not null,
  parent_email text not null,
  parent_phone text not null,
  photo_url text,
  created_at timestamptz default now()
);

-- Attendance
create table attendance (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid references students(id) on delete cascade,
  date date not null,
  status text check (status in ('present', 'absent', 'late', 'excused')) not null,
  notes text,
  recorded_by text not null,
  created_at timestamptz default now(),
  unique(student_id, date)
);

-- Indexes
create index idx_attendance_date on attendance(date);
create index idx_attendance_student on attendance(student_id);
create index idx_students_class on students(class_name);

-- RLS (Row Level Security) - enable for production
alter table students enable row level security;
alter table attendance enable row level security;
alter table classrooms enable row level security;

-- Allow authenticated users full access (adjust per role if needed)
create policy "Auth users can read students" on students for select to authenticated using (true);
create policy "Auth users can insert students" on students for insert to authenticated with check (true);
create policy "Auth users can update students" on students for update to authenticated using (true);
create policy "Auth users can delete students" on students for delete to authenticated using (true);

create policy "Auth users can read attendance" on attendance for select to authenticated using (true);
create policy "Auth users can insert attendance" on attendance for insert to authenticated with check (true);
create policy "Auth users can update attendance" on attendance for update to authenticated using (true);

create policy "Auth users can read classrooms" on classrooms for select to authenticated using (true);
create policy "Auth users can insert classrooms" on classrooms for insert to authenticated with check (true);
create policy "Auth users can update classrooms" on classrooms for update to authenticated using (true);
create policy "Auth users can delete classrooms" on classrooms for delete to authenticated using (true);

-- Gallery
create table gallery_items (
  id             uuid primary key default uuid_generate_v4(),
  photo_url      text not null,
  caption        text,
  display_order  int  not null default 0,
  is_visible     boolean not null default true,
  created_at     timestamptz default now()
);

create index idx_gallery_display_order on gallery_items(display_order);

alter table gallery_items enable row level security;

-- Authenticated users (admin) — full CRUD
create policy "Auth users can read gallery"   on gallery_items for select to authenticated using (true);
create policy "Auth users can insert gallery" on gallery_items for insert to authenticated with check (true);
create policy "Auth users can update gallery" on gallery_items for update to authenticated using (true);
create policy "Auth users can delete gallery" on gallery_items for delete to authenticated using (true);

-- Anonymous users (LandingPage visitors) — read visible items only
create policy "Anyone can read visible gallery" on gallery_items for select to anon using (is_visible = true);

-- Announcements
create table announcements (
  id          uuid primary key default uuid_generate_v4(),
  title       text not null,
  body        text not null,
  category    text check (category in ('general','holiday','event','reminder')) not null default 'general',
  image_url   text,
  is_pinned   boolean not null default false,
  expires_at  date,
  created_at  timestamptz default now()
);

create index idx_announcements_created on announcements(created_at desc);
create index idx_announcements_pinned  on announcements(is_pinned);

alter table announcements enable row level security;

-- Authenticated users (admin) — full CRUD
create policy "Auth users can read announcements"   on announcements for select to authenticated using (true);
create policy "Auth users can insert announcements" on announcements for insert to authenticated with check (true);
create policy "Auth users can update announcements" on announcements for update to authenticated using (true);
create policy "Auth users can delete announcements" on announcements for delete to authenticated using (true);

-- Anonymous users (LandingPage visitors) — non-expired only
create policy "Anyone can read active announcements" on announcements
  for select to anon
  using (expires_at is null or expires_at >= current_date);
