import Link from 'next/link';
type WantedLite = {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'found' | 'closed';
  createdAt: Date;
};
import { Badge } from '@/components/ui/Misc';
import { Icon } from '@/components/ui/Icon';
import { timeAgo, WANTED_STATUS_LABELS } from '@/lib/utils';

export function WantedCard({
  wanted,
  categoryName,
  location,
  matchCount
}: {
  wanted: WantedLite;
  categoryName: string | null;
  location: string | null;
  matchCount?: number;
}) {
  const tone = wanted.status === 'open' ? 'brand' : wanted.status === 'found' ? 'amber' : 'slate';
  return (
    <Link
      href={`/wanted/${wanted.id}`}
      className="card block p-4 transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="line-clamp-1 text-sm font-bold" dir="auto">
            {wanted.title}
          </h3>
          <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400" dir="auto">
            {wanted.description}
          </p>
        </div>
        <Badge tone={tone}>{WANTED_STATUS_LABELS[wanted.status]}</Badge>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
        {categoryName && (
          <span className="flex items-center gap-1">
            <Icon name="tag" size={12} />
            {categoryName}
          </span>
        )}
        {location && (
          <span className="flex items-center gap-1">
            <Icon name="map-pin" size={12} />
            {location}
          </span>
        )}
        <span className="ms-auto">{timeAgo(wanted.createdAt)}</span>
      </div>
      {matchCount !== undefined && matchCount > 0 && (
        <div className="mt-3 flex items-center gap-1.5 rounded-xl bg-brand-50 px-3 py-2 text-xs font-bold text-brand-700 dark:bg-brand-950/40 dark:text-brand-300">
          <Icon name="sparkle" size={14} />
          {matchCount} إعلان مطابق
        </div>
      )}
    </Link>
  );
}
