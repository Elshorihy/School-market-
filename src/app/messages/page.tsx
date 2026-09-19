import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getConversations } from '@/lib/queries';
import { EmptyState, Avatar } from '@/components/ui/Misc';
import { Icon } from '@/components/ui/Icon';
import { timeAgo } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'الرسائل',
  robots: { index: false }
};

export const dynamic = 'force-dynamic';

export default async function MessagesPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/messages');
  const convs = await getConversations(user);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-xl font-extrabold">الرسائل</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          تواصل مع البائعين والمشترين بخصوص إعلاناتك
        </p>
      </div>

      {convs.length === 0 ? (
        <EmptyState
          icon="chat"
          title="لا توجد محادثات حتى الآن"
          description="عندما تتواصل مع بائع من صفحة إعلانك أو أي إعلان آخر، ستظهر المحادثة هنا."
          action={
            <Link href="/listings" className="btn-primary btn-md">
              <Icon name="store" size={16} />
              تصفح الإعلانات
            </Link>
          }
        />
      ) : (
        <ul className="card divide-y divide-slate-100 overflow-hidden dark:divide-slate-800">
          {convs.map((c) => (
            <li key={c.id}>
              <Link
                href={`/messages/${c.id}`}
                className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-slate-50 dark:hover:bg-slate-800/50"
              >
                <Avatar name={c.otherName} url={c.otherAvatarUrl} size={44} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-bold">{c.otherName}</p>
                    {c.lastMessageAt && (
                      <span className="shrink-0 text-[10px] text-slate-400">{timeAgo(c.lastMessageAt)}</span>
                    )}
                  </div>
                  <p
                    className={`mt-0.5 truncate text-xs ${
                      c.unread > 0 ? 'font-bold text-slate-800 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {c.lastMessageBody ?? 'لا توجد رسائل بعد'}
                  </p>
                </div>
                {c.unread > 0 && (
                  <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-brand-600 px-1.5 text-[10px] font-bold text-white">
                    {c.unread > 99 ? '99+' : c.unread}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
