import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { requireAdmin, AuthError } from '@/lib/auth';
import { AdminNav } from '@/components/admin/AdminNav';

export const metadata: Metadata = {
  title: {
    default: 'لوحة الإدارة',
    template: '%s | الإدارة'
  },
  robots: { index: false, follow: false }
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof AuthError && e.status === 401) redirect('/login?next=/admin');
    redirect('/');
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      <AdminNav />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
