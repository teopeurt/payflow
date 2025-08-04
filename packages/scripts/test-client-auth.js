#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { CrossSchemaApiClient } from '../payflow-suite/src/lib/api/cross-schema-client.ts';
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

// Create token provider function
async function getSupabaseToken() {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error || !session) {
    return null;
  }
  
  return session.access_token;
}

async function testClientAuth() {
  console.log('🧪 Testing CrossSchemaApiClient with Authentication');
  
  // Create authenticated API client
  const apiClient = new CrossSchemaApiClient(
    'https://d539yuu6hhr8z.cloudfront.net/api/cross-schema',
    getSupabaseToken
  );
  
  // Login first
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'admin@example.com',
    password: 'password123'
  });

  if (authError) {
    console.error('❌ Login error:', authError.message);
    process.exit(1);
  }

  console.log('✅ Logged in successfully');
  
  try {
    // Test API calls
    console.log('\n🔍 Testing API calls...');
    
    console.log('Testing getInvoicesWithRelations...');
    const invoices = await apiClient.getInvoicesWithRelations(5);
    console.log(`✅ Invoices: ${invoices.length} found`);
    
    console.log('Testing getProjectsWithRelations...');
    const projects = await apiClient.getProjectsWithRelations(5);
    console.log(`✅ Projects: ${projects.length} found`);
    
    console.log('Testing getPaymentsWithInvoice...');
    const payments = await apiClient.getPaymentsWithInvoice(5);
    console.log(`✅ Payments: ${payments.length} found`);
    
  } catch (error) {
    console.error('❌ API call failed:', error.message);
  }
  
  await supabase.auth.signOut();
  console.log('\n✅ Test completed');
}

testClientAuth().catch(console.error);