'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/ui/Icon';
import { Spinner } from '@/components/ui/Misc';
import { useToast } from '@/components/ui/Toast';
import { startConversationAction } from '@/lib/actions/messages';

export function MessageSellerButton({ sellerId, disabled }: { sellerId: string; disabled?: boolean }) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={disabled || pending}
      className="btn-primary btn-md w-full sm:w-auto"
      onClick={() => {
        startTransition(async () => {
          const res = await startConversationAction(sellerId);
          if (!res.ok) {
            toast('error', res.error);
            return;
          }
          router.push(`/messages/${res.data.id}`);
        });
      }}
    >
      {pending ? <Spinner /> : <Icon name="chat" size={17} />}
      تواصل مع البائع
    </button>
  );
}
