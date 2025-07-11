# Recurring Invoice Implementation Checklist

## Phase 1: Database (Priority: High)
- [ ] Create migration file for recurring_invoice_templates table
- [ ] Create migration file for recurring_invoice_history table
- [ ] Add recurring_template_id column to invoices table
- [ ] Add indexes for performance optimization
- [ ] Update Supabase types and client
- [ ] Test migrations locally

## Phase 2: Backend (Priority: High)
- [ ] Create Go models for recurring invoice templates
- [ ] Implement repository layer for template CRUD operations
- [ ] Implement service layer for invoice generation logic
- [ ] Create API handlers for template management
- [ ] Implement cron job handler for automatic generation
- [ ] Add frequency calculation functions
- [ ] Add end condition handling logic
- [ ] Implement invoice number generation for recurring invoices
- [ ] Add error handling and logging
- [ ] Write unit tests for core business logic

## Phase 3: Frontend (Priority: Medium)
- [ ] Complete InvoiceRecurringSection component
  - [ ] Add frequency selector
  - [ ] Add start date picker
  - [ ] Add end condition options
  - [ ] Add validation
- [ ] Create RecurringInvoiceList component
  - [ ] Display template status
  - [ ] Add toggle for active/inactive
  - [ ] Show next generation date
  - [ ] Add manual generation button
- [ ] Create RecurringInvoiceForm component
  - [ ] Template creation from existing invoice
  - [ ] Template editing
- [ ] Add recurring invoice dashboard page
- [ ] Update navigation to include recurring invoices
- [ ] Add recurring badge to invoices generated from templates

## Phase 4: Deployment (Priority: Medium)
- [ ] Configure SST for recurring invoice cron job
- [ ] Set up Cloud Run service
- [ ] Create Dockerfile for Go service
- [ ] Configure environment variables
- [ ] Set up monitoring and alerts

## Phase 5: Testing (Priority: High)
- [ ] Test template creation flow
- [ ] Test manual invoice generation
- [ ] Test automatic invoice generation
- [ ] Test end condition handling
- [ ] Test edge cases (e.g., template deactivation)
- [ ] Verify email notifications
- [ ] Load testing for large organizations

## Phase 6: Documentation (Priority: Low)
- [ ] Update user documentation
- [ ] Create admin guide for managing recurring invoices
- [ ] Document API endpoints
- [ ] Add code comments for complex logic