'use server';

import { headers } from 'next/headers';
import { getDb, users } from '@/db';
import { eq } from 'drizzle-orm';
import { hashPassword, verifyPassword } from '@/lib/password';
import { createSession, destroySession, clientIp } from '@/lib/auth';
import { loginSchema, registrationSchema, type LoginInput, type RegistrationInput } from '@/lib/validate';
import { validateGeoChain } from '@/lib/geo';
import { rateLimit } from '@/lib/ratelimit';
import { AppError } from '@/lib/errors';
import { actionError, type ActionResult } from './result';

export async function registerAction(input: RegistrationInput): Promise<ActionResult<{ id: string }>> {
  try {
    const data = registrationSchema.parse(input);
    const ip = clientIp(headers()) ?? 'unknown';
    const rl = rateLimit(`register:${ip}`, 5, 10 * 60 * 1000);
    if (!rl.ok) throw new AppError('محاولات كثيرة جدًا، حاول بعد دقائق');

    const db = getDb();
    const email = data.email.toLowerCase();

    const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    if (existing.length > 0) {
      throw new AppError('هذا البريد الإلكتروني مسجل بالفعل');
    }

    // Server-side: area must belong to governorate, school to area.
    await validateGeoChain({
      governorateId: data.governorateId,
      areaId: data.areaId,
      schoolId: data.schoolId || null
    });

    const [user] = await db
      .insert(users)
      .values({
        email,
        name: data.name,
        passwordHash: hashPassword(data.password),
        role: 'student',
        status: 'active',
        governorateId: data.governorateId,
        areaId: data.areaId,
        schoolId: data.schoolId || null,
        bio: data.bio || null
      })
      .returning({ id: users.id });

    await createSession(user.id, {
      userAgent: headers().get('user-agent') ?? undefined,
      ip
    });
    return { ok: true, data: { id: user.id } };
  } catch (err) {
    return actionError(err);
  }
}

export async function loginAction(input: LoginInput): Promise<ActionResult<{ id: string; role: string }>> {
  try {
    const data = loginSchema.parse(input);
    const ip = clientIp(headers()) ?? 'unknown';
    const rl = rateLimit(`login:${ip}:${data.email}`, 8, 15 * 60 * 1000);
    if (!rl.ok) {
      throw new AppError('محاولات دخول كثيرة، انتظر قليلًا ثم حاول مرة أخرى');
    }

    const db = getDb();
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, data.email.toLowerCase()))
      .limit(1);

    if (!user || !verifyPassword(data.password, user.passwordHash)) {
      throw new AppError('بريد إلكتروني أو كلمة مرور غير صحيحة');
    }
    if (user.status === 'suspended') {
      throw new AppError('تم تعليق حسابك، تواصل مع إدارة المنصة');
    }

    await createSession(user.id, {
      userAgent: headers().get('user-agent') ?? undefined,
      ip
    });
    return { ok: true, data: { id: user.id, role: user.role } };
  } catch (err) {
    return actionError(err);
  }
}

export async function logoutAction(): Promise<ActionResult> {
  try {
    await destroySession();
    return { ok: true };
  } catch (err) {
    return actionError(err);
  }
}
