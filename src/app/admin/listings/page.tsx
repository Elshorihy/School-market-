import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { getDb, listings, users, categories, governorates } from '@/db';
import { and, desc, eq, ilike, or } from 'drizzle-orm';
import { z } from 'zod';
import { clampInt, formatPrice, LISTING_STATUS_LABELS, LISTING_TYPE_LABELS, timeAgo } from '@/lib/utils';
import { Badge, EmptyState } from '@/components/ui/Misc';
import { ActionButton } from '@/components/admin/ActionButton';
import { SearchBox } from '@/components/admin/SearchBox';
import { setAdminListingStatusAction, hardDeleteListingAction } from '@/lib/actions/admin';

export const metadata: Metadata = { title: 'الإعلانات' };
export const dynamic = 'force-dynamic';

const PAGE_SIZE = 20;
const filterSchema = z.object({
  q: z.string().trim().max(100).optional(),
  status: z.enum(['active', 'sold', 'exchanged', 'closed', 'pending', 'removed']).optional(),
  page: z.coerce.number().int().min(1).optional()
});

const STATUSES = Object.keys(LISTING_STATUS_LABELS) as (keyof typeof LISTING_STATUS_LABELS)[];

export default async function AdminListingsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const raw: Record<string, string> = {};
  for (const [k, v] of Object.entries(resolvedSearchParams)) if (typeof v === 'string') raw[k] = v;
  const parsed = filterSchema.safeParse(raw);
  const f = parsed.success ? parsed.data : {};
  const page = clampInt(f.page, 1, 200, 1);
  const db = getDb();

  const where = and(
    f.q ? or(ilike(listings.title, `%${f.q}%`), ilike(listings.description, `%${f.q}%`)) : undefined,
    f.status ? eq(listings.status, f.status) : undefined
  );

  const [rows, total] = await Promise.all([
    db
      .select({
        id: listings.id,
        title: listings.title,
        type: listings.type,
        price: listings.price,
        status: listings.status,
        createdAt: listings.createdAt,
        sellerName: users.name,
        sellerId: users.id,
        categoryName: categories.name,
        governorateName: governorates.name
      })
      .from(listings)
      .innerJoin(users, eq(listings.userId, users.id))
      .leftJoin(categories, eq(listings.categoryId, categories.id))
      .leftJoin(governorates, eq(listings.governorateId, governorates.id))
      .where(where)
      .orderBy(desc(listings.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ n: (await import('drizzle-orm')).count() }).from(listings).where(where)
  ]);

  const totalPages = Math.max(1, Math.ceil((total[0]?.n ?? 0) / PAGE_SIZE));

  function makeHref(p: number, status?: string) {
    const p2 = new URLSearchParams(raw);
    p2.delete('page');
    p2.delete('status');
    if (status) p2.set('status', status);
    if (p > 1) p2.set('page', String(p));
    const s = p2.toString();
    return s ? `/admin/listings?${s}` : '/admin/listings';
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold">الإعلانات</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{total[0]?.n ?? 0} إعلان</p>
        </div>
        <Suspense>
<SearchBox placeholder="بحث في العناوين والأوصاف..." defaultValue={f.q} href="/admin/listings" />
            </Suspense>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Link href={makeHref(1)} className={`btn-sm !rounded-full ${!f.status ? 'bg-brand-600 text-white' : 'btn-outline'}`}>
          الكل
        </Link>
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={makeHref(1, s)}
            className={`btn-sm !rounded-full ${f.status === s ? 'bg-brand-600 text-white' : 'btn-outline'}`}
          >
            {LISTING_STATUS_LABELS[s]}
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <EmptyState icon="store" title="لا توجد إعلانات مطابقة" />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-right text-xs text-slate-400 dark:border-slate-800">
                <th className="px-4 py-3 font-bold">الإعلان</th>
                <th className="px-4 py-3 font-bold">النوع</th>
                <th className="px-4 py-3 font-bold">السعر</th>
                <th className="px-4 py-3 font-bold">البائع</th>
                <th className="px-4 py-3 font-bold">الحالة</th>
                <th className="px-4 py-3 font-bold">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
              {rows.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                  <td className="max-w-64 px-4 py-3">
                    <Link href={`/listings/${l.id}`} className="line-clamp-1 font-bold hover:text-brand-600" dir="auto">
                      {l.title}
                    </Link>
                    <p className="text-xs text-slate-400">
                      {l.categoryName ?? '—'} · {timeAgo(l.createdAt)}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-xs font-bold">{LISTING_TYPE_LABELS[l.type]}</td>
                  <td className="px-4 py-3 text-xs font-bold" dir="auto">{formatPrice(l.price, l.type)}</td>
                  <td className="px-4 py-3">
                    <Link href={`/user/${l.sellerId}`} className="text-xs font-bold hover:text-brand-600">{l.sellerName}</Link>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={l.status === 'active' ? 'brand' : l.status === 'removed' ? 'rose' : 'slate'}>
                      {LISTING_STATUS_LABELS[l.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {l.status === 'active' ? (
                        <ActionButton label="إيقاف" icon="ban" tone="danger" action={setAdminListingStatusAction} args={[l.id, 'pending']} successMessage="تم إيقاف الإعلان مؤقتًا" />
                      ) : (
                        <ActionButton label="تفعيل" icon="check" tone="brand" action={setAdminListingStatusAction} args={[l.id, 'active']} successMessage="تم تفعيل الإعلان" />
                      )}
                      {l.status !== 'removed' && (
                        <ActionButton label="إزالة" icon="flag" tone="danger" action={setAdminListingStatusAction} args={[l.id, 'removed']} successMessage="تمت إزالة الإعلان" />
                      )}
                      <ActionButton
                        label="حذف"
                        icon="trash"
                        tone="danger"
                        confirm="حذف نهائي للإعلان وكل صوره. هل أنت متأكد؟"
                        action={hardDeleteListingAction} args={[l.id]}
                        successMessage="تم حذف الإعلان"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5">
          {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map((p) => (
            <Link key={p} href={makeHref(p)} className={`btn-sm !rounded-full ${p === page ? 'bg-brand-600 text-white' : 'btn-outline'}`}>
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}