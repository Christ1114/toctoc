import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, rateLimitHeaders, getClientIp } from "@/app/lib/security/rate-limit";

const RATE_LIMIT_MAX = 60;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 min

export async function GET(req: NextRequest) {
  try {
    // Rate limit par IP
    const ip = getClientIp(await headers());
    const rl = await checkRateLimit(
      `refs:job-types:${ip}`,
      RATE_LIMIT_MAX,
      RATE_LIMIT_WINDOW_MS
    );
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Trop de requêtes.", jobTypes: [] },
        { status: 429, headers: rateLimitHeaders(RATE_LIMIT_MAX, rl) }
      );
    }

    const jobTypes = await prisma.jobType.findMany({
      orderBy: [{ category: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        category: true,
      },
    });

    return NextResponse.json(
      { jobTypes },
      {
        headers: {
          ...rateLimitHeaders(RATE_LIMIT_MAX, rl),
          // Les référentiels changent rarement : cache 1h CDN + 24h stale
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      }
    );
  } catch (error) {
    console.error("Erreur GET job-types:", error);
    return NextResponse.json(
      { error: "Erreur serveur", jobTypes: [] },
      { status: 500 }
    );
  }
}