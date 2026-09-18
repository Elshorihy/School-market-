import { and, asc, count, desc, eq, gt, ilike, inArray, or, sql } from 'drizzle-orm';
import { getDb } from '@/db';
import {
  areas,
  categories,
  conversationParticipants,
  conversations,
  favorites,
  governorates,
  listingImages,
  listings,
  messages,
  schools,
  users,
  wantedItems
} from '@/db/schema';
import type { ListingFilters } from './validate';
import type { ListingWithExtras, User } from '@/types';
import { clampInt } from './utils';

export const PAGE_SIZE = 20;

const listingBase = {
  id: listings.id,
  userId: listings.userId,
  type: listings.type,
  title: listings.title,
  description: listings.description,
  price: listings.price,
  categoryId: listings.categoryId,
  governorateId: listings.governorateId,
  areaId: listings.areaId,
  schoolId: listings.schoolId,
  condition: listings.condition,
  status: listings.status,
  createdAt: listings.createdAt,
  updatedAt: listings.updatedAt,
  sellerName: users.name,
  sellerId: users.id,
  sellerAvatarUrl: users.avatarUrl,
  categoryName: categories.name,
  categoryIcon: categories.icon,
  governorateName: governorates.name,
  areaName: areas.name,
  schoolName: schools.name
};

async function attachImagesAndFavorites(db: ReturnType<typeof getDb>, items: any[], userId: string | null) {
  if (items.length === 0) return items as ListingWithExtras[];
  const ids = items.map((i) => i.id);
  const images = await db
    .select({ listingId: listingImages.listingId, url: listingImages.url, position: listingImages.position })
    .from(listingImages)
    .where(inArray(listingImages.listingId, ids))
    .orderBy(asc(listingImages.position));
  const favs = userId
    ? await db
        .select({ listingId: favorites.listingId })
        .from(favorites)
        .where(and(eq(favorites.userId, userId), inArray(favorites.listingId, ids)))
    : [];
  const imgMap = new Map<string, { url: string; position: number }[]>();
  for (const img of images) {
    const arr = imgMap.get(img.listingId) ?? [];
    arr.push({ url: img.url, position: img.position });
    imgMap.set(img.listingId, arr);
  }
  const favSet = new Set(favs.map((f) => f.listingId));
  return items.map((i) => ({
    ...i,
    images: imgMap.get(i.id) ?? [],
    isFavorite: favSet.has(i.id)
  })) as unknown as ListingWithExtras[];
}

export interface ListingQueryResult {
  items: ListingWithExtras[];
  total: number;
  page: number;
  totalPages: number;
}

