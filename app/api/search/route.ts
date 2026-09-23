// app/api/search/route.ts
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/app/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProviderType, type Prisma } from "@/generated/prisma/client";
// ─── Config ──────────────────────────────────────────────────────
const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 8;
const MIN_QUERY_LENGTH = 2;
const MAX_QUERY_LENGTH = 100;
/**
 * 🚨 FILTRE ANTI-SEED
 * On ne remonte QUE les annonces publiées depuis la plateforme
 * par un vrai user — jamais le seed / démo / scraped.
 */
const EXCLUDE_SEED: Prisma.AnnouncementWhereInput = {
  isUserGenerated: true,
};
// ─── Helpers ─────────────────────────────────────────────────────
const normalize = (s: string) => s.toLowerCase().replace(/[\s-]/g, "");
const clampInt = (
  v: string | null,
  fallback: number,
  min: number,
  max: number,
) => {
  const n = parseInt(v ?? "", 10);
  return Number.isNaN(n) ? fallback : Math.min(Math.max(n, min), max);
};
const buildAnnouncementSearch = (q: string): Prisma.AnnouncementWhereInput => ({
  OR: [
    { title:       { contains: q, mode: "insensitive" } },
    { description: { contains: q, mode: "insensitive" } },
    { city:        { contains: q, mode: "insensitive" } },
    { location:    { contains: q, mode: "insensitive" } },
    { jobType:     { name:     { contains: q, mode: "insensitive" } } },
    { jobType:     { category: { contains: q, mode: "insensitive" } } },
    { region:      { name:     { contains: q, mode: "insensitive" } } },
  ],
});
// ─── Selects / OrderBy réutilisables ─────────────────────────────
const ANNOUNCEMENT_SELECT = {
  id: true, type: true, title: true, description: true,userId: true, 
  city: true, location: true, isUrgent: true, isVerified: true,
  isFeatured: true, postedAt: true, salaryMin: true, salaryMax: true,
  salaryPeriod: true, salaryRaw: true, workArrangement: true,
  shift: true, contractDuration: true, workDays: true,
  workStartTime: true, workEndTime: true, experienceYearsRequired: true,
  transportAllowance: true, createdAt: true,
  jobType: { select: { id: true, name: true, slug: true, category: true } },
  region:  { select: { id: true, name: true, slug: true } },
} satisfies Prisma.AnnouncementSelect;
const PROVIDER_SELECT = {
  id: true, name: true, image: true, bio: true,
  providerType: true, hourlyRate: true, currency: true,
  verificationStatus: true, verificationLevel: true,
  lastKnownRegion: true, isActive: true, createdAt: true,
} satisfies Prisma.UserSelect;
const ANNOUNCEMENT_ORDER: Prisma.AnnouncementOrderByWithRelationInput[] = [
  { isFeatured: "desc" },
  { isUrgent: "desc" },
  { postedAt: "desc" },
];
const PROVIDER_ORDER: Prisma.UserOrderByWithRelationInput[] = [
  { verificationLevel: "desc" },
  { isActive: "desc" },
  { createdAt: "desc" },
];
// ─── Route ───────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();
  try {
    // 1. Auth
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401, headers: { "X-Request-Id": requestId } },
      );
    }
    // 2. Query params + validation
    const { searchParams } = request.nextUrl;
    const rawQuery = searchParams.get("q")?.trim() ?? "";
    const limit = clampInt(searchParams.get("limit"), DEFAULT_LIMIT, 1, MAX_LIMIT);
    const page  = clampInt(searchParams.get("page"),  1, 1, 10_000);
    const skip  = (page - 1) * limit;
    if (rawQuery.length > MAX_QUERY_LENGTH) {
      return NextResponse.json(
        { error: "Requête trop longue" },
        { status: 400, headers: { "X-Request-Id": requestId } },
      );
    }
    // 3. User
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, accountType: true, clientType: true, providerType: true },
    });
    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404, headers: { "X-Request-Id": requestId } },
      );
    }
    const searchType = user.accountType;
    // 4. Query trop courte
    if (rawQuery.length < MIN_QUERY_LENGTH) {
      return NextResponse.json({
        results: [],
        total: 0,
        query: rawQuery,
        searchType,
        pagination: { page, limit, totalPages: 0, hasMore: false },
        message: `La recherche doit contenir au moins ${MIN_QUERY_LENGTH} caractères`,
      });
    }
    let results: unknown[] = [];
    let total = 0;
    // ── CLIENT ───────────────────────────────────────────────────
    // Voit : toutes les annonces user + tous les providers actifs
    if (searchType === "CLIENT") {
      const halfLimit = Math.max(Math.ceil(limit / 2), 1);
      const halfSkip  = (page - 1) * halfLimit;
      const normalizedQuery = normalize(rawQuery);
      const matchingProviderTypes = Object.values(ProviderType).filter(
        (type) => normalize(type).includes(normalizedQuery),
      );
      // ✅ AND : combine proprement anti-seed + recherche texte
      const announcementWhere: Prisma.AnnouncementWhereInput = {
        AND: [EXCLUDE_SEED, buildAnnouncementSearch(rawQuery)],
      };
      const providerWhere: Prisma.UserWhereInput = {
        accountType: "PROVIDER",
        isActive: true,
        OR: [
          { name:            { contains: rawQuery, mode: "insensitive" } },
          { bio:             { contains: rawQuery, mode: "insensitive" } },
          { lastKnownRegion: { contains: rawQuery, mode: "insensitive" } },
          ...(matchingProviderTypes.length
            ? [{ providerType: { in: matchingProviderTypes } }]
            : []),
        ],
      };
      const [announcements, providers, announcementCount, providerCount] =
        await Promise.all([
          prisma.announcement.findMany({
            where: announcementWhere,
            take: halfLimit,
            skip: halfSkip,
            orderBy: ANNOUNCEMENT_ORDER,
            select: ANNOUNCEMENT_SELECT,
          }),
          prisma.user.findMany({
            where: providerWhere,
            take: halfLimit,
            skip: halfSkip,
            orderBy: PROVIDER_ORDER,
            select: PROVIDER_SELECT,
          }),
          prisma.announcement.count({ where: announcementWhere }),
          prisma.user.count({ where: providerWhere }),
        ]);
      results = [
        ...announcements.map((a) => ({ ...a, resultType: "JOB" as const })),
        ...providers.map((p) => ({ ...p, resultType: "PROFILE" as const })),
      ];
      total = announcementCount + providerCount;
    }
    else if (searchType === "PROVIDER") {
      const where: Prisma.AnnouncementWhereInput = {
        AND: [
          {
            OR: [
              { type: "OFFER" },
              { type: "PROFILE", userId: user.id },
            ],
          },
          // 2. Anti-seed
          EXCLUDE_SEED,
          // 3. Recherche texte
          buildAnnouncementSearch(rawQuery),
        ],
      };
      const [announcements, count] = await Promise.all([
        prisma.announcement.findMany({
          where,
          take: limit,
          skip,
          orderBy: ANNOUNCEMENT_ORDER,
          select: ANNOUNCEMENT_SELECT,
        }),
        prisma.announcement.count({ where }),
      ]);
      results = announcements.map((a) => ({ ...a, resultType: "JOB" as const }));
      total = count;
    }
    // ── ADMIN ────────────────────────────────────────────────────
    // Voit TOUT (seed inclus) pour la modération
    else if (searchType === "ADMIN") {
      const halfLimit = Math.max(Math.ceil(limit / 2), 1);
      const halfSkip  = (page - 1) * halfLimit;
      const announcementWhere: Prisma.AnnouncementWhereInput = {
        OR: [
          { title:       { contains: rawQuery, mode: "insensitive" } },
          { description: { contains: rawQuery, mode: "insensitive" } },
          { city:        { contains: rawQuery, mode: "insensitive" } },
          { jobType:     { name: { contains: rawQuery, mode: "insensitive" } } },
        ],
      };
      const userWhere: Prisma.UserWhereInput = {
        OR: [
          { name:        { contains: rawQuery, mode: "insensitive" } },
          { email:       { contains: rawQuery, mode: "insensitive" } },
          { companyName: { contains: rawQuery, mode: "insensitive" } },
        ],
      };
      const [announcements, providers, aCount, pCount] = await Promise.all([
        prisma.announcement.findMany({
          where: announcementWhere,
          take: halfLimit,
          skip: halfSkip,
          orderBy: { postedAt: "desc" },
          select: {
            id: true, type: true, title: true, description: true,
            city: true, isUrgent: true, isVerified: true, postedAt: true,
            jobType: { select: { id: true, name: true } },
          },
        }),
        prisma.user.findMany({
          where: userWhere,
          take: halfLimit,
          skip: halfSkip,
          orderBy: { createdAt: "desc" },
          select: {
            id: true, name: true, email: true, accountType: true,
            providerType: true, companyName: true, isActive: true,
          },
        }),
        prisma.announcement.count({ where: announcementWhere }),
        prisma.user.count({ where: userWhere }),
      ]);
      results = [
        ...announcements.map((a) => ({ ...a, resultType: "JOB" as const })),
        ...providers.map((p) => ({ ...p, resultType: "PROFILE" as const })),
      ];
      total = aCount + pCount;
    }
    // 5. Pagination
    const totalPages = Math.ceil(total / limit);
    const hasMore = page < totalPages;
    // 6. Réponse (cache privé court, jamais partagé entre users)
    return NextResponse.json(
      {
        results,
        total,
        query: rawQuery,
        searchType,
        pagination: { page, limit, totalPages, hasMore },
      },
      {
        headers: {
          "Cache-Control": "private, max-age=10, stale-while-revalidate=30",
          "X-Request-Id": requestId,
        },
      },
    );
  } catch (error) {
    console.error(`[search:${requestId}]`, error);
    return NextResponse.json(
      { error: "Erreur serveur", results: [], total: 0 },
      { status: 500, headers: { "X-Request-Id": requestId } },
    );
  }
}