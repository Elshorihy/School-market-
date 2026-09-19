import type { Metadata } from 'next';
import { Suspense } from 'react';
import { queryListings, PAGE_SIZE } from '@/lib/queries';
import { getCurrentUser } from '@/lib/auth';
import { listingFiltersSchema } from '@/lib/validate';
import { ListingGrid } from '@/components/marketplace/ListingCard';
import { FilterPanel } from '@/components/marketplace/FilterPanel';
import { EmptyState, Pagination } from '@/components/ui/Misc';
import { Icon } from '@/components/ui/Icon';
import Link from 'next/link';
import { clampInt } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'تصفح الإعلانات',
  description: 'تصفح وبحث وفلترة الإعلانات في سوق المدرسي'
};

export const dynamic = 'force-dynamic';

export default async function ListingsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getCurrentUser();
  const resolvedSearchParams = await searchParams;
  const raw: Record<string, string> = {};
  for (const [k, v] of Object.entries(resolvedSearchParams)) {
    if (typeof v === 'string') raw[k] = v;
  }
  if (raw.reset) delete raw.reset;
  const parsed = listingFiltersSchema.safeParse(raw);
  const filters = parsed.success ? parsed.data : {};
  const page = clampInt(filters.page, 1, 500, 1);

  const { items, total, totalPages } = await queryListings({ ...filters, page }, user);

  function makeHref(nextPage: number) {
    const p2 = new URLSearchParams(raw);
    p2.delete('page');
    if (nextPage > 1) p2.set('page', String(nextPage));
    const s = p2.toString();
    return s ? `/listings?${s}` : '/listings';
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-extrabold">
          {filters.q ? (
            <>
              نتائج البحث عن «{filters.q}»{' '}
              <span className="text-sm font-semibold text-slate-400">({total} إعلان)</span>
            </>
          ) : (
            <>
              كل الإعلانات{' '}
              <span className="text-sm font-semibold text-slate-400">({total} إعلان)</span>
            </>
          )}
        </h1>
        {user && (
          <Link href="/listings/new" className="btn-primary btn-md">
            <Icon name="plus" size={16} />
            نشر إعلان
          </Link>
        )}
      </div>

      <Suspense>
        <FilterPanel />
      </Suspense>

      {items.length === 0 ? (
        <EmptyState
          icon="search"
          title="لا توجد إعلانات مطابقة لبحثك"
          description="جرّب تعديل الفلاتر أو البحث بكلمات أخرى."
        />
      ) : (
        <>
          <ListingGrid listings={items} />
          <Pagination page={page} totalPages={totalPages} makeHref={makeHref} />
        </>
      )}
    </div>
  );
}
