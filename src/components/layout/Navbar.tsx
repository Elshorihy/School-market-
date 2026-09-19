import Link from 'next/link';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { BellMenu } from '@/components/notifications/BellMenu';
import { UserMenu } from '@/components/layout/UserMenu';
import { SearchBar } from '@/components/marketplace/SearchBar';
import { getCurrentUser } from '@/lib/auth';

export async function Navbar() {
  let user = null as Awaited<ReturnType<typeof getCurrentUser>>;
  try { user = await getCurrentUser(); } catch (error) { console.error('Navbar user load failed:', error); }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/85">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 rounded-xl px-1 py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-lg font-black text-white shadow-sm">
            س
          </span>
          <span className="hidden text-base font-extrabold leading-tight sm:block">
            سوق<span className="text-brand-600"> المدرسي</span>
          </span>
        </Link>

        <div className="hidden flex-1 justify-center md:flex">
          <SearchBar />
        </div>

        <div className="ms-auto flex items-center gap-1.5">
          {user ? (
            <>
              <Link href="/listings/new" className="btn-primary btn-md hidden sm:inline-flex">
                <span className="text-base leading-none">+</span>
                <span className="hidden lg:inline">نشر إعلان</span>
              </Link>
              <BellMenu />
              <UserMenu
                name={user.name}
                avatarUrl={user.avatarUrl}
                isAdmin={user.role === 'admin'}
              />
            </>
          ) : (
            <>
              <Link href="/login" className="btn-outline btn-md">
                تسجيل الدخول
              </Link>
              <Link href="/register" className="btn-primary btn-md">
                إنشاء حساب
              </Link>
            </>
          )}
          <ThemeToggle />
        </div>
      </div>

      {/* Mobile search row */}
      <div className="border-t border-slate-100 px-4 py-2 dark:border-slate-900 md:hidden">
        <SearchBar />
      </div>
    </header>
  );
}
