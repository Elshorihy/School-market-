'use client';

import { useState, useTransition } from 'react';
import { Icon } from '@/components/ui/Icon';
import { Modal } from '@/components/ui/Modal';
import { Select, Textarea } from '@/components/ui/Field';
import { Spinner } from '@/components/ui/Misc';
import { useToast } from '@/components/ui/Toast';
import { createReportAction } from '@/lib/actions/reports';
import { reportReasons } from '@/lib/validate';

export function ReportButton({
  targetType,
  targetId,
  size = 'md'
}: {
  targetType: 'listing' | 'user' | 'message';
  targetId: string;
  size?: 'sm' | 'md';
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const { toast } = useToast();

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setError('');
        }}
        className={`btn-outline ${size === 'sm' ? 'btn-sm' : 'btn-md'} !text-rose-600 dark:!text-rose-400`}
      >
        <Icon name="flag" size={15} />
        إبلاغ
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="الإبلاغ عن محتوى">
        <div className="space-y-4">
          {error && (
            <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
              {error}
            </p>
          )}
          <Select
            label="سبب البلاغ"
            required
            placeholder="اختر السبب"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            options={reportReasons.map((r) => ({ value: r, label: r }))}
          />
          <Textarea
            label="تفاصيل إضافية (اختياري)"
            placeholder="اكتب أي تفاصيل تساعد فريق الإدارة..."
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            maxLength={500}
          />
          <button
            type="button"
            disabled={pending}
            className="btn-danger btn-md w-full"
            onClick={() => {
              if (!reason) {
                setError('اختر سبب البلاغ');
                return;
              }
              startTransition(async () => {
                if (!(reportReasons as readonly string[]).includes(reason)) {
                  setError('اختر سبب البلاغ');
                  return;
                }
                const reasonValue = reason as (typeof reportReasons)[number];
                const res = await createReportAction({ targetType, targetId, reason: reasonValue, details });
                if (!res.ok) {
                  setError(res.error);
                  return;
                }
                setOpen(false);
                setReason('');
                setDetails('');
                toast('success', 'تم استلام بلاغك، ستراجعه الإدارة');
              });
            }}
          >
            {pending ? <Spinner /> : <Icon name="flag" size={15} />}
            إرسال البلاغ
          </button>
        </div>
      </Modal>
    </>
  );
}
