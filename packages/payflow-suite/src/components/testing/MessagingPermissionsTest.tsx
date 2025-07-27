import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Play } from 'lucide-react';
import { useAuth } from '@payflow/core/auth';
import { testMessagingPermissions, type TestResult } from '@/lib/tests/messaging-permissions';
import { dbQueries } from '@/lib/database/queries';

export const MessagingPermissionsTest: React.FC = () => {
  const { profile } = useAuth();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  const runTests = async () => {
    if (!profile?.id) return;
    
    setIsRunning(true);
    try {
      // Get user role first
      const role = await dbQueries.getUserRole(profile.id);
      setUserRole(role);
      
      // Run messaging permission tests
      const results = await testMessagingPermissions(profile.id, role || 'unknown');
      setTestResults(results);
    } catch (error) {
      console.error('Error running tests:', error);
    } finally {
      setIsRunning(false);
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

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Messaging Permissions Test</CardTitle>
        <CardDescription>
          Test messaging system permissions and access control for the current user
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">
              Current User: <span className="font-medium">{profile?.full_name}</span>
            </p>
            {userRole && (
              <p className="text-sm text-gray-600">
                Role: <span className="font-medium capitalize">{userRole}</span>
              </p>
            )}
          </div>
          <Button 
            onClick={runTests} 
            disabled={isRunning || !profile?.id}
            className="flex items-center space-x-2"
          >
            <Play className="h-4 w-4" />
            <span>{isRunning ? 'Running Tests...' : 'Run Tests'}</span>
          </Button>
        </div>

        {testResults.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Test Results</h3>
            {testResults.map((result, index) => (
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
            
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium">
                Summary: {testResults.filter(r => r.passed).length} / {testResults.length} tests passed
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};