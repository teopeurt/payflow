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

async function testMessagingEndpoints() {
  console.log('🚀 Testing New Messaging Endpoints\n');
  
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

  // Test message threads endpoint
  try {
    console.log('📊 Testing GET /message-threads...');
    const response = await fetch(`${apiUrl}/message-threads?limit=5`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const threads = await response.json();
      console.log(`✅ Message threads: ${threads.length} items`);
      if (threads.length > 0) {
        console.log('   Sample thread:');
        console.log(`   - ID: ${threads[0].id}`);
        console.log(`   - Subject: ${threads[0].subject}`);
        console.log(`   - Creator: ${threads[0].creator?.fullName || 'Unknown'}`);
        console.log(`   - Project: ${threads[0].project?.name || 'None'}`);
        
        // Test messages for thread endpoint
        const threadId = threads[0].id;
        console.log(`\n📊 Testing GET /messages/${threadId}...`);
        
        const messagesResponse = await fetch(`${apiUrl}/messages/${threadId}`, {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (messagesResponse.ok) {
          const messages = await messagesResponse.json();
          console.log(`✅ Messages: ${messages.length} items`);
          if (messages.length > 0) {
            console.log('   Sample message:');
            console.log(`   - Content: ${messages[0].content}`);
            console.log(`   - Sender: ${messages[0].sender?.fullName || 'Unknown'}`);
          }
        } else {
          console.log(`❌ Messages endpoint: ${messagesResponse.status} ${messagesResponse.statusText}`);
        }
      }
    } else {
      console.log(`❌ Message threads: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.log(`❌ Error testing messaging endpoints: ${error.message}`);
  }

  await supabase.auth.signOut();
  
  // Test with client user for permission filtering
  console.log('\n👤 Testing as Client User (client@example.com)...');
  const { data: clientAuth, error: clientError } = await supabase.auth.signInWithPassword({
    email: 'client@example.com',
    password: 'password123'
  });

  if (!clientError && clientAuth.session) {
    const clientToken = clientAuth.session.access_token;
    console.log('🔑 Client authenticated successfully\n');

    try {
      console.log('📊 Testing client access to message threads...');
      const response = await fetch(`${apiUrl}/message-threads?limit=5`, {
        headers: {
          'Authorization': `Bearer ${clientToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const threads = await response.json();
        console.log(`✅ Client sees: ${threads.length} message threads`);
      } else {
        console.log(`❌ Client access: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.log(`❌ Error testing client access: ${error.message}`);
    }
  }

  await supabase.auth.signOut();
  console.log('\n🎉 Messaging endpoint tests completed!');
}

testMessagingEndpoints().catch(console.error);