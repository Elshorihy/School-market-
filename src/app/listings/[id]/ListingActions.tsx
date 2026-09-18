'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { Spinner } from '@/components/ui/Misc';
import { useToast } from '@/components/ui/Toast';
import { deleteListingAction, setOwnListingStatusAction } from '@/lib/actions/listings';
import { setAdminListingStatusAction, hardDeleteListingAction } from '@/lib/actions/admin';
import { Modal } from '@/components/ui/Modal';

export function ListingActions({
  listingId,
  status,
  isOwner,
  isAdmin
}: {
  listingId: string;
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
    <div className="space-y-2.5">
      {isOwner && status === 'active' && (
        <div className="grid grid-cols-3 gap-2">
          <button type="button" disabled={pending} className="btn-outline btn-sm" onClick={() => run(() => setOwnListingStatusAction(listingId, 'sold'), 'تم وضع الإعلان بحالة «تم البيع»')}>
            تم البيع
          </button>
          <button type="button" disabled={pending} className="btn-outline btn-sm" onClick={() => run(() => setOwnListingStatusAction(listingId, 'exchanged'), 'تم وضع الإعلان بحالة «تم التبادل»')}>
            تم التبادل
          </button>
          <button type="button" disabled={pending} className="btn-outline btn-sm" onClick={() => run(() => setOwnListingStatusAction(listingId, 'closed'), 'تم إغلاق الإعلان')}>
            إغلاق
          </button>
        </div>
      )}
      {isOwner && status !== 'active' && (
        <button type="button" disabled={pending} className="btn-secondary btn-sm w-full" onClick={() => run(() => setOwnListingStatusAction(listingId, 'active'), 'تمت إعادة تفعيل الإعلان')}>
          <Icon name="check" size={14} />
          إعادة التفعيل
        </button>
      )}
      {isOwner && (
        <div className="grid grid-cols-2 gap-2">
          <Link href={`/listings/${listingId}/edit`} className="btn-outline btn-sm">
            <Icon name="edit" size={14} />
            تعديل
          </Link>
          <button type="button" className="btn-outline btn-sm !text-rose-600 dark:!text-rose-400" onClick={() => setConfirmDelete(true)}>
            <Icon name="trash" size={14} />
            حذف
          </button>
        </div>
      )}
      {isAdmin && (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={pending}
            className="btn-secondary btn-sm"
            onClick={() => run(() => setAdminListingStatusAction(listingId, status === 'active' ? 'pending' : 'active'), 'تم تحديث الحالة')}
          >
            {status === 'active' ? 'إيقاف مؤقت' : 'تفعيل'}
          </button>
          <button type="button" disabled={pending} className="btn-outline btn-sm !text-rose-600 dark:!text-rose-400" onClick={() => run(() => setAdminListingStatusAction(listingId, 'removed'), 'تمت إزالة الإعلان')}>
            إزالة
          </button>
          <button type="button" disabled={pending} className="btn-danger btn-sm col-span-2" onClick={() => run(() => hardDeleteListingAction(listingId), 'تم حذف الإعلان نهائيًا')}>
            <Icon name="trash" size={14} />
            حذف نهائي
          </button>
        </div>
      )}

      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title="حذف الإعلان">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          هل أنت متأكد من حذف هذا الإعلان؟ لا يمكن التراجع عن هذا الإجراء.
        </p>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            className="btn-danger btn-md flex-1"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const res = await deleteListingAction(listingId);
                if (!res.ok) {
                  toast('error', res.error);
                  return;
                }
                setConfirmDelete(false);
                toast('success', 'تم حذف الإعلان');
                router.push('/profile');
                router.refresh();
              })
            }
          >
            {pending ? <Spinner /> : <Icon name="trash" size={15} />}
            حذف نهائي
          </button>
          <button type="button" className="btn-secondary btn-md flex-1" onClick={() => setConfirmDelete(false)}>
            إلغاء
          </button>
        </div>
      </Modal>
    </div>
  );
}
