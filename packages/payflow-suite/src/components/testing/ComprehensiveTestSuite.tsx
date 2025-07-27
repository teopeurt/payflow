import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, Play, Shield, Users, Database, AlertTriangle } from 'lucide-react';
import { useAuth } from '@payflow/core/auth';
import { testRLSAccessControl, type RLSTestResult } from '@/lib/tests/rls-access-control';
import { testAdminAccess, type AdminTestResult } from '@/lib/tests/admin-access-test';
import { testMessagingPermissions, type TestResult as MessagingTestResult } from '@/lib/tests/messaging-permissions';
import { testE2EWorkflows, type E2ETestResult } from '@/lib/tests/e2e-workflow-test';
import { testRealtimePerformance, type PerformanceTestResult } from '@/lib/tests/realtime-performance-test';
import { testDataIntegrity, type DataIntegrityTestResult } from '@/lib/tests/data-integrity-test';
import { testAuditCompliance, type AuditTestResult } from '@/lib/tests/audit-compliance-test';
import { dbQueries } from '@/lib/database/queries';

interface TestSuiteState {
  rlsResults: RLSTestResult[];
  adminResults: AdminTestResult[];
  messagingResults: MessagingTestResult[];
  e2eResults: E2ETestResult[];
  performanceResults: PerformanceTestResult[];
  integrityResults: DataIntegrityTestResult[];
  auditResults: AuditTestResult[];
  isRunning: boolean;
  userRole: string | null;
  organizationId: string | null;
}

