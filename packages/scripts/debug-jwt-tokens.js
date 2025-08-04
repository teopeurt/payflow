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

async function debugJWTTokens() {
  console.log('🔍 JWT Token Debug Analysis\n');
  
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
  console.log('🔑 Admin token received\n');

  // Decode and analyze the JWT token
  try {
    const decoded = jwt.decode(adminToken, { complete: true });
    
    console.log('📋 JWT Token Analysis:');
    console.log('   Token Length:', adminToken.length);
    console.log('   Token Preview:', adminToken.substring(0, 50) + '...' + adminToken.substring(adminToken.length - 50));
    console.log('   Header:', JSON.stringify(decoded.header, null, 2));
    console.log('   Payload:');
    console.log('     - iss (issuer):', decoded.payload.iss);
    console.log('     - sub (subject):', decoded.payload.sub);
    console.log('     - aud (audience):', decoded.payload.aud);
    console.log('     - exp (expires):', new Date(decoded.payload.exp * 1000).toISOString());
    console.log('     - iat (issued):', new Date(decoded.payload.iat * 1000).toISOString());
    console.log('     - email:', decoded.payload.email);
    console.log('     - role:', decoded.payload.role);
    console.log('     - user_metadata:', JSON.stringify(decoded.payload.user_metadata, null, 2));
    console.log('     - app_metadata:', JSON.stringify(decoded.payload.app_metadata, null, 2));
    
    // Test token verification with Supabase
    console.log('\n🔐 Token Verification Test:');
    const { data: { user }, error } = await supabase.auth.getUser(adminToken);
    
    if (error) {
      console.log('❌ Token verification failed:', error.message);
    } else {
      console.log('✅ Token verification successful');
      console.log('   User ID:', user.id);
      console.log('   Email:', user.email);
    }
    
  } catch (error) {
    console.error('❌ Error decoding token:', error);
  }

  await supabase.auth.signOut();
  console.log('\n✨ JWT Token debug analysis completed!');
}

debugJWTTokens().catch(console.error);