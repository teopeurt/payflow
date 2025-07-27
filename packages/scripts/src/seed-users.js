import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

// Create admin client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Generate consistent UUIDs for demo data
const ORG_IDS = {
  ACME_DESIGN_STUDIO: uuidv4(),
  ACME_CORPORATION: uuidv4(),
  BIG_CORP_INC: uuidv4(),
  STARTUP_ABC: uuidv4()
};

// Demo Organizations Configuration
const demoOrganizations = [
  {
    id: ORG_IDS.ACME_DESIGN_STUDIO,
    name: 'Acme Design Studio',
    company_name: 'Acme Design Studio',
    company_email: 'hello@acmedesign.com',
    company_phone: '+1 (555) 123-4567',
    company_address: '123 Design Street, Creative City, CC 12345',
    company_website: 'https://acmedesign.com',
    default_currency: 'USD',
    default_payment_terms: 30
  },
  {
    id: ORG_IDS.ACME_CORPORATION,
    name: 'Acme Corporation',
    company_name: 'Acme Corporation',
    company_email: 'info@acmecorp.com',
    company_phone: '+1 (555) 234-5678',
    company_address: '456 Business Ave, Commerce City, CC 12346',
    company_website: 'https://acmecorp.com',
    default_currency: 'USD',
    default_payment_terms: 45
  },
  {
    id: ORG_IDS.BIG_CORP_INC,
    name: 'Big Corp Inc',
    company_name: 'Big Corp Inc',
    company_email: 'contact@bigcorp.com',
    company_phone: '+1 (555) 345-6789',
    company_address: '789 Enterprise Blvd, Corporate City, CC 12347',
    company_website: 'https://bigcorp.com',
    default_currency: 'USD',
    default_payment_terms: 60
  },
  {
    id: ORG_IDS.STARTUP_ABC,
    name: 'Startup ABC',
    company_name: 'Startup ABC',
    company_email: 'team@startupabc.com',
    company_phone: '+1 (555) 456-7890',
    company_address: '321 Innovation St, Startup City, CC 12348',
    company_website: 'https://startupabc.com',
    default_currency: 'USD',
    default_payment_terms: 15
  }
];

// Demo Users Configuration
const demoUsers = [
  {
    id: uuidv4(),
    email: 'admin@example.com',
    password: 'password123',
    full_name: 'Admin User',
    role: 'admin',
    organization_id: ORG_IDS.ACME_DESIGN_STUDIO, // Acme Design Studio
    is_primary: true
  },
  {
    id: uuidv4(),
    email: 'team@example.com',
    password: 'password123',
    full_name: 'Team Member',
    role: 'team_member',
    organization_id: ORG_IDS.ACME_DESIGN_STUDIO, // Acme Design Studio
    is_primary: true
  },
  {
    id: uuidv4(),
    email: 'developer@example.com',
    password: 'password123',
    full_name: 'John Developer',
    role: 'team_member',
    organization_id: ORG_IDS.ACME_DESIGN_STUDIO, // Acme Design Studio
    is_primary: true
  },
  {
    id: uuidv4(),
    email: 'designer@example.com',
    password: 'password123',
    full_name: 'Jane Designer',
    role: 'team_member',
    organization_id: ORG_IDS.ACME_DESIGN_STUDIO, // Acme Design Studio
    is_primary: true
  },
  {
    id: uuidv4(),
    email: 'client@example.com',
    password: 'password123',
    full_name: 'Client User',
    role: 'client',
    organization_id: ORG_IDS.ACME_CORPORATION, // Acme Corporation
    is_primary: true
  },
  {
    id: uuidv4(),
    email: 'clientcorp@example.com',
    password: 'password123',
    full_name: 'Corporate Client',
    role: 'client',
    organization_id: ORG_IDS.BIG_CORP_INC, // Big Corp Inc
    is_primary: true
  },
  {
    id: uuidv4(),
    email: 'startup@example.com',
    password: 'password123',
    full_name: 'Startup Founder',
    role: 'client',
    organization_id: ORG_IDS.STARTUP_ABC, // Startup ABC
    is_primary: true
  }
];

