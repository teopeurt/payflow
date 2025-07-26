This document outlines the database schema for a professional client portal application, leveraging a multi-schema approach in PostgreSQL for better organization, security, and maintainability.

### Database Schema Overview

The database is logically divided into several schemas, each housing related tables and functions:

* **`auth` Schema**: This schema is typically managed by Supabase itself and contains core user authentication tables (e.g., `auth.users`).
* **`public` Schema**: Contains global enums and widely used helper functions that interact across multiple schemas.
* **`app` Schema**: Houses the core application data related to organizations, user profiles, project management, file management, and calendaring.
* **`finance` Schema**: Dedicated to all financial aspects, including estimates, quotes, invoices, payments, and recurring invoice functionalities.
* **`messaging` Schema**: Manages all components of the internal messaging system.
* **`audit` Schema**: Stores system-wide audit logs for security and compliance purposes.

---

### Schema Details and Table Structures

#### `public` Schema

This schema primarily defines global data types and utility functions.

* **Enums**:
    * `app_role`: Defines user roles within the application (`admin`, `client`, `team_member`).
    * `recurring_frequency_type`: Specifies the frequency for recurring invoices (`daily`, `weekly`, `monthly`, `quarterly`, `yearly`).
    * `recurring_until_type`: Defines conditions for when a recurring invoice stops (`indefinitely`, `on_date`, `count`).
* **Functions**:
    * `update_updated_at_column()`: A generic trigger function to automatically update `updated_at` timestamps on tables.
    * `handle_new_user()`: Triggered after a new user signs up via `auth.users` to automatically create an `app.profiles` entry and assign a default role.
    * `calculate_invoice_totals()`: Calculates the subtotal, tax amount, and total amount for an invoice based on its line items.
    * `add_thread_participants()`: Automatically adds project team members and the client as participants when a new message thread is created.
    * `create_message_recipients()`: Creates message recipient entries for all thread participants (excluding the sender) when a new message is sent.
    * `log_audit_event(p_action, p_entity_type, p_entity_id, p_details)`: Inserts a new entry into the `audit.audit_logs` table.
    * `calculate_next_generation_date(current_date, frequency)`: Determines the next generation date for a recurring invoice based on its frequency.
    * `duplicate_invoice_with_items(original_invoice_id, new_invoice_data, invoice_items)`: Duplicates an entire invoice, including its line items, for recurring invoice generation or other purposes.
    * `get_user_dashboard_stats(user_id)`: Retrieves various statistics for a user's dashboard, such as active projects, pending tasks, and unread messages.
    * `mark_message_as_read(message_id, user_id)`: Updates the `read_status` for a specific message recipient.
    * `get_project_progress(project_id)`: Calculates the progress of a given project based on its tasks' statuses.
    * `has_role(_user_id, _role)`: Checks if a given user has a specific application role.
    * `belongs_to_organization(_user_id, _org_id)`: Checks if a user belongs to a specific organization.
    * `handle_new_organization()`: Triggered after a new organization is created to automatically assign the creating user as an 'admin' member of that organization.
    * `maintain_profile_organization_consistency()`: Ensures that a user's `profiles.organization_id` is consistent with their primary `organization_members` entry.

#### `app` Schema

This schema manages core application data and relationships.

* **`app.organizations`**: Stores information about client organizations.
    * `id` (PK), `name`, `created_at`, `updated_at`, `default_currency`, `company_name`, `company_email`, `company_logo_url`, `company_address`, `company_phone`, `company_website`, `default_payment_terms`.
* **`app.profiles`**: Extends Supabase `auth.users` with detailed user profile information, including roles and client-specific fields.
    * `id` (PK, FK to `auth.users`), `email`, `full_name`, `profile_picture_url`, `role` (admin, team\_member, client), `company_name`, `address` (jsonb), `website_url`, `notes`, `client_status`, `source`, `created_at`, `updated_at`, `last_login`, `organization_id` (FK to `app.organizations`).
* **`app.user_roles`**: Maps users to specific application roles.
    * `id` (PK), `user_id` (FK to `auth.users`), `role` (`app_role`), `created_at`.
* **`app.invites`**: Manages invitations for new users to join organizations.
    * `id` (PK), `email`, `token` (UNIQUE), `organization_id` (FK to `app.organizations`), `role`, `created_at`, `expires_at`, `used`.
