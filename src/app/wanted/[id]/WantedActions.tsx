'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { Spinner } from '@/components/ui/Misc';
import { useToast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';
import { deleteWantedAction, setOwnWantedStatusAction } from '@/lib/actions/wanted';
import { deleteWantedAdminAction, setWantedStatusAction } from '@/lib/actions/admin';

export function WantedActions({
  wantedId,
  status,
  isOwner,
  isAdmin
}: {
  wantedId: string;
  status: string;
  isOwner: boolean;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, okMsg: string) => {
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) toast('error', res.error ?? 'حدث خطأ');
      else {
        toast('success', okMsg);
        router.refresh();
      }
    });
  };

  return (
    <div className="card space-y-2.5 p-4">
      {isOwner && (
        <div className="grid grid-cols-2 gap-2">
          <Link href={`/wanted/${wantedId}/edit`} className="btn-outline btn-sm">
            <Icon name="edit" size={14} />
            تعديل
          </Link>
          <button
            type="button"
            className="btn-outline btn-sm"
            disabled={pending}
            onClick={() =>
              run(
                () => setOwnWantedStatusAction(wantedId, status === 'open' ? 'closed' : 'open'),
                status === 'open' ? 'تم إغلاق الطلب' : 'تمت إعادة فتح الطلب'
              )
            }
          >
            {status === 'open' ? 'إغلاق الطلب' : 'إعادة الفتح'}
          </button>
        </div>
      )}
      {isOwner && (
        <button type="button" className="btn-outline btn-sm w-full !text-rose-600 dark:!text-rose-400" onClick={() => setConfirmDelete(true)}>
          <Icon name="trash" size={14} />
          حذف الطلب
        </button>
      )}
      {isAdmin && (
        <>
          {status !== 'closed' && (
            <button type="button" disabled={pending} className="btn-secondary btn-sm w-full" onClick={() => run(() => setWantedStatusAction(wantedId, 'closed'), 'تم إغلاق الطلب')}>
              إغلاق
            </button>
          )}
          <button type="button" disabled={pending} className="btn-danger btn-sm w-full" onClick={() => setConfirmDelete(true)}>
            <Icon name="trash" size={14} />
            حذف من الإدارة
          </button>
        </>
      )}

      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title="حذف الطلب">
        <p className="text-sm text-slate-600 dark:text-slate-300">هل تريد حذف هذا الطلب نهائيًا؟</p>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            className="btn-danger btn-md flex-1"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const res = isAdmin
                  ? await deleteWantedAdminAction(wantedId)
                  : await deleteWantedAction(wantedId);
                if (!res.ok) {
                  toast('error', res.error);
                  return;
                }
                setConfirmDelete(false);
                toast('success', 'تم حذف الطلب');
                router.push('/wanted');
                router.refresh();
              })
            }
          >
            {pending ? <Spinner /> : <Icon name="trash" size={15} />}
            حذف
          </button>
          <button type="button" className="btn-secondary btn-md flex-1" onClick={() => setConfirmDelete(false)}>
            إلغاء
          </button>
        </div>
      </Modal>
    </div>
  );
}
