/// <reference path="../.sst/platform/config.d.ts" />

export const honoServerApp = new sst.aws.Function("HonoServerApp", {
  handler: "packages/hono-server-app/src/index.handler",
  runtime: "nodejs20.x",
  timeout: "30 seconds",
  memory: "512 MB",
  environment: {
    DATABASE_URL: $interpolate`${process.env.DATABASE_URL}`,
    DIRECT_URL: $interpolate`${process.env.DIRECT_URL}`,
  },
  url: true,
});

export const honoServerUrl = new sst.aws.Router("HonoServerUrl", {
  routes: {
    "/api/cross-schema/*": honoServerApp.url,
  },
});