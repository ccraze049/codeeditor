import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from "@shared/schema";

// Use environment database URL (configured by Replit)
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined');
}

// Create pool with optimized configuration for Replit
let pool: Pool;
try {
  pool = new Pool({ 
    connectionString: DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 10, // Maximum pool size
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
  console.log('Database pool created successfully');
} catch (error) {
  console.error('Database pool creation failed:', error);
  // Create a minimal fallback pool
  pool = new Pool({ 
    connectionString: DATABASE_URL,
    ssl: false 
  });
}

export { pool };
export const db = drizzle({ client: pool, schema });