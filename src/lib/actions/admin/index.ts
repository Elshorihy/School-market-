'use server';

import {
  getDb,
  users,
  sessions,
  listings,
  wantedItems,
  categories,
  governorates,
  areas,
  schools,
  reports,
  favorites,
  conversationParticipants,
  conversations
} from '@/db';
import { and, eq, inArray, or, sql, count } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth';
import {
  categorySchema,
  governorateSchema,
  areaSchema,
  schoolSchema,
  listingStatusSchema,
  userStatusSchema,
  reportStatusSchema,
  wantedStatusSchema,
  uuid
} from '@/lib/validate';
import { AppError } from '@/lib/errors';
import { actionError, type ActionResult } from '../result';
import { createNotification } from '@/lib/notify';

/* ---------------- Users ---------------- */

export async function setUserStatusAction(
  userId: string,
  status: 'active' | 'suspended'
): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    userStatusSchema.parse(status);
    if (userId === admin.id) throw new AppError('لا يمكنك تغيير حالة حسابك');
    const db = getDb();
    const [target] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!target) throw new AppError('المستخدم غير موجود', 404);

    await db.update(users).set({ status, updatedAt: new Date() }).where(eq(users.id, userId));
    if (status === 'suspended') {
      await db.delete(sessions).where(eq(sessions.userId, userId));
      await createNotification(db, {
        userId,
        type: 'moderation',
        title: 'تم تعليق حسابك',
        body: 'تم تعليق حسابك من قِبل إدارة المنصة. إن كنت ترى أن هذا خطأ، تواصل معنا.'
      });
    }
    return { ok: true };
  } catch (err) {
    return actionError(err);
  }
}

export async function deleteUserAction(userId: string): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    if (userId === admin.id) throw new AppError('لا يمكنك حذف حسابك');
    const db = getDb();
    const [target] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!target) throw new AppError('المستخدم غير موجود', 404);

    const [activeListings] = await db
      .select({ n: count() })
      .from(listings)
      .where(and(eq(listings.userId, userId), eq(listings.status, 'active')));
    if (activeListings && activeListings.n > 0) {
      throw new AppError(
        `لا يمكن الحذف: لدى المستخدم ${activeListings.n} إعلان نشط. علّق الحساب أو احذف إعلاناته أولًا`
      );
    }

    // Safe cascade: listings (inactive), wanted, favorites, messages,
    // notifications and sessions are removed with the account.
    await db.transaction(async (tx) => {
      await tx.delete(listings).where(eq(listings.userId, userId));
      await tx.delete(wantedItems).where(eq(wantedItems.userId, userId));
      await tx.delete(favorites).where(eq(favorites.userId, userId));
      await tx.delete(users).where(eq(users.id, userId));
    });
    return { ok: true };
  } catch (err) {
    return actionError(err);
  }
}

/* ---------------- Listings ---------------- */

export async function setAdminListingStatusAction(
  listingId: string,
  status: 'active' | 'sold' | 'exchanged' | 'closed' | 'pending' | 'removed'
): Promise<ActionResult> {
  try {
    await requireAdmin();
    listingStatusSchema.parse(status);
    const db = getDb();
    const [listing] = await db.select().from(listings).where(eq(listings.id, listingId)).limit(1);
    if (!listing) throw new AppError('الإعلان غير موجود', 404);
    await db
      .update(listings)
      .set({ status, updatedAt: new Date() })
      .where(eq(listings.id, listingId));
    const labels: Record<string, string> = {
      active: 'تم تفعيل إعلانك',
      sold: 'تم وضع إعلانك بحالة «تم البيع»',
      exchanged: 'تم وضع إعلانك بحالة «تم التبادل»',
      closed: 'تم إغلاق إعلانك',
      pending: 'إعلانك بانتظار المراجعة',
      removed: 'تمت إزالة إعلانك لمخالفته الشروط'
    };
    await createNotification(db, {
      userId: listing.userId,
      type: 'listing_status',
      title: 'تحديث حالة إعلانك',
      body: labels[status],
      link: `/listings/${listingId}`
    });
    return { ok: true };
  } catch (err) {
    return actionError(err);
  }
}

export async function hardDeleteListingAction(listingId: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const db = getDb();
    const [listing] = await db.select().from(listings).where(eq(listings.id, listingId)).limit(1);
    if (!listing) throw new AppError('الإعلان غير موجود', 404);
    await db.delete(listings).where(eq(listings.id, listingId));
    return { ok: true };
  } catch (err) {
    return actionError(err);
  }
}

