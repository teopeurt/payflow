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

async function testEndpoint(endpoint, token, description) {
  try {
    const response = await fetch(`${apiUrl}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.log(`❌ ${description}: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const data = await response.json();
    console.log(`✅ ${description}: ${data.length} items`);
    
    // Show sample data structure for first item
    if (data.length > 0) {
      const sample = data[0];
      const keys = Object.keys(sample);
      console.log(`   Sample keys: ${keys.slice(0, 5).join(', ')}${keys.length > 5 ? '...' : ''}`);
    }
    
    return data;
  } catch (error) {
    console.log(`❌ ${description}: ${error.message}`);
    return null;
  }
}

async function testAllEndpoints() {
  console.log('🚀 Testing All Cross-Schema API Endpoints\n');
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  // Test with admin user
  console.log('👤 Testing as Admin User (admin@example.com)...');
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

  // Test all endpoints as admin
  console.log('📊 Admin Endpoint Tests:');
  await testEndpoint('/invoices?limit=5', adminToken, 'GET /invoices');
  await testEndpoint('/payments?limit=5', adminToken, 'GET /payments');
  await testEndpoint('/organization-members?limit=5', adminToken, 'GET /organization-members');
  await testEndpoint('/projects?limit=5', adminToken, 'GET /projects');
  
  // Test specific invoice with items
  const invoices = await testEndpoint('/invoices?limit=1', adminToken, 'GET /invoices (for ID)');
  if (invoices && invoices.length > 0) {
    const invoiceId = invoices[0].id;
    await testEndpoint(`/invoices/${invoiceId}`, adminToken, `GET /invoices/${invoiceId}`);
  }

  await supabase.auth.signOut();
  
  // Test with client user
  console.log('\n👤 Testing as Client User (client@example.com)...');
  const { data: clientAuth, error: clientError } = await supabase.auth.signInWithPassword({
    email: 'client@example.com',
    password: 'password123'
  });

  if (clientError || !clientAuth.session) {
    console.error('❌ Failed to authenticate client user:', clientError);
    return;
  }

  const clientToken = clientAuth.session.access_token;
  console.log('🔑 Client authenticated successfully\n');

  // Test all endpoints as client (should see filtered data)
  console.log('📊 Client Endpoint Tests (filtered data):');
  await testEndpoint('/invoices?limit=5', clientToken, 'GET /invoices');
  await testEndpoint('/payments?limit=5', clientToken, 'GET /payments');
  await testEndpoint('/organization-members?limit=5', clientToken, 'GET /organization-members');
  await testEndpoint('/projects?limit=5', clientToken, 'GET /projects');

  await supabase.auth.signOut();
  
  // Test without authentication
  console.log('\n🚫 Testing without authentication (should fail):');
  try {
    const response = await fetch(`${apiUrl}/invoices?limit=1`);
    console.log(`❌ Unauthenticated request: ${response.status} ${response.statusText}`);
  } catch (error) {
    console.log(`❌ Unauthenticated request failed: ${error.message}`);
  }

  console.log('\n🎉 All endpoint tests completed!');
}

testAllEndpoints().catch(console.error);