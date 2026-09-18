import type { ReactNode } from 'react';
import { Icon, type IconName } from './Icon';
import { cn, initialsOf } from '@/lib/utils';
import Link from 'next/link';

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-block h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent',
        className
      )}
      role="status"
      aria-label="جارٍ التحميل"
    />
  );
}

export function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Spinner className="h-8 w-8 text-brand-600" />
    </div>
  );
}

interface EmptyStateProps {
  icon?: IconName;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon = 'inbox', title, description, action }: EmptyStateProps) {
  return (
    <div className="card flex flex-col items-center justify-center gap-3 px-6 py-14 text-center animate-fade-in">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
        <Icon name={icon} size={26} />
      </div>
      <h3 className="text-base font-bold">{title}</h3>
      {description && <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function Avatar({
  name,
  url,
  size = 40,
  className
}: {
  name: string;
  url?: string | null;
  size?: number;
  className?: string;
}) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={name}
        width={size}
        height={size}
        className={cn('rounded-full object-cover', className)}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-brand-100 font-bold text-brand-800 dark:bg-brand-900 dark:text-brand-200',
        className
      )}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      aria-hidden="true"
    >
      {initialsOf(name)}
    </span>
  );
}

export function Badge({
  children,
  tone = 'slate',
  className
}: {
  children: ReactNode;
  tone?: 'slate' | 'brand' | 'amber' | 'rose' | 'sky' | 'violet';
  className?: string;
}) {
  const tones: Record<string, string> = {
    slate: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    brand: 'bg-brand-100 text-brand-800 dark:bg-brand-900/60 dark:text-brand-300',
    amber: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
    rose: 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300',
    sky: 'bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300',
    violet: 'bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-300'
  };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold leading-none',
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function Pagination({
  page,
  totalPages,
  makeHref
}: {
  page: number;
  totalPages: number;
  makeHref: (p: number) => string;
}) {
  if (totalPages <= 1) return null;
  const pages: (number | '…')[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) pages.push(i);
    else if (pages[pages.length - 1] !== '…') pages.push('…');
  }
  return (
    <nav className="mt-8 flex items-center justify-center gap-1.5" aria-label="التنقل بين الصفحات">
      {page > 1 && (
        <Link href={makeHref(page - 1)} className="btn-outline btn-sm !rounded-full !px-3" aria-label="السابق">
          <Icon name="chevron-right" size={16} />
        </Link>
      )}
      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`e${i}`} className="px-1 text-slate-400">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={makeHref(p)}
            aria-current={p === page ? 'page' : undefined}
            className={cn(
              'btn-sm !rounded-full !px-3.5',
              p === page
                ? 'bg-brand-600 text-white hover:bg-brand-600'
                : 'bg-white text-slate-600 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700'
            )}
          >
            {p}
          </Link>
        )
      )}
      {page < totalPages && (
        <Link href={makeHref(page + 1)} className="btn-outline btn-sm !rounded-full !px-3" aria-label="التالي">
          <Icon name="chevron-left" size={16} />
        </Link>
      )}
    </nav>
  );
}

export function SectionHeader({
  title,
  icon,
  action
}: {
  title: string;
  icon?: IconName;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 text-lg font-extrabold">
        {icon && <Icon name={icon} size={20} className="text-brand-600" />}
        {title}
      </h2>
      {action}
    </div>
  );
}
