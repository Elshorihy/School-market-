'use server';

import { getDb, listings, listingImages, categories } from '@/db';
import { and, eq } from 'drizzle-orm';
import { requireUser, AuthError } from '@/lib/auth';
import { listingSchema, type ListingInput } from '@/lib/validate';
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

function normalizePrice(input: { type: string; price?: string }): string | null {
  if (input.type === 'free') return null;
  if (input.price === undefined || input.price === '') return null;
  const n = Number(input.price);
  if (!Number.isFinite(n)) throw new AppError('السعر غير صالح');
  return n.toFixed(2);
}

export async function createListingAction(input: ListingInput): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    const data = listingSchema.parse(input);
    const db = getDb();
    await assertActiveCategory(data.categoryId);
    await validateGeoChain({
      governorateId: data.governorateId,
      areaId: data.areaId,
      schoolId: data.schoolId || null
    });

    const price = normalizePrice({ type: data.type, price: data.price });
    const [listing] = await db
      .insert(listings)
      .values({
        userId: user.id,
        type: data.type,
        title: data.title,
        description: data.description,
        price,
        categoryId: data.categoryId,
        governorateId: data.governorateId,
        areaId: data.areaId,
        schoolId: data.schoolId || null,
        condition: data.condition,
        status: 'active'
      })
      .returning({ id: listings.id });

    if (data.imageUrls.length > 0) {
      await db.insert(listingImages).values(
        data.imageUrls.map((url, i) => ({ listingId: listing.id, url, position: i }))
      );
    }

    // Notify students whose "wanted" requests match this listing (non-AI rules).
    await notifyWantedOwners(db, {
      id: listing.id,
      title: data.title,
      description: data.description,
      categoryId: data.categoryId,
      governorateId: data.governorateId,
      areaId: data.areaId,
      schoolId: data.schoolId || null,
      userId: user.id
    });

    return { ok: true, data: { id: listing.id } };
  } catch (err) {
    return actionError(err);
  }
}

const OWNER_STATUSES = new Set(['active', 'sold', 'exchanged', 'closed']);

export async function updateListingAction(
  id: string,
  input: ListingInput
): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const data = listingSchema.parse(input);
    const db = getDb();

    const [listing] = await db.select().from(listings).where(eq(listings.id, id)).limit(1);
    if (!listing) throw new AppError('الإعلان غير موجود', 404);
    if (listing.userId !== user.id && user.role !== 'admin') {
      throw new AuthError('لا تملك صلاحية تعديل هذا الإعلان', 403);
    }

    await assertActiveCategory(data.categoryId);
    await validateGeoChain({
      governorateId: data.governorateId,
      areaId: data.areaId,
      schoolId: data.schoolId || null
    });

    const price = normalizePrice({ type: data.type, price: data.price });
    await db
      .update(listings)
      .set({
        type: data.type,
        title: data.title,
        description: data.description,
        price,
        categoryId: data.categoryId,
        governorateId: data.governorateId,
        areaId: data.areaId,
        schoolId: data.schoolId || null,
        condition: data.condition,
        updatedAt: new Date()
      })
      .where(eq(listings.id, id));

    await db.delete(listingImages).where(eq(listingImages.listingId, id));
    if (data.imageUrls.length > 0) {
      await db.insert(listingImages).values(
        data.imageUrls.map((url, i) => ({ listingId: id, url, position: i }))
      );
    }
    return { ok: true };
  } catch (err) {
    return actionError(err);
  }
}

export async function deleteListingAction(id: string): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const db = getDb();
    const [listing] = await db.select().from(listings).where(eq(listings.id, id)).limit(1);
    if (!listing) throw new AppError('الإعلان غير موجود', 404);
    if (listing.userId !== user.id && user.role !== 'admin') {
      throw new AuthError('لا تملك صلاحية حذف هذا الإعلان', 403);
    }
    await db.delete(listings).where(eq(listings.id, id));
    return { ok: true };
  } catch (err) {
    return actionError(err);
  }
}

/** Owners can mark their own listing sold / exchanged / closed. */
export async function setOwnListingStatusAction(
  id: string,
  status: 'active' | 'sold' | 'exchanged' | 'closed'
): Promise<ActionResult> {
  try {
    if (!OWNER_STATUSES.has(status)) throw new AppError('حالة غير صالحة');
    const user = await requireUser();
    const db = getDb();
    const [listing] = await db.select().from(listings).where(eq(listings.id, id)).limit(1);
    if (!listing) throw new AppError('الإعلان غير موجود', 404);
    if (listing.userId !== user.id) {
      throw new AuthError('لا تملك صلاحية تغيير حالة هذا الإعلان', 403);
    }
    await db
      .update(listings)
      .set({ status, updatedAt: new Date() })
      .where(eq(listings.id, id));
    return { ok: true };
  } catch (err) {
    return actionError(err);
  }
}
