import { NextResponse } from 'next/server';
import { getDb, categories } from '@/db';
import { asc, eq } from 'drizzle-orm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Public list of active categories. */
export async function GET() {
  const db = getDb();
  const rows = await db
    .select({ id: categories.id, name: categories.name, icon: categories.icon })
    .from(categories)
    .where(eq(categories.isActive, true))
    .orderBy(asc(categories.sort));
  return NextResponse.json({ ok: true, data: rows });
}
