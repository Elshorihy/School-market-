import crypto from 'node:crypto';

/**
 * Password hashing using Node's built-in scrypt (OpenSSL-backed).
 * Format: scrypt$N$r$p$<saltHex>$<hashHex>
 * No plaintext passwords are ever stored.
 */
const N = 16384;
const R = 8;
const P = 1;
const KEYLEN = 64;

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, KEYLEN, { N, r: R, p: P });
  return `scrypt$${N}$${R}$${P}$${salt.toString('hex')}$${hash.toString('hex')}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [scheme, n, r, p, saltHex, hashHex] = stored.split('$');
    if (scheme !== 'scrypt') return false;
    const salt = Buffer.from(saltHex, 'hex');
    const expected = Buffer.from(hashHex, 'hex');
    const actual = crypto.scryptSync(password, salt, expected.length, {
      N: Number(n),
      r: Number(r),
      p: Number(p)
    });
    return crypto.timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}
