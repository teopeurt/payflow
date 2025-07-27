import type { Database } from '@/integrations/supabase/types';

export type AppTables = Database['app']['Tables'];
export type FinanceTables = Database['finance']['Tables'];
export type MessagingTables = Database['messaging']['Tables'];
export type AuditTables = Database['audit']['Tables'];

export type Profile = AppTables['profiles']['Row'];
export type Organization = AppTables['organizations']['Row'];
export type OrganizationMember = AppTables['organization_members']['Row'];
export type Project = AppTables['projects']['Row'];
export type Task = AppTables['tasks']['Row'];
export type TimeEntry = AppTables['time_entries']['Row'];
export type File = AppTables['files']['Row'];
export type FileShare = AppTables['file_shares']['Row'];
export type CalendarEvent = AppTables['calendar_events']['Row'];
export type Notification = AppTables['notifications']['Row'];
export type Milestone = AppTables['milestones']['Row'];
export type Deliverable = AppTables['deliverables']['Row'];

export type Invoice = FinanceTables['invoices']['Row'];
export type InvoiceItem = FinanceTables['invoice_items']['Row'];
export type Payment = FinanceTables['payments']['Row'];
export type Estimate = FinanceTables['estimates']['Row'];
export type EstimateItem = FinanceTables['estimate_items']['Row'];
export type RecurringInvoiceTemplate = FinanceTables['recurring_invoice_templates']['Row'];
export type RecurringInvoiceHistory = FinanceTables['recurring_invoice_history']['Row'];

export type MessageThread = MessagingTables['message_threads']['Row'];
export type Message = MessagingTables['messages']['Row'];
export type MessageParticipant = MessagingTables['message_participants']['Row'];

export type AuditLog = AuditTables['logs']['Row'];

export type UserRole = 'admin' | 'team_member' | 'client';

export interface UserWithProfile {
  id: string;
  email: string;
  profile: Profile;
  organization_members: OrganizationMember[];
}