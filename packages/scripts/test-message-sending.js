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
const TEST_THREAD_ID = '76263297-8d1f-43a6-a2bc-714f860f9994';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

async function testMessageSending() {
  console.log('🧪 Testing Message Sending API\n');
  
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

  // Test sending a message
  console.log(`💬 Sending test message to thread: ${TEST_THREAD_ID}`);
  
  const testMessage = `Test message sent at ${new Date().toISOString()}`;
  
  try {
    const response = await fetch(`${apiUrl}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        threadId: TEST_THREAD_ID,
        content: testMessage
      })
    });
    
    console.log(`   Response: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`   Error body:`, errorText);
    } else {
      const message = await response.json();
      console.log(`   Success: Message created with ID ${message.id}`);
      console.log(`   Content: "${message.content}"`);
      console.log(`   Sender: ${message.sender?.fullName || 'Unknown'}`);
      console.log(`   Created: ${message.createdAt}`);
      
      // Now fetch messages to verify it appears
      console.log('\n🔍 Fetching messages to verify...');
      const messagesResponse = await fetch(`${apiUrl}/messages/${TEST_THREAD_ID}`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (messagesResponse.ok) {
        const messages = await messagesResponse.json();
        console.log(`   Total messages in thread: ${messages.length}`);
        
        const lastMessage = messages[messages.length - 1];
        if (lastMessage && lastMessage.content === testMessage) {
          console.log('✅ Message successfully appears in thread!');
        } else {
          console.log('⚠️  Message not found in thread');
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  await supabase.auth.signOut();
  console.log('\n🎉 Message sending test complete!');
}

testMessageSending().catch(console.error);