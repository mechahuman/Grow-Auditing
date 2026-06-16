-- 0012_add_soft_delete_support.sql
-- Add soft delete support to leads table

-- Add deleted_at column to leads table
alter table leads add column deleted_at timestamptz null;

-- Create index for filtering out deleted leads
create index idx_leads_deleted_at on leads(deleted_at);

-- Add comment explaining the soft delete column
comment on column leads.deleted_at is 'Timestamp when lead was soft-deleted (archived). NULL means lead is active.';
