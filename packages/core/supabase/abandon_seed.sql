-- Seed data for invoice-clm application
-- This script creates demo users, organizations, and sample data

-- First, create some organizations
INSERT INTO app.organizations (id, name, company_name, company_email, company_phone, company_address, default_currency, default_payment_terms) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Tech Solutions Inc', 'Tech Solutions Inc', 'contact@techsolutions.com', '+1-555-0101', '123 Tech Street, San Francisco, CA 94105', 'USD', 30),
('550e8400-e29b-41d4-a716-446655440002', 'Creative Agency', 'Creative Agency LLC', 'hello@creativeagency.com', '+1-555-0102', '456 Design Ave, New York, NY 10001', 'USD', 15),
('550e8400-e29b-41d4-a716-446655440003', 'Consulting Firm', 'Consulting Firm Ltd', 'info@consultingfirm.com', '+1-555-0103', '789 Business Blvd, Austin, TX 73301', 'USD', 45)
ON CONFLICT (id) DO NOTHING;

-- Create demo user profiles (these will be linked to auth users created via the Node.js script)
-- Admin user
INSERT INTO app.profiles (id, email, full_name, role, organization_id, company_name, created_at, updated_at) VALUES
('11111111-1111-1111-1111-111111111111', 'admin@example.com', 'Admin User', 'admin', '550e8400-e29b-41d4-a716-446655440001', 'Tech Solutions Inc', now(), now())
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  organization_id = EXCLUDED.organization_id,
  company_name = EXCLUDED.company_name;

-- Team member
INSERT INTO app.profiles (id, email, full_name, role, organization_id, company_name, created_at, updated_at) VALUES
('22222222-2222-2222-2222-222222222222', 'team@example.com', 'Team Member', 'team_member', '550e8400-e29b-41d4-a716-446655440001', 'Tech Solutions Inc', now(), now())
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  organization_id = EXCLUDED.organization_id,
  company_name = EXCLUDED.company_name;

-- Client user
INSERT INTO app.profiles (id, email, full_name, role, organization_id, company_name, created_at, updated_at) VALUES
('33333333-3333-3333-3333-333333333333', 'client@example.com', 'Client User', 'client', '550e8400-e29b-41d4-a716-446655440002', 'Acme Corporation', now(), now())
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  organization_id = EXCLUDED.organization_id,
  company_name = EXCLUDED.company_name;

-- Additional team members and clients for demo purposes
INSERT INTO app.profiles (id, email, full_name, role, organization_id, company_name, created_at, updated_at) VALUES
('44444444-4444-4444-4444-444444444444', 'developer@example.com', 'John Developer', 'team_member', '550e8400-e29b-41d4-a716-446655440001', 'Tech Solutions Inc', now(), now()),
('55555555-5555-5555-5555-555555555555', 'designer@example.com', 'Jane Designer', 'team_member', '550e8400-e29b-41d4-a716-446655440002', 'Creative Agency', now(), now()),
('66666666-6666-6666-6666-666666666666', 'clientcorp@example.com', 'Corporate Client', 'client', '550e8400-e29b-41d4-a716-446655440003', 'Big Corp Inc', now(), now()),
('77777777-7777-7777-7777-777777777777', 'startup@example.com', 'Startup Founder', 'client', null, 'Startup ABC', now(), now())
ON CONFLICT (id) DO NOTHING;

-- Create organization memberships
INSERT INTO app.organization_members (user_id, organization_id, role, is_primary, created_at) VALUES
('11111111-1111-1111-1111-111111111111', '550e8400-e29b-41d4-a716-446655440001', 'admin', true, now()),
('22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440001', 'member', false, now()),
('44444444-4444-4444-4444-444444444444', '550e8400-e29b-41d4-a716-446655440001', 'member', false, now()),
('55555555-5555-5555-5555-555555555555', '550e8400-e29b-41d4-a716-446655440002', 'admin', true, now()),
('33333333-3333-3333-3333-333333333333', '550e8400-e29b-41d4-a716-446655440002', 'member', false, now())
ON CONFLICT (user_id, organization_id) DO NOTHING;

