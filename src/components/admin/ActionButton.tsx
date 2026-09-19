'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Icon, type IconName } from '@/components/ui/Icon';
import { Spinner } from '@/components/ui/Misc';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';

type Tone = 'default' | 'danger' | 'brand';

/**
 * Generic admin action button. `action` must be a SERVER ACTION
 * (functions cannot be serialized to the client), and `args` the
 * serializable arguments to pass it.
 */
export function ActionButton<A extends unknown[]>({
  label,
  icon,
  tone = 'default',
  confirm,
  successMessage,
  action,
  args
}: {
  label: string;
  icon?: IconName;
  tone?: Tone;
  confirm?: string;
  successMessage?: string;
  action: (...a: A) => Promise<{ ok: boolean; error?: string }>;
  args: A;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);

  const execute = () => {
    startTransition(async () => {
      const res = await action(...args);
      if (!res.ok) {
        toast('error', res.error ?? 'حدث خطأ');
        return;
      }
      setShowConfirm(false);
      if (successMessage) toast('success', successMessage);
      router.refresh();
    });
  };

  const toneClass: Record<Tone, string> = {
    default: 'btn-outline',
    brand: 'btn-primary',
    danger: 'btn-outline !text-rose-600 dark:!text-rose-400'
  };

  const btn = (
    <button type="button" className={`${toneClass[tone]} btn-sm !px-2.5 !py-1.5`} disabled={pending}>
      {pending ? <Spinner className="h-3.5 w-3.5" /> : icon ? <Icon name={icon} size={14} /> : null}
      {label}
    </button>
  );

  if (!confirm) return btn;

  return (
    <>
      <button
        type="button"
        className={`${toneClass[tone]} btn-sm !px-2.5 !py-1.5`}
        onClick={() => setShowConfirm(true)}
      >
        {icon ? <Icon name={icon} size={14} /> : null}
        {label}
      </button>
      <Modal open={showConfirm} onClose={() => setShowConfirm(false)} title="تأكيد الإجراء">
        <p className="text-sm text-slate-600 dark:text-slate-300">{confirm}</p>
        <div className="mt-4 flex gap-2">
          <button type="button" className="btn-danger btn-md flex-1" onClick={execute} disabled={pending}>
            {pending ? <Spinner /> : <Icon name="check" size={15} />}
            تأكيد
          </button>
          <button type="button" className="btn-secondary btn-md flex-1" onClick={() => setShowConfirm(false)}>
            إلغاء
          </button>
        </div>
      </Modal>
    </>
  );
}
