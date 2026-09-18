import 'dotenv/config';
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

declare global {
  // eslint-disable-next-line no-var
  var __smDb: ReturnType<typeof createDb> | undefined;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function createDb() {
  const url = requireEnv('DATABASE_URL');
  const pool = new pg.Pool({
    connectionString: url,
    max: 10,
    idleTimeoutMillis: 30_000
  });
  return drizzle(pool, { schema });
}

export function getDb() {
  if (typeof globalThis.__smDb === 'undefined') {
    globalThis.__smDb = createDb();
  }
  return globalThis.__smDb;
}

export type Db = ReturnType<typeof getDb>;
export * as schema from './schema';
export * from './schema';
export { eq, and, or, asc, desc, sql, inArray, ilike, count, gt, gte, lt, lte, ne, isNull, isNotNull, not } from 'drizzle-orm';
