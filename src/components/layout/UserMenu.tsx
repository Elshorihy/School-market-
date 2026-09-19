'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/ui/Icon';
import { Avatar } from '@/components/ui/Misc';
import { logoutAction } from '@/lib/actions/auth';

export function UserMenu({
  name,
  avatarUrl,
  isAdmin
}: {
  name: string;
  avatarUrl: string | null;
  isAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-xl p-1 hover:bg-slate-100 dark:hover:bg-slate-800"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="قائمة الحساب"
      >
        <Avatar name={name} url={avatarUrl} size={32} />
        <Icon name="chevron-down" size={14} className="hidden text-slate-400 sm:block" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div
            role="menu"
            className="absolute start-auto end-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-2xl bg-white p-1.5 shadow-xl ring-1 ring-slate-200 animate-scale-in dark:bg-slate-900 dark:ring-slate-800"
          >
            <div className="border-b border-slate-100 px-3 py-2.5 dark:border-slate-800">
              <p className="truncate text-sm font-bold">{name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">حسابي</p>
            </div>
            <MenuLink href="/profile" icon="user" label="ملفي الشخصي" onOpen={setOpen} />
            <MenuLink href="/favorites" icon="heart" label="المفضلة" onOpen={setOpen} />
            <MenuLink href="/messages" icon="chat" label="الرسائل" onOpen={setOpen} />
            <MenuLink href="/notifications" icon="bell" label="الإشعارات" onOpen={setOpen} />
            <MenuLink href="/wanted" icon="target" label="طلباتي (مطلوب)" onOpen={setOpen} />
            {isAdmin && (
              <MenuLink href="/admin" icon="shield" label="لوحة الإدارة" onOpen={setOpen} accent />
            )}
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
              onClick={async () => {
                await logoutAction();
                setOpen(false);
                router.push('/');
                router.refresh();
              }}
            >
              <Icon name="logout" size={17} />
              تسجيل الخروج
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function MenuLink({
  href,
  icon,
  label,
  onOpen,
  accent
}: {
  href: string;
  icon: 'user' | 'heart' | 'chat' | 'bell' | 'target' | 'shield';
  label: string;
  onOpen: (v: boolean) => void;
  accent?: boolean;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={() => onOpen(false)}
      className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 ${
        accent ? 'text-brand-600 dark:text-brand-400' : ''
      }`}
    >
      <Icon name={icon} size={17} />
      {label}
    </Link>
  );
}
