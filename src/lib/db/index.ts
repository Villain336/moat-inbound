import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

let _db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (_db) return _db;

  const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('POSTGRES_URL or DATABASE_URL environment variable is required');
  }

  const sql = neon(connectionString);
  _db = drizzle(sql, { schema });
  return _db;
}

// Proxy that lazily initializes — compatible with all existing `db.xxx` calls
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop) {
    return (getDb() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
