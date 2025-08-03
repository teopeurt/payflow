-- Fix infinite recursion in RLS policies for projects and project_team tables

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can read projects they're assigned to or are clients of" ON app.projects;
DROP POLICY IF EXISTS "Project team members and admins can update projects" ON app.projects;
DROP POLICY IF EXISTS "Users can read project team assignments" ON app.project_team;
DROP POLICY IF EXISTS "Project team members and admins can manage project team" ON app.project_team;

-- Recreate projects policies without circular reference
CREATE POLICY "Users can read projects they're assigned to or are clients of"
  ON app.projects FOR SELECT
  TO authenticated
  USING (
    -- Direct check without going through project_team view
    EXISTS (
      SELECT 1 FROM app.project_team pt 
      WHERE pt.project_id = app.projects.id 
      AND pt.user_id = auth.uid()
    ) OR
    client_id = auth.uid() OR
    EXISTS (SELECT 1 FROM app.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Project team members and admins can update projects"
  ON app.projects FOR UPDATE
  TO authenticated
  USING (
    -- Direct check without going through project_team view
    EXISTS (
      SELECT 1 FROM app.project_team pt 
      WHERE pt.project_id = app.projects.id 
      AND pt.user_id = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM app.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Recreate project_team policies without circular reference
CREATE POLICY "Users can read project team assignments"
  ON app.project_team FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    -- Check if user is part of the same project without going through projects table
    project_id IN (
      SELECT DISTINCT pt2.project_id 
      FROM app.project_team pt2 
      WHERE pt2.user_id = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM app.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Project team members and admins can manage project team"
  ON app.project_team FOR ALL
  TO authenticated
  USING (
    -- Check if user is part of the same project without going through projects table
    project_id IN (
      SELECT DISTINCT pt2.project_id 
      FROM app.project_team pt2 
      WHERE pt2.user_id = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM app.profiles WHERE id = auth.uid() AND role = 'admin')
  );