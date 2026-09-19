import { NextResponse } from 'next/server';
import { uuid as uuidSchema } from '@/lib/validate';
import { getGeoOptions } from '@/lib/geo';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Public cascade options:
 *   GET /api/geo                          → governorates
 *   GET /api/geo?governorateId=<id>       → + areas of that governorate
 *   GET /api/geo?governorateId=<id>&areaId=<id> → + schools of that area
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const govParam = url.searchParams.get('governorateId');
  const areaParam = url.searchParams.get('areaId');
  let governorateId: string | undefined;
  let areaId: string | undefined;
  if (govParam) {
    const parsed = uuidSchema.safeParse(govParam);
    if (!parsed.success) return NextResponse.json({ ok: false, error: 'معرف غير صالح' }, { status: 400 });
    governorateId = parsed.data;
  }
  if (areaParam) {
    const parsed = uuidSchema.safeParse(areaParam);
    if (!parsed.success) return NextResponse.json({ ok: false, error: 'معرف غير صالح' }, { status: 400 });
    areaId = parsed.data;
  }
  try {
    const data = await getGeoOptions(governorateId, areaId);
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    console.error('[geo]', err);
    return NextResponse.json({ ok: false, error: 'تعذر تحميل البيانات الجغرافية' }, { status: 500 });
  }
}
