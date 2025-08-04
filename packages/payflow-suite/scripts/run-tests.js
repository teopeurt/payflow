#!/usr/bin/env bun

/**
 * CLI Test Runner for Payflow Suite Migration Tests
 * 
 * This script runs basic connectivity and schema tests for the migration.
 * For comprehensive testing, use the web interface at /testing.
 * 
 * Usage: 
 *   bun run test
 *   bun scripts/run-tests.js [--admin-email=email] [--client-email=email]
 * 
 * Environment Requirements:
 *   - VITE_SUPABASE_URL: Supabase project URL
 *   - VITE_SUPABASE_ANON_KEY: Supabase anon key
 *   - SUPABASE_SERVICE_ROLE_KEY: Supabase service role key (for admin access)
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../../scripts/.env') }); // Also load scripts env

// Test user emails from seed data
const DEFAULT_ADMIN_EMAIL = 'admin@example.com';
const DEFAULT_CLIENT_EMAIL = 'client@example.com';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const crossSchemaApiUrl = process.env.CROSS_SCHEMA_API_URL;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase configuration. Please check your environment files.');
  process.exit(1);
}

// Use service role key if available for testing, otherwise anon key
const supabaseKey = supabaseServiceKey || supabaseAnonKey;
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Mock the schema client and queries
const mockSchemaClient = {
  app: {
    profiles: () => supabase.schema('app').from('profiles'),
    organizations: () => supabase.schema('app').from('organizations'),
    organization_members: () => supabase.schema('app').from('organization_members'),
    projects: () => supabase.schema('app').from('projects'),
    tasks: () => supabase.schema('app').from('tasks'),
    milestones: () => supabase.schema('app').from('milestones'),
    calendar_events: () => supabase.schema('app').from('calendar_events'),
    user_settings: () => supabase.schema('app').from('user_settings'),
    notifications: () => supabase.schema('app').from('notifications'),
    file_attachments: () => supabase.schema('app').from('file_attachments')
  },
  finance: {
    invoices: () => supabase.schema('finance').from('invoices'),
    invoice_items: () => supabase.schema('finance').from('invoice_items'),
    payments: () => supabase.schema('finance').from('payments'),
    recurring_invoices: () => supabase.schema('finance').from('recurring_invoices'),
    payment_methods: () => supabase.schema('finance').from('payment_methods')
  },
  messaging: {
    message_threads: () => supabase.schema('messaging').from('message_threads'),
    messages: () => supabase.schema('messaging').from('messages'),
    message_participants: () => supabase.schema('messaging').from('message_participants'),
    message_recipients: () => supabase.schema('messaging').from('message_recipients'),
    message_attachments: () => supabase.schema('messaging').from('message_attachments')
  },
  audit: {
    audit_logs: () => supabase.schema('audit').from('audit_logs')
  }
};

const mockDbQueries = {
  async getUserRole(userId) {
    const { data, error } = await mockSchemaClient.app
      .organization_members()
      .select('role')
      .eq('user_id', userId)
      .single();
    
    if (error) throw error;
    return data?.role || 'client';
  },

  async getUserOrganization(userId) {
    const { data, error } = await mockSchemaClient.app
      .organization_members()
      .select('organization_id')
      .eq('user_id', userId)
      .single();
    
    if (error) throw error;
    return data?.organization_id;
  },

  async hasPermission(userId, table, action) {
    const role = await this.getUserRole(userId);
    // Admins have all permissions
    if (role === 'admin') return true;
    // Basic client permissions
    if (table === 'profiles' && action === 'read') return true;
    if (table === 'organizations' && action === 'read') return true;
    return false;
  }
};

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function formatResults(results, testName) {
  console.log(`\n${colors.bold}${colors.blue}=== ${testName} ===${colors.reset}`);
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  console.log(`${colors.green}✓ Passed: ${passed}${colors.reset}`);
  console.log(`${colors.red}✗ Failed: ${failed}${colors.reset}`);
  
  // Show failed tests
  const failedTests = results.filter(r => !r.passed);
  if (failedTests.length > 0) {
    console.log(`\n${colors.red}Failed Tests:${colors.reset}`);
    failedTests.forEach(test => {
      console.log(`  ${colors.red}✗${colors.reset} ${test.category}: ${test.test}`);
      if (test.error) {
        console.log(`    Error: ${test.error}`);
      }
      if (test.details) {
        console.log(`    Details: ${test.details}`);
      }
    });
  }
  
  return { passed, failed };
}

async function runTests() {
  const args = process.argv.slice(2);
  let adminEmail = DEFAULT_ADMIN_EMAIL;
  let clientEmail = DEFAULT_CLIENT_EMAIL;
  
  // Parse command line arguments
  args.forEach(arg => {
    if (arg.startsWith('--admin-email=')) {
      adminEmail = arg.split('=')[1];
    } else if (arg.startsWith('--client-email=')) {
      clientEmail = arg.split('=')[1];
    }
  });

  console.log(`${colors.bold}${colors.blue}Payflow Suite Migration Test Runner${colors.reset}`);
  console.log(`Admin Email: ${adminEmail}`);
  console.log(`Client Email: ${clientEmail}`);
  console.log(`Cross-Schema API: ${crossSchemaApiUrl || 'Using default'}`);
  
  let totalPassed = 0;
  let totalFailed = 0;

  try {
    // Note: Since we can't import ES modules in Node.js easily with the current setup,
    // we'll create a simple connectivity test instead
    
    console.log(`\n${colors.bold}${colors.blue}=== Database Connectivity Test ===${colors.reset}`);
    
    // Test database connection - check for admin user
    console.log(`  Querying for admin profile with email: ${adminEmail}`);
    const { data: adminProfiles, error: adminError, count } = await mockSchemaClient.app
      .profiles()  
      .select('id, full_name, email', { count: 'exact' })
      .eq('email', adminEmail);
      
    if (adminError) {
      console.log(`${colors.red}✗ Admin profile query error: ${adminError.message}${colors.reset}`);
      console.log(`  Error details: ${JSON.stringify(adminError, null, 2)}`);
      totalFailed++;
    } else if (!adminProfiles || adminProfiles.length === 0) {
      console.log(`${colors.red}✗ Admin profile not found for ${adminEmail}${colors.reset}`);
      console.log(`  Query returned count: ${count}, data: ${JSON.stringify(adminProfiles)}`);
      totalFailed++;
    } else {
      const adminProfile = adminProfiles[0]; // Take first match
      console.log(`${colors.green}✓ Admin profile found: ${adminProfile.full_name} (${adminProfile.email})${colors.reset}`);
      if (adminProfiles.length > 1) {
        console.log(`${colors.yellow}  Warning: Found ${adminProfiles.length} profiles with email ${adminEmail}${colors.reset}`);
      }
      totalPassed++;
    }

    // Test database connection - check for client user
    const { data: clientProfiles, error: clientError } = await mockSchemaClient.app
      .profiles()
      .select('id, full_name, email')  
      .eq('email', clientEmail);
      
    if (clientError) {
      console.log(`${colors.red}✗ Client profile query error: ${clientError.message}${colors.reset}`);
      totalFailed++;
    } else if (!clientProfiles || clientProfiles.length === 0) {
      console.log(`${colors.red}✗ Client profile not found for ${clientEmail}${colors.reset}`);
      totalFailed++;
    } else {
      const clientProfile = clientProfiles[0]; // Take first match
      console.log(`${colors.green}✓ Client profile found: ${clientProfile.full_name} (${clientProfile.email})${colors.reset}`);
      if (clientProfiles.length > 1) {
        console.log(`${colors.yellow}  Warning: Found ${clientProfiles.length} profiles with email ${clientEmail}${colors.reset}`);
      }
      totalPassed++;
    }

    // Test schema access by checking specific tables in each schema
    const schemaTests = [
      { schema: 'app', table: 'profiles', description: 'app.profiles table' },
      { schema: 'finance', table: 'invoices', description: 'finance.invoices table' },
      { schema: 'messaging', table: 'messages', description: 'messaging.messages table' },
      { schema: 'audit', table: 'audit_logs', description: 'audit.audit_logs table' }
    ];
    
    for (const test of schemaTests) {
      try {
        const { error } = await supabase.schema(test.schema).from(test.table).select('count').limit(1);
        if (!error) {
          console.log(`${colors.green}✓ ${test.description} accessible${colors.reset}`);
          totalPassed++;
        } else {
          console.log(`${colors.red}✗ ${test.description} not accessible: ${error.message}${colors.reset}`);
          totalFailed++;
        }
      } catch (err) {
        console.log(`${colors.red}✗ ${test.description} error: ${err.message}${colors.reset}`);
        totalFailed++;
      }
    }

    // Summary
    console.log(`\n${colors.bold}${colors.blue}=== Test Summary ===${colors.reset}`);
    console.log(`${colors.green}Total Passed: ${totalPassed}${colors.reset}`);
    console.log(`${colors.red}Total Failed: ${totalFailed}${colors.reset}`);
    
    if (totalFailed === 0) {
      console.log(`\n${colors.bold}${colors.green}🎉 All tests passed!${colors.reset}`);
      console.log(`\n${colors.yellow}For comprehensive testing, run the tests through the web interface:${colors.reset}`);
      console.log(`1. Start the dev server: ${colors.bold}bun run dev${colors.reset}`);
      console.log(`2. Login as admin: ${colors.bold}admin@example.com / password123${colors.reset}`);
      console.log(`3. Navigate to: ${colors.bold}http://localhost:5173/testing${colors.reset}`);
    } else {
      console.log(`\n${colors.bold}${colors.red}❌ Some tests failed. Check the errors above.${colors.reset}`);
      process.exit(1);
    }

  } catch (error) {
    console.error(`${colors.red}❌ Test execution failed: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Run tests
runTests().catch(console.error);