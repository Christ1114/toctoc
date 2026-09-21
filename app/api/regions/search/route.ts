

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/app/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();

    if (!q) {
      return NextResponse.json({ results: [] });
    }
    if (q.length > 100) {
      return NextResponse.json({ error: "La recherche est trop longue" }, { status: 400 });
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
        _count: { select: { announcements: true } },
      },
      orderBy: { name: "asc" },
      take: 8,
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

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Erreur lors de la recherche de villes:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}