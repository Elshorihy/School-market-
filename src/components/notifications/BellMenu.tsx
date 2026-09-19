'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { timeAgo } from '@/lib/utils';
import { markAllNotificationsReadAction } from '@/lib/actions/notifications';

interface BellItem {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  readAt: Date | string | null;
  createdAt: string;
}

export function BellMenu() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<BellItem[]>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const poll = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications', { cache: 'no-store' });
      if (!res.ok) return;
      const json = (await res.json()) as { ok?: boolean; data?: { unread: number; items: BellItem[] } };
      if (json.ok && json.data) {
        setUnread(json.data.unread);
        setItems(json.data.items);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    poll();
    const t = setInterval(poll, 20_000);
    return () => clearInterval(t);
  }, [poll]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="btn-ghost relative !rounded-xl !p-2.5"
        aria-label={`الإشعارات ${unread > 0 ? `(${unread} جديد)` : ''}`}
        aria-expanded={open}
      >
        <Icon name="bell" size={19} />
        {unread > 0 && (
          <span className="absolute -top-0.5 end-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute end-0 top-full z-50 mt-2 w-[19rem] overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-slate-200 animate-scale-in dark:bg-slate-900 dark:ring-slate-800 sm:w-80">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
            <h3 className="text-sm font-bold">الإشعارات</h3>
            {unread > 0 && (
              <button
                type="button"
                className="text-xs font-semibold text-brand-600 hover:underline"
                onClick={async () => {
                  await markAllNotificationsReadAction();
                  poll();
                }}
              >
                تحديد الكل كمقروء
              </button>
            )}
          </div>
          <ul className="max-h-96 overflow-y-auto">
            {items.length === 0 && (
              <li className="px-4 py-10 text-center text-sm text-slate-500">لا توجد إشعارات بعد</li>
            )}
            {items.map((n) => (
              <li key={n.id}>
                <Link
                  href={n.link ?? '/notifications'}
                  onClick={() => setOpen(false)}
                  className={`block px-4 py-3 transition hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
                    !n.readAt ? 'bg-brand-50/60 dark:bg-brand-950/20' : ''
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <span
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                        n.readAt ? 'bg-transparent' : 'bg-brand-500'
                      }`}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">{n.title}</p>
                      <p className="line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{n.body}</p>
                      <p className="mt-1 text-[10px] text-slate-400">{timeAgo(n.createdAt)}</p>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href="/notifications"
            onClick={() => setOpen(false)}
            className="block border-t border-slate-100 px-4 py-2.5 text-center text-xs font-bold text-brand-600 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60"
          >
            عرض كل الإشعارات
          </Link>
        </div>
      )}
    </div>
  );
}
