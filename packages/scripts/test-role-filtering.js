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

async function testRoleFiltering() {
  console.log('🔍 Testing Role-Based Data Filtering');
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const apiUrl = 'https://d539yuu6hhr8z.cloudfront.net/api/cross-schema';
  
  // Test with admin user
  console.log('\n📋 Testing as Admin User (admin@example.com)...');
  const { data: adminAuth, error: adminError } = await supabase.auth.signInWithPassword({
    email: 'admin@example.com',
    password: 'password123'
  });

  if (!adminError && adminAuth.session) {
    const response = await fetch(`${apiUrl}/organization-members`, {
      headers: {
        'Authorization': `Bearer ${adminAuth.session.access_token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log(`✅ Admin sees: ${data.length} organization members`);
    
    // Check if admin can see members from different orgs
    const orgs = new Set(data.map(m => m.organization?.id).filter(Boolean));
    console.log(`   From ${orgs.size} different organizations`);
  }
  
  await supabase.auth.signOut();
  
  // Test with client user
  console.log('\n📋 Testing as Client User (client@example.com)...');
  const { data: clientAuth, error: clientError } = await supabase.auth.signInWithPassword({
    email: 'client@example.com',
    password: 'password123'
  });

  if (!clientError && clientAuth.session) {
    const response = await fetch(`${apiUrl}/organization-members`, {
      headers: {
        'Authorization': `Bearer ${clientAuth.session.access_token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log(`✅ Client sees: ${data.length} organization members`);
    
    // Check if client only sees their own org
    const orgs = new Set(data.map(m => m.organization?.id).filter(Boolean));
    console.log(`   From ${orgs.size} different organizations`);
  }
  
  await supabase.auth.signOut();
  console.log('\n✅ Role filtering test completed');
}

testRoleFiltering().catch(console.error);