import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export type Profile = {
  id: string;
  email: string;
  full_name: string;
  profile_picture_url?: string;
  role: 'admin' | 'team_member' | 'client';
  company_name?: string;
  address?: any;
  website_url?: string;
  notes?: string;
  client_status?: 'lead' | 'active' | 'inactive';
  source?: string;
  created_at: string;
  updated_at: string;
  last_login?: string;
};

export type Project = {
  id: string;
  name: string;
  description?: string;
  status: 'draft' | 'active' | 'completed' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  client_id?: string;
  start_date?: string;
  end_date?: string;
  budget?: number;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type Task = {
  id: string;
  project_id: string;
  parent_task_id?: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'review' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  estimated_hours?: number;
  actual_hours?: number;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type Invoice = {
  id: string;
  invoice_number: string;
  project_id?: string;
  client_id: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled' | 'partial';
  issue_date: string;
  due_date: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  notes?: string;
  terms?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type MessageThread = {
  id: string;
  project_id: string;
  subject: string;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type Message = {
  id: string;
  thread_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'system' | 'file';
  created_at: string;
  edited_at?: string;
  is_deleted: boolean;
};

export type CalendarEvent = {
  id: string;
  title: string;
  description?: string;
  project_id?: string;
  start_time: string;
  end_time: string;
  location?: string;
  event_type: 'meeting' | 'deadline' | 'milestone' | 'reminder';
  status: 'scheduled' | 'completed' | 'cancelled';
  created_by: string;
  created_at: string;
  updated_at: string;
};