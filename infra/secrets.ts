// infra/secrets.ts
// Defines secrets for the application to securely manage sensitive data.

export const DATABASE_URL = new sst.Secret("DATABASE_URL");
export const DIRECT_URL = new sst.Secret("DIRECT_URL");
