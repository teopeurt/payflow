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

async function testDetailedResponses() {
  console.log('🔍 Testing Detailed API Responses\n');
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  // Authenticate as admin
  const { data: adminAuth } = await supabase.auth.signInWithPassword({
    email: 'admin@example.com',
    password: 'password123'
  });

  const token = adminAuth.session.access_token;

  // Test invoice with relations
  console.log('💰 Invoice with Relations:');
  const invoicesResponse = await fetch(`${apiUrl}/invoices?limit=1`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const invoices = await invoicesResponse.json();
  console.log(JSON.stringify(invoices[0], null, 2));

  console.log('\n💳 Payment with Invoice:');
  const paymentsResponse = await fetch(`${apiUrl}/payments?limit=1`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const payments = await paymentsResponse.json();
  console.log(JSON.stringify(payments[0], null, 2));

  console.log('\n👥 Organization Member with Details:');
  const membersResponse = await fetch(`${apiUrl}/organization-members?limit=1`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const members = await membersResponse.json();
  console.log(JSON.stringify(members[0], null, 2));

  console.log('\n📁 Project with Relations:');
  const projectsResponse = await fetch(`${apiUrl}/projects?limit=1`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const projects = await projectsResponse.json();
  console.log(JSON.stringify(projects[0], null, 2));

  // Test specific invoice with items
  if (invoices.length > 0) {
    const invoiceId = invoices[0].id;
    console.log(`\n📝 Invoice ${invoiceId} with Items:`);
    const invoiceResponse = await fetch(`${apiUrl}/invoices/${invoiceId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const invoice = await invoiceResponse.json();
    console.log(JSON.stringify(invoice, null, 2));
  }

  await supabase.auth.signOut();
}

testDetailedResponses().catch(console.error);