-- 1. Drop the problematic policy if it exists
DROP POLICY IF EXISTS "Project team members and admins can manage project team" ON app.project_team;

-- 2. Create helper function to avoid recursion in policy
CREATE OR REPLACE FUNCTION app.is_user_in_project(p_project_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM app.project_team 
    WHERE project_id = p_project_id 
    AND user_id = p_user_id
  );
$$;

-- 3. Recreate the policy using the helper function
CREATE POLICY "Project team members and admins can manage project team"
  ON app.project_team FOR ALL
  TO authenticated
  USING (
    user_id = auth.uid() OR
    app.is_user_in_project(project_id, auth.uid()) OR
    EXISTS (
      SELECT 1 FROM app.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
