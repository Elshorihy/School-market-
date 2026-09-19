import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { getDb, users, governorates, areas, schools, listings } from '@/db';
import { and, count, desc, eq, ilike, or } from 'drizzle-orm';
import { z } from 'zod';
import { clampInt, formatDate } from '@/lib/utils';
import { Badge, EmptyState } from '@/components/ui/Misc';
import { Icon } from '@/components/ui/Icon';
import { ActionButton } from '@/components/admin/ActionButton';
import { SearchBox } from '@/components/admin/SearchBox';
import { setUserStatusAction, deleteUserAction } from '@/lib/actions/admin';

export const metadata: Metadata = { title: 'المستخدمون' };
export const dynamic = 'force-dynamic';

const PAGE_SIZE = 20;
const filterSchema = z.object({
  q: z.string().trim().max(80).optional(),
  status: z.enum(['active', 'suspended']).optional(),
  page: z.coerce.number().int().min(1).optional()
});

export default async function AdminUsersPage({
  searchParams
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const raw: Record<string, string> = {};
  for (const [k, v] of Object.entries(searchParams)) if (typeof v === 'string') raw[k] = v;
  const f = filterSchema.safeParse(raw) ?? { success: true, data: {} as Record<string, unknown> };
  const filters = f.success ? (f.data as { q?: string; status?: string; page?: number }) : {};
  const page = clampInt(filters.page, 1, 200, 1);
  const db = getDb();

  const where = and(
    filters.q
      ? or(ilike(users.name, `%${filters.q}%`), ilike(users.email, `%${filters.q}%`))
      : undefined,
    filters.status ? eq(users.status, filters.status as 'active' | 'suspended') : undefined
  );

  const [rows, total] = await Promise.all([
    db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        status: users.status,
        createdAt: users.createdAt,
        governorateName: governorates.name,
        areaName: areas.name,
        schoolName: schools.name,
        listingCount: count(listings.id)
      })
      .from(users)
      .leftJoin(governorates, eq(users.governorateId, governorates.id))
      .leftJoin(areas, eq(users.areaId, areas.id))
      .leftJoin(schools, eq(users.schoolId, schools.id))
      .leftJoin(listings, and(eq(listings.userId, users.id), eq(listings.status, 'active')))
      .where(where)
      .groupBy(users.id, governorates.name, areas.name, schools.name)
      .orderBy(desc(users.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ n: count() }).from(users).where(where)
  ]);

  const totalPages = Math.max(1, Math.ceil((total[0]?.n ?? 0) / PAGE_SIZE));

  function makeHref(p: number) {
    const p2 = new URLSearchParams(raw);
    p2.delete('page');
    if (p > 1) p2.set('page', String(p));
    const s = p2.toString();
    return s ? `/admin/users?${s}` : '/admin/users';
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold">المستخدمون</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{total[0]?.n ?? 0} مستخدم</p>
        </div>
        <div className="flex gap-2">
          <Suspense>
<SearchBox placeholder="بحث بالاسم أو البريد..." defaultValue={filters.q} href="/admin/users" />
            </Suspense>
          <div className="flex gap-1">
            {(['', 'active', 'suspended'] as const).map((s) => (
              <Link
                key={s || 'all'}
                href={(() => {
                  const p2 = new URLSearchParams(raw);
                  p2.delete('page');
                  p2.delete('status');
                  if (s) p2.set('status', s);
                  const str = p2.toString();
                  return str ? `/admin/users?${str}` : '/admin/users';
                })()}
                className={`btn-sm !rounded-full ${!filters.status || filters.status === s ? 'bg-brand-600 text-white' : 'btn-outline'}`}
              >
                {s === '' ? 'الكل' : s === 'active' ? 'نشط' : 'موقوف'}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState icon="users" title="لا يوجد مستخدمون مطابقون" />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-right text-xs text-slate-400 dark:border-slate-800">
                <th className="px-4 py-3 font-bold">المستخدم</th>
                <th className="px-4 py-3 font-bold">الدور</th>
                <th className="px-4 py-3 font-bold">الموقع</th>
                <th className="px-4 py-3 font-bold">إعلانات نشطة</th>
                <th className="px-4 py-3 font-bold">تاريخ الانضمام</th>
                <th className="px-4 py-3 font-bold">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
              {rows.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                  <td className="px-4 py-3">
                    <Link href={`/user/${u.id}`} className="font-bold hover:text-brand-600">{u.name}</Link>
                    <p className="text-xs text-slate-400" dir="ltr">{u.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col items-start gap-1">
                      {u.role === 'admin' ? <Badge tone="violet">إداري</Badge> : <Badge tone="slate">طالب</Badge>}
                      {u.status === 'suspended' && <Badge tone="rose">موقوف</Badge>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                    {[u.schoolName, u.areaName, u.governorateName].filter(Boolean).join(' · ') || '—'}
                  </td>
                  <td className="px-4 py-3 font-bold">{u.listingCount}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">{formatDate(u.createdAt)}</td>
                  <td className="px-4 py-3">
                    {u.role !== 'admin' && (
                      <div className="flex flex-wrap gap-1.5">
                        <ActionButton
                          label={u.status === 'active' ? 'إيقاف' : 'تفعيل'}
                          icon={u.status === 'active' ? 'ban' : 'check'}
                          tone={u.status === 'active' ? 'danger' : 'brand'}
                          action={setUserStatusAction} args={[u.id, u.status === 'active' ? 'suspended' : 'active']}
                          successMessage={u.status === 'active' ? 'تم إيقاف الحساب' : 'تم تفعيل الحساب'}
                        />
                        <ActionButton
                          label="حذف"
                          icon="trash"
                          tone="danger"
                          confirm="سيتم حذف الحساب وجميع محتوياته غير النشطة. هل أنت متأكد؟"
                          action={deleteUserAction} args={[u.id]}
                          successMessage="تم حذف الحساب"
                        />
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5">
          {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 10).map((p) => (
            <Link
              key={p}
              href={makeHref(p)}
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