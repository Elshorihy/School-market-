'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toast';
import { blockUserAction, unblockUserAction } from '@/lib/actions/profile';

export function BlockButton({ userId, blocked }: { userId: string; blocked: boolean }) {
  const { toast } = useToast();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      className={`btn-outline btn-sm ${blocked ? '!text-rose-600 dark:!text-rose-400' : ''}`}
      onClick={() => {
        startTransition(async () => {
          const res = blocked ? await unblockUserAction(userId) : await blockUserAction(userId);
          if (!res.ok) {
            toast('error', res.error);
            return;
          }
          toast('success', blocked ? 'تم إلغاء الحظر' : 'تم حظر المستخدم');
          router.refresh();
        });
      }}
    >
      <Icon name="ban" size={14} />
      {blocked ? 'إلغاء الحظر' : 'حظر'}
    </button>
  );
}
