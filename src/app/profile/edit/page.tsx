import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { ProfileForm } from '@/components/profile/ProfileForm';

export const metadata: Metadata = {
  title: 'تعديل الملف الشخصي',
  robots: { index: false }
};

export const dynamic = 'force-dynamic';

export default async function EditProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/profile/edit');
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-5 text-xl font-extrabold">تعديل الملف الشخصي</h1>
      <div className="card p-5 sm:p-6">
        <ProfileForm
          initial={{
            name: user.name,
            bio: user.bio,
            avatarUrl: user.avatarUrl,
            governorateId: user.governorateId,
            areaId: user.areaId,
            schoolId: user.schoolId
          }}
        />
      </div>
    </div>
  );
}
