'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/Field';
import { GeoSelects } from '@/components/marketplace/GeoSelects';
import { Icon } from '@/components/ui/Icon';
import { Spinner } from '@/components/ui/Misc';
import { useToast } from '@/components/ui/Toast';
import { registerAction } from '@/lib/actions/auth';

export function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') ?? '/';
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [governorateId, setGovernorateId] = useState('');
  const [areaId, setAreaId] = useState('');
  const [schoolId, setSchoolId] = useState('');
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();

  function clientValidate(): string | null {
    if (name.trim().length < 2) return 'اكتب اسمك الكامل';
    if (!/^\S+@\S+\.\S+$/.test(email)) return 'اكتب بريدًا إلكترونيًا صحيحًا';
    if (password.length < 8) return 'كلمة المرور يجب أن تكون 8 أحرف على الأقل';
    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      return 'كلمة المرور يجب أن تحتوي على حروف وأرقام';
    }
    if (password !== confirm) return 'كلمتا المرور غير متطابقتين';
    if (!governorateId) return 'اختر المحافظة';
    if (!areaId) return 'اختر المدينة أو المركز';
    return null;
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        setError('');
        const err = clientValidate();
        if (err) {
          setError(err);
          return;
        }
        startTransition(async () => {
          const res = await registerAction({
            name: name.trim(),
            email,
            password,
            confirmPassword: confirm,
            governorateId,
            areaId,
            schoolId: schoolId || undefined
          });
          if (!res.ok) {
            setError(res.error);
            return;
          }
          toast('success', 'تم إنشاء حسابك بنجاح — أهلًا بك!');
          router.push(next);
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

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="الاسم الكامل"
          required
          placeholder="مثال: أحمد محمد"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
        />
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
          autoComplete="new-password"
          placeholder="8 أحرف على الأقل، بها حروف وأرقام"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          dir="ltr"
          className="text-left"
        />
        <Input
          label="تأكيد كلمة المرور"
          type="password"
          required
          autoComplete="new-password"
          placeholder="••••••••"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          dir="ltr"
          className="text-left"
        />
      </div>

      <div>
        <p className="label">موقعك الدراسي</p>
        <GeoSelects
          governorateId={governorateId}
          areaId={areaId}
          schoolId={schoolId}
          onChange={(g, a, s) => {
            setGovernorateId(g);
            setAreaId(a);
            setSchoolId(s);
          }}
        />
      </div>

      <button type="submit" disabled={pending} className="btn-primary btn-lg w-full">
        {pending ? <Spinner /> : <Icon name="check" size={18} />}
        إنشاء الحساب
      </button>
      <p className="text-center text-sm text-slate-500 dark:text-slate-400">
        لديك حساب بالفعل؟{' '}
        <Link href="/login" className="font-bold text-brand-600 hover:underline">
          تسجيل الدخول
        </Link>
      </p>
    </form>
  );
}
