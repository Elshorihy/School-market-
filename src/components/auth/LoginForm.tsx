'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/Field';
import { Icon } from '@/components/ui/Icon';
import { Spinner } from '@/components/ui/Misc';
import { useToast } from '@/components/ui/Toast';
import { loginAction } from '@/lib/actions/auth';

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') ?? '/';
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        setError('');
        startTransition(async () => {
          const res = await loginAction({ email, password });
          if (!res.ok) {
            setError(res.error);
            return;
          }
          toast('success', 'مرحبًا بعودتك');
          router.push(res.data.role === 'admin' && next === '/' ? '/admin' : next);
          router.refresh();
        });
      }}
    >
      {error && (
        <div role="alert" className="flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
          <Icon name="warning" size={16} />
          {error}
        </div>
      )}
      <Input
        label="البريد الإلكتروني"
        type="email"
        required
        autoComplete="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        dir="ltr"
        className="text-left"
      />
      <Input
        label="كلمة المرور"
        type="password"
        required
        autoComplete="current-password"
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        dir="ltr"
        className="text-left"
      />
      <button type="submit" disabled={pending} className="btn-primary btn-lg w-full">
        {pending ? <Spinner /> : <Icon name="logout" size={17} />}
        تسجيل الدخول
      </button>
      <p className="text-center text-sm text-slate-500 dark:text-slate-400">
        ليس لديك حساب؟{' '}
        <Link href="/register" className="font-bold text-brand-600 hover:underline">
          إنشاء حساب
        </Link>
      </p>
    </form>
  );
}
