import type { Metadata } from 'next';
import { getDb, categories, listings, wantedItems } from '@/db';
import { asc, count, eq } from 'drizzle-orm';
import { Badge } from '@/components/ui/Misc';
import { ActionButton } from '@/components/admin/ActionButton';
import { upsertCategoryAction, deleteCategoryAction } from '@/lib/actions/admin';
import { CategoryForm } from './CategoryForm';

export const metadata: Metadata = { title: 'التصنيفات' };
export const dynamic = 'force-dynamic';

export default async function AdminCategoriesPage() {
  const db = getDb();
  const rows = await db
    .select({
      id: categories.id,
      name: categories.name,
      icon: categories.icon,
      isActive: categories.isActive,
      sort: categories.sort,
      listingCount: count(listings.id),
      wantedCount: count(wantedItems.id)
    })
    .from(categories)
    .leftJoin(listings, eq(listings.categoryId, categories.id))
    .leftJoin(wantedItems, eq(wantedItems.categoryId, categories.id))
    .groupBy(categories.id, categories.name, categories.icon, categories.isActive, categories.sort)
    .orderBy(asc(categories.sort));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-extrabold">التصنيفات</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          أضف أو عدّل أو عطّل تصنيفات المنصة — لا يمكن حذف تصنيف مستخدم في إعلانات
        </p>
      </div>

      <CategoryForm />

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-right text-xs text-slate-400 dark:border-slate-800">
              <th className="px-4 py-3 font-bold">التصنيف</th>
              <th className="px-4 py-3 font-bold">الإعلانات</th>
              <th className="px-4 py-3 font-bold">الطلبات</th>
              <th className="px-4 py-3 font-bold">الحالة</th>
              <th className="px-4 py-3 font-bold">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
            {rows.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                <td className="px-4 py-3">
                  <span className="me-2 text-lg">{c.icon ?? '📦'}</span>
                  <span className="font-bold">{c.name}</span>
                </td>
                <td className="px-4 py-3 text-xs font-bold">{c.listingCount}</td>
                <td className="px-4 py-3 text-xs font-bold">{c.wantedCount}</td>
                <td className="px-4 py-3">
                  <Badge tone={c.isActive ? 'brand' : 'slate'}>{c.isActive ? 'مفعّل' : 'معطّل'}</Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    <ActionButton
                      label={c.isActive ? 'تعطيل' : 'تفعيل'}
                      icon={c.isActive ? 'ban' : 'check'}
                      tone={c.isActive ? 'default' : 'brand'}
                      action={upsertCategoryAction} args={[{ id: c.id, name: c.name, icon: c.icon ?? '', isActive: !c.isActive }]}
                      successMessage={c.isActive ? 'تم تعطيل التصنيف' : 'تم تفعيل التصنيف'}
                    />
                    <ActionButton
                      label="حذف"
                      icon="trash"
                      tone="danger"
                      confirm="حذف التصنيف؟ لن يتم الحذف إذا كان مستخدمًا في إعلانات أو طلبات."
                      action={deleteCategoryAction} args={[c.id]}
                      successMessage="تم حذف التصنيف"
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
