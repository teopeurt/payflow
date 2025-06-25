
import { User, Session } from "@supabase/supabase-js";

export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  organization_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'client';
  created_at: string;
}

export interface Document {
  id: string;
  title: string;
  content: string | null;
  organization_id: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: UserRole[];
  isLoading: boolean;
  error: string | null;
}
