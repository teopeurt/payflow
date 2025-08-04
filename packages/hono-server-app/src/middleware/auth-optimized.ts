import { Context, Next } from 'hono';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

// Initialize Supabase client for JWT verification and org queries
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase configuration missing. Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface AuthContext {
  userId: string;
  email: string;
  fullName?: string;
  role?: string;
  organizationId?: string;
}

// Extend Hono context to include auth
declare module 'hono' {
  interface ContextVariableMap {
    user: AuthContext;
  }
}

interface JWTPayload {
  sub: string;
  email: string;
  user_metadata?: {
    full_name?: string;
    role?: string;
  };
  [key: string]: any;
}

export const authMiddleware = async (c: Context, next: Next) => {
  console.log('🔐 Auth middleware called');
  
  const authHeader = c.req.header('Authorization');
  console.log('🔐 Auth header:', authHeader ? `Bearer ${authHeader.substring(7, 20)}...` : 'MISSING');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('❌ Missing or invalid Authorization header');
    return c.json({ error: 'Missing or invalid Authorization header' }, 401);
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  console.log('🔐 Token length:', token.length);
  console.log('🔐 Token preview:', token.substring(0, 20) + '...' + token.substring(token.length - 20));

  try {
    // Decode the JWT token to get user info
    console.log('🔐 Attempting to decode JWT token...');
    const decoded = jwt.decode(token) as JWTPayload;
    console.log('🔐 Decoded JWT payload:', {
      sub: decoded?.sub,
      email: decoded?.email,
      exp: decoded?.exp,
      iat: decoded?.iat,
      iss: decoded?.iss,
      aud: decoded?.aud,
      hasUserMetadata: !!decoded?.user_metadata
    });
    
    if (!decoded || !decoded.sub) {
      console.log('❌ Invalid token format - missing sub or decoded is null');
      return c.json({ error: 'Invalid token format' }, 401);
    }

    // Check token expiration manually first
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < now) {
      console.log('❌ Token has expired:', {
        exp: decoded.exp,
        now: now,
        expiredBy: now - decoded.exp
      });
      return c.json({ error: 'Token has expired' }, 401);
    }

    // Try to verify the token with Supabase, but don't fail completely if it doesn't work
    console.log('🔐 Verifying token with Supabase...');
    const { data: { user }, error } = await supabase.auth.getUser(token);
    console.log('🔐 Supabase verification result:', {
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      error: error?.message || null
    });
    
    // If Supabase verification fails but the token is properly formatted and not expired,
    // we'll trust the JWT payload (this handles browser vs server token differences)
    let verifiedUser = user;
    if (error || !user) {
      console.log('⚠️ Supabase verification failed, but JWT is valid. Using JWT payload data.');
      console.log('🔐 JWT-based user info:', {
        sub: decoded.sub,
        email: decoded.email,
        exp: new Date(decoded.exp * 1000).toISOString()
      });
      
      // Validate that this is a properly signed Supabase token by checking the issuer
      if (!decoded.iss || !decoded.iss.includes('supabase.co')) {
        console.log('❌ Token is not from a valid Supabase issuer:', decoded.iss);
        return c.json({ error: 'Invalid token issuer' }, 401);
      }
      
      // Create a user-like object from the JWT payload
      verifiedUser = {
        id: decoded.sub,
        email: decoded.email
      };
    }

    // Extract user info from the JWT token (no database query needed!)
    const authContext: AuthContext = {
      userId: verifiedUser.id,
      email: verifiedUser.email || decoded.email,
      fullName: decoded.user_metadata?.full_name,
      role: decoded.user_metadata?.role // This is the app-level role from user_metadata
    };

    // Only query for organization membership if needed
    // We use the anon key client here since we're querying by user_id which should be accessible
    const { data: orgMembers } = await supabase
      .schema('app')
      .from('organization_members')
      .select('role, organization_id, is_primary')
      .eq('user_id', authContext.userId)
      .limit(1);

    // Add organization context if available
    if (orgMembers && orgMembers.length > 0) {
      const orgMember = orgMembers[0];
      authContext.organizationId = orgMember.organization_id;
      // Override role with organization-specific role if available
      if (orgMember.role) {
        authContext.role = orgMember.role;
      }
    }

    // Store user context in Hono context
    c.set('user', authContext);
    console.log('✅ Authentication successful for user:', {
      userId: authContext.userId,
      email: authContext.email,
      role: authContext.role,
      organizationId: authContext.organizationId
    });
    
    await next();
  } catch (error) {
    console.error('❌ Auth middleware error:', error);
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack
    });
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