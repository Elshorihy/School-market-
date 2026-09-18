'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toast';
import { unblockUserAction } from '@/lib/actions/profile';

export function UnblockButton({ userId }: { userId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      className="btn-outline btn-sm"
      onClick={() =>
        startTransition(async () => {
          const res = await unblockUserAction(userId);
          if (!res.ok) toast('error', res.error);
          else {
            toast('success', 'تم إلغاء الحظر');
            router.refresh();
          }
        })
      }
    >
      <Icon name="ban" size={14} />
      إلغاء الحظر
    </button>
  );
}
