import { NextResponse } from 'next/server';
import { getDb, conversations, messages } from '@/db';
import { and, eq, gt, asc } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  const db = getDb();
  const [conv] = await db.select().from(conversations).where(eq(conversations.id, params.id)).limit(1);
  if (!conv) return NextResponse.json({ ok: false, error: 'not found' }, { status: 404 });
  if (conv.userIdA !== user.id && conv.userIdB !== user.id) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  }

  const url = new URL(req.url);
  const after = url.searchParams.get('after');
  const msgs = await db
    .select()
    .from(messages)
    .where(and(eq(messages.conversationId, params.id), after ? gt(messages.id, after) : undefined))
    .orderBy(asc(messages.createdAt), asc(messages.id))
    .limit(200);

  return NextResponse.json({
    ok: true,
    data: msgs.map((m) => ({
      id: m.id,
      body: m.body,
      senderId: m.senderId,
      createdAt: m.createdAt.toISOString()
    }))
  });
}
