import Link from 'next/link';
import type { ListingWithExtras } from '@/types';
import { Badge } from '@/components/ui/Misc';
import { Icon } from '@/components/ui/Icon';
import { formatPrice, timeAgo, CONDITION_LABELS, LISTING_TYPE_LABELS } from '@/lib/utils';
import { FavoriteButton } from './FavoriteButton';

const typeTone: Record<string, 'brand' | 'amber' | 'sky'> = {
  sale: 'brand',
  exchange: 'amber',
  free: 'sky'
};

export function ListingCard({ listing }: { listing: ListingWithExtras }) {
  const image = listing.images[0]?.url;
  return (
    <article className="card group relative overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md">
      <Link href={`/listings/${listing.id}`} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-800">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt={listing.title}
              loading="lazy"
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-slate-300 dark:text-slate-600">
              <Icon name="image" size={40} />
            </div>
          )}
          <div className="absolute start-2 top-2 flex gap-1.5">
            <Badge tone={typeTone[listing.type]}>{LISTING_TYPE_LABELS[listing.type]}</Badge>
            {listing.status !== 'active' && (
              <Badge tone="slate">
                {listing.status === 'sold' ? 'تم البيع' : listing.status === 'exchanged' ? 'تم التبادل' : 'مغلق'}
              </Badge>
            )}
          </div>
        </div>
        <div className="p-3.5">
          <h3 className="line-clamp-1 text-sm font-bold" dir="auto">
            {listing.title}
          </h3>
          <p className="mt-1 text-base font-extrabold text-brand-600 dark:text-brand-400" dir="auto">
            {formatPrice(listing.price, listing.type)}
          </p>
          <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="flex min-w-0 items-center gap-1">
              <Icon name="map-pin" size={12} className="shrink-0" />
              <span className="truncate">
                {listing.areaName ?? listing.governorateName ?? 'مصر'}
                {listing.schoolName ? ` · ${listing.schoolName}` : ''}
              </span>
            </span>
            <span className="shrink-0">{timeAgo(listing.createdAt)}</span>
          </div>
        </div>
      </Link>
      <div className="absolute end-2.5 top-2.5">
        <FavoriteButton listingId={listing.id} isFavorite={listing.isFavorite} ownerId={listing.sellerId} />
      </div>
    </article>
  );
}

export function ListingGrid({ listings }: { listings: ListingWithExtras[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
      {listings.map((l) => (
        <ListingCard key={l.id} listing={l} />
      ))}
    </div>
  );
}
