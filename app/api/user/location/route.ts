import { NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

const MIN_UPDATE_INTERVAL_MS = 10_000;
const MAX_REGION_LENGTH = 100;

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        lastLatitude: true,
        lastLongitude: true,
        lastLocationUpdatedAt: true,
        lastKnownRegion: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    return NextResponse.json({
      latitude: user.lastLatitude,
      longitude: user.lastLongitude,
      region: user.lastKnownRegion,
      updatedAt: user.lastLocationUpdatedAt,
    });
  } catch (err) {
    console.error("Erreur récupération position:", err);
    return NextResponse.json({ error: "Échec de la récupération" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête JSON invalide" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }

  const { latitude, longitude, region } = body as {
    latitude?: unknown;
    longitude?: unknown;
    region?: unknown;
  };

  if (
    typeof latitude !== "number" ||
    typeof longitude !== "number" ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    return NextResponse.json({ error: "Coordonnées invalides" }, { status: 400 });
  }

  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return NextResponse.json({ error: "Coordonnées hors limites" }, { status: 400 });
  }

  let safeRegion: string | undefined = undefined;
  if (region !== undefined && region !== null) {
    if (typeof region !== "string") {
      return NextResponse.json({ error: "Région invalide" }, { status: 400 });
    }
    const trimmed = region.trim();
    if (trimmed.length > MAX_REGION_LENGTH) {
      return NextResponse.json({ error: "Région trop longue" }, { status: 400 });
    }
    safeRegion = trimmed.length > 0 ? trimmed : undefined;
  }

  try {
    const existing = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { lastLocationUpdatedAt: true },
    });

    if (
      existing?.lastLocationUpdatedAt &&
      Date.now() - existing.lastLocationUpdatedAt.getTime() < MIN_UPDATE_INTERVAL_MS
    ) {
      return NextResponse.json(
        { error: "Trop de requêtes, réessayez plus tard" },
        { status: 429 }
      );
    }

    const roundedLat = Math.round(latitude * 10000) / 10000;
    const roundedLng = Math.round(longitude * 10000) / 10000;

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        lastLatitude: roundedLat,
        lastLongitude: roundedLng,
        lastLocationUpdatedAt: new Date(),
        ...(safeRegion !== undefined ? { lastKnownRegion: safeRegion } : {}),
      },
      select: {
        id: true,
        lastLatitude: true,
        lastLongitude: true,
        lastLocationUpdatedAt: true,
        lastKnownRegion: true,
      },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (err) {
    console.error("Erreur mise à jour position:", err);
    return NextResponse.json({ error: "Échec de la mise à jour" }, { status: 500 });
  }
}