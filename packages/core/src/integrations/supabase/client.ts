import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabase: SupabaseClient | null = null;

export function initializeSupabase(url: string, anonKey: string): SupabaseClient {
  if (!supabase) {
    supabase = createClient(url, anonKey);
  }
  return supabase;
}

export function getSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error('Supabase has not been initialized. Please call initializeSupabase first.');
  }
  return supabase;
}
