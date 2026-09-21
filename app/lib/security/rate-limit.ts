

type Entry = { count: number; timestamp: number };

const store = new Map<string, Entry>();
const DEFAULT_WINDOW_MS = 60 * 1000;
const CLEANUP_THRESHOLD = 5000;

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
};
export function checkRateLimit(
  key: string,
  max: number,
  windowMs: number = DEFAULT_WINDOW_MS
): RateLimitResult {
  const now = Date.now();
  if (store.size > CLEANUP_THRESHOLD) {
    for (const [k, v] of store) {
      if (now - v.timestamp > windowMs) store.delete(k);
    }
  }

  const entry = store.get(key);

  if (!entry || now - entry.timestamp > windowMs) {
    store.set(key, { count: 1, timestamp: now });
    return { allowed: true, remaining: max - 1, retryAfterMs: 0 };
  }

  if (entry.count >= max) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: Math.max(0, windowMs - (now - entry.timestamp)),
    };
  }

  entry.count++;
  return { allowed: true, remaining: max - entry.count, retryAfterMs: 0 };
}
export function getClientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    headers.get("cf-connecting-ip") ||
    "unknown"
  );
}
export function rateLimitHeaders(
  max: number,
  result: RateLimitResult
): Record<string, string> {
  const headers: Record<string, string> = {
    "X-RateLimit-Limit": String(max),
    "X-RateLimit-Remaining": String(result.remaining),
  };

  if (result.retryAfterMs > 0) {
    headers["Retry-After"] = String(Math.ceil(result.retryAfterMs / 1000));
  }

  return headers;
}