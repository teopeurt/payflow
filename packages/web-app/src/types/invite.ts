
export interface Invite {
  id: string;
  email: string;
  token: string;
  organization_id: string | null;
  role: 'admin' | 'client';
  created_at: string;
  expires_at: string;
  used: boolean;
  organizations?: { name: string } | null;
}

// This interface helps us work with Supabase until the types are regenerated
export interface InviteInsert {
  email: string;
  token: string;
  organization_id?: string | null;
  role: 'admin' | 'client';
  expires_at: string;
  used: boolean;
}
