import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkSchema() {
  console.log('Checking database schema...');
  
  try {
    // Check if profiles table exists
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (profilesError) {
      console.log('Profiles table error:', profilesError.message);
    } else {
      console.log('✓ Profiles table exists');
    }
    
    // Check if projects table exists
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .limit(1);
    
    if (projectsError) {
      console.log('Projects table error:', projectsError.message);
    } else {
      console.log('✓ Projects table exists');
    }
    
    // Check what tables do exist
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_schema_tables');
    
    if (tablesError) {
      console.log('Could not get table list:', tablesError.message);
    } else {
      console.log('Available tables:', tables);
    }
    
  } catch (error) {
    console.error('Error checking schema:', error);
  }
}

checkSchema();