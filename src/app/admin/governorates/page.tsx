import type { Metadata } from 'next';
import { getDb, governorates, areas } from '@/db';
import { asc, count, eq } from 'drizzle-orm';
import { GovernorateForm } from './GovernorateForm';
import { GovernorateRowActions } from './GovernorateRowActions';

export const metadata: Metadata = { title: 'المحافظات' };
export const dynamic = 'force-dynamic';

export default async function AdminGovernoratesPage() {
  const db = getDb();
  const rows = await db
    .select({
      id: governorates.id,
      name: governorates.name,
      sort: governorates.sort,
      areaCount: count(areas.id)
    })
    .from(governorates)
    .leftJoin(areas, eq(areas.governorateId, governorates.id))
    .groupBy(governorates.id, governorates.name, governorates.sort)
    .orderBy(asc(governorates.sort));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-extrabold">المحافظات</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {rows.length} محافظة — لا يمكن حذف محافظة مرتبطة بمراكز أو مستخدمين
        </p>
      </div>
      <GovernorateForm />
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-right text-xs text-slate-400 dark:border-slate-800">
              <th className="px-4 py-3 font-bold">المحافظة</th>
              <th className="px-4 py-3 font-bold">عدد المراكز</th>
              <th className="px-4 py-3 font-bold">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
            {rows.map((g) => (
              <tr key={g.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                <td className="px-4 py-3 font-bold">{g.name}</td>
                <td className="px-4 py-3 text-xs font-bold">{g.areaCount}</td>
                <td className="px-4 py-3">
                  <GovernorateRowActions id={g.id} name={g.name} areaCount={g.areaCount} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
