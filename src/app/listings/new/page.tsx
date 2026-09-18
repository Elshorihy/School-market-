import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getDb, categories } from '@/db';
import { asc, eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';
import { ListingForm } from '@/components/marketplace/ListingForm';

export const metadata: Metadata = {
  title: 'نشر إعلان جديد',
  robots: { index: false }
};

export const dynamic = 'force-dynamic';

export default async function NewListingPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/listings/new');
  const db = getDb();
  const cats = await db
    .select({ id: categories.id, name: categories.name, icon: categories.icon })
    .from(categories)
    .where(eq(categories.isActive, true))
    .orderBy(asc(categories.sort));

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-5 text-xl font-extrabold">نشر إعلان جديد</h1>
      <div className="card p-5 sm:p-6">
        <ListingForm categories={cats} />
      </div>
    </div>
  );
}
