import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getDb, areas, governorates, schools } from '@/db';
import { asc, count, eq } from 'drizzle-orm';
import { z } from 'zod';
import { AreaForm } from './AreaForm';
import { AreaRowActions } from './AreaRowActions';

export const metadata: Metadata = { title: 'المراكز والمدن' };
export const dynamic = 'force-dynamic';

const filterSchema = z.object({ governorateId: z.string().uuid().optional() });

export default async function AdminAreasPage({
  searchParams
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const raw: Record<string, string> = {};
  for (const [k, v] of Object.entries(searchParams)) if (typeof v === 'string') raw[k] = v;
  const parsed = filterSchema.safeParse(raw);
  const governorateId = parsed.success ? parsed.data.governorateId : undefined;
  const db = getDb();

  const [govs, rows] = await Promise.all([
    db.select({ id: governorates.id, name: governorates.name }).from(governorates).orderBy(asc(governorates.sort)),
    db
      .select({
        id: areas.id,
        name: areas.name,
        governorateName: governorates.name,
        schoolCount: count(schools.id)
      })
      .from(areas)
      .innerJoin(governorates, eq(areas.governorateId, governorates.id))
      .leftJoin(schools, eq(schools.areaId, areas.id))
      .where(governorateId ? eq(areas.governorateId, governorateId) : undefined)
      .groupBy(areas.id, areas.name, governorates.id)
      .orderBy(asc(areas.name))
      .limit(400)
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-extrabold">المراكز والمدن</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {rows.length} مركز — لا يمكن حذف مركز مرتبط بمدارس أو مستخدمين أو إعلانات
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <a href="/admin/areas" className={`btn-sm !rounded-full ${!governorateId ? 'bg-brand-600 text-white' : 'btn-outline'}`}>
          الكل
        </a>
        {govs.map((g) => (
          <a
            key={g.id}
            href={`/admin/areas?governorateId=${g.id}`}
            className={`btn-sm !rounded-full ${governorateId === g.id ? 'bg-brand-600 text-white' : 'btn-outline'}`}
          >
            {g.name}
          </a>
        ))}
      </div>

      <AreaForm governorates={govs} />

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-right text-xs text-slate-400 dark:border-slate-800">
              <th className="px-4 py-3 font-bold">المركز</th>
              <th className="px-4 py-3 font-bold">المحافظة</th>
              <th className="px-4 py-3 font-bold">المدارس</th>
              <th className="px-4 py-3 font-bold">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
            {rows.map((a) => (
              <tr key={a.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                <td className="px-4 py-3 font-bold">{a.name}</td>
                <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">{a.governorateName}</td>
                <td className="px-4 py-3 text-xs font-bold">{a.schoolCount}</td>
                <td className="px-4 py-3">
                  <AreaRowActions id={a.id} name={a.name} governorates={govs} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