async function cleanupExistingDemoData() {
  console.log('🧹 Cleaning up existing demo data...');
  
  try {
    const demoEmails = demoUsers.map(user => user.email);
    const demoOrgIds = demoOrganizations.map(org => org.id);
    
    // Get existing profiles to find user IDs
    const { data: existingProfiles } = await supabase
      .schema('app')
      .from('profiles')
      .select('id, email')
      .in('email', demoEmails);
    
    const existingUserIds = existingProfiles?.map(p => p.id) || [];
    
    if (existingUserIds.length > 0) {
      // Delete in order due to foreign key constraints
      console.log('  - Removing organization memberships...');
      await supabase
        .schema('app')
        .from('organization_members')
        .delete()
        .in('user_id', existingUserIds);
      
      console.log('  - Removing user profiles...');
      await supabase
        .schema('app')
        .from('profiles')
        .delete()
        .in('id', existingUserIds);
      
      console.log('  - Removing auth users...');
      for (const userId of existingUserIds) {
        try {
          await supabase.auth.admin.deleteUser(userId);
        } catch (error) {
          // User might not exist, continue
          console.log(`    - User ${userId} not found in auth, skipping...`);
        }
      }
    }
    
    console.log('  - Removing demo organizations...');
    await supabase
      .schema('app')
      .from('organizations')
      .delete()
      .in('id', demoOrgIds);
    
    console.log('✅ Cleanup completed');
  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
    throw error;
  }
}

async function createDemoOrganizations() {
  console.log('🏢 Creating demo organizations...');
  
  for (const org of demoOrganizations) {
    try {
      console.log(`  - Creating organization: ${org.name}`);
      
      // Check if organization already exists
      const { data: existingOrg } = await supabase
        .schema('app')
        .from('organizations')
        .select('id')
        .eq('id', org.id)
        .single();
      
      if (existingOrg) {
        console.log(`    - Organization ${org.name} already exists, updating...`);
        
        const { error: updateError } = await supabase
          .schema('app')
          .from('organizations')
          .update({
            name: org.name,
            company_name: org.company_name,
            company_email: org.company_email,
            company_phone: org.company_phone,
            company_address: org.company_address,
            company_website: org.company_website,
            default_currency: org.default_currency,
            default_payment_terms: org.default_payment_terms
          })
          .eq('id', org.id);
        
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .schema('app')
          .from('organizations')
          .insert({
            id: org.id,
            name: org.name,
            company_name: org.company_name,
            company_email: org.company_email,
            company_phone: org.company_phone,
            company_address: org.company_address,
            company_website: org.company_website,
            default_currency: org.default_currency,
            default_payment_terms: org.default_payment_terms
          });
        
        if (insertError) throw insertError;
      }
      
      console.log(`    ✅ Organization ${org.name} created/updated successfully`);
      
    } catch (error) {
      console.error(`❌ Error creating organization ${org.name}:`, error.message);
      throw error;
    }
  }
}

async function createDemoUsers() {
  console.log('👥 Creating demo users...');
  
  for (const user of demoUsers) {
    try {
      console.log(`  - Creating user: ${user.email}`);
      
      // Get organization details for company_name
      const organization = demoOrganizations.find(org => org.id === user.organization_id);
      
      // Create user in auth with specific ID
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          full_name: user.full_name,
          role: user.role
        }
      });

      if (authError) {
        if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
          console.log(`    - User ${user.email} already exists in auth, skipping auth creation...`);
        } else {
          console.error(`    - Auth error for ${user.email}:`, authError.message);
          continue;
        }
      } else {
        console.log(`    - Auth user created: ${authData.user.id}`);
      }

      // Get the actual user ID (either from creation or existing user)
      let actualUserId = user.id;
      if (authData?.user?.id) {
        actualUserId = authData.user.id;
      } else {
        // If we skipped auth creation, get existing user ID
        const { data: existingUser } = await supabase.auth.admin.listUsers();
        const foundUser = existingUser.users.find(u => u.email === user.email);
        if (foundUser) {
          actualUserId = foundUser.id;
        }
      }

      // Wait for trigger to complete
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check if profile exists and update/create
      const { data: existingProfile } = await supabase
        .schema('app')
        .from('profiles')
        .select('*')
        .eq('id', actualUserId)
        .single();

      if (existingProfile) {
        console.log(`    - Profile exists for ${user.email}, updating...`);
        
        const { error: profileError } = await supabase
          .schema('app')
          .from('profiles')
          .update({
            full_name: user.full_name,
            role: user.role,
            organization_id: user.organization_id,
            company_name: organization?.company_name || null
          })
          .eq('id', actualUserId);

        if (profileError) throw profileError;
      } else {
        console.log(`    - Creating profile for ${user.email}...`);
        
        const { error: profileError } = await supabase
          .schema('app')
          .from('profiles')
          .insert({
            id: actualUserId,
            email: user.email,
            full_name: user.full_name,
            role: user.role,
            organization_id: user.organization_id,
            company_name: organization?.company_name || null
          });

        if (profileError) throw profileError;
      }

      // Create or update organization membership
      const { data: existingMembership } = await supabase
        .schema('app')
        .from('organization_members')
        .select('*')
        .eq('user_id', actualUserId)
        .eq('organization_id', user.organization_id)
        .single();

      if (existingMembership) {
        console.log(`    - Organization membership exists for ${user.email}, updating...`);
        
        const { error: memberError } = await supabase
          .schema('app')
          .from('organization_members')
          .update({
            role: user.role,
            is_primary: user.is_primary
          })
          .eq('user_id', actualUserId)
          .eq('organization_id', user.organization_id);

        if (memberError) throw memberError;
      } else {
        console.log(`    - Creating organization membership for ${user.email}...`);
        
        const { error: memberError } = await supabase
          .schema('app')
          .from('organization_members')
          .insert({
            user_id: actualUserId,
            organization_id: user.organization_id,
            role: user.role,
            is_primary: user.is_primary
          });

        if (memberError) throw memberError;
      }
      
      console.log(`    ✅ User ${user.email} created successfully`);
      
    } catch (error) {
      console.error(`❌ Error creating user ${user.email}:`, error.message);
      throw error;
    }
  }
}

