import type { User } from '@/types';

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatPrice(price: string | number | null, listingType?: string): string {
  if (listingType === 'free' || price === null || price === '' || price === 0) {
    return listingType === 'free' ? 'مجاني' : '—';
  }
  const num = typeof price === 'string' ? Number(price) : price;
  if (!Number.isFinite(num)) return '—';
  return `${new Intl.NumberFormat('ar-EG').format(num)} ج.م`;
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('ar-EG', { dateStyle: 'medium' }).format(d);
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('ar-EG', { dateStyle: 'medium', timeStyle: 'short' }).format(d);
}

export function timeAgo(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (seconds < 60) return 'الآن';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `منذ ${minutes} دقيقة`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `منذ ${hours} ساعة`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `منذ ${days} يوم`;
  const months = Math.floor(days / 30);
  if (months < 12) return `منذ ${months} شهر`;
  const years = Math.floor(months / 12);
  return `منذ ${years} سنة`;
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((p) => p[0])
    .join('');
}

export const LISTING_TYPE_LABELS: Record<string, string> = {
  sale: 'للبيع',
  exchange: 'للتبادل',
  free: 'مجاني'
};

export const CONDITION_LABELS: Record<string, string> = {
  new: 'جديد',
  'like-new': 'كالجديد',
  good: 'جيد',
  used: 'مستخدم',
  damaged: 'محتاج لترميم'
};

export const LISTING_STATUS_LABELS: Record<string, string> = {
  active: 'نشط',
  sold: 'تم البيع',
  exchanged: 'تم التبادل',
  closed: 'مغلق',
  pending: 'بانتظار المراجعة',
  removed: 'محذوف'
};

export const WANTED_STATUS_LABELS: Record<string, string> = {
  open: 'مفتوح',
  found: 'تم العثور عليه',
  closed: 'مغلق'
};

export const REPORT_REASON_LABELS: Record<string, string> = {
  'محتوى مخالف': 'محتوى مخالف',
  'احتيال': 'احتيال',
  'إعلان مزيف': 'إعلان مزيف',
  'إساءة': 'إساءة',
  'محتوى غير مناسب': 'محتوى غير مناسب',
  'أخرى': 'أخرى'
};

export type PublicUser = Pick<
  User,
  'id' | 'name' | 'role' | 'schoolId' | 'areaId' | 'governorateId' | 'bio' | 'avatarUrl' | 'createdAt'
>;

export function toPublicUser(u: User): PublicUser {
  return {
    id: u.id,
    name: u.name,
    role: u.role,
    schoolId: u.schoolId,
    areaId: u.areaId,
    governorateId: u.governorateId,
    bio: u.bio,
    avatarUrl: u.avatarUrl,
    createdAt: u.createdAt
  };
}

export function clampInt(value: unknown, min: number, max: number, fallback = min): number {
  const n = typeof value === 'number' ? value : parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}