* **`app.organization_members`**: Defines the membership of users within organizations, including their specific role and if it's their primary organization.
    * `id` (PK), `user_id` (FK to `auth.users`), `organization_id` (FK to `app.organizations`), `role`, `is_primary`, `created_at`.
* **`app.projects`**: Stores core project information.
    * `id` (PK), `name`, `description`, `status`, `priority`, `client_id` (FK to `app.profiles`), `start_date`, `end_date`, `budget`, `created_by` (FK to `app.profiles`), `created_at`, `updated_at`, `organization_id` (FK to `app.organizations`).
* **`app.project_team`**: Assigns team members to specific projects.
    * `id` (PK), `project_id` (FK to `app.projects`), `user_id` (FK to `app.profiles`), `role`, `permissions` (jsonb), `joined_at`.
* **`app.tasks`**: Manages tasks within projects, supporting hierarchical relationships.
    * `id` (PK), `project_id` (FK to `app.projects`), `parent_task_id` (FK to `app.tasks`), `title`, `description`, `status`, `priority`, `due_date`, `estimated_hours`, `actual_hours`, `created_by` (FK to `app.profiles`), `created_at`, `updated_at`.
* **`app.task_assignments`**: Assigns tasks to specific team members.
    * `id` (PK), `task_id` (FK to `app.tasks`), `user_id` (FK to `app.profiles`), `assigned_by` (FK to `app.profiles`), `assigned_at`.
* **`app.files`**: Stores metadata for uploaded files.
    * `id` (PK), `filename`, `original_filename`, `file_path`, `file_size`, `mime_type`, `uploaded_by` (FK to `app.profiles`), `project_id` (FK to `app.projects`), `description`, `is_public`, `created_at`.
* **`app.file_shares`**: Manages granular permissions for file sharing.
    * `id` (PK), `file_id` (FK to `app.files`), `shared_with` (FK to `app.profiles`), `permission`, `shared_by` (FK to `app.profiles`), `expires_at`, `created_at`.
* **`app.calendar_events`**: Stores calendar events.
    * `id` (PK), `title`, `description`, `project_id` (FK to `app.projects`), `start_time`, `end_time`, `location`, `event_type`, `status`, `created_by` (FK to `app.profiles`), `created_at`, `updated_at`.
* **`app.event_attendees`**: Tracks attendees for calendar events.
    * `id` (PK), `event_id` (FK to `app.calendar_events`), `user_id` (FK to `app.profiles`), `response`, `created_at`.
* **`app.milestones`**: Defines key milestones within projects.
    * `id` (PK), `project_id` (FK to `app.projects`), `name`, `description`, `due_date`, `status`, `created_at`, `updated_at`.
* **`app.deliverables`**: Items associated with milestones.
    * `id` (PK), `milestone_id` (FK to `app.milestones`), `name`, `description`, `due_date`, `status`, `created_at`, `updated_at`.
* **`app.documents`**: Stores general documents linked to organizations.
    * `id` (PK), `title`, `content`, `organization_id` (FK to `app.organizations`), `created_by` (FK to `app.profiles`), `created_at`, `updated_at`.

#### `finance` Schema

This schema handles all financial transactions and related data.

* **`finance.estimates`**: Manages project cost estimates.
    * `id` (PK), `reference_number`, `organization_id` (FK to `app.organizations`), `project_id` (FK to `app.projects`), `amount`, `issue_date`, `expiry_date`, `status`, `notes`, `terms`, `created_at`, `updated_at`, `company_name`, `company_address`, `company_email`, `company_phone`, `deleted`.
* **`finance.estimate_items`**: Line items for estimates.
    * `id` (PK), `estimate_id` (FK to `finance.estimates`), `description`, `quantity`, `unit_price`, `amount`, `created_at`, `updated_at`, `billable`, `unit_type`, `deleted`.
* **`finance.quotes`**: Manages quotes provided to clients.
    * `id` (PK), `reference_number`, `organization_id` (FK to `app.organizations`), `project_id` (FK to `app.projects`), `amount`, `issue_date`, `expiry_date`, `status`, `notes`, `terms`, `estimate_id` (FK to `finance.estimates`), `created_at`, `updated_at`.
* **`finance.quote_items`**: Line items for quotes.
    * `id` (PK), `quote_id` (FK to `finance.quotes`), `description`, `quantity`, `unit_price`, `amount`, `created_at`, `updated_at`.
