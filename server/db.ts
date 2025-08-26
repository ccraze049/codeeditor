import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure Neon for serverless environment
neonConfig.webSocketConstructor = ws;
neonConfig.useSecureWebSocket = false; // Disable secure WebSocket for development
neonConfig.pipelineConnect = false;

// Use local database URL instead of environment variable
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/codespace';

// Create pool with simple configuration
let pool: Pool;
try {
  pool = new Pool({ 
    connectionString: DATABASE_URL,
    ssl: false // Disable SSL for development
  });
  console.log('Database pool created successfully');
} catch (error) {
  console.error('Database pool creation failed:', error);
  // Create a minimal fallback pool
  pool = new Pool({ connectionString: DATABASE_URL });
}

export { pool };
export const db = drizzle({ client: pool, schema });