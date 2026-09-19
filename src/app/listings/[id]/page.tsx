import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { getDb } from '@/db';
import { listings, users, wantedItems } from '@/db';
import { and, desc, eq } from 'drizzle-orm';
import { getListingDetail, queryListings } from '@/lib/queries';
import { ListingGrid } from '@/components/marketplace/ListingCard';
import { FavoriteButton } from '@/components/marketplace/FavoriteButton';
import { MessageSellerButton } from '@/components/marketplace/MessageSellerButton';
import { ReportButton } from '@/components/marketplace/ReportButton';
import { Badge, EmptyState, SectionHeader } from '@/components/ui/Misc';
import { Icon } from '@/components/ui/Icon';
import {
  CONDITION_LABELS,
  LISTING_STATUS_LABELS,
  LISTING_TYPE_LABELS,
  formatDateTime,
  formatPrice
} from '@/lib/utils';
import { ListingActions } from './ListingActions';
import { WantedCta } from './WantedCta';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const user = await getCurrentUser();
  const listing = await getListingDetail(params.id, user);
  if (!listing || listing.status === 'removed') {
    return { title: 'الإعلان غير موجود', robots: { index: false } };
  }
  const title = `${listing.title} — ${LISTING_TYPE_LABELS[listing.type]}`;
  return {
    title,
    description: listing.description.slice(0, 155),
    openGraph: {
      title,
      description: listing.description.slice(0, 200),
      images: listing.images[0] ? [listing.images[0].url] : undefined,
      locale: 'ar_EG'
    },
    robots: listing.status === 'active' ? { index: true, follow: true } : { index: false }
  };
}

