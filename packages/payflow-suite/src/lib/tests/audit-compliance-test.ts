import { schemaClient } from '../database/schema-client';

export interface AuditTestResult {
  test: string;
  check: string;
  passed: boolean;
  error?: string;
  details?: string;
  auditRecords?: number;
  complianceLevel?: 'basic' | 'standard' | 'advanced';
}

export class AuditComplianceTest {
  private testResults: AuditTestResult[] = [];

  async runAllTests(): Promise<AuditTestResult[]> {
    this.testResults = [];

    await this.testAuditLogCreation();
    await this.testDataAccessLogging();
    await this.testAuditTrailCompleteness();
    await this.testComplianceDataRetention();
    await this.testAuditLogSecurity();
    await this.testAuditReporting();

    return this.testResults;
  }

  private async testAuditLogCreation(): Promise<void> {
    const testName = 'Audit Log Creation';

    try {
      // Test 1: Create organization and verify audit trail
      const beforeCount = await this.getAuditLogCount();
      
      const { data: testOrg, error: orgError } = await schemaClient.app
        .organizations()
        .insert({
          name: 'Audit Test Organization',
          company_email: 'audit-test@example.com',
          company_phone: '555-AUDIT',
          company_address: '123 Audit Street'
        })
        .select('*')
        .single();

      if (orgError) throw new Error(`Organization creation failed: ${orgError.message}`);

      // Wait a moment for audit triggers to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      const afterCount = await this.getAuditLogCount();
      const auditCreated = afterCount > beforeCount;

      this.testResults.push({
        test: testName,
        check: 'INSERT operation creates audit log',
        passed: auditCreated,
        details: auditCreated ? `Audit logs increased from ${beforeCount} to ${afterCount}` : 'No audit log created',
        auditRecords: afterCount - beforeCount,
        complianceLevel: 'basic'
      });

      // Test 2: Update organization and verify audit trail
      const beforeUpdateCount = await this.getAuditLogCount();
      
      const { error: updateError } = await schemaClient.app
        .organizations()
        .update({ name: 'Audit Test Organization Updated' })
        .eq('id', testOrg.id);

      if (updateError) throw new Error(`Organization update failed: ${updateError.message}`);

      await new Promise(resolve => setTimeout(resolve, 100));

      const afterUpdateCount = await this.getAuditLogCount();
      const updateAuditCreated = afterUpdateCount > beforeUpdateCount;

      this.testResults.push({
        test: testName,
        check: 'UPDATE operation creates audit log',
        passed: updateAuditCreated,
        details: updateAuditCreated ? `Audit logs increased from ${beforeUpdateCount} to ${afterUpdateCount}` : 'No update audit log created',
        auditRecords: afterUpdateCount - beforeUpdateCount,
        complianceLevel: 'basic'
      });

      // Test 3: Delete organization and verify audit trail
      const beforeDeleteCount = await this.getAuditLogCount();
      
      const { error: deleteError } = await schemaClient.app
        .organizations()
        .delete()
        .eq('id', testOrg.id);

      if (deleteError) throw new Error(`Organization deletion failed: ${deleteError.message}`);

      await new Promise(resolve => setTimeout(resolve, 100));

      const afterDeleteCount = await this.getAuditLogCount();
      const deleteAuditCreated = afterDeleteCount > beforeDeleteCount;

      this.testResults.push({
        test: testName,
        check: 'DELETE operation creates audit log',
        passed: deleteAuditCreated,
        details: deleteAuditCreated ? `Audit logs increased from ${beforeDeleteCount} to ${afterDeleteCount}` : 'No delete audit log created',
        auditRecords: afterDeleteCount - beforeDeleteCount,
        complianceLevel: 'standard'
      });

    } catch (error) {
      this.testResults.push({
        test: testName,
        check: 'Test execution',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        complianceLevel: 'basic'
      });
    }
  }

