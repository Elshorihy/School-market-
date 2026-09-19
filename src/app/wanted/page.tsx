import type { Metadata } from 'next';
import Link from 'next/link';
import { getDb, wantedItems, categories, governorates, areas } from '@/db';
import { and, count, desc, eq, ilike, or, asc, isNull } from 'drizzle-orm';
import { EmptyState, Pagination } from '@/components/ui/Misc';
import { Icon } from '@/components/ui/Icon';
import { clampInt } from '@/lib/utils';
import { z } from 'zod';
import { matchListingsForWanted } from '@/lib/match';
import { WantedCard } from '@/components/wanted/WantedCard';

export const metadata: Metadata = {
  title: 'مطلوب — طلبات الطلاب',
  description: 'انشر ما تبحث عنه، ويظهر لك فورًا ما يطابقه من الإعلانات'
};

export const dynamic = 'force-dynamic';

const filterSchema = z.object({
  q: z.string().trim().max(100).optional(),
  categoryId: z.string().uuid().optional(),
  governorateId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).optional()
});

const PAGE_SIZE = 12;

export default async function WantedPage({
  searchParams
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const raw: Record<string, string> = {};
  for (const [k, v] of Object.entries(searchParams)) if (typeof v === 'string') raw[k] = v;
  const parsed = filterSchema.safeParse(raw);
  const f = parsed.success ? parsed.data : {};
  const page = clampInt(f.page, 1, 200, 1);
  const db = getDb();

  const conds = [];
  if (f.q) {
    conds.push(or(ilike(wantedItems.title, `%${f.q}%`), ilike(wantedItems.description, `%${f.q}%`)));
  }
  if (f.categoryId) conds.push(eq(wantedItems.categoryId, f.categoryId));
  if (f.governorateId) conds.push(eq(wantedItems.governorateId, f.governorateId));
  const where = conds.length ? and(...conds) : undefined;

  const [rows, totalRows, cats, govs] = await Promise.all([
    db
      .select({
        item: wantedItems,
        categoryName: categories.name,
        governorateName: governorates.name,
        areaName: areas.name
      })
      .from(wantedItems)
      .leftJoin(categories, eq(wantedItems.categoryId, categories.id))
      .leftJoin(governorates, eq(wantedItems.governorateId, governorates.id))
      .leftJoin(areas, eq(wantedItems.areaId, areas.id))
      .where(where)
      .orderBy(desc(wantedItems.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ n: count() }).from(wantedItems).where(where),
    db
      .select({ id: categories.id, name: categories.name, icon: categories.icon })
      .from(categories)
      .where(eq(categories.isActive, true))
      .orderBy(asc(categories.sort)),
    db
      .select({ id: governorates.id, name: governorates.name })
      .from(governorates)
      .orderBy(asc(governorates.sort))
  ]);

  const total = totalRows[0]?.n ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function makeHref(p: number) {
    const p2 = new URLSearchParams(raw);
    p2.delete('page');
    if (p > 1) p2.set('page', String(p));
    const s = p2.toString();
    return s ? `/wanted?${s}` : '/wanted';
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold">مطلوب</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            طلبات الطلاب — نُطابقها تلقائيًا مع الإعلانات المتاحة
          </p>
        </div>
        <Link href="/wanted/new" className="btn-primary btn-md">
          <Icon name="plus" size={16} />
          نشر طلب
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/wanted"
          className={`btn-sm !rounded-full ${
            !f.categoryId && !f.governorateId ? 'bg-brand-600 text-white' : 'btn-outline'
          }`}
        >
          الكل
        </Link>
        {cats.map((c) => (
          <Link
            key={c.id}
            href={`/wanted?categoryId=${c.id}`}
            className={`btn-sm !rounded-full ${f.categoryId === c.id ? 'bg-brand-600 text-white' : 'btn-outline'}`}
          >
            {c.icon} {c.name}
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">المحافظة:</span>
        {govs.map((g) => (
          <Link
            key={g.id}
            href={f.governorateId === g.id ? '/wanted' : `/wanted?governorateId=${g.id}`}
            className={`btn-sm !rounded-full ${
              f.governorateId === g.id ? 'bg-brand-600 text-white' : 'btn-outline'
            }`}
          >
            {g.name}
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon="target"
          title="لا توجد طلبات بعد"
          description="انشر أول طلب «مطلوب» وسيصلك إشعار فور ظهور إعلان مطابق."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((r) => (
            <WantedRow
              key={r.item.id}
              wanted={r.item}
              categoryName={r.categoryName}
              location={[r.areaName, r.governorateName].filter(Boolean).join(' · ') || null}
            />
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} makeHref={makeHref} />
    </div>
  );
}

async function WantedRow({
  wanted,
  categoryName,
  location
}: {
  wanted: {
    id: string;
    title: string;
    description: string;
    status: string;
    createdAt: Date;
    categoryId: string | null;
    governorateId: string | null;
    areaId: string | null;
    schoolId: string | null;
  };
  categoryName: string | null;
  location: string | null;
}) {
  const db = getDb();
  const matches = await matchListingsForWanted(
    db,
    {
      id: wanted.id,
      categoryId: wanted.categoryId,
      governorateId: wanted.governorateId,
      areaId: wanted.areaId,
      schoolId: wanted.schoolId,
      title: wanted.title,
      description: wanted.description
    },
    5
  );
  return <WantedCard wanted={{ ...wanted, status: wanted.status as 'open' | 'found' | 'closed' }} categoryName={categoryName} location={location} matchCount={matches.length} />;
}
