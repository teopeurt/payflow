import { bucket } from "./storage";

// Create a TypeScript function that will handle recurring invoice processing
// This approach uses a Node.js runtime to execute our Go service
export const recurringInvoiceProcessor = new sst.aws.Function("RecurringInvoiceProcessor", {
  handler: "packages/functions/src/recurring-invoice.handler",
  runtime: "nodejs20.x",
  timeout: "15 minutes", // Give enough time for processing
  memory: "1024 MB", // More memory for Go compilation if needed
  environment: {
    RUN_ONCE: "true",
    // DATABASE_URL should be set via environment or AWS Secrets Manager
    NODE_ENV: "production",
  },
  link: [bucket],
  // Install Go in the Lambda layer for runtime compilation
  layers: [
    // You would need to create a custom layer with Go runtime
    // "arn:aws:lambda:us-east-1:123456789012:layer:go-runtime:1"
  ],
});

// Create a CloudWatch Event Rule to trigger the function daily
export const recurringInvoiceCron = new sst.aws.Cron("RecurringInvoiceCron", {
  schedule: "rate(1 day)", // Run daily
  job: {
    function: recurringInvoiceProcessor,
  },
});

// Alternative: Create a more specific schedule (daily at 6 AM UTC)
export const recurringInvoiceSchedule = new sst.aws.Cron("RecurringInvoiceSchedule", {
  schedule: "cron(0 6 * * ? *)", // 6:00 AM UTC every day
  job: {
    function: recurringInvoiceProcessor,
    payload: JSON.stringify({
      source: "scheduled",
      time: "daily-6am-utc"
    })
  },
});

// Optional: Create a manual trigger function for testing
export const manualInvoiceProcessor = new sst.aws.Function("ManualInvoiceProcessor", {
  handler: "packages/go-serverless/cmd/scheduler/main.go", 
  runtime: "provided.al2023",
  url: true, // Enable Function URL for manual testing
  timeout: "5 minutes",
  memory: "256 MB",
  environment: {
    RUN_ONCE: "true",
  },
});

// Recommended approach: Use AWS ECS/Fargate with EventBridge for Go services
// This provides better support for Go applications than Lambda
export const recurringInvoiceTask = new sst.aws.Service("RecurringInvoiceTask", {
  image: {
    dockerfile: "packages/go-serverless/Dockerfile.cron",
    context: "packages/go-serverless",
  },
  cpu: "0.25 vCPU",
  memory: "512 MB",
  environment: {
    RUN_ONCE: "true",
    // DATABASE_URL will be injected at runtime
  },
  // Configure for scheduled execution
  scaling: {
    min: 0, // Scale to zero when not running
    max: 1, // Only one instance needed for cron job
  },
});

// Create EventBridge rule to trigger the containerized task
export const recurringInvoiceEventRule = new sst.aws.Cron("RecurringInvoiceEventRule", {
  schedule: "cron(0 6 * * ? *)", // 6:00 AM UTC daily
  job: {
    service: recurringInvoiceTask,
  },
});

// Alternative: Use AWS Batch for more complex job scheduling
// This approach is better for longer-running or resource-intensive tasks
export const recurringInvoiceBatch = new sst.aws.Job("RecurringInvoiceBatch", {
  image: {
    dockerfile: "packages/go-serverless/Dockerfile.cron",
    context: "packages/go-serverless",
  },
  cpu: "0.25 vCPU",
  memory: "512 MB",
  timeout: "30 minutes",
  environment: {
    RUN_ONCE: "true",
  },
});

// EventBridge rule for AWS Batch job
export const batchCronRule = new sst.aws.Cron("BatchCronRule", {
  schedule: "rate(1 day)",
  job: {
    job: recurringInvoiceBatch,
  },
});