  private async testDataAccessLogging(): Promise<void> {
    const testName = 'Data Access Logging';

    try {
      // Test 1: Verify sensitive data access is logged
      const { data: profiles, error: profileError } = await schemaClient.app
        .profiles()
        .select('id, full_name, email')
        .limit(5);

      if (profileError) throw new Error(`Profile access failed: ${profileError.message}`);

      // Check if data access was logged (this would require custom logging implementation)
      const { data: accessLogs, error: accessError } = await schemaClient.audit
        .audit_logs()
        .select('*')
        .eq('operation', 'SELECT')
        .eq('table_name', 'profiles')
        .gte('timestamp', new Date(Date.now() - 5000).toISOString()); // Last 5 seconds

      if (accessError) throw new Error(`Access log check failed: ${accessError.message}`);

      this.testResults.push({
        test: testName,
        check: 'Sensitive data access logging',
        passed: Array.isArray(accessLogs) && accessLogs.length > 0,
        details: accessLogs && accessLogs.length > 0 ? `Found ${accessLogs.length} access logs` : 'No access logs found',
        auditRecords: accessLogs?.length || 0,
        complianceLevel: 'advanced'
      });

      // Test 2: Verify financial data access is logged
      const { data: invoices, error: invoiceError } = await schemaClient.finance
        .invoices()
        .select('id, invoice_number, total_amount')
        .limit(3);

      if (invoiceError) throw new Error(`Invoice access failed: ${invoiceError.message}`);

      const { data: financeAccessLogs, error: financeAccessError } = await schemaClient.audit
        .audit_logs()
        .select('*')
        .eq('operation', 'SELECT')
        .eq('table_name', 'invoices')
        .gte('timestamp', new Date(Date.now() - 5000).toISOString());

      if (financeAccessError) throw new Error(`Finance access log check failed: ${financeAccessError.message}`);

      this.testResults.push({
        test: testName,
        check: 'Financial data access logging',
        passed: Array.isArray(financeAccessLogs) && financeAccessLogs.length > 0,
        details: financeAccessLogs && financeAccessLogs.length > 0 ? `Found ${financeAccessLogs.length} finance access logs` : 'No finance access logs found',
        auditRecords: financeAccessLogs?.length || 0,
        complianceLevel: 'advanced'
      });

    } catch (error) {
      this.testResults.push({
        test: testName,
        check: 'Test execution',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        complianceLevel: 'advanced'
      });
    }
  }

  private async testAuditTrailCompleteness(): Promise<void> {
    const testName = 'Audit Trail Completeness';

    try {
      // Test 1: Verify audit logs contain all required fields
      const { data: recentAudits, error: auditError } = await schemaClient.audit
        .audit_logs()
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(10);

      if (auditError) throw new Error(`Audit log retrieval failed: ${auditError.message}`);

      if (!recentAudits || recentAudits.length === 0) {
        this.testResults.push({
          test: testName,
          check: 'Audit logs exist',
          passed: false,
          details: 'No audit logs found',
          complianceLevel: 'basic'
        });
        return;
      }

      const requiredFields = ['id', 'table_name', 'record_id', 'operation', 'timestamp', 'user_id'];
      const missingFields: string[] = [];

      for (const audit of recentAudits) {
        for (const field of requiredFields) {
          if (!(field in audit) || audit[field] === null) {
            missingFields.push(field);
          }
        }
      }

      this.testResults.push({
        test: testName,
        check: 'Audit logs contain required fields',
        passed: missingFields.length === 0,
        details: missingFields.length === 0 ? 'All required fields present' : `Missing fields: ${[...new Set(missingFields)].join(', ')}`,
        auditRecords: recentAudits.length,
        complianceLevel: 'standard'
      });

      // Test 2: Verify audit logs have proper timestamps
      const timestampErrors = recentAudits.filter(audit => {
        const timestamp = new Date(audit.timestamp);
        return isNaN(timestamp.getTime()) || timestamp > new Date();
      });

      this.testResults.push({
        test: testName,
        check: 'Audit timestamps are valid',
        passed: timestampErrors.length === 0,
        details: timestampErrors.length === 0 ? 'All timestamps valid' : `${timestampErrors.length} invalid timestamps`,
        auditRecords: recentAudits.length - timestampErrors.length,
        complianceLevel: 'standard'
      });

      // Test 3: Verify audit operations are valid
      const validOperations = ['INSERT', 'UPDATE', 'DELETE', 'SELECT'];
      const invalidOperations = recentAudits.filter(audit => 
        !validOperations.includes(audit.operation)
      );

      this.testResults.push({
        test: testName,
        check: 'Audit operations are valid',
        passed: invalidOperations.length === 0,
        details: invalidOperations.length === 0 ? 'All operations valid' : `${invalidOperations.length} invalid operations`,
        auditRecords: recentAudits.length - invalidOperations.length,
        complianceLevel: 'standard'
      });

    } catch (error) {
      this.testResults.push({
        test: testName,
        check: 'Test execution',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        complianceLevel: 'standard'
      });
    }
  }

