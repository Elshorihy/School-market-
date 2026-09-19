import type { Metadata, Viewport } from 'next';
import { Cairo } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { BottomNav } from '@/components/layout/BottomNav';
import { ToastProvider } from '@/components/ui/Toast';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-cairo',
  display: 'swap'
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  title: {
    default: 'سوق المدرسي — سوق طلاب مصر',
    template: '%s | سوق المدرسي'
  },
  description:
    'منصة سوق ومجتمع مخصصة لطلاب مصر: بيع وتبادل الكتب والملازم والأدوات المدرسية بين الطلاب في مدرستك ومنطقتك.',
  openGraph: {
    title: 'سوق المدرسي — سوق طلاب مصر',
    description: 'بيع وتبادل الكتب والملازم والأدوات المدرسية بين طلاب مصر',
    locale: 'ar_EG',
    type: 'website'
  },
  robots: { index: true, follow: true }
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8fafc' },
    { media: '(prefers-color-scheme: dark)', color: '#020617' }
  ],
  width: 'device-width',
  initialScale: 1
};

const themeScript = `(function(){try{var t=localStorage.getItem('sm-theme');var d=t? t==='dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={cairo.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-dvh flex-col">
        <ToastProvider>
          <Navbar />
          <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-24 pt-5 md:pb-10">{children}</main>
          <footer className="hidden border-t border-slate-200 py-6 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400 md:block">
            سوق المدرسي — منصة طلاب مصر لبيع وتبادل المستلزمات الدراسية © 2026
          </footer>
          <BottomNav />
        </ToastProvider>
      </body>
    </html>
  );
}
