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

-- Document Numbering
create table document_numbering (
  id             uuid primary key default uuid_generate_v4(),
  document_type  text unique not null,
  segments       jsonb not null default '[]',
  current_serial integer not null default 0,
  last_reset_at  timestamptz,
  updated_at     timestamptz default now()
);

alter table document_numbering enable row level security;
create policy "Auth users can read doc numbering"   on document_numbering for select to authenticated using (true);
create policy "Auth users can insert doc numbering" on document_numbering for insert to authenticated with check (true);
create policy "Auth users can update doc numbering" on document_numbering for update to authenticated using (true);

-- Fee Plans
create table fee_plans (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  type        text check (type in ('tuition','activity','uniform','registration','other')) not null default 'tuition',
  amount      numeric(10,2) not null,
  description text,
  created_at  timestamptz default now()
);

alter table fee_plans enable row level security;
create policy "Auth users can read fee plans"   on fee_plans for select to authenticated using (true);
create policy "Auth users can insert fee plans" on fee_plans for insert to authenticated with check (true);
create policy "Auth users can update fee plans" on fee_plans for update to authenticated using (true);
create policy "Auth users can delete fee plans" on fee_plans for delete to authenticated using (true);

-- Fee Records
create table fee_records (
  id              uuid primary key default uuid_generate_v4(),
  student_id      uuid references students(id) on delete cascade not null,
  type            text check (type in ('tuition','activity','uniform','registration','other')) not null default 'tuition',
  description     text not null,
  amount_owed     numeric(10,2) not null,
  amount_paid     numeric(10,2) not null default 0,
  discount_amount numeric(10,2) not null default 0,
  discount_reason text,
  receipt_number  text unique,
  status          text check (status in ('unpaid','partial','paid','waived')) not null default 'unpaid',
  due_date        date,
  paid_at         timestamptz,
  created_at      timestamptz default now()
);

create index idx_fee_records_student  on fee_records(student_id);
create index idx_fee_records_status   on fee_records(status);
create index idx_fee_records_due_date on fee_records(due_date);

alter table fee_records enable row level security;
create policy "Auth users can read fee records"   on fee_records for select to authenticated using (true);
create policy "Auth users can insert fee records" on fee_records for insert to authenticated with check (true);
create policy "Auth users can update fee records" on fee_records for update to authenticated using (true);
create policy "Auth users can delete fee records" on fee_records for delete to authenticated using (true);

-- School Info (single-row config)
create table school_info (
  id                   uuid primary key default gen_random_uuid(),
  school_name          text not null default '',
  address              text not null default '',
  phone                text not null default '',
  email                text not null default '',
  logo_url             text,
  whatsapp_number      text not null default '',
  operating_hours      jsonb,
  google_maps_embed_url text not null default '',
  facebook_url         text not null default '',
  instagram_url        text not null default '',
  updated_at           timestamptz default now()
);

-- Migration (run if table already exists):
-- alter table school_info
--   add column if not exists whatsapp_number text not null default '',
--   add column if not exists operating_hours jsonb,
--   add column if not exists google_maps_embed_url text not null default '',
--   add column if not exists facebook_url text not null default '',
--   add column if not exists instagram_url text not null default '';

alter table school_info enable row level security;
create policy "Auth users can read school info"   on school_info for select to authenticated using (true);
create policy "Auth users can insert school info" on school_info for insert to authenticated with check (true);
create policy "Auth users can update school info" on school_info for update to authenticated using (true);
create policy "Anyone can read school info"       on school_info for select to anon using (true);

-- Storage Bucket Policies
-- Run these after creating the four buckets in the Supabase Storage dashboard
-- (all buckets must be created as public): student-photos, gallery-photos,
-- announcement-banners, testimonial-avatars

