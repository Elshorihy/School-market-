import { and, asc, desc, eq, ilike, or, sql } from 'drizzle-orm';
import type { Db } from './notify';
import { listings } from '@/db/schema';

/**
 * Non-AI keyword extraction for matching wanted items with listings.
 * Splits on punctuation/whitespace, drops Arabic stop words and short
 * tokens, and keeps the most distinctive (longest) keywords.
 */
const AR_STOPWORDS = new Set([
  'مطلوب', 'مطلوبة', 'أريد', 'اريد', 'ابغى', 'عندي', 'بيعي', 'بيعت', 'بيع', 'بعت', 'باعت',
  'شراء', 'اشترى', 'اشتريت', 'أبحث', 'ابحث', 'أبحث', 'العنوان', 'الوصف', 'عشان', 'علشان',
  'عند', 'عليه', 'عليها', 'له', 'لها', 'لهما', 'لهن', 'علي', 'في', 'من', 'إلى', 'الى', 'هو',
  'هي', 'هذا', 'هذه', 'ذلك', 'تلك', 'انا', 'أنا', 'يا', 'مع', 'بعد', 'قبل', 'على', 'و',
  'ثم', 'ف', 'ب', 'ك', 'عن', 'قد', 'ما', 'لا', 'لم', 'لن', 'إن', 'ان', 'او', 'أو', 'ايه',
  'يعني', 'يعنى', 'كمان', 'زي', 'تحت', 'فوق', 'بجوار', 'قرب', 'جديد', 'جديدة', 'مستخدم',
  'مستعملة', 'مستعمل', 'حالة', 'جيد', 'جيدة', 'الصف', 'ثانوي', 'ثانوية', 'إعدادي',
  'اعدادي', 'إعدادية', 'اعدادية', 'ابتدائي', 'ابتدائية', 'مدرسة', 'مدرستنا', 'السنة',
  'الترم', 'ترم', 'التالت', 'الاول', 'الثاني', 'التاني', 'التالت', 'الخامس', 'السادس',
  'الاولى', 'الثانية', 'الثالثة', 'الخامسة', 'السادسة', 'دراسي', 'دراسية', 'كتاب',
  'الكتاب', 'الكتب', 'فصل', 'فصول', 'الجزء', 'جزء', 'اجزاء', 'أجزاء', 'نسخة', 'نسخ'
]);

const EN_STOPWORDS = new Set([
  'i', 'a', 'an', 'the', 'is', 'are', 'was', 'were', 'of', 'in', 'on', 'at', 'to', 'for',
  'and', 'or', 'with', 'from', 'by', 'book', 'books', 'want', 'need', 'selling', 'sell',
  'new', 'used'
]);

export function extractKeywords(text: string, max = 6): string[] {
  const tokens = text
    .toLowerCase()
    .replace(/[ً-ْ]/g, '') // strip harakat
    .split(/[^ء-يa-z0-9]+/);
  const counts = new Map<string, number>();
  for (const raw of tokens) {
    const t = raw.trim();
    if (!t) continue;
    const isArabic = /[ء-ي]/.test(t);
    const isEnglish = /^[a-z0-9]+$/.test(t);
    if (isArabic && t.length < 3) continue;
    if (isEnglish && t.length < 2) continue;
    if (!isArabic && !isEnglish) continue;
    if (AR_STOPWORDS.has(t) || EN_STOPWORDS.has(t)) continue;
    counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)
    .slice(0, max)
    .map(([t]) => t);
}

export interface WantedMatchInput {
  id: string;
  categoryId: string | null;
  governorateId: string | null;
  areaId: string | null;
  schoolId: string | null;
  title: string;
  description: string;
}

export interface ListingMatch extends ListingSummaryLite {
  /** 0 = strong (geo + keyword), 1 = geo, 2 = keyword only */
  rank: 0 | 1 | 2;
}

export interface ListingSummaryLite {
  id: string;
  title: string;
  description: string;
  type: 'sale' | 'exchange' | 'free';
  price: string | null;
  condition: 'new' | 'like-new' | 'good' | 'used' | 'damaged';
  categoryId: string | null;
  governorateId: string | null;
  areaId: string | null;
  schoolId: string | null;
  status: string;
  createdAt: Date;
}

/**
 * Find active marketplace listings matching a wanted item.
 * Single optimized query:
 *   - same category AND same governorate
 *   - AND (same area/school OR keyword appears in title/description)
 * Ordered by match strength, capped by limit.
 */
export async function matchListingsForWanted(
  db: Db,
  wanted: WantedMatchInput,
  limit = 12
): Promise<ListingMatch[]> {
  if (!wanted.categoryId || !wanted.governorateId) return [];
  const keywords = extractKeywords(`${wanted.title} ${wanted.description}`, 4);

  const geoParts = [];
  if (wanted.areaId) geoParts.push(eq(listings.areaId, wanted.areaId));
  if (wanted.schoolId) geoParts.push(eq(listings.schoolId, wanted.schoolId));
  const geoMatch = geoParts.length ? or(...geoParts) : null;

  const kwParts = keywords.map((kw) =>
    or(ilike(listings.title, `%${kw}%`), ilike(listings.description, `%${kw}%`))
  );

  const combined = kwParts.length
    ? geoMatch
      ? or(geoMatch, ...kwParts)
      : or(...kwParts)
    : geoMatch ?? undefined;

  const whereCond = and(
    eq(listings.status, 'active'),
    eq(listings.categoryId, wanted.categoryId),
    eq(listings.governorateId, wanted.governorateId),
    combined
  );
  if (!whereCond) return [];

  const geoRankCond = geoMatch
    ? sql<boolean>`CASE WHEN ${geoMatch} THEN true ELSE false END`
    : sql<boolean>`false`;
  const kwRankCond = kwParts.length
    ? sql<boolean>`CASE WHEN ${or(...kwParts)!} THEN true ELSE false END`
    : sql<boolean>`false`;
  const rankExpr = sql<number>`CASE
      WHEN ${geoRankCond} AND ${kwRankCond} THEN 0
      WHEN ${geoRankCond} THEN 1
      ELSE 2
    END`;

  const rows = await db
    .select({
      id: listings.id,
      title: listings.title,
      description: listings.description,
      type: listings.type,
      price: listings.price,
      condition: listings.condition,
      categoryId: listings.categoryId,
      governorateId: listings.governorateId,
      areaId: listings.areaId,
      schoolId: listings.schoolId,
      status: listings.status,
      createdAt: listings.createdAt,
      matchRank: rankExpr
    })
    .from(listings)
    .where(whereCond)
    .orderBy(asc(rankExpr), desc(listings.createdAt))
    .limit(limit);

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    type: r.type,
    price: r.price,
    condition: r.condition,
    categoryId: r.categoryId,
    governorateId: r.governorateId,
    areaId: r.areaId,
    schoolId: r.schoolId,
    status: r.status,
    createdAt: r.createdAt,
    rank: r.matchRank as 0 | 1 | 2
  }));
}
