
import { NextRequest, NextResponse } from "next/server";
import { getProviderVideos } from "@/app/lib/queries/providers";
import {
  checkRateLimit,
  getClientIp,
  rateLimitHeaders,
} from "@/app/lib/security/rate-limit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const RATE_MAX = 60; 

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ip = getClientIp(req.headers);
    const limit = checkRateLimit(`videos:${ip}`, RATE_MAX);

    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Trop de requêtes. Réessayez plus tard." },
        { status: 429, headers: rateLimitHeaders(RATE_MAX, limit) }
      );
    }
    const { id } = await params;

    if (!id || typeof id !== "string" || id.length > 64) {
      return NextResponse.json(
        { error: "ID invalide" },
        { status: 400, headers: rateLimitHeaders(RATE_MAX, limit) }
      );
    }
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") ?? "0", 10);
    const pageSize = parseInt(searchParams.get("pageSize") ?? "20", 10);
    const result = await getProviderVideos(
      id,
      isNaN(page) ? 0 : page,
      isNaN(pageSize) ? 20 : pageSize
    );
    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600",
        ...rateLimitHeaders(RATE_MAX, limit),
      },
    });
  } catch (error) {
    console.error("[api/providers/videos] error:", error);

    return NextResponse.json(
      { error: "Erreur interne" },
      { status: 500 }
    );
  }
}