-- gallery-photos
drop policy if exists "Auth users can upload gallery photos" on storage.objects;
drop policy if exists "Auth users can update gallery photos" on storage.objects;
drop policy if exists "Auth users can delete gallery photos" on storage.objects;
drop policy if exists "Anyone can read gallery photos"       on storage.objects;
drop policy if exists "Allow authenticated uploads"          on storage.objects;
drop policy if exists "Allow authenticated updates"          on storage.objects;
drop policy if exists "Allow authenticated deletes"          on storage.objects;
create policy "Auth users can upload gallery photos"  on storage.objects for insert to authenticated with check (bucket_id = 'gallery-photos');
create policy "Auth users can update gallery photos"  on storage.objects for update to authenticated using  (bucket_id = 'gallery-photos');
create policy "Auth users can delete gallery photos"  on storage.objects for delete to authenticated using  (bucket_id = 'gallery-photos');
create policy "Anyone can read gallery photos"        on storage.objects for select to anon, authenticated using (bucket_id = 'gallery-photos');

-- student-photos
drop policy if exists "Auth users can upload student photos" on storage.objects;
drop policy if exists "Auth users can update student photos" on storage.objects;
drop policy if exists "Auth users can delete student photos" on storage.objects;
drop policy if exists "Anyone can read student photos"       on storage.objects;
create policy "Auth users can upload student photos"  on storage.objects for insert to authenticated with check (bucket_id = 'student-photos');
create policy "Auth users can update student photos"  on storage.objects for update to authenticated using  (bucket_id = 'student-photos');
create policy "Auth users can delete student photos"  on storage.objects for delete to authenticated using  (bucket_id = 'student-photos');
create policy "Anyone can read student photos"        on storage.objects for select to anon, authenticated using (bucket_id = 'student-photos');

-- announcement-banners
drop policy if exists "Auth users can upload announcement banners" on storage.objects;
drop policy if exists "Auth users can update announcement banners" on storage.objects;
drop policy if exists "Auth users can delete announcement banners" on storage.objects;
drop policy if exists "Anyone can read announcement banners"       on storage.objects;
create policy "Auth users can upload announcement banners"  on storage.objects for insert to authenticated with check (bucket_id = 'announcement-banners');
create policy "Auth users can update announcement banners"  on storage.objects for update to authenticated using  (bucket_id = 'announcement-banners');
create policy "Auth users can delete announcement banners"  on storage.objects for delete to authenticated using  (bucket_id = 'announcement-banners');
create policy "Anyone can read announcement banners"        on storage.objects for select to anon, authenticated using (bucket_id = 'announcement-banners');

-- testimonial-avatars
drop policy if exists "Auth users can upload testimonial avatars" on storage.objects;
drop policy if exists "Auth users can update testimonial avatars" on storage.objects;
drop policy if exists "Auth users can delete testimonial avatars" on storage.objects;
drop policy if exists "Anyone can read testimonial avatars"       on storage.objects;
create policy "Auth users can upload testimonial avatars"  on storage.objects for insert to authenticated with check (bucket_id = 'testimonial-avatars');
create policy "Auth users can update testimonial avatars"  on storage.objects for update to authenticated using  (bucket_id = 'testimonial-avatars');
create policy "Auth users can delete testimonial avatars"  on storage.objects for delete to authenticated using  (bucket_id = 'testimonial-avatars');
create policy "Anyone can read testimonial avatars"        on storage.objects for select to anon, authenticated using (bucket_id = 'testimonial-avatars');

-- Testimonials
create table testimonials (
  id            uuid primary key default uuid_generate_v4(),
  parent_name   text not null,
  parent_role   text,
  quote         text not null,
  avatar_url    text,
  display_order int not null default 0,
  is_visible    boolean not null default true,
  created_at    timestamptz default now()
);

create index idx_testimonials_display_order on testimonials(display_order);

alter table testimonials enable row level security;
create policy "Auth users manage testimonials"        on testimonials for all    to authenticated using (true) with check (true);
create policy "Anyone reads visible testimonials"     on testimonials for select to anon          using (is_visible = true);

-- Inquiries
create table inquiries (
  id          uuid primary key default uuid_generate_v4(),
  parent_name text not null,
  child_name  text not null,
  child_age   int  not null check (child_age between 2 and 7),
  phone       text not null,
  message     text not null default '',
  created_at  timestamptz default now()
);

create index idx_inquiries_created_at on inquiries(created_at desc);

alter table inquiries enable row level security;
create policy "Auth users manage inquiries"    on inquiries for all    to authenticated using (true) with check (true);
create policy "Anyone can submit an inquiry"   on inquiries for insert to anon          with check (true);
