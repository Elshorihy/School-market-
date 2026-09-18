import { NextResponse } from 'next/server';
import { getDb, conversations, conversationParticipants, messages } from '@/db';
import { and, eq, or } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Total unread messages across all conversations of the current user. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  const db = getDb();

  const convs = await db
    .select({ id: conversations.id })
    .from(conversations)
    .where(or(eq(conversations.userIdA, user.id), eq(conversations.userIdB, user.id)));
  if (convs.length === 0) return NextResponse.json({ ok: true, data: { unread: 0 } });

  const ids = convs.map((c) => c.id);
  const reads = await db
    .select({
      conversationId: conversationParticipants.conversationId,
      readAt: conversationParticipants.readAt
    })
    .from(conversationParticipants)
    .where(and(eq(conversationParticipants.userId, user.id), or(...ids.map((id) => eq(conversationParticipants.conversationId, id)))));
  const readMap = new Map(reads.map((r) => [r.conversationId, r.readAt ?? null]));

  const recent = await db
    .select({
      conversationId: messages.conversationId,
      senderId: messages.senderId,
      createdAt: messages.createdAt
    })
    .from(messages)
    .where(or(...ids.map((id) => eq(messages.conversationId, id))))
    .limit(2000);

  let unread = 0;
  for (const m of recent) {
    if (m.senderId === user.id) continue;
    const readAt = readMap.get(m.conversationId);
    if (!readAt || m.createdAt > readAt) unread++;
  }
  return NextResponse.json({ ok: true, data: { unread } });
}
