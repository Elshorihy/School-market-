/**
 * Minimal in-memory sliding-window rate limiter (per process).
 * For a single-node deployment this is sufficient; put a Redis-backed
 * limiter in front when scaling to multiple instances.
 */
interface Bucket {
  hits: number[];
}

const store = new Map<string, Bucket>();

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { ok: boolean; retryAfterMs: number } {
  const now = Date.now();
  const bucket = store.get(key) ?? { hits: [] };
  bucket.hits = bucket.hits.filter((t) => now - t < windowMs);
  if (bucket.hits.length >= limit) {
    const retryAfterMs = windowMs - (now - bucket.hits[0]);
    store.set(key, bucket);
    return { ok: false, retryAfterMs };
  }
  bucket.hits.push(now);
  store.set(key, bucket);
  // Opportunistic cleanup to keep memory bounded.
  if (store.size > 5000) {
    for (const [k, b] of store) {
      if (b.hits.length === 0 || now - b.hits[b.hits.length - 1] > windowMs) store.delete(k);
    }
  }
  return { ok: true, retryAfterMs: 0 };
}
