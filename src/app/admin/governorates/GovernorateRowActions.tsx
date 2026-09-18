'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Misc';
import { Icon } from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toast';
import { ActionButton } from '@/components/admin/ActionButton';
import { upsertGovernorateAction, deleteGovernorateAction } from '@/lib/actions/admin';

export function GovernorateRowActions({ id, name, areaCount }: { id: string; name: string; areaCount: number }) {
  const router = useRouter();
  const { toast } = useToast();
  const [editOpen, setEditOpen] = useState(false);
  const [value, setValue] = useState(name);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');

  return (
    <div className="flex gap-1.5">
      <button type="button" className="btn-outline btn-sm !px-2.5 !py-1.5" onClick={() => { setValue(name); setError(''); setEditOpen(true); }}>
        <Icon name="edit" size={14} />
        تعديل
      </button>
      <ActionButton
        label="حذف"
        icon="trash"
        tone="danger"
        confirm={
          areaCount > 0
            ? `لا يمكن الحذف: توجد ${areaCount} مركزًا مرتبطًا. احذف مراكزها أولًا.`
            : 'حذف المحافظة؟'
        }
        action={deleteGovernorateAction} args={[id]}
        successMessage="تم حذف المحافظة"
      />
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title={`تعديل: ${name}`}>
        <div className="space-y-4">
          {error && <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">{error}</p>}
          <Input label="اسم المحافظة" value={value} onChange={(e) => setValue(e.target.value)} maxLength={40} />
          <div className="flex gap-2">
            <button
              type="button"
              className="btn-primary btn-md flex-1"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const res = await upsertGovernorateAction({ id, name: value.trim() });
                  if (!res.ok) {
                    setError(res.error);
                    return;
                  }
                  setEditOpen(false);
                  toast('success', 'تم حفظ التعديلات');
                  router.refresh();
                })
              }
            >
              {pending ? <Spinner /> : <Icon name="check" size={15} />}
              حفظ
            </button>
            <button type="button" className="btn-secondary btn-md flex-1" onClick={() => setEditOpen(false)}>
              إلغاء
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
