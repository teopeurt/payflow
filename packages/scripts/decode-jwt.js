#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
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

async function decodeJWT() {
  console.log('🔐 Decoding JWT Token');
  
  // Login to get token
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'admin@example.com',
    password: 'password123'
  });

  if (authError) {
    console.error('❌ Login error:', authError.message);
    return;
  }

  console.log('✅ Login successful');
  const token = authData.session.access_token;
  
  // Decode without verification to see the contents
  const decoded = jwt.decode(token, { complete: true });
  
  console.log('\n📋 JWT Header:');
  console.log(JSON.stringify(decoded.header, null, 2));
  
  console.log('\n📋 JWT Payload:');
  console.log(JSON.stringify(decoded.payload, null, 2));
  
  // Show what data is available
  console.log('\n🔍 Available User Data in Token:');
  console.log('- User ID:', decoded.payload.sub);
  console.log('- Email:', decoded.payload.email);
  console.log('- Role:', decoded.payload.role);
  console.log('- User Metadata:', decoded.payload.user_metadata);
  console.log('- App Metadata:', decoded.payload.app_metadata);
  
  await supabase.auth.signOut();
}

decodeJWT().catch(console.error);