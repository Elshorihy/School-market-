'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Input, Select } from '@/components/ui/Field';
import { Spinner } from '@/components/ui/Misc';
import { Icon } from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toast';
import { upsertSchoolAction } from '@/lib/actions/admin';

export function SchoolForm({ governorates }: { governorates: { id: string; name: string }[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState('');
  const [governorateId, setGovernorateId] = useState('');
  const [areaId, setAreaId] = useState('');
  const [areas, setAreas] = useState<{ id: string; name: string }[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!governorateId) {
      setAreas([]);
      return;
    }
    fetch(`/api/geo?governorateId=${governorateId}`)
      .then((r) => r.json())
      .then((j) => j.ok && setAreas(j.data.areas))
      .catch(() => {});
    setAreaId('');
  }, [governorateId]);

  return (
    <form
      className="card grid gap-3 p-4 sm:grid-cols-[1.4fr_1fr_1fr_auto]"
      onSubmit={(e) => {
        e.preventDefault();
        setError('');
        if (name.trim().length < 2) {
          setError('اسم المدرسة قصير جدًا');
          return;
        }
        if (!governorateId) {
          setError('اختر المحافظة');
          return;
        }
        if (!areaId) {
          setError('اختر المركز');
          return;
        }
        startTransition(async () => {
          const res = await upsertSchoolAction({ name: name.trim(), areaId, isActive: true });
          if (!res.ok) {
            setError(res.error);
            return;
          }
          setName('');
          setGovernorateId('');
          toast('success', 'تمت إضافة المدرسة');
          router.refresh();
        });
      }}
    >
      <div>
        <Input label="مدرسة جديدة" placeholder="مثال: مدرسة طنطا الرسمية" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
        {error && <p role="alert" className="mt-1 text-xs font-medium text-rose-600">{error}</p>}
      </div>
      <Select
        label="المحافظة"
        required
        placeholder="اختر"
        value={governorateId}
        onChange={(e) => setGovernorateId(e.target.value)}
        options={governorates.map((g) => ({ value: g.id, label: g.name }))}
      />
      <Select
        label="المركز"
        required
        placeholder={governorateId ? 'اختر' : 'اختر المحافظة أولًا'}
        disabled={!governorateId}
        value={areaId}
        onChange={(e) => setAreaId(e.target.value)}
        options={areas.map((a) => ({ value: a.id, label: a.name }))}
      />
      <div className="flex items-end">
        <button type="submit" disabled={pending} className="btn-primary btn-md w-full">
          {pending ? <Spinner /> : <Icon name="plus" size={16} />}
          إضافة
        </button>
      </div>
    </form>
  );
}