async function verifySetup() {
  console.log('🔍 Verifying demo setup...');
  
  try {
    // Check organizations
    const { data: orgs, error: orgError } = await supabase
      .schema('app')
      .from('organizations')
      .select('id, name')
      .in('id', demoOrganizations.map(org => org.id));
    
    if (orgError) throw orgError;
    
    console.log(`  ✅ Organizations created: ${orgs.length}/${demoOrganizations.length}`);
    orgs.forEach(org => console.log(`    - ${org.name}`));
    
    // Check users and their organization associations  
    const { data: profiles, error: profileError } = await supabase
      .schema('app')
      .from('profiles')
      .select(`
        id, 
        email, 
        full_name, 
        role, 
        organization_id,
        company_name
      `)
      .in('email', demoUsers.map(user => user.email));
    
    if (profileError) throw profileError;
    
    console.log(`  ✅ User profiles created: ${profiles.length}/${demoUsers.length}`);
    
    // Check organization memberships
    const profileIds = profiles.map(p => p.id);
    const { data: memberships, error: memberError } = await supabase
      .schema('app')
      .from('organization_members')
      .select(`
        user_id,
        organization_id,
        role,
        is_primary
      `)
      .in('user_id', profileIds);
    
    if (memberError) throw memberError;
    
    console.log(`  ✅ Organization memberships created: ${memberships.length}/${demoUsers.length}`);
    
    // Detailed verification
    let allValid = true;
    for (const user of demoUsers) {
      const profile = profiles.find(p => p.email === user.email);
      const membership = memberships.find(m => m.user_id === profile?.id);
      
      if (!profile) {
        console.log(`    ❌ Missing profile for ${user.email}`);
        allValid = false;
        continue;
      }
      
      if (!membership) {
        console.log(`    ❌ Missing membership for ${user.email}`);
        allValid = false;
        continue;
      }
      
      if (profile.organization_id !== user.organization_id) {
        console.log(`    ❌ Wrong organization_id for ${user.email}: expected ${user.organization_id}, got ${profile.organization_id}`);
        allValid = false;
        continue;
      }
      
      if (!profile.organization_id) {
        console.log(`    ❌ NULL organization_id for ${user.email}`);
        allValid = false;
        continue;
      }
      
      console.log(`    ✅ ${user.email} - Organization: ${profile.company_name}, Role: ${profile.role}`);
    }
    
    if (allValid) {
      console.log('🎉 All demo users have proper organization associations!');
    } else {
      throw new Error('Some users have invalid organization associations');
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    throw error;
  }
}

async function main() {
  try {
    console.log('🚀 Starting demo data setup...\n');
    
    // Optional cleanup (uncomment if you want to start fresh)
    await cleanupExistingDemoData();
    console.log('');
    
    await createDemoOrganizations();
    console.log('');
    
    await createDemoUsers();
    console.log('');
    
    await verifySetup();
    console.log('');
    
    console.log('✅ Demo data setup completed successfully!\n');
    console.log('=== Demo Login Credentials ===');
    
    // Group users by organization for better display
    const orgGroups = {};
    demoUsers.forEach(user => {
      const org = demoOrganizations.find(o => o.id === user.organization_id);
      if (!orgGroups[org.name]) {
        orgGroups[org.name] = [];
      }
      orgGroups[org.name].push(user);
    });
    
    Object.entries(orgGroups).forEach(([orgName, users]) => {
      console.log(`\n${orgName}:`);
      users.forEach(user => {
        console.log(`  ${user.email} (${user.role}) - password: password123`);
      });
    });
    
    console.log('\n🎯 Next Steps:');
    console.log('1. All users now have proper organization associations');
    console.log('2. Start your application and test with different user roles');
    console.log('3. Verify organization-scoped data access works correctly');
    
  } catch (error) {
    console.error('\n💥 Setup failed:', error.message);
    process.exit(1);
  }
}

main();