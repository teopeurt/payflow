import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@payflow/core/src/db/schema';

// Create database connection
const client = postgres(process.env.DATABASE_URL!);
export const db = drizzle(client, { schema });

export type DB = typeof db;