-- Fix infinite recursion in project_team RLS policy
-- The issue is that the policy references the same table it's protecting

-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Users can read project team assignments" ON app.project_team;

-- Recreate the policy without self-referencing queries
CREATE POLICY "Users can read project team assignments"
  ON app.project_team FOR SELECT
  TO authenticated
  USING (
    -- Users can see their own team assignments
    user_id = auth.uid() OR
    -- Admins can see all assignments
    EXISTS (SELECT 1 FROM app.profiles WHERE id = auth.uid() AND role = 'admin')
  );