export const ComprehensiveTestSuite: React.FC = () => {
  const { profile } = useAuth();
  const [testState, setTestState] = useState<TestSuiteState>({
    rlsResults: [],
    adminResults: [],
    messagingResults: [],
    e2eResults: [],
    performanceResults: [],
    integrityResults: [],
    auditResults: [],
    isRunning: false,
    userRole: null,
    organizationId: null
  });

  const runAllTests = async () => {
    if (!profile?.id) return;
    
    setTestState(prev => ({ ...prev, isRunning: true }));
    
    try {
      // Get user role and organization
      const role = await dbQueries.getUserRole(profile.id);
      const userProfile = await dbQueries.getUserWithProfile(profile.id);
      const orgId = userProfile?.organization_members?.[0]?.organization_id;

      setTestState(prev => ({ 
        ...prev, 
        userRole: role,
        organizationId: orgId || null
      }));

      // Run all test suites in parallel
      const [rlsResults, adminResults, messagingResults, e2eResults, performanceResults, integrityResults, auditResults] = await Promise.all([
        testRLSAccessControl(profile.id, role || 'unknown', orgId),
        role === 'admin' ? testAdminAccess(profile.id) : Promise.resolve([]),
        testMessagingPermissions(profile.id, role || 'unknown'),
        testE2EWorkflows(profile.id, role || 'unknown', orgId),
        testRealtimePerformance(),
        testDataIntegrity(),
        testAuditCompliance()
      ]);

      setTestState(prev => ({
        ...prev,
        rlsResults,
        adminResults,
        messagingResults,
        e2eResults,
        performanceResults,
        integrityResults,
        auditResults,
        isRunning: false
      }));

    } catch (error) {
      console.error('Error running comprehensive tests:', error);
      setTestState(prev => ({ ...prev, isRunning: false }));
    }
  };

  const getStatusIcon = (passed: boolean) => {
    return passed ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <XCircle className="h-4 w-4 text-red-600" />
    );
  };

  const getStatusBadge = (passed: boolean) => {
    return passed ? (
      <Badge className="bg-green-100 text-green-800">PASS</Badge>
    ) : (
      <Badge variant="destructive">FAIL</Badge>
    );
  };

  const calculateStats = (results: { passed: boolean }[]) => {
    const passed = results.filter(r => r.passed).length;
    const total = results.length;
    return { passed, total, percentage: total > 0 ? (passed / total) * 100 : 0 };
  };

  const rlsStats = calculateStats(testState.rlsResults);
  const adminStats = calculateStats(testState.adminResults);
  const messagingStats = calculateStats(testState.messagingResults);
  const e2eStats = calculateStats(testState.e2eResults);
  const performanceStats = calculateStats(testState.performanceResults);
  const integrityStats = calculateStats(testState.integrityResults);
  const auditStats = calculateStats(testState.auditResults);
  const overallStats = calculateStats([
    ...testState.rlsResults,
    ...testState.adminResults,
    ...testState.messagingResults,
    ...testState.e2eResults,
    ...testState.performanceResults,
    ...testState.integrityResults,
    ...testState.auditResults
  ]);

  const groupResultsByCategory = (results: RLSTestResult[]) => {
    return results.reduce((acc, result) => {
      if (!acc[result.category]) {
        acc[result.category] = [];
      }
      acc[result.category].push(result);
      return acc;
    }, {} as Record<string, RLSTestResult[]>);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-6 w-6" />
            <span>Comprehensive Security & Access Control Test Suite</span>
          </CardTitle>
          <CardDescription>
            Validate RLS policies, role-based access control, and security measures
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-gray-600">
                Current User: <span className="font-medium">{profile?.full_name}</span>
              </p>
              {testState.userRole && (
                <p className="text-sm text-gray-600">
                  Role: <span className="font-medium capitalize">{testState.userRole}</span>
                </p>
              )}
              {overallStats.total > 0 && (
                <p className="text-sm font-medium">
                  Overall: {overallStats.passed}/{overallStats.total} tests passed 
                  ({overallStats.percentage.toFixed(1)}%)
                </p>
              )}
            </div>
            <Button 
              onClick={runAllTests} 
              disabled={testState.isRunning || !profile?.id}
              className="flex items-center space-x-2"
              size="lg"
            >
              <Play className="h-4 w-4" />
              <span>{testState.isRunning ? 'Running Tests...' : 'Run All Tests'}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      {(testState.rlsResults.length > 0 || testState.adminResults.length > 0 || testState.messagingResults.length > 0 || 
        testState.e2eResults.length > 0 || testState.performanceResults.length > 0 || testState.integrityResults.length > 0 || 
        testState.auditResults.length > 0) && (
        <Tabs defaultValue="rls" className="w-full">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="rls" className="flex items-center space-x-1 text-xs">
              <Database className="h-3 w-3" />
              <span>RLS ({rlsStats.passed}/{rlsStats.total})</span>
            </TabsTrigger>
            <TabsTrigger value="admin" className="flex items-center space-x-1 text-xs">
              <Users className="h-3 w-3" />
              <span>Admin ({adminStats.passed}/{adminStats.total})</span>
            </TabsTrigger>
            <TabsTrigger value="messaging" className="flex items-center space-x-1 text-xs">
              <Shield className="h-3 w-3" />
              <span>Messaging ({messagingStats.passed}/{messagingStats.total})</span>
            </TabsTrigger>
            <TabsTrigger value="e2e" className="flex items-center space-x-1 text-xs">
              <Play className="h-3 w-3" />
              <span>E2E ({e2eStats.passed}/{e2eStats.total})</span>
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center space-x-1 text-xs">
              <AlertTriangle className="h-3 w-3" />
              <span>Performance ({performanceStats.passed}/{performanceStats.total})</span>
            </TabsTrigger>
            <TabsTrigger value="integrity" className="flex items-center space-x-1 text-xs">
              <CheckCircle className="h-3 w-3" />
              <span>Integrity ({integrityStats.passed}/{integrityStats.total})</span>
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex items-center space-x-1 text-xs">
              <Shield className="h-3 w-3" />
              <span>Audit ({auditStats.passed}/{auditStats.total})</span>
            </TabsTrigger>
          </TabsList>

          {/* RLS & Data Access Tests */}
          <TabsContent value="rls" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Row Level Security & Data Access Tests</CardTitle>
                <CardDescription>
                  Verify that users can only access data they're authorized to see
                </CardDescription>
              </CardHeader>
              <CardContent>
                {Object.entries(groupResultsByCategory(testState.rlsResults)).map(([category, results]) => (
                  <div key={category} className="mb-6">
                    <h4 className="font-semibold text-lg mb-3 flex items-center space-x-2">
                      <span>{category}</span>
                      <Badge variant="outline">
                        {results.filter(r => r.passed).length}/{results.length}
                      </Badge>
                    </h4>
                    <div className="space-y-2">
                      {results.map((result, index) => (
                        <div 
                          key={index}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            {getStatusIcon(result.passed)}
                            <div>
                              <p className="font-medium">{result.test}</p>
                              {result.details && (
                                <p className="text-sm text-gray-600">{result.details}</p>
                              )}
                              {result.error && (
                                <p className="text-sm text-red-600">{result.error}</p>
                              )}
                            </div>
                          </div>
                          {getStatusBadge(result.passed)}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Admin Access Tests */}
          <TabsContent value="admin" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Administrator Access Tests</CardTitle>
                <CardDescription>
                  Verify admin users have access to all required functionality
                </CardDescription>
              </CardHeader>
              <CardContent>
                {testState.userRole !== 'admin' ? (
                  <div className="flex items-center space-x-2 p-4 bg-yellow-50 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <p className="text-sm text-yellow-800">
                      Admin tests are only available for users with admin role
                    </p>
                  </div>
                ) : testState.adminResults.length === 0 ? (
                  <p className="text-gray-500">No admin test results available. Run tests to see results.</p>
                ) : (
                  <div className="space-y-3">
                    {testState.adminResults.map((result, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(result.passed)}
                          <div>
                            <p className="font-medium">{result.category}: {result.test}</p>
                            {result.details && (
                              <p className="text-sm text-gray-600">{result.details}</p>
                            )}
                            {result.error && (
                              <p className="text-sm text-red-600">{result.error}</p>
                            )}
                          </div>
                        </div>
                        {getStatusBadge(result.passed)}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Messaging Security Tests */}
          <TabsContent value="messaging" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Messaging Security Tests</CardTitle>
                <CardDescription>
                  Verify messaging permissions and real-time features work correctly
                </CardDescription>
              </CardHeader>
              <CardContent>
                {testState.messagingResults.length === 0 ? (
                  <p className="text-gray-500">No messaging test results available. Run tests to see results.</p>
                ) : (
                  <div className="space-y-3">
                    {testState.messagingResults.map((result, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(result.passed)}
                          <div>
                            <p className="font-medium">{result.test}</p>
                            {result.error && (
                              <p className="text-sm text-red-600">{result.error}</p>
                            )}
                          </div>
                        </div>
                        {getStatusBadge(result.passed)}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* E2E Workflow Tests */}
          <TabsContent value="e2e" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>End-to-End Workflow Tests</CardTitle>
                <CardDescription>
                  Test complete user workflows from creation to completion
                </CardDescription>
              </CardHeader>
              <CardContent>
                {testState.e2eResults.length === 0 ? (
                  <p className="text-gray-500">No E2E test results available. Run tests to see results.</p>
                ) : (
                  <div className="space-y-3">
                    {testState.e2eResults.map((result, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(result.passed)}
                          <div>
                            <p className="font-medium">{result.workflow}: {result.step}</p>
                            {result.details && (
                              <p className="text-sm text-gray-600">{result.details}</p>
                            )}
                            {result.duration && (
                              <p className="text-xs text-blue-600">Duration: {result.duration}ms</p>
                            )}
                            {result.error && (
                              <p className="text-sm text-red-600">{result.error}</p>
                            )}
                          </div>
                        </div>
                        {getStatusBadge(result.passed)}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Tests */}
          <TabsContent value="performance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Real-time Performance Tests</CardTitle>
                <CardDescription>
                  Validate system performance and real-time capabilities
                </CardDescription>
              </CardHeader>
              <CardContent>
                {testState.performanceResults.length === 0 ? (
                  <p className="text-gray-500">No performance test results available. Run tests to see results.</p>
                ) : (
                  <div className="space-y-3">
                    {testState.performanceResults.map((result, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(result.passed)}
                          <div>
                            <p className="font-medium">{result.test}: {result.metric}</p>
                            <p className="text-sm text-gray-600">
                              Value: {result.value} {result.unit}
                              {result.threshold && ` (Threshold: ${result.threshold} ${result.unit})`}
                            </p>
                            {result.details && (
                              <p className="text-xs text-gray-500">{result.details}</p>
                            )}
                          </div>
                        </div>
                        {getStatusBadge(result.passed)}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data Integrity Tests */}
          <TabsContent value="integrity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Data Integrity Tests</CardTitle>
                <CardDescription>
                  Verify database constraints, foreign keys, and data consistency
                </CardDescription>
              </CardHeader>
              <CardContent>
                {testState.integrityResults.length === 0 ? (
                  <p className="text-gray-500">No data integrity test results available. Run tests to see results.</p>
                ) : (
                  <div className="space-y-3">
                    {testState.integrityResults.map((result, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(result.passed)}
                          <div>
                            <p className="font-medium">{result.test}: {result.check}</p>
                            {result.details && (
                              <p className="text-sm text-gray-600">{result.details}</p>
                            )}
                            {result.affectedRecords !== undefined && (
                              <p className="text-xs text-blue-600">Affected records: {result.affectedRecords}</p>
                            )}
                            {result.error && (
                              <p className="text-sm text-red-600">{result.error}</p>
                            )}
                          </div>
                        </div>
                        {getStatusBadge(result.passed)}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audit Compliance Tests */}
          <TabsContent value="audit" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Audit & Compliance Tests</CardTitle>
                <CardDescription>
                  Verify audit logging, data retention, and compliance features
                </CardDescription>
              </CardHeader>
              <CardContent>
                {testState.auditResults.length === 0 ? (
                  <p className="text-gray-500">No audit compliance test results available. Run tests to see results.</p>
                ) : (
                  <div className="space-y-3">
                    {testState.auditResults.map((result, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(result.passed)}
                          <div>
                            <p className="font-medium">{result.test}: {result.check}</p>
                            {result.details && (
                              <p className="text-sm text-gray-600">{result.details}</p>
                            )}
                            {result.complianceLevel && (
                              <p className="text-xs text-purple-600">
                                Compliance Level: {result.complianceLevel.charAt(0).toUpperCase() + result.complianceLevel.slice(1)}
                              </p>
                            )}
                            {result.auditRecords !== undefined && (
                              <p className="text-xs text-blue-600">Audit records: {result.auditRecords}</p>
                            )}
                            {result.error && (
                              <p className="text-sm text-red-600">{result.error}</p>
                            )}
                          </div>
                        </div>
                        {getStatusBadge(result.passed)}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};