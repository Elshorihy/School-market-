'use client';

import { useEffect, useState } from 'react';
import { Select } from '@/components/ui/Field';

interface Option {
  id: string;
  name: string;
}

interface GeoSelectsProps {
  governorateId?: string;
  areaId?: string;
  schoolId?: string;
  onChange: (governorateId: string, areaId: string, schoolId: string) => void;
  schoolRequired?: boolean;
  schoolLabel?: string;
  compact?: boolean;
}

export function GeoSelects({
  governorateId,
  areaId,
  schoolId,
  onChange,
  schoolRequired = false,
  schoolLabel = 'المدرسة (اختياري)'
}: GeoSelectsProps) {
  const [governorates, setGovernorates] = useState<Option[]>([]);
  const [areas, setAreas] = useState<Option[]>([]);
  const [schools, setSchools] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/geo')
      .then((r) => r.json())
      .then((j) => j.ok && setGovernorates(j.data.governorates))
      .catch(() => {});
  }, []);

  // When governorate changes: clear area+school, load areas.
  useEffect(() => {
    if (!governorateId) {
      setAreas([]);
      setSchools([]);
      return;
    }
    setLoading(true);
    fetch(`/api/geo?governorateId=${governorateId}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) {
          setAreas(j.data.areas);
          // Keep the selected area only if it still belongs to this governorate.
          if (areaId && !j.data.areas.some((a: Option) => a.id === areaId)) {
            onChange(governorateId, '', '');
          }
          setSchools([]);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [governorateId]);

  // When area changes: clear school, load schools.
  useEffect(() => {
    if (!governorateId || !areaId) {
      setSchools([]);
      return;
    }
    const gov = governorateId;
    const area = areaId;
    setLoading(true);
    fetch(`/api/geo?governorateId=${gov}&areaId=${area}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) {
          setSchools(j.data.schools);
          if (schoolId && !j.data.schools.some((s: Option) => s.id === schoolId)) {
            onChange(gov, area, '');
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [areaId]);

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <Select
        label="المحافظة"
        required
        placeholder="اختر المحافظة"
        options={governorates.map((g) => ({ value: g.id, label: g.name }))}
        value={governorateId}
        onChange={(e) => onChange(e.target.value, '', '')}
      />
      <Select
        label="المدينة / المركز"
        required
        placeholder={governorateId ? 'اختر المدينة' : 'اختر المحافظة أولًا'}
        disabled={!governorateId || loading}
        options={areas.map((a) => ({ value: a.id, label: a.name }))}
        value={areaId}
        onChange={(e) => onChange(governorateId ?? '', e.target.value, '')}
      />
      <Select
        label={schoolLabel}
        required={schoolRequired}
        placeholder={areaId ? 'اختر المدرسة' : 'اختر المدينة أولًا'}
        disabled={!areaId || loading}
        options={schools.map((s) => ({ value: s.id, label: s.name }))}
        value={schoolId}
        onChange={(e) => onChange(governorateId ?? "", areaId ?? "", e.target.value)}
      />
    </div>
  );
}
