-- 0010_allow_duplicate_initials.sql
-- Purpose: Allow duplicate initials since display format is "initials (full_name)"

-- Drop the unique constraint on initials if it exists
ALTER TABLE team_members DROP CONSTRAINT IF EXISTS team_members_initials_key;