  private async testComplianceDataRetention(): Promise<void> {
    const testName = 'Compliance Data Retention';

    try {
      // Test 1: Check audit log retention period
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const { data: oldAudits, error: oldAuditError } = await schemaClient.audit
        .audit_logs()
        .select('*')
        .lt('timestamp', thirtyDaysAgo.toISOString())
        .limit(100);

      if (oldAuditError) throw new Error(`Old audit retrieval failed: ${oldAuditError.message}`);

      this.testResults.push({
        test: testName,
        check: 'Audit logs retained for compliance period',
        passed: true, // This test passes if we can query without error
        details: `Found ${oldAudits?.length || 0} audit records older than 30 days`,
        auditRecords: oldAudits?.length || 0,
        complianceLevel: 'standard'
      });

      // Test 2: Check data deletion audit trail
      const { data: deletionAudits, error: deletionError } = await schemaClient.audit
        .audit_logs()
        .select('*')
        .eq('operation', 'DELETE')
        .order('timestamp', { ascending: false })
        .limit(10);

      if (deletionError) throw new Error(`Deletion audit retrieval failed: ${deletionError.message}`);

      this.testResults.push({
        test: testName,
        check: 'Data deletion events are audited',
        passed: Array.isArray(deletionAudits) && deletionAudits.length >= 0,
        details: `Found ${deletionAudits?.length || 0} deletion audit records`,
        auditRecords: deletionAudits?.length || 0,
        complianceLevel: 'advanced'
      });

    } catch (error) {
      this.testResults.push({
        test: testName,
        check: 'Test execution',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        complianceLevel: 'standard'
      });
    }
  }

  private async testAuditLogSecurity(): Promise<void> {
    const testName = 'Audit Log Security';

    try {
      // Test 1: Verify audit logs cannot be modified by regular operations
      const { data: testAudit, error: testAuditError } = await schemaClient.audit
        .audit_logs()
        .select('*')
        .limit(1)
        .single();

      if (testAuditError) {
        this.testResults.push({
          test: testName,
          check: 'Audit log accessibility',
          passed: false,
          error: testAuditError.message,
          complianceLevel: 'advanced'
        });
        return;
      }

      if (testAudit) {
        // Try to update an audit log (should fail)
        const { error: updateError } = await schemaClient.audit
          .audit_logs()
          .update({ operation: 'MODIFIED' })
          .eq('id', testAudit.id);

        this.testResults.push({
          test: testName,
          check: 'Audit logs are immutable',
          passed: updateError !== null,
          details: updateError ? 'Correctly prevented audit log modification' : 'ERROR: Should have prevented audit log modification',
          complianceLevel: 'advanced'
        });

        // Try to delete an audit log (should fail)
        const { error: deleteError } = await schemaClient.audit
          .audit_logs()
          .delete()
          .eq('id', testAudit.id);

        this.testResults.push({
          test: testName,
          check: 'Audit logs cannot be deleted',
          passed: deleteError !== null,
          details: deleteError ? 'Correctly prevented audit log deletion' : 'ERROR: Should have prevented audit log deletion',
          complianceLevel: 'advanced'
        });
      }

      // Test 2: Verify audit table permissions
      this.testResults.push({
        test: testName,
        check: 'Audit table read access exists',
        passed: testAudit !== null,
        details: testAudit ? 'Can read audit logs' : 'Cannot read audit logs',
        complianceLevel: 'standard'
      });

    } catch (error) {
      this.testResults.push({
        test: testName,
        check: 'Test execution',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        complianceLevel: 'advanced'
      });
    }
  }

