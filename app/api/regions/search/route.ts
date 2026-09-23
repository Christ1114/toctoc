// app/api/regions/search/route.ts
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/app/lib/auth";
import { prisma } from "@/lib/prisma";
const MAX_QUERY_LENGTH = 100;
const MAX_RESULTS = 8;
export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401, headers: { "X-Request-Id": requestId } },
      );
    }
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();
    if (!q) {
      return NextResponse.json({ results: [] });
    }
    if (q.length > MAX_QUERY_LENGTH) {
      return NextResponse.json(
        { error: "La recherche est trop longue" },
        { status: 400 },
      );
    }
    const regions = await prisma.region.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { slug: { contains: q.toLowerCase(), mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        latitude: true,
        longitude: true,
        _count: {
          select: {
            // ✅ On ne compte QUE les annonces publiées par un vrai user
            announcements: {
              where: { isUserGenerated: true },
            },
          },
        },
      },
      orderBy: { name: "asc" },
      take: MAX_RESULTS,
    });
    const results = regions.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      latitude: r.latitude,
      longitude: r.longitude,
      count: r._count.announcements,
      hasOffers: r._count.announcements > 0,
    }));
    return NextResponse.json(
      { results },
      {
        headers: {
          // ✅ Cache 30s : la recherche de villes change peu
          "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
          "X-Request-Id": requestId,
        },
      },
    );
  } catch (error) {
    console.error(`[regions-search:${requestId}]`, error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500, headers: { "X-Request-Id": requestId } },
    );
  }
}