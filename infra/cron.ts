// infra/cron.ts
import { cluster } from "./network";
import { DATABASE_URL, DIRECT_URL } from "./secrets";

// This task defines the container for processing recurring invoices.
// It's configured to run our Go application from the specified Dockerfile.
export const RecurringInvoiceTask = new sst.aws.Task("RecurringInvoiceTask", {
  cluster,
  image: {
    dockerfile: "Dockerfile.cron",
    context: "packages/go-serverless",
  },
  cpu: "0.25 vCPU",
  memory: "0.5 GB",
  environment: {
    RUN_ONCE: "true",
  },
  link: [DATABASE_URL, DIRECT_URL],
});

// This cron job triggers the RecurringInvoiceTask to run daily.
export const RecurringInvoiceSchedule = new sst.aws.Cron("RecurringInvoiceSchedule", {
  schedule: "cron(0 6 * * ? *)", // 6:00 AM UTC daily
  job: {
    task: RecurringInvoiceTask,
  },
});
