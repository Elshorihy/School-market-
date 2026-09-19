'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Field';
import { Spinner } from '@/components/ui/Misc';
import { Icon } from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toast';
import { upsertGovernorateAction } from '@/lib/actions/admin';

export function GovernorateForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  return (
    <form
      className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-end"
      onSubmit={(e) => {
        e.preventDefault();
        setError('');
        if (name.trim().length < 2) {
          setError('اسم المحافظة قصير جدًا');
          return;
        }
        startTransition(async () => {
          const res = await upsertGovernorateAction({ name: name.trim() });
          if (!res.ok) {
            setError(res.error);
            return;
          }
          setName('');
          toast('success', 'تمت إضافة المحافظة');
          router.refresh();
        });
      }}
    >
      <div className="flex-1">
        <Input label="محافظة جديدة" placeholder="مثال: الجيزة" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} />
        {error && <p role="alert" className="mt-1 text-xs font-medium text-rose-600">{error}</p>}
      </div>
      <button type="submit" disabled={pending} className="btn-primary btn-md">
        {pending ? <Spinner /> : <Icon name="plus" size={16} />}
        إضافة
      </button>
    </form>
  );
}
