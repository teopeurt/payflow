/// <reference path="../.sst/platform/config.d.ts" />

import { DATABASE_URL, DIRECT_URL, SUPABASE_URL, SUPABASE_ANON_KEY } from "./secrets";

export const honoServerApp = new sst.aws.Function("HonoServerApp", {
  handler: "packages/hono-server-app/src/index.handler",
  runtime: "nodejs20.x",
  timeout: "30 seconds",
  memory: "0.5 GB",
  link: [DATABASE_URL, DIRECT_URL, SUPABASE_URL, SUPABASE_ANON_KEY],
  environment: {
    DATABASE_URL: DATABASE_URL.value,
    DIRECT_URL: DIRECT_URL.value,
    SUPABASE_URL: SUPABASE_URL.value,
    SUPABASE_ANON_KEY: SUPABASE_ANON_KEY.value,
  },
  url: true,
});

export const honoServerUrl = new sst.aws.Router("HonoServerUrl", {
  routes: {
    "/api/cross-schema/*": honoServerApp.url,
  },
  transform: {
    origin: {
      responseHeadersPolicy: {
        corsConfig: {
          accessControlAllowCredentials: false,
          accessControlAllowHeaders: {
            items: ["*"]
          },
          accessControlAllowMethods: {
            items: ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
          },
          accessControlAllowOrigins: {
            items: ["*"]
          },
          originOverride: true
        }
      }
    }
  }
});