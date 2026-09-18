'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Input, Textarea } from '@/components/ui/Field';
import { GeoSelects } from '@/components/marketplace/GeoSelects';
import { ImageUploader } from '@/components/marketplace/ImageUploader';
import { Spinner } from '@/components/ui/Misc';
import { Icon } from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toast';
import { updateProfileAction } from '@/lib/actions/profile';

export function ProfileForm({
  initial
}: {
  initial: {
    name: string;
    bio: string | null;
    avatarUrl: string | null;
    governorateId: string | null;
    areaId: string | null;
    schoolId: string | null;
  };
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(initial.name);
  const [bio, setBio] = useState(initial.bio ?? '');
  const [avatarUrl, setAvatarUrl] = useState<string[]>(initial.avatarUrl ? [initial.avatarUrl] : []);
  const [governorateId, setGovernorateId] = useState(initial.governorateId ?? '');
  const [areaId, setAreaId] = useState(initial.areaId ?? '');
  const [schoolId, setSchoolId] = useState(initial.schoolId ?? '');
  const [error, setError] = useState('');

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        setError('');
        if (name.trim().length < 2) {
          setError('اكتب اسمًا صحيحًا');
          return;
        }
        startTransition(async () => {
          const res = await updateProfileAction({
            name: name.trim(),
            bio,
            avatarUrl: avatarUrl[0] ?? '',
            governorateId: governorateId || '',
            areaId: areaId || '',
            schoolId: schoolId || ''
          });
          if (!res.ok) {
            setError(res.error);
            return;
          }
          toast('success', 'تم حفظ بياناتك');
          router.refresh();
        });
      }}
    >
      {error && (
        <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </p>
      )}
      <div>
        <span className="label">الصورة الشخصية</span>
        <ImageUploader images={avatarUrl} onChange={(urls) => setAvatarUrl(urls.slice(0, 1))} />
      </div>
      <Input label="الاسم" required value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
      <Textarea
        label="نبذة عنك (اختياري)"
        placeholder="مثال: طالب ثانوية عامة، أبيع ملازم وأدوات..."
        value={bio}
        onChange={(e) => setBio(e.target.value)}
        maxLength={300}
      />
      <div>
        <span className="label">موقعك الدراسي</span>
        <GeoSelects
          governorateId={governorateId}
          areaId={areaId}
          schoolId={schoolId}
          onChange={(g, a, s) => {
            setGovernorateId(g);
            setAreaId(a);
            setSchoolId(s);
          }}
        />
      </div>
      <button type="submit" disabled={pending} className="btn-primary btn-lg w-full">
        {pending ? <Spinner /> : <Icon name="check" size={17} />}
        حفظ التعديلات
      </button>
    </form>
  );
}
