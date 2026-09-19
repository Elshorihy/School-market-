/**
 * Idempotent seed: all 27 Egyptian governorates, their administrative
 * areas, an initial school set, marketplace categories, and an admin user.
 * Safe to run multiple times — no duplicates are created.
 *
 * Usage: npm run db:seed
 */
import 'dotenv/config';
import { EGYPT_GEOGRAPHY } from './data/geo';
import { createDb } from './index';
import { areas, categories, governorates, schools, users } from './schema';
import { eq } from 'drizzle-orm';
import { hashPassword } from '../lib/password';
import crypto from 'node:crypto';

const CATEGORY_SEED: { name: string; icon: string }[] = [
  { name: 'كتب دراسية', icon: '📚' },
  { name: 'كتب خارجية', icon: '📖' },
  { name: 'ملازم', icon: '📝' },
  { name: 'أدوات مدرسية', icon: '✏️' },
  { name: 'آلات حاسبة', icon: '🧮' },
  { name: 'أدوات هندسية', icon: '📐' },
  { name: 'أجهزة إلكترونية', icon: '💻' },
  { name: 'مستلزمات مدرسية', icon: '🧰' },
  { name: 'ملابس مدرسية', icon: '👕' },
  { name: 'حقائب', icon: '🎒' },
  { name: 'أخرى', icon: '📦' }
];

async function main() {
  const db = createDb();
  console.log('Seeding database...');

  /* ---------------- Governorates + Areas ---------------- */
  const govIds = new Map<string, string>();
  let govCount = 0;
  for (const [i, geo] of EGYPT_GEOGRAPHY.entries()) {
    const [gov] = await db
      .insert(governorates)
      .values({ name: geo.governorate, sort: i })
      .onConflictDoNothing({ target: governorates.name })
      .returning({ id: governorates.id });
    if (gov) govCount++;
    const existing = await db
      .select({ id: governorates.id })
      .from(governorates)
      .where(eq(governorates.name, geo.governorate))
      .limit(1);
    const govId = existing[0]?.id ?? gov?.id;
    if (!govId) throw new Error(`Failed to seed governorate ${geo.governorate}`);
    govIds.set(geo.governorate, govId);

    let areaCount = 0;
    for (const areaName of [...new Set(geo.areas)]) {
      const [area] = await db
        .insert(areas)
        .values({ name: areaName, governorateId: govId })
        .onConflictDoNothing({ target: [areas.name, areas.governorateId] })
        .returning({ id: areas.id });
      if (area) areaCount++;
    }
    console.log(`  ✓ ${geo.governorate} (${areaCount} new areas)`);
  }
  console.log(`Governorates: ${govCount} new (27 expected total)`);

  /* ---------------- Schools (initial sample, admin-editable) ---- */
  // Two plausible schools per area so registration always has options.
  const allAreas = await db.select().from(areas);
  const schoolNamePatterns = (area: string) => [
    `${area} الرسمية لغات`,
    `${area} التجريبية`
  ];
  let schoolCount = 0;
  for (const area of allAreas) {
    for (const name of schoolNamePatterns(area.name)) {
      const [s] = await db
        .insert(schools)
        .values({ name, areaId: area.id, isActive: true })
        .onConflictDoNothing({ target: [schools.name, schools.areaId] })
        .returning({ id: schools.id });
      if (s) schoolCount++;
    }
  }
  console.log(`Schools: ${schoolCount} new`);

  /* ---------------- Categories ---------------- */
  let catCount = 0;
  for (const [i, c] of CATEGORY_SEED.entries()) {
    const [row] = await db
      .insert(categories)
      .values({ name: c.name, icon: c.icon, isActive: true, sort: i })
      .onConflictDoNothing({ target: categories.name })
      .returning({ id: categories.id });
    if (row) catCount++;
  }
  console.log(`Categories: ${catCount} new (11 expected total)`);

  /* ---------------- Admin user ---------------- */
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@schoolmarket.eg').toLowerCase();
  const adminPassword =
    process.env.ADMIN_PASSWORD || crypto.randomBytes(9).toString('base64url');
  const existingAdmin = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, adminEmail))
    .limit(1);
  if (!existingAdmin[0]) {
    await db.insert(users).values({
      email: adminEmail,
      name: 'مدير المنصة',
      role: 'admin',
      passwordHash: hashPassword(adminPassword),
      status: 'active'
    });
    console.log(`Admin user created: ${adminEmail}`);
    if (!process.env.ADMIN_PASSWORD) {
      console.log(`  ⚠ Generated admin password (dev only): ${adminPassword}`);
      console.log('  Set ADMIN_PASSWORD in .env to control it.');
    }
  } else {
    console.log('Admin user already exists (skipped)');
  }

  const totals = await Promise.all([
    db.select({ v: governorates.id }).from(governorates),
    db.select({ v: areas.id }).from(areas),
    db.select({ v: schools.id }).from(schools),
    db.select({ v: categories.id }).from(categories),
    db.select({ v: users.id }).from(users)
  ]);
  console.log(
    `Totals → governorates: ${totals[0].length}, areas: ${totals[1].length}, ` +
      `schools: ${totals[2].length}, categories: ${totals[3].length}, users: ${totals[4].length}`
  );
  console.log('Seed complete.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
