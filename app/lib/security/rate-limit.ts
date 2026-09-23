import { prisma } from "@/lib/prisma";
export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
};
const DEFAULT_WINDOW_MS = 60 * 1000;
type Entry = { count: number; timestamp: number };
const memoryStore = new Map<string, Entry>();
const CLEANUP_THRESHOLD = 5000;
const CLEANUP_PROBABILITY = 0.01;
function checkRateLimitMemory(
  key: string,
  max: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  if (memoryStore.size > CLEANUP_THRESHOLD && Math.random() < CLEANUP_PROBABILITY) {
    for (const [k, v] of memoryStore) {
      if (now - v.timestamp > windowMs) memoryStore.delete(k);
    }
  }
  const entry = memoryStore.get(key);
  if (!entry || now - entry.timestamp > windowMs) {
    memoryStore.set(key, { count: 1, timestamp: now });
    return { allowed: true, remaining: max - 1, retryAfterMs: 0 };
  }
  if (entry.count >= max) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: Math.max(0, windowMs - (now - entry.timestamp)),
    };
  }
  memoryStore.set(key, { ...entry, count: entry.count + 1 });
  return { allowed: true, remaining: max - entry.count - 1, retryAfterMs: 0 };
}
async function checkRateLimitPostgres(
  key: string,
  max: number,
  windowMs: number
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowStart = now - windowMs;
  const id = crypto.randomUUID();
  const rows = await prisma.$queryRaw<
    { count: number; last_request: bigint }[]
  >`
    INSERT INTO rate_limits (id, key, count, last_request)
    VALUES (${id}, ${key}, 1, ${BigInt(now)})
    ON CONFLICT (key) DO UPDATE
      SET
        count = CASE
          WHEN rate_limits.last_request < ${BigInt(windowStart)} THEN 1
          ELSE rate_limits.count + 1
        END,
        last_request = CASE
          WHEN rate_limits.last_request < ${BigInt(windowStart)} THEN ${BigInt(now)}
          ELSE rate_limits.last_request
        END
    RETURNING count, last_request;
  `;
  const row = rows[0];
  if (!row) {
    // Cas théorique impossible, on laisse passer pour ne pas bloquer l'utilisateur
    return { allowed: true, remaining: max - 1, retryAfterMs: 0 };
  }
  const currentCount = Number(row.count);
  const lastRequest = Number(row.last_request);
  if (currentCount > max) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: Math.max(0, lastRequest + windowMs - now),
    };
  }
  return {
    allowed: true,
    remaining: max - currentCount,
    retryAfterMs: 0,
  };
}
export async function checkRateLimit(
  key: string,
  max: number,
  windowMs: number = DEFAULT_WINDOW_MS
): Promise<RateLimitResult> {
  try {
    return await checkRateLimitPostgres(key, max, windowMs);
  } catch (err) {
    console.error("[rate-limit] Postgres failed, falling back to memory:", err);
    return checkRateLimitMemory(key, max, windowMs);
  }
}
export function getClientIp(headers: Headers): string {
  return (
    headers.get("cf-connecting-ip") ||
    headers.get("x-real-ip") ||
    headers.get("x-forwarded-for")?.split(",").pop()?.trim() ||
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