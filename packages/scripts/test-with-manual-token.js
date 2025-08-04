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

async function testWithManualToken() {
  console.log('🔐 Testing API with Manual Token');
  
  // Login to get token
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'admin@example.com',
    password: 'password123'
  });

  if (authError) {
    console.error('❌ Login error:', authError.message);
    process.exit(1);
  }

  console.log('✅ Login successful');
  const token = authData.session.access_token;
  
  // Test various endpoints
  const apiUrl = 'https://d539yuu6hhr8z.cloudfront.net/api/cross-schema';
  
  const endpoints = [
    '/invoices',
    '/payments', 
    '/projects',
    '/organization-members'
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\n🔍 Testing ${endpoint}...`);
      const response = await fetch(`${apiUrl}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`Status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Success: ${data.length} items returned`);
        if (data.length > 0) {
          console.log(`Sample item:`, JSON.stringify(data[0], null, 2));
        }
      } else {
        const errorData = await response.text();
        console.log(`❌ Error: ${errorData}`);
      }
    } catch (err) {
      console.error(`❌ Request failed:`, err.message);
    }
  }
  
  await supabase.auth.signOut();
  console.log('\n✅ Test completed');
}

testWithManualToken().catch(console.error);