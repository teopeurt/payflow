import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, type Profile } from '../lib/supabase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await fetchProfile(session.user.id);
      }
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.id);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string, retryCount = 0) => {
    try {
      console.log('Fetching profile for user:', userId, 'retry:', retryCount);
      
      // Add a small delay to ensure auth is fully established
      if (retryCount === 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Check if we can connect to Supabase
      console.log('Supabase client:', supabase);
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Profile fetch timeout')), 10000);
      });
      
      const queryPromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      console.log('Starting profile query...');
      
      const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;
      
      console.log('Profile query result:', { data, error });
      
      if (error) {
        console.error('Profile fetch error:', error);
        // If profile doesn't exist, create a basic one from user metadata
        if (error.code === 'PGRST116') {
          console.log('Profile not found, user might need profile creation');
          // Try to create a basic profile from user metadata
          const user = await supabase.auth.getUser();
          if (user.data.user) {
            const basicProfile = {
              id: user.data.user.id,
              email: user.data.user.email || '',
              full_name: user.data.user.user_metadata?.full_name || 'User',
              role: user.data.user.user_metadata?.role || 'client'
            };
            console.log('Setting basic profile from user metadata:', basicProfile);
            setProfile(basicProfile as any);
          } else {
            setProfile(null);
          }
          return;
        }
        throw error;
      }
      
      console.log('Profile fetched:', data);
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      console.error('Full error object:', error.message);
      
      // Retry once if it's a timeout error
      if (error.message === 'Profile fetch timeout' && retryCount < 1) {
        console.log('Retrying profile fetch...');
        return fetchProfile(userId, retryCount + 1);
      }
      
      // If there's an error, try to create a basic profile from user data
      try {
        const user = await supabase.auth.getUser();
        if (user.data.user) {
          const basicProfile = {
            id: user.data.user.id,
            email: user.data.user.email || '',
            full_name: user.data.user.user_metadata?.full_name || 'User',
            role: user.data.user.user_metadata?.role || 'client'
          };
          console.log('Setting fallback profile from user metadata:', basicProfile);
          setProfile(basicProfile as any);
        } else {
          setProfile(null);
        }
      } catch (fallbackError) {
        console.error('Fallback profile creation failed:', fallbackError);
        setProfile(null);
      }
    } finally {
      // Always set loading to false after profile fetch attempt
      console.log('Profile fetch completed, setting loading to false');
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signUp = async (email: string, password: string, fullName: string, role: string = 'client') => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,
        },
      },
    });
    return { data, error };
  };

  const signOut = async () => {
    // Clear all session data
    setUser(null);
    setProfile(null);
    setLoading(false);
    
    // Sign out from Supabase and clear all tokens
    const { error } = await supabase.auth.signOut({ scope: 'global' });
    
    // Clear any remaining local storage items
    localStorage.clear();
    sessionStorage.clear();
    
    return { error };
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: 'No user logged in' };

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (!error && data) {
      setProfile(data);
    }

    return { data, error };
  };

  return {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    isAdmin: profile?.role === 'admin',
    isTeamMember: profile?.role === 'team_member',
    isClient: profile?.role === 'client',
  };
}