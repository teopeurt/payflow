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
    await import("./infra/network");
    const storage = await import("./infra/storage");
    // await import("./infra/api");
    const cron = await import("./infra/cron");
    const honoServer = await import("./infra/hono-server");

    return {
      MyBucket: storage.bucket.name,
      RecurringInvoiceSchedule: cron.RecurringInvoiceSchedule.urn,
      RecurringInvoiceTask: cron.RecurringInvoiceTask.taskDefinition,
      HonoServerApp: honoServer.honoServerApp.url,
      HonoServerUrl: honoServer.honoServerUrl.url,
    };
  },
});
