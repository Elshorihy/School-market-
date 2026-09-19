import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDb, wantedItems, categories, governorates, areas, schools, users, reports } from '@/db';
import { and, count, desc, eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';
import { getListingDetail } from '@/lib/queries';
import { matchListingsForWanted } from '@/lib/match';
import { resolveGeoNames } from '@/lib/geo';
import { ListingGrid } from '@/components/marketplace/ListingCard';
import { EmptyState, Badge, SectionHeader } from '@/components/ui/Misc';
import { Icon } from '@/components/ui/Icon';
import { ReportButton } from '@/components/marketplace/ReportButton';
import { WANTED_STATUS_LABELS, timeAgo, formatPrice, CONDITION_LABELS } from '@/lib/utils';
import { WantedActions } from './WantedActions';

export const metadata: Metadata = {
  title: 'تفاصيل الطلب',
  robots: { index: false }
};

export const dynamic = 'force-dynamic';

export default async function WantedDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const db = getDb();

  const rows = await db
    .select({
      item: wantedItems,
      owner: users,
      categoryName: categories.name,
      categoryIcon: categories.icon,
      governorateName: governorates.name,
      areaName: areas.name,
      schoolName: schools.name
    })
    .from(wantedItems)
    .innerJoin(users, eq(wantedItems.userId, users.id))
    .leftJoin(categories, eq(wantedItems.categoryId, categories.id))
    .leftJoin(governorates, eq(wantedItems.governorateId, governorates.id))
    .leftJoin(areas, eq(wantedItems.areaId, areas.id))
    .leftJoin(schools, eq(wantedItems.schoolId, schools.id))
    .where(eq(wantedItems.id, id))
    .limit(1);
  if (rows.length === 0) notFound();
  const r = rows[0];
  const wanted = r.item;

  const matches = await matchListingsForWanted(
    db,
    {
      id: wanted.id,
      categoryId: wanted.categoryId,
      governorateId: wanted.governorateId,
      areaId: wanted.areaId,
      schoolId: wanted.schoolId,
      title: wanted.title,
      description: wanted.description
    },
    12
  );

  const strong = matches.filter((m) => m.rank === 0);
  const others = matches.filter((m) => m.rank !== 0);

  const isOwner = user?.id === wanted.userId;
  const tone = wanted.status === 'open' ? 'brand' : wanted.status === 'found' ? 'amber' : 'slate';

  return (
    <div className="space-y-8">
      <Link href="/wanted" className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-brand-600 dark:text-slate-400">
        <Icon name="chevron-right" size={16} />
        العودة لقسم مطلوب
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={tone}>{WANTED_STATUS_LABELS[wanted.status]}</Badge>
                {r.categoryName && (
                  <Badge tone="slate">
                    {r.categoryIcon} {r.categoryName}
                  </Badge>
                )}
              </div>
              <h1 className="mt-3 text-lg font-extrabold" dir="auto">
                {wanted.title}
              </h1>
            </div>
          </div>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600 dark:text-slate-300" dir="auto">
            {wanted.description}
          </p>
          <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <Icon name="map-pin" size={15} />
              <dd className="font-bold text-slate-800 dark:text-slate-200">
                {[r.schoolName, r.areaName, r.governorateName].filter(Boolean).join(' · ') || 'غير محدد'}
              </dd>
            </div>
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <Icon name="clock" size={15} />
              <dd className="font-bold text-slate-800 dark:text-slate-200">{timeAgo(wanted.createdAt)}</dd>
            </div>
          </dl>
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <h2 className="mb-2 text-sm font-extrabold">صاحب الطلب</h2>
            <Link
              href={`/user/${wanted.userId}`}
              className="flex items-center gap-3 rounded-xl p-1 transition hover:bg-slate-50 dark:hover:bg-slate-800/50"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-sm font-black text-brand-800 dark:bg-brand-900 dark:text-brand-200">
                {r.owner.name[0]}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold">{r.owner.name}</span>
                <span className="block text-xs text-slate-500 dark:text-slate-400">طالب في المنصة</span>
              </span>
            </Link>
          </div>
          {(isOwner || user?.role === 'admin') && (
            <WantedActions wantedId={wanted.id} status={wanted.status} isOwner={isOwner} isAdmin={user?.role === 'admin'} />
          )}
          {user && !isOwner && (
            <ReportButton targetType="user" targetId={wanted.userId} size="sm" />
          )}
        </div>
      </div>

      <section>
        <SectionHeader title={`الإعلانات المطابقة (${matches.length})`} icon="sparkle" />
        {matches.length === 0 ? (
          <EmptyState
            icon="search"
            title="لا توجد إعلانات مطابقة حاليًا"
            description="عندما ينشر أحد الطلاب إعلانًا يطابق هذا الطلب، سنرسل لك إشعارًا فورًا."
          />
        ) : (
          <div className="space-y-6">
            {strong.length > 0 && (
              <div>
                <p className="mb-3 text-xs font-bold text-brand-700 dark:text-brand-300">
                  مطابقة قوية (نفس المنطقة + كلمات مطابقة)
                </p>
                <MatchesGrid matches={strong} />
              </div>
            )}
            {others.length > 0 && (
              <div>
                <p className="mb-3 text-xs font-bold text-slate-500 dark:text-slate-400">مقترحات أخرى في نفس المحافظة</p>
                <MatchesGrid matches={others} />
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

async function MatchesGrid({ matches }: { matches: Awaited<ReturnType<typeof matchListingsForWanted>> }) {
  const user = await getCurrentUser();
  const details = [];
  for (const m of matches.slice(0, 12)) {
    const d = await getListingDetail(m.id, user);
    if (d) details.push(d);
  }
  if (details.length === 0) return null;
  return <ListingGrid listings={details} />;
}
