# 🧪 PayFlow Testing Documentation

## Overview

PayFlow includes a comprehensive testing infrastructure designed to validate security, performance, data integrity, and compliance across the entire application. The testing suite ensures that the multi-schema database architecture, role-based access control, and audit logging systems function correctly.

## 🎯 Test Categories

### 1. **RLS & Data Access Tests**
**Location**: `packages/payflow-suite/src/lib/tests/rls-access-control.ts`

Validates Row Level Security (RLS) policies and ensures users can only access data they're authorized to see.

**Tests Include**:
- Project access filtering by organization
- Invoice access restrictions for clients
- Payment visibility controls
- Calendar event permissions
- Message thread access control
- Organization membership validation

**Example Results**:
```
✅ Projects - Client can only see own organization projects
✅ Invoices - Client restricted to own invoices  
✅ Payments - Payment access properly filtered
❌ Calendar - Events should be filtered by user access
```

### 2. **Admin Access Tests**
**Location**: `packages/payflow-suite/src/lib/tests/admin-access-test.ts`

Verifies that admin users have access to all required functionality across the system.

**Tests Include**:
- Organization management access
- All invoice operations (create, read, update, delete)
- Payment processing capabilities
- User management functions
- System configuration access
- Reporting and analytics features

### 3. **Messaging Security Tests**
**Location**: `packages/payflow-suite/src/lib/tests/messaging-permissions.ts`

Validates messaging system permissions and real-time features.

**Tests Include**:
- Message thread creation permissions
- Message sending restrictions
- Read status tracking
- Real-time subscription security
- Message history access control

### 4. **End-to-End Workflow Tests**
**Location**: `packages/payflow-suite/src/lib/tests/e2e-workflow-test.ts`

Tests complete user workflows from start to finish, simulating real user interactions.

**Admin Workflow**:
1. Access admin dashboard data
2. Create new client organization  
3. Create project for client
4. Generate invoice with line items
5. Update invoice status
6. Cleanup test data

**Client Workflow**:
1. Access client dashboard
2. View client-specific invoices
3. Check payment history
4. Access calendar events
5. Validate data isolation

**Additional Workflows**:
- Messaging workflow (thread creation, messaging, read status)
- Calendar workflow (event creation, updates)
- Profile workflow (access, updates, restoration)

### 5. **Real-time Performance Tests**
**Location**: `packages/payflow-suite/src/lib/tests/realtime-performance-test.ts`

Validates system performance and real-time capabilities with specific thresholds.

**Performance Metrics**:
- **Message Latency**: Average <500ms, Maximum <1000ms
- **Database Queries**: Simple queries <200ms, Complex joins <800ms
- **Subscription Setup**: <100ms per subscription
- **Concurrent Connections**: 20 simultaneous queries with 100% success rate
- **Data Throughput**: >10 records/sec insert, >50 records/sec read

**Tests Include**:
```typescript
// Example performance test
const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
testResults.push({
  test: 'Real-time Message Latency',
  metric: 'Average Message Send Latency',
  value: avgLatency,
  unit: 'ms',
  passed: avgLatency < 500, // Threshold
  threshold: 500
});
```

### 6. **Data Integrity Tests**
**Location**: `packages/payflow-suite/src/lib/tests/data-integrity-test.ts`

Ensures database constraints, foreign keys, and data consistency are maintained.

**Tests Include**:
- **Foreign Key Constraints**: Prevents invalid references
- **RLS Policy Enforcement**: Confirms policies are active
- **Data Consistency**: Invoice amounts match line item totals
- **Schema Structure**: All required schemas and tables exist
- **Unique Constraints**: Prevents duplicate emails, invoice numbers

**Example Validation**:
```typescript
// Test foreign key constraint
const { error: invalidProjError } = await schemaClient.app
  .projects()
  .insert({
    organization_id: '00000000-0000-0000-0000-000000000000', // Invalid ID
    // ... other fields
  });

// Should fail with foreign key error
testResult.passed = invalidProjError !== null;
```

