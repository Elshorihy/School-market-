import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getDb, notifications } from '@/db';
import { desc, eq, isNull } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';
import { EmptyState } from '@/components/ui/Misc';
import { Icon, type IconName } from '@/components/ui/Icon';
import { timeAgo } from '@/lib/utils';
import { MarkAllReadButton } from './MarkAllReadButton';

export const metadata: Metadata = {
  title: 'الإشعارات',
  robots: { index: false }
};

export const dynamic = 'force-dynamic';

const typeIcon: Record<string, IconName> = {
  message: 'chat',
  favorite: 'heart',
  match: 'sparkle',
  listing_status: 'tag',
  moderation: 'shield',
  report: 'flag',
  system: 'bell'
};

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/notifications');
  const db = getDb();
  const items = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, user.id))
    .orderBy(desc(notifications.createdAt))
    .limit(100);
  const unread = items.filter((n) => !n.readAt).length;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold">الإشعارات</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {unread > 0 ? `${unread} إشعار غير مقروء` : 'كل شيء مقروء'}
          </p>
        </div>
        {unread > 0 && <MarkAllReadButton />}
      </div>

      {items.length === 0 ? (
        <EmptyState icon="bell" title="لا توجد إشعارات بعد" description="ستصلك هنا تحديثات الرسائل والمطابقات وحالة إعلاناتك." />
      ) : (
        <ul className="card divide-y divide-slate-100 overflow-hidden dark:divide-slate-800">
          {items.map((n) => (
            <li key={n.id} className={n.readAt ? '' : 'bg-brand-50/50 dark:bg-brand-950/20'}>
              <Link
                href={n.link ?? '#'}
                className="flex items-start gap-3 px-4 py-3.5 transition hover:bg-slate-50 dark:hover:bg-slate-800/40"
              >
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-brand-600 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-brand-400 dark:ring-slate-700">
                  <Icon name={typeIcon[n.type] ?? 'bell'} size={17} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-bold">{n.title}</p>
                    <span className="shrink-0 text-[10px] text-slate-400">{timeAgo(n.createdAt)}</span>
                  </div>
                  <p className="mt-0.5 text-xs leading-5 text-slate-500 dark:text-slate-400">{n.body}</p>
                </div>
                {!n.readAt && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand-500" />}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
