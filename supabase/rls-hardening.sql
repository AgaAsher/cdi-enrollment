-- RLS Hardening Migration
-- Run this in the Supabase SQL editor.
--
-- Purpose: lock down all tables so that ONLY the service role (used by
-- our Next.js server) can read/write. Public anon clients should NEVER
-- be able to read enrollment data, admin users, or attendance records,
-- even if the anon key is exposed.
--
-- Before running, confirm:
--   * Your app exclusively uses createAdminClient() (service role) in
--     /src/lib/supabase/admin.ts. Service role bypasses RLS.
--   * No client-side code uses NEXT_PUBLIC_SUPABASE_ANON_KEY directly to
--     read these tables.

-- ─── Drop the existing permissive policies ───────────────────────────────
drop policy if exists "Allow public insert" on enrollments;
drop policy if exists "Allow admin read" on enrollments;
drop policy if exists "Allow admin update" on enrollments;
drop policy if exists "Public read active timetables" on published_timetables;
drop policy if exists "Service role full access on admin_users" on admin_users;
drop policy if exists "Service role full access on attendance" on attendance;

-- ─── Re-enable RLS on every table (defense in depth) ─────────────────────
alter table enrollments          enable row level security;
alter table published_timetables enable row level security;
alter table admin_users          enable row level security;
alter table attendance           enable row level security;

-- ─── Deny-all-by-default ──────────────────────────────────────────────────
-- With RLS enabled and no policy, anon and authenticated roles cannot read.
-- The service_role key bypasses RLS entirely, so the Next.js server still works.
--
-- We do NOT add any "permissive" policy here. That is the entire point.

-- ─── Optional: keep public read of active timetable for the /timetable page ──
-- The /timetable page hits this server-side via service role, so technically we
-- don't need this. Leave it commented out unless you want client-side reads.
--
-- create policy "Public read active timetables"
--   on published_timetables for select
--   to anon, authenticated
--   using (is_active = true);

-- ─── Verification ────────────────────────────────────────────────────────
-- After running, confirm with:
--   select tablename, rowsecurity from pg_tables where schemaname = 'public';
-- All four tables should show rowsecurity = true.
