'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon, type IconName } from '@/components/ui/Icon';
import { cn } from '@/lib/utils';
import { UnreadBadges } from './UnreadBadges';

const items: { href: string; icon: IconName; label: string; badge?: 'messages' }[] = [
  { href: '/', icon: 'home', label: 'الرئيسية' },
  { href: '/listings', icon: 'store', label: 'المتجر' },
  { href: '/listings/new', icon: 'plus', label: 'نشر' },
  { href: '/messages', icon: 'chat', label: 'الرسائل', badge: 'messages' },
  { href: '/profile', icon: 'user', label: 'حسابي' }
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)] dark:border-slate-800 dark:bg-slate-950/95 md:hidden"
      aria-label="التنقل السفلي"
    >
      <div className="mx-auto grid max-w-lg grid-cols-5">
        {items.map((item) => {
          const active =
            item.href === '/listings/new'
              ? pathname === '/listings/new'
              : pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition',
                item.icon === 'plus'
                  ? 'text-brand-600'
                  : active
                    ? 'text-brand-600 dark:text-brand-400'
                    : 'text-slate-500 dark:text-slate-400'
              )}
              aria-current={active ? 'page' : undefined}
            >
              {item.icon === 'plus' ? (
                <span className="flex h-9 w-9 -translate-y-2 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-600/30">
                  <Icon name="plus" size={20} />
                </span>
              ) : (
                <>
                  <span className="relative">
                    <Icon name={item.icon} size={21} filled={active && item.icon === 'heart'} />
                    {item.badge && <UnreadBadges which={item.badge} />}
                  </span>
                </>
              )}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
