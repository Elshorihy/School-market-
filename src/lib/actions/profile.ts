'use server';

import { getDb, users, blocks, listings, notifications } from '@/db';
import { and, eq, desc } from 'drizzle-orm';
import { requireUser, requireAdmin, AuthError } from '@/lib/auth';
import { profileSchema, type ProfileInput } from '@/lib/validate';
import { validateGeoChain } from '@/lib/geo';
import { AppError } from '@/lib/errors';
import { actionError, type ActionResult } from './result';
import { createNotification } from '@/lib/notify';

export async function updateProfileAction(input: ProfileInput): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const data = profileSchema.parse(input);
    const db = getDb();

    const gov = data.governorateId || null;
    const area = data.areaId || null;
    const school = data.schoolId || null;
    await validateGeoChain({ governorateId: gov, areaId: area, schoolId: school });

    await db
      .update(users)
      .set({
        name: data.name,
        bio: data.bio || null,
        avatarUrl: data.avatarUrl || null,
        governorateId: gov,
        areaId: area,
        schoolId: school,
        updatedAt: new Date()
      })
      .where(eq(users.id, user.id));
    return { ok: true };
  } catch (err) {
    return actionError(err);
  }
}

/* ---------------- Blocks ---------------- */

export async function blockUserAction(targetId: string): Promise<ActionResult> {
  try {
    const user = await requireUser();
    if (targetId === user.id) throw new AppError('لا يمكنك حظر نفسك');
    const db = getDb();
    const [target] = await db.select({ id: users.id }).from(users).where(eq(users.id, targetId)).limit(1);
    if (!target) throw new AppError('المستخدم غير موجود');
    await db
      .insert(blocks)
      .values({ blockerId: user.id, blockedId: targetId })
      .onConflictDoNothing({ target: [blocks.blockerId, blocks.blockedId] });
    return { ok: true };
  } catch (err) {
    return actionError(err);
  }
}

export async function unblockUserAction(targetId: string): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const db = getDb();
    await db
      .delete(blocks)
      .where(and(eq(blocks.blockerId, user.id), eq(blocks.blockedId, targetId)));
    return { ok: true };
  } catch (err) {
    return actionError(err);
  }
}

export async function getBlockedUsersAction(): Promise<
  ActionResult<{ id: string; name: string; createdAt: Date }[]>
> {
  try {
    const user = await requireUser();
    const db = getDb();
    const rows = await db
      .select({ id: users.id, name: users.name, createdAt: blocks.createdAt })
      .from(blocks)
      .innerJoin(users, eq(blocks.blockedId, users.id))
      .where(eq(blocks.blockerId, user.id))
      .orderBy(desc(blocks.createdAt));
    return { ok: true, data: rows };
  } catch (err) {
    return actionError(err, 'تعذر تحميل قائمة الحظر');
  }
}
