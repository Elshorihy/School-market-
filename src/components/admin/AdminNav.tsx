'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon, type IconName } from '@/components/ui/Icon';
import { cn } from '@/lib/utils';

const NAV: { href: string; icon: IconName; label: string; exact?: boolean }[] = [
  { href: '/admin', icon: 'chart', label: 'لوحة التحكم', exact: true },
  { href: '/admin/users', icon: 'users', label: 'المستخدمون' },
  { href: '/admin/listings', icon: 'store', label: 'الإعلانات' },
  { href: '/admin/wanted', icon: 'target', label: 'طلبات مطلوب' },
  { href: '/admin/categories', icon: 'tag', label: 'التصنيفات' },
  { href: '/admin/governorates', icon: 'globe', label: 'المحافظات' },
  { href: '/admin/areas', icon: 'map-pin', label: 'المراكز والمدن' },
  { href: '/admin/schools', icon: 'school', label: 'المدارس' },
  { href: '/admin/reports', icon: 'flag', label: 'البلاغات' },
  { href: '/admin/settings', icon: 'settings', label: 'الإعدادات' }
];

export function AdminNav() {
  const pathname = usePathname();
  const activeHref = NAV.find((n) => (n.exact ? pathname === n.href : pathname.startsWith(n.href)))?.href ?? '/admin';

  return (
    <>
      <div className="hidden lg:block">
        <div className="card sticky top-24 p-2">
          <p className="px-3 pb-2 pt-1 text-xs font-black text-slate-400">لوحة الإدارة</p>
          <nav className="space-y-0.5" aria-label="قائمة الإدارة">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                aria-current={activeHref === n.href ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-bold transition',
                  activeHref === n.href
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                )}
              >
                <Icon name={n.icon} size={17} />
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
      <div className="-mx-4 mb-4 flex gap-1.5 overflow-x-auto px-4 pb-1 lg:hidden">
        {NAV.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            aria-current={activeHref === n.href ? 'page' : undefined}
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold ring-1 ring-inset transition',
              activeHref === n.href
                ? 'bg-brand-600 text-white ring-brand-600'
                : 'bg-white text-slate-600 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700'
            )}
          >
            <Icon name={n.icon} size={14} />
            {n.label}
          </Link>
        ))}
      </div>
    </>
  );
}
