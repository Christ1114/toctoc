import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  checkRateLimit,
  rateLimitHeaders,
  getClientIp,
} from "@/app/lib/security/rate-limit";
import type { ListingType } from "@/generated/prisma/client";
const RATE_LIMIT_MAX = 60;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
/**
 * ⚙️ Comportement modération
 * true  → les annonces d'un compte désactivé/banni ne sont PAS exposées
 * false → elles restent visibles (utile pour l'historique)
 */
const HIDE_ANNONCES_FROM_INACTIVE_OWNER = true;
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // ── Rate limit par IP ──
    const ip = getClientIp(await headers());
    const rl = await checkRateLimit(
      `profils:announcements:${ip}`,
      RATE_LIMIT_MAX,
      RATE_LIMIT_WINDOW_MS
    );
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Trop de requêtes.", announcements: [] },
        { status: 429, headers: rateLimitHeaders(RATE_LIMIT_MAX, rl) }
      );
    }
    // ── Valider l'ID ──
    const { userId } = await params;
    if (!userId || userId.length > 50) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }
    // ── Récupérer le propriétaire (avec ses flags de modération) ──
    const owner = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        accountType: true,
        isActive: true,
        banned: true,
        banExpires: true,
      },
    });
    if (!owner) {
      return NextResponse.json(
        { error: "Utilisateur introuvable" },
        { status: 404 }
      );
    }
    // ── Modération : compte désactivé ou banni ──
    if (HIDE_ANNONCES_FROM_INACTIVE_OWNER) {
      const isBanned =
        owner.banned &&
        (!owner.banExpires || owner.banExpires > new Date());
      if (isBanned || !owner.isActive) {
        return NextResponse.json(
          { announcements: [], pagination: null },
          {
            headers: {
              ...rateLimitHeaders(RATE_LIMIT_MAX, rl),
              "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
            },
          }
        );
      }
    }
    // ── Pagination ──
    const searchParams = req.nextUrl.searchParams;
    const limit = Math.min(
      Math.max(Number(searchParams.get("limit") ?? 20), 1),
      50
    );
    const page = Math.max(Number(searchParams.get("page") ?? 1), 1);
    const skip = (page - 1) * limit;
    // ── Type d'annonce selon le rôle ──
    // CLIENT   → OFFER   (offres de recrutement publiées)
    // PROVIDER → PROFILE (services proposés)
    // ADMIN    → PROFILE par défaut (cas rare, profil public admin)
    const type: ListingType =
      owner.accountType === "PROVIDER" ? "PROFILE" : "OFFER";
    const where = {
      userId,
      isUserGenerated: true,
      type,
    };
    // ── Requêtes en parallèle ──
    const [announcements, total] = await Promise.all([
      prisma.announcement.findMany({
        where,
        select: {
          id: true,
          type: true,
          title: true,
          description: true,
          salaryMin: true,
          salaryPeriod: true,
          city: true,
          isUrgent: true,
          viewCount: true,
          postedAt: true,
          createdAt: true,
          jobType: { select: { id: true, name: true, slug: true } },
          region: { select: { id: true, name: true, slug: true } },
          // ❌ userId, rawData, sourceId, contactPhone : jamais exposés
        },
        orderBy: [{ isFeatured: "desc" }, { postedAt: "desc" }],
        take: limit,
        skip,
      }),
      prisma.announcement.count({ where }),
    ]);
    return NextResponse.json(
      {
        announcements,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: page * limit < total,
        },
      },
      {
        headers: {
          ...rateLimitHeaders(RATE_LIMIT_MAX, rl),
          // Cache CDN court : 30s + revalidation arrière-plan
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        },
      }
    );
  } catch (error) {
    console.error("Erreur GET profils/announcements:", error);
    return NextResponse.json(
      { error: "Erreur serveur", announcements: [] },
      { status: 500 }
    );
  }
}