// infra/secrets.ts
// Defines secrets for the application to securely manage sensitive data.

export const DATABASE_URL = new sst.Secret("DATABASE_URL");
export const DIRECT_URL = new sst.Secret("DIRECT_URL");
export const SUPABASE_URL = new sst.Secret("SUPABASE_URL");
export const SUPABASE_ANON_KEY = new sst.Secret("SUPABASE_ANON_KEY");
