'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/ui/Icon';
import { markAllNotificationsReadAction } from '@/lib/actions/notifications';

export function MarkAllReadButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      className="btn-outline btn-sm"
      onClick={() => {
        startTransition(async () => {
          await markAllNotificationsReadAction();
          router.refresh();
        });
      }}
    >
      <Icon name="check" size={14} />
      تحديد الكل كمقروء
    </button>
  );
}
