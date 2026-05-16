-- 0004_add_social_fields.sql
-- Add instagram and twitter fields to leads table

alter table leads
add column instagram text,
add column twitter text;
