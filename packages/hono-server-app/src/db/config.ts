import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@payflow/core/db/schema';

// Create database connection
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not configured. Please check your environment variables.');
}

const client = postgres(databaseUrl);
export const db = drizzle(client, { schema });

export type DB = typeof db;