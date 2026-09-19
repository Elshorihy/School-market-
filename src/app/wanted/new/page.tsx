import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getDb, categories } from '@/db';
import { asc, eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';
import { WantedForm } from '@/components/wanted/WantedForm';

export const metadata: Metadata = {
  title: 'نشر طلب جديد',
  robots: { index: false }
};

export const dynamic = 'force-dynamic';

export default async function NewWantedPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/wanted/new');
  const db = getDb();
  const cats = await db
    .select({ id: categories.id, name: categories.name, icon: categories.icon })
    .from(categories)
    .where(eq(categories.isActive, true))
    .orderBy(asc(categories.sort));

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-xl font-extrabold">نشر طلب «مطلوب»</h1>
      <p className="mb-5 text-sm text-slate-500 dark:text-slate-400">
        اكتب ما تبحث عنه، وسنطابقه مع الإعلانات المتاحة في محافظتك ومنطقتك
      </p>
      <div className="card p-5 sm:p-6">
        <WantedForm categories={cats} />
      </div>
    </div>
  );
}
