import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/app/lib/auth";
import {
  checkRateLimit,
  rateLimitHeaders,
} from "@/app/lib/security/rate-limit";
/* ═══════════════ Constantes ═══════════════ */
const RATE_LIMIT_MAX = 60;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 20;
/* ═══════════════ Validation des query params ═══════════════ */
const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
  page: z.coerce.number().int().min(1).default(1),
  type: z.enum(["OFFER", "PROFILE"]).optional(),
  sort: z.enum(["recent", "oldest", "views"]).default("recent"),
});
/* ═══════════════ GET — Mes annonces ═══════════════ */
export async function GET(req: NextRequest) {
  try {
    // ── 1. Auth ──
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    // ── 2. Vérifier que le compte est actif ──
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, isActive: true, banned: true, banExpires: true },
    });
    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }
    if (user.banned && (!user.banExpires || user.banExpires > new Date())) {
      return NextResponse.json({ error: "Compte suspendu" }, { status: 403 });
    }
    if (!user.isActive) {
      return NextResponse.json({ error: "Compte désactivé" }, { status: 403 });
    }
    // ── 3. Rate limit par user ──
    const rl = await checkRateLimit(
      `announce:mine:${user.id}`,
      RATE_LIMIT_MAX,
      RATE_LIMIT_WINDOW_MS
    );
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Trop de requêtes. Réessayez dans un instant.", announcements: [] },
        { status: 429, headers: rateLimitHeaders(RATE_LIMIT_MAX, rl) }
      );
    }
    // ── 4. Validation des query params ──
    const rawParams = Object.fromEntries(req.nextUrl.searchParams);
    const parsed = querySchema.safeParse(rawParams);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Paramètres invalides", details: z.treeifyError(parsed.error) },
        { status: 400 }
      );
    }
    const { limit, page, type, sort } = parsed.data;
    const skip = (page - 1) * limit;
    // ── 5. Construction du filtre ──
    const where = {
      userId: user.id,
      isUserGenerated: true,
      ...(type && { type }),
    };
    // ── 6. Tri ──
    const orderBy =
      sort === "oldest"
        ? { createdAt: "asc" as const }
        : sort === "views"
        ? { viewCount: "desc" as const }
        : { createdAt: "desc" as const };
    // ── 7. Requêtes parallèles ──
    const [announcements, total, activeCount] = await Promise.all([
      prisma.announcement.findMany({
        where,
        select: {
          id: true,
          type: true,
          title: true,
          description: true,
          salaryMin: true,
          salaryMax: true,
          salaryPeriod: true,
          city: true,
          isUrgent: true,
          isVerified: true,
          isFeatured: true,
          viewCount: true,
          postedAt: true,
          createdAt: true,
          updatedAt: true,
          jobType: { select: { id: true, name: true, slug: true } },
          region: { select: { id: true, name: true, slug: true } },
        },
        orderBy,
        take: limit,
        skip,
      }),
      prisma.announcement.count({ where }),
      prisma.announcement.count({
        where: { userId: user.id, isUserGenerated: true },
      }),
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
        quota: {
          used: activeCount,
          max: 10,
          remaining: Math.max(0, 10 - activeCount),
        },
      },
      {
        headers: {
          ...rateLimitHeaders(RATE_LIMIT_MAX, rl),
          // ⚠️ Données privées : jamais de cache public
          "Cache-Control": "private, no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error("Erreur GET announcements/mine:", error);
    return NextResponse.json(
      { error: "Erreur serveur", announcements: [] },
      { status: 500 }
    );
  }
}