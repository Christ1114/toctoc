import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, rateLimitHeaders, getClientIp } from "@/app/lib/security/rate-limit";

const RATE_LIMIT_MAX = 60;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

export async function GET(req: NextRequest) {
  try {
    const ip = getClientIp(await headers());
    const rl = await checkRateLimit(
      `refs:regions:${ip}`,
      RATE_LIMIT_MAX,
      RATE_LIMIT_WINDOW_MS
    );
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Trop de requêtes.", regions: [] },
        { status: 429, headers: rateLimitHeaders(RATE_LIMIT_MAX, rl) }
      );
    }

    const regions = await prisma.region.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        latitude: true,
        longitude: true,
      },
    });

    return NextResponse.json(
      { regions },
      {
        headers: {
          ...rateLimitHeaders(RATE_LIMIT_MAX, rl),
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      }
    );
  } catch (error) {
    console.error("Erreur GET regions:", error);
    return NextResponse.json(
      { error: "Erreur serveur", regions: [] },
      { status: 500 }
    );
  }
}