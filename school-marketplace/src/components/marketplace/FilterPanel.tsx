'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Select } from '@/components/ui/Field';
import { Icon } from '@/components/ui/Icon';
import { getGeoOptions } from '@/lib/geo';
import { CONDITION_LABELS, LISTING_TYPE_LABELS, clampInt } from '@/lib/utils';

interface Options {
  categories: { id: string; name: string; icon: string | null }[];
  governorates: { id: string; name: string }[];
  areas: { id: string; name: string }[];
  schools: { id: string; name: string }[];
}

export function FilterPanel() {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [opts, setOpts] = useState<Options>({ categories: [], governorates: [], areas: [], schools: [] });
  const [showAdvanced, setShowAdvanced] = useState(true);

  const q = params.get('q') ?? '';
  const type = params.get('type') ?? '';
  const categoryId = params.get('categoryId') ?? '';
  const governorateId = params.get('governorateId') ?? '';
  const areaId = params.get('areaId') ?? '';
  const schoolId = params.get('schoolId') ?? '';
  const condition = params.get('condition') ?? '';
  const minPrice = params.get('minPrice') ?? '';
  const maxPrice = params.get('maxPrice') ?? '';
  const sort = params.get('sort') ?? 'newest';
  const page = clampInt(params.get('page'), 1, 500, 1);

  useEffect(() => {
    (async () => {
      try {
        const base = await fetch('/api/geo').then((r) => r.json());
        setOpts((p) => ({
          ...p,
          governorates: base.ok ? base.data.governorates : []
        }));
        const [catsRes] = await Promise.all([fetch('/api/categories').then((r) => r.json())]);
        if (catsRes?.ok) setOpts((p) => ({ ...p, categories: catsRes.data }));
        if (governorateId) {
          const g = await fetch(`/api/geo?governorateId=${governorateId}`).then((r) => r.json());
          if (g.ok) setOpts((p) => ({ ...p, areas: g.data.areas }));
        }
        if (areaId) {
          const s = await fetch(`/api/geo?governorateId=${governorateId}&areaId=${areaId}`).then((r) => r.json());
          if (s.ok) setOpts((p) => ({ ...p, schools: s.data.schools }));
        }
      } catch {
        /* ignore */
      }
    })();
  }, [governorateId, areaId]);

  function update(patch: Record<string, string | null>) {
    const p = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === '') p.delete(k);
      else p.set(k, v);
    }
    if (!('page' in patch)) p.delete('page');
    startTransition(() => router.push(`/listings?${p.toString()}`));
  }

  const activeCount = [type, categoryId, governorateId, areaId, schoolId, condition, minPrice, maxPrice].filter(Boolean).length;

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-bold">
          <Icon name="filter" size={16} className="text-brand-600" />
          تصفية النتائج
          {activeCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] text-white">
              {activeCount}
            </span>
          )}
        </h2>
        <div className="flex items-center gap-2">
          {activeCount > 0 && (
            <button type="button" className="text-xs font-bold text-rose-600 hover:underline" onClick={() => update({ reset: '1' })}>
              مسح الكل
            </button>
          )}
          <button
            type="button"
            className="btn-ghost btn-sm"
            onClick={() => setShowAdvanced((v) => !v)}
            aria-expanded={showAdvanced}
          >
            <Icon name="chevron-down" size={14} className={`transition ${showAdvanced ? '' : '-rotate-90'}`} />
          </button>
        </div>
      </div>

      <div className={`grid gap-3 ${showAdvanced ? 'mt-4 grid-cols-2 md:grid-cols-3' : 'hidden'}`}>
        <Select
          label="نوع الإعلان"
          placeholder="الكل"
          value={type}
          onChange={(e) => update({ type: e.target.value })}
          options={Object.entries(LISTING_TYPE_LABELS).map(([v, l]) => ({ value: v, label: l }))}
        />
        <Select
          label="التصنيف"
          placeholder="الكل"
          value={categoryId}
          onChange={(e) => update({ categoryId: e.target.value })}
          options={opts.categories.map((c) => ({ value: c.id, label: c.name }))}
        />
        <Select
          label="المحافظة"
          placeholder="الكل"
          value={governorateId}
          onChange={(e) => update({ governorateId: e.target.value, areaId: null, schoolId: null })}
          options={opts.governorates.map((g) => ({ value: g.id, label: g.name }))}
        />
        <Select
          label="المدينة / المركز"
          placeholder={governorateId ? 'الكل' : 'اختر المحافظة أولًا'}
          disabled={!governorateId}
          value={areaId}
          onChange={(e) => update({ areaId: e.target.value, schoolId: null })}
          options={opts.areas.map((a) => ({ value: a.id, label: a.name }))}
        />
        <Select
          label="المدرسة"
          placeholder={areaId ? 'الكل' : 'اختر المدينة أولًا'}
          disabled={!areaId}
          value={schoolId}
          onChange={(e) => update({ schoolId: e.target.value })}
          options={opts.schools.map((s) => ({ value: s.id, label: s.name }))}
        />
        <Select
          label="الحالة"
          placeholder="الكل"
          value={condition}
          onChange={(e) => update({ condition: e.target.value })}
          options={Object.entries(CONDITION_LABELS).map(([v, l]) => ({ value: v, label: l }))}
        />
        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">السعر من</span>
            <input
              type="number"
              min="0"
              className="input !py-2 text-xs"
              placeholder="0"
              defaultValue={minPrice}
              onBlur={(e) => minPrice !== e.target.value && update({ minPrice: e.target.value || null })}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">السعر إلى</span>
            <input
              type="number"
              min="0"
              className="input !py-2 text-xs"
              placeholder="∞"
              defaultValue={maxPrice}
              onBlur={(e) => maxPrice !== e.target.value && update({ maxPrice: e.target.value || null })}
            />
          </label>
        </div>
        <Select
          label="الترتيب"
          value={sort}
          onChange={(e) => update({ sort: e.target.value })}
          options={[
            { value: 'newest', label: 'الأحدث أولًا' },
            { value: 'price-asc', label: 'السعر: من الأقل' },
            { value: 'price-desc', label: 'السعر: من الأعلى' }
          ]}
        />
      </div>

      {pending && <p className="mt-3 text-xs text-slate-400">جارٍ التحديث...</p>}
    </div>
  );
}
