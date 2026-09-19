import type { Metadata } from 'next';
import Link from 'next/link';
import { getDb } from '@/db';
import {
  users,
  listings,
  wantedItems,
  categories,
  governorates,
  areas,
  schools,
  reports,
  conversations
} from '@/db';
import { count, desc, eq } from 'drizzle-orm';
import { Icon, type IconName } from '@/components/ui/Icon';
import { timeAgo, LISTING_STATUS_LABELS } from '@/lib/utils';
import { Badge } from '@/components/ui/Misc';

export const metadata: Metadata = {
  title: 'لوحة التحكم'
};

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const db = getDb();

  const [
    totalUsers,
    activeUsers,
    suspendedUsers,
    totalListings,
    activeListings,
    totalWanted,
    openWanted,
    openReports,
    totalReports,
    totalConversations,
    totalCategories,
    activeCategories,
    totalGovernorates,
    totalAreas,
    totalSchools,
    activeSchools,
    recentUsers,
    recentListings,
    recentReports
  ] = await Promise.all([
    db.select({ n: count() }).from(users),
    db.select({ n: count() }).from(users).where(eq(users.status, 'active')),
    db.select({ n: count() }).from(users).where(eq(users.status, 'suspended')),
    db.select({ n: count() }).from(listings),
    db.select({ n: count() }).from(listings).where(eq(listings.status, 'active')),
    db.select({ n: count() }).from(wantedItems),
    db.select({ n: count() }).from(wantedItems).where(eq(wantedItems.status, 'open')),
    db.select({ n: count() }).from(reports).where(eq(reports.status, 'open')),
    db.select({ n: count() }).from(reports),
    db.select({ n: count() }).from(conversations),
    db.select({ n: count() }).from(categories),
    db.select({ n: count() }).from(categories).where(eq(categories.isActive, true)),
    db.select({ n: count() }).from(governorates),
    db.select({ n: count() }).from(areas),
    db.select({ n: count() }).from(schools),
    db.select({ n: count() }).from(schools).where(eq(schools.isActive, true)),
    db
      .select({ id: users.id, name: users.name, email: users.email, role: users.role, status: users.status, createdAt: users.createdAt })
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(6),
    db
      .select({ id: listings.id, title: listings.title, type: listings.type, status: listings.status, createdAt: listings.createdAt })
      .from(listings)
      .orderBy(desc(listings.createdAt))
      .limit(6),
    db
      .select({ id: reports.id, reason: reports.reason, targetType: reports.targetType, status: reports.status, createdAt: reports.createdAt })
      .from(reports)
      .orderBy(desc(reports.createdAt))
      .limit(6)
  ]);

  const stats: { label: string; value: number; sub: string; icon: IconName; href: string; tone: string }[] = [
    { label: 'المستخدمون', value: totalUsers[0].n, sub: `${suspendedUsers[0].n} موقوف`, icon: 'users', href: '/admin/users', tone: 'text-sky-600 bg-sky-50 dark:bg-sky-950/50' },
    { label: 'الإعلانات', value: totalListings[0].n, sub: `${activeListings[0].n} نشط`, icon: 'store', href: '/admin/listings', tone: 'text-brand-600 bg-brand-50 dark:bg-brand-950/50' },
    { label: 'طلبات مطلوب', value: totalWanted[0].n, sub: `${openWanted[0].n} مفتوح`, icon: 'target', href: '/admin/wanted', tone: 'text-amber-600 bg-amber-50 dark:bg-amber-950/50' },
    { label: 'البلاغات المفتوحة', value: openReports[0].n, sub: `${totalReports[0].n} إجمالي`, icon: 'flag', href: '/admin/reports', tone: 'text-rose-600 bg-rose-50 dark:bg-rose-950/50' }
  ];

  const geoStats: { label: string; value: number; icon: IconName; href: string }[] = [
    { label: 'المحافظات', value: totalGovernorates[0].n, icon: 'globe', href: '/admin/governorates' },
    { label: 'المراكز والمدن', value: totalAreas[0].n, icon: 'map-pin', href: '/admin/areas' },
    { label: 'المدارس', value: totalSchools[0].n, icon: 'school', href: '/admin/schools' },
    { label: 'التصنيفات', value: totalCategories[0].n, icon: 'tag', href: '/admin/categories' },
    { label: 'المحادثات', value: totalConversations[0].n, icon: 'chat', href: '/admin' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold">لوحة التحكم</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">نظرة عامة على أداء المنصة</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="card p-4 transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.tone}`}>
                <Icon name={s.icon} size={19} />
              </span>
            </div>
            <p className="mt-3 text-2xl font-black">{s.value.toLocaleString('ar-EG')}</p>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {s.label} <span className="text-slate-400">· {s.sub}</span>
            </p>
          </Link>
        ))}
      </div>

      <div className="card grid grid-cols-2 gap-px overflow-hidden bg-slate-100 dark:bg-slate-800 sm:grid-cols-5">
        {geoStats.map((g) => (
          <Link key={g.label} href={g.href} className="flex flex-col items-center gap-1.5 bg-white p-4 text-center transition hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/60">
            <Icon name={g.icon} size={18} className="text-slate-400" />
            <span className="text-lg font-black">{g.value.toLocaleString('ar-EG')}</span>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">{g.label}</span>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-extrabold">أحدث المستخدمين</h2>
            <Link href="/admin/users" className="text-xs font-bold text-brand-600 hover:underline">عرض الكل</Link>
          </div>
          <ul className="space-y-1">
            {recentUsers.map((u) => (
              <li key={u.id} className="flex items-center justify-between gap-2 rounded-xl px-2 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{u.name}</p>
                  <p className="truncate text-xs text-slate-400" dir="ltr">{u.email}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {u.role === 'admin' && <Badge tone="violet">إداري</Badge>}
                  {u.status === 'suspended' && <Badge tone="rose">موقوف</Badge>}
                  <span className="text-[10px] text-slate-400">{timeAgo(u.createdAt)}</span>
                </div>
              </li>
            ))}
            {recentUsers.length === 0 && <li className="py-6 text-center text-sm text-slate-400">لا يوجد مستخدمون بعد</li>}
          </ul>
        </div>

        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-extrabold">أحدث الإعلانات</h2>
            <Link href="/admin/listings" className="text-xs font-bold text-brand-600 hover:underline">عرض الكل</Link>
          </div>
          <ul className="space-y-1">
            {recentListings.map((l) => (
              <li key={l.id} className="flex items-center justify-between gap-2 rounded-xl px-2 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <p className="min-w-0 truncate text-sm font-bold" dir="auto">{l.title}</p>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge tone={l.status === 'active' ? 'brand' : 'slate'}>{LISTING_STATUS_LABELS[l.status]}</Badge>
                  <span className="text-[10px] text-slate-400">{timeAgo(l.createdAt)}</span>
                </div>
              </li>
            ))}
            {recentListings.length === 0 && <li className="py-6 text-center text-sm text-slate-400">لا توجد إعلانات بعد</li>}
          </ul>
        </div>
      </div>

      {recentReports.length > 0 && (
        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-extrabold">أحدث البلاغات</h2>
            <Link href="/admin/reports" className="text-xs font-bold text-brand-600 hover:underline">عرض الكل</Link>
          </div>
          <ul className="space-y-1">
            {recentReports.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-2 rounded-xl px-2 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <p className="text-sm font-bold">{r.reason}</p>
                <div className="flex items-center gap-2">
                  <Badge tone={r.status === 'open' ? 'rose' : 'slate'}>{r.status === 'open' ? 'مفتوح' : 'مغلق'}</Badge>
                  <span className="text-[10px] text-slate-400">{timeAgo(r.createdAt)}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