/* ---------------- Wanted ---------------- */

export async function setWantedStatusAction(id: string, status: 'open' | 'found' | 'closed'): Promise<ActionResult> {
  try {
    await requireAdmin();
    wantedStatusSchema.parse(status);
    const db = getDb();
    const [item] = await db.select().from(wantedItems).where(eq(wantedItems.id, id)).limit(1);
    if (!item) throw new AppError('الطلب غير موجود', 404);
    await db
      .update(wantedItems)
      .set({ status, updatedAt: new Date() })
      .where(eq(wantedItems.id, id));
    return { ok: true };
  } catch (err) {
    return actionError(err);
  }
}

export async function deleteWantedAdminAction(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const db = getDb();
    await db.delete(wantedItems).where(eq(wantedItems.id, id));
    return { ok: true };
  } catch (err) {
    return actionError(err);
  }
}

/* ---------------- Categories ---------------- */

export async function upsertCategoryAction(input: {
  id?: string;
  name: string;
  icon: string;
  isActive: boolean;
}): Promise<ActionResult> {
  try {
    await requireAdmin();
    const data = categorySchema.parse({ name: input.name, icon: input.icon, isActive: input.isActive });
    const db = getDb();
    if (input.id) {
      uuid.parse(input.id);
      await db
        .update(categories)
        .set({ name: data.name, icon: data.icon || null, isActive: data.isActive })
        .where(eq(categories.id, input.id));
      return { ok: true };
    }
    await db
      .insert(categories)
      .values({ name: data.name, icon: data.icon || null, isActive: data.isActive })
      .onConflictDoNothing({ target: categories.name });
    return { ok: true };
  } catch (err) {
    return actionError(err);
  }
}

export async function deleteCategoryAction(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const db = getDb();
    const [cat] = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
    if (!cat) throw new AppError('التصنيف غير موجود', 404);
    const [usage] = await db
      .select({ n: count() })
      .from(listings)
      .where(eq(listings.categoryId, id));
    if (usage && usage.n > 0) {
      throw new AppError('لا يمكن حذف تصنيف مستخدم في إعلانات. عطّله بدلًا من ذلك');
    }
    const [wantedUsage] = await db.select({ n: count() }).from(wantedItems).where(eq(wantedItems.categoryId, id));
    if (wantedUsage && wantedUsage.n > 0) {
      throw new AppError('لا يمكن حذف تصنيف مستخدم في طلبات «مطلوب». عطّله بدلًا من ذلك');
    }
    await db.delete(categories).where(eq(categories.id, id));
    return { ok: true };
  } catch (err) {
    return actionError(err);
  }
}

/* ---------------- Governorates ---------------- */

export async function upsertGovernorateAction(input: { id?: string; name: string }): Promise<ActionResult> {
  try {
    await requireAdmin();
    const data = governorateSchema.parse({ name: input.name });
    const db = getDb();
    if (input.id) {
      uuid.parse(input.id);
      const [existing] = await db
        .select({ id: governorates.id })
        .from(governorates)
        .where(eq(governorates.name, data.name))
        .limit(1);
      if (existing && existing.id !== input.id) {
        throw new AppError('توجد محافظة بهذا الاسم بالفعل');
      }
      await db.update(governorates).set({ name: data.name }).where(eq(governorates.id, input.id));
      return { ok: true };
    }
    await db
      .insert(governorates)
      .values({ name: data.name })
      .onConflictDoNothing({ target: governorates.name });
    return { ok: true };
  } catch (err) {
    return actionError(err);
  }
}

export async function deleteGovernorateAction(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const db = getDb();
    const [g] = await db.select().from(governorates).where(eq(governorates.id, id)).limit(1);
    if (!g) throw new AppError('المحافظة غير موجودة', 404);
    const [areaCount] = await db.select({ n: count() }).from(areas).where(eq(areas.governorateId, id));
    const [userCount] = await db.select({ n: count() }).from(users).where(eq(users.governorateId, id));
    if ((areaCount?.n ?? 0) > 0 || (userCount?.n ?? 0) > 0) {
      throw new AppError(
        'لا يمكن حذف محافظة مرتبطة بمراكز أو مستخدمين. انقل البيانات أولًا أو احذف مراكزها واحدًا تلو الآخر'
      );
    }
    await db.delete(governorates).where(eq(governorates.id, id));
    return { ok: true };
  } catch (err) {
    return actionError(err);
  }
}

