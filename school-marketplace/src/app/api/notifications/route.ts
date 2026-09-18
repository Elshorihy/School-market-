import { NextResponse } from 'next/server';
import { getDb, notifications } from '@/db';
import { eq, desc } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  const db = getDb();
  const items = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, user.id))
    .orderBy(desc(notifications.createdAt))
    .limit(8);
  const unread = items.filter((r) => !r.readAt).length;
  return NextResponse.json({
    ok: true,
    data: {
      unread,
      items: items.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        body: n.body,
        link: n.link,
        readAt: n.readAt,
        createdAt: n.createdAt.toISOString()
      }))
    }
  });
}
