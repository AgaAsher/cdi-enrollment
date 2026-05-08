-- Child Development Academy - International School of Laos
-- Enrollment Database Schema

create table if not exists enrollments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  status text not null default 'pending' check (status in ('pending', 'reviewed', 'accepted', 'rejected')),

  -- Child information
  child_first_name text not null,
  child_last_name text not null,
  child_date_of_birth date not null,
  child_gender text not null check (child_gender in ('male', 'female', 'other')),
  child_nationality text not null,
  applying_for_grade text not null,
  academic_year text not null,
  previous_school text,
  languages_spoken text,

  -- Parent / Guardian 1
  parent1_full_name text not null,
  parent1_relationship text not null,
  parent1_phone text not null,
  parent1_email text not null,
  parent1_occupation text,

  -- Parent / Guardian 2
  parent2_full_name text,
  parent2_relationship text,
  parent2_phone text,
  parent2_email text,

  -- Address
  home_address text not null,
  city text not null default 'Vientiane',

  -- Medical
  medical_conditions text,
  allergies text,
  emergency_contact_name text not null,
  emergency_contact_phone text not null,
  emergency_contact_relationship text not null,

  -- Admin notes
  admin_notes text,

  -- Soft delete
  deleted_at timestamptz
);

-- Enable Row Level Security
-- Soft-delete column (run if upgrading from earlier schema)
alter table enrollments add column if not exists deleted_at timestamptz;

alter table enrollments enable row level security;

-- Policy: anyone can insert (public form submission)
create policy "Allow public insert" on enrollments
  for insert with check (true);

-- Policy: only authenticated admin can read/update
create policy "Allow admin read" on enrollments
  for select using (auth.role() = 'authenticated');

create policy "Allow admin update" on enrollments
  for update using (auth.role() = 'authenticated');

-- ── Published timetables (generated schedules) ─────────────────────────────
-- Run this migration to enable timetable generation & publishing

create table if not exists published_timetables (
  id             uuid         primary key default gen_random_uuid(),
  published_at   timestamptz  default now(),
  academic_year  text         not null default '2025-2026',
  timetable_data jsonb        not null,
  is_active      boolean      default true
);

alter table published_timetables enable row level security;

-- Anyone can read active timetables (for the public /timetable page)
create policy "Public read active timetables"
  on published_timetables for select using (is_active = true);

-- ── Admin users (admins, staff, teachers) ─────────────────────────────────────

create table if not exists admin_users (
  id            uuid        primary key default gen_random_uuid(),
  created_at    timestamptz default now(),
  name          text        not null,
  email         text        not null unique,
  password_hash text        not null,
  role          text        not null default 'staff'
                            check (role in ('super_admin', 'admin', 'staff', 'teacher')),
  permissions   jsonb       not null default '{}',
  active        boolean     not null default true
);

alter table admin_users enable row level security;
create policy "Service role full access on admin_users"
  on admin_users using (true) with check (true);

-- Profile data for teachers (birthday, phone, nationality, job title)
alter table admin_users add column if not exists profile jsonb not null default '{}';

-- ── Attendance records ────────────────────────────────────────────────────────

create table if not exists attendance (
  id           uuid        primary key default gen_random_uuid(),
  created_at   timestamptz default now(),
  updated_at   timestamptz default now(),
  date         date        not null,
  class_label  text        not null,
  subject      text        not null,
  slot_time    text        not null,
  teacher_name text        not null,
  records      jsonb       not null default '[]',
  -- each record: { student_id, student_name, status: 'present'|'absent'|'late' }
  unique (date, class_label, subject, slot_time, teacher_name)
);

alter table attendance enable row level security;
create policy "Service role full access on attendance"
  on attendance using (true) with check (true);
