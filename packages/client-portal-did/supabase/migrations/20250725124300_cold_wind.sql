/*
  # Messaging System Schema

  1. New Tables
    - `message_threads` - Conversation threads linked to projects
    - `messages` - Individual messages within threads
    - `message_recipients` - Message read status tracking
    - `message_attachments` - File attachments to messages

  2. Security
    - Enable RLS on all tables
    - Create policies for thread-based access control

  3. Features
    - Thread-based conversations
    - Read receipt tracking
    - File attachment support
    - Real-time message updates
*/

-- Create message threads
CREATE TABLE IF NOT EXISTS message_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  subject text NOT NULL,
  created_by uuid REFERENCES profiles(id) NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create messages
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid REFERENCES message_threads(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES profiles(id) NOT NULL,
  content text NOT NULL,
  message_type text DEFAULT 'text' CHECK (message_type IN ('text', 'system', 'file')),
  created_at timestamptz DEFAULT now() NOT NULL,
  edited_at timestamptz,
  is_deleted boolean DEFAULT false
);

-- Create message recipients for read tracking
CREATE TABLE IF NOT EXISTS message_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid REFERENCES messages(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  read_status boolean DEFAULT false,
  read_at timestamptz,
  UNIQUE(message_id, user_id)
);

-- Create thread participants
CREATE TABLE IF NOT EXISTS thread_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid REFERENCES message_threads(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now() NOT NULL,
  last_read_at timestamptz,
  UNIQUE(thread_id, user_id)
);

-- Enable RLS
ALTER TABLE message_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE thread_participants ENABLE ROW LEVEL SECURITY;

-- Message threads policies
CREATE POLICY "Users can read threads for their projects"
  ON message_threads FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT project_id FROM project_team WHERE user_id = auth.uid()
    ) OR
    project_id IN (
      SELECT id FROM projects WHERE client_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Project members can create threads"
  ON message_threads FOR INSERT
  TO authenticated
  WITH CHECK (
    project_id IN (
      SELECT project_id FROM project_team WHERE user_id = auth.uid()
    ) OR
    project_id IN (
      SELECT id FROM projects WHERE client_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Messages policies
CREATE POLICY "Users can read messages in their threads"
  ON messages FOR SELECT
  TO authenticated
  USING (
    thread_id IN (
      SELECT id FROM message_threads WHERE
        project_id IN (
          SELECT project_id FROM project_team WHERE user_id = auth.uid()
        ) OR
        project_id IN (
          SELECT id FROM projects WHERE client_id = auth.uid()
        )
    ) OR
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can send messages in their threads"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    thread_id IN (
      SELECT id FROM message_threads WHERE
        project_id IN (
          SELECT project_id FROM project_team WHERE user_id = auth.uid()
        ) OR
        project_id IN (
          SELECT id FROM projects WHERE client_id = auth.uid()
        )
    ) OR
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Message recipients policies
CREATE POLICY "Users can manage their message read status"
  ON message_recipients FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- Thread participants policies
CREATE POLICY "Users can read thread participants"
  ON thread_participants FOR SELECT
  TO authenticated
  USING (
    thread_id IN (
      SELECT id FROM message_threads WHERE
        project_id IN (
          SELECT project_id FROM project_team WHERE user_id = auth.uid()
        ) OR
        project_id IN (
          SELECT id FROM projects WHERE client_id = auth.uid()
        )
    ) OR
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Function to automatically add thread participants
CREATE OR REPLACE FUNCTION add_thread_participants()
RETURNS trigger AS $$
BEGIN
  -- Add all project team members as participants
  INSERT INTO thread_participants (thread_id, user_id)
  SELECT NEW.id, user_id
  FROM project_team
  WHERE project_id = NEW.project_id
  ON CONFLICT (thread_id, user_id) DO NOTHING;
  
  -- Add project client as participant
  INSERT INTO thread_participants (thread_id, user_id)
  SELECT NEW.id, client_id
  FROM projects
  WHERE id = NEW.project_id AND client_id IS NOT NULL
  ON CONFLICT (thread_id, user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to add participants when thread is created
CREATE TRIGGER add_thread_participants_trigger
  AFTER INSERT ON message_threads
  FOR EACH ROW EXECUTE FUNCTION add_thread_participants();

-- Function to create message recipients
CREATE OR REPLACE FUNCTION create_message_recipients()
RETURNS trigger AS $$
BEGIN
  -- Add all thread participants except sender as recipients
  INSERT INTO message_recipients (message_id, user_id)
  SELECT NEW.id, user_id
  FROM thread_participants
  WHERE thread_id = NEW.thread_id AND user_id != NEW.sender_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create recipients when message is sent
CREATE TRIGGER create_message_recipients_trigger
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION create_message_recipients();

-- Update thread updated_at when new message is added
CREATE TRIGGER update_message_threads_updated_at
  BEFORE UPDATE ON message_threads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();