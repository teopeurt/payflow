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

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase Connection');
  
  // Create client with anon key (same as middleware)
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  // Login first
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'admin@example.com',
    password: 'password123'
  });

  if (authError) {
    console.error('❌ Login error:', authError.message);
    return;
  }

  console.log('✅ Login successful');
  console.log('User ID:', authData.user.id);
  
  // Now test the exact same query as the middleware
  console.log('\n🔍 Testing profile query with authenticated client...');
  const { data: profile, error: profileError } = await supabase
    .schema('app')
    .from('profiles')
    .select('id, email, full_name')
    .eq('id', authData.user.id)
    .single();

  if (profileError) {
    console.error('❌ Profile query error:', profileError);
  } else {
    console.log('✅ Profile found:', profile);
  }
  
  // Test organization members query
  console.log('\n🔍 Testing organization members query...');
  const { data: orgMembers, error: orgError } = await supabase
    .schema('app')
    .from('organization_members')
    .select('role, organization_id, is_primary')
    .eq('user_id', authData.user.id)
    .limit(1);

  if (orgError) {
    console.error('❌ Org members query error:', orgError);
  } else {
    console.log('✅ Org members found:', orgMembers);
  }
  
  await supabase.auth.signOut();
}

testSupabaseConnection().catch(console.error);