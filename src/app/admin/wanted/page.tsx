import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { getDb, wantedItems, users, categories } from '@/db';
import { and, count, desc, eq, ilike, or } from 'drizzle-orm';
import { z } from 'zod';
import { clampInt, timeAgo, WANTED_STATUS_LABELS } from '@/lib/utils';
import { Badge, EmptyState } from '@/components/ui/Misc';
import { ActionButton } from '@/components/admin/ActionButton';
import { SearchBox } from '@/components/admin/SearchBox';
import { setWantedStatusAction, deleteWantedAdminAction } from '@/lib/actions/admin';

export const metadata: Metadata = { title: 'طلبات مطلوب' };
export const dynamic = 'force-dynamic';

const PAGE_SIZE = 20;
const filterSchema = z.object({
  q: z.string().trim().max(100).optional(),
  status: z.enum(['open', 'found', 'closed']).optional(),
  page: z.coerce.number().int().min(1).optional()
});

export default async function AdminWantedPage({
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
    f.q ? or(ilike(wantedItems.title, `%${f.q}%`), ilike(wantedItems.description, `%${f.q}%`)) : undefined,
    f.status ? eq(wantedItems.status, f.status) : undefined
  );
  const [rows, total] = await Promise.all([
    db
      .select({
        id: wantedItems.id,
        title: wantedItems.title,
        status: wantedItems.status,
        createdAt: wantedItems.createdAt,
        ownerName: users.name,
        ownerId: users.id,
        categoryName: categories.name
      })
      .from(wantedItems)
      .innerJoin(users, eq(wantedItems.userId, users.id))
      .leftJoin(categories, eq(wantedItems.categoryId, categories.id))
      .where(where)
      .orderBy(desc(wantedItems.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ n: count() }).from(wantedItems).where(where)
  ]);
  const totalPages = Math.max(1, Math.ceil((total[0]?.n ?? 0) / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold">طلبات «مطلوب»</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{total[0]?.n ?? 0} طلب</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Suspense>
<SearchBox placeholder="بحث..." defaultValue={f.q} href="/admin/wanted" />
            </Suspense>
          {(['', 'open', 'found', 'closed'] as const).map((s) => (
            <Link
              key={s || 'all'}
              href={(() => {
                const p2 = new URLSearchParams(raw);
                p2.delete('page');
                p2.delete('status');
                if (s) p2.set('status', s);
                const str = p2.toString();
                return str ? `/admin/wanted?${str}` : '/admin/wanted';
              })()}
              className={`btn-sm !rounded-full ${!f.status || f.status === s ? 'bg-brand-600 text-white' : 'btn-outline'}`}
            >
              {s === '' ? 'الكل' : WANTED_STATUS_LABELS[s]}
            </Link>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState icon="target" title="لا توجد طلبات مطابقة" />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-right text-xs text-slate-400 dark:border-slate-800">
                <th className="px-4 py-3 font-bold">الطلب</th>
                <th className="px-4 py-3 font-bold">صاحب الطلب</th>
                <th className="px-4 py-3 font-bold">الحالة</th>
                <th className="px-4 py-3 font-bold">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
              {rows.map((w) => (
                <tr key={w.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                  <td className="max-w-72 px-4 py-3">
                    <Link href={`/wanted/${w.id}`} className="line-clamp-1 font-bold hover:text-brand-600" dir="auto">
                      {w.title}
                    </Link>
                    <p className="text-xs text-slate-400">
                      {w.categoryName ?? '—'} · {timeAgo(w.createdAt)}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/user/${w.ownerId}`} className="text-xs font-bold hover:text-brand-600">
                      {w.ownerName}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={w.status === 'open' ? 'brand' : w.status === 'found' ? 'amber' : 'slate'}>
                      {WANTED_STATUS_LABELS[w.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {w.status !== 'closed' && (
                        <ActionButton
                          label="إغلاق"
                          icon="x"
                          action={setWantedStatusAction} args={[w.id, 'closed']}
                          successMessage="تم إغلاق الطلب"
                        />
                      )}
                      <ActionButton
                        label="حذف"
                        icon="trash"
                        tone="danger"
                        confirm="حذف الطلب نهائيًا؟"
                        action={deleteWantedAdminAction} args={[w.id]}
                        successMessage="تم حذف الطلب"
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
            <Link
              key={p}
              href={`/admin/wanted?page=${p}${f.status ? `&status=${f.status}` : ''}`}
              className={`btn-sm !rounded-full ${p === page ? 'bg-brand-600 text-white' : 'btn-outline'}`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}