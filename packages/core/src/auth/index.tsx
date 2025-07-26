import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { getSupabase } from '../integrations/supabase/client';
import { AuthState, Profile, OrganizationMember, Organization } from './types';

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, firstName: string, lastName: string, role?: "admin" | "client", organizationName?: string, organizationId?: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isClient: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
  onSignInSuccess?: (user: User) => void;
  onSignInError?: (error: Error) => void;
  onSignUpSuccess?: (user: User) => void;
  onSignUpError?: (error: Error) => void;
  onSignOutSuccess?: () => void;
  onSignOutError?: (error: Error) => void;
  onSignedOut?: () => void;
}

export function AuthProvider({
  children,
  onSignInSuccess,
  onSignInError,
  onSignUpSuccess,
  onSignUpError,
  onSignOutSuccess,
  onSignOutError,
  onSignedOut,
}: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    roles: [],
    isLoading: true,
    error: null
  });

  const supabase = getSupabase();

  // Check for user role
  const isAdmin = authState.roles.some(role => role.role === 'admin');
  const isClient = authState.roles.some(role => role.role === 'client');

  // Fetch user profile
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('app.profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;

      // Fetch user roles from organization membership
      const { data: roles, error: rolesError } = await supabase
        .from('app.organization_members')
        .select('*')
        .eq('user_id', userId);
      
      if (rolesError) throw rolesError;
      
      setAuthState(prev => ({ 
        ...prev, 
        profile, 
        roles: roles || [],
        isLoading: false 
      }));
    } catch (error: any) {
      console.error('Error fetching user profile:', error.message);
      setAuthState(prev => ({ ...prev, error: error.message, isLoading: false }));
    }
  };

  // Listen for auth changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setAuthState(prev => ({ 
          ...prev, 
          user: session?.user || null,
          session 
        }));

        // Fetch user profile if user is logged in
        if (session?.user) {
          setTimeout(() => {
            fetchUserProfile(session.user.id);
          }, 0);
        } else {
          setAuthState(prev => ({ 
            ...prev, 
            profile: null,
            roles: [],
            isLoading: false 
          }));
        }

        // Handle auth events
        if (event === 'SIGNED_OUT') {
          if (onSignedOut) onSignedOut();
        }
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthState(prev => ({ 
        ...prev, 
        user: session?.user || null,
        session
      }));

      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [onSignedOut, supabase]);

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) throw error;
      
      if (onSignInSuccess && data.user) onSignInSuccess(data.user);
    } catch (error: any) {
      console.error('Sign in error:', error.message);
      setAuthState(prev => ({ ...prev, isLoading: false, error: error.message }));
      if (onSignInError) onSignInError(error);
    }
  };

  // Sign up with email and password
  const signUp = async (
    email: string, 
    password: string, 
    firstName: string, 
    lastName: string, 
    role: "admin" | "client" = 'client',
    organizationName?: string,
    organizationId?: string // Add organizationId parameter
  ) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // First, sign up the user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          }
        }
      });
      
      if (signUpError) throw signUpError;
      
      // Make sure we have a user
      if (!authData.user) {
        throw new Error("User registration failed");
      }
      
      // Note: User role will be set when creating organization membership
      
      if (roleError) throw roleError;
      
      // Handle organization - either use provided ID or create new
      let finalOrgId = organizationId;
      
      // If we need to create a new organization and don't have an existing ID
      if (organizationName && !finalOrgId && authData.user) {
        // Create organization
        const { data: orgData, error: orgError } = await supabase
          .from('app.organizations')
          .insert({ name: organizationName })
          .select('id')
          .single();
        
        if (orgError) throw orgError;
        
        // Set the organization ID
        if (orgData) {
          finalOrgId = orgData.id;
        }
      }
      
      // Create organization membership if we have an organization
      if (finalOrgId && authData.user) {
        const { error: memberError } = await supabase
          .from('app.organization_members')
          .insert({ 
            user_id: authData.user.id,
            organization_id: finalOrgId,
            role: role
          });
        
        if (memberError) throw memberError;
      }
      
      if (onSignUpSuccess && authData.user) onSignUpSuccess(authData.user);
    } catch (error: any) {
      console.error('Sign up error:', error.message);
      setAuthState(prev => ({ ...prev, isLoading: false, error: error.message }));
      if (onSignUpError) onSignUpError(error);
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      if (onSignOutSuccess) onSignOutSuccess();
    } catch (error: any) {
      console.error('Sign out error:', error.message);
      if (onSignOutError) onSignOutError(error);
    }
  };

  const value = {
    ...authState,
    signIn,
    signUp,
    signOut,
    isAdmin,
    isClient
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}