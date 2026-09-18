/**
 * Runs Drizzle SQL migrations from the ./drizzle folder.
 * Usage: npm run db:migrate
 */
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';
import path from 'node:path';

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL is not set. Set it in .env first.');
    process.exit(1);
  }
  const pool = new pg.Pool({ connectionString: url });
  const db = drizzle(pool);
  const folder = path.join(process.cwd(), 'drizzle');
  await migrate(db, { migrationsFolder: folder });
  console.log('Migrations applied successfully.');
  await pool.end();
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
