'use server';

import { getDb, reports, listings, users, messages } from '@/db';
import { eq } from 'drizzle-orm';
import { requireUser } from '@/lib/auth';
import { reportSchema, type ReportInput } from '@/lib/validate';
import { AppError } from '@/lib/errors';
import { actionError, type ActionResult } from './result';

export async function createReportAction(input: ReportInput): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const data = reportSchema.parse(input);
    const db = getDb();

    if (data.targetType === 'user' && data.targetId === user.id) {
      throw new AppError('لا يمكنك الإبلاغ عن حسابك');
    }

    if (data.targetType === 'listing') {
      const [l] = await db.select({ id: listings.id }).from(listings).where(eq(listings.id, data.targetId)).limit(1);
      if (!l) throw new AppError('الإعلان غير موجود', 404);
    } else if (data.targetType === 'user') {
      const [u] = await db.select({ id: users.id }).from(users).where(eq(users.id, data.targetId)).limit(1);
      if (!u) throw new AppError('المستخدم غير موجود', 404);
    } else if (data.targetType === 'message') {
      const [m] = await db.select({ id: messages.id }).from(messages).where(eq(messages.id, data.targetId)).limit(1);
      if (!m) throw new AppError('الرسالة غير موجودة', 404);
    }

    await db.insert(reports).values({
      reporterId: user.id,
      targetType: data.targetType,
      targetId: data.targetId,
      reason: data.reason,
      details: data.details || null
    });
    return { ok: true };
  } catch (err) {
    return actionError(err);
  }
}
