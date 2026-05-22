-- 0009_cleanup_and_fix_trigger.sql
-- Purpose: Clean up all data except admin account, and fix trigger to only allow pre-registered members

-- ============================================================
-- 1. Delete all leads (cascade will be handled by FK constraint)
-- ============================================================
DELETE FROM leads;

-- ============================================================
-- 2. Delete all team members except admin@grow.com
-- ============================================================
DELETE FROM team_members WHERE email != 'admin@grow.com';

-- ============================================================
-- 3. Ensure admin@grow.com exists in team_members
-- ============================================================
INSERT INTO team_members (email, full_name, initials, role, active)
VALUES ('admin@grow.com', 'Admin', 'AD', 'admin', true)
ON CONFLICT (email) DO UPDATE
SET role = 'admin', active = true
WHERE team_members.email = 'admin@grow.com';

-- ============================================================
-- 4. Fix trigger: ONLY allow pre-registered members to login
--    Do NOT auto-create members for unknown emails
-- ============================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION handle_auth_user_signup()
RETURNS TRIGGER AS $$
DECLARE
  existing_member_id uuid;
BEGIN
  -- Check if email already exists in team_members (whitelist)
  SELECT id INTO existing_member_id FROM public.team_members WHERE email = NEW.email LIMIT 1;

  IF existing_member_id IS NOT NULL THEN
    -- Email exists in whitelist: link the user_id
    UPDATE public.team_members
    SET user_id = NEW.id
    WHERE email = NEW.email;
  ELSE
    -- Email NOT in whitelist: do nothing
    -- User will be blocked by middleware and redirected to /unauthorized
    -- No auto-creation of members allowed
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_auth_user_signup();

-- ============================================================
-- 5. Verify RLS policies are correct for member isolation
-- ============================================================
-- Members should only see their own leads
-- Admins should see all leads
-- (These should already be correct from 0007)
