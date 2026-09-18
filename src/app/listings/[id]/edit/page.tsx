import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getDb } from '@/db';
import { asc, eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';
import { getListingDetail } from '@/lib/queries';
import { ListingForm } from '@/components/marketplace/ListingForm';
import { categories as catsTable } from '@/db';

export const metadata: Metadata = {
  title: 'تعديل الإعلان',
  robots: { index: false }
};

export const dynamic = 'force-dynamic';

export default async function EditListingPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/listings/${params.id}/edit`);
  const listing = await getListingDetail(params.id, user);
  if (!listing) notFound();
  if (listing.userId !== user.id && user.role !== 'admin') notFound();

  const db = getDb();
  const cats = await db
    .select({ id: catsTable.id, name: catsTable.name, icon: catsTable.icon })
    .from(catsTable)
    .where(eq(catsTable.isActive, true))
    .orderBy(asc(catsTable.sort));

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-5 text-xl font-extrabold">تعديل الإعلان</h1>
      <div className="card p-5 sm:p-6">
        <ListingForm
          listingId={listing.id}
          categories={cats}
          initial={{
            type: listing.type,
            title: listing.title,
            description: listing.description,
            price: listing.price ?? '',
            categoryId: listing.categoryId,
            governorateId: listing.governorateId,
            areaId: listing.areaId,
            schoolId: listing.schoolId,
            condition: listing.condition,
            images: listing.images.map((i) => i.url)
          }}
        />
      </div>
    </div>
  );
}
