import { createClient } from '@supabase/supabase-js';

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
  },
  db: {
    schema: 'app'
  }
});

const demoUsers = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'admin@example.com',
    password: 'password123',
    full_name: 'Admin User',
    role: 'admin'
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    email: 'team@example.com',
    password: 'password123',
    full_name: 'Team Member',
    role: 'team_member'
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    email: 'client@example.com',
    password: 'password123',
    full_name: 'Client User',
    role: 'client',
    company_name: 'Acme Corporation'
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    email: 'developer@example.com',
    password: 'password123',
    full_name: 'John Developer',
    role: 'team_member'
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    email: 'designer@example.com',
    password: 'password123',
    full_name: 'Jane Designer',
    role: 'team_member'
  },
  {
    id: '66666666-6666-6666-6666-666666666666',
    email: 'clientcorp@example.com',
    password: 'password123',
    full_name: 'Corporate Client',
    role: 'client',
    company_name: 'Big Corp Inc'
  },
  {
    id: '77777777-7777-7777-7777-777777777777',
    email: 'startup@example.com',
    password: 'password123',
    full_name: 'Startup Founder',
    role: 'client',
    company_name: 'Startup ABC'
  }
];

async function createDemoUsers() {
  console.log('Creating demo users...');
  
  for (const user of demoUsers) {
    try {
      console.log(`Creating user: ${user.email}`);
      
      // Create user in auth with specific ID
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        user_id: user.id, // Use predefined UUID
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
          console.log(`User ${user.email} already exists, skipping...`);
          continue;
        }
        console.error(`Full auth error for ${user.email}:`, JSON.stringify(authError, null, 2));
        continue;
      }

      console.log(`Auth user created: ${authData.user.id}`);

      // Wait a moment for the trigger to complete
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check if profile was created by trigger
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (existingProfile) {
        console.log(`Profile already exists for ${user.email}, updating...`);
        
        // Update profile with additional data
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            full_name: user.full_name,
            role: user.role,
            company_name: user.company_name || null
          })
          .eq('id', authData.user.id);

        if (profileError) {
          console.error(`Error updating profile for ${user.email}:`, profileError);
        } else {
          console.log(`✓ Successfully updated profile for: ${user.email}`);
        }
      } else {
        console.log(`Creating profile for ${user.email}...`);
        
        // Create profile manually if trigger didn't work
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            email: user.email,
            full_name: user.full_name,
            role: user.role,
            company_name: user.company_name || null
          });

        if (profileError) {
          console.error(`Error creating profile for ${user.email}:`, profileError);
        } else {
          console.log(`✓ Successfully created profile for: ${user.email}`);
        }
      }
      
    } catch (error) {
      console.error(`Error creating user ${user.email}:`, error.message || error);
    }
  }
  
  console.log('\n=== Demo Users Creation Completed ===');
  console.log('You can now log in with any of these accounts:');
  demoUsers.forEach(user => {
    console.log(`  ${user.email} (${user.role}) - password: password123`);
  });
  console.log('\nNext steps:');
  console.log('1. Run the seed.sql file to populate sample data');
  console.log('2. Start your application and test with different user roles');
}

createDemoUsers();