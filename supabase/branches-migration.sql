-- Multi-branch support migration
-- Run this after the base schema.sql

-- ── Branches ──────────────────────────────────────────────────────────────────
create table if not exists branches (
  id         uuid        primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  name       text        not null,
  code       text        not null unique,  -- short identifier e.g. 'VTE-01'
  address    text,
  active     boolean     not null default true
);

alter table branches enable row level security;
create policy "Service role full access on branches"
  on branches using (true) with check (true);

-- ── Add branch_id to all key tables ──────────────────────────────────────────
alter table enrollments          add column if not exists branch_id uuid references branches(id);
alter table admin_users          add column if not exists branch_id uuid references branches(id);
alter table attendance           add column if not exists branch_id uuid references branches(id);
alter table parent_messages      add column if not exists branch_id uuid references branches(id);
alter table published_timetables add column if not exists branch_id uuid references branches(id);

-- ── Indexes for branch-filtered queries ───────────────────────────────────────
create index if not exists enrollments_branch_id_idx          on enrollments(branch_id);
create index if not exists admin_users_branch_id_idx          on admin_users(branch_id);
create index if not exists attendance_branch_id_idx           on attendance(branch_id);
create index if not exists parent_messages_branch_id_idx      on parent_messages(branch_id);
create index if not exists published_timetables_branch_id_idx on published_timetables(branch_id);
