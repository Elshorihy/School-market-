import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getDb, wantedItems, categories } from '@/db';
import { asc, eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';
import { WantedForm } from '@/components/wanted/WantedForm';
import { resolveGeoNames } from '@/lib/geo';

export const metadata: Metadata = {
  title: 'تعديل الطلب',
  robots: { index: false }
};

export const dynamic = 'force-dynamic';

export default async function EditWantedPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/wanted/${params.id}/edit`);
  const db = getDb();
  const [item] = await db.select().from(wantedItems).where(eq(wantedItems.id, params.id)).limit(1);
  if (!item) notFound();
  if (item.userId !== user.id && user.role !== 'admin') notFound();

  const cats = await db
    .select({ id: categories.id, name: categories.name, icon: categories.icon })
    .from(categories)
    .where(eq(categories.isActive, true))
    .orderBy(asc(categories.sort));

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-5 text-xl font-extrabold">تعديل الطلب</h1>
      <div className="card p-5 sm:p-6">
        <WantedForm
          wantedId={item.id}
          categories={cats}
          initial={{
            title: item.title,
            description: item.description,
            categoryId: item.categoryId,
            governorateId: item.governorateId,
            areaId: item.areaId,
            schoolId: item.schoolId,
            status: item.status
          }}
        />
      </div>
    </div>
  );
}
