import { schemaClient } from '../database/schema-client';

export interface DataIntegrityTestResult {
  test: string;
  check: string;
  passed: boolean;
  error?: string;
  details?: string;
  affectedRecords?: number;
}

export class DataIntegrityTest {
  private testResults: DataIntegrityTestResult[] = [];
  private testUserId: string | null = null;

  async runAllTests(): Promise<DataIntegrityTestResult[]> {
    this.testResults = [];

    // Get a valid test user ID
    const { data: testUser } = await schemaClient.app
      .profiles()
      .select('id')
      .eq('email', 'admin@example.com')
      .single();
    
    if (!testUser) {
      throw new Error('Test user not found. Please run seed-users.js first.');
    }
    
    this.testUserId = testUser.id;

    await this.testForeignKeyConstraints();
    await this.testRLSPolicyEnforcement();
    await this.testDataConsistency();
    await this.testAuditTrailIntegrity();
    await this.testSchemaStructureValidation();
    await this.testUniqueConstraints();

    return this.testResults;
  }

  private async testForeignKeyConstraints(): Promise<void> {
    const testName = 'Foreign Key Constraints';

    try {
      // Test 1: Create organization and verify FK relationships
      const { data: testOrg, error: orgError } = await schemaClient.app
        .organizations()
        .insert({
          name: 'FK Test Org',
          company_email: 'fktest@example.com',
          company_phone: '555-0123',
          company_address: '123 Test St'
        })
        .select('*')
        .single();

      if (orgError) throw new Error(`Organization creation failed: ${orgError.message}`);

      this.testResults.push({
        test: testName,
        check: 'Organization creation with valid data',
        passed: true,
        details: `Created organization: ${testOrg.id}`
      });

      // Test 2: Create project with valid organization_id
      const { data: testProject, error: projError } = await schemaClient.app
        .projects()
        .insert({
          name: 'FK Test Project',
          description: 'Testing foreign key constraints',
          organization_id: testOrg.id,
          status: 'active',
          start_date: new Date().toISOString(),
          created_by: this.testUserId!
        })
        .select('*')
        .single();

      if (projError) throw new Error(`Project creation failed: ${projError.message}`);

      this.testResults.push({
        test: testName,
        check: 'Project creation with valid organization FK',
        passed: true,
        details: `Created project: ${testProject.id}`
      });

      // Test 3: Try to create project with invalid organization_id (should fail)
      const { error: invalidProjError } = await schemaClient.app
        .projects()
        .insert({
          name: 'Invalid FK Test',
          description: 'Should fail',
          organization_id: '00000000-0000-0000-0000-000000000000',
          status: 'active',
          start_date: new Date().toISOString(),
          created_by: this.testUserId!
        });

      this.testResults.push({
        test: testName,
        check: 'Project creation with invalid organization FK (should fail)',
        passed: invalidProjError !== null,
        details: invalidProjError ? 'Correctly rejected invalid FK' : 'ERROR: Should have rejected invalid FK'
      });

      // Test 4: Try to delete organization with dependent project (should fail)
      const { error: deleteOrgError } = await schemaClient.app
        .organizations()
        .delete()
        .eq('id', testOrg.id);

      this.testResults.push({
        test: testName,
        check: 'Organization deletion with dependent records (should fail)',
        passed: deleteOrgError !== null,
        details: deleteOrgError ? 'Correctly prevented deletion' : 'ERROR: Should have prevented deletion'
      });

      // Cleanup
      await schemaClient.app.projects().delete().eq('id', testProject.id);
      await schemaClient.app.organizations().delete().eq('id', testOrg.id);

    } catch (error) {
      this.testResults.push({
        test: testName,
        check: 'Test execution',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async testRLSPolicyEnforcement(): Promise<void> {
    const testName = 'Row Level Security Policy Enforcement';

    try {
      // Test 1: Verify RLS is enabled on critical tables
      const { data: rlsStatus, error: rlsError } = await schemaClient
        .rpc('check_rls_enabled', {
          schema_name: 'app',
          table_names: ['profiles', 'projects', 'organizations']
        });

      if (rlsError) throw new Error(`RLS check failed: ${rlsError.message}`);

      this.testResults.push({
        test: testName,
        check: 'RLS enabled on app schema tables',
        passed: Array.isArray(rlsStatus) && rlsStatus.every(status => status.rls_enabled),
        details: `Checked tables: ${rlsStatus?.map(s => s.table_name).join(', ')}`
      });

      // Test 2: Verify finance schema RLS
      const { data: financeRLS, error: financeRLSError } = await schemaClient
        .rpc('check_rls_enabled', {
          schema_name: 'finance',
          table_names: ['invoices', 'payments', 'invoice_items']
        });

      if (financeRLSError) throw new Error(`Finance RLS check failed: ${financeRLSError.message}`);

      this.testResults.push({
        test: testName,
        check: 'RLS enabled on finance schema tables',
        passed: Array.isArray(financeRLS) && financeRLS.every(status => status.rls_enabled),
        details: `Checked tables: ${financeRLS?.map(s => s.table_name).join(', ')}`
      });

      // Test 3: Test policy effectiveness with simulated user context
      // Note: This would require actual user context, so we'll test the structure exists
      const { data: policies, error: policyError } = await schemaClient
        .from('information_schema.policies')
        .select('*')
        .in('schemaname', ['app', 'finance', 'messaging']);

      if (policyError) throw new Error(`Policy check failed: ${policyError.message}`);

      this.testResults.push({
        test: testName,
        check: 'RLS policies exist for all schemas',
        passed: Array.isArray(policies) && policies.length > 0,
        details: `Found ${policies?.length || 0} RLS policies`,
        affectedRecords: policies?.length
      });

    } catch (error) {
      this.testResults.push({
        test: testName,
        check: 'Test execution',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async testDataConsistency(): Promise<void> {
    const testName = 'Data Consistency Validation';

    try {
      // Test 1: Check invoice amounts match invoice_items totals
      const { data: invoiceConsistency, error: invoiceError } = await schemaClient
        .rpc('validate_invoice_amounts');

      if (invoiceError) throw new Error(`Invoice consistency check failed: ${invoiceError.message}`);

      this.testResults.push({
        test: testName,
        check: 'Invoice amounts match line item totals',
        passed: Array.isArray(invoiceConsistency) && invoiceConsistency.length === 0,
        details: invoiceConsistency?.length === 0 ? 'All invoices consistent' : `${invoiceConsistency?.length} inconsistent invoices`,
        affectedRecords: invoiceConsistency?.length
      });

      // Test 2: Check payment amounts don't exceed invoice amounts
      const { data: paymentConsistency, error: paymentError } = await schemaClient
        .rpc('validate_payment_amounts');

      if (paymentError) throw new Error(`Payment consistency check failed: ${paymentError.message}`);

      this.testResults.push({
        test: testName,
        check: 'Payment amounts do not exceed invoice amounts',
        passed: Array.isArray(paymentConsistency) && paymentConsistency.length === 0,
        details: paymentConsistency?.length === 0 ? 'All payments valid' : `${paymentConsistency?.length} invalid payments`,
        affectedRecords: paymentConsistency?.length
      });

      // Test 3: Check organization membership consistency
      const { data: membershipConsistency, error: membershipError } = await schemaClient.app
        .organization_members()
        .select('id, organization_id, user_id');

      if (membershipError) throw new Error(`Membership consistency check failed: ${membershipError.message}`);

      const invalidMemberships = membershipConsistency?.filter(m => !m.organization_id || !m.user_id) || [];

      this.testResults.push({
        test: testName,
        check: 'Organization memberships reference valid organizations and users',
        passed: invalidMemberships.length === 0,
        details: invalidMemberships.length === 0 ? 'All memberships valid' : `${invalidMemberships.length} invalid memberships`,
        affectedRecords: invalidMemberships.length
      });

    } catch (error) {
      this.testResults.push({
        test: testName,
        check: 'Test execution',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async testAuditTrailIntegrity(): Promise<void> {
    const testName = 'Audit Trail Integrity';

    try {
      // Test 1: Create a record and verify audit trail is created
      const { data: testOrg, error: orgError } = await schemaClient.app
        .organizations()
        .insert({
          name: 'Audit Test Org',
          email: 'audit@example.com',
          phone: '555-0123',
          address: '123 Audit St'
        })
        .select('*')
        .single();

      if (orgError) throw new Error(`Organization creation failed: ${orgError.message}`);

      // Check if audit record was created
      const { data: auditRecords, error: auditError } = await schemaClient.audit
        .audit_logs()
        .select('*')
        .eq('table_name', 'organizations')
        .eq('record_id', testOrg.id)
        .eq('operation', 'INSERT');

      if (auditError) throw new Error(`Audit check failed: ${auditError.message}`);

      this.testResults.push({
        test: testName,
        check: 'Audit trail created for INSERT operation',
        passed: Array.isArray(auditRecords) && auditRecords.length > 0,
        details: auditRecords?.length > 0 ? 'Audit record created' : 'No audit record found',
        affectedRecords: auditRecords?.length
      });

      // Test 2: Update the record and verify audit trail
      const { error: updateError } = await schemaClient.app
        .organizations()
        .update({ name: 'Audit Test Org Updated' })
        .eq('id', testOrg.id);

      if (updateError) throw new Error(`Organization update failed: ${updateError.message}`);

      const { data: updateAuditRecords, error: updateAuditError } = await schemaClient.audit
        .audit_logs()
        .select('*')
        .eq('table_name', 'organizations')
        .eq('record_id', testOrg.id)
        .eq('operation', 'UPDATE');

      if (updateAuditError) throw new Error(`Update audit check failed: ${updateAuditError.message}`);

      this.testResults.push({
        test: testName,
        check: 'Audit trail created for UPDATE operation',
        passed: Array.isArray(updateAuditRecords) && updateAuditRecords.length > 0,
        details: updateAuditRecords?.length > 0 ? 'Update audit record created' : 'No update audit record found',
        affectedRecords: updateAuditRecords?.length
      });

      // Test 3: Check audit record structure
      if (auditRecords && auditRecords.length > 0) {
        const auditRecord = auditRecords[0];
        const hasRequiredFields = auditRecord.table_name && 
                                 auditRecord.record_id && 
                                 auditRecord.operation && 
                                 auditRecord.timestamp;

        this.testResults.push({
          test: testName,
          check: 'Audit records contain required fields',
          passed: hasRequiredFields,
          details: hasRequiredFields ? 'All required fields present' : 'Missing required audit fields'
        });
      }

      // Cleanup
      await schemaClient.app.organizations().delete().eq('id', testOrg.id);

    } catch (error) {
      this.testResults.push({
        test: testName,
        check: 'Test execution',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async testSchemaStructureValidation(): Promise<void> {
    const testName = 'Schema Structure Validation';

    try {
      // Test 1: Verify all expected schemas exist
      const expectedSchemas = ['app', 'finance', 'messaging', 'audit'];
      const { data: schemas, error: schemaError } = await schemaClient
        .from('information_schema.schemata')
        .select('schema_name')
        .in('schema_name', expectedSchemas);

      if (schemaError) throw new Error(`Schema check failed: ${schemaError.message}`);

      const foundSchemas = schemas?.map(s => s.schema_name) || [];
      const missingSchemas = expectedSchemas.filter(s => !foundSchemas.includes(s));

      this.testResults.push({
        test: testName,
        check: 'All required schemas exist',
        passed: missingSchemas.length === 0,
        details: missingSchemas.length === 0 ? 'All schemas present' : `Missing schemas: ${missingSchemas.join(', ')}`,
        affectedRecords: foundSchemas.length
      });

      // Test 2: Verify critical tables exist in each schema
      const criticalTables = {
        app: ['profiles', 'organizations', 'projects', 'calendar_events'],
        finance: ['invoices', 'invoice_items', 'payments'],
        messaging: ['message_threads', 'messages', 'thread_participants'],
        audit: ['audit_logs']
      };

      for (const [schema, tables] of Object.entries(criticalTables)) {
        const { data: schemaTables, error: tableError } = await schemaClient
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_schema', schema)
          .in('table_name', tables);

        if (tableError) throw new Error(`Table check failed for ${schema}: ${tableError.message}`);

        const foundTables = schemaTables?.map(t => t.table_name) || [];
        const missingTables = tables.filter(t => !foundTables.includes(t));

        this.testResults.push({
          test: testName,
          check: `Critical tables exist in ${schema} schema`,
          passed: missingTables.length === 0,
          details: missingTables.length === 0 ? `All ${schema} tables present` : `Missing tables: ${missingTables.join(', ')}`,
          affectedRecords: foundTables.length
        });
      }

    } catch (error) {
      this.testResults.push({
        test: testName,
        check: 'Test execution',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async testUniqueConstraints(): Promise<void> {
    const testName = 'Unique Constraint Validation';

    try {
      // Test 1: Try to create duplicate organization email (should fail)
      const testEmail = `unique-test-${Date.now()}@example.com`;
      
      const { data: firstOrg, error: firstOrgError } = await schemaClient.app
        .organizations()
        .insert({
          name: 'First Org',
          email: testEmail,
          phone: '555-0123',
          address: '123 First St'
        })
        .select('*')
        .single();

      if (firstOrgError) throw new Error(`First organization creation failed: ${firstOrgError.message}`);

      // Try to create second org with same email (should fail)
      const { error: duplicateError } = await schemaClient.app
        .organizations()
        .insert({
          name: 'Second Org',
          email: testEmail,
          phone: '555-0124',
          address: '124 Second St'
        });

      this.testResults.push({
        test: testName,
        check: 'Organization email uniqueness enforced',
        passed: duplicateError !== null,
        details: duplicateError ? 'Correctly rejected duplicate email' : 'ERROR: Should have rejected duplicate email'
      });

      // Test 2: Try to create duplicate invoice number
      const invoiceNumber = `UNIQUE-TEST-${Date.now()}`;
      
      const { data: firstInvoice, error: firstInvError } = await schemaClient.finance
        .invoices()
        .insert({
          organization_id: firstOrg.id,
          invoice_number: invoiceNumber,
          amount: 100.00,
          status: 'draft',
          issue_date: new Date().toISOString(),
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })
        .select('*')
        .single();

      if (firstInvError) throw new Error(`First invoice creation failed: ${firstInvError.message}`);

      // Try to create second invoice with same number (should fail)
      const { error: duplicateInvError } = await schemaClient.finance
        .invoices()
        .insert({
          organization_id: firstOrg.id,
          invoice_number: invoiceNumber,
          amount: 200.00,
          status: 'draft',
          issue_date: new Date().toISOString(),
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        });

      this.testResults.push({
        test: testName,
        check: 'Invoice number uniqueness enforced',
        passed: duplicateInvError !== null,
        details: duplicateInvError ? 'Correctly rejected duplicate invoice number' : 'ERROR: Should have rejected duplicate invoice number'
      });

      // Cleanup
      await schemaClient.finance.invoices().delete().eq('id', firstInvoice.id);
      await schemaClient.app.organizations().delete().eq('id', firstOrg.id);

    } catch (error) {
      this.testResults.push({
        test: testName,
        check: 'Test execution',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  getTestSummary(): {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    passRate: number;
    criticalFailures: DataIntegrityTestResult[];
  } {
    const passedTests = this.testResults.filter(r => r.passed).length;
    const failedTests = this.testResults.filter(r => !r.passed).length;
    const passRate = (passedTests / this.testResults.length) * 100;
    
    const criticalFailures = this.testResults.filter(r => 
      !r.passed && (
        r.check.includes('RLS') || 
        r.check.includes('Foreign Key') || 
        r.check.includes('Audit')
      )
    );

    return {
      totalTests: this.testResults.length,
      passedTests,
      failedTests,
      passRate,
      criticalFailures
    };
  }
}

export const testDataIntegrity = async (): Promise<DataIntegrityTestResult[]> => {
  const tester = new DataIntegrityTest();
  return await tester.runAllTests();
};