-- Create lead_admin_notes table for Phase 5: Internal Notes & Commenting
create table if not exists lead_admin_notes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  admin_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table lead_admin_notes enable row level security;

-- Create RLS policy: Only authenticated users can view notes
create policy "Users can view lead notes"
  on lead_admin_notes
  for select
  using (auth.role() = 'authenticated');

-- Create RLS policy: Only admins can insert notes
create policy "Only admins can create notes"
  on lead_admin_notes
  for insert
  with check (
    auth.role() = 'authenticated' and
    (select role from team_members where user_id = auth.uid()) = 'admin'
  );

-- Create RLS policy: Only note creators can update their notes
create policy "Only note creators can update notes"
  on lead_admin_notes
  for update
  using (admin_id = auth.uid())
  with check (
    admin_id = auth.uid() and
    (select role from team_members where user_id = auth.uid()) = 'admin'
  );

-- Create RLS policy: Only note creators can delete their notes
create policy "Only note creators can delete notes"
  on lead_admin_notes
  for delete
  using (admin_id = auth.uid());

-- Create index for faster queries
create index idx_lead_admin_notes_lead_id on lead_admin_notes(lead_id);
create index idx_lead_admin_notes_admin_id on lead_admin_notes(admin_id);
