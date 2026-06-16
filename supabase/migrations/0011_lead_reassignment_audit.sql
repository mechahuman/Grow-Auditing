-- 0011_lead_reassignment_audit.sql
-- Create audit trail table for lead reassignments (Phase 6: Lead Management)

create table if not exists lead_reassignment_audit (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  previous_assignee_id uuid references auth.users(id) on delete set null,
  new_assignee_id uuid not null references auth.users(id) on delete restrict,
  changed_by_id uuid not null references auth.users(id) on delete set null,
  action text not null default 'Reassigned' check (action in ('Created', 'Reassigned', 'Unassigned')),
  notes text,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table lead_reassignment_audit enable row level security;

-- Create RLS policy: Only authenticated users can view audit logs
create policy "Users can view lead audit logs"
  on lead_reassignment_audit
  for select
  using (auth.role() = 'authenticated');

-- Create RLS policy: Only admins can insert audit logs
create policy "Only admins can create audit logs"
  on lead_reassignment_audit
  for insert
  with check (
    auth.role() = 'authenticated' and
    (select role from team_members where user_id = auth.uid()) = 'admin'
  );

-- Create indexes for faster queries
create index idx_lead_reassignment_audit_lead_id on lead_reassignment_audit(lead_id);
create index idx_lead_reassignment_audit_created_at on lead_reassignment_audit(created_at desc);
create index idx_lead_reassignment_audit_changed_by on lead_reassignment_audit(changed_by_id);
