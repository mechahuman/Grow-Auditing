-- 0003_rls_policies.sql
-- Row Level Security policies for all tables.
-- Apply during Week 5 after auth is confirmed working end-to-end.

-- Enable RLS on all tables
alter table leads enable row level security;
alter table team_members enable row level security;
alter table status_options enable row level security;


-- ============================================================
-- leads: authenticated users can read all rows and write leads
-- ============================================================
create policy "Authenticated users can read all leads"
  on leads for select
  to authenticated
  using (true);

create policy "Authenticated users can insert leads"
  on leads for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update leads"
  on leads for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can delete leads"
  on leads for delete
  to authenticated
  using (true);


-- ============================================================
-- team_members: authenticated users read; service role writes
-- ============================================================
create policy "Authenticated users can read team members"
  on team_members for select
  to authenticated
  using (true);

-- Insert/update/delete: service role only (Supabase dashboard or seed script)
-- No explicit policy needed — service role bypasses RLS by default.


-- ============================================================
-- status_options: authenticated users read; service role writes
-- ============================================================
create policy "Authenticated users can read status options"
  on status_options for select
  to authenticated
  using (true);

-- Insert/update/delete: service role only.
