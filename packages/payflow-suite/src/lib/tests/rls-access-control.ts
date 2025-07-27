import { schemaClient } from '../database/schema-client';
import { dbQueries } from '../database/queries';

export interface RLSTestResult {
  category: string;
  test: string;
  passed: boolean;
  error?: string;
  details?: string;
}

export class RLSAccessControlTest {
  private userId: string;
  private userRole: string;
  private organizationId?: string;

  constructor(userId: string, userRole: string, organizationId?: string) {
    this.userId = userId;
    this.userRole = userRole;
    this.organizationId = organizationId;
  }

  async runAllTests(): Promise<RLSTestResult[]> {
    const results: RLSTestResult[] = [];

    // Test categories
    results.push(...await this.testProjectAccess());
    results.push(...await this.testInvoiceAccess());
    results.push(...await this.testPaymentAccess());
    results.push(...await this.testMessageAccess());
    results.push(...await this.testCalendarAccess());
    results.push(...await this.testOrganizationAccess());
    results.push(...await this.testProfileAccess());

    return results;
  }

  private async testProjectAccess(): Promise<RLSTestResult[]> {
    const results: RLSTestResult[] = [];

    try {
      // Test: Can access projects
      const { data: projects, error } = await schemaClient.app
        .projects()
        .select('*');

      if (error) throw error;

      results.push({
        category: 'Projects',
        test: 'Can read projects',
        passed: true,
        details: `Found ${projects?.length || 0} projects`
      });

      // Test: Client role restriction
      if (this.userRole === 'client') {
        const hasOwnProjects = projects?.every(project => project.client_id === this.userId);
        results.push({
          category: 'Projects',
          test: 'Client sees only own projects',
          passed: hasOwnProjects || projects?.length === 0,
          details: `Client filtering: ${hasOwnProjects ? 'PASS' : 'FAIL'}`
        });
      }

      // Test: Organization filtering
      if (this.organizationId) {
        const correctOrg = projects?.every(project => project.organization_id === this.organizationId);
        results.push({
          category: 'Projects',
          test: 'Organization-based filtering',
          passed: correctOrg || projects?.length === 0,
          details: `Organization filtering: ${correctOrg ? 'PASS' : 'FAIL'}`
        });
      }

    } catch (error) {
      results.push({
        category: 'Projects',
        test: 'Project access test',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    return results;
  }

  private async testInvoiceAccess(): Promise<RLSTestResult[]> {
    const results: RLSTestResult[] = [];

    try {
      // Test: Can access invoices
      const { data: invoices, error } = await schemaClient.finance
        .invoices()
        .select('*');

      if (error) throw error;

      results.push({
        category: 'Invoices',
        test: 'Can read invoices',
        passed: true,
        details: `Found ${invoices?.length || 0} invoices`
      });

      // Test: Client role restriction
      if (this.userRole === 'client') {
        const hasOwnInvoices = invoices?.every(invoice => invoice.client_id === this.userId);
        results.push({
          category: 'Invoices',
          test: 'Client sees only own invoices',
          passed: hasOwnInvoices || invoices?.length === 0,
          details: `Client filtering: ${hasOwnInvoices ? 'PASS' : 'FAIL'}`
        });
      }

    } catch (error) {
      results.push({
        category: 'Invoices',
        test: 'Invoice access test',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    return results;
  }

  private async testPaymentAccess(): Promise<RLSTestResult[]> {
    const results: RLSTestResult[] = [];

    try {
      // Test: Can access payments
      const { data: payments, error } = await schemaClient.finance
        .payments()
        .select(`
          *,
          invoice:invoices(client_id)
        `);

      if (error) throw error;

      results.push({
        category: 'Payments',
        test: 'Can read payments',
        passed: true,
        details: `Found ${payments?.length || 0} payments`
      });

      // Test: Client role restriction (payments should be filtered by invoice client_id)
      if (this.userRole === 'client') {
        const hasOwnPayments = payments?.every(payment => 
          payment.invoice?.client_id === this.userId
        );
        results.push({
          category: 'Payments',
          test: 'Client sees only own payments',
          passed: hasOwnPayments || payments?.length === 0,
          details: `Client filtering: ${hasOwnPayments ? 'PASS' : 'FAIL'}`
        });
      }

    } catch (error) {
      results.push({
        category: 'Payments',
        test: 'Payment access test',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    return results;
  }

  private async testMessageAccess(): Promise<RLSTestResult[]> {
    const results: RLSTestResult[] = [];

    try {
      // Test: Can access message threads
      const { data: threads, error } = await schemaClient.messaging
        .message_threads()
        .select('*');

      if (error) throw error;

      results.push({
        category: 'Messages',
        test: 'Can read message threads',
        passed: true,
        details: `Found ${threads?.length || 0} message threads`
      });

      // Test: Can access messages
      const { data: messages, error: msgError } = await schemaClient.messaging
        .messages()
        .select('*')
        .limit(10);

      if (msgError) throw msgError;

      results.push({
        category: 'Messages',
        test: 'Can read messages',
        passed: true,
        details: `Found ${messages?.length || 0} messages`
      });

    } catch (error) {
      results.push({
        category: 'Messages',
        test: 'Message access test',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    return results;
  }

  private async testCalendarAccess(): Promise<RLSTestResult[]> {
    const results: RLSTestResult[] = [];

    try {
      // Test: Can access calendar events
      const { data: events, error } = await schemaClient.app
        .calendar_events()
        .select('*');

      if (error) throw error;

      results.push({
        category: 'Calendar',
        test: 'Can read calendar events',
        passed: true,
        details: `Found ${events?.length || 0} calendar events`
      });

    } catch (error) {
      results.push({
        category: 'Calendar',
        test: 'Calendar access test',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    return results;
  }

  private async testOrganizationAccess(): Promise<RLSTestResult[]> {
    const results: RLSTestResult[] = [];

    try {
      // Test: Can access organizations
      const { data: orgs, error } = await schemaClient.app
        .organizations()
        .select('*');

      if (error) throw error;

      results.push({
        category: 'Organization',
        test: 'Can read organizations',
        passed: true,
        details: `Found ${orgs?.length || 0} organizations`
      });

      // Test: Can access organization members
      const { data: members, error: memberError } = await schemaClient.app
        .organization_members()
        .select('*');

      if (memberError) throw memberError;

      results.push({
        category: 'Organization',
        test: 'Can read organization members',
        passed: true,
        details: `Found ${members?.length || 0} organization members`
      });

    } catch (error) {
      results.push({
        category: 'Organization',
        test: 'Organization access test',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    return results;
  }

  private async testProfileAccess(): Promise<RLSTestResult[]> {
    const results: RLSTestResult[] = [];

    try {
      // Test: Can access own profile
      const { data: profile, error } = await schemaClient.app
        .profiles()
        .select('*')
        .eq('id', this.userId)
        .single();

      if (error) throw error;

      results.push({
        category: 'Profile',
        test: 'Can read own profile',
        passed: !!profile,
        details: `Profile access: ${profile ? 'SUCCESS' : 'FAIL'}`
      });

      // Test: Role verification
      if (profile) {
        const roleMatch = profile.role === this.userRole;
        results.push({
          category: 'Profile',
          test: 'Role verification',
          passed: roleMatch,
          details: `Expected: ${this.userRole}, Got: ${profile.role}`
        });
      }

    } catch (error) {
      results.push({
        category: 'Profile',
        test: 'Profile access test',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    return results;
  }
}

export const testRLSAccessControl = async (
  userId: string, 
  userRole: string, 
  organizationId?: string
): Promise<RLSTestResult[]> => {
  const tester = new RLSAccessControlTest(userId, userRole, organizationId);
  return await tester.runAllTests();
};