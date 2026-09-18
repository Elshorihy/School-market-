import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getDb, schools, areas, governorates } from '@/db';
import { and, asc, count, eq, ilike, or } from 'drizzle-orm';
import { z } from 'zod';
import { clampInt } from '@/lib/utils';
import { Pagination, EmptyState } from '@/components/ui/Misc';
import { Icon } from '@/components/ui/Icon';
import { SchoolFilters } from './SchoolFilters';

export const metadata: Metadata = {
  title: 'المدارس',
  description: 'تصفح المدارس المسجلة في المنصة'
};

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 24;
const filterSchema = z.object({
  governorateId: z.string().uuid().optional(),
  areaId: z.string().uuid().optional(),
  q: z.string().trim().max(80).optional(),
  page: z.coerce.number().int().min(1).optional()
});

export default async function SchoolsPage({
  searchParams
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const raw: Record<string, string> = {};
  for (const [k, v] of Object.entries(searchParams)) if (typeof v === 'string') raw[k] = v;
  const parsed = filterSchema.safeParse(raw);
  const f = parsed.success ? parsed.data : {};
  const page = clampInt(f.page, 1, 200, 1);
  const db = getDb();

  const where = and(
    f.governorateId ? eq(areas.governorateId, f.governorateId) : undefined,
    f.areaId ? eq(schools.areaId, f.areaId) : undefined,
    f.q ? or(ilike(schools.name, `%${f.q}%`)) : undefined
  );

  const [govs, areaOpts, rows, total] = await Promise.all([
    db
      .select({ id: governorates.id, name: governorates.name })
      .from(governorates)
      .orderBy(asc(governorates.sort)),
    f.governorateId
      ? db
          .select({ id: areas.id, name: areas.name })
          .from(areas)
          .where(eq(areas.governorateId, f.governorateId))
          .orderBy(asc(areas.name))
      : Promise.resolve([] as { id: string; name: string }[]),
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
    return s ? `/schools?${s}` : '/schools';
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-extrabold">المدارس</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">{total[0]?.n ?? 0} مدرسة مسجلة</p>
      </div>
      <Suspense>
        <SchoolFilters
          governorates={govs}
          areas={areaOpts}
          governorateId={f.governorateId}
          areaId={f.areaId}
          q={f.q}
        />
      </Suspense>
      {rows.length === 0 ? (
        <EmptyState icon="school" title="لا توجد مدارس مطابقة" description="جرّب تغيير المحافظة أو اسم البحث." />
      ) : (
        <ul className="card divide-y divide-slate-100 dark:divide-slate-800">
          {rows.map((s) => (
            <li key={s.id} className="flex items-center gap-3 px-4 py-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300">
                <Icon name="school" size={17} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{s.name}</p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                  {s.areaName} · {s.governorateName}
                </p>
              </div>
              {!s.isActive && <span className="text-[10px] font-bold text-rose-500">موقوفة</span>}
            </li>
          ))}
        </ul>
      )}
      <Pagination page={page} totalPages={totalPages} makeHref={makeHref} />
    </div>
  );
}
