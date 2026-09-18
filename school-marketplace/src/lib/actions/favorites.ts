'use server';

import { getDb, favorites, listings, users } from '@/db';
import { and, eq } from 'drizzle-orm';
import { requireUser } from '@/lib/auth';
import { AppError } from '@/lib/errors';
import { actionError, type ActionResult } from './result';
import { createNotification } from '@/lib/notify';

export async function toggleFavoriteAction(listingId: string): Promise<ActionResult<{ isFavorite: boolean }>> {
  try {
    const user = await requireUser();
    const db = getDb();

    const [listing] = await db.select().from(listings).where(eq(listings.id, listingId)).limit(1);
    if (!listing || listing.status === 'removed') throw new AppError('الإعلان غير موجود', 404);
    if (listing.userId === user.id) {
      throw new AppError('لا يمكنك إضافة إعلانك الخاص إلى المفضلة');
    }

    const existing = await db
      .select({ id: favorites.id })
      .from(favorites)
      .where(and(eq(favorites.userId, user.id), eq(favorites.listingId, listingId)))
      .limit(1);

    if (existing.length > 0) {
      await db.delete(favorites).where(eq(favorites.id, existing[0].id));
      return { ok: true, data: { isFavorite: false } };
    }

    // Unique constraint prevents duplicates even under concurrent requests.
    await db
      .insert(favorites)
      .values({ userId: user.id, listingId })
      .onConflictDoNothing({ target: [favorites.userId, favorites.listingId] });

    await createNotification(db, {
      userId: listing.userId,
      type: 'favorite',
      title: 'إعلانك في المفضلة',
      body: `أضاف أحد الطلاب إعلانك «${listing.title}» إلى المفضلة`,
      link: `/listings/${listing.id}`
    });

    return { ok: true, data: { isFavorite: true } };
  } catch (err) {
    return actionError(err);
  }
}
