import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'تسجيل الدخول',
  robots: { index: false }
};

export default async function LoginPage() {
  let user = null as Awaited<ReturnType<typeof getCurrentUser>>;
  try { user = await getCurrentUser(); } catch (error) { console.error('Current user load failed:', error); }
  if (user) redirect('/');
  return (
    <div className="mx-auto max-w-md">
      <div className="card p-6 sm:p-8">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-extrabold">تسجيل الدخول</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">أهلًا بعودتك إلى سوق المدرسي</p>
        </div>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
