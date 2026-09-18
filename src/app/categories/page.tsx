import type { Metadata } from 'next';
import Link from 'next/link';
import { getDb, categories, listings, wantedItems } from '@/db';
import { asc, count, eq } from 'drizzle-orm';
import { Icon } from '@/components/ui/Icon';

export const metadata: Metadata = {
  title: 'التصنيفات',
  description: 'تصفح كل تصنيفات سوق المدرسي'
};

export const dynamic = 'force-dynamic';

export default async function CategoriesPage() {
  const db = getDb();
  const rows = await db
    .select({
      id: categories.id,
      name: categories.name,
      icon: categories.icon,
      isActive: categories.isActive,
      listingCount: count(listings.id),
      wantedCount: count(wantedItems.id)
    })
    .from(categories)
    .leftJoin(listings, eq(listings.categoryId, categories.id))
    .leftJoin(wantedItems, eq(wantedItems.categoryId, categories.id))
    .groupBy(categories.id, categories.name, categories.icon, categories.isActive, categories.sort)
    .orderBy(asc(categories.sort));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-extrabold">التصنيفات</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">كل تصنيفات المنصة مع عدد الإعلانات في كل منها</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((c) => (
          <Link
            key={c.id}
            href={`/listings?categoryId=${c.id}`}
            className="card flex items-center gap-3 p-4 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-2xl dark:bg-slate-800">
              {c.icon ?? '📦'}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold">{c.name}</span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">
                {c.listingCount} إعلان · {c.wantedCount} طلب
              </span>
            </span>
            {!c.isActive && <span className="text-[10px] font-bold text-rose-500">موقوف</span>}
            <Icon name="chevron-left" size={16} className="text-slate-300" />
          </Link>
        ))}
      </div>
    </div>
  );
}
