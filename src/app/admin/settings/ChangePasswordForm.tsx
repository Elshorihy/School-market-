'use client';

import { useState, useTransition } from 'react';
import { Input } from '@/components/ui/Field';
import { Spinner } from '@/components/ui/Misc';
import { Icon } from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toast';
import { changeAdminPasswordAction } from '@/lib/actions/admin';

export function ChangePasswordForm() {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');

  return (
    <form
      className="card p-5"
      onSubmit={(e) => {
        e.preventDefault();
        setError('');
        if (next.length < 8 || !/[A-Za-z]/.test(next) || !/[0-9]/.test(next)) {
          setError('كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل وتحتوي على حروف وأرقام');
          return;
        }
        if (next !== confirm) {
          setError('تأكيد كلمة المرور غير مطابق');
          return;
        }
        startTransition(async () => {
          const res = await changeAdminPasswordAction(current, next);
          if (!res.ok) {
            setError(res.error);
            return;
          }
          setCurrent('');
          setNext('');
          setConfirm('');
          toast('success', 'تم تغيير كلمة المرور');
        });
      }}
    >
      <h2 className="mb-1 flex items-center gap-2 text-sm font-extrabold">
        <Icon name="key" size={16} className="text-brand-600" />
        تغيير كلمة مرور حساب الإدارة
      </h2>
      <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">تغيير كلمة مرور هذا الحساب الإداري</p>
      <div className="grid gap-3 sm:grid-cols-3">
        <Input label="كلمة المرور الحالية" type="password" required value={current} onChange={(e) => setCurrent(e.target.value)} dir="ltr" className="text-left" autoComplete="current-password" />
        <Input label="كلمة المرور الجديدة" type="password" required value={next} onChange={(e) => setNext(e.target.value)} dir="ltr" className="text-left" autoComplete="new-password" />
        <Input label="تأكيد الجديدة" type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} dir="ltr" className="text-left" autoComplete="new-password" />
      </div>
      {error && <p role="alert" className="mt-3 text-sm font-semibold text-rose-600 dark:text-rose-400">{error}</p>}
      <button type="submit" disabled={pending} className="btn-primary btn-md mt-4">
        {pending ? <Spinner /> : <Icon name="key" size={15} />}
        تغيير كلمة المرور
      </button>
    </form>
  );
}
