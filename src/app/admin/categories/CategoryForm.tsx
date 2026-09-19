'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Field';
import { Spinner } from '@/components/ui/Misc';
import { Icon } from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toast';
import { upsertCategoryAction } from '@/lib/actions/admin';

export function CategoryForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');
  const [error, setError] = useState('');

  return (
    <form
      className="card grid gap-3 p-4 sm:grid-cols-[1fr_120px_auto]"
      onSubmit={(e) => {
        e.preventDefault();
        setError('');
        if (name.trim().length < 2) {
          setError('اسم التصنيف قصير جدًا');
          return;
        }
        startTransition(async () => {
          const res = await upsertCategoryAction({ name: name.trim(), icon: icon.trim(), isActive: true });
          if (!res.ok) {
            setError(res.error);
            return;
          }
          setName('');
          setIcon('');
          toast('success', 'تمت إضافة التصنيف');
          router.refresh();
        });
      }}
    >
      <div>
        <Input label="تصنيف جديد" placeholder="مثال: كتب دراسية" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} />
        {error && <p role="alert" className="mt-1 text-xs font-medium text-rose-600">{error}</p>}
      </div>
      <Input label="الأيقونة (إيموجي)" placeholder="📚" value={icon} onChange={(e) => setIcon(e.target.value)} maxLength={8} />
      <div className="flex items-end">
        <button type="submit" disabled={pending} className="btn-primary btn-md w-full">
          {pending ? <Spinner /> : <Icon name="plus" size={16} />}
          إضافة
        </button>
      </div>
    </form>
  );
}
