import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'إنشاء حساب',
  description: 'أنشئ حسابك في سوق المدرسي وابدأ البيع والتبادل مع زملائك',
  robots: { index: false }
};

export default async function RegisterPage() {
  let user = null as Awaited<ReturnType<typeof getCurrentUser>>;
  try { user = await getCurrentUser(); } catch (error) { console.error('Current user load failed:', error); }
  if (user) redirect('/');
  return (
    <div className="mx-auto max-w-2xl">
      <div className="card p-6 sm:p-8">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-extrabold">إنشاء حساب جديد</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            انضم لآلاف الطلاب الذين يبيعون ويتبادلون مستلزماتهم الدراسية
          </p>
        </div>
        <Suspense>
          <RegisterForm />
        </Suspense>
      </div>
    </div>
  );
}
