import { ZodError } from 'zod';
import { AppError } from '@/lib/errors';
import { AuthError } from '@/lib/auth';

export type ActionResult<T = undefined> = T extends undefined
  ? { ok: true } | { ok: false; error: string }
  : { ok: true; data: T } | { ok: false; error: string };

export function actionError(err: unknown, fallback = 'حدث خطأ غير متوقع، حاول مرة أخرى'): { ok: false; error: string } {
  if (err instanceof ZodError) {
    const first = err.errors[0];
    return { ok: false, error: first?.message ?? 'بيانات غير صالحة' };
  }
  if (err instanceof AppError || err instanceof AuthError) {
    return { ok: false, error: err.message };
  }
  console.error('[action-error]', err);
  return { ok: false, error: fallback };
}
