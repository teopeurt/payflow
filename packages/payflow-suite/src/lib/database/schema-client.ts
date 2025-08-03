// import { getSupabase } from '@payflow/core/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import {getSupabase} from "@payflow/core/integrations/supabase/client";

type AppSchema = Database['app']['Tables'];
type FinanceSchema = Database['finance']['Tables'];
type MessagingSchema = Database['messaging']['Tables'];
type AuditSchema = Database['audit']['Tables'];

export class SchemaClient {
  private get client() {
    return getSupabase();
  }

  get app() {
    return {
      profiles: () => this.client.schema('app').from('profiles'),
      organizations: () => this.client.schema('app').from('organizations'),
      organization_members: () => this.client.schema('app').from('organization_members'),
      projects: () => this.client.schema('app').from('projects'),
      tasks: () => this.client.schema('app').from('tasks'),
      time_entries: () => this.client.schema('app').from('time_entries'),
      files: () => this.client.schema('app').from('files'),
      file_shares: () => this.client.schema('app').from('file_shares'),
      calendar_events: () => this.client.schema('app').from('calendar_events'),
      notifications: () => this.client.schema('app').from('notifications'),
      milestones: () => this.client.schema('app').from('milestones'),
      deliverables: () => this.client.schema('app').from('deliverables'),
    };
  }

  get finance() {
    return {
      invoices: () => this.client.schema('finance').from('invoices'),
      invoice_items: () => this.client.schema('finance').from('invoice_items'),
      payments: () => this.client.schema('finance').from('payments'),
      estimates: () => this.client.schema('finance').from('estimates'),
      estimate_items: () => this.client.schema('finance').from('estimate_items'),
      recurring_invoice_templates: () => this.client.schema('finance').from('recurring_invoice_templates'),
      recurring_invoice_history: () => this.client.schema('finance').from('recurring_invoice_history'),
    };
  }

  get messaging() {
    return {
      message_threads: () => this.client.schema('messaging').from('message_threads'),
      messages: () => this.client.schema('messaging').from('messages'),
      message_participants: () => this.client.schema('messaging').from('message_participants'),
      message_recipients: () => this.client.schema('messaging').from('message_recipients'),
    };
  }

  get audit() {
    return {
      audit_logs: () => this.client.from('audit_logs'),
    };
  }
}

export const schemaClient = new SchemaClient();