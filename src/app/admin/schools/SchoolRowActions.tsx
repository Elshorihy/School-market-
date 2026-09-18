'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Input, Select } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Misc';
import { Icon } from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toast';
import { ActionButton } from '@/components/admin/ActionButton';
import { upsertSchoolAction, deleteSchoolAction } from '@/lib/actions/admin';

export function SchoolRowActions({
  id,
  name,
  governorates
}: {
  id: string;
  name: string;
  governorates: { id: string; name: string }[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [editOpen, setEditOpen] = useState(false);
  const [value, setValue] = useState(name);
  const [governorateId, setGovernorateId] = useState('');
  const [areaId, setAreaId] = useState('');
  const [areas, setAreas] = useState<{ id: string; name: string }[]>([]);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');

  useEffect(() => {
    if (!editOpen || !governorateId) {
      setAreas([]);
      return;
    }
    fetch(`/api/geo?governorateId=${governorateId}`)
      .then((r) => r.json())
      .then((j) => j.ok && setAreas(j.data.areas))
      .catch(() => {});
  }, [editOpen, governorateId]);

  return (
    <div className="flex gap-1.5">
      <button
        type="button"
        className="btn-outline btn-sm !px-2.5 !py-1.5"
        onClick={() => {
          setValue(name);
          setGovernorateId('');
          setAreaId('');
          setError('');
          setEditOpen(true);
        }}
      >
        <Icon name="edit" size={14} />
        تعديل
      </button>
      <ActionButton
        label="حذف"
        icon="trash"
        tone="danger"
        confirm="حذف المدرسة؟ لن يتم الحذف إذا كانت مرتبطة بمستخدمين أو إعلانات."
        action={deleteSchoolAction} args={[id]}
        successMessage="تم حذف المدرسة"
      />
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title={`تعديل: ${name}`}>
        <div className="space-y-4">
          {error && <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">{error}</p>}
          <Input label="اسم المدرسة" value={value} onChange={(e) => setValue(e.target.value)} maxLength={80} />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="نقل إلى محافظة"
              placeholder="إبقاء الحالية"
              value={governorateId}
              onChange={(e) => {
                setGovernorateId(e.target.value);
                setAreaId('');
              }}
              options={governorates.map((g) => ({ value: g.id, label: g.name }))}
            />
            <Select
              label="نقل إلى مركز"
              placeholder="إبقاء الحالي"
              disabled={!governorateId}
              value={areaId}
              onChange={(e) => setAreaId(e.target.value)}
              options={areas.map((a) => ({ value: a.id, label: a.name }))}
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="btn-primary btn-md flex-1"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const res = await upsertSchoolAction({
                    id,
                    name: value.trim(),
                    areaId: governorateId || areaId ? areaId || 'unchanged' : 'unchanged',
                    isActive: true
                  });
                  if (!res.ok) {
                    setError(res.error);
                    return;
                  }
                  setEditOpen(false);
                  toast('success', 'تم حفظ التعديلات');
                  router.refresh();
                })
              }
            >
              {pending ? <Spinner /> : <Icon name="check" size={15} />}
              حفظ
            </button>
            <button type="button" className="btn-secondary btn-md flex-1" onClick={() => setEditOpen(false)}>
              إلغاء
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
