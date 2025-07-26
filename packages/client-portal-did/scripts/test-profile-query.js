import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testProfileQuery() {
  console.log('Testing profile query with admin user...');
  
  try {
    // First sign in as admin
    const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'admin@example.com',
      password: 'password123'
    });
    
    if (signInError) {
      console.error('Sign in error:', signInError);
      return;
    }
    
    console.log('Signed in successfully:', authData.user.id);
    
    // Now try to fetch the profile
    console.log('Fetching profile...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();
    
    if (profileError) {
      console.error('Profile query error:', profileError);
      
      // Check if profile exists at all
      console.log('Checking if any profiles exist...');
      const { data: allProfiles, error: allError } = await supabase
        .from('profiles')
        .select('*')
        .limit(5);
      
      if (allError) {
        console.error('All profiles query error:', allError);
      } else {
        console.log('All profiles:', allProfiles);
      }
    } else {
      console.log('Profile found:', profile);
    }
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

testProfileQuery();