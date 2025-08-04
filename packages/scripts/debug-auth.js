#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../payflow-suite/.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function debugAuth() {
  console.log('🔍 Debugging Authentication Issue');
  
  // Login as admin user
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'admin@example.com',
    password: 'password123'
  });

  if (authError) {
    console.error('❌ Login error:', authError.message);
    process.exit(1);
  }

  if (authData.session && authData.user) {
    console.log('✅ Login successful!');
    console.log('User ID:', authData.user.id);
    console.log('User Email:', authData.user.email);
    
    // Check if profile exists in app.profiles
    console.log('\n🔍 Checking profile in app.profiles...');
    const { data: profile, error: profileError } = await supabaseAdmin
      .schema('app')
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        organization_members (
          role,
          organization_id,
          is_primary
        )
      `)
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      console.error('❌ Profile query error:', profileError);
      
      // Check if profile exists at all
      const { data: allProfiles, error: allError } = await supabaseAdmin
        .schema('app')
        .from('profiles')
        .select('id, email, full_name')
        .eq('email', 'admin@example.com');
        
      if (allError) {
        console.error('❌ All profiles query error:', allError);
      } else {
        console.log('📋 Profiles with admin@example.com:', allProfiles);
      }
    } else {
      console.log('✅ Profile found:', profile);
    }
    
    // Check auth.users table
    console.log('\n🔍 Checking auth.users...');
    const { data: authUsers, error: authUsersError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authUsersError) {
      console.error('❌ Auth users query error:', authUsersError);
    } else {
      const adminUser = authUsers.users.find(u => u.email === 'admin@example.com');
      console.log('📋 Auth user:', adminUser ? { id: adminUser.id, email: adminUser.email } : 'Not found');
    }
    
    await supabase.auth.signOut();
  }
}

debugAuth().catch(console.error);