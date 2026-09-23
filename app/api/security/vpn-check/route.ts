import { NextRequest, NextResponse } from "next/server";
import { checkVpnStatus } from "@/app/lib/security/vpnCheck";
import { auth } from "@/app/lib/auth";
import { headers } from "next/headers";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const rateLimitMap = new Map<string, { count: number; timestamp: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000;
const RATE_LIMIT_MAX = 10;
const MAP_CLEANUP_THRESHOLD = 5000; 
function cleanupExpired(now: number) {
  if (rateLimitMap.size < MAP_CLEANUP_THRESHOLD) return;
  for (const [key, value] of rateLimitMap.entries()) {
    if (now - value.timestamp > RATE_LIMIT_WINDOW) {
      rateLimitMap.delete(key);
    }
  }
}
function checkRateLimit(key: string): {
  allowed: boolean;
  remaining: number;
  retryAfter: number;
} {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now - entry.timestamp > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(key, { count: 1, timestamp: now });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1, retryAfter: 0 };
  }
  if (entry.count >= RATE_LIMIT_MAX) {
    return {
      allowed: false,
      remaining: 0,
      retryAfter: Math.max(0, RATE_LIMIT_WINDOW - (now - entry.timestamp)),
    };
  }
  entry.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX - entry.count, retryAfter: 0 };
}
function safeUrl(raw: string | null): URL | null {
  if (!raw) return null;
  try {
    return new URL(raw);
  } catch {
    return null;
  }
}
function rateLimitHeaders(limit: { remaining: number; retryAfter: number }) {
  return {
    "X-RateLimit-Limit": String(RATE_LIMIT_MAX),
    "X-RateLimit-Remaining": String(limit.remaining),
    ...(limit.retryAfter > 0 ? { "Retry-After": String(Math.ceil(limit.retryAfter / 1000)) } : {}),
  };
}
export async function GET(req: NextRequest) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";
    cleanupExpired(Date.now());
    const ipLimit = checkRateLimit(`ip:${ip}`);
    if (!ipLimit.allowed) {
      return NextResponse.json(
        { success: false, error: "Trop de requêtes. Veuillez réessayer plus tard." },
        { status: 429, headers: rateLimitHeaders(ipLimit) }
      );
    }
    const session = await auth.api.getSession({ headers: await headers() });
    const internalSecret = process.env.INTERNAL_REQUEST_SECRET;
    const isInternal =
      !!internalSecret && req.headers.get("x-internal-request") === internalSecret;
    if (!session?.user && !isInternal) {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 }
      );
    }
    const host = req.headers.get("host");
    if (host) {
      const origin = safeUrl(req.headers.get("origin"));
      const referer = safeUrl(req.headers.get("referer"));
      const originMismatch = origin && origin.host !== host;
      const refererMismatch = !origin && referer && referer.host !== host;
      if (originMismatch || refererMismatch) {
        return NextResponse.json(
          { success: false, error: "Origine non autorisée" },
          { status: 403 }
        );
      }
    }
    if (session?.user) {
      const userLimit = checkRateLimit(`user:${session.user.id}`);
      if (!userLimit.allowed) {
        return NextResponse.json(
          { success: false, error: "Trop de requêtes. Veuillez réessayer plus tard." },
          { status: 429, headers: rateLimitHeaders(userLimit) }
        );
      }
    }
    const vpnResult = await checkVpnStatus(req.headers);
    console.log("VPN Check:", {
      userId: session?.user?.id ?? "internal",
      isVpn: vpnResult.isVpn,
      provider: vpnResult.provider,
      country: vpnResult.country,
      confidence: vpnResult.confidence,
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json(
      { success: true, ...vpnResult },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
          ...rateLimitHeaders({ remaining: ipLimit.remaining, retryAfter: 0 }),
        },
      }
    );
  } catch (error) {
    console.error("Erreur check-vpn:", error);
    const errorMessage =
      process.env.NODE_ENV === "production"
        ? "Erreur interne"
        : error instanceof Error
        ? error.message
        : "Erreur interne";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}