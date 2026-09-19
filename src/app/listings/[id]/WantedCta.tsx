import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';

export function WantedCta({ categoryName }: { categoryName: string | null }) {
  return (
    <div className="card bg-gradient-to-l from-amber-50 to-white p-5 dark:from-amber-950/20 dark:to-slate-900">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
          <Icon name="target" size={20} />
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-extrabold">
            {categoryName ? `لا تجد ${categoryName} المناسب؟` : 'لا تجد ما تبحث عنه؟'}
          </h3>
          <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
            انشر طلب «مطلوب» وسنبلغك فور ظهور إعلان مطابق في منطقتك.
          </p>
          <Link href="/wanted/new" className="btn-primary btn-sm mt-3">
            <Icon name="plus" size={14} />
            أنشئ طلبًا
          </Link>
        </div>
      </div>
    </div>
  );
}
