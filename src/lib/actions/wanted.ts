'use server';

import { getDb, wantedItems, categories, users, listings } from '@/db';
import { and, eq } from 'drizzle-orm';
import { requireUser, AuthError } from '@/lib/auth';
import { wantedSchema, wantedStatusSchema, type WantedInput } from '@/lib/validate';
import { validateGeoChain } from '@/lib/geo';
import { AppError } from '@/lib/errors';
import { actionError, type ActionResult } from './result';
import { createNotification, notifyWantedOwners } from '@/lib/notify';

async function assertActiveCategory(categoryId: string) {
  const db = getDb();
  const [cat] = await db
    .select({ id: categories.id, isActive: categories.isActive })
    .from(categories)
    .where(eq(categories.id, categoryId))
    .limit(1);
  if (!cat) throw new AppError('التصنيف غير موجود');
  if (!cat.isActive) throw new AppError('هذا التصنيف غير متاح حاليًا');
}

export async function createWantedAction(input: WantedInput): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    const data = wantedSchema.parse(input);
    const db = getDb();
    await assertActiveCategory(data.categoryId);
    await validateGeoChain({
      governorateId: data.governorateId,
      areaId: data.areaId,
      schoolId: data.schoolId || null
    });

    const [item] = await db
      .insert(wantedItems)
      .values({
        userId: user.id,
        title: data.title,
        description: data.description,
        categoryId: data.categoryId,
        governorateId: data.governorateId,
        areaId: data.areaId,
        schoolId: data.schoolId || null,
        status: 'open'
      })
      .returning({ id: wantedItems.id });

    // Notify owners of existing active listings that match this request.
    const kwParts: string[] = [];
    const { extractKeywords } = await import('@/lib/match');
    const keywords = extractKeywords(`${data.title} ${data.description}`, 3);
    if (keywords.length > 0) {
      const { or, ilike } = await import('drizzle-orm');
      const candidates = await db
        .select()
        .from(listings)
        .where(
          and(
            eq(listings.status, 'active'),
            eq(listings.categoryId, data.categoryId),
            eq(listings.governorateId, data.governorateId),
            or(
              eq(listings.areaId, data.areaId),
              ...(data.schoolId ? [eq(listings.schoolId, data.schoolId)] : []),
              or(...keywords.map((k) => or(ilike(listings.title, `%${k}%`), ilike(listings.description, `%${k}%`))))
            )
          )
        )
        .limit(10);
      const notifs = candidates
        .filter((l) => l.userId !== user.id)
        .map((l) => ({
          userId: l.userId,
          type: 'match' as const,
          title: 'طلب يطابق إعلانك',
          body: `طالب يبحث عن شيء يطابق إعلانك «${l.title}»: ${data.title}`,
          link: `/listings/${l.id}`
        }));
      await Promise.all(notifs.map((n) => createNotification(db, n)));
    }

    return { ok: true, data: { id: item.id } };
  } catch (err) {
    return actionError(err);
  }
}

export async function updateWantedAction(id: string, input: WantedInput): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const data = wantedSchema.parse(input);
    const db = getDb();
    const [item] = await db.select().from(wantedItems).where(eq(wantedItems.id, id)).limit(1);
    if (!item) throw new AppError('الطلب غير موجود', 404);
    if (item.userId !== user.id && user.role !== 'admin') {
      throw new AuthError('لا تملك صلاحية تعديل هذا الطلب', 403);
    }
    await assertActiveCategory(data.categoryId);
    await validateGeoChain({
      governorateId: data.governorateId,
      areaId: data.areaId,
      schoolId: data.schoolId || null
    });
    await db
      .update(wantedItems)
      .set({
        title: data.title,
        description: data.description,
        categoryId: data.categoryId,
        governorateId: data.governorateId,
        areaId: data.areaId,
        schoolId: data.schoolId || null,
        status: data.status ?? item.status,
        updatedAt: new Date()
      })
      .where(eq(wantedItems.id, id));
    return { ok: true };
  } catch (err) {
    return actionError(err);
  }
}

export async function setOwnWantedStatusAction(
  id: string,
  status: 'open' | 'found' | 'closed'
): Promise<ActionResult> {
  try {
    const user = await requireUser();
    wantedStatusSchema.parse(status);
    const db = getDb();
    const [item] = await db.select().from(wantedItems).where(eq(wantedItems.id, id)).limit(1);
    if (!item) throw new AppError('الطلب غير موجود', 404);
    if (item.userId !== user.id) {
      throw new AuthError('لا تملك صلاحية تعديل هذا الطلب', 403);
    }
    await db
      .update(wantedItems)
      .set({ status, updatedAt: new Date() })
      .where(eq(wantedItems.id, id));
    return { ok: true };
  } catch (err) {
    return actionError(err);
  }
}

export async function deleteWantedAction(id: string): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const db = getDb();
    const [item] = await db.select().from(wantedItems).where(eq(wantedItems.id, id)).limit(1);
    if (!item) throw new AppError('الطلب غير موجود', 404);
    if (item.userId !== user.id && user.role !== 'admin') {
      throw new AuthError('لا تملك صلاحية حذف هذا الطلب', 403);
    }
    await db.delete(wantedItems).where(eq(wantedItems.id, id));
    return { ok: true };
  } catch (err) {
    return actionError(err);
  }
}
