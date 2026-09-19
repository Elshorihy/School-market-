'use server';

import {
  getDb,
  conversations,
  conversationParticipants,
  messages,
  users
} from '@/db';
import { and, eq, or, asc, sql, isNull } from 'drizzle-orm';
import { requireUser, AuthError } from '@/lib/auth';
import { messageSchema, startConversationSchema } from '@/lib/validate';
import { AppError } from '@/lib/errors';
import { actionError, type ActionResult } from './result';
import { areBlocked } from '@/lib/blockcheck';
import { createNotification } from '@/lib/notify';

/**
 * Find (or create) the 1:1 conversation with another user.
 * Pair ids are normalized (a < b) + unique constraint, so concurrent
 * requests cannot create duplicate conversations.
 */
export async function startConversationAction(
  withUserId: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    startConversationSchema.parse({ withUserId });
    if (withUserId === user.id) throw new AppError('لا يمكنك بدء محادثة مع نفسك');
    const db = getDb();

    const [other] = await db
      .select({ id: users.id, status: users.status })
      .from(users)
      .where(eq(users.id, withUserId))
      .limit(1);
    if (!other) throw new AppError('المستخدم غير موجود', 404);
    if (other.status === 'suspended') {
      throw new AppError('لا يمكن الإرسال إلى هذا المستخدم');
    }
    if (await areBlocked(db, user.id, withUserId)) {
      throw new AppError('تم حظر هذا المستخدم أو حظرته');
    }

    const a = user.id < withUserId ? user.id : withUserId;
    const b = user.id < withUserId ? withUserId : user.id;

    const [existing] = await db
      .select({ id: conversations.id })
      .from(conversations)
      .where(and(eq(conversations.userIdA, a), eq(conversations.userIdB, b)))
      .limit(1);

    if (existing) return { ok: true, data: { id: existing.id } };

    try {
      const [created] = await db
        .insert(conversations)
        .values({ userIdA: a, userIdB: b })
        .returning({ id: conversations.id });
      await db.insert(conversationParticipants).values([
        { conversationId: created.id, userId: user.id },
        { conversationId: created.id, userId: withUserId }
      ]);
      return { ok: true, data: { id: created.id } };
    } catch (e) {
      // Lost a race: the unique constraint rejected our insert; re-fetch.
      const [again] = await db
        .select({ id: conversations.id })
        .from(conversations)
        .where(and(eq(conversations.userIdA, a), eq(conversations.userIdB, b)))
        .limit(1);
      if (again) return { ok: true, data: { id: again.id } };
      throw e;
    }
  } catch (err) {
    return actionError(err);
  }
}

export async function sendMessageAction(
  conversationId: string,
  body: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    const data = messageSchema.parse({ conversationId, body });
    const db = getDb();

    const [conv] = await db.select().from(conversations).where(eq(conversations.id, conversationId)).limit(1);
    if (!conv) throw new AppError('المحادثة غير موجودة', 404);

    // Membership check: only the two participants may send.
    if (conv.userIdA !== user.id && conv.userIdB !== user.id) {
      throw new AuthError('لست طرفًا في هذه المحادثة', 403);
    }
    if (await areBlocked(db, user.id, conv.userIdA === user.id ? conv.userIdB : conv.userIdA)) {
      throw new AppError('لا يمكن الإرسال بسبب الحظر');
    }

    const otherId = conv.userIdA === user.id ? conv.userIdB : conv.userIdA;

    const [msg] = await db
      .insert(messages)
      .values({ conversationId, senderId: user.id, body: data.body })
      .returning({ id: messages.id });

    await db
      .insert(conversationParticipants)
      .values({ conversationId, userId: user.id })
      .onConflictDoNothing();

    await createNotification(db, {
      userId: otherId,
      type: 'message',
      title: 'رسالة جديدة',
      body: `رسالة جديدة بخصوص إعلانك`,
      link: `/messages/${conversationId}`
    });

    return { ok: true, data: { id: msg.id } };
  } catch (err) {
    return actionError(err);
  }
}

export async function markConversationReadAction(conversationId: string): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const db = getDb();
    const [conv] = await db.select().from(conversations).where(eq(conversations.id, conversationId)).limit(1);
    if (!conv) throw new AppError('المحادثة غير موجودة', 404);
    if (conv.userIdA !== user.id && conv.userIdB !== user.id) {
      throw new AuthError('لست طرفًا في هذه المحادثة', 403);
    }
    await db
      .insert(conversationParticipants)
      .values({ conversationId, userId: user.id, readAt: new Date() })
      .onConflictDoUpdate({
        target: [conversationParticipants.conversationId, conversationParticipants.userId],
        set: { readAt: new Date() }
      });
    return { ok: true };
  } catch (err) {
    return actionError(err);
  }
}
