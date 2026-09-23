import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/app/lib/auth";
import type { ListingType, Prisma } from "@/generated/prisma/client";
import { createAnnouncementSchema } from "@/app/lib/validators/announcement";
import {
  checkRateLimit,
  rateLimitHeaders,
  getClientIp,
} from "@/app/lib/security/rate-limit";

/* ═══════════════ Constantes ═══════════════ */
const MAX_ACTIVE_ANNOUNCEMENTS_PER_USER = 10;
const CREATE_RATE_LIMIT_MAX = 5;
const CREATE_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1h

const LIST_RATE_LIMIT_MAX = 100;
const LIST_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1h

/* ═══════════════ GET — Liste publique ═══════════════ */
export async function GET(req: NextRequest) {
  try {
    const ip = getClientIp(await headers());
    const rl = await checkRateLimit(
      `announce:list:${ip}`,
      LIST_RATE_LIMIT_MAX,
      LIST_RATE_LIMIT_WINDOW_MS
    );
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Trop de requêtes. Réessayez plus tard.", announcements: [] },
        { status: 429, headers: rateLimitHeaders(LIST_RATE_LIMIT_MAX, rl) }
      );
    }

    const params = req.nextUrl.searchParams;
    const limit = Math.min(Math.max(Number(params.get("limit") ?? 30), 1), 50);
    const page = Math.max(Number(params.get("page") ?? 1), 1);
    const skip = (page - 1) * limit;

    const type = params.get("type");
    const jobTypeSlug = params.get("jobType");
    const regionSlug = params.get("region");
    const city = params.get("city");
    const q = params.get("q")?.trim();

    const where: Prisma.AnnouncementWhereInput = {};

    if (type === "OFFER" || type === "PROFILE") {
      where.type = type as ListingType;
    }
    if (jobTypeSlug) where.jobType = { slug: jobTypeSlug };
    if (regionSlug) where.region = { slug: regionSlug };
    if (city) where.city = { contains: city, mode: "insensitive" };
    if (q && q.length >= 2 && q.length <= 100) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { city: { contains: q, mode: "insensitive" } },
      ];
    }

    const [announcements, total] = await Promise.all([
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
          salaryRaw: true,
          isUrgent: true,
          workArrangement: true,
          shift: true,
          contractDuration: true,
          transportAllowance: true,
          workDays: true,
          workStartTime: true,
          workEndTime: true,
          desiredStartDate: true,
          experienceYearsRequired: true,
          city: true,
          location: true,
          language: true,
          postedAt: true,
          contactPhone: true,
          contactWhatsapp: true,
          isFeatured: true,
          isVerified: true,
          isUserGenerated: true,
          jobType: {
            select: { name: true, slug: true, category: true },
          },
          region: {
            select: {
              name: true,
              slug: true,
              latitude: true,
              longitude: true,
            },
          },
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
      { headers: rateLimitHeaders(LIST_RATE_LIMIT_MAX, rl) }
    );
  } catch (error) {
    console.error("Erreur GET announcements:", error);
    return NextResponse.json(
      { error: "Erreur serveur", announcements: [] },
      { status: 500 }
    );
  }
}

/* ═══════════════ POST — Créer une annonce ═══════════════ */
export async function POST(req: NextRequest) {
  try {
    // 1. Auth
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // 2. Charger user + flags
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        accountType: true,
        banned: true,
        banExpires: true,
        isActive: true,
        emailVerified: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    // 3. Checks de sécurité
    if (user.banned && (!user.banExpires || user.banExpires > new Date())) {
      return NextResponse.json({ error: "Compte suspendu" }, { status: 403 });
    }
    if (!user.isActive) {
      return NextResponse.json({ error: "Compte désactivé" }, { status: 403 });
    }
    if (!user.emailVerified) {
      return NextResponse.json(
        { error: "Veuillez vérifier votre email avant de publier" },
        { status: 403 }
      );
    }

    // 4. Rate limit par user
    const rl = await checkRateLimit(
      `announce:create:${user.id}`,
      CREATE_RATE_LIMIT_MAX,
      CREATE_RATE_LIMIT_WINDOW_MS
    );
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Trop de publications. Réessayez plus tard." },
        { status: 429, headers: rateLimitHeaders(CREATE_RATE_LIMIT_MAX, rl) }
      );
    }

    // 5. Limite annonces actives
    const activeCount = await prisma.announcement.count({
      where: { userId: user.id, isUserGenerated: true },
    });
    if (activeCount >= MAX_ACTIVE_ANNOUNCEMENTS_PER_USER) {
      return NextResponse.json(
        { error: `Limite de ${MAX_ACTIVE_ANNOUNCEMENTS_PER_USER} annonces atteinte` },
        { status: 429 }
      );
    }

    // 6. Validation Zod 4
    const json = await req.json().catch(() => null);
    if (!json || typeof json !== "object") {
      return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
    }

    const parsed = createAnnouncementSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Données invalides",
          details: z.treeifyError(parsed.error), // ✅ API Zod 4
        },
        { status: 400 }
      );
    }
    const data = parsed.data;

    // 7. Vérifier les référentiels
    const [jobType, region] = await Promise.all([
      prisma.jobType.findUnique({ where: { id: data.jobTypeId } }),
      prisma.region.findUnique({ where: { id: data.regionId } }),
    ]);
    if (!jobType) {
      return NextResponse.json({ error: "Poste introuvable" }, { status: 400 });
    }
    if (!region) {
      return NextResponse.json({ error: "Localisation introuvable" }, { status: 400 });
    }

    // 8. Type calculé serveur
    const type: ListingType =
      user.accountType === "PROVIDER" ? "PROFILE" : "OFFER";

    // 9. Création
    const announcement = await prisma.announcement.create({
      data: {
        type,
        title: data.title,
        description: data.description ?? null,
        jobTypeId: data.jobTypeId,
        regionId: data.regionId,
        salaryMin: data.salaryMin ?? null,
        salaryPeriod: data.salaryPeriod ?? "MOIS",
        city: data.city || region.name,
        workArrangement: data.workArrangement ?? null,
        shift: data.shift ?? null,
        contractDuration: data.contractDuration ?? null,
        workDays: data.workDays ?? [],
        workStartTime: data.workStartTime ?? null,
        workEndTime: data.workEndTime ?? null,
        experienceYearsRequired: data.experienceYearsRequired ?? null,
        isUrgent: data.isUrgent ?? false,
        contactPhone: data.contactPhone ?? null,
        contactWhatsapp: data.contactWhatsapp ?? null,
        language: "fr",
        userId: user.id,
        isUserGenerated: true,
        postedAt: new Date(),
      },
      select: {
        id: true,
        type: true,
        
        title: true,
        description: true,
        salaryMin: true,
        salaryPeriod: true,
        city: true,
        createdAt: true,
        jobType: { select: { id: true, name: true, slug: true } },
        region: { select: { id: true, name: true, slug: true } },
      },
    });

    return NextResponse.json({ announcement }, { status: 201 });
  } catch (error) {
    console.error("Erreur POST announcement:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}