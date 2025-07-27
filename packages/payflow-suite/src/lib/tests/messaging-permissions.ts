import { schemaClient } from '../database/schema-client';
import { dbQueries } from '../database/queries';

export interface TestResult {
  test: string;
  passed: boolean;
  error?: string;
}

export class MessagingPermissionsTest {
  private userId: string;
  private userRole: string;

  constructor(userId: string, userRole: string) {
    this.userId = userId;
    this.userRole = userRole;
  }

  async runAllTests(): Promise<TestResult[]> {
    const results: TestResult[] = [];

    // Test 1: User can access their own threads
    results.push(await this.testThreadAccess());

    // Test 2: User can send messages
    results.push(await this.testMessageSending());

    // Test 3: User can mark messages as read
    results.push(await this.testMessageReadStatus());

    // Test 4: Role-based thread visibility
    results.push(await this.testRoleBasedAccess());

    return results;
  }

  private async testThreadAccess(): Promise<TestResult> {
    try {
      const { data, error } = await schemaClient.messaging
        .message_threads()
        .select('*')
        .limit(1);

      if (error) throw error;

      return {
        test: 'Thread Access',
        passed: true
      };
    } catch (error) {
      return {
        test: 'Thread Access',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async testMessageSending(): Promise<TestResult> {
    try {
      // First get or create a test thread
      let { data: threads } = await schemaClient.messaging
        .message_threads()
        .select('id')
        .limit(1);

      if (!threads || threads.length === 0) {
        // Create a test thread
        const { data: newThread, error: threadError } = await schemaClient.messaging
          .message_threads()
          .insert({
            subject: 'Test Thread',
            created_by: this.userId,
            status: 'active'
          })
          .select('id')
          .single();

        if (threadError) throw threadError;
        threads = [newThread];
      }

      const threadId = threads[0].id;

      // Try to send a test message
      const { error } = await schemaClient.messaging
        .messages()
        .insert({
          thread_id: threadId,
          sender_id: this.userId,
          content: 'Test message for permissions check',
          message_type: 'text'
        });

      if (error) throw error;

      return {
        test: 'Message Sending',
        passed: true
      };
    } catch (error) {
      return {
        test: 'Message Sending',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async testMessageReadStatus(): Promise<TestResult> {
    try {
      // Get a thread
      const { data: threads } = await schemaClient.messaging
        .message_threads()
        .select('id')
        .limit(1);

      if (!threads || threads.length === 0) {
        return {
          test: 'Message Read Status',
          passed: false,
          error: 'No threads available for testing'
        };
      }

      const threadId = threads[0].id;

      // Try to mark thread as read
      const { error } = await schemaClient.messaging
        .message_read_status()
        .upsert({
          thread_id: threadId,
          user_id: this.userId,
          read_at: new Date().toISOString()
        });

      if (error) throw error;

      return {
        test: 'Message Read Status',
        passed: true
      };
    } catch (error) {
      return {
        test: 'Message Read Status',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async testRoleBasedAccess(): Promise<TestResult> {
    try {
      // Test that role-based queries work
      const role = await dbQueries.getUserRole(this.userId);
      
      if (role !== this.userRole) {
        return {
          test: 'Role-Based Access',
          passed: false,
          error: `Expected role ${this.userRole}, got ${role}`
        };
      }

      // Test permission checking
      const hasPermission = await dbQueries.hasPermission(this.userId, 'messages', 'read');
      
      return {
        test: 'Role-Based Access',
        passed: hasPermission
      };
    } catch (error) {
      return {
        test: 'Role-Based Access',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export const testMessagingPermissions = async (userId: string, userRole: string): Promise<TestResult[]> => {
  const tester = new MessagingPermissionsTest(userId, userRole);
  return await tester.runAllTests();
};