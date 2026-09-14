import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/app/lib/auth";
import { prisma } from "@/lib/prisma";



const MAX_RADIUS_KM = 50;
const DEFAULT_RADIUS_KM = 20;
const MIN_RADIUS_KM = 1;
const KM_PER_DEGREE = 111; 
const MAX_RESULTS = 100;
const MAX_USER_AGE_HOURS = 24 * 7; 


const RATE_LIMIT_MAX = 30;         
const RATE_LIMIT_WINDOW_MS = 60_000; 



async function checkRateLimit(userId: string): Promise<boolean> {
  const key = `${userId}:nearby`;
  const now = BigInt(Date.now());

  const record = await prisma.rateLimit.findFirst({
    where: { key },
  });

  if (!record) {
    await prisma.rateLimit.create({
      data: { key, count: 1, lastRequest: now },
    });
    return true;
  }

  const elapsed = Number(now - record.lastRequest);

  if (elapsed > RATE_LIMIT_WINDOW_MS) {
    await prisma.rateLimit.update({
      where: { id: record.id },
      data: { count: 1, lastRequest: now },
    });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return false;
  }

  await prisma.rateLimit.update({
    where: { id: record.id },
    data: { count: { increment: 1 }, lastRequest: now },
  });
  return true;
}



export async function GET(req: NextRequest) {
  // 1. Auth
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  // 2. Rate limiting
  const allowed = await checkRateLimit(session.user.id);
  if (!allowed) {
    return NextResponse.json(
      { error: "Trop de requêtes, réessayez plus tard" },
      { status: 429 }
    );
  }

  // 3. Paramètres
  const params = req.nextUrl.searchParams;
  const lat = Number(params.get("lat"));
  const lng = Number(params.get("lng"));
  const radiusParam = Number(params.get("radius") || DEFAULT_RADIUS_KM);

  // 4. Validation
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "Coordonnées invalides" }, { status: 400 });
  }
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return NextResponse.json({ error: "Coordonnées hors limites" }, { status: 400 });
  }

  // 5. Rayon plafonné
  const radiusKm = Math.min(
    Math.max(radiusParam, MIN_RADIUS_KM),
    MAX_RADIUS_KM
  );

  // Approximation : 1° lat ≈ 111 km, 1° lng ≈ 111 * cos(lat)
  const deltaLat = radiusKm / KM_PER_DEGREE;
  const cosLat = Math.cos((lat * Math.PI) / 180);
  const deltaLng = radiusKm / (KM_PER_DEGREE * Math.max(cosLat, 0.01));

  // 6. Date limite (positions fraîches uniquement)
  const freshSince = new Date(Date.now() - MAX_USER_AGE_HOURS * 60 * 60 * 1000);

  try {
    // 7. Récupérer le user connecté (pour connaître son rôle)
    const me = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        accountType: true,
        clientType: true,
      },
    });

    if (!me) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    // 8. Construire le WHERE de base
    const baseWhere: any = {
      id: { not: session.user.id },      // pas moi
      isActive: true,
      banned: false,
      lastLatitude: {
        not: null,
        gte: lat - deltaLat,
        lte: lat + deltaLat,
      },
      lastLongitude: {
        not: null,
        gte: lng - deltaLng,
        lte: lng + deltaLng,
      },
      lastLocationUpdatedAt: {
        not: null,
        gte: freshSince,
      },
    };

    // 9. Filtrage adaptatif selon le rôle du user connecté
    //    (même logique que /api/search)
    if (me.accountType === "PROVIDER") {
      // Un provider voit les CLIENTS autour de lui
      baseWhere.accountType = "CLIENT";
    } else if (me.accountType === "CLIENT") {
      // Un client voit les PROVIDERS autour de lui
      baseWhere.accountType = "PROVIDER";
      baseWhere.verificationStatus = { not: "REJECTED" };
    }
    // ADMIN → voit tout le monde

    // 10. Requête
    const users = await prisma.user.findMany({
      where: baseWhere,
      take: MAX_RESULTS,
      orderBy: [
        { verificationLevel: "desc" },
        { lastLocationUpdatedAt: "desc" },
      ],
      select: {
        id: true,
        name: true,
        image: true,
        accountType: true,
        providerType: true,
        clientType: true,
        bio: true,
        hourlyRate: true,
        currency: true,
        verificationLevel: true,
        verificationStatus: true,
        lastLatitude: true,
        lastLongitude: true,
        lastKnownRegion: true,
        lastLocationUpdatedAt: true,
      },
    });

    // 11. Arrondir les coordonnées (vie privée — ~1 km)
    const safeUsers = users.map((u) => ({
      ...u,
      lastLatitude:
        u.lastLatitude !== null
          ? Math.round(u.lastLatitude * 100) / 100
          : null,
      lastLongitude:
        u.lastLongitude !== null
          ? Math.round(u.lastLongitude * 100) / 100
          : null,
    }));

    return NextResponse.json({
      users: safeUsers,
      count: safeUsers.length,
      radiusKm,
      center: { lat, lng },
    });
  } catch (err) {
    console.error("Erreur /api/user/nearby:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}