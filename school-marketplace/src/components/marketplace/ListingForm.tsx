'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Input, Textarea, Select } from '@/components/ui/Field';
import { GeoSelects } from './GeoSelects';
import { ImageUploader } from './ImageUploader';
import { Spinner } from '@/components/ui/Misc';
import { Icon } from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toast';
import { createListingAction, updateListingAction } from '@/lib/actions/listings';
import { cn, LISTING_TYPE_LABELS, CONDITION_LABELS } from '@/lib/utils';

export interface ListingFormProps {
  categories: { id: string; name: string; icon: string | null }[];
  initial?: {
    type: string;
    title: string;
    description: string;
    price: string | null;
    categoryId: string | null;
    governorateId: string | null;
    areaId: string | null;
    schoolId: string | null;
    condition: string;
    images: string[];
  };
  listingId?: string;
}

export function ListingForm({ categories, initial, listingId }: ListingFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  const [type, setType] = useState(initial?.type ?? 'sale');
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [price, setPrice] = useState(initial?.price ?? '');
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? '');
  const [governorateId, setGovernorateId] = useState(initial?.governorateId ?? '');
  const [areaId, setAreaId] = useState(initial?.areaId ?? '');
  const [schoolId, setSchoolId] = useState(initial?.schoolId ?? '');
  const [condition, setCondition] = useState(initial?.condition ?? 'good');
  const [images, setImages] = useState<string[]>(initial?.images ?? []);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');

  const showPrice = type !== 'free';

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (title.trim().length < 4) e.title = 'العنوان قصير جدًا (4 أحرف على الأقل)';
    if (title.trim().length > 100) e.title = 'العنوان طويل جدًا';
    if (description.trim().length < 10) e.description = 'الوصف قصير جدًا (10 أحرف على الأقل)';
    if (!categoryId) e.category = 'اختر التصنيف';
    if (!governorateId) e.gov = 'اختر المحافظة';
    if (!areaId) e.area = 'اختر المدينة';
    if (type === 'sale') {
      const n = Number(price);
      if (!price || Number.isNaN(n) || n <= 0) e.price = 'أدخل سعرًا صحيحًا أكبر من صفر';
    } else if (type === 'exchange' && price && (Number.isNaN(Number(price)) || Number(price) < 0)) {
      e.price = 'قيمة التبادل يجب أن تكون رقمًا';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function submit() {
    setServerError('');
    if (!validate()) return;
    startTransition(async () => {
      const payload = {
        type: type as 'sale' | 'exchange' | 'free',
        title: title.trim(),
        description: description.trim(),
        price: showPrice && price !== '' ? price : undefined,
        categoryId,
        governorateId,
        areaId,
        schoolId: schoolId || undefined,
        condition: condition as 'new' | 'like-new' | 'good' | 'used' | 'damaged',
        imageUrls: images
      };
      const res = listingId
        ? await updateListingAction(listingId, payload)
        : await createListingAction(payload);
      if (!res.ok) {
        setServerError(res.error);
        return;
      }
      toast('success', listingId ? 'تم تحديث الإعلان' : 'تم نشر إعلانك بنجاح');
      router.push(listingId ? `/listings/${listingId}` : '/profile');
      router.refresh();
    });
  }

  const types = (['sale', 'exchange', 'free'] as const).map((t) => ({
    value: t,
    label: LISTING_TYPE_LABELS[t],
    icon: t === 'sale' ? 'tag' : t === 'exchange' ? 'swap' : 'gift'
  }));

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

      {/* Type */}
      <div>
        <span className="label">نوع الإعلان</span>
        <div className="grid grid-cols-3 gap-2">
          {types.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setType(t.value)}
              aria-pressed={type === t.value}
              className={cn(
                'flex flex-col items-center gap-1.5 rounded-xl px-3 py-3 text-sm font-bold ring-1 transition',
                type === t.value
                  ? 'bg-brand-50 text-brand-700 ring-2 ring-brand-600 dark:bg-brand-950/40 dark:text-brand-300'
                  : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700'
              )}
            >
              <Icon name={t.value === 'sale' ? 'tag' : t.value === 'exchange' ? 'swap' : 'box'} size={20} />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <Input
        label="عنوان الإعلان"
        required
        placeholder="مثال: كتاب الرياضيات للصف الثالث الثانوي"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={100}
        error={errors.title}
      />

      <Textarea
        label="الوصف"
        required
        placeholder="اكتب تفاصيل الإعلان: الحالة، الصف الدراسي، أسباب البيع..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        maxLength={2000}
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
        <div className="grid grid-cols-2 gap-3">
          {showPrice && (
            <Input
              label={type === 'exchange' ? 'قيمة التبادل (اختياري)' : 'السعر بالجنيه'}
              type="number"
              min="0"
              step="0.01"
              required={type === 'sale'}
              placeholder="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              error={errors.price}
            />
          )}
          <Select
            label="حالة العنصر"
            required
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            options={Object.entries(CONDITION_LABELS).map(([v, l]) => ({ value: v, label: l }))}
          />
        </div>
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

      <div>
        <span className="label">الصور</span>
        <ImageUploader images={images} onChange={setImages} />
      </div>

      <button type="submit" disabled={pending} className="btn-primary btn-lg w-full">
        {pending ? <Spinner /> : <Icon name={listingId ? 'check' : 'plus'} size={18} />}
        {listingId ? 'حفظ التعديلات' : 'نشر الإعلان'}
      </button>
    </form>
  );
}