export default async function ListingDetailPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  const listing = await getListingDetail(params.id, user);
  if (!listing) notFound();

  const isAdmin = user?.role === 'admin';
  const isOwner = user?.id === listing.userId;
  const db = getDb();

  // Seller's other active listings + related category listings
  const [sellerRows, sellerListings, related, sellerWantedCount] = await Promise.all([
    db.select().from(users).where(eq(users.id, listing.userId)).limit(1),
    db
      .select()
      .from(listings)
      .where(and(eq(listings.userId, listing.userId), eq(listings.status, 'active')))
      .orderBy(desc(listings.createdAt))
      .limit(100),
    listing.categoryId
      ? queryListings({ categoryId: listing.categoryId }, user)
      : Promise.resolve({ items: [], total: 0, page: 1, totalPages: 1 }),
    db
      .select({ id: wantedItems.id })
      .from(wantedItems)
      .where(and(eq(wantedItems.userId, listing.userId), eq(wantedItems.status, 'open')))
      .limit(50)
  ]);
  const relatedItems = related.items.filter((l) => l.id !== listing.id).slice(0, 4);

  const typeTone = listing.type === 'sale' ? 'brand' : listing.type === 'exchange' ? 'amber' : 'sky';
  const mainImage = listing.images[0]?.url;

  return (
    <div className="space-y-8">
      <Link href="/listings" className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-brand-600 dark:text-slate-400">
        <Icon name="chevron-right" size={16} />
        العودة للإعلانات
      </Link>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Gallery */}
        <div className="lg:col-span-3">
          <div className="card overflow-hidden">
            {mainImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={mainImage} alt={listing.title} className="aspect-[4/3] w-full object-cover" />
            ) : (
              <div className="flex aspect-[4/3] w-full items-center justify-center bg-slate-100 text-slate-300 dark:bg-slate-800 dark:text-slate-600">
                <Icon name="image" size={56} />
              </div>
            )}
            {listing.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto p-3">
                {listing.images.map((img, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={img.url}
                    alt={`صورة ${i + 1}`}
                    className="h-16 w-16 shrink-0 rounded-lg object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                  />
                ))}
              </div>
            )}
          </div>

          <div className="card mt-4 p-5">
            <h2 className="mb-3 text-base font-extrabold">الوصف</h2>
            <p className="whitespace-pre-wrap text-sm leading-7 text-slate-600 dark:text-slate-300" dir="auto">
              {listing.description}
            </p>
          </div>
        </div>

        {/* Info panel */}
        <div className="space-y-4 lg:col-span-2">
          <div className="card p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap gap-1.5">
                  <Badge tone={typeTone}>{LISTING_TYPE_LABELS[listing.type]}</Badge>
                  <Badge tone="slate">{CONDITION_LABELS[listing.condition]}</Badge>
                  {listing.status !== 'active' && <Badge tone="rose">{LISTING_STATUS_LABELS[listing.status]}</Badge>}
                </div>
                <h1 className="mt-3 text-lg font-extrabold leading-snug" dir="auto">
                  {listing.title}
                </h1>
              </div>
              {user && !isOwner && (
                <FavoriteButton listingId={listing.id} isFavorite={listing.isFavorite} />
              )}
            </div>
            <p className="mt-3 text-2xl font-black text-brand-600 dark:text-brand-400" dir="auto">
              {formatPrice(listing.price, listing.type)}
            </p>

            <dl className="mt-4 space-y-2 text-sm">
              {listing.categoryName && (
                <div className="flex items-center justify-between">
                  <dt className="text-slate-500 dark:text-slate-400">التصنيف</dt>
                  <dd className="font-bold">{listing.categoryName}</dd>
                </div>
              )}
              <div className="flex items-center justify-between">
                <dt className="text-slate-500 dark:text-slate-400">الموقع</dt>
                <dd className="font-bold">
                  {[listing.schoolName, listing.areaName, listing.governorateName].filter(Boolean).join(' · ')}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500 dark:text-slate-400">نُشر في</dt>
                <dd className="font-bold">{formatDateTime(listing.createdAt)}</dd>
              </div>
            </dl>

            <div className="mt-5 space-y-2.5 border-t border-slate-100 pt-4 dark:border-slate-800">
              {user && !isOwner ? (
                <MessageSellerButton sellerId={listing.userId} />
              ) : (
                <p className="rounded-xl bg-slate-50 px-4 py-3 text-center text-xs font-semibold text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                  {isOwner ? 'هذا إعلانك' : 'سجّل دخولك للتواصل مع البائع'}
                </p>
              )}
              {!isOwner && (
                <ReportButton targetType="listing" targetId={listing.id} size="sm" />
              )}
              {(isOwner || isAdmin) && (
                <ListingActions
                  listingId={listing.id}
                  status={listing.status}
                  isOwner={isOwner}
                  isAdmin={isAdmin}
                />
              )}
            </div>
          </div>

          {/* Seller */}
          <div className="card p-5">
            <h2 className="mb-3 text-sm font-extrabold">البائع</h2>
            <Link
              href={`/user/${listing.userId}`}
              className="flex items-center gap-3 rounded-xl p-1 transition hover:bg-slate-50 dark:hover:bg-slate-800/50"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-black text-brand-800 dark:bg-brand-900 dark:text-brand-200">
                {listing.sellerName[0]}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold">{listing.sellerName}</span>
                <span className="block text-xs text-slate-500 dark:text-slate-400">
                  {sellerListings.length} إعلان نشط · عضو منذ{' '}
                  {sellerRows[0] ? new Intl.DateTimeFormat('ar-EG', { dateStyle: 'medium' }).format(sellerRows[0].createdAt) : '—'}
                </span>
              </span>
            </Link>
            {sellerWantedCount.length > 0 && (
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                لديه {sellerWantedCount.length} طلب «مطلوب» مفتوح
              </p>
            )}
          </div>

          <WantedCta categoryName={listing.categoryName} />
        </div>
      </div>

      {relatedItems.length > 0 && (
        <section>
          <SectionHeader title="إعلانات مشابهة" icon="tag" />
          <ListingGrid listings={relatedItems} />
        </section>
      )}
    </div>
  );
}
