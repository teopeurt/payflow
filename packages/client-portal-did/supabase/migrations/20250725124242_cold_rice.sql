/*
  # Project Management Schema

  1. New Tables
    - `projects` - Core project information and status tracking
    - `project_team` - Team member assignments to projects
    - `tasks` - Task management within projects
    - `task_assignments` - Task assignments to team members

  2. Security
    - Enable RLS on all tables
    - Create policies for project-based access control

  3. Features
    - Project lifecycle management
    - Team assignments with roles
    - Task tracking with status and priority
    - Hierarchical task relationships
*/

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  status text NOT NULL CHECK (status IN ('draft', 'active', 'completed', 'archived')) DEFAULT 'draft',
  priority text CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  client_id uuid REFERENCES profiles(id),
  start_date date,
  end_date date,
  budget numeric(12,2),
  created_by uuid REFERENCES profiles(id) NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create project team assignments
CREATE TABLE IF NOT EXISTS project_team (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member',
  permissions jsonb DEFAULT '{}',
  joined_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(project_id, user_id)
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  parent_task_id uuid REFERENCES tasks(id),
  title text NOT NULL,
  description text,
  status text NOT NULL CHECK (status IN ('todo', 'in_progress', 'review', 'completed', 'cancelled')) DEFAULT 'todo',
  priority text CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  due_date timestamptz,
  estimated_hours numeric(8,2),
  actual_hours numeric(8,2),
  created_by uuid REFERENCES profiles(id) NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create task assignments
CREATE TABLE IF NOT EXISTS task_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_by uuid REFERENCES profiles(id) NOT NULL,
  assigned_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(task_id, user_id)
);

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_team ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;

-- Projects policies
CREATE POLICY "Users can read projects they're assigned to"
  ON projects FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id FROM project_team WHERE project_id = projects.id
    ) OR
    auth.uid() = client_id OR
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins and team members can create projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'team_member')
    )
  );

CREATE POLICY "Project team members can update projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id FROM project_team WHERE project_id = projects.id
    ) OR
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Project team policies
CREATE POLICY "Users can read project team assignments"
  ON project_team FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    project_id IN (
      SELECT project_id FROM project_team WHERE user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Tasks policies
CREATE POLICY "Users can read tasks from their projects"
  ON tasks FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT project_id FROM project_team WHERE user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Project team members can manage tasks"
  ON tasks FOR ALL
  TO authenticated
  USING (
    project_id IN (
      SELECT project_id FROM project_team WHERE user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Task assignments policies
CREATE POLICY "Users can read task assignments"
  ON task_assignments FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    task_id IN (
      SELECT id FROM tasks WHERE project_id IN (
        SELECT project_id FROM project_team WHERE user_id = auth.uid()
      )
    ) OR
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Functions and triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();