/* ---------------- Areas ---------------- */

export async function upsertAreaAction(input: {
  id?: string;
  name: string;
  governorateId?: string | 'unchanged';
}): Promise<ActionResult> {
  try {
    await requireAdmin();
    const db = getDb();
    if (input.id) {
      uuid.parse(input.id);
      const [cur] = await db.select().from(areas).where(eq(areas.id, input.id)).limit(1);
      if (!cur) throw new AppError('المركز غير موجود', 404);
      const targetGov = input.governorateId && input.governorateId !== 'unchanged' ? input.governorateId : cur.governorateId;
      areaSchema.parse({ name: input.name, governorateId: targetGov });
      const [gov] = await db.select({ id: governorates.id }).from(governorates).where(eq(governorates.id, targetGov)).limit(1);
      if (!gov) throw new AppError('المحافظة غير موجودة');
      await db.update(areas).set({ name: input.name.trim(), governorateId: targetGov }).where(eq(areas.id, input.id));
      return { ok: true };
    }
    if (!input.governorateId) throw new AppError('اختر المحافظة');
    const data = areaSchema.parse({ name: input.name, governorateId: input.governorateId });
    const [gov] = await db.select({ id: governorates.id }).from(governorates).where(eq(governorates.id, data.governorateId)).limit(1);
    if (!gov) throw new AppError('المحافظة غير موجودة');
    await db
      .insert(areas)
      .values({ name: data.name, governorateId: data.governorateId })
      .onConflictDoNothing({ target: [areas.name, areas.governorateId] });
    return { ok: true };
  } catch (err) {
    return actionError(err);
  }
}

export async function deleteAreaAction(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const db = getDb();
    const [area] = await db.select().from(areas).where(eq(areas.id, id)).limit(1);
    if (!area) throw new AppError('المركز غير موجود', 404);
    const [schoolCount] = await db.select({ n: count() }).from(schools).where(eq(schools.areaId, id));
    const [userCount] = await db.select({ n: count() }).from(users).where(eq(users.areaId, id));
    const [listingCount] = await db.select({ n: count() }).from(listings).where(eq(listings.areaId, id));
    const [wantedCount] = await db.select({ n: count() }).from(wantedItems).where(eq(wantedItems.areaId, id));
    const used = (schoolCount?.n ?? 0) + (userCount?.n ?? 0) + (listingCount?.n ?? 0) + (wantedCount?.n ?? 0);
    if (used > 0) {
      throw new AppError(
        `لا يمكن حذف مركز مرتبط ببيانات (${used} سجل). انقل المدارس والمستخدمين والإعلانات إلى مركز آخر أولًا`
      );
    }
    await db.delete(areas).where(eq(areas.id, id));
    return { ok: true };
  } catch (err) {
    return actionError(err);
  }
}

/* ---------------- Schools ---------------- */

export async function upsertSchoolAction(input: {
  id?: string;
  name: string;
  areaId?: string | 'unchanged';
  isActive: boolean;
}): Promise<ActionResult> {
  try {
    await requireAdmin();
    const db = getDb();
    let effectiveAreaId: string;
    if (input.id) {
      uuid.parse(input.id);
      const [cur] = await db.select().from(schools).where(eq(schools.id, input.id)).limit(1);
      if (!cur) throw new AppError('المدرسة غير موجودة', 404);
      effectiveAreaId = input.areaId && input.areaId !== 'unchanged' ? input.areaId : cur.areaId;
    } else {
      if (!input.areaId || input.areaId === 'unchanged') throw new AppError('اختر المركز');
      effectiveAreaId = input.areaId;
    }
    const data = schoolSchema.parse({ name: input.name, areaId: effectiveAreaId, isActive: input.isActive });
    const [area] = await db.select().from(areas).where(eq(areas.id, data.areaId)).limit(1);
    if (!area) throw new AppError('المركز غير موجود');
    if (input.id) {
      await db
        .update(schools)
        .set({ name: data.name, areaId: data.areaId, isActive: data.isActive })
        .where(eq(schools.id, input.id));
      return { ok: true };
    }
    await db
      .insert(schools)
      .values({ name: data.name, areaId: data.areaId, isActive: data.isActive })
      .onConflictDoNothing({ target: [schools.name, schools.areaId] });
    return { ok: true };
  } catch (err) {
    return actionError(err);
  }
}

