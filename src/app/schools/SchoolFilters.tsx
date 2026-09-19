'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Select, Input } from '@/components/ui/Field';

export function SchoolFilters({
  governorates,
  areas,
  governorateId,
  areaId,
  q
}: {
  governorates: { id: string; name: string }[];
  areas: { id: string; name: string }[];
  governorateId?: string;
  areaId?: string;
  q?: string;
}) {
  const router = useRouter();
  const params = useSearchParams();

  function update(patch: Record<string, string | null>) {
    const p = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === '') p.delete(k);
      else p.set(k, v);
    }
    p.delete('page');
    const s = p.toString();
    router.push(s ? `/schools?${s}` : '/schools');
  }

  return (
    <div className="card grid gap-3 p-4 sm:grid-cols-3">
      <Input
        label="بحث بالاسم"
        placeholder="اسم المدرسة..."
        defaultValue={q}
        onChange={(e) => update({ q: e.target.value || null })}
      />
      <Select
        label="المحافظة"
        placeholder="الكل"
        value={governorateId}
        onChange={(e) => update({ governorateId: e.target.value, areaId: null })}
        options={governorates.map((g) => ({ value: g.id, label: g.name }))}
      />
      <Select
        label="المدينة / المركز"
        placeholder={governorateId ? 'الكل' : 'اختر المحافظة أولًا'}
        disabled={!governorateId}
        value={areaId}
        onChange={(e) => update({ areaId: e.target.value })}
        options={areas.map((a) => ({ value: a.id, label: a.name }))}
      />
    </div>
  );
}
