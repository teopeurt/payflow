# Recurring Invoice Implementation Context

## Codebase Analysis Results

### Current Invoice Structure
- **Types**: Defined in `packages/payflow-suite/src/types/invoice.ts`
  - Already includes `RecurringType` and recurring fields
  - Supports three end conditions: indefinitely, on_date, count
- **Form Schema**: Defined in `components/invoices/EditInvoice/schema.ts`
  - Includes recurring fields in the Zod schema
  - Validation rules already set up
- **UI Components**: 
  - `InvoiceRecurringSection` referenced in `InvoiceForm.tsx` but needs completion
  - No dedicated recurring invoice management pages yet
- **Database**: 
  - Supabase with existing `invoices` table
  - No dedicated recurring invoice tables yet
- **Backend**: 
  - Go service in `packages/go-serverless/`
  - No recurring invoice logic implemented yet

### Tech Stack
- **Frontend**: React with TypeScript
- **UI Library**: shadcn/ui components
- **State Management**: React Hook Form, TanStack Query
- **API Client**: Supabase JS client
- **Database**: PostgreSQL via Supabase
- **Backend**: Go service
- **Infrastructure**: SST (AWS CDK)
- **Deployment**: Cloud Run (for Go services)

## Architecture Decisions

### Database Design
- Use separate `recurring_invoice_templates` table instead of flags in `invoices`
- Store template data as JSONB for flexibility
- Track generation history in separate table
- Add reference from generated invoices back to template

### Generation Strategy
- Daily cron job to check for templates due for generation
- Calculate next generation date based on frequency
- Support for manual generation via API
- Handle end conditions (indefinite, date-based, count-based)

### UI/UX Approach
- Add recurring toggle to invoice creation form
- Dedicated section for recurring settings when toggle is on
- Separate dashboard for managing recurring templates
- Visual indicators for invoices generated from templates

## Implementation Challenges

### Data Synchronization
- Ensuring template changes don't affect already generated invoices
- Handling template deactivation mid-cycle

### Date Calculation
- Handling edge cases like month-end dates (e.g., Jan 31 → Feb 28)
- Time zone considerations for global organizations

### Performance
- Efficient batch processing for organizations with many templates
- Optimizing database queries for template retrieval

### Error Handling
- Graceful recovery from failed generations
- Notification system for generation failures

## Testing Strategy
- Unit tests for Go service business logic
- Integration tests for database operations
- End-to-end tests for complete generation flow
- Manual testing for UI components

## Future Enhancements
- Email notifications for generated invoices
- More complex scheduling options (e.g., "first Monday of month")
- Bulk operations on templates
- Analytics for recurring revenue