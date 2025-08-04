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

// Use service role key for seeding
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function seedTestData() {
  console.log('🌱 Seeding Test Data for Cross-Schema API');

  try {
    // Get existing users and organizations
    const { data: adminUser } = await supabase
      .schema('app')
      .from('profiles')
      .select('id')
      .eq('email', 'admin@example.com')
      .single();

    const { data: clientUser } = await supabase
      .schema('app')
      .from('profiles')
      .select('id')
      .eq('email', 'client@example.com')
      .single();

    const { data: organizations } = await supabase
      .schema('app')
      .from('organizations')
      .select('id')
      .limit(2);

    if (!adminUser || !clientUser || !organizations || organizations.length < 2) {
      console.error('❌ Required seed data not found. Run seed-users.js first.');
      return;
    }

    const org1 = organizations[0];
    const org2 = organizations[1];

    // Create projects
    console.log('📁 Creating projects...');
    const { data: project1, error: project1Error } = await supabase
      .schema('app')
      .from('projects')
      .insert({
        name: 'Website Redesign',
        description: 'Complete redesign of company website',
        organization_id: org1.id,
        client_id: clientUser.id,
        created_by: adminUser.id,
        status: 'active',
        budget: 25000,
        start_date: '2025-01-01',
        end_date: '2025-03-31'
      })
      .select()
      .single();

    if (project1Error) {
      console.error('❌ Error creating project1:', project1Error);
      return;
    }

    const { data: project2, error: project2Error } = await supabase
      .schema('app')
      .from('projects')
      .insert({
        name: 'Mobile App Development',
        description: 'iOS and Android app development',
        organization_id: org1.id,
        client_id: clientUser.id,
        created_by: adminUser.id,
        status: 'active',
        budget: 50000,
        start_date: '2025-02-01',
        end_date: '2025-06-30'
      })
      .select()
      .single();

    if (project2Error) {
      console.error('❌ Error creating project2:', project2Error);
      return;
    }

    console.log('✅ Created 2 projects');

    // Create invoices
    console.log('💰 Creating invoices...');
    const { data: invoice1, error: invoice1Error } = await supabase
      .schema('finance')
      .from('invoices')
      .insert({
        invoice_number: 'INV-2025-001',
        organization_id: org1.id,
        project_id: project1.id,
        client_id: clientUser.id,
        created_by: adminUser.id,
        issue_date: '2025-01-15',
        due_date: '2025-02-15',
        subtotal: 4500,
        tax_rate: 10,
        tax_amount: 500,
        total_amount: 5000,
        status: 'sent',
        notes: 'Initial design phase'
      })
      .select()
      .single();

    if (invoice1Error) {
      console.error('❌ Error creating invoice1:', invoice1Error);
      return;
    }

    const { data: invoice2, error: invoice2Error } = await supabase
      .schema('finance')
      .from('invoices')
      .insert({
        invoice_number: 'INV-2025-002',
        organization_id: org1.id,
        project_id: project2.id,
        client_id: clientUser.id,
        created_by: adminUser.id,
        issue_date: '2025-02-01',
        due_date: '2025-03-01',
        subtotal: 9500,
        tax_rate: 10,
        tax_amount: 1000,
        total_amount: 10500,
        status: 'paid',
        notes: 'Mobile app milestone 1'
      })
      .select()
      .single();

    if (invoice2Error) {
      console.error('❌ Error creating invoice2:', invoice2Error);
      return;
    }

    console.log('✅ Created 2 invoices');

    // Create invoice items
    console.log('📝 Creating invoice items...');
    await supabase
      .schema('finance')
      .from('invoice_items')
      .insert([
        {
          invoice_id: invoice1.id,
          description: 'UI/UX Design',
          quantity: 40,
          unit_price: 100,
          total_price: 4000
        },
        {
          invoice_id: invoice1.id,
          description: 'Design Consultation',
          quantity: 10,
          unit_price: 100,
          total_price: 1000
        },
        {
          invoice_id: invoice2.id,
          description: 'App Architecture Setup',
          quantity: 1,
          unit_price: 5000,
          total_price: 5000
        },
        {
          invoice_id: invoice2.id,
          description: 'Initial Development',
          quantity: 50,
          unit_price: 100,
          total_price: 5000
        }
      ]);

    console.log('✅ Created 4 invoice items');

    // Create payments
    console.log('💳 Creating payments...');
    await supabase
      .schema('finance')
      .from('payments')
      .insert([
        {
          invoice_id: invoice2.id,
          amount: 10500, // Including tax
          payment_method: 'bank_transfer',
          status: 'completed',
          transaction_id: 'TXN-2025-001',
          processed_at: '2025-02-28',
          notes: 'Payment for mobile app milestone 1'
        }
      ]);

    console.log('✅ Created 1 payment');

    // Create some invoices for org2 to test filtering
    console.log('🏢 Creating data for second organization...');
    const { data: invoice3, error: invoice3Error } = await supabase
      .schema('finance')
      .from('invoices')
      .insert({
        invoice_number: 'INV-2025-003',
        organization_id: org2.id,
        client_id: clientUser.id,
        created_by: adminUser.id,
        issue_date: '2025-02-15',
        due_date: '2025-03-15',
        subtotal: 6750,
        tax_rate: 10,
        tax_amount: 750,
        total_amount: 7500,
        status: 'draft',
        notes: 'Consulting services'
      })
      .select()
      .single();

    if (invoice3Error) {
      console.error('❌ Error creating invoice3:', invoice3Error);
    }

    console.log('✅ Created invoice for second organization');

    console.log('\n🎉 Test data seeding complete!');
    console.log('\n📊 Summary:');
    console.log('- 2 Projects (Website Redesign, Mobile App)');
    console.log('- 3 Invoices (1 sent, 1 paid, 1 draft)');
    console.log('- 4 Invoice items');
    console.log('- 1 Payment');
    console.log('- Data spans 2 organizations for testing filtering');

  } catch (error) {
    console.error('❌ Error seeding data:', error);
  }
}

seedTestData().catch(console.error);