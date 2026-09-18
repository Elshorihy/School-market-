import { and, eq, gt, isNull, or } from 'drizzle-orm';
import { getDb } from '@/db';
import { notifications, wantedItems } from '@/db/schema';
import { extractKeywords } from './match';

export type Db = ReturnType<typeof getDb>;

export type NotificationType =
  | 'message'
  | 'favorite'
  | 'match'
  | 'listing_status'
  | 'moderation'
  | 'report'
  | 'system';

export interface NewNotification {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string | null;
}

/**
 * Create a notification while avoiding duplicate spam:
 * if the same user already has an unread notification of the same
 * type+link created within the last hour, skip it.
 */
export async function createNotification(db: Db, n: NewNotification): Promise<boolean> {
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const dupFilter = n.link ? eq(notifications.link, n.link) : isNull(notifications.link);
  const dups = await db
    .select({ id: notifications.id })
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, n.userId),
        eq(notifications.type, n.type),
        dupFilter,
        isNull(notifications.readAt),
        gt(notifications.createdAt, hourAgo)
      )
    )
    .limit(1);
  if (dups.length > 0) return false;

  await db.insert(notifications).values({
    userId: n.userId,
    type: n.type,
    title: n.title,
    body: n.body,
    link: n.link ?? null
  });
  return true;
}

export async function createNotificationsBulk(db: Db, list: NewNotification[]): Promise<number> {
  if (list.length === 0) return 0;
  let created = 0;
  for (const n of list) {
    if (await createNotification(db, n)) created++;
  }
  return created;
}

export async function markAllRead(db: Db, userId: string): Promise<void> {
  const now = new Date();
  await db
    .update(notifications)
    .set({ readAt: now })
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
}

export async function markRead(db: Db, userId: string, id: string): Promise<void> {
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
}

export async function unreadCount(db: Db, userId: string): Promise<number> {
  const rows = await db
    .select({ id: notifications.id })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)))
    .limit(500);
  return rows.length;
}

export interface ListingSummary {
  id: string;
  title: string;
  description: string;
  categoryId: string | null;
  governorateId: string | null;
  areaId: string | null;
  schoolId: string | null;
  userId: string;
}

/**
 * Notify owners of open wanted items that match a newly created/updated
 * listing. Pure rule-based matching (no AI):
 *   same category AND same governorate AND (same area/school OR keyword overlap)
 */
export async function notifyWantedOwners(db: Db, listing: ListingSummary): Promise<number> {
  if (!listing.categoryId || !listing.governorateId || !listing.areaId) return 0;
  const keywords = extractKeywords(`${listing.title} ${listing.description}`).slice(0, 3);

  const candidates = await db
    .select()
    .from(wantedItems)
    .where(
      and(
        eq(wantedItems.status, 'open'),
        eq(wantedItems.categoryId, listing.categoryId),
        eq(wantedItems.governorateId, listing.governorateId),
        or(
          eq(wantedItems.areaId, listing.areaId),
          ...(listing.schoolId ? [eq(wantedItems.schoolId, listing.schoolId)] : [])
        )
      )
    )
    .limit(25);

  const notifs: NewNotification[] = [];
  for (const wanted of candidates) {
    if (wanted.userId === listing.userId) continue;
    const text = `${wanted.title} ${wanted.description}`.toLowerCase();
    const byGeo =
      (wanted.areaId !== null && wanted.areaId === listing.areaId) ||
      (wanted.schoolId !== null && wanted.schoolId === listing.schoolId);
    const byKeyword = keywords.some((kw) => text.includes(kw));
    if (!byGeo && !byKeyword) continue;
    notifs.push({
      userId: wanted.userId,
      type: 'match',
      title: 'مطابقة جديدة لطلبك',
      body: `يوجد إعلان «${listing.title}» يطابق طلبك «${wanted.title}»`,
      link: `/listings/${listing.id}`
    });
  }
  return createNotificationsBulk(db, notifs);
}
