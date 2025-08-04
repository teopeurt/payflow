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
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAuth() {
  console.log('🔐 Testing Cross-Schema API Authentication');
  console.log('Attempting to login as admin@example.com...');

  // Login as admin user
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'admin@example.com',
    password: 'password123'
  });

  if (error) {
    console.error('❌ Login error:', error.message);
    process.exit(1);
  }

  if (data.session) {
    console.log('✅ Login successful!');
    const token = data.session.access_token;
    
    // Test API with authentication
    console.log('\n🔍 Testing protected API endpoints...');
    
    const apiUrl = 'https://d539yuu6hhr8z.cloudfront.net/api/cross-schema';
    
    try {
      // Test invoices endpoint
      console.log('Testing /invoices endpoint...');
      const response = await fetch(`${apiUrl}/invoices`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`Status: ${response.status}`);
      const data = await response.json();
      console.log(`Response: ${JSON.stringify(data, null, 2)}`);
      
    } catch (err) {
      console.error('❌ API test failed:', err.message);
    }
    
    // Logout
    await supabase.auth.signOut();
    console.log('\n✅ Logged out successfully');
    
  } else {
    console.error('❌ No session returned');
  }
}

testAuth().catch(console.error);