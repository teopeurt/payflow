import { Hono } from 'hono';
import { createClient } from '@supabase/supabase-js';

const app = new Hono();

// Debug endpoint to check environment and Supabase connection
app.get('/health', async (c) => {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  const databaseUrl = process.env.DATABASE_URL;
  
  const response = {
    status: 'ok',
    environment: {
      SUPABASE_URL: supabaseUrl ? 'Set' : 'Missing',
      SUPABASE_ANON_KEY: supabaseAnonKey ? 'Set' : 'Missing',
      DATABASE_URL: databaseUrl ? 'Set' : 'Missing',
    },
    supabaseConnection: false,
    profilesTableAccess: false,
    error: null
  };

  if (supabaseUrl && supabaseAnonKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      
      // Test Supabase connection by querying profiles table
      const { data, error } = await supabase
        .schema('app')
        .from('profiles')
        .select('count')
        .limit(1);
      
      if (error) {
        response.error = error.message;
      } else {
        response.supabaseConnection = true;
        response.profilesTableAccess = true;
      }
    } catch (err: any) {
      response.error = err.message;
    }
  }

  return c.json(response);
});

export default app;