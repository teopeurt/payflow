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

// Thread ID that we know has messages
const THREAD_WITH_MESSAGES = '76263297-8d1f-43a6-a2bc-714f860f9994';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

async function testSpecificThread() {
  console.log('🔍 Testing Specific Thread with Messages\n');
  
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

  // Test the specific thread that has messages
  console.log(`💬 Testing messages for thread with known data: ${THREAD_WITH_MESSAGES}`);
  
  try {
    const messagesResponse = await fetch(`${apiUrl}/messages/${THREAD_WITH_MESSAGES}`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`   Response: ${messagesResponse.status} ${messagesResponse.statusText}`);
    
    if (!messagesResponse.ok) {
      const errorText = await messagesResponse.text();
      console.log(`   Error body:`, errorText);
    } else {
      const messages = await messagesResponse.json();
      console.log(`   Success: ${messages.length} messages returned`);
      
      if (messages.length > 0) {
        console.log('\n📄 First few messages:');
        messages.slice(0, 3).forEach((msg, i) => {
          console.log(`   ${i + 1}. ID: ${msg.id}`);
          console.log(`      Content: ${msg.content?.substring(0, 80)}...`);
          console.log(`      Sender: ${msg.sender?.fullName || 'Unknown'} (${msg.sender?.id})`);
          console.log(`      Created: ${msg.createdAt}`);
          console.log('');
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  await supabase.auth.signOut();
}

testSpecificThread().catch(console.error);