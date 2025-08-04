/// <reference path="../.sst/platform/config.d.ts" />

import { DATABASE_URL, DIRECT_URL } from "./secrets";

export const honoServerApp = new sst.aws.Function("HonoServerApp", {
  handler: "packages/hono-server-app/src/index.handler",
  runtime: "nodejs20.x",
  timeout: "30 seconds",
  memory: "0.5 GB",
  link: [DATABASE_URL, DIRECT_URL],
  url: true,
});

export const honoServerUrl = new sst.aws.Router("HonoServerUrl", {
  routes: {
    "/api/cross-schema/*": honoServerApp.url,
  },
});