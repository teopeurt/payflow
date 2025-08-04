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
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkOrgMembership() {
  console.log('🔍 Checking Organization Membership');
  
  // Get admin user profile
  const { data: profile, error: profileError } = await supabaseAdmin
    .schema('app')
    .from('profiles')
    .select('id, email, full_name')
    .eq('email', 'admin@example.com')
    .single();

  if (profileError || !profile) {
    console.error('❌ Profile not found:', profileError);
    return;
  }

  console.log('✅ Profile found:', profile);

  // Check organization membership
  const { data: orgMembers, error: orgError } = await supabaseAdmin
    .schema('app')
    .from('organization_members')
    .select('*')
    .eq('user_id', profile.id);

  if (orgError) {
    console.error('❌ Org membership query error:', orgError);
  } else {
    console.log('📋 Organization memberships:', orgMembers);
  }

  // Check if organization_members table exists and has data
  const { data: allMembers, error: allMembersError } = await supabaseAdmin
    .schema('app')
    .from('organization_members')
    .select('*')
    .limit(5);

  if (allMembersError) {
    console.error('❌ All members query error:', allMembersError);
  } else {
    console.log('📋 Sample organization members:', allMembers);
  }

  // Check organizations table
  const { data: orgs, error: orgsError } = await supabaseAdmin
    .schema('app')
    .from('organizations')
    .select('*')
    .limit(5);

  if (orgsError) {
    console.error('❌ Organizations query error:', orgsError);
  } else {
    console.log('📋 Sample organizations:', orgs);
  }
}

checkOrgMembership().catch(console.error);