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

async function testMessagesEndpoint() {
  console.log('🔍 Testing Messages Endpoint\n');
  
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

  // First get threads to find a thread ID
  console.log('📋 Fetching threads...');
  try {
    const threadsResponse = await fetch(`${apiUrl}/message-threads?limit=5`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!threadsResponse.ok) {
      console.error('❌ Failed to fetch threads:', await threadsResponse.text());
      return;
    }
    
    const threads = await threadsResponse.json();
    console.log(`   Found ${threads.length} threads`);
    
    if (threads.length === 0) {
      console.log('⚠️  No threads found to test messages endpoint');
      return;
    }
    
    // Test messages for the first thread
    const testThread = threads[0];
    console.log(`\n💬 Testing messages for thread: ${testThread.id} (${testThread.subject})`);
    
    const messagesResponse = await fetch(`${apiUrl}/messages/${testThread.id}`, {
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
        console.log('\n📄 Sample message:');
        const sampleMessage = messages[0];
        console.log(`   ID: ${sampleMessage.id}`);
        console.log(`   Content: ${sampleMessage.content?.substring(0, 50)}...`);
        console.log(`   Sender: ${sampleMessage.sender?.fullName || 'Unknown'}`);
        console.log(`   Created: ${sampleMessage.createdAt}`);
      } else {
        console.log('   No messages found in this thread');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  await supabase.auth.signOut();
}

testMessagesEndpoint().catch(console.error);