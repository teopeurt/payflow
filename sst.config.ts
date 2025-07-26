/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "monorepo-template",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "aws",
    };
  },
  async run() {
    const storage = await import("./infra/storage");
    await import("./infra/api");
    const cron = await import("./infra/cron");

    return {
      MyBucket: storage.bucket.name,
      RecurringInvoiceProcessor: cron.recurringInvoiceProcessor.arn,
      RecurringInvoiceCron: cron.recurringInvoiceCron.name,
      ManualProcessorUrl: cron.manualInvoiceProcessor.url,
      RecurringInvoiceTask: cron.recurringInvoiceTask.service,
      RecurringInvoiceBatch: cron.recurringInvoiceBatch.name,
    };
  },
});
