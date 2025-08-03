import { schemaClient } from '../database/schema-client';
import { dbQueries } from '../database/queries';

export interface AdminTestResult {
  category: string;
  test: string;
  passed: boolean;
  error?: string;
  details?: string;
}

export class AdminAccessTest {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  async runAllTests(): Promise<AdminTestResult[]> {
    const results: AdminTestResult[] = [];

    // Verify admin role first
    results.push(...await this.testAdminRole());
    
    // Test admin access to all major features
    results.push(...await this.testClientManagement());
    results.push(...await this.testProjectManagement());
    results.push(...await this.testInvoiceManagement());
    results.push(...await this.testPaymentManagement());
    results.push(...await this.testOrganizationManagement());
    results.push(...await this.testUserManagement());
    results.push(...await this.testReportingAccess());

    return results;
  }

  private async testAdminRole(): Promise<AdminTestResult[]> {
    const results: AdminTestResult[] = [];

    try {
      const role = await dbQueries.getUserRole(this.userId);
      
      results.push({
        category: 'Authorization',
        test: 'User has admin role',
        passed: role === 'admin',
        details: `Current role: ${role}`
      });

      // Test admin permissions
      const hasPermission = await dbQueries.hasPermission(this.userId, '*', '*');
      results.push({
        category: 'Authorization',
        test: 'Admin has full permissions',
        passed: hasPermission,
        details: `Full permissions: ${hasPermission ? 'GRANTED' : 'DENIED'}`
      });

    } catch (error) {
      results.push({
        category: 'Authorization',
        test: 'Admin role verification',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    return results;
  }

  private async testClientManagement(): Promise<AdminTestResult[]> {
    const results: AdminTestResult[] = [];

    try {
      // Test: Can view all clients (organizations)
      const { data: clients, error } = await schemaClient.app
        .organizations()
        .select('*');

      if (error) throw error;

      results.push({
        category: 'Client Management',
        test: 'Can view all clients',
        passed: true,
        details: `Found ${clients?.length || 0} clients`
      });

      // Test: Can create clients (check permissions)
      const canCreate = await dbQueries.hasPermission(this.userId, 'organizations', 'create');
      results.push({
        category: 'Client Management',
        test: 'Can create clients',
        passed: canCreate,
        details: `Create permission: ${canCreate ? 'GRANTED' : 'DENIED'}`
      });

      // Test: Can update clients
      const canUpdate = await dbQueries.hasPermission(this.userId, 'organizations', 'update');
      results.push({
        category: 'Client Management',
        test: 'Can update clients',
        passed: canUpdate,
        details: `Update permission: ${canUpdate ? 'GRANTED' : 'DENIED'}`
      });

    } catch (error) {
      results.push({
        category: 'Client Management',
        test: 'Client management access',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    return results;
  }

  private async testProjectManagement(): Promise<AdminTestResult[]> {
    const results: AdminTestResult[] = [];

    try {
      // Test: Can view all projects
      const { data: projects, error } = await schemaClient.app
        .projects()
        .select('*');

      if (error) throw error;

      results.push({
        category: 'Project Management',
        test: 'Can view all projects',
        passed: true,
        details: `Found ${projects?.length || 0} projects`
      });

      // Test: Can access project details with full data
      if (projects && projects.length > 0) {
        // Use cross-schema API for project with organization details
        const { data: projectDetails, error: detailError } = await schemaClient.app
          .projects()
          .select('*')
          .eq('id', projects[0].id)
          .single();

        if (detailError) throw detailError;

        results.push({
          category: 'Project Management',
          test: 'Can access detailed project data',
          passed: !!projectDetails,
          details: `Project details access: ${projectDetails ? 'SUCCESS' : 'FAIL'}`
        });
      }

    } catch (error) {
      results.push({
        category: 'Project Management',
        test: 'Project management access',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    return results;
  }

  private async testInvoiceManagement(): Promise<AdminTestResult[]> {
    const results: AdminTestResult[] = [];

    try {
      // Test: Can view all invoices
      const { data: invoices, error } = await schemaClient.finance
        .invoices()
        .select('*');

      if (error) throw error;

      results.push({
        category: 'Invoice Management',
        test: 'Can view all invoices',
        passed: true,
        details: `Found ${invoices?.length || 0} invoices`
      });

      // Test: Can access invoice items
      const { data: invoiceItems, error: itemsError } = await schemaClient.finance
        .invoice_items()
        .select('*')
        .limit(10);

      if (itemsError) throw itemsError;

      results.push({
        category: 'Invoice Management',
        test: 'Can access invoice items',
        passed: true,
        details: `Found ${invoiceItems?.length || 0} invoice items`
      });

    } catch (error) {
      results.push({
        category: 'Invoice Management',
        test: 'Invoice management access',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    return results;
  }

  private async testPaymentManagement(): Promise<AdminTestResult[]> {
    const results: AdminTestResult[] = [];

    try {
      // Test: Can view all payments
      const { data: payments, error } = await schemaClient.finance
        .payments()
        .select('*');

      if (error) throw error;

      results.push({
        category: 'Payment Management',
        test: 'Can view all payments',
        passed: true,
        details: `Found ${payments?.length || 0} payments`
      });

      // Test: Can access payment history
      const { data: paymentHistory, error: historyError } = await schemaClient.finance
        .payments()
        .select(`
          *,
          invoices(invoice_number, client_id)
        `)
        .limit(10);

      if (historyError) throw historyError;

      results.push({
        category: 'Payment Management',
        test: 'Can access payment history',
        passed: true,
        details: `Payment history access: SUCCESS`
      });

    } catch (error) {
      results.push({
        category: 'Payment Management',
        test: 'Payment management access',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    return results;
  }

  private async testOrganizationManagement(): Promise<AdminTestResult[]> {
    const results: AdminTestResult[] = [];

    try {
      // Test: Can view organization members
      const { data: members, error } = await schemaClient.app
        .organization_members()
        .select('*');

      if (error) throw error;

      results.push({
        category: 'Organization Management',
        test: 'Can view organization members',
        passed: true,
        details: `Found ${members?.length || 0} organization members`
      });

      // Test: Can manage organization settings
      const { data: orgSettings, error: settingsError } = await schemaClient.app
        .organizations()
        .select('*')
        .limit(1);

      if (settingsError) throw settingsError;

      results.push({
        category: 'Organization Management',
        test: 'Can access organization settings',
        passed: true,
        details: `Organization settings access: SUCCESS`
      });

    } catch (error) {
      results.push({
        category: 'Organization Management',
        test: 'Organization management access',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    return results;
  }

  private async testUserManagement(): Promise<AdminTestResult[]> {
    const results: AdminTestResult[] = [];

    try {
      // Test: Can view all user profiles
      const { data: profiles, error } = await schemaClient.app
        .profiles()
        .select('*');

      if (error) throw error;

      results.push({
        category: 'User Management',
        test: 'Can view all user profiles',
        passed: true,
        details: `Found ${profiles?.length || 0} user profiles`
      });

      // Test: Can access user roles and permissions
      const rolesData = profiles?.map(profile => ({
        id: profile.id,
        role: profile.role,
        email: profile.email
      }));

      results.push({
        category: 'User Management',
        test: 'Can access user roles',
        passed: true,
        details: `User roles accessed: ${rolesData?.length || 0} users`
      });

    } catch (error) {
      results.push({
        category: 'User Management',
        test: 'User management access',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    return results;
  }

  private async testReportingAccess(): Promise<AdminTestResult[]> {
    const results: AdminTestResult[] = [];

    try {
      // Test: Can access financial reports data
      const { data: invoiceStats, error } = await schemaClient.finance
        .invoices()
        .select('total_amount, status, created_at');

      if (error) throw error;

      results.push({
        category: 'Reporting',
        test: 'Can access financial reporting data',
        passed: true,
        details: `Invoice data for reports: ${invoiceStats?.length || 0} records`
      });

      // Test: Can access audit logs
      const { data: auditLogs, error: auditError } = await schemaClient.audit
        .audit_logs()
        .select('*')
        .limit(10);

      if (auditError) throw auditError;

      results.push({
        category: 'Reporting',
        test: 'Can access audit logs',
        passed: true,
        details: `Found ${auditLogs?.length || 0} audit log entries`
      });

    } catch (error) {
      results.push({
        category: 'Reporting',
        test: 'Reporting access',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    return results;
  }
}

export const testAdminAccess = async (userId: string): Promise<AdminTestResult[]> => {
  const tester = new AdminAccessTest(userId);
  return await tester.runAllTests();
};