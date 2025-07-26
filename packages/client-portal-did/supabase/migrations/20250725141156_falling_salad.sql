/*
  # Database Analysis and Improvements

  ## Current Structure Analysis:
  
  ### ✅ Strong Points:
  1. Comprehensive user management with role-based access
  2. Complete project lifecycle management
  3. Full invoicing system with line items
  4. Message threading system
  5. Calendar integration
  6. File management with sharing capabilities
  7. Proper RLS policies for security
  8. Audit logging system

  ### 🔧 Potential Improvements:

  1. **Message Recipients Table**
     - Currently exists but may need better indexing for performance
     - Read status tracking is implemented

  2. **Task Assignments**
     - Well implemented with proper foreign keys
     - Supports multiple assignees per task

  3. **Project Team Management**
     - Good structure with role-based permissions
     - JSON permissions field allows flexible access control

  4. **Invoice Calculations**
     - Automatic total calculation via triggers
     - Tax handling is properly implemented

  5. **Calendar Event Attendees**
     - Event attendees table exists and is properly linked
     - Response tracking (pending, accepted, declined, tentative)

  ### 📊 Performance Considerations:

  1. **Indexes** - Most tables have proper primary keys and unique constraints
  2. **Foreign Keys** - Proper relationships with CASCADE deletes where appropriate
  3. **RLS Policies** - Comprehensive security policies for all tables

  ### 🚀 Recommended Enhancements:
*/

-- Add indexes for better query performance on frequently accessed columns
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_time ON calendar_events(start_time);
CREATE INDEX IF NOT EXISTS idx_files_project_id ON files(project_id);

-- Add composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_projects_client_status ON projects(client_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_project_status ON tasks(project_id, status);
CREATE INDEX IF NOT EXISTS idx_invoices_client_status ON invoices(client_id, status);

-- Add indexes for date-based queries
CREATE INDEX IF NOT EXISTS idx_projects_dates ON projects(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_dates ON invoices(issue_date, due_date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_date_range ON calendar_events(start_time, end_time);

-- Ensure proper text search capabilities
CREATE INDEX IF NOT EXISTS idx_projects_name_search ON projects USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_tasks_title_search ON tasks USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_messages_content_search ON messages USING gin(to_tsvector('english', content));

-- Add function to get user dashboard stats
CREATE OR REPLACE FUNCTION get_user_dashboard_stats(user_id uuid)
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'active_projects', (
      SELECT COUNT(*) FROM projects 
      WHERE (client_id = user_id OR id IN (
        SELECT project_id FROM project_team WHERE user_id = get_user_dashboard_stats.user_id
      )) AND status = 'active'
    ),
    'completed_projects', (
      SELECT COUNT(*) FROM projects 
      WHERE (client_id = user_id OR id IN (
        SELECT project_id FROM project_team WHERE user_id = get_user_dashboard_stats.user_id
      )) AND status = 'completed'
    ),
    'pending_tasks', (
      SELECT COUNT(*) FROM tasks t
      JOIN projects p ON t.project_id = p.id
      WHERE (p.client_id = user_id OR p.id IN (
        SELECT project_id FROM project_team WHERE user_id = get_user_dashboard_stats.user_id
      )) AND t.status IN ('todo', 'in_progress')
    ),
    'total_invoices', (
      SELECT COUNT(*) FROM invoices 
      WHERE client_id = user_id
    ),
    'unread_messages', (
      SELECT COUNT(*) FROM message_recipients mr
      JOIN messages m ON mr.message_id = m.id
      WHERE mr.user_id = get_user_dashboard_stats.user_id 
      AND mr.read_status = false
      AND m.sender_id != get_user_dashboard_stats.user_id
    ),
    'upcoming_events', (
      SELECT COUNT(*) FROM calendar_events
      WHERE start_time > NOW()
      AND (created_by = user_id OR id IN (
        SELECT event_id FROM event_attendees WHERE user_id = get_user_dashboard_stats.user_id
      ))
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add RLS policy for the dashboard function
GRANT EXECUTE ON FUNCTION get_user_dashboard_stats(uuid) TO authenticated;

-- Add function to mark messages as read
CREATE OR REPLACE FUNCTION mark_message_as_read(message_id uuid, user_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE message_recipients 
  SET read_status = true, read_at = NOW()
  WHERE message_recipients.message_id = mark_message_as_read.message_id 
  AND message_recipients.user_id = mark_message_as_read.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION mark_message_as_read(uuid, uuid) TO authenticated;

-- Add function to get project progress
CREATE OR REPLACE FUNCTION get_project_progress(project_id uuid)
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'total_tasks', COUNT(*),
    'completed_tasks', COUNT(*) FILTER (WHERE status = 'completed'),
    'in_progress_tasks', COUNT(*) FILTER (WHERE status = 'in_progress'),
    'todo_tasks', COUNT(*) FILTER (WHERE status = 'todo'),
    'progress_percentage', CASE 
      WHEN COUNT(*) = 0 THEN 0 
      ELSE ROUND((COUNT(*) FILTER (WHERE status = 'completed')::numeric / COUNT(*)::numeric) * 100, 2)
    END
  ) INTO result
  FROM tasks 
  WHERE tasks.project_id = get_project_progress.project_id;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_project_progress(uuid) TO authenticated;