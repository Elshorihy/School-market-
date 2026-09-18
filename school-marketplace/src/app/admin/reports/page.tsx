import type { Metadata } from 'next';
import Link from 'next/link';
import { getDb, reports, users, listings, messages, conversations } from '@/db';
import { and, count, desc, eq, or } from 'drizzle-orm';
import { z } from 'zod';
import { Badge, EmptyState } from '@/components/ui/Misc';
import { ActionButton } from '@/components/admin/ActionButton';
import { setReportStatusAction, enforceRemoveListingFromReportAction, enforceSuspendUserFromReportAction } from '@/lib/actions/admin';
import { REPORT_REASON_LABELS, timeAgo } from '@/lib/utils';

export const metadata: Metadata = { title: 'البلاغات' };
export const dynamic = 'force-dynamic';

const PAGE_SIZE = 20;
const filterSchema = z.object({
  status: z.enum(['open', 'resolved', 'dismissed']).optional(),
  page: z.coerce.number().int().min(1).optional()
});

export default async function AdminReportsPage({
  searchParams
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const raw: Record<string, string> = {};
  for (const [k, v] of Object.entries(searchParams)) if (typeof v === 'string') raw[k] = v;
  const parsed = filterSchema.safeParse(raw);
  const f = parsed.success ? parsed.data : {};
  const page = f.page ?? 1;
  const db = getDb();
  const where = f.status ? eq(reports.status, f.status) : undefined;

  const [rows, total] = await Promise.all([
    db
      .select({
        id: reports.id,
        reason: reports.reason,
        details: reports.details,
        targetType: reports.targetType,
        targetId: reports.targetId,
        status: reports.status,
        createdAt: reports.createdAt,
        reporterName: users.name,
        reporterId: users.id
      })
      .from(reports)
      .innerJoin(users, eq(reports.reporterId, users.id))
      .where(where)
      .orderBy(desc(reports.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ n: count() }).from(reports).where(where)
  ]);

  const totalPages = Math.max(1, Math.ceil((total[0]?.n ?? 0) / PAGE_SIZE));

  function makeHref(p: number, status?: string) {
    const p2 = new URLSearchParams(raw);
    p2.delete('page');
    p2.delete('status');
    if (status) p2.set('status', status);
    if (p > 1) p2.set('page', String(p));
    const s = p2.toString();
    return s ? `/admin/reports?${s}` : '/admin/reports';
  }

  async function targetInfo(targetType: string, targetId: string): Promise<{ label: string; href: string | null; exists: boolean }> {
    if (targetType === 'listing') {
      const [l] = await db.select({ id: listings.id, title: listings.title }).from(listings).where(eq(listings.id, targetId)).limit(1);
      return l ? { label: l.title, href: `/listings/${l.id}`, exists: true } : { label: '(محذوف)', href: null, exists: false };
    }
    if (targetType === 'user') {
      const [u] = await db.select({ id: users.id, name: users.name }).from(users).where(eq(users.id, targetId)).limit(1);
      return u ? { label: u.name, href: `/user/${u.id}`, exists: true } : { label: '(محذوف)', href: null, exists: false };
    }
    const [m] = await db.select({ id: messages.id, body: messages.body, conversationId: messages.conversationId }).from(messages).where(eq(messages.id, targetId)).limit(1);
    if (!m) return { label: '(محذوفة)', href: null, exists: false };
    return { label: m.body.slice(0, 40), href: `/messages/${m.conversationId}`, exists: true };
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold">البلاغات</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{total[0]?.n ?? 0} بلاغ</p>
        </div>
        <div className="flex gap-1.5">
          {([
            ['', 'الكل'],
            ['open', 'مفتوحة'],
            ['resolved', 'تمت المعالجة'],
            ['dismissed', 'مرفوضة']
          ] as const).map(([s, label]) => (
            <Link
              key={s || 'all'}
              href={makeHref(1, s || undefined)}
              className={`btn-sm !rounded-full ${!f.status || f.status === s ? 'bg-brand-600 text-white' : 'btn-outline'}`}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState icon="flag" title="لا توجد بلاغات" description="رائع! لا توجد بلاغات في هذا التصنيف." />
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <ReportCard key={r.id} report={r} targetInfo={targetInfo} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5">
          {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map((p) => (
            <Link key={p} href={makeHref(p)} className={`btn-sm !rounded-full ${p === page ? 'bg-brand-600 text-white' : 'btn-outline'}`}>
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

async function ReportCard({
  report,
  targetInfo
}: {
  report: {
    id: string;
    reason: string;
    details: string | null;
    targetType: 'listing' | 'user' | 'message';
    targetId: string;
    status: string;
    createdAt: Date;
    reporterName: string;
    reporterId: string;
  };
  targetInfo: (t: string, id: string) => Promise<{ label: string; href: string | null; exists: boolean }>;
}) {
  const target = await targetInfo(report.targetType, report.targetId);
  const typeLabel = report.targetType === 'listing' ? 'إعلان' : report.targetType === 'user' ? 'مستخدم' : 'رسالة';

  return (
    <div className="card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={report.status === 'open' ? 'rose' : report.status === 'resolved' ? 'brand' : 'slate'}>
              {report.status === 'open' ? 'مفتوح' : report.status === 'resolved' ? 'تمت المعالجة' : 'مرفوض'}
            </Badge>
            <Badge tone="slate">{typeLabel}</Badge>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{REPORT_REASON_LABELS[report.reason] ?? report.reason}</span>
            <span className="text-[10px] text-slate-400">{timeAgo(report.createdAt)}</span>
          </div>
          <div className="mt-2 text-sm">
            {target.href ? (
              <Link href={target.href} className="font-bold text-brand-600 hover:underline" dir="auto">
                {target.label}
              </Link>
            ) : (
              <span className="text-slate-400" dir="auto">{target.label}</span>
            )}
          </div>
          {report.details && <p className="mt-1.5 max-w-2xl text-xs leading-5 text-slate-500 dark:text-slate-400" dir="auto">{report.details}</p>}
          <p className="mt-1.5 text-[11px] text-slate-400">
            المُبلِّغ: <Link href={`/user/${report.reporterId}`} className="font-bold hover:text-brand-600">{report.reporterName}</Link>
          </p>
        </div>
        {report.status === 'open' && (
          <div className="flex flex-wrap gap-1.5">
            {report.targetType === 'listing' && (
              <ActionButton label="حذف الإعلان" icon="trash" tone="danger" confirm="حذف الإعلان المذكور في البلاغ؟" action={enforceRemoveListingFromReportAction} args={[report.id]} successMessage="تم حذف الإعلان" />
            )}
            {report.targetType === 'user' && (
              <ActionButton label="إيقاف المستخدم" icon="ban" tone="danger" confirm="إيقاف المستخدم المذكور في البلاغ؟" action={enforceSuspendUserFromReportAction} args={[report.id]} successMessage="تم إيقاف المستخدم" />
            )}
            <ActionButton label="معالجة" icon="check" tone="brand" action={setReportStatusAction} args={[report.id, 'resolved']} successMessage="تمت معالجة البلاغ" />
            <ActionButton label="رفض" icon="x" action={setReportStatusAction} args={[report.id, 'dismissed']} successMessage="تم رفض البلاغ" />
          </div>
        )}
      </div>
    </div>
  );
}
