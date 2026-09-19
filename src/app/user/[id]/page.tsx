import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDb, users, listings, wantedItems, governorates, areas, schools } from '@/db';
import { and, count, desc, eq, or } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';
import { resolveGeoNames } from '@/lib/geo';
import { areBlocked } from '@/lib/blockcheck';
import { getListingDetail } from '@/lib/queries';
import type { ListingWithExtras } from '@/types';
import { ListingGrid } from '@/components/marketplace/ListingCard';
import { WantedCard } from '@/components/wanted/WantedCard';
import { EmptyState, Avatar, SectionHeader, Badge } from '@/components/ui/Misc';
import { Icon } from '@/components/ui/Icon';
import { MessageSellerButton } from '@/components/marketplace/MessageSellerButton';
import { ReportButton } from '@/components/marketplace/ReportButton';
import { BlockButton } from '@/components/marketplace/BlockButton';
import { formatDate } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'ملف المستخدم',
  robots: { index: false }
};

export const dynamic = 'force-dynamic';

export default async function PublicProfilePage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  const db = getDb();

  const rows = await db
    .select({
      user: users,
      governorateName: governorates.name,
      areaName: areas.name,
      schoolName: schools.name
    })
    .from(users)
    .leftJoin(governorates, eq(users.governorateId, governorates.id))
    .leftJoin(areas, eq(users.areaId, areas.id))
    .leftJoin(schools, eq(users.schoolId, schools.id))
    .where(eq(users.id, params.id))
    .limit(1);
  if (rows.length === 0) notFound();
  const profile = rows[0];
  const p = profile.user;

  const [activeListings, myWanted, blocked] = await Promise.all([
    db
      .select({ id: listings.id })
      .from(listings)
      .where(and(eq(listings.userId, p.id), eq(listings.status, 'active')))
      .orderBy(desc(listings.createdAt))
      .limit(12),
    db
      .select()
      .from(wantedItems)
      .where(and(eq(wantedItems.userId, p.id), eq(wantedItems.status, 'open')))
      .orderBy(desc(wantedItems.createdAt))
      .limit(3),
    user ? areBlocked(db, user.id, p.id) : Promise.resolve(false)
  ]);

  const listingsFull = (
    (await Promise.all(activeListings.map((l) => getListingDetail(l.id, user)))).filter(Boolean) as (
      | ListingWithExtras
      | null
    )[]
  ).filter(Boolean) as ListingWithExtras[];

  const isSelf = user?.id === p.id;

  return (
    <div className="space-y-8">
      <div className="card overflow-hidden">
        <div className="h-20 bg-gradient-to-l from-brand-600 to-emerald-500" />
        <div className="px-5 pb-5">
          <div className="-mt-9 flex flex-wrap items-end justify-between gap-3">
            <Avatar name={p.name} url={p.avatarUrl} size={76} className="ring-4 ring-white dark:ring-slate-900" />
            {user && !isSelf && (
              <div className="flex flex-wrap gap-2">
                <MessageSellerButton sellerId={p.id} disabled={blocked} />
                <BlockButton userId={p.id} blocked={blocked} />
                <ReportButton targetType="user" targetId={p.id} size="sm" />
              </div>
            )}
            {isSelf && (
              <Link href="/profile/edit" className="btn-outline btn-sm">
                <Icon name="edit" size={14} />
                تعديل الملف
              </Link>
            )}
          </div>
          <h1 className="mt-3 flex items-center gap-2 text-lg font-extrabold">
            {p.name}
            {p.role === 'admin' && <Badge tone="violet">إداري</Badge>}
            {p.status === 'suspended' && <Badge tone="rose">موقوف مؤقتًا</Badge>}
          </h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
            {profile.schoolName && (
              <span className="flex items-center gap-1">
                <Icon name="school" size={13} />
                {profile.schoolName}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Icon name="map-pin" size={13} />
              {[profile.areaName, profile.governorateName].filter(Boolean).join(' · ') || 'غير محدد'}
            </span>
            <span className="flex items-center gap-1">
              <Icon name="clock" size={13} />
              انضم في {formatDate(p.createdAt)}
            </span>
          </div>
          {p.bio && (
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-300">{p.bio}</p>
          )}
          <div className="mt-4 grid grid-cols-3 gap-2 text-center sm:max-w-sm">
            <div className="rounded-xl bg-slate-50 py-2.5 dark:bg-slate-800/60">
              <span className="block text-lg font-black">{activeListings.length}</span>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">إعلانات نشطة</span>
            </div>
            <div className="rounded-xl bg-slate-50 py-2.5 dark:bg-slate-800/60">
              <span className="block text-lg font-black">{myWanted.length}</span>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">طلبات مفتوحة</span>
            </div>
            <div className="rounded-xl bg-slate-50 py-2.5 dark:bg-slate-800/60">
              <span className="block text-lg font-black">{blocked ? 'محظور' : '—'}</span>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">حالة الحظر</span>
            </div>
          </div>
        </div>
      </div>

      <section>
        <SectionHeader title="إعلاناته النشطة" icon="store" />
        {listingsFull.length === 0 ? (
          <EmptyState icon="store" title="لا توجد إعلانات نشطة حاليًا" />
        ) : (
          <ListingGrid listings={listingsFull} />
        )}
      </section>

      {myWanted.length > 0 && (
        <section>
          <SectionHeader title="طلباته (مطلوب)" icon="target" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {myWanted.map((w) => (
              <WantedCard key={w.id} wanted={w} categoryName={null} location={[profile.areaName, profile.governorateName].filter(Boolean).join(' · ') || null} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
