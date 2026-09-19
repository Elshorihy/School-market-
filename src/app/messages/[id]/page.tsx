import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getDb, conversations, messages, users } from '@/db';
import { and, asc, eq, isNull } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';
import { areBlocked } from '@/lib/blockcheck';
import { ChatRoom } from '@/components/messages/ChatRoom';
import { PageLoader } from '@/components/ui/Misc';

export const metadata: Metadata = {
  title: 'المحادثة',
  robots: { index: false }
};

export const dynamic = 'force-dynamic';

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/messages');
  const db = getDb();

  const [conv] = await db.select().from(conversations).where(eq(conversations.id, id)).limit(1);
  if (!conv) notFound();
  if (conv.userIdA !== user.id && conv.userIdB !== user.id) notFound();

  const otherId = conv.userIdA === user.id ? conv.userIdB : conv.userIdA;
  const [otherRows, msgs, blocked] = await Promise.all([
    db.select({ id: users.id, name: users.name, avatarUrl: users.avatarUrl }).from(users).where(eq(users.id, otherId)).limit(1),
    db
      .select({ id: messages.id, body: messages.body, senderId: messages.senderId, createdAt: messages.createdAt })
      .from(messages)
      .where(eq(messages.conversationId, conv.id))
      .orderBy(asc(messages.createdAt), asc(messages.id))
      .limit(300),
    areBlocked(db, user.id, otherId)
  ]);
  const other = otherRows[0];
  if (!other) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <div className="card overflow-hidden">
        <ChatRoom
          conversationId={conv.id}
          otherName={other.name}
          selfId={user.id}
          blocked={blocked}
          initialMessages={msgs.map((m) => ({
            id: m.id,
            body: m.body,
            senderId: m.senderId,
            createdAt: m.createdAt.toISOString()
          }))}
        />
      </div>
    </div>
  );
}