* **`finance.invoices`**: Manages invoice generation and tracking.
    * `id` (PK), `invoice_number` (UNIQUE), `project_id` (FK to `app.projects`), `client_id` (FK to `app.profiles`), `status`, `issue_date`, `due_date`, `subtotal`, `tax_rate`, `tax_amount`, `total_amount`, `notes`, `terms`, `created_by` (FK to `app.profiles`), `created_at`, `updated_at`, `organization_id` (FK to `app.organizations`), `estimate_id` (FK to `finance.estimates`), `purchase_order`, `tax`, `logo_url`, `is_recurring`, `recurring_frequency` (`recurring_frequency_type`), `recurring_start_date`, `recurring_until` (`recurring_until_type`), `recurring_end_date`, `recurring_count`, `duplicated_from_id` (FK to `finance.invoices`), `recurring_template_id`.
* **`finance.invoice_items`**: Line items for invoices.
    * `id` (PK), `invoice_id` (FK to `finance.invoices`), `description`, `quantity`, `unit_price`, `total_price`, `created_at`, `tax_rate`, `discount_rate`.
* **`finance.payments`**: Tracks payments received for invoices.
    * `id` (PK), `invoice_id` (FK to `finance.invoices`), `payment_method`, `amount`, `transaction_id`, `stripe_payment_intent_id`, `status`, `processed_at`, `notes`, `created_at`.
* **`finance.recurring_invoice_templates`**: Defines templates for automatically generated recurring invoices.
    * `id` (PK), `organization_id` (FK to `app.organizations`), `project_id` (FK to `app.projects`), `client_id` (FK to `app.profiles`), `template_name`, `is_active`, `invoice_data` (jsonb), `frequency` (`recurring_frequency_type`), `start_date`, `until_type` (`recurring_until_type`), `end_date`, `max_count`, `next_generation_date`, `generation_count`, `last_generated_at`, `created_at`, `updated_at`, `created_by` (FK to `auth.users`).
* **`finance.recurring_invoice_history`**: Logs the history of recurring invoice generations.
    * `id` (PK), `template_id` (FK to `finance.recurring_invoice_templates`), `invoice_id` (FK to `finance.invoices`), `generated_at`, `generation_date`, `status`, `error_message`, `invoice_data` (jsonb), `created_at`.

#### `messaging` Schema

This schema is dedicated to the application's internal messaging system.

* **`messaging.message_threads`**: Represents conversation threads.
    * `id` (PK), `project_id` (FK to `app.projects`), `subject`, `created_by` (FK to `app.profiles`), `created_at`, `updated_at`.
* **`messaging.messages`**: Individual messages within threads.
    * `id` (PK), `thread_id` (FK to `messaging.message_threads`), `sender_id` (FK to `app.profiles`), `content`, `message_type`, `created_at`, `edited_at`, `is_deleted`.
* **`messaging.message_recipients`**: Tracks read status for messages.
    * `id` (PK), `message_id` (FK to `messaging.messages`), `user_id` (FK to `app.profiles`), `read_status`, `read_at`.
* **`messaging.thread_participants`**: Users participating in a message thread.
    * `id` (PK), `thread_id` (FK to `messaging.message_threads`), `user_id` (FK to `app.profiles`), `joined_at`, `last_read_at`.

#### `audit` Schema

This schema is used for logging audit events across the application.

* **`audit.audit_logs`**: Stores a system-wide audit trail.
    * `id` (PK), `user_id` (FK to `auth.users`), `action`, `entity_type`, `entity_id`, `details` (jsonb), `ip_address`, `user_agent`, `created_at`.

---

### Row Level Security (RLS) Policies

RLS is enabled on all application-specific tables to enforce fine-grained access control based on the authenticated user's ID (`auth.uid()`) and their associated roles and project/organization memberships.

Key RLS principles applied:

* **Ownership**: Users can typically read and update their own profile data (`app.profiles`).
* **Role-Based Access**: 'Admin' users often have broader access (e.g., read/manage all profiles, audit logs, organizations). 'Team members' gain specific management rights within their projects.
* **Project-Based Access**: Users (including clients and team members) can access data (projects, tasks, files, invoices, messages, calendar events) related to projects they are part of or are clients for.
* **Organization-Based Access**: Data like organizations, documents, estimates, quotes, and recurring invoice templates are often accessible to users within the same organization.
* **Service Role Access**: The `service_role` (a high-privileged Supabase role) generally has full access for administrative operations, including system-level tasks like managing recurring invoice history.

