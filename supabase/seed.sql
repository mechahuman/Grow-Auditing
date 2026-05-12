-- seed.sql
-- FILL IN YOUR TEAM BEFORE RUNNING THIS FILE.
-- Replace the placeholder rows below with real initials, full names, and emails.
-- Run with: npm run seed   (or paste into Supabase SQL editor)

-- Status options are seeded via 0002_seed_status_options.sql migration.
-- This file is only for team_members.

insert into team_members (initials, full_name, email, active) values
  ('M', 'Manav',        null, true),   -- EDIT: replace with real full name and email
  ('T2', 'Teammate 2',  null, true),   -- EDIT: replace with real initials, name, email
  ('T3', 'Teammate 3',  null, true);   -- EDIT: replace or delete if team is smaller

-- Add more rows as needed. Delete rows for team members who haven't joined yet.
-- After editing, run: npm run seed
