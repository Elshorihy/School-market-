'use client';

import { useRouter, useSearchParams } from 'next/navigation';

/**
 * Client-side search box that pushes a GET navigation on Enter.
 * (Event handlers are not allowed on host elements in Server Components.)
 */
export function SearchBox({
  placeholder,
  defaultValue,
  href,
  paramKey = 'q',
  width = 'w-56'
}: {
  placeholder: string;
  defaultValue?: string;
  href: string;
  paramKey?: string;
  width?: string;
}) {
  const router = useRouter();
  const params = useSearchParams();

  return (
    <input
      type="search"
      placeholder={placeholder}
      defaultValue={defaultValue}
      className={`input !py-2 text-xs ${width}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          const p2 = new URLSearchParams(params.toString());
          if (e.currentTarget.value.trim()) p2.set(paramKey, e.currentTarget.value.trim());
          else p2.delete(paramKey);
          p2.delete('page');
          const s = p2.toString();
          router.push(s ? `${href}?${s}` : href);
        }
      }}
    />
  );
}
