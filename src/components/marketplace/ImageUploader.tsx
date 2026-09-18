'use client';

import { useRef, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { Spinner } from '@/components/ui/Misc';
import { useToast } from '@/components/ui/Toast';

const MAX_COUNT = 6;

export function ImageUploader({
  images,
  onChange
}: {
  images: string[];
  onChange: (urls: string[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(0);
  const { toast } = useToast();

  async function handleFiles(files: FileList | null) {
    if (!files) return;
    const room = MAX_COUNT - images.length;
    if (room <= 0) {
      toast('error', `الحد الأقصى ${MAX_COUNT} صور`);
      return;
    }
    const list = Array.from(files).slice(0, room);
    setUploading(list.length);
    const urls: string[] = [];
    for (const file of list) {
      const fd = new FormData();
      fd.append('file', file);
      try {
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        const json = (await res.json()) as { ok?: boolean; data?: { url: string }; error?: string };
        if (json.ok && json.data) urls.push(json.data.url);
        else toast('error', json.error ?? 'فشل رفع الصورة');
      } catch {
        toast('error', 'فشل رفع الصورة');
      }
      setUploading((v) => v - 1);
    }
    if (urls.length) onChange([...images, ...urls]);
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {images.map((url, i) => (
          <div key={`${url}-${i}`} className="group relative h-24 w-24 overflow-hidden rounded-xl ring-1 ring-slate-200 dark:ring-slate-700">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={`صورة ${i + 1}`} className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(images.filter((_, j) => j !== i))}
              className="absolute end-1 top-1 rounded-full bg-rose-600 p-1 text-white opacity-90 transition hover:opacity-100"
              aria-label="حذف الصورة"
            >
              <Icon name="x" size={12} />
            </button>
          </div>
        ))}
        {uploading > 0 && (
          <div className="flex h-24 w-24 items-center justify-center rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700">
            <Spinner />
          </div>
        )}
        {images.length < MAX_COUNT && uploading === 0 && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex h-24 w-24 flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-slate-300 text-xs font-semibold text-slate-500 transition hover:border-brand-500 hover:text-brand-600 dark:border-slate-700 dark:text-slate-400"
          >
            <Icon name="image" size={22} />
            إضافة صورة
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
        حتى {MAX_COUNT} صور · JPEG / PNG / WebP / GIF · لا يتجاوز 5 م.ب للصورة
      </p>
    </div>
  );
}
