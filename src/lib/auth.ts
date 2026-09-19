import { cookies } from 'next/headers';
import crypto from 'node:crypto';
import { getDb } from '@/db';
import { sessions, users } from '@/db/schema';
import { eq, and, gt } from 'drizzle-orm';
import type { User } from '@/types';

export const SESSION_COOKIE = 'sm_session';
export const SESSION_DAYS = 30;

function authSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error('AUTH_SECRET environment variable is required');
  }
  return secret;
}

function hmacHex(value: string): string {
  return crypto.createHmac('sha256', authSecret()).update(value).digest('hex');
}

export interface AuthResult {
  user: User;
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function tokenHash(token: string): string {
  return hmacHex(token);
}

/**
 * Create a new session for the user and set the httpOnly cookie.
 */
export async function createSession(
  userId: string,
  meta?: { userAgent?: string; ip?: string }
): Promise<void> {
  const db = getDb();
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db.insert(sessions).values({
    userId,
    tokenHash: tokenHash(token),
    userAgent: meta?.userAgent,
    ip: meta?.ip,
    expiresAt
  });
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: expiresAt
  });
}

export async function destroySession(): Promise<void> {
  const store = cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    const db = getDb();
    await db.delete(sessions).where(eq(sessions.tokenHash, tokenHash(token)));
  }
  store.delete(SESSION_COOKIE);
}

/**
 * Resolve the current user from the session cookie.
 * Returns null when there is no valid, unexpired session.
 */
export async function getCurrentUser(): Promise<User | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const db = getDb();
  const rows = await db
    .select({ user: users, session: sessions })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.tokenHash, tokenHash(token)), gt(sessions.expiresAt, new Date())));
  const row = rows[0];
  if (!row) return null;
  if (row.user.status === 'suspended') {
    // Suspend the account server-side: kill the session.
    await db.delete(sessions).where(eq(sessions.id, row.session.id));
    return null;
  }
  return row.user;
}

/** Require an authenticated user, throw AuthError otherwise. */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    throw new AuthError('يجب تسجيل الدخول أولاً', 401);
  }
  return user;
}

/** Require an authenticated admin, throw AuthError otherwise. */
export async function requireAdmin(): Promise<User> {
  const user = await requireUser();
  if (user.role !== 'admin') {
    throw new AuthError('غير مصرح لك بالوصول لهذه الصفحة', 403);
  }
  return user;
}

export function clientIp(headers: Headers): string | undefined {
  return headers.get('x-forwarded-for')?.split(',')[0]?.trim() || undefined;
}
