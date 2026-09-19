import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getDb, blocks, users } from '@/db';
import { desc, eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';
import { EmptyState, Avatar } from '@/components/ui/Misc';
import { timeAgo } from '@/lib/utils';
import { UnblockButton } from './UnblockButton';

export const metadata: Metadata = {
  title: 'المستخدمون المحظورون',
  robots: { index: false }
};

export const dynamic = 'force-dynamic';

export default async function BlocksPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/profile/blocks');
  const db = getDb();
  const rows = await db
    .select({ id: users.id, name: users.name, blockedAt: blocks.createdAt })
    .from(blocks)
    .innerJoin(users, eq(blocks.blockedId, users.id))
    .where(eq(blocks.blockerId, user.id))
    .orderBy(desc(blocks.createdAt));

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-xl font-extrabold">المستخدمون المحظورون</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          لا يمكن لهذه الحسابات مراسلتك أو إنشاء محادثات معك
        </p>
      </div>
      {rows.length === 0 ? (
        <EmptyState icon="ban" title="لا يوجد مستخدمون محظورون" description="يمكنك حظر أي مستخدم من صفحته." />
      ) : (
        <ul className="card divide-y divide-slate-100 dark:divide-slate-800">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center gap-3 px-4 py-3.5">
              <Avatar name={r.name} size={40} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{r.name}</p>
                <p className="text-xs text-slate-400">محظور منذ {timeAgo(r.blockedAt)}</p>
              </div>
              <UnblockButton userId={r.id} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
