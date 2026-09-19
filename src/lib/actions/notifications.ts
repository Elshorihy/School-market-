'use server';

import { getDb, notifications } from '@/db';
import { eq } from 'drizzle-orm';
import { requireUser } from '@/lib/auth';
import { AppError } from '@/lib/errors';
import { actionError, type ActionResult } from './result';
import { markAllRead, markRead } from '@/lib/notify';

export async function markNotificationReadAction(id: string): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const db = getDb();
    const [n] = await db.select().from(notifications).where(eq(notifications.id, id)).limit(1);
    if (!n) throw new AppError('الإشعار غير موجود', 404);
    if (n.userId !== user.id) throw new AppError('غير مصرح لك', 403);
    await markRead(db, user.id, id);
    return { ok: true };
  } catch (err) {
    return actionError(err);
  }
}

export async function markAllNotificationsReadAction(): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const db = getDb();
    await markAllRead(db, user.id);
    return { ok: true };
  } catch (err) {
    return actionError(err);
  }
}