-- Create user roles
INSERT INTO app.user_roles (user_id, role, created_at) VALUES
('11111111-1111-1111-1111-111111111111', 'admin', now()),
('22222222-2222-2222-2222-222222222222', 'team_member', now()),
('33333333-3333-3333-3333-333333333333', 'client', now()),
('44444444-4444-4444-4444-444444444444', 'team_member', now()),
('55555555-5555-5555-5555-555555555555', 'team_member', now()),
('66666666-6666-6666-6666-666666666666', 'client', now()),
('77777777-7777-7777-7777-777777777777', 'client', now())
ON CONFLICT (user_id, role) DO NOTHING;

-- Create some sample projects
INSERT INTO app.projects (id, name, description, status, priority, client_id, created_by, organization_id, budget, start_date, end_date, created_at, updated_at) VALUES
('a0000001-0000-0000-0000-000000000001', 'E-commerce Website Redesign', 'Complete redesign of the client''s e-commerce platform with modern UI/UX', 'active', 'high', '33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', '550e8400-e29b-41d4-a716-446655440001', 75000.00, '2025-01-15', '2025-04-15', now(), now()),
('a0000002-0000-0000-0000-000000000002', 'Mobile App Development', 'Native iOS and Android app for inventory management', 'active', 'medium', '66666666-6666-6666-6666-666666666666', '55555555-5555-5555-5555-555555555555', '550e8400-e29b-41d4-a716-446655440002', 125000.00, '2025-02-01', '2025-08-01', now(), now()),
('a0000003-0000-0000-0000-000000000003', 'Brand Identity Package', 'Complete brand identity design including logo, guidelines, and marketing materials', 'completed', 'medium', '77777777-7777-7777-7777-777777777777', '55555555-5555-5555-5555-555555555555', '550e8400-e29b-41d4-a716-446655440002', 15000.00, '2024-11-01', '2024-12-31', now(), now()),
('a0000004-0000-0000-0000-000000000004', 'Data Migration Consulting', 'Help migrate legacy system data to new cloud infrastructure', 'draft', 'low', '66666666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111', '550e8400-e29b-41d4-a716-446655440001', 45000.00, '2025-03-01', '2025-05-31', now(), now())
ON CONFLICT (id) DO NOTHING;