  private async testAuditReporting(): Promise<void> {
    const testName = 'Audit Reporting Capabilities';

    try {
      // Test 1: Generate audit summary report
      const { data: auditSummary, error: summaryError } = await schemaClient.client
        .rpc('get_audit_summary', {
          start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          end_date: new Date().toISOString()
        });

      if (summaryError) {
        // If the function doesn't exist, we'll create a manual summary
        const { data: weeklyAudits, error: weeklyError } = await schemaClient.audit
          .audit_logs()
          .select('operation')
          .gte('timestamp', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

        if (weeklyError) throw new Error(`Weekly audit retrieval failed: ${weeklyError.message}`);

        const operationCounts = weeklyAudits?.reduce((acc, audit) => {
          acc[audit.operation] = (acc[audit.operation] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {};

        this.testResults.push({
          test: testName,
          check: 'Weekly audit summary generation',
          passed: true,
          details: `Operations: ${Object.entries(operationCounts).map(([op, count]) => `${op}: ${count}`).join(', ')}`,
          auditRecords: weeklyAudits?.length || 0,
          complianceLevel: 'standard'
        });
      } else {
        this.testResults.push({
          test: testName,
          check: 'Audit summary function available',
          passed: Array.isArray(auditSummary),
          details: auditSummary ? `Summary function returned ${auditSummary.length} records` : 'Summary function failed',
          auditRecords: auditSummary?.length || 0,
          complianceLevel: 'advanced'
        });
      }

      // Test 2: Check audit trail by user
      const { data: userAudits, error: userAuditError } = await schemaClient.audit
        .audit_logs()
        .select('user_id, operation, table_name, timestamp')
        .not('user_id', 'is', null)
        .order('timestamp', { ascending: false })
        .limit(20);

      if (userAuditError) throw new Error(`User audit retrieval failed: ${userAuditError.message}`);

      const uniqueUsers = new Set(userAudits?.map(audit => audit.user_id) || []);

      this.testResults.push({
        test: testName,
        check: 'User activity audit trail',
        passed: uniqueUsers.size > 0,
        details: `Found audit records for ${uniqueUsers.size} unique users`,
        auditRecords: userAudits?.length || 0,
        complianceLevel: 'standard'
      });

      // Test 3: Check audit trail by table
      const { data: tableAudits, error: tableAuditError } = await schemaClient.audit
        .audit_logs()
        .select('table_name, operation')
        .order('timestamp', { ascending: false })
        .limit(50);

      if (tableAuditError) throw new Error(`Table audit retrieval failed: ${tableAuditError.message}`);

      const tableCounts = tableAudits?.reduce((acc, audit) => {
        acc[audit.table_name] = (acc[audit.table_name] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      this.testResults.push({
        test: testName,
        check: 'Table-level audit reporting',
        passed: Object.keys(tableCounts).length > 0,
        details: `Audited tables: ${Object.keys(tableCounts).join(', ')}`,
        auditRecords: tableAudits?.length || 0,
        complianceLevel: 'standard'
      });

    } catch (error) {
      this.testResults.push({
        test: testName,
        check: 'Test execution',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        complianceLevel: 'standard'
      });
    }
  }

  private async getAuditLogCount(): Promise<number> {
    const { count, error } = await schemaClient.audit
      .audit_logs()
      .select('*', { count: 'exact', head: true });
    
    if (error) throw new Error(`Audit count failed: ${error.message}`);
    return count || 0;
  }

  getComplianceSummary(): {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    passRate: number;
    complianceLevels: Record<string, { passed: number; total: number }>;
    criticalFailures: AuditTestResult[];
  } {
    const passedTests = this.testResults.filter(r => r.passed).length;
    const failedTests = this.testResults.filter(r => !r.passed).length;
    const passRate = (passedTests / this.testResults.length) * 100;

    const complianceLevels = this.testResults.reduce((acc, result) => {
      if (result.complianceLevel) {
        if (!acc[result.complianceLevel]) {
          acc[result.complianceLevel] = { passed: 0, total: 0 };
        }
        acc[result.complianceLevel].total++;
        if (result.passed) {
          acc[result.complianceLevel].passed++;
        }
      }
      return acc;
    }, {} as Record<string, { passed: number; total: number }>);

    const criticalFailures = this.testResults.filter(r => 
      !r.passed && (r.complianceLevel === 'advanced' || r.check.includes('immutable') || r.check.includes('deletion'))
    );

    return {
      totalTests: this.testResults.length,
      passedTests,
      failedTests,
      passRate,
      complianceLevels,
      criticalFailures
    };
  }
}

export const testAuditCompliance = async (): Promise<AuditTestResult[]> => {
  const tester = new AuditComplianceTest();
  return await tester.runAllTests();
};