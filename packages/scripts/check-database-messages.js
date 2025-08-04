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
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

async function checkDatabaseMessages() {
  console.log('🔍 Checking Database for Messages\n');
  
  // Use service role to bypass RLS
  const supabase = createClient(supabaseUrl, serviceRoleKey);
  
  // Check message threads
  console.log('📋 Checking message threads...');
  const { data: threads, error: threadsError } = await supabase
    .schema('messaging')
    .from('message_threads')
    .select('*')
    .limit(5);
    
  if (threadsError) {
    console.error('❌ Error fetching threads:', threadsError);
    return;
  }
  
  console.log(`   Found ${threads.length} threads`);
  if (threads.length > 0) {
    console.log(`   First thread: ${threads[0].id} - ${threads[0].subject}`);
  }
  
  // Check messages
  console.log('\n💬 Checking messages...');
  const { data: messages, error: messagesError } = await supabase
    .schema('messaging')
    .from('messages')
    .select('*')
    .limit(10);
    
  if (messagesError) {
    console.error('❌ Error fetching messages:', messagesError);
    return;
  }
  
  console.log(`   Found ${messages.length} messages total`);
  
  if (messages.length > 0) {
    console.log('\n📄 Sample messages:');
    messages.slice(0, 3).forEach((msg, i) => {
      console.log(`   ${i + 1}. Thread: ${msg.thread_id} | Sender: ${msg.sender_id} | Content: ${msg.content?.substring(0, 50)}...`);
    });
    
    // Check messages for specific threads
    if (threads.length > 0) {
      const testThreadId = threads[0].id;
      console.log(`\n🎯 Messages for thread ${testThreadId}:`);
      
      const { data: threadMessages, error: threadMessagesError } = await supabase
        .schema('messaging')
        .from('messages')
        .select('*')
        .eq('thread_id', testThreadId);
        
      if (threadMessagesError) {
        console.error('❌ Error fetching thread messages:', threadMessagesError);
      } else {
        console.log(`   Found ${threadMessages.length} messages in this thread`);
        threadMessages.forEach((msg, i) => {
          console.log(`   ${i + 1}. ${msg.content?.substring(0, 100)}... (by ${msg.sender_id})`);
        });
      }
    }
  } else {
    console.log('⚠️  No messages found in database');
    
    // Let's create a test message to verify the system works
    if (threads.length > 0) {
      console.log('\n🧪 Creating test message...');
      
      const testThreadId = threads[0].id;
      const { data: insertedMessage, error: insertError } = await supabase
        .schema('messaging')
        .from('messages')
        .insert({
          thread_id: testThreadId,
          sender_id: threads[0].created_by,
          content: 'Test message created by debug script',
          message_type: 'text'
        })
        .select()
        .single();
        
      if (insertError) {
        console.error('❌ Error creating test message:', insertError);
      } else {
        console.log('✅ Test message created:', insertedMessage.id);
        console.log('   Now try refreshing the UI to see if the message appears');
      }
    }
  }
}

checkDatabaseMessages().catch(console.error);