import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getDb, listings, wantedItems, favorites } from '@/db';
import { count, desc, eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';
import { resolveGeoNames } from '@/lib/geo';
import { getListingDetail } from '@/lib/queries';
import type { ListingWithExtras } from '@/types';
import { ListingGrid } from '@/components/marketplace/ListingCard';
import { WantedCard } from '@/components/wanted/WantedCard';
import { EmptyState, Avatar, SectionHeader, Badge } from '@/components/ui/Misc';
import { Icon } from '@/components/ui/Icon';
import { formatDate } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'ملفي الشخصي',
  robots: { index: false }
};

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/profile');
  const db = getDb();

  const [myListings, myWanted, favCount, geo] = await Promise.all([
    db.select().from(listings).where(eq(listings.userId, user.id)).orderBy(desc(listings.createdAt)).limit(12),
    db.select().from(wantedItems).where(eq(wantedItems.userId, user.id)).orderBy(desc(wantedItems.createdAt)).limit(6),
    db.select({ n: count() }).from(favorites).where(eq(favorites.userId, user.id)),
    resolveGeoNames({ governorateId: user.governorateId, areaId: user.areaId, schoolId: user.schoolId })
  ]);

  const listingsFull = (
    (await Promise.all(myListings.map((l) => getListingDetail(l.id, user)))).filter(Boolean) as (
      | ListingWithExtras
      | null
    )[]
  ).filter(Boolean) as ListingWithExtras[];

  const location = [geo.area, geo.governorate].filter(Boolean).join(' · ') || null;

  return (
    <div className="space-y-8">
      {/* Header card */}
      <div className="card overflow-hidden">
        <div className="h-20 bg-gradient-to-l from-brand-600 to-emerald-500" />
        <div className="px-5 pb-5">
          <div className="-mt-9 flex flex-wrap items-end justify-between gap-3">
            <Avatar
              name={user.name}
              url={user.avatarUrl}
              size={76}
              className="ring-4 ring-white dark:ring-slate-900"
            />
            <div className="flex gap-2">
              <Link href="/profile/edit" className="btn-outline btn-sm">
                <Icon name="edit" size={14} />
                تعديل الملف
              </Link>
              <Link href="/listings/new" className="btn-primary btn-sm">
                <Icon name="plus" size={14} />
                إعلان جديد
              </Link>
            </div>
          </div>
          <h1 className="mt-3 text-lg font-extrabold">{user.name}</h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
            {user.schoolId && geo.school && (
              <span className="flex items-center gap-1">
                <Icon name="school" size={13} />
                {geo.school}
              </span>
            )}
            {location && (
              <span className="flex items-center gap-1">
                <Icon name="map-pin" size={13} />
                {location}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Icon name="clock" size={13} />
              انضم في {formatDate(user.createdAt)}
            </span>
            {user.role === 'admin' && <Badge tone="violet">إداري</Badge>}
          </div>
          {user.bio && (
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-300">{user.bio}</p>
          )}
          <div className="mt-4 grid grid-cols-3 gap-2 text-center sm:max-w-sm">
            <Link href="/profile#listings" className="rounded-xl bg-slate-50 py-2.5 dark:bg-slate-800/60">
              <span className="block text-lg font-black">{myListings.length}</span>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">إعلاناتي</span>
            </Link>
            <Link href="/profile#wanted" className="rounded-xl bg-slate-50 py-2.5 dark:bg-slate-800/60">
              <span className="block text-lg font-black">{myWanted.length}</span>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">طلباتي</span>
            </Link>
            <Link href="/favorites" className="rounded-xl bg-slate-50 py-2.5 dark:bg-slate-800/60">
              <span className="block text-lg font-black">{favCount[0]?.n ?? 0}</span>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">المفضلة</span>
            </Link>
          </div>
        </div>
      </div>

      {/* My listings */}
      <section id="listings">
        <SectionHeader
          title="إعلاناتي"
          icon="store"
          action={
            <Link href="/profile/blocks" className="text-xs font-bold text-slate-400 hover:text-brand-600">
              المستخدمون المحظورون
            </Link>
          }
        />
        {listingsFull.length === 0 ? (
          <EmptyState
            icon="store"
            title="لم تنشر أي إعلانات بعد"
            description="ابدأ ببيع كتبك وملازمك القديمة أو تبادلها مع زملائك."
            action={
              <Link href="/listings/new" className="btn-primary btn-md">
                <Icon name="plus" size={16} />
                نشر أول إعلان
              </Link>
            }
          />
        ) : (
          <ListingGrid listings={listingsFull} />
        )}
      </section>

      {/* My wanted */}
      <section id="wanted">
        <SectionHeader
          title="طلباتي (مطلوب)"
          icon="target"
          action={
            <Link href="/wanted/new" className="text-xs font-bold text-brand-600 hover:underline">
              طلب جديد
            </Link>
          }
        />
        {myWanted.length === 0 ? (
          <p className="rounded-2xl bg-slate-100 px-4 py-6 text-center text-sm text-slate-500 dark:bg-slate-900 dark:text-slate-400">
            لم تنشئ أي طلبات بعد
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {myWanted.map((w) => (
              <WantedCard key={w.id} wanted={w} categoryName={null} location={location} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
