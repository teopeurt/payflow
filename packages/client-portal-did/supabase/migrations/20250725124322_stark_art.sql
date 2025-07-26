/*
  # Files and Invoice Management Schema

  1. New Tables
    - `files` - File storage metadata and access control
    - `file_shares` - File sharing permissions
    - `invoices` - Invoice generation and tracking
    - `invoice_items` - Line items for invoices
    - `payments` - Payment tracking and status

  2. Security
    - Enable RLS on all tables
    - Create policies for secure file access
    - Invoice access based on project permissions

  3. Features
    - Secure file storage with metadata
    - Granular file sharing permissions
    - Complete invoice lifecycle management
    - Payment tracking and reconciliation
*/

-- Create files table
CREATE TABLE IF NOT EXISTS files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename text NOT NULL,
  original_filename text NOT NULL,
  file_path text NOT NULL,
  file_size bigint NOT NULL,
  mime_type text NOT NULL,
  uploaded_by uuid REFERENCES profiles(id) NOT NULL,
  project_id uuid REFERENCES projects(id),
  description text,
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create file shares for granular permissions
CREATE TABLE IF NOT EXISTS file_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id uuid REFERENCES files(id) ON DELETE CASCADE,
  shared_with uuid REFERENCES profiles(id) ON DELETE CASCADE,
  permission text CHECK (permission IN ('view', 'download', 'edit')) DEFAULT 'view',
  shared_by uuid REFERENCES profiles(id) NOT NULL,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(file_id, shared_with)
);

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text UNIQUE NOT NULL,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  client_id uuid REFERENCES profiles(id) NOT NULL,
  status text CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled', 'partial')) DEFAULT 'draft',
  issue_date date NOT NULL,
  due_date date NOT NULL,
  subtotal numeric(12,2) NOT NULL DEFAULT 0,
  tax_rate numeric(5,2) DEFAULT 0,
  tax_amount numeric(12,2) DEFAULT 0,
  total_amount numeric(12,2) NOT NULL DEFAULT 0,
  notes text,
  terms text,
  created_by uuid REFERENCES profiles(id) NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create invoice items
CREATE TABLE IF NOT EXISTS invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid REFERENCES invoices(id) ON DELETE CASCADE,
  description text NOT NULL,
  quantity numeric(10,2) NOT NULL DEFAULT 1,
  unit_price numeric(12,2) NOT NULL,
  total_price numeric(12,2) NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid REFERENCES invoices(id) ON DELETE SET NULL,
  payment_method text CHECK (payment_method IN ('credit_card', 'bank_transfer', 'check', 'cash', 'stripe')) DEFAULT 'stripe',
  amount numeric(12,2) NOT NULL,
  transaction_id text,
  stripe_payment_intent_id text,
  status text CHECK (status IN ('pending', 'completed', 'failed', 'refunded')) DEFAULT 'pending',
  processed_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create calendar events
CREATE TABLE IF NOT EXISTS calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  location text,
  event_type text CHECK (event_type IN ('meeting', 'deadline', 'milestone', 'reminder')) DEFAULT 'meeting',
  status text CHECK (status IN ('scheduled', 'completed', 'cancelled')) DEFAULT 'scheduled',
  created_by uuid REFERENCES profiles(id) NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create event attendees
CREATE TABLE IF NOT EXISTS event_attendees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES calendar_events(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  response text CHECK (response IN ('pending', 'accepted', 'declined', 'tentative')) DEFAULT 'pending',
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(event_id, user_id)
);

-- Enable RLS
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;

-- Files policies
CREATE POLICY "Users can read files they uploaded or have access to"
  ON files FOR SELECT
  TO authenticated
  USING (
    uploaded_by = auth.uid() OR
    is_public = true OR
    id IN (
      SELECT file_id FROM file_shares WHERE shared_with = auth.uid()
    ) OR
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

CREATE POLICY "Users can upload files to their projects"
  ON files FOR INSERT
  TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid() AND (
      project_id IS NULL OR
      project_id IN (
        SELECT project_id FROM project_team WHERE user_id = auth.uid()
      ) OR
      project_id IN (
        SELECT id FROM projects WHERE client_id = auth.uid()
      ) OR
      EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
      )
    )
  );

-- Invoice policies
CREATE POLICY "Users can read invoices for their projects"
  ON invoices FOR SELECT
  TO authenticated
  USING (
    client_id = auth.uid() OR
    project_id IN (
      SELECT project_id FROM project_team WHERE user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Team members can manage invoices"
  ON invoices FOR ALL
  TO authenticated
  USING (
    project_id IN (
      SELECT project_id FROM project_team WHERE user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'team_member')
    )
  );

-- Calendar events policies
CREATE POLICY "Users can read events they're invited to"
  ON calendar_events FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid() OR
    id IN (
      SELECT event_id FROM event_attendees WHERE user_id = auth.uid()
    ) OR
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

-- Functions to calculate invoice totals
CREATE OR REPLACE FUNCTION calculate_invoice_totals()
RETURNS trigger AS $$
DECLARE
  subtotal_amount numeric(12,2);
  tax_amount numeric(12,2);
  total_amount numeric(12,2);
BEGIN
  -- Calculate subtotal from invoice items
  SELECT COALESCE(SUM(total_price), 0)
  INTO subtotal_amount
  FROM invoice_items
  WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id);
  
  -- Update invoice with calculated amounts
  UPDATE invoices 
  SET 
    subtotal = subtotal_amount,
    tax_amount = subtotal_amount * (tax_rate / 100),
    total_amount = subtotal_amount + (subtotal_amount * (tax_rate / 100)),
    updated_at = now()
  WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to recalculate invoice totals when items change
CREATE TRIGGER calculate_invoice_totals_trigger
  AFTER INSERT OR UPDATE OR DELETE ON invoice_items
  FOR EACH ROW EXECUTE FUNCTION calculate_invoice_totals();

-- Update triggers for updated_at columns
CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_events_updated_at
  BEFORE UPDATE ON calendar_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();