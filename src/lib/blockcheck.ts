import { and, eq, or } from 'drizzle-orm';
import { blocks } from '@/db/schema';
import type { Db } from './notify';

/** True when either user blocked the other (server-side gate for messaging). */
export async function areBlocked(db: Db, a: string, b: string): Promise<boolean> {
  const rows = await db
    .select({ id: blocks.id })
    .from(blocks)
    .where(
      or(
        and(eq(blocks.blockerId, a), eq(blocks.blockedId, b)),
        and(eq(blocks.blockerId, b), eq(blocks.blockedId, a))
      )
    )
    .limit(1);
  return rows.length > 0;
}
