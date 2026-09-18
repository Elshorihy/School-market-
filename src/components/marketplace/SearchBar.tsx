'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { Icon } from '@/components/ui/Icon';

export function SearchBar() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <form
      role="search"
      className="relative w-full max-w-xl"
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        const q = String(data.get('q') ?? '').trim();
        startTransition(() => {
          router.push(q ? `/listings?q=${encodeURIComponent(q)}` : '/listings');
        });
      }}
    >
      <label htmlFor="global-search" className="sr-only">
        ابحث عن إعلان
      </label>
      <input
        id="global-search"
        name="q"
        type="search"
        placeholder="ابحث عن كتب، ملازم، أدوات..."
        className="input !rounded-full !py-2.5 pe-11"
        autoComplete="off"
      />
      <button
        type="submit"
        className="absolute end-1.5 top-1/2 -translate-y-1/2 rounded-full bg-brand-600 p-2 text-white transition hover:bg-brand-700 disabled:opacity-60"
        aria-label="بحث"
        disabled={pending}
      >
        <Icon name="search" size={15} />
      </button>
    </form>
  );
}