-- Create project team assignments
INSERT INTO app.project_team (project_id, user_id, role, joined_at) VALUES
('a0000001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'lead', now()),
('a0000001-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'developer', now()),
('a0000001-0000-0000-0000-000000000001', '44444444-4444-4444-4444-444444444444', 'developer', now()),
('a0000002-0000-0000-0000-000000000002', '55555555-5555-5555-5555-555555555555', 'lead', now()),
('a0000003-0000-0000-0000-000000000003', '55555555-5555-5555-5555-555555555555', 'designer', now()),
('a0000004-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'consultant', now())
ON CONFLICT (project_id, user_id) DO NOTHING;

-- Create some sample tasks
INSERT INTO app.tasks (id, project_id, title, description, status, priority, created_by, due_date, estimated_hours, created_at, updated_at) VALUES
('b0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', 'Setup development environment', 'Configure local development environment and CI/CD pipeline', 'completed', 'high', '11111111-1111-1111-1111-111111111111', '2025-01-20', 8.0, now(), now()),
('b0000002-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000001', 'Design database schema', 'Create optimized database schema for e-commerce platform', 'completed', 'high', '22222222-2222-2222-2222-222222222222', '2025-01-25', 16.0, now(), now()),
('b0000003-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000001', 'Implement user authentication', 'Build secure user authentication system with JWT', 'in_progress', 'high', '44444444-4444-4444-4444-444444444444', '2025-02-10', 24.0, now(), now()),
('b0000004-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000001', 'Create product catalog UI', 'Design and implement product browsing interface', 'todo', 'medium', '22222222-2222-2222-2222-222222222222', '2025-02-20', 32.0, now(), now()),
('b0000005-0000-0000-0000-000000000005', 'a0000002-0000-0000-0000-000000000002', 'Mobile app wireframes', 'Create detailed wireframes for iOS and Android apps', 'in_progress', 'high', '55555555-5555-5555-5555-555555555555', '2025-02-15', 20.0, now(), now())
ON CONFLICT (id) DO NOTHING;

-- Create task assignments
INSERT INTO app.task_assignments (task_id, user_id, assigned_by, assigned_at) VALUES
('b0000001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', now()),
('b0000002-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', now()),
('b0000003-0000-0000-0000-000000000003', '44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', now()),
('b0000004-0000-0000-0000-000000000004', '22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', now()),
('b0000005-0000-0000-0000-000000000005', '55555555-5555-5555-5555-555555555555', '55555555-5555-5555-5555-555555555555', now())
ON CONFLICT (task_id, user_id) DO NOTHING;

-- Create some sample estimates
INSERT INTO finance.estimates (id, reference_number, organization_id, project_id, amount, issue_date, expiry_date, status, notes, terms, company_name, company_email, created_at, updated_at) VALUES
('c0000001-0000-4000-8000-000000000001', 'EST-2025-001', '550e8400-e29b-41d4-a716-446655440001', 'a0000001-0000-0000-0000-000000000001', 75000.00, '2025-01-10', '2025-02-10', 'approved', 'Complete e-commerce redesign with modern features', 'Payment terms: 50% upfront, 50% on completion', 'Tech Solutions Inc', 'contact@techsolutions.com', now(), now()),
('c0000002-0000-4000-8000-000000000002', 'EST-2025-002', '550e8400-e29b-41d4-a716-446655440002', 'a0000002-0000-0000-0000-000000000002', 125000.00, '2025-01-28', '2025-02-28', 'pending', 'Native mobile app development for iOS and Android', 'Payment terms: 30% upfront, 40% at milestone, 30% on completion', 'Creative Agency LLC', 'hello@creativeagency.com', now(), now()),
('c0000003-0000-4000-8000-000000000003', 'EST-2024-015', '550e8400-e29b-41d4-a716-446655440002', 'a0000003-0000-0000-0000-000000000003', 15000.00, '2024-10-25', '2024-11-25', 'approved', 'Complete brand identity package', 'Payment terms: 50% upfront, 50% on completion', 'Creative Agency LLC', 'hello@creativeagency.com', now(), now())
ON CONFLICT (id) DO NOTHING;

-- Create estimate items
INSERT INTO finance.estimate_items (estimate_id, description, quantity, unit_price, amount, unit_type, billable, created_at, updated_at) VALUES
('c0000001-0000-4000-8000-000000000001', 'UI/UX Design and Prototyping', 80.0, 150.00, 12000.00, 'hours', true, now(), now()),
('c0000001-0000-4000-8000-000000000001', 'Frontend Development', 200.0, 125.00, 25000.00, 'hours', true, now(), now()),
('c0000001-0000-4000-8000-000000000001', 'Backend Development', 150.0, 140.00, 21000.00, 'hours', true, now(), now()),
('c0000001-0000-4000-8000-000000000001', 'Database Design and Setup', 40.0, 160.00, 6400.00, 'hours', true, now(), now()),
('c0000001-0000-4000-8000-000000000001', 'Testing and Quality Assurance', 60.0, 100.00, 6000.00, 'hours', true, now(), now()),
('c0000001-0000-4000-8000-000000000001', 'Project Management', 30.0, 150.00, 4500.00, 'hours', true, now(), now()),
('c0000002-0000-4000-8000-000000000002', 'Mobile App Design', 120.0, 140.00, 16800.00, 'hours', true, now(), now()),
('c0000002-0000-4000-8000-000000000002', 'iOS Development', 300.0, 160.00, 48000.00, 'hours', true, now(), now()),
('c0000002-0000-4000-8000-000000000002', 'Android Development', 280.0, 160.00, 44800.00, 'hours', true, now(), now()),
('c0000002-0000-4000-8000-000000000002', 'Backend API Development', 100.0, 150.00, 15000.00, 'hours', true, now(), now()),
('c0000003-0000-4000-8000-000000000003', 'Logo Design and Branding', 1.0, 8000.00, 8000.00, 'fixed', true, now(), now()),
('c0000003-0000-4000-8000-000000000003', 'Brand Guidelines Document', 1.0, 3000.00, 3000.00, 'fixed', true, now(), now()),
('c0000003-0000-4000-8000-000000000003', 'Marketing Material Templates', 1.0, 4000.00, 4000.00, 'fixed', true, now(), now())
ON CONFLICT DO NOTHING;

-- Create some sample invoices
INSERT INTO finance.invoices (id, invoice_number, project_id, client_id, status, issue_date, due_date, subtotal, tax_rate, tax_amount, total_amount, notes, terms, created_by, organization_id, estimate_id, created_at, updated_at) VALUES
('d0000001-0000-4000-8000-000000000001', 'INV-2025-001', 'a0000001-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', 'sent', '2025-01-15', '2025-02-14', 37500.00, 8.5, 3187.50, 40687.50, 'First milestone payment for e-commerce redesign', 'Payment due within 30 days', '11111111-1111-1111-1111-111111111111', '550e8400-e29b-41d4-a716-446655440001', 'c0000001-0000-4000-8000-000000000001', now(), now()),
('d0000002-0000-4000-8000-000000000002', 'INV-2024-028', 'a0000003-0000-0000-0000-000000000003', '77777777-7777-7777-7777-777777777777', 'paid', '2024-12-01', '2024-12-31', 15000.00, 8.5, 1275.00, 16275.00, 'Brand identity package - Final payment', 'Payment due within 30 days', '55555555-5555-5555-5555-555555555555', '550e8400-e29b-41d4-a716-446655440002', 'c0000003-0000-4000-8000-000000000003', now(), now()),
('d0000003-0000-4000-8000-000000000003', 'INV-2025-002', 'a0000002-0000-0000-0000-000000000002', '66666666-6666-6666-6666-666666666666', 'draft', '2025-02-01', '2025-03-03', 37500.00, 8.5, 3187.50, 40687.50, 'Mobile app development - Initial payment', 'Payment due within 30 days', '55555555-5555-5555-5555-555555555555', '550e8400-e29b-41d4-a716-446655440002', 'c0000002-0000-4000-8000-000000000002', now(), now())
ON CONFLICT (id) DO NOTHING;

-- Create invoice items
INSERT INTO finance.invoice_items (invoice_id, description, quantity, unit_price, total_price, tax_rate, created_at) VALUES
('d0000001-0000-4000-8000-000000000001', 'UI/UX Design Phase - Milestone 1', 80.0, 150.00, 12000.00, 8.5, now()),
('d0000001-0000-4000-8000-000000000001', 'Frontend Development - Initial Setup', 100.0, 125.00, 12500.00, 8.5, now()),
('d0000001-0000-4000-8000-000000000001', 'Backend API Foundation', 75.0, 140.00, 10500.00, 8.5, now()),
('d0000001-0000-4000-8000-000000000001', 'Project Management - Phase 1', 15.0, 150.00, 2250.00, 8.5, now()),
('d0000002-0000-4000-8000-000000000002', 'Complete Brand Identity Package', 1.0, 15000.00, 15000.00, 8.5, now()),
('d0000003-0000-4000-8000-000000000003', 'Mobile App Design Phase', 120.0, 140.00, 16800.00, 8.5, now()),
('d0000003-0000-4000-8000-000000000003', 'iOS Development - Initial Sprint', 130.0, 160.00, 20800.00, 8.5, now())
ON CONFLICT DO NOTHING;

-- Create some sample payments
INSERT INTO finance.payments (invoice_id, payment_method, amount, transaction_id, status, processed_at, notes, created_at) VALUES
('d0000002-0000-4000-8000-000000000002', 'stripe', 16275.00, 'txn_1234567890', 'completed', '2024-12-15 10:30:00', 'Payment processed successfully via Stripe', now())
ON CONFLICT DO NOTHING;

-- Create some sample message threads
INSERT INTO messaging.message_threads (id, project_id, subject, created_by, created_at, updated_at) VALUES
('e0000001-0000-4000-8000-000000000001', 'a0000001-0000-0000-0000-000000000001', 'Project Kickoff Discussion', '11111111-1111-1111-1111-111111111111', now(), now()),
('e0000002-0000-4000-8000-000000000002', 'a0000001-0000-0000-0000-000000000001', 'Design Feedback and Revisions', '33333333-3333-3333-3333-333333333333', now(), now()),
('e0000003-0000-4000-8000-000000000003', 'a0000002-0000-0000-0000-000000000002', 'Mobile App Requirements', '55555555-5555-5555-5555-555555555555', now(), now())
ON CONFLICT (id) DO NOTHING;

-- Create some sample messages
INSERT INTO messaging.messages (thread_id, sender_id, content, message_type, created_at) VALUES
('e0000001-0000-4000-8000-000000000001', '11111111-1111-1111-1111-111111111111', 'Welcome to the project! Let''s start with the initial requirements gathering.', 'text', now() - interval '2 days'),
('e0000001-0000-4000-8000-000000000001', '33333333-3333-3333-3333-333333333333', 'Thanks for getting this started. I''ve attached the current site mockups for reference.', 'text', now() - interval '2 days' + interval '30 minutes'),
('e0000001-0000-4000-8000-000000000001', '22222222-2222-2222-2222-222222222222', 'I''ve reviewed the technical requirements. We should be able to implement everything as specified.', 'text', now() - interval '1 day'),
('e0000002-0000-4000-8000-000000000002', '33333333-3333-3333-3333-333333333333', 'The initial designs look great! Just a few minor adjustments needed on the checkout flow.', 'text', now() - interval '6 hours'),
('e0000002-0000-4000-8000-000000000002', '11111111-1111-1111-1111-111111111111', 'Thanks for the feedback! We''ll incorporate those changes in the next iteration.', 'text', now() - interval '3 hours'),
('e0000003-0000-4000-8000-000000000003', '55555555-5555-5555-5555-555555555555', 'Mobile app wireframes are ready for review. Please check the shared folder.', 'text', now() - interval '4 hours'),
('e0000003-0000-4000-8000-000000000003', '66666666-6666-6666-6666-666666666666', 'Wireframes look excellent! Let''s proceed with the development phase.', 'text', now() - interval '1 hour')
ON CONFLICT DO NOTHING;

-- Create some calendar events
INSERT INTO app.calendar_events (id, title, description, project_id, start_time, end_time, event_type, status, created_by, created_at, updated_at) VALUES
('f0000001-0000-4000-8000-000000000001', 'Project Kickoff Meeting', 'Initial project discussion and requirement gathering', 'a0000001-0000-0000-0000-000000000001', now() + interval '2 days', now() + interval '2 days' + interval '2 hours', 'meeting', 'scheduled', '11111111-1111-1111-1111-111111111111', now(), now()),
('f0000002-0000-4000-8000-000000000002', 'Design Review Session', 'Review and approve initial design mockups', 'a0000001-0000-0000-0000-000000000001', now() + interval '1 week', now() + interval '1 week' + interval '1 hour', 'meeting', 'scheduled', '11111111-1111-1111-1111-111111111111', now(), now()),
('f0000003-0000-4000-8000-000000000003', 'Sprint Planning', 'Plan development sprints for mobile app', 'a0000002-0000-0000-0000-000000000002', now() + interval '3 days', now() + interval '3 days' + interval '1.5 hours', 'meeting', 'scheduled', '55555555-5555-5555-5555-555555555555', now(), now()),
('f0000004-0000-4000-8000-000000000004', 'Final Delivery', 'Project completion and handover', 'a0000001-0000-0000-0000-000000000001', '2025-04-15 14:00:00', '2025-04-15 16:00:00', 'milestone', 'scheduled', '11111111-1111-1111-1111-111111111111', now(), now())
ON CONFLICT (id) DO NOTHING;

-- Create event attendees
INSERT INTO app.event_attendees (event_id, user_id, response, created_at) VALUES
('f0000001-0000-4000-8000-000000000001', '11111111-1111-1111-1111-111111111111', 'accepted', now()),
('f0000001-0000-4000-8000-000000000001', '33333333-3333-3333-3333-333333333333', 'accepted', now()),
('f0000001-0000-4000-8000-000000000001', '22222222-2222-2222-2222-222222222222', 'pending', now()),
('f0000002-0000-4000-8000-000000000002', '11111111-1111-1111-1111-111111111111', 'accepted', now()),
('f0000002-0000-4000-8000-000000000002', '33333333-3333-3333-3333-333333333333', 'pending', now()),
('f0000003-0000-4000-8000-000000000003', '55555555-5555-5555-5555-555555555555', 'accepted', now()),
('f0000003-0000-4000-8000-000000000003', '66666666-6666-6666-6666-666666666666', 'accepted', now()),
('f0000004-0000-4000-8000-000000000004', '11111111-1111-1111-1111-111111111111', 'pending', now()),
('f0000004-0000-4000-8000-000000000004', '33333333-3333-3333-3333-333333333333', 'pending', now())
ON CONFLICT (event_id, user_id) DO NOTHING;

-- Create some milestones
INSERT INTO app.milestones (id, project_id, name, description, due_date, status, created_at, updated_at) VALUES
('90000001-0000-4000-8000-000000000001', 'a0000001-0000-0000-0000-000000000001', 'Design Phase Complete', 'All UI/UX designs approved and finalized', '2025-02-15', 'in_progress', now(), now()),
('90000002-0000-4000-8000-000000000002', 'a0000001-0000-0000-0000-000000000001', 'Backend Development Complete', 'All API endpoints and database setup completed', '2025-03-15', 'pending', now(), now()),
('90000003-0000-4000-8000-000000000003', 'a0000001-0000-0000-0000-000000000001', 'Testing and Launch', 'Complete testing and production deployment', '2025-04-10', 'pending', now(), now()),
('90000004-0000-4000-8000-000000000004', 'a0000002-0000-0000-0000-000000000002', 'App Store Submission', 'Submit apps to iOS App Store and Google Play', '2025-07-15', 'pending', now(), now())
ON CONFLICT (id) DO NOTHING;

-- Create some deliverables
INSERT INTO app.deliverables (milestone_id, name, description, due_date, status, created_at, updated_at) VALUES
('90000001-0000-4000-8000-000000000001', 'Wireframes and Mockups', 'Complete wireframes and high-fidelity mockups for all pages', '2025-02-05', 'completed', now(), now()),
('90000001-0000-4000-8000-000000000001', 'Design System Documentation', 'Comprehensive design system with components and guidelines', '2025-02-10', 'in_progress', now(), now()),
('milestone-001-0000-0000-000000000001', 'Responsive Design Specifications', 'Mobile and tablet responsive design specifications', '2025-02-15', 'pending', now(), now()),
('90000002-0000-4000-8000-000000000002', 'API Documentation', 'Complete REST API documentation with examples', '2025-03-01', 'pending', now(), now()),
('90000002-0000-4000-8000-000000000002', 'Database Schema', 'Optimized database schema with indexes and relationships', '2025-03-10', 'pending', now(), now()),
('90000004-0000-4000-8000-000000000004', 'iOS App Binary', 'Compiled iOS app ready for App Store submission', '2025-07-10', 'pending', now(), now()),
('90000004-0000-4000-8000-000000000004', 'Android App Bundle', 'Android app bundle ready for Google Play submission', '2025-07-12', 'pending', now(), now())
ON CONFLICT DO NOTHING;

-- Create some recurring invoice templates (for demonstration)
INSERT INTO finance.recurring_invoice_templates (id, organization_id, client_id, template_name, invoice_data, frequency, start_date, until_type, next_generation_date, created_by, created_at, updated_at) VALUES
('a1000001-0000-4000-8000-000000000001', '550e8400-e29b-41d4-a716-446655440001', '33333333-3333-3333-3333-333333333333', 'Monthly Maintenance Fee', 
 '{"notes": "Monthly maintenance and support", "terms": "Payment due within 15 days", "items": [{"description": "Monthly maintenance and support", "quantity": 1, "unit_price": 2500.00, "amount": 2500.00}]}', 
 'monthly', '2025-02-01', 'indefinitely', '2025-02-01', '11111111-1111-1111-1111-111111111111', now(), now())
ON CONFLICT (id) DO NOTHING;

-- Log successful completion
DO $$
BEGIN
  RAISE NOTICE 'Seed data has been successfully inserted!';
  RAISE NOTICE 'Demo users created:';
  RAISE NOTICE '  - admin@example.com (Admin)';
  RAISE NOTICE '  - team@example.com (Team Member)';
  RAISE NOTICE '  - client@example.com (Client)';
  RAISE NOTICE '  - developer@example.com (Developer)';
  RAISE NOTICE '  - designer@example.com (Designer)';
  RAISE NOTICE '  - clientcorp@example.com (Corporate Client)';
  RAISE NOTICE '  - startup@example.com (Startup Client)';
  RAISE NOTICE '';
  RAISE NOTICE 'Sample data includes:';
  RAISE NOTICE '  - 3 Organizations';
  RAISE NOTICE '  - 4 Projects (different statuses)';
  RAISE NOTICE '  - 5 Tasks with assignments';
  RAISE NOTICE '  - 3 Estimates with items';
  RAISE NOTICE '  - 3 Invoices (draft, sent, paid)';
  RAISE NOTICE '  - Message threads and conversations';
  RAISE NOTICE '  - Calendar events and milestones';
  RAISE NOTICE '  - 1 Recurring invoice template';
  RAISE NOTICE '';
  RAISE NOTICE 'Run the Node.js script to create the auth users!';
END
$$;