export async function deleteSchoolAction(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const db = getDb();
    const [school] = await db.select().from(schools).where(eq(schools.id, id)).limit(1);
    if (!school) throw new AppError('المدرسة غير موجودة', 404);
    const [userCount] = await db.select({ n: count() }).from(users).where(eq(users.schoolId, id));
    const [listingCount] = await db.select({ n: count() }).from(listings).where(eq(listings.schoolId, id));
    if ((userCount?.n ?? 0) + (listingCount?.n ?? 0) > 0) {
      throw new AppError('لا يمكن حذف مدرسة مرتبطة بمستخدمين أو إعلانات. عطّلها بدلًا من ذلك');
    }
    await db.delete(schools).where(eq(schools.id, id));
    return { ok: true };
  } catch (err) {
    return actionError(err);
  }
}

/* ---------------- Reports ---------------- */

export async function setReportStatusAction(
  reportId: string,
  status: 'open' | 'resolved' | 'dismissed',
  adminNote?: string
): Promise<ActionResult> {
  try {
    await requireAdmin();
    reportStatusSchema.parse(status);
    const db = getDb();
    const [report] = await db.select().from(reports).where(eq(reports.id, reportId)).limit(1);
    if (!report) throw new AppError('البلاغ غير موجود', 404);
    await db
      .update(reports)
      .set({
        status,
        adminNote: adminNote ?? report.adminNote,
        resolvedAt: status === 'open' ? null : new Date()
      })
      .where(eq(reports.id, reportId));
    if (status === 'resolved' && report.targetType === 'listing') {
      const [listing] = await db.select().from(listings).where(eq(listings.id, report.targetId)).limit(1);
      if (listing) {
        await createNotification(db, {
          userId: listing.userId,
          type: 'report',
          title: 'نتيجة بلاغ على إعلانك',
          body: 'تمت مراجعة البلاغ على إعلانك واتخاذ القرار اللازم',
          link: `/listings/${listing.id}`
        });
      }
    }
    return { ok: true };
  } catch (err) {
    return actionError(err);
  }
}

/** Enforce action on a report target: remove the listing. */
export async function enforceRemoveListingFromReportAction(reportId: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const db = getDb();
    const [report] = await db.select().from(reports).where(eq(reports.id, reportId)).limit(1);
    if (!report || report.targetType !== 'listing') throw new AppError('البلاغ غير صالح');
    await db
      .update(listings)
      .set({ status: 'removed', updatedAt: new Date() })
      .where(eq(listings.id, report.targetId));
    await db
      .update(reports)
      .set({ status: 'resolved', resolvedAt: new Date() })
      .where(eq(reports.id, reportId));
    return { ok: true };
  } catch (err) {
    return actionError(err);
  }
}

/** Enforce action on a report target: suspend the reported user. */
export async function enforceSuspendUserFromReportAction(reportId: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const db = getDb();
    const [report] = await db.select().from(reports).where(eq(reports.id, reportId)).limit(1);
    if (!report || report.targetType !== 'user') throw new AppError('البلاغ غير صالح');
    await db.update(users).set({ status: 'suspended', updatedAt: new Date() }).where(eq(users.id, report.targetId));
    await db.delete(sessions).where(eq(sessions.userId, report.targetId));
    await db
      .update(reports)
      .set({ status: 'resolved', resolvedAt: new Date() })
      .where(eq(reports.id, reportId));
    return { ok: true };
  } catch (err) {
    return actionError(err);
  }
}

/* ---------------- Settings ---------------- */

export async function changeAdminPasswordAction(oldPassword: string, newPassword: string): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const { verifyPassword, hashPassword } = await import('@/lib/password');
    if (!verifyPassword(oldPassword, admin.passwordHash)) {
      throw new AppError('كلمة المرور الحالية غير صحيحة');
    }
    const { passwordSchema } = await import('@/lib/validate');
    passwordSchema.parse(newPassword);
    const db = getDb();
    await db
      .update(users)
      .set({ passwordHash: hashPassword(newPassword), updatedAt: new Date() })
      .where(eq(users.id, admin.id));
    return { ok: true };
  } catch (err) {
    return actionError(err);
  }
}
