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
  }
});

const demoUsers = [
  {
    email: 'admin@example.com',
    password: 'password123',
    full_name: 'Admin User',
    role: 'admin'
  },
  {
    email: 'team@example.com',
    password: 'password123',
    full_name: 'Team Member',
    role: 'team_member'
  },
  {
    email: 'client@example.com',
    password: 'password123',
    full_name: 'Client User',
    role: 'client',
    company_name: 'Acme Corporation'
  }
];

async function createDemoUsers() {
  console.log('Creating demo users...');
  
  for (const user of demoUsers) {
    try {
      console.log(`Creating user: ${user.email}`);
      
      // Create user in auth
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
        if (authError.message.includes('already registered')) {
          console.log(`User ${user.email} already exists, skipping...`);
          continue;
        }
        console.error(`Full auth error for ${user.email}:`, JSON.stringify(authError, null, 2));
        continue;
      }

      console.log(`Auth user created: ${authData.user.id}`);

      // Wait a moment for the trigger to complete
      await new Promise(resolve => setTimeout(resolve, 1000));

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
        console.log(`✓ Successfully created user: ${user.email}`);
      }
      
    } catch (error) {
      console.error(`Error creating user ${user.email}:`, error.message || error);
    }
  }
  
  console.log('Demo users creation completed!');
}

createDemoUsers();