export async function queryListings(
  filters: ListingFilters,
  user: User | null,
  onlyActive = true
): Promise<ListingQueryResult> {
  const db = getDb();
  const page = clampInt(filters.page, 1, 500, 1);
  const conds = [];
  if (onlyActive) conds.push(eq(listings.status, 'active'));
  if (filters.q) {
    const q = filters.q.trim();
    conds.push(or(ilike(listings.title, `%${q}%`), ilike(listings.description, `%${q}%`)));
  }
  if (filters.type) conds.push(eq(listings.type, filters.type));
  if (filters.categoryId) conds.push(eq(listings.categoryId, filters.categoryId));
  if (filters.governorateId) conds.push(eq(listings.governorateId, filters.governorateId));
  if (filters.areaId) conds.push(eq(listings.areaId, filters.areaId));
  if (filters.schoolId) conds.push(eq(listings.schoolId, filters.schoolId));
  if (filters.condition) conds.push(eq(listings.condition, filters.condition));
  if (filters.minPrice) {
    const n = Number(filters.minPrice);
    if (Number.isFinite(n)) conds.push(sql`coalesce(${listings.price}::numeric, 0) >= ${n}`);
  }
  if (filters.maxPrice) {
    const n = Number(filters.maxPrice);
    if (Number.isFinite(n)) conds.push(sql`coalesce(${listings.price}::numeric, 0) <= ${n}`);
  }
  const where = conds.length > 0 ? and(...conds) : undefined;

  const [rows, totalRows] = await Promise.all([
    db
      .select(listingBase)
      .from(listings)
      .innerJoin(users, eq(listings.userId, users.id))
      .leftJoin(categories, eq(listings.categoryId, categories.id))
      .leftJoin(governorates, eq(listings.governorateId, governorates.id))
      .leftJoin(areas, eq(listings.areaId, areas.id))
      .leftJoin(schools, eq(listings.schoolId, schools.id))
      .where(where)
      .orderBy(
        filters.sort === 'price-asc'
          ? asc(sql`coalesce(${listings.price}::numeric, 0)`)
          : filters.sort === 'price-desc'
            ? desc(sql`coalesce(${listings.price}::numeric, 0)`)
            : desc(listings.createdAt)
      )
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ n: count() }).from(listings).where(where)
  ]);

  const items = await attachImagesAndFavorites(db, rows, user?.id ?? null);
  const total = totalRows[0]?.n ?? 0;
  return { items, total, page, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export async function getListingDetail(id: string, user: User | null) {
  const db = getDb();
  const rows = await db
    .select(listingBase)
    .from(listings)
    .innerJoin(users, eq(listings.userId, users.id))
    .leftJoin(categories, eq(listings.categoryId, categories.id))
    .leftJoin(governorates, eq(listings.governorateId, governorates.id))
    .leftJoin(areas, eq(listings.areaId, areas.id))
    .leftJoin(schools, eq(listings.schoolId, schools.id))
    .where(eq(listings.id, id))
    .limit(1);
  if (rows.length === 0) return null;
  const [row] = rows;
  const images = await db
    .select()
    .from(listingImages)
    .where(eq(listingImages.listingId, id))
    .orderBy(asc(listingImages.position));
  const fav = user
    ? await db
        .select({ id: favorites.id })
        .from(favorites)
        .where(and(eq(favorites.userId, user.id), eq(favorites.listingId, id)))
        .limit(1)
    : [];
  return {
    ...row,
    images: images.map((i) => ({ url: i.url, position: i.position })),
    isFavorite: fav.length > 0
  } as unknown as ListingWithExtras;
}

export interface HomeData {
  latest: ListingWithExtras[];
  free: ListingWithExtras[];
  exchange: ListingWithExtras[];
  popular: ListingWithExtras[];
  nearby: ListingWithExtras[];
  categories: { id: string; name: string; icon: string | null }[];
}

export async function getHomeData(user: User | null): Promise<HomeData> {
  const db = getDb();

  const [latestRows, freeRows, exchangeRows, activeCats, popularAgg] = await Promise.all([
    db
      .select(listingBase)
      .from(listings)
      .innerJoin(users, eq(listings.userId, users.id))
      .leftJoin(categories, eq(listings.categoryId, categories.id))
      .leftJoin(governorates, eq(listings.governorateId, governorates.id))
      .leftJoin(areas, eq(listings.areaId, areas.id))
      .leftJoin(schools, eq(listings.schoolId, schools.id))
      .where(eq(listings.status, 'active'))
      .orderBy(desc(listings.createdAt))
      .limit(8),
    db
      .select(listingBase)
      .from(listings)
      .innerJoin(users, eq(listings.userId, users.id))
      .leftJoin(categories, eq(listings.categoryId, categories.id))
      .leftJoin(governorates, eq(listings.governorateId, governorates.id))
      .leftJoin(areas, eq(listings.areaId, areas.id))
      .leftJoin(schools, eq(listings.schoolId, schools.id))
      .where(and(eq(listings.status, 'active'), eq(listings.type, 'free')))
      .orderBy(desc(listings.createdAt))
      .limit(4),
    db
      .select(listingBase)
      .from(listings)
      .innerJoin(users, eq(listings.userId, users.id))
      .leftJoin(categories, eq(listings.categoryId, categories.id))
      .leftJoin(governorates, eq(listings.governorateId, governorates.id))
      .leftJoin(areas, eq(listings.areaId, areas.id))
      .leftJoin(schools, eq(listings.schoolId, schools.id))
      .where(and(eq(listings.status, 'active'), eq(listings.type, 'exchange')))
      .orderBy(desc(listings.createdAt))
      .limit(4),
    db
      .select({ id: categories.id, name: categories.name, icon: categories.icon })
      .from(categories)
      .where(eq(categories.isActive, true))
      .orderBy(asc(categories.sort)),
    db
      .select({ id: listings.id, n: count() })
      .from(favorites)
      .innerJoin(listings, eq(favorites.listingId, listings.id))
      .where(eq(listings.status, 'active'))
      .groupBy(listings.id)
      .orderBy(desc(count()))
      .limit(8)
  ]);

  const popularIds = popularAgg.map((r) => r.id);
  const popularRows = popularIds.length
    ? await db
        .select(listingBase)
        .from(listings)
        .innerJoin(users, eq(listings.userId, users.id))
        .leftJoin(categories, eq(listings.categoryId, categories.id))
        .leftJoin(governorates, eq(listings.governorateId, governorates.id))
        .leftJoin(areas, eq(listings.areaId, areas.id))
        .leftJoin(schools, eq(listings.schoolId, schools.id))
        .where(inArray(listings.id, popularIds))
        .orderBy(desc(listings.createdAt))
    : [];

  const nearbyRows = user?.areaId
    ? await db
        .select(listingBase)
        .from(listings)
        .innerJoin(users, eq(listings.userId, users.id))
        .leftJoin(categories, eq(listings.categoryId, categories.id))
        .leftJoin(governorates, eq(listings.governorateId, governorates.id))
        .leftJoin(areas, eq(listings.areaId, areas.id))
        .leftJoin(schools, eq(listings.schoolId, schools.id))
        .where(and(eq(listings.status, 'active'), eq(listings.areaId, user.areaId)))
        .orderBy(desc(listings.createdAt))
        .limit(8)
    : [];

  const [latest, free, exchange, popular, nearby] = await Promise.all([
    attachImagesAndFavorites(db, latestRows, user?.id ?? null),
    attachImagesAndFavorites(db, freeRows, user?.id ?? null),
    attachImagesAndFavorites(db, exchangeRows, user?.id ?? null),
    attachImagesAndFavorites(db, popularRows, user?.id ?? null),
    attachImagesAndFavorites(db, nearbyRows, user?.id ?? null)
  ]);

  return { latest, free, exchange, popular, nearby, categories: activeCats };
}

/* ---------------- Conversations ---------------- */

export interface ConversationSummary {
  id: string;
  otherId: string;
  otherName: string;
  otherAvatarUrl: string | null;
  lastMessageBody: string | null;
  lastMessageAt: Date | null;
  unread: number;
}

export async function getConversations(user: User): Promise<ConversationSummary[]> {
  const db = getDb();
  const convs = await db
    .select()
    .from(conversations)
    .where(or(eq(conversations.userIdA, user.id), eq(conversations.userIdB, user.id)))
    .orderBy(desc(conversations.createdAt));
  if (convs.length === 0) return [];

  const ids = convs.map((c) => c.id);
  const otherIds = [...new Set(convs.map((c) => (c.userIdA === user.id ? c.userIdB : c.userIdA)))];

  const [msgs, reads, others] = await Promise.all([
    db
      .select({
        conversationId: messages.conversationId,
        body: messages.body,
        senderId: messages.senderId,
        createdAt: messages.createdAt
      })
      .from(messages)
      .where(inArray(messages.conversationId, ids))
      .orderBy(desc(messages.createdAt), desc(messages.id))
      .limit(3000),
    db
      .select({
        conversationId: conversationParticipants.conversationId,
        readAt: conversationParticipants.readAt
      })
      .from(conversationParticipants)
      .where(and(eq(conversationParticipants.userId, user.id), inArray(conversationParticipants.conversationId, ids))),
    db
      .select({ id: users.id, name: users.name, avatarUrl: users.avatarUrl })
      .from(users)
      .where(inArray(users.id, otherIds))
  ]);

  const readMap = new Map(reads.map((r) => [r.conversationId, r.readAt ?? null]));
  const otherMap = new Map(others.map((o) => [o.id, o]));

  const lastByConv = new Map<string, { body: string; createdAt: Date }>();
  const unreadByConv = new Map<string, number>(convs.map((c) => [c.id, 0]));
  for (const m of msgs) {
    if (!lastByConv.has(m.conversationId)) {
      lastByConv.set(m.conversationId, { body: m.body, createdAt: m.createdAt });
    }
  }
  // Unread: other party's messages newer than our readAt.
  for (const c of convs) {
    const readAt = readMap.get(c.id);
    const other = c.userIdA === user.id ? c.userIdB : c.userIdA;
    let n = 0;
    for (const m of msgs) {
      if (m.conversationId !== c.id || m.senderId !== other) continue;
      if (!readAt || m.createdAt > readAt) n++;
    }
    unreadByConv.set(c.id, n);
  }

  return convs.map((c) => {
    const other = c.userIdA === user.id ? c.userIdB : c.userIdA;
    const last = lastByConv.get(c.id);
    const o = otherMap.get(other);
    return {
      id: c.id,
      otherId: other,
      otherName: o?.name ?? 'مستخدم',
      otherAvatarUrl: o?.avatarUrl ?? null,
      lastMessageBody: last?.body ?? null,
      lastMessageAt: last?.createdAt ?? null,
      unread: unreadByConv.get(c.id) ?? 0
    };
  });
}
