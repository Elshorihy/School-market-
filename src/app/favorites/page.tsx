import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getDb, favorites, listings } from '@/db';
import { and, desc, eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';
import { getListingDetail, type ListingQueryResult } from '@/lib/queries';
import type { ListingWithExtras } from '@/types';
import { ListingGrid } from '@/components/marketplace/ListingCard';
import { EmptyState } from '@/components/ui/Misc';
import { Icon } from '@/components/ui/Icon';

export const metadata: Metadata = {
  title: 'المفضلة',
  robots: { index: false }
};

export const dynamic = 'force-dynamic';

export default async function FavoritesPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/favorites');
  const db = getDb();

  const favIds = (
    await db
      .select({ listingId: favorites.listingId })
      .from(favorites)
      .innerJoin(listings, eq(favorites.listingId, listings.id))
      .where(and(eq(favorites.userId, user.id), eq(listings.status, 'active')))
      .orderBy(desc(favorites.createdAt))
  ).map((r) => r.listingId);

  const details = await Promise.all(
    favIds.slice(0, 60).map((id) => getListingDetail(id, user))
  );
  const items = details.filter(Boolean) as ListingWithExtras[];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-extrabold">المفضلة</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">{items.length} إعلان محفوظ</p>
      </div>
      {items.length === 0 ? (
        <EmptyState
          icon="heart"
          title="لم تضف أي إعلانات إلى المفضلة بعد"
          description="اضغط على أيقونة القلب في أي إعلان لحفظه هنا."
          action={
            <Link href="/listings" className="btn-primary btn-md">
              <Icon name="store" size={16} />
              تصفح الإعلانات
            </Link>
          }
        />
      ) : (
        <ListingGrid listings={items} />
      )}
    </div>
  );
}
