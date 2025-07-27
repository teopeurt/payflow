import { schemaClient } from '../database/schema-client';
import { getSupabase } from '@payflow/core/integrations/supabase/client';

export interface PerformanceTestResult {
  test: string;
  metric: string;
  value: number;
  unit: string;
  passed: boolean;
  threshold?: number;
  details?: string;
}

export class RealtimePerformanceTest {
  private testResults: PerformanceTestResult[] = [];

  async runAllTests(): Promise<PerformanceTestResult[]> {
    this.testResults = [];

    await this.testRealtimeMessageLatency();
    await this.testDatabaseQueryPerformance();
    await this.testSubscriptionSetupTime();
    await this.testConcurrentConnectionHandling();
    await this.testDataThroughput();

    return this.testResults;
  }

  private async testRealtimeMessageLatency(): Promise<void> {
    const testName = 'Real-time Message Latency';
    
    try {
      // Create test thread
      const { data: thread, error: threadError } = await schemaClient.messaging
        .message_threads()
        .insert({
          subject: 'Performance Test Thread',
          created_by: 'test-user-id',
          status: 'active'
        })
        .select('*')
        .single();

      if (threadError) throw threadError;

      const latencies: number[] = [];
      const messageCount = 10;

      for (let i = 0; i < messageCount; i++) {
        const startTime = performance.now();
        
        // Send message
        const { error: msgError } = await schemaClient.messaging
          .messages()
          .insert({
            thread_id: thread.id,
            sender_id: 'test-user-id',
            content: `Performance test message ${i + 1}`,
            message_type: 'text'
          });

        if (msgError) throw msgError;

        const endTime = performance.now();
        latencies.push(endTime - startTime);
        
        // Small delay between messages
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
      const maxLatency = Math.max(...latencies);

      this.testResults.push({
        test: testName,
        metric: 'Average Message Send Latency',
        value: avgLatency,
        unit: 'ms',
        passed: avgLatency < 500,
        threshold: 500,
        details: `Tested ${messageCount} messages`
      });

      this.testResults.push({
        test: testName,
        metric: 'Maximum Message Send Latency',
        value: maxLatency,
        unit: 'ms',
        passed: maxLatency < 1000,
        threshold: 1000
      });

      // Cleanup
      await schemaClient.messaging.message_threads().delete().eq('id', thread.id);

    } catch (error) {
      this.testResults.push({
        test: testName,
        metric: 'Test Execution',
        value: 0,
        unit: 'status',
        passed: false,
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async testDatabaseQueryPerformance(): Promise<void> {
    const testName = 'Database Query Performance';
    
    try {
      const queries = [
        {
          name: 'Simple Profile Query',
          query: () => schemaClient.app.profiles().select('*').limit(1),
          threshold: 200
        },
        {
          name: 'Complex Invoice Query with Joins',
          query: () => schemaClient.finance.invoices()
            .select(`
              *,
              organization:organizations(*),
              project:projects(*),
              items:invoice_items(*)
            `)
            .limit(10),
          threshold: 800
        },
        {
          name: 'Message Thread with Messages',
          query: () => schemaClient.messaging.message_threads()
            .select(`
              *,
              messages(*),
              participants:message_participants(*)
            `)
            .limit(5),
          threshold: 600
        }
      ];

      for (const queryTest of queries) {
        const iterations = 5;
        const times: number[] = [];

        for (let i = 0; i < iterations; i++) {
          const startTime = performance.now();
          await queryTest.query();
          const endTime = performance.now();
          times.push(endTime - startTime);
        }

        const avgTime = times.reduce((a, b) => a + b, 0) / times.length;

        this.testResults.push({
          test: testName,
          metric: queryTest.name,
          value: avgTime,
          unit: 'ms',
          passed: avgTime < queryTest.threshold,
          threshold: queryTest.threshold,
          details: `Average of ${iterations} iterations`
        });
      }

    } catch (error) {
      this.testResults.push({
        test: testName,
        metric: 'Test Execution',
        value: 0,
        unit: 'status',
        passed: false,
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async testSubscriptionSetupTime(): Promise<void> {
    const testName = 'Real-time Subscription Setup';
    
    try {
      const setupTimes: number[] = [];
      const subscriptionCount = 5;

      for (let i = 0; i < subscriptionCount; i++) {
        const startTime = performance.now();
        
        const subscription = getSupabase()
          .channel(`perf-test-${i}`)
          .on('postgres_changes', {
            event: 'INSERT',
            schema: 'messaging',
            table: 'messages'
          }, () => {})
          .subscribe();

        const endTime = performance.now();
        setupTimes.push(endTime - startTime);

        // Cleanup
        await getSupabase().removeChannel(subscription);
      }

      const avgSetupTime = setupTimes.reduce((a, b) => a + b, 0) / setupTimes.length;

      this.testResults.push({
        test: testName,
        metric: 'Average Subscription Setup Time',
        value: avgSetupTime,
        unit: 'ms',
        passed: avgSetupTime < 100,
        threshold: 100,
        details: `Tested ${subscriptionCount} subscriptions`
      });

    } catch (error) {
      this.testResults.push({
        test: testName,
        metric: 'Test Execution',
        value: 0,
        unit: 'status',
        passed: false,
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async testConcurrentConnectionHandling(): Promise<void> {
    const testName = 'Concurrent Connection Handling';
    
    try {
      const concurrentQueries = 20;
      const startTime = performance.now();

      const promises = Array.from({ length: concurrentQueries }, (_, i) =>
        schemaClient.app.profiles()
          .select('id, full_name')
          .limit(1)
          .then(() => ({ success: true, index: i }))
          .catch(error => ({ success: false, index: i, error: error.message }))
      );

      const results = await Promise.all(promises);
      const endTime = performance.now();

      const successCount = results.filter(r => r.success).length;
      const totalTime = endTime - startTime;
      const avgTimePerQuery = totalTime / concurrentQueries;

      this.testResults.push({
        test: testName,
        metric: 'Concurrent Query Success Rate',
        value: (successCount / concurrentQueries) * 100,
        unit: '%',
        passed: successCount === concurrentQueries,
        threshold: 100,
        details: `${successCount}/${concurrentQueries} queries succeeded`
      });

      this.testResults.push({
        test: testName,
        metric: 'Average Time Per Concurrent Query',
        value: avgTimePerQuery,
        unit: 'ms',
        passed: avgTimePerQuery < 50,
        threshold: 50,
        details: `${concurrentQueries} concurrent queries`
      });

    } catch (error) {
      this.testResults.push({
        test: testName,
        metric: 'Test Execution',
        value: 0,
        unit: 'status',
        passed: false,
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async testDataThroughput(): Promise<void> {
    const testName = 'Data Throughput';
    
    try {
      // Test bulk insert performance
      const batchSize = 50;
      const testData = Array.from({ length: batchSize }, (_, i) => ({
        subject: `Throughput test thread ${i}`,
        created_by: 'test-user-id',
        status: 'active' as const
      }));

      const startTime = performance.now();
      
      const { data: insertedThreads, error: insertError } = await schemaClient.messaging
        .message_threads()
        .insert(testData)
        .select('id');

      if (insertError) throw insertError;

      const insertEndTime = performance.now();
      const insertTime = insertEndTime - startTime;

      // Test bulk read performance
      const readStartTime = performance.now();
      
      const { data: readThreads, error: readError } = await schemaClient.messaging
        .message_threads()
        .select('*')
        .in('id', insertedThreads!.map(t => t.id));

      if (readError) throw readError;

      const readEndTime = performance.now();
      const readTime = readEndTime - readStartTime;

      // Calculate throughput metrics
      const insertThroughput = batchSize / (insertTime / 1000); // records per second
      const readThroughput = batchSize / (readTime / 1000); // records per second

      this.testResults.push({
        test: testName,
        metric: 'Bulk Insert Throughput',
        value: insertThroughput,
        unit: 'records/sec',
        passed: insertThroughput > 10,
        threshold: 10,
        details: `${batchSize} records in ${insertTime.toFixed(2)}ms`
      });

      this.testResults.push({
        test: testName,
        metric: 'Bulk Read Throughput',
        value: readThroughput,
        unit: 'records/sec',
        passed: readThroughput > 50,
        threshold: 50,
        details: `${batchSize} records in ${readTime.toFixed(2)}ms`
      });

      // Cleanup
      await schemaClient.messaging
        .message_threads()
        .delete()
        .in('id', insertedThreads!.map(t => t.id));

    } catch (error) {
      this.testResults.push({
        test: testName,
        metric: 'Test Execution',
        value: 0,
        unit: 'status',
        passed: false,
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  getTestSummary(): {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    passRate: number;
    slowestTests: PerformanceTestResult[];
  } {
    const passedTests = this.testResults.filter(r => r.passed).length;
    const failedTests = this.testResults.filter(r => !r.passed).length;
    const passRate = (passedTests / this.testResults.length) * 100;
    
    const slowestTests = this.testResults
      .filter(r => r.unit === 'ms')
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    return {
      totalTests: this.testResults.length,
      passedTests,
      failedTests,
      passRate,
      slowestTests
    };
  }
}

export const testRealtimePerformance = async (): Promise<PerformanceTestResult[]> => {
  const tester = new RealtimePerformanceTest();
  return await tester.runAllTests();
};