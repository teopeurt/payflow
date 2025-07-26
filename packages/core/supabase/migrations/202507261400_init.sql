-- Create Schemas first to avoid "schema does not exist" errors during cleanup
CREATE SCHEMA IF NOT EXISTS app;
CREATE SCHEMA IF NOT EXISTS finance;
CREATE SCHEMA IF NOT EXISTS messaging;
CREATE SCHEMA IF NOT EXISTS audit;

-- Create necessary enums if they don't exist
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('admin', 'client', 'team_member');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'recurring_frequency_type') THEN
        CREATE TYPE public.recurring_frequency_type AS ENUM ('daily', 'weekly', 'monthly', 'quarterly', 'yearly');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'recurring_until_type') THEN
        CREATE TYPE public.recurring_until_type AS ENUM ('indefinitely', 'on_date', 'count');
    END IF;
END $$;

-- Drop all existing policies and functions that will be redefined to avoid conflicts
-- Functions first due to dependencies
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.calculate_invoice_totals();
DROP FUNCTION IF EXISTS public.add_thread_participants();
DROP FUNCTION IF EXISTS public.create_message_recipients();
DROP FUNCTION IF EXISTS public.update_updated_at_column();
DROP FUNCTION IF EXISTS public.log_audit_event(text, text, text, jsonb);
DROP FUNCTION IF EXISTS public.calculate_next_generation_date(date, recurring_frequency_type);
DROP FUNCTION IF EXISTS public.duplicate_invoice_with_items(uuid, jsonb, jsonb);
DROP FUNCTION IF EXISTS public.get_user_dashboard_stats(uuid);
DROP FUNCTION IF EXISTS public.mark_message_as_read(uuid, uuid);
DROP FUNCTION IF EXISTS public.get_project_progress(uuid);
DROP FUNCTION IF EXISTS public.handle_new_organization();
DROP FUNCTION IF EXISTS public.maintain_profile_organization_consistency();
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);
DROP FUNCTION IF EXISTS public.belongs_to_organization(uuid, uuid);


-- Tables in 'app' schema
CREATE TABLE IF NOT EXISTS app.organizations
(
    id               uuid                     DEFAULT gen_random_uuid()        NOT NULL PRIMARY KEY,
    name             text                                                      NOT NULL,
    created_at       timestamp with time zone DEFAULT now()                    NOT NULL,
    updated_at       timestamp with time zone DEFAULT now()                    NOT NULL,
    default_currency varchar(10)              DEFAULT 'USD'::character varying NOT NULL,
    company_name     text,
    company_email    text,
    company_logo_url text,
    company_address  text,
    company_phone    text,
    company_website  text,
    default_payment_terms integer DEFAULT 30
);

CREATE TABLE IF NOT EXISTS app.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  profile_picture_url text,
  role text NOT NULL CHECK (role IN ('admin', 'team_member', 'client')),
  company_name text,
  address jsonb,
  website_url text,
  notes text,
  client_status text CHECK (client_status IN ('lead', 'active', 'inactive')),
  source text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  last_login timestamptz,
  organization_id uuid REFERENCES app.organizations(id)
);

CREATE TABLE IF NOT EXISTS app.user_roles
(
    id         uuid                     DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id    uuid                                               NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role       public.app_role                                    NOT NULL,
    created_at timestamp with time zone DEFAULT now()             NOT NULL,
    UNIQUE (user_id, role)
);

CREATE TABLE IF NOT EXISTS app.invites
(
    id              uuid                     DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    email           text                                               NOT NULL UNIQUE,
    token           text                                               NOT NULL UNIQUE,
    organization_id uuid REFERENCES app.organizations(id),
    role            text                                               NOT NULL CHECK (role = ANY (ARRAY ['admin'::text, 'client'::text, 'team_member'::text])),
    created_at      timestamp with time zone DEFAULT now()             NOT NULL,
    expires_at      timestamp with time zone                           NOT NULL,
    used            boolean                  DEFAULT false             NOT NULL
);

CREATE TABLE IF NOT EXISTS app.organization_members
(
    id              uuid                     DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id         uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id uuid REFERENCES app.organizations(id) ON DELETE CASCADE,
    role            text                     DEFAULT 'member'::text    NOT NULL,
    is_primary      boolean                  DEFAULT false             NOT NULL,
    created_at      timestamp with time zone DEFAULT now(),
    UNIQUE (user_id, organization_id)
);

CREATE TABLE IF NOT EXISTS app.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  status text NOT NULL CHECK (status IN ('draft', 'active', 'completed', 'archived')) DEFAULT 'draft',
  priority text CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  client_id uuid REFERENCES app.profiles(id),
  start_date date,
  end_date date,
  budget numeric(12,2),
  created_by uuid REFERENCES app.profiles(id) NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  organization_id uuid NOT NULL REFERENCES app.organizations(id)
);

CREATE TABLE IF NOT EXISTS app.project_team (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES app.projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES app.profiles(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member',
  permissions jsonb DEFAULT '{}',
  joined_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(project_id, user_id)
);

CREATE TABLE IF NOT EXISTS app.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES app.projects(id) ON DELETE CASCADE,
  parent_task_id uuid REFERENCES app.tasks(id),
  title text NOT NULL,
  description text,
  status text NOT NULL CHECK (status IN ('todo', 'in_progress', 'review', 'completed', 'cancelled')) DEFAULT 'todo',
  priority text CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  due_date timestamptz,
  estimated_hours numeric(8,2),
  actual_hours numeric(8,2),
  created_by uuid REFERENCES app.profiles(id) NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS app.task_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES app.tasks(id) ON DELETE CASCADE,
  user_id uuid REFERENCES app.profiles(id) ON DELETE CASCADE,
  assigned_by uuid REFERENCES app.profiles(id) NOT NULL,
  assigned_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(task_id, user_id)
);

CREATE TABLE IF NOT EXISTS app.files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename text NOT NULL,
  original_filename text NOT NULL,
  file_path text NOT NULL,
  file_size bigint NOT NULL,
  mime_type text NOT NULL,
  uploaded_by uuid REFERENCES app.profiles(id) NOT NULL,
  project_id uuid REFERENCES app.projects(id),
  description text,
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS app.file_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id uuid REFERENCES app.files(id) ON DELETE CASCADE,
  shared_with uuid REFERENCES app.profiles(id) ON DELETE CASCADE,
  permission text CHECK (permission IN ('view', 'download', 'edit')) DEFAULT 'view',
  shared_by uuid REFERENCES app.profiles(id) NOT NULL,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(file_id, shared_with)
);

