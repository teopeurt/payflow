import { Context, Next } from 'hono';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

// Initialize Supabase client for JWT verification
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase configuration missing. Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface AuthContext {
  userId: string;
  email: string;
  role?: string;
  organizationId?: string;
}

// Extend Hono context to include auth
declare module 'hono' {
  interface ContextVariableMap {
    user: AuthContext;
  }
}

export const authMiddleware = async (c: Context, next: Next) => {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Missing or invalid Authorization header' }, 401);
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  try {
    // Create a new Supabase client with the user's token for authenticated queries
    const authenticatedSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });
    
    // Verify JWT token with Supabase
    const { data: { user }, error } = await authenticatedSupabase.auth.getUser();
    
    if (error || !user) {
      return c.json({ error: 'Invalid or expired token' }, 401);
    }

    // Get user profile from database using authenticated client
    const { data: profile, error: profileError } = await authenticatedSupabase
      .schema('app')
      .from('profiles')
      .select('id, email, full_name')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return c.json({ error: 'User profile not found' }, 403);
    }

    // Get organization membership separately
    const { data: orgMembers, error: orgError } = await authenticatedSupabase
      .schema('app')
      .from('organization_members')
      .select('role, organization_id, is_primary')
      .eq('user_id', user.id)
      .limit(1);

    // Extract organization context (take first membership if multiple)
    const orgMember = orgMembers?.[0];
    
    const authContext: AuthContext = {
      userId: user.id,
      email: user.email!,
      role: orgMember?.role,
      organizationId: orgMember?.organization_id
    };

    // Store user context in Hono context
    c.set('user', authContext);
    
    await next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return c.json({ error: 'Authentication failed' }, 401);
  }
};

// Optional: Role-based access control middleware
export const requireRole = (requiredRole: string) => {
  return async (c: Context, next: Next) => {
    const user = c.get('user');
    
    if (!user || user.role !== requiredRole) {
      return c.json({ error: `Access denied. Required role: ${requiredRole}` }, 403);
    }
    
    await next();
  };
};

// Optional: Admin-only access middleware
export const requireAdmin = requireRole('admin');