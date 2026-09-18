'use client';

import { useTransition } from 'react';
import { Icon } from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toast';
import { toggleFavoriteAction } from '@/lib/actions/favorites';

export function FavoriteButton({
  listingId,
  isFavorite,
  ownerId
}: {
  listingId: string;
  isFavorite: boolean;
  ownerId?: string;
}) {
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();

  return (
    <button
      type="button"
      aria-label={isFavorite ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
      aria-pressed={isFavorite}
      disabled={pending}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        startTransition(async () => {
          const res = await toggleFavoriteAction(listingId);
          if (!res.ok) toast('error', res.error);
        });
      }}
      className={`flex h-9 w-9 items-center justify-center rounded-full backdrop-blur transition active:scale-90 disabled:opacity-60 ${
        isFavorite
          ? 'bg-rose-500/90 text-white'
          : 'bg-white/90 text-slate-500 shadow-sm hover:text-rose-500 dark:bg-slate-900/80 dark:text-slate-300'
      }`}
    >
      <Icon name={isFavorite ? 'heart-fill' : 'heart'} size={17} />
    </button>
  );
}
