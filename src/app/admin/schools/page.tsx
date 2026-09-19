import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getDb, schools, areas, governorates } from '@/db';
import { asc, count, eq, ilike, or } from 'drizzle-orm';
import { z } from 'zod';
import { Badge, EmptyState } from '@/components/ui/Misc';
import { Icon } from '@/components/ui/Icon';
import { ActionButton } from '@/components/admin/ActionButton';
import { SearchBox } from '@/components/admin/SearchBox';
import { upsertSchoolAction, deleteSchoolAction } from '@/lib/actions/admin';
import { SchoolForm } from './SchoolForm';
import { SchoolRowActions } from './SchoolRowActions';

export const metadata: Metadata = { title: 'المدارس' };
export const dynamic = 'force-dynamic';

const PAGE_SIZE = 25;
const filterSchema = z.object({
  governorateId: z.string().uuid().optional(),
  q: z.string().trim().max(80).optional(),
  page: z.coerce.number().int().min(1).optional()
});

export default async function AdminSchoolsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const raw: Record<string, string> = {};
  for (const [k, v] of Object.entries(resolvedSearchParams)) if (typeof v === 'string') raw[k] = v;
  const parsed = filterSchema.safeParse(raw);
  const f = parsed.success ? parsed.data : {};
  const page = f.page ?? 1;
  const db = getDb();

  const where = or(
    f.governorateId ? eq(areas.governorateId, f.governorateId) : undefined,
    f.q ? ilike(schools.name, `%${f.q}%`) : undefined
  );

  const [govs, rows, total] = await Promise.all([
    db.select({ id: governorates.id, name: governorates.name }).from(governorates).orderBy(asc(governorates.sort)),
    db
      .select({
        id: schools.id,
        name: schools.name,
        isActive: schools.isActive,
        areaName: areas.name,
        governorateName: governorates.name
      })
      .from(schools)
      .innerJoin(areas, eq(schools.areaId, areas.id))
      .innerJoin(governorates, eq(areas.governorateId, governorates.id))
      .where(where)
      .orderBy(asc(schools.name))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db
      .select({ n: count() })
      .from(schools)
      .innerJoin(areas, eq(schools.areaId, areas.id))
      .where(where)
  ]);

  const totalPages = Math.max(1, Math.ceil((total[0]?.n ?? 0) / PAGE_SIZE));

  function makeHref(p: number) {
    const p2 = new URLSearchParams(raw);
    p2.delete('page');
    if (p > 1) p2.set('page', String(p));
    const s = p2.toString();
    return s ? `/admin/schools?${s}` : '/admin/schools';
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold">المدارس</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {total[0]?.n ?? 0} مدرسة — لا يمكن حذف مدرسة مرتبطة بمستخدمين أو إعلانات
          </p>
        </div>
        <Suspense>
<SearchBox placeholder="بحث باسم المدرسة..." defaultValue={f.q} href="/admin/schools" />
            </Suspense>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <a href="/admin/schools" className={`btn-sm !rounded-full ${!f.governorateId ? 'bg-brand-600 text-white' : 'btn-outline'}`}>
          الكل
        </a>
        {govs.map((g) => (
          <a
            key={g.id}
            href={`/admin/schools?governorateId=${g.id}`}
            className={`btn-sm !rounded-full ${f.governorateId === g.id ? 'bg-brand-600 text-white' : 'btn-outline'}`}
          >
            {g.name}
          </a>
        ))}
      </div>

      <SchoolForm governorates={govs} />

      {rows.length === 0 ? (
        <EmptyState icon="school" title="لا توجد مدارس مطابقة" />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-right text-xs text-slate-400 dark:border-slate-800">
                <th className="px-4 py-3 font-bold">المدرسة</th>
                <th className="px-4 py-3 font-bold">المركز</th>
                <th className="px-4 py-3 font-bold">المحافظة</th>
                <th className="px-4 py-3 font-bold">الحالة</th>
                <th className="px-4 py-3 font-bold">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
              {rows.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2 font-bold">
                      <Icon name="school" size={15} className="text-slate-400" />
                      {s.name}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">{s.areaName}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">{s.governorateName}</td>
                  <td className="px-4 py-3">
                    <Badge tone={s.isActive ? 'brand' : 'slate'}>{s.isActive ? 'مفعلة' : 'معطلة'}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      <ActionButton
                        label={s.isActive ? 'تعطيل' : 'تفعيل'}
                        icon={s.isActive ? 'ban' : 'check'}
                        tone={s.isActive ? 'default' : 'brand'}
                        action={upsertSchoolAction}
                        args={[{ id: s.id, name: s.name, areaId: 'unchanged', isActive: !s.isActive }]}
                        successMessage={s.isActive ? 'تم تعطيل المدرسة' : 'تم تفعيل المدرسة'}
                      />
                      <SchoolRowActions id={s.id} name={s.name} governorates={govs} />
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
            <a key={p} href={makeHref(p)} className={`btn-sm !rounded-full ${p === page ? 'bg-brand-600 text-white' : 'btn-outline'}`}>
              {p}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}