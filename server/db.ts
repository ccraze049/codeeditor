import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from "@shared/schema";

// Use environment database URL (configured by Replit)
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined');
}

// Use HTTP connection instead of WebSocket for better reliability in Replit
const sql = neon(DATABASE_URL);
export const db = drizzle({ client: sql, schema });

console.log('Database connection configured successfully (HTTP mode)');