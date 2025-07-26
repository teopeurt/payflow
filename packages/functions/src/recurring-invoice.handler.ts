import { execSync } from 'child_process';

export const handler = async (event: any, context: any) => {
  console.log('Starting recurring invoice processing...', { event, context });
  
  try {
    // Set environment variables
    process.env.RUN_ONCE = 'true';
    process.env.DATABASE_URL = process.env.DATABASE_URL || '';
    
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is required');
    }
    
    // Execute the Go scheduler binary
    // Note: In a real deployment, you would package the Go binary with the Lambda function
    const output = execSync('go run /opt/scheduler/main.go', {
      cwd: process.cwd(),
      encoding: 'utf8',
      timeout: 14 * 60 * 1000, // 14 minutes (Lambda max is 15 minutes)
      env: {
        ...process.env,
        RUN_ONCE: 'true',
      }
    });
    
    console.log('Recurring invoice processing completed:', output);
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Recurring invoice processing completed successfully',
        output: output.substring(0, 1000), // Limit output size
        timestamp: new Date().toISOString(),
      }),
    };
    
  } catch (error: any) {
    console.error('Error processing recurring invoices:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to process recurring invoices',
        message: error.message,
        timestamp: new Date().toISOString(),
      }),
    };
  }
};