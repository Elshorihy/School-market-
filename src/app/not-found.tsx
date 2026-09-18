import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800">
        <Icon name="search" size={30} />
      </div>
      <h1 className="text-2xl font-extrabold">الصفحة غير موجودة</h1>
      <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">
        ربما تم نقل الصفحة أو حذفها، أو أن الرابط غير صحيح.
      </p>
      <Link href="/" className="btn-primary btn-md">
        <Icon name="home" size={16} />
        العودة للرئيسية
      </Link>
    </div>
  );
}
