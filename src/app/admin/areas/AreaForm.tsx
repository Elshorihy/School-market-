'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Input, Select } from '@/components/ui/Field';
import { Spinner } from '@/components/ui/Misc';
import { Icon } from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toast';
import { upsertAreaAction } from '@/lib/actions/admin';

export function AreaForm({ governorates }: { governorates: { id: string; name: string }[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState('');
  const [governorateId, setGovernorateId] = useState('');
  const [error, setError] = useState('');

  return (
    <form
      className="card grid gap-3 p-4 sm:grid-cols-[1fr_1fr_auto]"
      onSubmit={(e) => {
        e.preventDefault();
        setError('');
        if (name.trim().length < 2) {
          setError('اسم المركز قصير جدًا');
          return;
        }
        if (!governorateId) {
          setError('اختر المحافظة');
          return;
        }
        startTransition(async () => {
          const res = await upsertAreaAction({ name: name.trim(), governorateId });
          if (!res.ok) {
            setError(res.error);
            return;
          }
          setName('');
          toast('success', 'تمت إضافة المركز');
          router.refresh();
        });
      }}
    >
      <div>
        <Input label="مركز / مدينة جديدة" placeholder="مثال: طنطا" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
        {error && <p role="alert" className="mt-1 text-xs font-medium text-rose-600">{error}</p>}
      </div>
      <Select
        label="المحافظة"
        required
        placeholder="اختر المحافظة"
        value={governorateId}
        onChange={(e) => setGovernorateId(e.target.value)}
        options={governorates.map((g) => ({ value: g.id, label: g.name }))}
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