### 7. **Audit & Compliance Tests**
**Location**: `packages/payflow-suite/src/lib/tests/audit-compliance-test.ts`

Validates audit logging, data retention, and compliance features.

**Compliance Levels**:
- **Basic**: INSERT/UPDATE/DELETE audit logging
- **Standard**: Complete audit trails, timestamp validation
- **Advanced**: Data access logging, audit log immutability

**Tests Include**:
- Audit log creation for all CRUD operations
- Sensitive data access logging
- Audit trail completeness (required fields, timestamps)
- Data retention policy compliance
- Audit log security (immutability, deletion prevention)
- Audit reporting capabilities

## 🚀 Running Tests

### Prerequisites
1. **User Account**: Login required (demo users available)
2. **Admin Role**: Required for full test suite access
3. **Database**: Migrated with all schemas (app, finance, messaging, audit)

### Demo Users
Pre-configured test accounts:

| Email | Password | Role | Access Level |
|-------|----------|------|--------------|
| `admin@example.com` | `password123` | Admin | Full test suite |
| `team@example.com` | `password123` | Team Member | Limited tests |
| `client@example.com` | `password123` | Client | Client-specific tests |

### Web Interface Method (Recommended)

1. **Start Application**:
   ```bash
   cd packages/payflow-suite
   bun run dev
   ```

2. **Login as Admin**:
   - Navigate to: `http://localhost:5173/auth`
   - Email: `admin@example.com`
   - Password: `password123`

3. **Access Testing Page**:
   - Click "Security Testing" in sidebar, or
   - Go to: `http://localhost:5173/testing`

4. **Execute Tests**:
   - Click "Run All Tests" button
   - Monitor real-time progress across all 7 categories
   - Review detailed results with pass/fail status

### Programmatic Method

```typescript
import { testE2EWorkflows } from '@/lib/tests/e2e-workflow-test';
import { testRealtimePerformance } from '@/lib/tests/realtime-performance-test';
import { testDataIntegrity } from '@/lib/tests/data-integrity-test';
import { testAuditCompliance } from '@/lib/tests/audit-compliance-test';

// Run individual test suites
const e2eResults = await testE2EWorkflows('user-id', 'admin', 'org-id');
const performanceResults = await testRealtimePerformance();
const integrityResults = await testDataIntegrity();
const auditResults = await testAuditCompliance();

console.log('Test Results:', {
  e2e: e2eResults,
  performance: performanceResults,
  integrity: integrityResults,
  audit: auditResults
});
```

## 📊 Test Results & Interpretation

### Result Structure
Each test returns structured results with the following information:

```typescript
interface TestResult {
  test: string;           // Test category name
  check: string;          // Specific check being performed
  passed: boolean;        // Pass/fail status
  error?: string;         // Error message if failed
  details?: string;       // Additional context
  // Category-specific fields:
  duration?: number;      // Performance timing
  threshold?: number;     // Performance threshold
  auditRecords?: number;  // Number of audit records
  complianceLevel?: string; // Compliance level achieved
}
```

### Success Criteria

**🟢 Passing Test Suite**:
- All RLS policies prevent unauthorized access
- Admin users can access all required functionality
- Performance metrics meet defined thresholds
- Data integrity constraints are enforced
- Audit logging captures all required events

**🔴 Critical Failures**:
- RLS policy bypassed (security vulnerability)
- Data accessible across organization boundaries
- Performance significantly below thresholds
- Foreign key constraints not enforced
- Audit logs missing or modifiable

### Example Test Output

```
📊 Test Results Summary
├── RLS & Data Access: 15/15 tests passed (100%)
├── Admin Access: 8/8 tests passed (100%)
├── Messaging Security: 5/5 tests passed (100%)
├── E2E Workflows: 12/12 tests passed (100%)
├── Performance: 8/10 tests passed (80%) ⚠️
│   ├── ✅ Message latency: 245ms (threshold: 500ms)
│   ├── ❌ Complex query: 950ms (threshold: 800ms)
│   └── ✅ Throughput: 45 records/sec (threshold: 10)
├── Data Integrity: 18/18 tests passed (100%)
└── Audit & Compliance: 14/15 tests passed (93%) ⚠️
    ├── ✅ Audit log creation (Basic compliance)
    ├── ✅ Data retention (Standard compliance)
    └── ❌ Access logging (Advanced compliance)

Overall: 80/83 tests passed (96.4%)
```

