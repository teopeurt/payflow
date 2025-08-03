import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

config({ path: '.env' });
export default defineConfig({
  schemaFilter: ['public', 'auth', 'finance', 'messaging', 'audit', 'hr', 'app'],
  schema: './src/db/schema.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  extensionsFilters: ['postgis'],
  tablesFilter: '*',
  introspect: {
    casing: 'camel',
  },
  migrations: {
    prefix: 'timestamp',
    table: '__drizzle_migrations__',
    schema: 'public',
  },
  entities: {
    roles: {
      provider: '',
      exclude: [],
      include: [],
    },
  },
  // breakpoints: true,
  // strict: true,
  verbose: true,
});
