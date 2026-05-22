-- 0007_auth_roles_and_whitelist.sql
-- Phase 1: Database schema for role-based access control (RBAC), whitelist system, and user linking.

-- ============================================================
-- 1. Alter team_members table
-- ============================================================
alter table team_members
add column user_id uuid references auth.users(id) on delete set null,
add column role text not null default 'member' check (role in ('admin', 'member')),
add constraint team_members_email_unique unique(email);

-- Create index for fast lookups by user_id and email
create index team_members_user_id_idx on team_members(user_id);
create index team_members_email_idx on team_members(email);


-- ============================================================
-- 2. Alter leads table
-- ============================================================
alter table leads
add column user_id uuid references auth.users(id) on delete cascade;

-- Create index for fast filtering by user_id
create index leads_user_id_idx on leads(user_id);


-- ============================================================
-- 3. Trigger function: auto-link users on signup
-- ============================================================
-- This function runs AFTER INSERT ON auth.users.
-- - If email is 'growadmin@gmail.com', create/update team_members with role='admin'
-- - If email exists in team_members, link the user_id
-- - Otherwise, do nothing (they will be blocked by middleware)

create or replace function handle_auth_user_signup()
returns trigger as $$
declare
  existing_member_id uuid;
begin
  -- Check if email already exists in team_members
  select id into existing_member_id from public.team_members where email = new.email limit 1;

  if existing_member_id is not null then
    -- Email exists in whitelist: link the user_id
    update public.team_members
    set user_id = new.id
    where email = new.email;
  elsif new.email = 'growadmin@gmail.com' then
    -- Special case: admin account
    insert into public.team_members (user_id, email, full_name, initials, role, active)
    values (new.id, new.email, 'Admin', 'A', 'admin', true)
    on conflict (email) do update
    set user_id = new.id, role = 'admin'
    where public.team_members.email = 'growadmin@gmail.com';
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- Drop trigger if it exists (idempotent)
drop trigger if exists on_auth_user_created on auth.users;

-- Attach trigger to auth.users table
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function handle_auth_user_signup();


-- ============================================================
-- 4. Update RLS policies on leads table
-- ============================================================
-- Drop existing overly-permissive policies
drop policy if exists "Authenticated users can read all leads" on leads;
drop policy if exists "Authenticated users can insert leads" on leads;
drop policy if exists "Authenticated users can update leads" on leads;
drop policy if exists "Authenticated users can delete leads" on leads;

-- New policies: members see/edit only their own; admins see all
create policy "Members can read own leads"
  on leads for select
  to authenticated
  using (
    user_id = auth.uid() or
    (select role from team_members where user_id = auth.uid()) = 'admin'
  );

create policy "Members can insert own leads"
  on leads for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Members can update own leads"
  on leads for update
  to authenticated
  using (
    user_id = auth.uid() or
    (select role from team_members where user_id = auth.uid()) = 'admin'
  )
  with check (
    user_id = auth.uid() or
    (select role from team_members where user_id = auth.uid()) = 'admin'
  );

create policy "Members can delete own leads"
  on leads for delete
  to authenticated
  using (
    user_id = auth.uid() or
    (select role from team_members where user_id = auth.uid()) = 'admin'
  );