## 🔧 Test Configuration

### Environment Variables
```bash
# Required for testing
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key # For admin operations
```

### Database Setup
Ensure your database includes all required schemas:
```sql
-- Required schemas for testing
CREATE SCHEMA IF NOT EXISTS app;
CREATE SCHEMA IF NOT EXISTS finance; 
CREATE SCHEMA IF NOT EXISTS messaging;
CREATE SCHEMA IF NOT EXISTS audit;
```

### Performance Thresholds
Default thresholds can be customized in test files:

```typescript
// In realtime-performance-test.ts
const thresholds = {
  messageLatency: { average: 500, maximum: 1000 }, // ms
  queryPerformance: { simple: 200, complex: 800 }, // ms
  subscriptionSetup: 100, // ms
  concurrentSuccess: 100, // %
  throughput: { insert: 10, read: 50 } // records/sec
};
```

## 🐛 Troubleshooting

### Common Issues

**Test Access Denied**:
- Ensure logged in as admin user
- Check `/testing` route is accessible
- Verify admin role in database

**Performance Test Failures**:
- Check network latency to database
- Monitor database connection pool
- Review query optimization

**RLS Test Failures**:
- Verify RLS policies are enabled: `ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;`
- Check policy syntax and logic
- Confirm user context is properly set

**Audit Test Failures**:
- Ensure audit schema exists
- Check audit triggers are installed
- Verify audit table permissions

### Debug Mode
Enable detailed logging by setting:
```typescript
// In test files
const DEBUG = true;
if (DEBUG) console.log('Test step:', stepDetails);
```

### Manual Verification
For critical failures, manually verify in database:
```sql
-- Check RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname IN ('app', 'finance', 'messaging');

-- Check audit logs
SELECT * FROM audit.audit_logs 
ORDER BY timestamp DESC LIMIT 10;

-- Verify foreign key constraints
SELECT * FROM information_schema.table_constraints 
WHERE constraint_type = 'FOREIGN KEY';
```

## 📈 Continuous Integration

### Automated Testing
Consider integrating tests into CI/CD pipeline:

```yaml
# Example GitHub Actions workflow
name: PayFlow Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: bun install
      - name: Run test suite
        run: npm run test:integration
        env:
          VITE_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
```

### Monitoring & Alerts
Set up monitoring for test metrics:
- Performance regression detection
- Security test failure alerts
- Audit compliance monitoring

## 📚 Additional Resources

### Test Files Reference
- **RLS Tests**: `packages/payflow-suite/src/lib/tests/rls-access-control.ts`
- **Admin Tests**: `packages/payflow-suite/src/lib/tests/admin-access-test.ts`
- **Messaging Tests**: `packages/payflow-suite/src/lib/tests/messaging-permissions.ts`
- **E2E Tests**: `packages/payflow-suite/src/lib/tests/e2e-workflow-test.ts`
- **Performance Tests**: `packages/payflow-suite/src/lib/tests/realtime-performance-test.ts`
- **Integrity Tests**: `packages/payflow-suite/src/lib/tests/data-integrity-test.ts`
- **Audit Tests**: `packages/payflow-suite/src/lib/tests/audit-compliance-test.ts`

### UI Components
- **Test Suite**: `packages/payflow-suite/src/components/testing/ComprehensiveTestSuite.tsx`
- **Test Page**: `packages/payflow-suite/src/pages/Testing.tsx`

### Database Schema
- **Migration**: `packages/core/supabase/migrations/202507261400_init.sql`
- **Types**: `packages/payflow-suite/src/integrations/supabase/types.ts`

---

*This testing infrastructure ensures PayFlow meets enterprise-grade standards for security, performance, and compliance. Regular test execution helps maintain system integrity and identifies issues before they impact users.*