**Examples of Policies and How They Work:**

* **`app.profiles` policies**:
    * `profiles_select_own`: A user can `SELECT` their own profile if their `auth.uid()` matches the `id` in the `profiles` table.
    * `profiles_update_own`: Users can `UPDATE` their own profile.
    * `profiles_insert_authenticated`: Authenticated users can `INSERT` their own profile (typically handled by a trigger on `auth.users`).
    * `profiles_service_role_all`: The `service_role` has `ALL` (select, insert, update, delete) access to `profiles`.
* **`app.projects` policies**:
    * `Users can read projects they're assigned to or are clients of`: Allows users to `SELECT` projects if they are a `client_id` for that project, or if their `auth.uid()` is found in the `app.project_team` for that project, or if they are an 'admin'.
* **`finance.invoices` policies**:
    * `Users can read invoices for their projects`: Allows users to `SELECT` invoices if they are the `client_id`, a `project_team` member for the associated project, or an 'admin'.
    * `Team members can manage invoices`: Grants `ALL` (select, insert, update, delete) access to invoices for project team members or admins.
* **`messaging.messages` policies**:
    * `Users can read messages in their threads`: Users can `SELECT` messages if they are part of the project associated with the message thread (either as a `project_team` member or the `client_id` for the project) or if they are an 'admin'.

---

### Database Functions and Triggers

* **`update_updated_at_column()` trigger function**: This function is attached as a `BEFORE UPDATE` trigger to most tables (e.g., `app.projects`, `app.tasks`, `app.calendar_events`, `finance.invoices`, `messaging.message_threads`, `finance.recurring_invoice_templates`) to automatically update the `updated_at` timestamp whenever a row is modified.
* **`handle_new_user()` trigger on `auth.users`**: After a new user is inserted into Supabase's `auth.users` table, this trigger automatically creates a corresponding profile entry in `app.profiles`.
* **`calculate_invoice_totals()` trigger on `finance.invoice_items`**: This `AFTER INSERT, UPDATE, DELETE` trigger recalculates the `subtotal`, `tax_amount`, and `total_amount` of an invoice in `finance.invoices` whenever its `finance.invoice_items` are changed.
* **`add_thread_participants()` trigger on `messaging.message_threads`**: After a new message thread is created, this trigger automatically populates the `messaging.thread_participants` table with relevant project team members and the client.
* **`create_message_recipients()` trigger on `messaging.messages`**: When a new message is inserted, this trigger creates entries in `messaging.message_recipients` for all participants of the thread (excluding the sender) to track read status.
* **`handle_new_organization()` trigger on `app.organizations`**: This `AFTER INSERT` trigger ensures that the user who creates an organization is automatically added as an 'admin' member of that organization in `app.organization_members`.
* **`maintain_profile_organization_consistency()` trigger on `app.organization_members`**: This `AFTER INSERT OR UPDATE` trigger ensures that a user's primary organization ID in `app.profiles` is kept in sync with their primary entry in `app.organization_members`.

---

### Indexing Strategy

Indexes are crucial for database performance, especially for frequently queried columns and relationships. The schema includes indexes on:

* **Foreign Keys**: To speed up joins between related tables (e.g., `idx_projects_client_id`, `idx_tasks_project_id`, `idx_invoices_client_id`).
* **Status and Date Columns**: For filtering and ordering data efficiently (e.g., `idx_projects_status`, `idx_tasks_status`, `idx_invoices_status`, `idx_calendar_events_start_time`, `idx_tasks_due_date`).
* **Composite Indexes**: For common multi-column query patterns (e.g., `idx_projects_client_status`, `idx_tasks_project_status`, `idx_invoices_client_status`).
* **Text Search**: Using `gin` indexes on `tsvector` columns for full-text search capabilities on `name`, `title`, and `content` fields across projects, tasks, and messages.
* **Recurring Invoice Specific Indexes**: To optimize queries for recurring invoice templates and history (e.g., `idx_recurring_templates_active`, `idx_recurring_templates_next_generation`).

This structured and comprehensively documented schema provides a robust and scalable foundation for your professional client portal application.