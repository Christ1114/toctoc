import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { REGIONS } from "@/app/lib/security/locationCheck";

export async function POST(req: NextRequest) {
  try {
    // 1. Vérifier l'authentification
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 }
      );
    }

    // 2. Vérifier l'origine (même protection que tes autres routes)
    const origin = req.headers.get("origin");
    const host = req.headers.get("host");

    if (origin && host && new URL(origin).host !== host) {
      return NextResponse.json(
        { success: false, error: "Origine non autorisée" },
        { status: 403 }
      );
    }

    // 3. Valider le payload
    const body = await req.json().catch(() => null);

    if (!body || typeof body.lat !== "number" || typeof body.lng !== "number") {
      return NextResponse.json(
        { success: false, error: "payload-invalide" },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(body.lat) ||
      !Number.isFinite(body.lng) ||
      body.lat < -90 ||
      body.lat > 90 ||
      body.lng < -180 ||
      body.lng > 180
    ) {
      return NextResponse.json(
        { success: false, error: "coordonnees-invalides" },
        { status: 400 }
      );
    }

    // 4. Trouver la région la plus proche (optionnel, pour lastKnownRegion)
    const region = body.region as string | undefined;

    // 5. Mettre à jour l'utilisateur
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        lastLatitude: body.lat,
        lastLongitude: body.lng,
        lastLocationUpdatedAt: new Date(),
        lastKnownRegion: region ?? undefined,
        locationVerified: true,
      },
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Erreur update-user-location:", error);

    const errorMessage = process.env.NODE_ENV === "production"
      ? "Erreur interne"
      : error instanceof Error ? error.message : "Erreur interne";

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}