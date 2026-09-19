'use client';

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { Icon, type IconName } from './Icon';
import { cn } from '@/lib/utils';

type ToastKind = 'success' | 'error' | 'info';
interface Toast {
  id: number;
  kind: ToastKind;
  text: string;
}

const ToastCtx = createContext<{ toast: (kind: ToastKind, text: string) => void }>({
  toast: () => {}
});

export function useToast() {
  return useContext(ToastCtx);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const counter = useRef(0);

  const toast = useCallback((kind: ToastKind, text: string) => {
    const id = ++counter.current;
    setItems((prev) => [...prev.slice(-3), { id, kind, text }]);
    setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const icons: Record<ToastKind, IconName> = { success: 'check', error: 'warning', info: 'bell' };
  const colors: Record<ToastKind, string> = {
    success: 'bg-brand-600 text-white',
    error: 'bg-rose-600 text-white',
    info: 'bg-slate-800 text-white dark:bg-slate-700'
  };

  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-3 z-[60] flex flex-col items-center gap-2 px-4">
        {items.map((t) => (
          <div
            key={t.id}
            role="status"
            className={cn(
              'pointer-events-auto flex max-w-sm items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-lg animate-slide-up',
              colors[t.kind]
            )}
          >
            <Icon name={icons[t.kind]} size={16} />
            <span>{t.text}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
