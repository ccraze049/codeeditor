import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure Neon for serverless environment with better error handling
neonConfig.webSocketConstructor = ws;
neonConfig.useSecureWebSocket = process.env.NODE_ENV === 'production';
neonConfig.pipelineConnect = false;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create pool with SSL configuration for development
let pool: Pool;
try {
  pool = new Pool({ 
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
} catch (error) {
  console.error('Database pool creation failed:', error);
  // Create a fallback pool without SSL for development
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
}

export { pool };
export const db = drizzle({ client: pool, schema });