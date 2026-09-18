'use client';

import { useEffect, useState } from 'react';

/**
 * Small unread-count badge. Polls the matching API endpoint:
 *  - notifications → /api/notifications
 *  - messages      → /api/messages-summary
 */
export function UnreadBadges({ which }: { which: 'messages' | 'notifications' }) {
  const [count, setCount] = useState(0);
  const url = which === 'messages' ? '/api/messages-summary' : '/api/notifications';

  useEffect(() => {
    let alive = true;
    async function poll() {
      try {
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) return;
        const json = (await res.json()) as { ok?: boolean; data?: { unread: number } };
        if (alive && json.ok) setCount(json.data!.unread);
      } catch {
        /* ignore */
      }
    }
    poll();
    const t = setInterval(poll, 25_000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [url]);

  if (count <= 0) return null;
  return (
    <span className="absolute -top-1 end-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
      {count > 99 ? '99+' : count}
    </span>
  );
}
