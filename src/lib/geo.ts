import { and, asc, eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { areas, governorates, schools } from '@/db/schema';
import { AppError } from './errors';
import { EGYPT_GEOGRAPHY } from '@/db/data/geo';

export interface GeoChainInput {
  governorateId?: string | null;
  areaId?: string | null;
  schoolId?: string | null;
}

/**
 * Server-side validation of the Governorate → Area → School chain.
 * A client can never trust: an area must belong to the governorate it
 * claims, and a school must belong to the area it claims.
 */
export async function validateGeoChain(input: GeoChainInput): Promise<void> {
  const { governorateId, areaId, schoolId } = input;
  if (!governorateId) throw new AppError('اختر المحافظة');
  const db = getDb();

  const [governorate] = await db
    .select({ id: governorates.id })
    .from(governorates)
    .where(eq(governorates.id, governorateId))
    .limit(1);
  if (!governorate) throw new AppError('المحافظة غير موجودة');

  if (areaId) {
    const [area] = await db
      .select({ id: areas.id, governorateId: areas.governorateId })
      .from(areas)
      .where(eq(areas.id, areaId))
      .limit(1);
    if (!area) throw new AppError('المركز غير موجود');
    if (area.governorateId !== governorateId) {
      throw new AppError('المركز المختار لا يتبع المحافظة المحددة');
    }
  } else {
    throw new AppError('اختر المدينة أو المركز');
  }

  if (schoolId) {
    const [school] = await db
      .select({ id: schools.id, areaId: schools.areaId, isActive: schools.isActive })
      .from(schools)
      .where(eq(schools.id, schoolId))
      .limit(1);
    if (!school) throw new AppError('المدرسة غير موجودة');
    if (school.areaId !== areaId) {
      throw new AppError('المدرسة المختارة لا تتبع المركز المحدد');
    }
    if (!school.isActive) throw new AppError('المدرسة غير متاحة حاليًا');
  }
}

async function ensureGeoSeeded(): Promise<void> {
  const db = getDb();
  const existing = await db.select({ id: governorates.id }).from(governorates).limit(1);
  if (existing.length > 0) return;

  for (const [sort, geo] of EGYPT_GEOGRAPHY.entries()) {
    const [gov] = await db
      .insert(governorates)
      .values({ name: geo.governorate, sort })
      .onConflictDoNothing({ target: governorates.name })
      .returning({ id: governorates.id });

    const current = gov ?? (await db
      .select({ id: governorates.id })
      .from(governorates)
      .where(eq(governorates.name, geo.governorate))
      .limit(1))[0];

    if (!current) continue;

    for (const areaName of [...new Set(geo.areas)]) {
      await db
        .insert(areas)
        .values({ name: areaName, governorateId: current.id })
        .onConflictDoNothing({ target: [areas.name, areas.governorateId] });
    }
  }

  const allAreas = await db.select({ id: areas.id, name: areas.name }).from(areas);
  for (const area of allAreas) {
    for (const name of [`${area.name} الرسمية لغات`, `${area.name} التجريبية`]) {
      await db
        .insert(schools)
        .values({ name, areaId: area.id, isActive: true })
        .onConflictDoNothing({ target: [schools.name, schools.areaId] });
    }
  }
}

export interface GeoOptions {
  governorates: { id: string; name: string }[];
  areas: { id: string; name: string }[];
  schools: { id: string; name: string }[];
}

/**
 * Cascade options for the frontend:
 * areas only for the selected governorate, schools only for the selected area.
 */
export async function getGeoOptions(
  governorateId?: string | null,
  areaId?: string | null
): Promise<GeoOptions> {
  await ensureGeoSeeded();
  const db = getDb();
  const [govs, areasList, schoolsList] = await Promise.all([
    db.select({ id: governorates.id, name: governorates.name }).from(governorates).orderBy(asc(governorates.sort)),
    governorateId
      ? db
          .select({ id: areas.id, name: areas.name })
          .from(areas)
          .where(eq(areas.governorateId, governorateId))
          .orderBy(asc(areas.name))
      : Promise.resolve([] as { id: string; name: string }[]),
    areaId
      ? db
          .select({ id: schools.id, name: schools.name })
          .from(schools)
          .where(and(eq(schools.areaId, areaId), eq(schools.isActive, true)))
          .orderBy(asc(schools.name))
      : Promise.resolve([] as { id: string; name: string }[])
  ]);
  return { governorates: govs, areas: areasList, schools: schoolsList };
}

export interface GeoNames {
  governorate?: string | null;
  area?: string | null;
  school?: string | null;
}

/** Resolve display names for a (governorate, area, school) triple. */
export async function resolveGeoNames(input: GeoChainInput): Promise<GeoNames> {
  const db = getDb();
  const [g, a, s] = await Promise.all([
    input.governorateId
      ? db
          .select({ name: governorates.name })
          .from(governorates)
          .where(eq(governorates.id, input.governorateId))
          .limit(1)
      : Promise.resolve([] as { name: string }[]),
    input.areaId
      ? db.select({ name: areas.name }).from(areas).where(eq(areas.id, input.areaId)).limit(1)
      : Promise.resolve([] as { name: string }[]),
    input.schoolId
      ? db.select({ name: schools.name }).from(schools).where(eq(schools.id, input.schoolId)).limit(1)
      : Promise.resolve([] as { name: string }[])
  ]);
  return { governorate: g[0]?.name ?? null, area: a[0]?.name ?? null, school: s[0]?.name ?? null };
}
