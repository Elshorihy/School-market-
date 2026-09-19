'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Input, Textarea, Select } from '@/components/ui/Field';
import { GeoSelects } from '@/components/marketplace/GeoSelects';
import { Spinner } from '@/components/ui/Misc';
import { Icon } from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toast';
import { createWantedAction, updateWantedAction } from '@/lib/actions/wanted';
import { WANTED_STATUS_LABELS } from '@/lib/utils';

export interface WantedFormProps {
  categories: { id: string; name: string; icon: string | null }[];
  initial?: {
    title: string;
    description: string;
    categoryId: string | null;
    governorateId: string | null;
    areaId: string | null;
    schoolId: string | null;
    status: string;
  };
  wantedId?: string;
}

export function WantedForm({ categories, initial, wantedId }: WantedFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? '');
  const [governorateId, setGovernorateId] = useState(initial?.governorateId ?? '');
  const [areaId, setAreaId] = useState(initial?.areaId ?? '');
  const [schoolId, setSchoolId] = useState(initial?.schoolId ?? '');
  const [status, setStatus] = useState(initial?.status ?? 'open');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');

  function submit() {
    setServerError('');
    const e: Record<string, string> = {};
    if (title.trim().length < 5) e.title = 'العنوان قصير جدًا (5 أحرف على الأقل)';
    if (description.trim().length < 10) e.description = 'الوصف قصير جدًا';
    if (!categoryId) e.category = 'اختر التصنيف';
    if (!governorateId) e.gov = 'اختر المحافظة';
    if (!areaId) e.area = 'اختر المدينة';
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    startTransition(async () => {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        categoryId,
        governorateId,
        areaId,
        schoolId: schoolId || undefined,
        status: status as 'open' | 'found' | 'closed'
      };
      const res = wantedId
        ? await updateWantedAction(wantedId, payload)
        : await createWantedAction(payload);
      if (!res.ok) {
        setServerError(res.error);
        return;
      }
      toast('success', wantedId ? 'تم تحديث الطلب' : 'تم نشر طلبك — سنطابقه مع الإعلانات المتاحة');
      router.push(wantedId ? `/wanted/${wantedId}` : '/wanted');
      router.refresh();
    });
  }

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      {serverError && (
        <div role="alert" className="flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
          <Icon name="warning" size={16} />
          {serverError}
        </div>
      )}

      <Input
        label="عنوان الطلب"
        required
        placeholder="مثال: مطلوب كتاب الأضواء في اللغة العربية للصف الأول الثانوي"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={120}
        error={errors.title}
      />
      <Textarea
        label="الوصف"
        required
        placeholder="اكتب تفاصيل ما تبحث عنه: الطبعة، الصف، الحالة المطلوبة..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        maxLength={1000}
        error={errors.description}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <Select
          label="التصنيف"
          required
          placeholder="اختر التصنيف"
          options={categories.map((c) => ({ value: c.id, label: `${c.icon ?? ''} ${c.name}` }))}
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          error={errors.category}
        />
        {wantedId && (
          <Select
            label="حالة الطلب"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={Object.entries(WANTED_STATUS_LABELS).map(([v, l]) => ({ value: v, label: l }))}
          />
        )}
      </div>
      <GeoSelects
        governorateId={governorateId}
        areaId={areaId}
        schoolId={schoolId}
        onChange={(g, a, s) => {
          setGovernorateId(g);
          setAreaId(a);
          setSchoolId(s);
        }}
      />
      <button type="submit" disabled={pending} className="btn-primary btn-lg w-full">
        {pending ? <Spinner /> : <Icon name="target" size={18} />}
        {wantedId ? 'حفظ التعديلات' : 'نشر الطلب'}
      </button>
    </form>
  );
}