CREATE TABLE IF NOT EXISTS app.calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  project_id uuid REFERENCES app.projects(id) ON DELETE SET NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  location text,
  event_type text CHECK (event_type IN ('meeting', 'deadline', 'milestone', 'reminder')) DEFAULT 'meeting',
  status text CHECK (status IN ('scheduled', 'completed', 'cancelled')) DEFAULT 'scheduled',
  created_by uuid REFERENCES app.profiles(id) NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS app.event_attendees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES app.calendar_events(id) ON DELETE CASCADE,
  user_id uuid REFERENCES app.profiles(id) ON DELETE CASCADE,
  response text CHECK (response IN ('pending', 'accepted', 'declined', 'tentative')) DEFAULT 'pending',
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(event_id, user_id)
);

CREATE TABLE IF NOT EXISTS app.milestones
(
    id          uuid                     DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    project_id  uuid                                               NOT NULL REFERENCES app.projects(id) ON DELETE CASCADE,
    name        varchar(255)                                       NOT NULL,
    description text,
    due_date    date,
    status      varchar(50),
    created_at  timestamp with time zone DEFAULT now(),
    updated_at  timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app.deliverables
(
    id           uuid                     DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    milestone_id uuid                                               NOT NULL REFERENCES app.milestones(id) ON DELETE CASCADE,
    name         varchar(255)                                       NOT NULL,
    description  text,
    due_date     date,
    status       varchar(50),
    created_at   timestamp with time zone DEFAULT now(),
    updated_at   timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app.documents
(
    id              uuid                     DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    title           text                                               NOT NULL,
    content         text,
    organization_id uuid                                               NOT NULL REFERENCES app.organizations(id) ON DELETE CASCADE,
    created_by      uuid REFERENCES app.profiles(id),
    created_at      timestamp with time zone DEFAULT now()             NOT NULL,
    updated_at      timestamp with time zone DEFAULT now()             NOT NULL
);


-- Tables in 'finance' schema
CREATE TABLE IF NOT EXISTS finance.estimates
(
    id               uuid                     DEFAULT gen_random_uuid()          NOT NULL PRIMARY KEY,
    reference_number varchar(50)                                                 NOT NULL,
    organization_id  uuid                                                        NOT NULL REFERENCES app.organizations(id),
    project_id       uuid REFERENCES app.projects(id),
    amount           numeric(10, 2)                                              NOT NULL,
    issue_date       date                                                        NOT NULL,
    expiry_date      date                                                        NOT NULL,
    status           varchar(50)              DEFAULT 'draft'::character varying NOT NULL,
    notes            text,
    terms            text,
    created_at       timestamp with time zone DEFAULT now(),
    updated_at       timestamp with time zone DEFAULT now(),
    company_name     text,
    company_address  text,
    company_email    text,
    company_phone    text,
    deleted          boolean                  DEFAULT false                      NOT NULL
);

CREATE TABLE IF NOT EXISTS finance.estimate_items
(
    id          uuid                     DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    estimate_id uuid                                               NOT NULL REFERENCES finance.estimates(id) ON DELETE CASCADE,
    description text                                               NOT NULL,
    quantity    numeric(10, 2)           DEFAULT 1                 NOT NULL,
    unit_price  numeric(10, 2)                                     NOT NULL,
    amount      numeric(10, 2)                                     NOT NULL,
    created_at  timestamp with time zone DEFAULT now(),
    updated_at  timestamp with time zone DEFAULT now(),
    billable    boolean                  DEFAULT true              NOT NULL,
    unit_type   text                     DEFAULT 'hours'::text     NOT NULL CHECK (unit_type = ANY (ARRAY ['hours'::text, 'days'::text, 'months'::text, 'fixed'::text])),
    deleted     boolean                  DEFAULT false             NOT NULL
);

CREATE TABLE IF NOT EXISTS finance.quotes
(
    id               uuid                     DEFAULT gen_random_uuid()          NOT NULL PRIMARY KEY,
    reference_number varchar                                                     NOT NULL,
    organization_id  uuid                                                        NOT NULL REFERENCES app.organizations(id),
    project_id       uuid REFERENCES app.projects(id),
    amount           numeric                                                     NOT NULL,
    issue_date       date                                                        NOT NULL,
    expiry_date      date                                                        NOT NULL,
    status           varchar                  DEFAULT 'draft'::character varying NOT NULL,
    notes            text,
    terms            text,
    estimate_id      uuid REFERENCES finance.estimates(id),
    created_at       timestamp with time zone DEFAULT now(),
    updated_at       timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS finance.quote_items
(
    id          uuid                     DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    quote_id    uuid                                               NOT NULL REFERENCES finance.quotes(id) ON DELETE CASCADE,
    description text                                               NOT NULL,
    quantity    numeric                  DEFAULT 1                 NOT NULL,
    unit_price  numeric                                            NOT NULL,
    amount      numeric                                            NOT NULL,
    created_at  timestamp with time zone DEFAULT now(),
    updated_at  timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS finance.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text UNIQUE NOT NULL,
  project_id uuid REFERENCES app.projects(id) ON DELETE SET NULL,
  client_id uuid REFERENCES app.profiles(id) NOT NULL,
  status text CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled', 'partial')) DEFAULT 'draft',
  issue_date date NOT NULL,
  due_date date NOT NULL,
  subtotal numeric(12,2) NOT NULL DEFAULT 0,
  tax_rate numeric(5,2) DEFAULT 0,
  tax_amount numeric(12,2) DEFAULT 0,
  total_amount numeric(12,2) NOT NULL DEFAULT 0,
  notes text,
  terms text,
  created_by uuid REFERENCES app.profiles(id) NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  organization_id uuid NOT NULL REFERENCES app.organizations(id),
  estimate_id uuid REFERENCES finance.estimates(id),
  purchase_order varchar(50),
  tax numeric DEFAULT 0 NOT NULL,
  logo_url text,
  is_recurring boolean DEFAULT false,
  recurring_frequency public.recurring_frequency_type,
  recurring_start_date date,
  recurring_until public.recurring_until_type,
  recurring_end_date date,
  recurring_count integer,
  duplicated_from_id uuid REFERENCES finance.invoices(id),
  recurring_template_id uuid
);

CREATE TABLE IF NOT EXISTS finance.invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid REFERENCES finance.invoices(id) ON DELETE CASCADE,
  description text NOT NULL,
  quantity numeric(10,2) NOT NULL DEFAULT 1,
  unit_price numeric(12,2) NOT NULL,
  total_price numeric(12,2) NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  tax_rate numeric(5,2) DEFAULT 0,
  discount_rate numeric(5,2) DEFAULT 0
);

CREATE TABLE IF NOT EXISTS finance.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid REFERENCES finance.invoices(id) ON DELETE SET NULL,
  payment_method text CHECK (payment_method IN ('credit_card', 'bank_transfer', 'check', 'cash', 'stripe')) DEFAULT 'stripe',
  amount numeric(12,2) NOT NULL,
  transaction_id text,
  stripe_payment_intent_id text,
  status text CHECK (status IN ('pending', 'completed', 'failed', 'refunded')) DEFAULT 'pending',
  processed_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS finance.recurring_invoice_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES app.organizations(id) ON DELETE CASCADE,
    project_id uuid REFERENCES app.projects(id),
    client_id uuid REFERENCES app.profiles(id),
    template_name varchar(255) NOT NULL,
    is_active boolean DEFAULT true,
    invoice_data jsonb NOT NULL,
    frequency public.recurring_frequency_type NOT NULL,
    start_date date NOT NULL,
    until_type public.recurring_until_type NOT NULL DEFAULT 'indefinitely',
    end_date date,
    max_count integer,
    next_generation_date date NOT NULL,
    generation_count integer DEFAULT 0,
    last_generated_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS finance.recurring_invoice_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id uuid NOT NULL REFERENCES finance.recurring_invoice_templates(id) ON DELETE CASCADE,
    invoice_id uuid REFERENCES finance.invoices(id) ON DELETE SET NULL,
    generated_at timestamp with time zone DEFAULT now() NOT NULL,
    generation_date date NOT NULL,
    status varchar(20) DEFAULT 'success' CHECK (status IN ('success', 'failed', 'skipped')),
    error_message text,
    invoice_data jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


-- Tables in 'messaging' schema
CREATE TABLE IF NOT EXISTS messaging.message_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES app.projects(id) ON DELETE CASCADE,
  subject text NOT NULL,
  created_by uuid REFERENCES app.profiles(id) NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS messaging.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid REFERENCES messaging.message_threads(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES app.profiles(id) NOT NULL,
  content text NOT NULL,
  message_type text DEFAULT 'text' CHECK (message_type IN ('text', 'system', 'file')),
  created_at timestamptz DEFAULT now() NOT NULL,
  edited_at timestamptz,
  is_deleted boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS messaging.message_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid REFERENCES messaging.messages(id) ON DELETE CASCADE,
  user_id uuid REFERENCES app.profiles(id) ON DELETE CASCADE,
  read_status boolean DEFAULT false,
  read_at timestamptz,
  UNIQUE(message_id, user_id)
);

CREATE TABLE IF NOT EXISTS messaging.thread_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid REFERENCES messaging.message_threads(id) ON DELETE CASCADE,
  user_id uuid REFERENCES app.profiles(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now() NOT NULL,
  last_read_at timestamptz,
  UNIQUE(thread_id, user_id)
);


-- Tables in 'audit' schema
CREATE TABLE IF NOT EXISTS audit.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  details jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now() NOT NULL
);


-- Enable RLS on all tables
ALTER TABLE app.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.project_team ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.file_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.event_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.documents ENABLE ROW LEVEL SECURITY;

ALTER TABLE finance.estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance.estimate_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance.quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance.recurring_invoice_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance.recurring_invoice_history ENABLE ROW LEVEL SECURITY;

ALTER TABLE messaging.message_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE messaging.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE messaging.message_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE messaging.thread_participants ENABLE ROW LEVEL SECURITY;

ALTER TABLE audit.audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies for app.organizations
CREATE POLICY "Users can view organizations they belong to" ON app.organizations
    AS permissive FOR SELECT USING (EXISTS (SELECT 1 FROM app.profiles WHERE profiles.organization_id = organizations.id AND profiles.id = auth.uid()));
CREATE POLICY "Admin users can manage organizations" ON app.organizations
    AS permissive FOR ALL USING (EXISTS (SELECT 1 FROM app.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Users can create new organizations" ON app.organizations
    AS permissive FOR INSERT WITH CHECK (true);

-- Policies for app.profiles (simplified)
CREATE POLICY "profiles_select_own"
  ON app.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON app.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "profiles_insert_authenticated"
  ON app.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_service_role_all"
  ON app.profiles
  FOR ALL
  TO service_role
  USING (true);

-- Policies for app.user_roles
CREATE POLICY "Users can view their roles" ON app.user_roles
    AS permissive FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admin users can manage roles" ON app.user_roles
    AS permissive FOR ALL USING (EXISTS (SELECT 1 FROM app.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Policies for app.invites
CREATE POLICY "Users can view invites" ON app.invites
    AS permissive FOR SELECT TO authenticated USING (true);
CREATE POLICY "Only admins can create invites" ON app.invites
    AS permissive FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM app.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Anyone can update their own invites" ON app.invites
    AS permissive FOR UPDATE TO authenticated USING (true); -- This might need refining based on business logic

-- Policies for app.organization_members
CREATE POLICY "Users can view their own organization memberships" ON app.organization_members
    AS permissive FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own organization memberships" ON app.organization_members
    AS permissive FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage organization members" ON app.organization_members
    AS permissive FOR ALL USING (EXISTS (SELECT 1 FROM app.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Policies for app.projects
CREATE POLICY "Users can read projects they're assigned to or are clients of"
  ON app.projects FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM app.project_team WHERE project_id = projects.id AND user_id = auth.uid()) OR
    client_id = auth.uid() OR
    EXISTS (SELECT 1 FROM app.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins and team members can create projects"
  ON app.projects FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM app.profiles WHERE id = auth.uid() AND role IN ('admin', 'team_member'))
  );

CREATE POLICY "Project team members and admins can update projects"
  ON app.projects FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM app.project_team WHERE project_id = projects.id AND user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM app.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete projects"
  ON app.projects FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM app.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Policies for app.project_team
CREATE POLICY "Users can read project team assignments"
  ON app.project_team FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM app.project_team pt2 WHERE pt2.project_id = project_team.project_id AND pt2.user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM app.profiles WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "Project team members and admins can manage project team"
  ON app.project_team FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM app.project_team pt2 WHERE pt2.project_id = project_team.project_id AND pt2.user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM app.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Policies for app.tasks
CREATE POLICY "Users can read tasks from their projects"
  ON app.tasks FOR SELECT
  TO authenticated
  USING (
    project_id IN (SELECT project_id FROM app.project_team WHERE user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM app.projects WHERE id = project_id AND client_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM app.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Project team members can manage tasks"
  ON app.tasks FOR ALL
  TO authenticated
  USING (
    project_id IN (SELECT project_id FROM app.project_team WHERE user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM app.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Policies for app.task_assignments
CREATE POLICY "Users can read task assignments"
  ON app.task_assignments FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    task_id IN (SELECT id FROM app.tasks WHERE project_id IN (SELECT project_id FROM app.project_team WHERE user_id = auth.uid())) OR
    EXISTS (SELECT 1 FROM app.profiles WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "Project team members can manage task assignments"
  ON app.task_assignments FOR ALL
  TO authenticated
  USING (
    task_id IN (SELECT id FROM app.tasks WHERE project_id IN (SELECT project_id FROM app.project_team WHERE user_id = auth.uid())) OR
    EXISTS (SELECT 1 FROM app.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Policies for app.files
CREATE POLICY "Users can read files they uploaded or have access to"
  ON app.files FOR SELECT
  TO authenticated
  USING (
    uploaded_by = auth.uid() OR
    is_public = true OR
    id IN (SELECT file_id FROM app.file_shares WHERE shared_with = auth.uid()) OR
    project_id IN (SELECT project_id FROM app.project_team WHERE user_id = auth.uid()) OR
    project_id IN (SELECT id FROM app.projects WHERE client_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM app.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can upload files to their projects"
  ON app.files FOR INSERT
  TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid() AND (
      project_id IS NULL OR
      project_id IN (SELECT project_id FROM app.project_team WHERE user_id = auth.uid()) OR
      project_id IN (SELECT id FROM app.projects WHERE client_id = auth.uid()) OR
      EXISTS (SELECT 1 FROM app.profiles WHERE id = auth.uid() AND role = 'admin')
    )
  );
CREATE POLICY "Project team members and admins can update files"
  ON app.files FOR UPDATE
  TO authenticated
  USING (
    uploaded_by = auth.uid() OR
    project_id IN (SELECT project_id FROM app.project_team WHERE user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM app.profiles WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "Project team members and admins can delete files"
  ON app.files FOR DELETE
  TO authenticated
  USING (
    uploaded_by = auth.uid() OR
    project_id IN (SELECT project_id FROM app.project_team WHERE user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM app.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Policies for app.file_shares
CREATE POLICY "Users can manage file shares for files they own or manage"
  ON app.file_shares FOR ALL
  TO authenticated
  USING (
    shared_by = auth.uid() OR
    file_id IN (SELECT id FROM app.files WHERE uploaded_by = auth.uid()) OR
    EXISTS (SELECT 1 FROM app.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Policies for app.calendar_events
CREATE POLICY "Users can read events they're invited to"
  ON app.calendar_events FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid() OR
    id IN (SELECT event_id FROM app.event_attendees WHERE user_id = auth.uid()) OR
    project_id IN (SELECT project_id FROM app.project_team WHERE user_id = auth.uid()) OR
    project_id IN (SELECT id FROM app.projects WHERE client_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM app.profiles WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "Team members and admins can manage calendar events"
  ON app.calendar_events FOR ALL
  TO authenticated
  USING (
    created_by = auth.uid() OR
    project_id IN (SELECT project_id FROM app.project_team WHERE user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM app.profiles WHERE id = auth.uid() AND role IN ('admin', 'team_member'))
  );

-- Policies for app.event_attendees
CREATE POLICY "Users can read event attendees for events they can access"
  ON app.event_attendees FOR SELECT
  TO authenticated
  USING (
    event_id IN (SELECT id FROM app.calendar_events WHERE created_by = auth.uid() OR id IN (SELECT event_id FROM app.event_attendees WHERE user_id = auth.uid())) OR
    EXISTS (SELECT 1 FROM app.profiles WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "Users can manage their own event attendance"
  ON app.event_attendees FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Event creators and admins can manage event attendees"
  ON app.event_attendees FOR ALL
  TO authenticated
  USING (
    event_id IN (SELECT id FROM app.calendar_events WHERE created_by = auth.uid()) OR
    EXISTS (SELECT 1 FROM app.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Policies for app.milestones
CREATE POLICY "Users can view milestones for their projects" ON app.milestones
    AS permissive FOR SELECT USING (
        project_id IN (SELECT project_id FROM app.project_team WHERE user_id = auth.uid()) OR
        EXISTS (SELECT 1 FROM app.projects WHERE id = project_id AND client_id = auth.uid()) OR
        EXISTS (SELECT 1 FROM app.profiles WHERE id = auth.uid() AND role = 'admin')
    );
CREATE POLICY "Project team members can manage milestones" ON app.milestones
    AS permissive FOR ALL USING (
        project_id IN (SELECT project_id FROM app.project_team WHERE user_id = auth.uid()) OR
        EXISTS (SELECT 1 FROM app.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Policies for app.deliverables
CREATE POLICY "Users can view deliverables for their milestones/projects" ON app.deliverables
    AS permissive FOR SELECT USING (
        milestone_id IN (SELECT id FROM app.milestones WHERE project_id IN (SELECT project_id FROM app.project_team WHERE user_id = auth.uid())) OR
        EXISTS (SELECT 1 FROM app.milestones m JOIN app.projects p ON m.project_id = p.id WHERE m.id = deliverables.milestone_id AND p.client_id = auth.uid()) OR
        EXISTS (SELECT 1 FROM app.profiles WHERE id = auth.uid() AND role = 'admin')
    );
CREATE POLICY "Project team members can manage deliverables" ON app.deliverables
    AS permissive FOR ALL USING (
        milestone_id IN (SELECT id FROM app.milestones WHERE project_id IN (SELECT project_id FROM app.project_team WHERE user_id = auth.uid())) OR
        EXISTS (SELECT 1 FROM app.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Policies for app.documents
CREATE POLICY "Users can view documents from their organization" ON app.documents
    AS permissive FOR SELECT USING (EXISTS (SELECT 1 FROM app.profiles WHERE app.profiles.id = auth.uid() AND app.profiles.organization_id = documents.organization_id));
CREATE POLICY "Admin users can manage all documents" ON app.documents
    AS permissive FOR ALL USING (EXISTS (SELECT 1 FROM app.profiles WHERE id = auth.uid() AND role = 'admin'));


-- Policies for finance.estimates
CREATE POLICY "Users can view estimates for their organization/projects" ON finance.estimates
    AS permissive FOR SELECT USING (
        organization_id IN (SELECT p.organization_id FROM app.profiles p WHERE p.id = auth.uid()) OR
        EXISTS (SELECT 1 FROM app.projects pr WHERE pr.id = estimates.project_id AND (pr.client_id = auth.uid() OR pr.id IN (SELECT pt.project_id FROM app.project_team pt WHERE pt.user_id = auth.uid()))) OR
        EXISTS (SELECT 1 FROM app.profiles WHERE id = auth.uid() AND role = 'admin')
    );
CREATE POLICY "Users can create estimates for their organization/projects" ON finance.estimates
    AS permissive FOR INSERT WITH CHECK (
        organization_id IN (SELECT p.organization_id FROM app.profiles p WHERE p.id = auth.uid()) AND
        (EXISTS (SELECT 1 FROM app.projects pr WHERE pr.id = estimates.project_id AND (pr.client_id = auth.uid() OR pr.id IN (SELECT pt.project_id FROM app.project_team pt WHERE pt.user_id = auth.uid()))) OR
        EXISTS (SELECT 1 FROM app.profiles WHERE id = auth.uid() AND role = 'admin'))
    );
CREATE POLICY "Users can update estimates for their organization/projects" ON finance.estimates
    AS permissive FOR UPDATE USING (
        organization_id IN (SELECT p.organization_id FROM app.profiles p WHERE p.id = auth.uid()) AND
        (EXISTS (SELECT 1 FROM app.projects pr WHERE pr.id = estimates.project_id AND (pr.client_id = auth.uid() OR pr.id IN (SELECT pt.project_id FROM app.project_team pt WHERE pt.user_id = auth.uid()))) OR
        EXISTS (SELECT 1 FROM app.profiles WHERE id = auth.uid() AND role = 'admin'))
    );
CREATE POLICY "Users can delete estimates for their organization/projects" ON finance.estimates
    AS permissive FOR DELETE USING (
        organization_id IN (SELECT p.organization_id FROM app.profiles p WHERE p.id = auth.uid()) AND
        (EXISTS (SELECT 1 FROM app.projects pr WHERE pr.id = estimates.project_id AND (pr.client_id = auth.uid() OR pr.id IN (SELECT pt.project_id FROM app.project_team pt WHERE pt.user_id = auth.uid()))) OR
        EXISTS (SELECT 1 FROM app.profiles WHERE id = auth.uid() AND role = 'admin'))
    );

-- Policies for finance.estimate_items
CREATE POLICY "Users can view estimate items related to their estimates" ON finance.estimate_items
    AS permissive FOR SELECT USING (EXISTS (SELECT 1 FROM finance.estimates e WHERE e.id = estimate_items.estimate_id AND (e.organization_id IN (SELECT p.organization_id FROM app.profiles p WHERE p.id = auth.uid()) OR EXISTS (SELECT 1 FROM app.projects pr WHERE pr.id = e.project_id AND (pr.client_id = auth.uid() OR pr.id IN (SELECT pt.project_id FROM app.project_team pt WHERE pt.user_id = auth.uid()))))));
CREATE POLICY "Users can manage estimate items related to their estimates" ON finance.estimate_items
    AS permissive FOR ALL USING (EXISTS (SELECT 1 FROM finance.estimates e WHERE e.id = estimate_items.estimate_id AND (e.organization_id IN (SELECT p.organization_id FROM app.profiles p WHERE p.id = auth.uid()) OR EXISTS (SELECT 1 FROM app.projects pr WHERE pr.id = e.project_id AND (pr.client_id = auth.uid() OR pr.id IN (SELECT pt.project_id FROM app.project_team pt WHERE pt.user_id = auth.uid()))))));

-- Policies for finance.quotes
CREATE POLICY "Users can view quotes for their organization/projects" ON finance.quotes
    AS permissive FOR SELECT USING (
        organization_id IN (SELECT p.organization_id FROM app.profiles p WHERE p.id = auth.uid()) OR
        EXISTS (SELECT 1 FROM app.projects pr WHERE pr.id = quotes.project_id AND (pr.client_id = auth.uid() OR pr.id IN (SELECT pt.project_id FROM app.project_team pt WHERE pt.user_id = auth.uid()))) OR
        EXISTS (SELECT 1 FROM app.profiles WHERE id = auth.uid() AND role = 'admin')
    );
CREATE POLICY "Users can manage quotes for their organization/projects" ON finance.quotes
    AS permissive FOR ALL USING (
        organization_id IN (SELECT p.organization_id FROM app.profiles p WHERE p.id = auth.uid()) AND
        (EXISTS (SELECT 1 FROM app.projects pr WHERE pr.id = quotes.project_id AND (pr.client_id = auth.uid() OR pr.id IN (SELECT pt.project_id FROM app.project_team pt WHERE pt.user_id = auth.uid()))) OR
        EXISTS (SELECT 1 FROM app.profiles WHERE id = auth.uid() AND role = 'admin'))
    );

-- Policies for finance.quote_items
CREATE POLICY "Users can view quote items related to their quotes" ON finance.quote_items
    AS permissive FOR SELECT USING (EXISTS (SELECT 1 FROM finance.quotes q WHERE q.id = quote_items.quote_id AND (q.organization_id IN (SELECT p.organization_id FROM app.profiles p WHERE p.id = auth.uid()) OR EXISTS (SELECT 1 FROM app.projects pr WHERE pr.id = q.project_id AND (pr.client_id = auth.uid() OR pr.id IN (SELECT pt.project_id FROM app.project_team pt WHERE pt.user_id = auth.uid()))))));
CREATE POLICY "Users can manage quote items related to their quotes" ON finance.quote_items
    AS permissive FOR ALL USING (EXISTS (SELECT 1 FROM finance.quotes q WHERE q.id = quote_items.quote_id AND (q.organization_id IN (SELECT p.organization_id FROM app.profiles p WHERE p.id = auth.uid()) OR EXISTS (SELECT 1 FROM app.projects pr WHERE pr.id = q.project_id AND (pr.client_id = auth.uid() OR pr.id IN (SELECT pt.project_id FROM app.project_team pt WHERE pt.user_id = auth.uid()))))));

-- Policies for finance.invoices
CREATE POLICY "Users can read invoices for their projects"
  ON finance.invoices FOR SELECT
  TO authenticated
  USING (
    client_id = auth.uid() OR
    project_id IN (SELECT project_id FROM app.project_team WHERE user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM app.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Team members can manage invoices"
  ON finance.invoices FOR ALL
  TO authenticated
  USING (
    project_id IN (SELECT project_id FROM app.project_team WHERE user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM app.profiles WHERE id = auth.uid() AND role IN ('admin', 'team_member'))
  );

-- Policies for finance.invoice_items
CREATE POLICY "Users can view invoice items related to their invoices" ON finance.invoice_items
    AS permissive FOR SELECT USING (EXISTS (SELECT 1 FROM finance.invoices i WHERE i.id = invoice_items.invoice_id AND (i.client_id = auth.uid() OR i.project_id IN (SELECT pt.project_id FROM app.project_team pt WHERE pt.user_id = auth.uid()) OR EXISTS (SELECT 1 FROM app.profiles WHERE id = auth.uid() AND role = 'admin'))));
CREATE POLICY "Team members can manage invoice items" ON finance.invoice_items
    AS permissive FOR ALL USING (EXISTS (SELECT 1 FROM finance.invoices i WHERE i.id = invoice_items.invoice_id AND (i.project_id IN (SELECT pt.project_id FROM app.project_team pt WHERE pt.user_id = auth.uid()) OR EXISTS (SELECT 1 FROM app.profiles WHERE id = auth.uid() AND role IN ('admin', 'team_member')))));

-- Policies for finance.payments
CREATE POLICY "Users can view payments for their invoices" ON finance.payments
    AS permissive FOR SELECT USING (EXISTS (SELECT 1 FROM finance.invoices i WHERE i.id = payments.invoice_id AND (i.client_id = auth.uid() OR i.project_id IN (SELECT pt.project_id FROM app.project_team pt WHERE pt.user_id = auth.uid()) OR EXISTS (SELECT 1 FROM app.profiles WHERE id = auth.uid() AND role = 'admin'))));
CREATE POLICY "Team members can manage payments" ON finance.payments
    AS permissive FOR ALL USING (EXISTS (SELECT 1 FROM finance.invoices i WHERE i.id = payments.invoice_id AND (i.project_id IN (SELECT pt.project_id FROM app.project_team pt WHERE pt.user_id = auth.uid()) OR EXISTS (SELECT 1 FROM app.profiles WHERE id = auth.uid() AND role IN ('admin', 'team_member')))));

-- Policies for finance.recurring_invoice_templates
CREATE POLICY "Users can view recurring templates for their organization"
ON finance.recurring_invoice_templates FOR SELECT
USING (
    organization_id IN (
        SELECT app.profiles.organization_id
        FROM app.profiles
        WHERE app.profiles.id = auth.uid()
    )
);

CREATE POLICY "Users can create recurring templates for their organization"
ON finance.recurring_invoice_templates FOR INSERT
WITH CHECK (
    organization_id IN (
        SELECT app.profiles.organization_id
        FROM app.profiles
        WHERE app.profiles.id = auth.uid()
    )
);

CREATE POLICY "Users can update recurring templates for their organization"
ON finance.recurring_invoice_templates FOR UPDATE
USING (
    organization_id IN (
        SELECT app.profiles.organization_id
        FROM app.profiles
        WHERE app.profiles.id = auth.uid()
    )
);

CREATE POLICY "Users can delete recurring templates for their organization"
ON finance.recurring_invoice_templates FOR DELETE
USING (
    organization_id IN (
        SELECT app.profiles.organization_id
        FROM app.profiles
        WHERE app.profiles.id = auth.uid()
    )
);

-- Policies for finance.recurring_invoice_history
CREATE POLICY "Users can view recurring history for their organization templates"
ON finance.recurring_invoice_history FOR SELECT
USING (
    template_id IN (
        SELECT rt.id
        FROM finance.recurring_invoice_templates rt
        JOIN app.profiles p ON p.organization_id = rt.organization_id
        WHERE p.id = auth.uid()
    )
);

CREATE POLICY "System can manage recurring invoice history"
ON finance.recurring_invoice_history FOR ALL
TO service_role
USING (true);


-- Policies for messaging.message_threads
CREATE POLICY "Users can read threads for their projects"
  ON messaging.message_threads FOR SELECT
  TO authenticated
  USING (
    project_id IN (SELECT project_id FROM app.project_team WHERE user_id = auth.uid()) OR
    project_id IN (SELECT id FROM app.projects WHERE client_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM app.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Project members can create threads"
  ON messaging.message_threads FOR INSERT
  TO authenticated
  WITH CHECK (
    project_id IN (SELECT project_id FROM app.project_team WHERE user_id = auth.uid()) OR
    project_id IN (SELECT id FROM app.projects WHERE client_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM app.profiles WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "Project members can update threads"
  ON messaging.message_threads FOR UPDATE
  TO authenticated
  USING (
    project_id IN (SELECT project_id FROM app.project_team WHERE user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM app.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Policies for messaging.messages
CREATE POLICY "Users can read messages in their threads"
  ON messaging.messages FOR SELECT
  TO authenticated
  USING (
    thread_id IN (
      SELECT id FROM messaging.message_threads WHERE
        project_id IN (SELECT project_id FROM app.project_team WHERE user_id = auth.uid()) OR
        project_id IN (SELECT id FROM app.projects WHERE client_id = auth.uid())
    ) OR
    EXISTS (SELECT 1 FROM app.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can send messages in their threads"
  ON messaging.messages FOR INSERT
  TO authenticated
  WITH CHECK (
    thread_id IN (
      SELECT id FROM messaging.message_threads WHERE
        project_id IN (SELECT project_id FROM app.project_team WHERE user_id = auth.uid()) OR
        project_id IN (SELECT id FROM app.projects WHERE client_id = auth.uid())
    ) OR
    EXISTS (SELECT 1 FROM app.profiles WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "Users can update their own messages"
  ON messaging.messages FOR UPDATE
  TO authenticated
  USING (sender_id = auth.uid());
CREATE POLICY "Users can delete their own messages"
  ON messaging.messages FOR DELETE
  TO authenticated
  USING (sender_id = auth.uid());

-- Policies for messaging.message_recipients
CREATE POLICY "Users can manage their message read status"
  ON messaging.message_recipients FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- Policies for messaging.thread_participants
CREATE POLICY "Users can read thread participants"
  ON messaging.thread_participants FOR SELECT
  TO authenticated
  USING (
    thread_id IN (
      SELECT id FROM messaging.message_threads WHERE
        project_id IN (SELECT project_id FROM app.project_team WHERE user_id = auth.uid()) OR
        project_id IN (SELECT id FROM app.projects WHERE client_id = auth.uid())
    ) OR
    EXISTS (SELECT 1 FROM app.profiles WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "Project members can manage thread participants"
  ON messaging.thread_participants FOR ALL
  TO authenticated
  USING (
    thread_id IN (SELECT id FROM messaging.message_threads WHERE project_id IN (SELECT project_id FROM app.project_team WHERE user_id = auth.uid())) OR
    EXISTS (SELECT 1 FROM app.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Policies for audit.audit_logs
CREATE POLICY "Users can read their own audit logs"
  ON audit.audit_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all audit logs"
  ON audit.audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM app.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Functions (most functions moved to public schema for accessibility across schemas)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  BEGIN
    INSERT INTO app.profiles (id, email, full_name, role)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
      COALESCE(NEW.raw_user_meta_data->>'role', 'client')
    );
    -- Insert into app.user_roles if needed for explicit role tracking, though profiles.role might be primary now
    -- INSERT INTO app.user_roles (user_id, role) VALUES (NEW.id, 'client') ON CONFLICT (user_id, role) DO NOTHING;
    RETURN NEW;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Failed to create profile for user %: %', NEW.email, SQLERRM;
    RETURN NEW;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.calculate_invoice_totals()
RETURNS trigger AS $$
DECLARE
  subtotal_amount numeric(12,2);
  tax_amount numeric(12,2);
  total_amount numeric(12,2);
BEGIN
  -- Calculate subtotal from invoice items
  SELECT COALESCE(SUM(total_price), 0)
  INTO subtotal_amount
  FROM finance.invoice_items
  WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id);

  -- Update invoice with calculated amounts
  UPDATE finance.invoices
  SET
    subtotal = subtotal_amount,
    tax_amount = subtotal_amount * (tax_rate / 100),
    total_amount = subtotal_amount + (subtotal_amount * (tax_rate / 100)),
    updated_at = now()
  WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.add_thread_participants()
RETURNS trigger AS $$
BEGIN
  -- Add all project team members as participants
  INSERT INTO messaging.thread_participants (thread_id, user_id)
  SELECT NEW.id, user_id
  FROM app.project_team
  WHERE project_id = NEW.project_id
  ON CONFLICT (thread_id, user_id) DO NOTHING;

  -- Add project client as participant
  INSERT INTO messaging.thread_participants (thread_id, user_id)
  SELECT NEW.id, client_id
  FROM app.projects
  WHERE id = NEW.project_id AND client_id IS NOT NULL
  ON CONFLICT (thread_id, user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.create_message_recipients()
RETURNS trigger AS $$
BEGIN
  -- Add all thread participants except sender as recipients
  INSERT INTO messaging.message_recipients (message_id, user_id)
  SELECT NEW.id, user_id
  FROM messaging.thread_participants
  WHERE thread_id = NEW.thread_id AND user_id != NEW.sender_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_action text,
  p_entity_type text,
  p_entity_id text,
  p_details jsonb DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO audit.audit_logs (user_id, action, entity_type, entity_id, details)
  VALUES (auth.uid(), p_action, p_entity_type, p_entity_id, p_details);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.calculate_next_generation_date(
    current_date date,
    frequency public.recurring_frequency_type
) RETURNS date
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT CASE frequency
        WHEN 'daily' THEN current_date + interval '1 day'
        WHEN 'weekly' THEN current_date + interval '1 week'
        WHEN 'monthly' THEN current_date + interval '1 month'
        WHEN 'quarterly' THEN current_date + interval '3 months'
        WHEN 'yearly' THEN current_date + interval '1 year'
    END::date;
$$;

CREATE OR REPLACE FUNCTION public.duplicate_invoice_with_items(
    original_invoice_id uuid,
    new_invoice_data jsonb,
    invoice_items jsonb
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_invoice_id uuid;
    item jsonb;
BEGIN
    -- Insert new invoice
    INSERT INTO finance.invoices (
        organization_id,
        project_id,
        client_id,
        amount,
        subtotal,
        tax,
        discount,
        status,
        invoice_number,
        issue_date,
        due_date,
        notes,
        terms,
        purchase_order,
        estimate_id,
        is_recurring,
        recurring_frequency,
        recurring_start_date,
        recurring_until,
        recurring_end_date,
        recurring_count,
        duplicated_from_id,
        recurring_template_id,
        created_at,
        updated_at
    )
    SELECT
        (new_invoice_data->>'organization_id')::uuid,
        (new_invoice_data->>'project_id')::uuid,
        (new_invoice_data->>'client_id')::uuid,
        (new_invoice_data->>'amount')::numeric,
        (new_invoice_data->>'subtotal')::numeric,
        COALESCE((new_invoice_data->>'tax')::numeric, 0),
        COALESCE((new_invoice_data->>'discount')::numeric, 0),
        new_invoice_data->>'status',
        new_invoice_data->>'invoice_number',
        (new_invoice_data->>'issue_date')::date,
        (new_invoice_data->>'due_date')::date,
        new_invoice_data->>'notes',
        new_invoice_data->>'terms',
        new_invoice_data->>'purchase_order',
        (new_invoice_data->>'estimate_id')::uuid,
        COALESCE((new_invoice_data->>'is_recurring')::boolean, false),
        (new_invoice_data->>'recurring_frequency')::public.recurring_frequency_type,
        (new_invoice_data->>'recurring_start_date')::date,
        (new_invoice_data->>'recurring_until')::public.recurring_until_type,
        (new_invoice_data->>'recurring_end_date')::date,
        (new_invoice_data->>'recurring_count')::integer,
        (new_invoice_data->>'duplicated_from_id')::uuid,
        (new_invoice_data->>'recurring_template_id')::uuid,
        COALESCE((new_invoice_data->>'created_at')::timestamptz, now()),
        COALESCE((new_invoice_data->>'updated_at')::timestamptz, now())
    RETURNING id INTO new_invoice_id;

    -- Insert invoice items
    FOR item IN SELECT * FROM jsonb_array_elements(invoice_items)
    LOOP
        INSERT INTO finance.invoice_items (
            invoice_id,
            description,
            quantity,
            unit_price,
            amount,
            tax_rate,
            discount_rate
        ) VALUES (
            new_invoice_id,
            item->>'description',
            (item->>'quantity')::numeric,
            (item->>'unit_price')::numeric,
            (item->>'amount')::numeric,
            COALESCE((item->>'tax_rate')::numeric, 0),
            COALESCE((item->>'discount_rate')::numeric, 0)
        );
    END LOOP;

    RETURN new_invoice_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_dashboard_stats(user_id uuid)
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'active_projects', (
      SELECT COUNT(*) FROM app.projects
      WHERE (client_id = user_id OR id IN (
        SELECT project_id FROM app.project_team WHERE user_id = get_user_dashboard_stats.user_id
      )) AND status = 'active'
    ),
    'completed_projects', (
      SELECT COUNT(*) FROM app.projects
      WHERE (client_id = user_id OR id IN (
        SELECT project_id FROM app.project_team WHERE user_id = get_user_dashboard_stats.user_id
      )) AND status = 'completed'
    ),
    'pending_tasks', (
      SELECT COUNT(*) FROM app.tasks t
      JOIN app.projects p ON t.project_id = p.id
      WHERE (p.client_id = user_id OR p.id IN (
        SELECT project_id FROM app.project_team WHERE user_id = get_user_dashboard_stats.user_id
      )) AND t.status IN ('todo', 'in_progress')
    ),
    'total_invoices', (
      SELECT COUNT(*) FROM finance.invoices
      WHERE client_id = user_id
    ),
    'unread_messages', (
      SELECT COUNT(*) FROM messaging.message_recipients mr
      JOIN messaging.messages m ON mr.message_id = m.id
      WHERE mr.user_id = get_user_dashboard_stats.user_id
      AND mr.read_status = false
      AND m.sender_id != get_user_dashboard_stats.user_id
    ),
    'upcoming_events', (
      SELECT COUNT(*) FROM app.calendar_events
      WHERE start_time > NOW()
      AND (created_by = user_id OR id IN (
        SELECT event_id FROM app.event_attendees WHERE user_id = get_user_dashboard_stats.user_id
      ))
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.mark_message_as_read(message_id uuid, user_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE messaging.message_recipients
  SET read_status = true, read_at = NOW()
  WHERE messaging.message_recipients.message_id = mark_message_as_read.message_id
  AND messaging.message_recipients.user_id = mark_message_as_read.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_project_progress(project_id uuid)
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
  FROM app.tasks
  WHERE tasks.project_id = get_project_progress.project_id;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role) returns boolean
    stable
    security definer
    SET search_path = ""
    language sql
as
$$
  SELECT EXISTS (
    SELECT 1
    FROM app.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.belongs_to_organization(_user_id uuid, _org_id uuid) returns boolean
    stable
    security definer
    SET search_path = ""
    language sql
as
$$
  SELECT EXISTS (
    SELECT 1
    FROM app.profiles
    WHERE id = _user_id
      AND organization_id = _org_id
  );
$$;

CREATE OR REPLACE FUNCTION public.handle_new_organization() returns trigger
    security definer
    language plpgsql
as
$$
BEGIN
  -- Create membership entry for the user who created the organization
  INSERT INTO app.organization_members (user_id, organization_id, role, is_primary)
  VALUES (auth.uid(), NEW.id, 'admin', true);

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.maintain_profile_organization_consistency() returns trigger
    language plpgsql
as
$$
BEGIN
    -- If a user's primary organization is set/changed, update their profile
    IF NEW.is_primary = true THEN
        -- Update the profile organization_id to match the primary organization
        UPDATE app.profiles
        SET organization_id = NEW.organization_id
        WHERE id = NEW.user_id;

        -- Ensure only one organization is primary for this user
        UPDATE app.organization_members
        SET is_primary = false
        WHERE user_id = NEW.user_id
          AND id != NEW.id
          AND is_primary = true;
    END IF;

    RETURN NEW;
END;
$$;


-- Triggers

-- Drop all existing triggers that will be redefined
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS calculate_invoice_totals_trigger ON finance.invoice_items;
DROP TRIGGER IF EXISTS update_invoices_updated_at ON finance.invoices;
DROP TRIGGER IF EXISTS update_calendar_events_updated_at ON app.calendar_events;
DROP TRIGGER IF EXISTS add_thread_participants_trigger ON messaging.message_threads;
DROP TRIGGER IF EXISTS create_message_recipients_trigger ON messaging.messages;
DROP TRIGGER IF EXISTS update_message_threads_updated_at ON messaging.message_threads;
DROP TRIGGER IF EXISTS update_projects_updated_at ON app.projects;
DROP TRIGGER IF EXISTS update_tasks_updated_at ON app.tasks;
DROP TRIGGER IF EXISTS recurring_invoice_templates_updated_at ON finance.recurring_invoice_templates;
DROP TRIGGER IF EXISTS after_organization_created ON app.organizations;
DROP TRIGGER IF EXISTS organization_members_update_profile ON app.organization_members;


CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER calculate_invoice_totals_trigger
  AFTER INSERT OR UPDATE OR DELETE ON finance.invoice_items
  FOR EACH ROW EXECUTE FUNCTION public.calculate_invoice_totals();

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON finance.invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_calendar_events_updated_at
  BEFORE UPDATE ON app.calendar_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER add_thread_participants_trigger
  AFTER INSERT ON messaging.message_threads
  FOR EACH ROW EXECUTE FUNCTION public.add_thread_participants();

CREATE TRIGGER create_message_recipients_trigger
  AFTER INSERT ON messaging.messages
  FOR EACH ROW EXECUTE FUNCTION public.create_message_recipients();

CREATE TRIGGER update_message_threads_updated_at
  BEFORE UPDATE ON messaging.message_threads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON app.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON app.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER recurring_invoice_templates_updated_at
    BEFORE UPDATE ON finance.recurring_invoice_templates
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER after_organization_created
    AFTER INSERT
    ON app.organizations
    FOR EACH ROW
EXECUTE PROCEDURE public.handle_new_organization();

CREATE TRIGGER organization_members_update_profile
    AFTER INSERT OR UPDATE
        OF is_primary, organization_id
    ON app.organization_members
    FOR EACH ROW
EXECUTE PROCEDURE public.maintain_profile_organization_consistency();


-- Indexes for better query performance on frequently accessed columns
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON app.projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON app.projects(status);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON app.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON app.tasks(status);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON finance.invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON finance.invoices(status);
CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON messaging.messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_time ON app.calendar_events(start_time);
CREATE INDEX IF NOT EXISTS idx_files_project_id ON app.files(project_id);

-- Add composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_projects_client_status ON app.projects(client_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_project_status ON app.tasks(project_id, status);
CREATE INDEX IF NOT EXISTS idx_invoices_client_status ON finance.invoices(client_id, status);

-- Add indexes for date-based queries
CREATE INDEX IF NOT EXISTS idx_projects_dates ON app.projects(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON app.tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_dates ON finance.invoices(issue_date, due_date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_date_range ON app.calendar_events(start_time, end_time);

-- Ensure proper text search capabilities
CREATE INDEX IF NOT EXISTS idx_projects_name_search ON app.projects USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_tasks_title_search ON app.tasks USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_messages_content_search ON messaging.messages USING gin(to_tsvector('english', content));

-- Finance Specific Indexes
CREATE INDEX IF NOT EXISTS quotes_reference_number_idx ON finance.quotes (reference_number);
CREATE INDEX IF NOT EXISTS quotes_organization_id_idx ON finance.quotes (organization_id);
CREATE INDEX IF NOT EXISTS quotes_project_id_idx ON finance.quotes (project_id);
CREATE INDEX IF NOT EXISTS quotes_estimate_id_idx ON finance.quotes (estimate_id);
CREATE INDEX IF NOT EXISTS quote_items_quote_id_idx ON finance.quote_items (quote_id);
CREATE INDEX IF NOT EXISTS idx_invoices_recurring_template_id ON finance.invoices(recurring_template_id);
CREATE INDEX IF NOT EXISTS idx_invoices_is_recurring ON finance.invoices(is_recurring);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id_old ON finance.invoices(client_id); -- This might be a duplicate, depending on previous invoice client_id index
CREATE INDEX IF NOT EXISTS idx_invoices_estimate_id ON finance.invoices(estimate_id);
CREATE INDEX IF NOT EXISTS idx_invoices_duplicated_from_id ON finance.invoices(duplicated_from_id);
CREATE INDEX IF NOT EXISTS idx_invoices_organization_created_at ON finance.invoices(organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_recurring_templates_organization_id ON finance.recurring_invoice_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_recurring_templates_active ON finance.recurring_invoice_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_recurring_templates_next_generation ON finance.recurring_invoice_templates(next_generation_date) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_recurring_history_template_id ON finance.recurring_invoice_history(template_id);
CREATE INDEX IF NOT EXISTS idx_recurring_history_generation_date ON finance.recurring_invoice_history(generation_date);

-- Grants (adjusted for new schemas)
-- Grant access to new schemas for anon, authenticated, service_role
GRANT USAGE ON SCHEMA app TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA finance TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA messaging TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA audit TO anon, authenticated, service_role;

-- Grant all privileges on tables in respective schemas
GRANT ALL ON ALL TABLES IN SCHEMA app TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA finance TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA messaging TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA audit TO anon, authenticated, service_role;

-- Grant all privileges on sequences in respective schemas (for UUID defaults)
GRANT ALL ON ALL SEQUENCES IN SCHEMA app TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA finance TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA messaging TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA audit TO anon, authenticated, service_role;

-- Grant execute on functions in the public schema
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;
