import { NextResponse } from 'next/server';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { getCurrentUser } from '@/lib/auth';

export const runtime = 'nodejs';

const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif'
};

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: 'يجب تسجيل الدخول أولًا' }, { status: 401 });
  }

  const maxBytes = Number(process.env.MAX_IMAGE_SIZE ?? 5 * 1024 * 1024);

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, error: 'نوع الطلب غير صالح' }, { status: 400 });
  }

  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: 'لم يتم إرسال أي ملف' }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ ok: false, error: 'الملف فارغ' }, { status: 400 });
  }
  if (file.size > maxBytes) {
    return NextResponse.json(
      { ok: false, error: `حجم الصورة يتجاوز الحد المسموح (${Math.round(maxBytes / 1024 / 1024)} م.ب)` },
      { status: 400 }
    );
  }
  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    return NextResponse.json(
      { ok: false, error: 'نوع الصورة غير مدعوم (JPEG, PNG, WebP, GIF فقط)' },
      { status: 400 }
    );
  }

  const dir = path.join(process.cwd(), 'uploads');
  await fs.mkdir(dir, { recursive: true });
  const name = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(dir, name), buf);

  return NextResponse.json({ ok: true, data: { url: `/files/${name}` } });
}
