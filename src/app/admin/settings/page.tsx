import type { Metadata } from 'next';
import { getDb } from '@/db';
import { users } from '@/db';
import { eq } from 'drizzle-orm';
import { Icon } from '@/components/ui/Icon';
import { ChangePasswordForm } from './ChangePasswordForm';

export const metadata: Metadata = { title: 'الإعدادات' };
export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  const db = getDb();
  const admins = await db.select().from(users).where(eq(users.role, 'admin')).limit(50);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-extrabold">الإعدادات</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">إعدادات المنصة والإدارة</p>
      </div>

      <div className="card p-5">
        <h2 className="mb-1 flex items-center gap-2 text-sm font-extrabold">
          <Icon name="shield" size={16} className="text-brand-600" />
          حسابات الإدارة
        </h2>
        <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
          الحسابات التي تملك صلاحية الوصول لهذه اللوحة
        </p>
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {admins.map((a) => (
            <li key={a.id} className="flex items-center justify-between py-2.5">
              <div>
                <p className="text-sm font-bold">{a.name}</p>
                <p className="text-xs text-slate-400" dir="ltr">{a.email}</p>
              </div>
              {a.status === 'suspended' && <span className="text-xs font-bold text-rose-500">موقوف</span>}
            </li>
          ))}
        </ul>
      </div>

      <ChangePasswordForm />
    </div>
  );
}
