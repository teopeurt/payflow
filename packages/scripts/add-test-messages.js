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

async function addTestMessages() {
  console.log('🔍 Adding Test Messages to Visible Thread\n');
  
  // Use service role to bypass RLS
  const supabase = createClient(supabaseUrl, serviceRoleKey);
  
  // Get the first visible thread (from UI it's "Throughput test thread 18")
  console.log('📋 Finding threads that match UI...');
  const { data: threads, error: threadsError } = await supabase
    .schema('messaging')
    .from('message_threads')
    .select('*')
    .ilike('subject', '%throughput test thread%')
    .order('updated_at', { ascending: false })
    .limit(5);
    
  if (threadsError) {
    console.error('❌ Error fetching threads:', threadsError);
    return;
  }
  
  console.log(`   Found ${threads.length} matching threads`);
  threads.forEach((thread, i) => {
    console.log(`   ${i + 1}. ${thread.id} - ${thread.subject}`);
  });
  
  if (threads.length === 0) {
    console.log('⚠️  No matching threads found');
    return;
  }
  
  // Add messages to the first thread
  const testThread = threads[0];
  console.log(`\n💬 Adding test messages to: ${testThread.subject} (${testThread.id})`);
  
  const testMessages = [
    'Hello! This is a test message to verify message display functionality.',
    'This is a second message to test the conversation flow.',
    'And this is a third message to make sure multiple messages render correctly.'
  ];
  
  for (let i = 0; i < testMessages.length; i++) {
    const { data: insertedMessage, error: insertError } = await supabase
      .schema('messaging')
      .from('messages')
      .insert({
        thread_id: testThread.id,
        sender_id: testThread.created_by,
        content: testMessages[i],
        message_type: 'text'
      })
      .select()
      .single();
      
    if (insertError) {
      console.error(`❌ Error creating message ${i + 1}:`, insertError);
    } else {
      console.log(`✅ Message ${i + 1} created: ${insertedMessage.id}`);
    }
    
    // Small delay between messages
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n🎉 Test messages added successfully!');
  console.log('   Now refresh the UI and select the first thread to see the messages');
}

addTestMessages().catch(console.error);