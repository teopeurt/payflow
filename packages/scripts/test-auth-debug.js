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
const apiUrl = 'https://d539yuu6hhr8z.cloudfront.net/api/cross-schema';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

async function testAuthDebug() {
  console.log('🔍 Testing Auth Debug Middleware\n');
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  // Test with admin user
  console.log('👤 Authenticating as Admin User...');
  const { data: adminAuth, error: adminError } = await supabase.auth.signInWithPassword({
    email: 'admin@example.com',
    password: 'password123'
  });

  if (adminError || !adminAuth.session) {
    console.error('❌ Failed to authenticate admin user:', adminError);
    return;
  }

  const adminToken = adminAuth.session.access_token;
  console.log('🔑 Admin authenticated successfully\n');

  // Test with invalid token first
  console.log('🧪 Testing with INVALID token (should trigger auth debug logs)...');
  try {
    const invalidResponse = await fetch(`${apiUrl}/message-threads?limit=1`, {
      headers: {
        'Authorization': `Bearer invalid-token-12345`,
        'Content-Type': 'application/json'
      }
    });
    console.log(`   Response: ${invalidResponse.status} ${invalidResponse.statusText}`);
    if (!invalidResponse.ok) {
      const errorText = await invalidResponse.text();
      console.log(`   Error body:`, errorText);
    }
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }

  console.log('\n🧪 Testing with VALID token (should also trigger auth debug logs)...');
  try {
    const validResponse = await fetch(`${apiUrl}/message-threads?limit=1`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    console.log(`   Response: ${validResponse.status} ${validResponse.statusText}`);
    if (!validResponse.ok) {
      const errorText = await validResponse.text();
      console.log(`   Error body:`, errorText);
    } else {
      const data = await validResponse.json();
      console.log(`   Success: ${data.length} threads returned`);
    }
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }

  await supabase.auth.signOut();
  console.log('\n💡 Check CloudWatch logs for the auth middleware debug output');
  console.log('   Look for logs with 🔐 emoji prefixes');
}

testAuthDebug().catch(console.error);