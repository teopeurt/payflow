import { schemaClient } from '../database/schema-client';
import { dbQueries } from '../database/queries';

export interface E2ETestResult {
  workflow: string;
  step: string;
  passed: boolean;
  error?: string;
  details?: string;
  duration?: number;
}

export class E2EWorkflowTest {
  private userId: string;
  private userRole: string;
  private organizationId?: string;

  constructor(userId: string, userRole: string, organizationId?: string) {
    this.userId = userId;
    this.userRole = userRole;
    this.organizationId = organizationId;
  }

  async runAllWorkflows(): Promise<E2ETestResult[]> {
    const results: E2ETestResult[] = [];

    // Test different workflows based on user role
    if (this.userRole === 'admin') {
      results.push(...await this.testAdminWorkflow());
    }
    
    if (this.userRole === 'client') {
      results.push(...await this.testClientWorkflow());
    }

    // Common workflows for all users
    results.push(...await this.testMessagingWorkflow());
    results.push(...await this.testCalendarWorkflow());
    results.push(...await this.testProfileWorkflow());

    return results;
  }

  private async testAdminWorkflow(): Promise<E2ETestResult[]> {
    const results: E2ETestResult[] = [];
    const workflowName = 'Admin Complete Workflow';

    try {
      // Step 1: Admin accesses dashboard
      const startTime = Date.now();
      
      const { data: dashboardData, error: dashError } = await Promise.all([
        schemaClient.app.projects().select('*').limit(5),
        schemaClient.finance.invoices().select('*').limit(5),
        schemaClient.finance.payments().select('*').limit(5)
      ]).then(([projects, invoices, payments]) => ({
        projects: projects.data,
        invoices: invoices.data,
        payments: payments.data
      })).catch(err => ({ error: err }));

      if (dashError) throw dashError;

      results.push({
        workflow: workflowName,
        step: 'Access admin dashboard data',
        passed: true,
        details: `Loaded projects: ${dashboardData.projects?.length}, invoices: ${dashboardData.invoices?.length}, payments: ${dashboardData.payments?.length}`,
        duration: Date.now() - startTime
      });

      // Step 2: Create new client (organization)
      const step2Start = Date.now();
      const { data: newOrg, error: orgError } = await schemaClient.app
        .organizations()
        .insert({
          name: `Test Client ${Date.now()}`,
          email: `test${Date.now()}@example.com`,
          phone: '555-0123',
          address: '123 Test St'
        })
        .select('*')
        .single();

      if (orgError) throw orgError;

      results.push({
        workflow: workflowName,
        step: 'Create new client',
        passed: true,
        details: `Created organization: ${newOrg.name}`,
        duration: Date.now() - step2Start
      });

      // Step 3: Create project for client
      const step3Start = Date.now();
      const { data: newProject, error: projError } = await schemaClient.app
        .projects()
        .insert({
          name: `Test Project ${Date.now()}`,
          description: 'E2E test project',
          organization_id: newOrg.id,
          status: 'active',
          start_date: new Date().toISOString(),
          created_by: this.userId
        })
        .select('*')
        .single();

      if (projError) throw projError;

      results.push({
        workflow: workflowName,
        step: 'Create project for client',
        passed: true,
        details: `Created project: ${newProject.name}`,
        duration: Date.now() - step3Start
      });

      // Step 4: Create invoice for project
      const step4Start = Date.now();
      const { data: newInvoice, error: invError } = await schemaClient.finance
        .invoices()
        .insert({
          organization_id: newOrg.id,
          project_id: newProject.id,
          invoice_number: `INV-TEST-${Date.now()}`,
          amount: 1000.00,
          status: 'draft',
          issue_date: new Date().toISOString(),
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })
        .select('*')
        .single();

      if (invError) throw invError;

      results.push({
        workflow: workflowName,
        step: 'Create invoice for project',
        passed: true,
        details: `Created invoice: ${newInvoice.invoice_number} for $${newInvoice.amount}`,
        duration: Date.now() - step4Start
      });

      // Step 5: Add invoice items
      const step5Start = Date.now();
      const { error: itemError } = await schemaClient.finance
        .invoice_items()
        .insert([
          {
            invoice_id: newInvoice.id,
            description: 'Test service 1',
            quantity: 1,
            unit_price: 500.00,
            amount: 500.00
          },
          {
            invoice_id: newInvoice.id,
            description: 'Test service 2',
            quantity: 1,
            unit_price: 500.00,
            amount: 500.00
          }
        ]);

      if (itemError) throw itemError;

      results.push({
        workflow: workflowName,
        step: 'Add invoice line items',
        passed: true,
        details: 'Added 2 line items to invoice',
        duration: Date.now() - step5Start
      });

      // Step 6: Update invoice status
      const step6Start = Date.now();
      const { error: updateError } = await schemaClient.finance
        .invoices()
        .update({ status: 'sent' })
        .eq('id', newInvoice.id);

      if (updateError) throw updateError;

      results.push({
        workflow: workflowName,
        step: 'Update invoice status to sent',
        passed: true,
        details: 'Invoice status updated to sent',
        duration: Date.now() - step6Start
      });

      // Cleanup - Delete test data
      await this.cleanupTestData(newInvoice.id, newProject.id, newOrg.id);

    } catch (error) {
      results.push({
        workflow: workflowName,
        step: 'Admin workflow execution',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    return results;
  }

  private async testClientWorkflow(): Promise<E2ETestResult[]> {
    const results: E2ETestResult[] = [];
    const workflowName = 'Client Complete Workflow';

    try {
      // Step 1: Client accesses dashboard
      const startTime = Date.now();
      
      const { data: clientProjects, error: projError } = await schemaClient.app
        .projects()
        .select('*')
        .eq('client_id', this.userId);

      if (projError) throw projError;

      results.push({
        workflow: workflowName,
        step: 'Access client dashboard',
        passed: true,
        details: `Found ${clientProjects?.length || 0} client projects`,
        duration: Date.now() - startTime
      });

      // Step 2: View invoices
      const step2Start = Date.now();
      const { data: clientInvoices, error: invError } = await schemaClient.finance
        .invoices()
        .select('*')
        .eq('client_id', this.userId);

      if (invError) throw invError;

      results.push({
        workflow: workflowName,
        step: 'View client invoices',
        passed: true,
        details: `Found ${clientInvoices?.length || 0} client invoices`,
        duration: Date.now() - step2Start
      });

      // Step 3: View payment history
      const step3Start = Date.now();
      const { data: clientPayments, error: payError } = await schemaClient.finance
        .payments()
        .select(`
          *,
          invoice:invoices!inner(client_id)
        `)
        .eq('invoice.client_id', this.userId);

      if (payError) throw payError;

      results.push({
        workflow: workflowName,
        step: 'View payment history',
        passed: true,
        details: `Found ${clientPayments?.length || 0} payments`,
        duration: Date.now() - step3Start
      });

      // Step 4: Access calendar events
      const step4Start = Date.now();
      const { data: calendarEvents, error: calError } = await schemaClient.app
        .calendar_events()
        .select('*')
        .gte('start_time', new Date().toISOString());

      if (calError) throw calError;

      results.push({
        workflow: workflowName,
        step: 'Access calendar events',
        passed: true,
        details: `Found ${calendarEvents?.length || 0} upcoming events`,
        duration: Date.now() - step4Start
      });

    } catch (error) {
      results.push({
        workflow: workflowName,
        step: 'Client workflow execution',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    return results;
  }

  private async testMessagingWorkflow(): Promise<E2ETestResult[]> {
    const results: E2ETestResult[] = [];
    const workflowName = 'Messaging Workflow';

    try {
      // Step 1: Create message thread
      const startTime = Date.now();
      const { data: newThread, error: threadError } = await schemaClient.messaging
        .message_threads()
        .insert({
          subject: `E2E Test Thread ${Date.now()}`,
          created_by: this.userId,
          status: 'active'
        })
        .select('*')
        .single();

      if (threadError) throw threadError;

      results.push({
        workflow: workflowName,
        step: 'Create message thread',
        passed: true,
        details: `Created thread: ${newThread.subject}`,
        duration: Date.now() - startTime
      });

      // Step 2: Send message
      const step2Start = Date.now();
      const { data: newMessage, error: msgError } = await schemaClient.messaging
        .messages()
        .insert({
          thread_id: newThread.id,
          sender_id: this.userId,
          content: 'This is a test message for E2E workflow validation',
          message_type: 'text'
        })
        .select('*')
        .single();

      if (msgError) throw msgError;

      results.push({
        workflow: workflowName,
        step: 'Send message',
        passed: true,
        details: 'Message sent successfully',
        duration: Date.now() - step2Start
      });

      // Step 3: Mark as read
      const step3Start = Date.now();
      const { error: readError } = await schemaClient.messaging
        .message_read_status()
        .upsert({
          thread_id: newThread.id,
          user_id: this.userId,
          read_at: new Date().toISOString()
        });

      if (readError) throw readError;

      results.push({
        workflow: workflowName,
        step: 'Mark message as read',
        passed: true,
        details: 'Message marked as read',
        duration: Date.now() - step3Start
      });

      // Cleanup
      await schemaClient.messaging.messages().delete().eq('id', newMessage.id);
      await schemaClient.messaging.message_threads().delete().eq('id', newThread.id);

    } catch (error) {
      results.push({
        workflow: workflowName,
        step: 'Messaging workflow execution',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    return results;
  }

  private async testCalendarWorkflow(): Promise<E2ETestResult[]> {
    const results: E2ETestResult[] = [];
    const workflowName = 'Calendar Workflow';

    try {
      // Step 1: Create calendar event
      const startTime = Date.now();
      const eventStart = new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow
      const eventEnd = new Date(eventStart.getTime() + 60 * 60 * 1000); // 1 hour later

      const { data: newEvent, error: eventError } = await schemaClient.app
        .calendar_events()
        .insert({
          title: `E2E Test Event ${Date.now()}`,
          description: 'Test event for E2E workflow',
          start_time: eventStart.toISOString(),
          end_time: eventEnd.toISOString(),
          event_type: 'meeting',
          status: 'scheduled',
          created_by: this.userId
        })
        .select('*')
        .single();

      if (eventError) throw eventError;

      results.push({
        workflow: workflowName,
        step: 'Create calendar event',
        passed: true,
        details: `Created event: ${newEvent.title}`,
        duration: Date.now() - startTime
      });

      // Step 2: Update event
      const step2Start = Date.now();
      const { error: updateError } = await schemaClient.app
        .calendar_events()
        .update({
          description: 'Updated description for E2E test',
          location: 'Virtual Meeting'
        })
        .eq('id', newEvent.id);

      if (updateError) throw updateError;

      results.push({
        workflow: workflowName,
        step: 'Update calendar event',
        passed: true,
        details: 'Event updated successfully',
        duration: Date.now() - step2Start
      });

      // Cleanup
      await schemaClient.app.calendar_events().delete().eq('id', newEvent.id);

    } catch (error) {
      results.push({
        workflow: workflowName,
        step: 'Calendar workflow execution',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    return results;
  }

  private async testProfileWorkflow(): Promise<E2ETestResult[]> {
    const results: E2ETestResult[] = [];
    const workflowName = 'Profile Management Workflow';

    try {
      // Step 1: Get current profile
      const startTime = Date.now();
      const { data: profile, error: profileError } = await schemaClient.app
        .profiles()
        .select('*')
        .eq('id', this.userId)
        .single();

      if (profileError) throw profileError;

      results.push({
        workflow: workflowName,
        step: 'Access user profile',
        passed: true,
        details: `Profile loaded for: ${profile.full_name}`,
        duration: Date.now() - startTime
      });

      // Step 2: Update profile (safe fields only)
      const step2Start = Date.now();
      const originalBio = profile.bio;
      const { error: updateError } = await schemaClient.app
        .profiles()
        .update({
          bio: `Updated via E2E test at ${new Date().toISOString()}`
        })
        .eq('id', this.userId);

      if (updateError) throw updateError;

      results.push({
        workflow: workflowName,
        step: 'Update profile information',
        passed: true,
        details: 'Profile updated successfully',
        duration: Date.now() - step2Start
      });

      // Restore original bio
      await schemaClient.app
        .profiles()
        .update({ bio: originalBio })
        .eq('id', this.userId);

    } catch (error) {
      results.push({
        workflow: workflowName,
        step: 'Profile workflow execution',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    return results;
  }

  private async cleanupTestData(invoiceId: string, projectId: string, organizationId: string) {
    try {
      // Delete in correct order to respect foreign key constraints
      await schemaClient.finance.invoice_items().delete().eq('invoice_id', invoiceId);
      await schemaClient.finance.invoices().delete().eq('id', invoiceId);
      await schemaClient.app.projects().delete().eq('id', projectId);
      await schemaClient.app.organizations().delete().eq('id', organizationId);
    } catch (error) {
      console.error('Error cleaning up test data:', error);
    }
  }
}

export const testE2EWorkflows = async (
  userId: string, 
  userRole: string, 
  organizationId?: string
): Promise<E2ETestResult[]> => {
  const tester = new E2EWorkflowTest(userId, userRole, organizationId);
  return await tester.runAllWorkflows();
};