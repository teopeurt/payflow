export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  app: {
    Tables: {
      calendar_events: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          end_time: string
          event_type: string | null
          id: string
          location: string | null
          project_id: string | null
          start_time: string
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          end_time: string
          event_type?: string | null
          id?: string
          location?: string | null
          project_id?: string | null
          start_time: string
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          end_time?: string
          event_type?: string | null
          id?: string
          location?: string | null
          project_id?: string | null
          start_time?: string
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      deliverables: {
        Row: {
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          milestone_id: string
          name: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          milestone_id: string
          name: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          milestone_id?: string
          name?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deliverables_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "milestones"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          content: string | null
          created_at: string
          created_by: string | null
          id: string
          organization_id: string
          title: string
          updated_at: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          organization_id: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          organization_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      event_attendees: {
        Row: {
          created_at: string
          event_id: string | null
          id: string
          response: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_id?: string | null
          id?: string
          response?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_id?: string | null
          id?: string
          response?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_attendees_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "calendar_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_attendees_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      file_shares: {
        Row: {
          created_at: string
          expires_at: string | null
          file_id: string | null
          id: string
          permission: string | null
          shared_by: string
          shared_with: string | null
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          file_id?: string | null
          id?: string
          permission?: string | null
          shared_by: string
          shared_with?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          file_id?: string | null
          id?: string
          permission?: string | null
          shared_by?: string
          shared_with?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "file_shares_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "file_shares_shared_by_fkey"
            columns: ["shared_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "file_shares_shared_with_fkey"
            columns: ["shared_with"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      files: {
        Row: {
          created_at: string
          description: string | null
          file_path: string
          file_size: number
          filename: string
          id: string
          is_public: boolean | null
          mime_type: string
          original_filename: string
          project_id: string | null
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_path: string
          file_size: number
          filename: string
          id?: string
          is_public?: boolean | null
          mime_type: string
          original_filename: string
          project_id?: string | null
          uploaded_by: string
        }
        Update: {
          created_at?: string
          description?: string | null
          file_path?: string
          file_size?: number
          filename?: string
          id?: string
          is_public?: boolean | null
          mime_type?: string
          original_filename?: string
          project_id?: string | null
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "files_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invites: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          organization_id: string | null
          role: string
          token: string
          used: boolean
        }
        Insert: {
          created_at?: string
          email: string
          expires_at: string
          id?: string
          organization_id?: string | null
          role: string
          token: string
          used?: boolean
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          organization_id?: string | null
          role?: string
          token?: string
          used?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "invites_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      milestones: {
        Row: {
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          name: string
          project_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          name: string
          project_id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          name?: string
          project_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string | null
          id: string
          is_primary: boolean
          organization_id: string | null
          role: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_primary?: boolean
          organization_id?: string | null
          role?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_primary?: boolean
          organization_id?: string | null
          role?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          company_address: string | null
          company_email: string | null
          company_logo_url: string | null
          company_name: string | null
          company_phone: string | null
          company_website: string | null
          created_at: string
          default_currency: string
          default_payment_terms: number | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          company_address?: string | null
          company_email?: string | null
          company_logo_url?: string | null
          company_name?: string | null
          company_phone?: string | null
          company_website?: string | null
          created_at?: string
          default_currency?: string
          default_payment_terms?: number | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          company_address?: string | null
          company_email?: string | null
          company_logo_url?: string | null
          company_name?: string | null
          company_phone?: string | null
          company_website?: string | null
          created_at?: string
          default_currency?: string
          default_payment_terms?: number | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: Json | null
          client_status: string | null
          company_name: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          last_login: string | null
          notes: string | null
          organization_id: string | null
          profile_picture_url: string | null
          role: string
          source: string | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          address?: Json | null
          client_status?: string | null
          company_name?: string | null
          created_at?: string
          email: string
          full_name: string
          id: string
          last_login?: string | null
          notes?: string | null
          organization_id?: string | null
          profile_picture_url?: string | null
          role: string
          source?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          address?: Json | null
          client_status?: string | null
          company_name?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          last_login?: string | null
          notes?: string | null
          organization_id?: string | null
          profile_picture_url?: string | null
          role?: string
          source?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      project_team: {
        Row: {
          id: string
          joined_at: string
          permissions: Json | null
          project_id: string | null
          role: string
          user_id: string | null
        }
        Insert: {
          id?: string
          joined_at?: string
          permissions?: Json | null
          project_id?: string | null
          role?: string
          user_id?: string | null
        }
        Update: {
          id?: string
          joined_at?: string
          permissions?: Json | null
          project_id?: string | null
          role?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_team_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_team_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          budget: number | null
          client_id: string | null
          created_at: string
          created_by: string
          description: string | null
          end_date: string | null
          id: string
          name: string
          organization_id: string
          priority: string | null
          start_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          budget?: number | null
          client_id?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          organization_id: string
          priority?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          budget?: number | null
          client_id?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          organization_id?: string
          priority?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      task_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string
          id: string
          task_id: string | null
          user_id: string | null
        }
        Insert: {
          assigned_at?: string
          assigned_by: string
          id?: string
          task_id?: string | null
          user_id?: string | null
        }
        Update: {
          assigned_at?: string
          assigned_by?: string
          id?: string
          task_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_assignments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          actual_hours: number | null
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          estimated_hours: number | null
          id: string
          parent_task_id: string | null
          priority: string | null
          project_id: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          actual_hours?: number | null
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          parent_task_id?: string | null
          priority?: string | null
          project_id?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          actual_hours?: number | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          parent_task_id?: string | null
          priority?: string | null
          project_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  audit: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string
          entity_type: string
          id: string
          ip_address: unknown | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id: string
          entity_type: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string
          entity_type?: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  finance: {
    Tables: {
      estimate_items: {
        Row: {
          amount: number
          billable: boolean
          created_at: string | null
          deleted: boolean
          description: string
          estimate_id: string
          id: string
          quantity: number
          unit_price: number
          unit_type: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          billable?: boolean
          created_at?: string | null
          deleted?: boolean
          description: string
          estimate_id: string
          id?: string
          quantity?: number
          unit_price: number
          unit_type?: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          billable?: boolean
          created_at?: string | null
          deleted?: boolean
          description?: string
          estimate_id?: string
          id?: string
          quantity?: number
          unit_price?: number
          unit_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "estimate_items_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "estimates"
            referencedColumns: ["id"]
          },
        ]
      }
      estimates: {
        Row: {
          amount: number
          company_address: string | null
          company_email: string | null
          company_name: string | null
          company_phone: string | null
          created_at: string | null
          deleted: boolean
          expiry_date: string
          id: string
          issue_date: string
          notes: string | null
          organization_id: string
          project_id: string | null
          reference_number: string
          status: string
          terms: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          company_address?: string | null
          company_email?: string | null
          company_name?: string | null
          company_phone?: string | null
          created_at?: string | null
          deleted?: boolean
          expiry_date: string
          id?: string
          issue_date: string
          notes?: string | null
          organization_id: string
          project_id?: string | null
          reference_number: string
          status?: string
          terms?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          company_address?: string | null
          company_email?: string | null
          company_name?: string | null
          company_phone?: string | null
          created_at?: string | null
          deleted?: boolean
          expiry_date?: string
          id?: string
          issue_date?: string
          notes?: string | null
          organization_id?: string
          project_id?: string | null
          reference_number?: string
          status?: string
          terms?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      invoice_items: {
        Row: {
          created_at: string
          description: string
          discount_rate: number | null
          id: string
          invoice_id: string | null
          quantity: number
          tax_rate: number | null
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          description: string
          discount_rate?: number | null
          id?: string
          invoice_id?: string | null
          quantity?: number
          tax_rate?: number | null
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string
          description?: string
          discount_rate?: number | null
          id?: string
          invoice_id?: string | null
          quantity?: number
          tax_rate?: number | null
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          client_id: string
          created_at: string
          created_by: string
          due_date: string
          duplicated_from_id: string | null
          estimate_id: string | null
          id: string
          invoice_number: string
          is_recurring: boolean | null
          issue_date: string
          logo_url: string | null
          notes: string | null
          organization_id: string
          project_id: string | null
          purchase_order: string | null
          recurring_count: number | null
          recurring_end_date: string | null
          recurring_frequency:
            | Database["public"]["Enums"]["recurring_frequency_type"]
            | null
          recurring_start_date: string | null
          recurring_template_id: string | null
          recurring_until:
            | Database["public"]["Enums"]["recurring_until_type"]
            | null
          status: string | null
          subtotal: number
          tax: number
          tax_amount: number | null
          tax_rate: number | null
          terms: string | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          created_by: string
          due_date: string
          duplicated_from_id?: string | null
          estimate_id?: string | null
          id?: string
          invoice_number: string
          is_recurring?: boolean | null
          issue_date: string
          logo_url?: string | null
          notes?: string | null
          organization_id: string
          project_id?: string | null
          purchase_order?: string | null
          recurring_count?: number | null
          recurring_end_date?: string | null
          recurring_frequency?:
            | Database["public"]["Enums"]["recurring_frequency_type"]
            | null
          recurring_start_date?: string | null
          recurring_template_id?: string | null
          recurring_until?:
            | Database["public"]["Enums"]["recurring_until_type"]
            | null
          status?: string | null
          subtotal?: number
          tax?: number
          tax_amount?: number | null
          tax_rate?: number | null
          terms?: string | null
          total_amount?: number
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by?: string
          due_date?: string
          duplicated_from_id?: string | null
          estimate_id?: string | null
          id?: string
          invoice_number?: string
          is_recurring?: boolean | null
          issue_date?: string
          logo_url?: string | null
          notes?: string | null
          organization_id?: string
          project_id?: string | null
          purchase_order?: string | null
          recurring_count?: number | null
          recurring_end_date?: string | null
          recurring_frequency?:
            | Database["public"]["Enums"]["recurring_frequency_type"]
            | null
          recurring_start_date?: string | null
          recurring_template_id?: string | null
          recurring_until?:
            | Database["public"]["Enums"]["recurring_until_type"]
            | null
          status?: string | null
          subtotal?: number
          tax?: number
          tax_amount?: number | null
          tax_rate?: number | null
          terms?: string | null
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_duplicated_from_id_fkey"
            columns: ["duplicated_from_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          invoice_id: string | null
          notes: string | null
          payment_method: string | null
          processed_at: string | null
          status: string | null
          stripe_payment_intent_id: string | null
          transaction_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          invoice_id?: string | null
          notes?: string | null
          payment_method?: string | null
          processed_at?: string | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          transaction_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          invoice_id?: string | null
          notes?: string | null
          payment_method?: string | null
          processed_at?: string | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_items: {
        Row: {
          amount: number
          created_at: string | null
          description: string
          id: string
          quantity: number
          quote_id: string
          unit_price: number
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          description: string
          id?: string
          quantity?: number
          quote_id: string
          unit_price: number
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string
          id?: string
          quantity?: number
          quote_id?: string
          unit_price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          amount: number
          created_at: string | null
          estimate_id: string | null
          expiry_date: string
          id: string
          issue_date: string
          notes: string | null
          organization_id: string
          project_id: string | null
          reference_number: string
          status: string
          terms: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          estimate_id?: string | null
          expiry_date: string
          id?: string
          issue_date: string
          notes?: string | null
          organization_id: string
          project_id?: string | null
          reference_number: string
          status?: string
          terms?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          estimate_id?: string | null
          expiry_date?: string
          id?: string
          issue_date?: string
          notes?: string | null
          organization_id?: string
          project_id?: string | null
          reference_number?: string
          status?: string
          terms?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_invoice_history: {
        Row: {
          created_at: string
          error_message: string | null
          generated_at: string
          generation_date: string
          id: string
          invoice_data: Json | null
          invoice_id: string | null
          status: string | null
          template_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          generated_at?: string
          generation_date: string
          id?: string
          invoice_data?: Json | null
          invoice_id?: string | null
          status?: string | null
          template_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          generated_at?: string
          generation_date?: string
          id?: string
          invoice_data?: Json | null
          invoice_id?: string | null
          status?: string | null
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_invoice_history_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_invoice_history_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "recurring_invoice_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_invoice_templates: {
        Row: {
          client_id: string | null
          created_at: string
          created_by: string | null
          end_date: string | null
          frequency: Database["public"]["Enums"]["recurring_frequency_type"]
          generation_count: number | null
          id: string
          invoice_data: Json
          is_active: boolean | null
          last_generated_at: string | null
          max_count: number | null
          next_generation_date: string
          organization_id: string
          project_id: string | null
          start_date: string
          template_name: string
          until_type: Database["public"]["Enums"]["recurring_until_type"]
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          frequency: Database["public"]["Enums"]["recurring_frequency_type"]
          generation_count?: number | null
          id?: string
          invoice_data: Json
          is_active?: boolean | null
          last_generated_at?: string | null
          max_count?: number | null
          next_generation_date: string
          organization_id: string
          project_id?: string | null
          start_date: string
          template_name: string
          until_type?: Database["public"]["Enums"]["recurring_until_type"]
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          frequency?: Database["public"]["Enums"]["recurring_frequency_type"]
          generation_count?: number | null
          id?: string
          invoice_data?: Json
          is_active?: boolean | null
          last_generated_at?: string | null
          max_count?: number | null
          next_generation_date?: string
          organization_id?: string
          project_id?: string | null
          start_date?: string
          template_name?: string
          until_type?: Database["public"]["Enums"]["recurring_until_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_invoice_templates_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_invoice_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_invoice_templates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  messaging: {
    Tables: {
      message_recipients: {
        Row: {
          id: string
          message_id: string | null
          read_at: string | null
          read_status: boolean | null
          user_id: string | null
        }
        Insert: {
          id?: string
          message_id?: string | null
          read_at?: string | null
          read_status?: boolean | null
          user_id?: string | null
        }
        Update: {
          id?: string
          message_id?: string | null
          read_at?: string | null
          read_status?: boolean | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_recipients_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_recipients_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      message_threads: {
        Row: {
          created_at: string
          created_by: string
          id: string
          project_id: string | null
          subject: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          project_id?: string | null
          subject: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          project_id?: string | null
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_threads_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_threads_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string
          edited_at: string | null
          id: string
          is_deleted: boolean | null
          message_type: string | null
          sender_id: string
          thread_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          edited_at?: string | null
          id?: string
          is_deleted?: boolean | null
          message_type?: string | null
          sender_id: string
          thread_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          edited_at?: string | null
          id?: string
          is_deleted?: boolean | null
          message_type?: string | null
          sender_id?: string
          thread_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "message_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      thread_participants: {
        Row: {
          id: string
          joined_at: string
          last_read_at: string | null
          thread_id: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          joined_at?: string
          last_read_at?: string | null
          thread_id?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          joined_at?: string
          last_read_at?: string | null
          thread_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "thread_participants_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "message_threads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "thread_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      belongs_to_organization: {
        Args: { _user_id: string; _org_id: string }
        Returns: boolean
      }
      calculate_next_generation_date: {
        Args: {
          input_date: string
          frequency: Database["public"]["Enums"]["recurring_frequency_type"]
        }
        Returns: string
      }
      duplicate_invoice_with_items: {
        Args: {
          original_invoice_id: string
          new_invoice_data: Json
          invoice_items: Json
        }
        Returns: string
      }
      get_project_progress: {
        Args: { project_id: string }
        Returns: Json
      }
      get_user_dashboard_stats: {
        Args: { user_id: string }
        Returns: Json
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      log_audit_event: {
        Args: {
          p_action: string
          p_entity_type: string
          p_entity_id: string
          p_details?: Json
        }
        Returns: undefined
      }
      mark_message_as_read: {
        Args: { message_id: string; user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "client" | "team_member"
      recurring_frequency_type:
        | "daily"
        | "weekly"
        | "monthly"
        | "quarterly"
        | "yearly"
      recurring_until_type: "indefinitely" | "on_date" | "count"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "client", "team_member"],
      recurring_frequency_type: [
        "daily",
        "weekly",
        "monthly",
        "quarterly",
        "yearly",
      ],
      recurring_until_type: ["indefinitely", "on_date", "count"],
    },
  },
} as const