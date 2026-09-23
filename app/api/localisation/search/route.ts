import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/app/lib/auth";
import { prisma } from "@/lib/prisma";
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();
    if (!q || q.length === 0) {
      return NextResponse.json(
        { error: "La recherche est vide" },
        { status: 400 }
      );
    }
    if (q.length > 100) {
      return NextResponse.json(
        { error: "La recherche est trop longue" },
        { status: 400 }
      );
    }
    // Recherche insensible à la casse sur name OU slug
    const region = await prisma.region.findFirst({
      where: {
        OR: [
          { name: { equals: q, mode: "insensitive" } },
          { slug: { equals: q.toLowerCase(), mode: "insensitive" } },
          { name: { contains: q, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        latitude: true,
        longitude: true,
        _count: {
          select: { announcements: true },
        },
      },
    });
    if (!region) {
      return NextResponse.json(
        { error: "Région introuvable", found: false },
        { status: 404 }
      );
    }
    const count = region._count.announcements;
    return NextResponse.json({
      found: true,
      region: {
        id: region.id,
        name: region.name,
        slug: region.slug,
        latitude: region.latitude,
        longitude: region.longitude,
      },
      count,
      hasPeople: count > 0,
      message:
        count > 0
          ? `${count} annonce(s) disponible(s) à ${region.name}`
          : `Personne dans cette région pour l'instant`,
    });
  } catch (error) {
    console.error("Erreur lors de la recherche de lieu:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}