import Link from 'next/link';
import { getHomeData } from '@/lib/queries';
import { getCurrentUser } from '@/lib/auth';
import { ListingGrid } from '@/components/marketplace/ListingCard';
import { SectionHeader, EmptyState } from '@/components/ui/Misc';
import { Icon } from '@/components/ui/Icon';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const user = await getCurrentUser();
  let data;
  try {
    data = await getHomeData(user);
  } catch (error) {
    console.error('Home data load failed:', error);
    data = {
      latest: [],
      free: [],
      exchange: [],
      popular: [],
      nearby: [],
      categories: []
    };
  }

  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-l from-brand-700 via-brand-600 to-emerald-500 px-6 py-10 text-white sm:px-10 sm:py-14">
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-2xl font-black leading-snug sm:text-4xl">
            سوق طلاب مصر
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-white/85 sm:text-base">
            بِع، بدِّل، أو اطلب كتبك وملازمك وأدواتك المدرسية من زملائك في مدرستك ومنطقتك.
            {user ? '' : ' أنشئ حسابك مجانًا وابدأ الآن.'}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/listings" className="btn bg-white text-brand-700 btn-md hover:bg-brand-50">
              <Icon name="store" size={17} />
              تصفح الإعلانات
            </Link>
            {user ? (
              <Link href="/listings/new" className="btn btn-md bg-brand-900/40 text-white ring-1 ring-inset ring-white/40 hover:bg-brand-900/60">
                <Icon name="plus" size={17} />
                انشر إعلانك
              </Link>
            ) : (
              <Link href="/register" className="btn btn-md bg-brand-900/40 text-white ring-1 ring-inset ring-white/40 hover:bg-brand-900/60">
                <Icon name="user" size={17} />
                إنشاء حساب
              </Link>
            )}
          </div>
        </div>
        <div className="pointer-events-none absolute -start-10 -top-10 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-16 end-0 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
      </section>

      {/* Categories */}
      <section>
        <SectionHeader title="التصنيفات" icon="tag" action={<Link href="/categories" className="text-xs font-bold text-brand-600 hover:underline">عرض الكل</Link>} />
        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
          {data.categories.map((c) => (
            <Link
              key={c.id}
              href={`/listings?categoryId=${c.id}`}
              className="card flex flex-col items-center gap-2 px-2 py-4 text-center transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="text-2xl" aria-hidden="true">{c.icon ?? '📦'}</span>
              <span className="text-xs font-bold leading-tight">{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Nearby */}
      {user && data.nearby.length > 0 && (
        <section>
          <SectionHeader title="قريب منك" icon="map-pin" action={<Link href="/listings" className="text-xs font-bold text-brand-600 hover:underline">عرض الكل</Link>} />
          <ListingGrid listings={data.nearby} />
        </section>
      )}

      {/* Latest */}
      <section>
        <SectionHeader title="أحدث الإعلانات" icon="clock" action={<Link href="/listings" className="text-xs font-bold text-brand-600 hover:underline">عرض الكل</Link>} />
        {data.latest.length === 0 ? (
          <EmptyState
            icon="store"
            title="لا توجد إعلانات بعد"
            description="كن أول من ينشر إعلانًا — اكتب الكتب والملازم والأدوات التي تريد بيعها أو تبادلها."
            action={
              user ? (
                <Link href="/listings/new" className="btn-primary btn-md">
                  <Icon name="plus" size={16} />
                  نشر أول إعلان
                </Link>
              ) : undefined
            }
          />
        ) : (
          <ListingGrid listings={data.latest} />
        )}
      </section>

      {/* Popular */}
      {data.popular.length > 0 && (
        <section>
          <SectionHeader title="الأكثر حفظًا في المفضلة" icon="heart" />
          <ListingGrid listings={data.popular} />
        </section>
      )}

      {/* Free + Exchange */}
      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <SectionHeader title="مجاني" icon="box" action={<Link href="/listings?type=free" className="text-xs font-bold text-brand-600 hover:underline">عرض الكل</Link>} />
          {data.free.length === 0 ? (
            <p className="rounded-2xl bg-slate-100 px-4 py-6 text-center text-sm text-slate-500 dark:bg-slate-900 dark:text-slate-400">
              لا توجد أشياء مجانية حاليًا
            </p>
          ) : (
            <ListingGrid listings={data.free} />
          )}
        </section>
        <section>
          <SectionHeader title="للتبادل" icon="swap" action={<Link href="/listings?type=exchange" className="text-xs font-bold text-brand-600 hover:underline">عرض الكل</Link>} />
          {data.exchange.length === 0 ? (
            <p className="rounded-2xl bg-slate-100 px-4 py-6 text-center text-sm text-slate-500 dark:bg-slate-900 dark:text-slate-400">
              لا توجد إعلانات للتبادل حاليًا
            </p>
          ) : (
            <ListingGrid listings={data.exchange} />
          )}
        </section>
      </div>

      {/* Wanted CTA */}
      <section className="card flex flex-col items-center gap-3 bg-gradient-to-l from-amber-50 to-white px-6 py-8 text-center dark:from-amber-950/20 dark:to-slate-900 sm:flex-row sm:justify-between sm:text-start">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-extrabold">
            <Icon name="target" size={20} className="text-amber-600" />
            تبحث عن شيء معين؟
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            انشر طلب «مطلوب» وسنطابقه تلقائيًا مع الإعلانات المتاحة في منطقتك.
          </p>
        </div>
        <Link href="/wanted/new" className="btn-primary btn-md shrink-0">
          <Icon name="plus" size={16} />
          أنشئ طلبًا
        </Link>
      </section>
    </div>
  );
}
