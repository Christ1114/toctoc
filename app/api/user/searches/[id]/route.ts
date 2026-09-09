
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/app/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProviderType, type Prisma } from "@/generated/prisma/client";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q")?.trim();

    const rawLimit = parseInt(searchParams.get("limit") || "5", 10);
    const rawPage = parseInt(searchParams.get("page") || "1", 10);

    const limit = Number.isNaN(rawLimit) ? 5 : Math.min(Math.max(rawLimit, 1), 50);
    const page = Number.isNaN(rawPage) ? 1 : Math.max(rawPage, 1);
    const skip = (page - 1) * limit;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        accountType: true,
        clientType: true,
        providerType: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    if (!query || query.length < 2) {
      return NextResponse.json({
        results: [],
        total: 0,
        query: query || "",
        searchType: user.accountType,
        message: "La recherche doit contenir au moins 2 caractères",
      });
    }

    let results: unknown[] = [];
    let total = 0;
    const searchType = user.accountType;

   
    if (user.accountType === "CLIENT") {
      
      const matchingProviderTypes = Object.values(ProviderType).filter((type) =>
        type.toLowerCase().includes(query.toLowerCase())
      );

      const where: Prisma.UserWhereInput = {
        accountType: "PROVIDER",
        isActive: true,
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { bio: { contains: query, mode: "insensitive" } },
          { lastKnownRegion: { contains: query, mode: "insensitive" } },
          ...(matchingProviderTypes.length > 0
            ? [{ providerType: { in: matchingProviderTypes } }]
            : []),
        ],
      };

      const [providers, count] = await Promise.all([
        prisma.user.findMany({
          where,
          take: limit,
          skip,
          orderBy: [
            { verificationLevel: "desc" },
            { isActive: "desc" },
            { createdAt: "desc" },
          ],
          select: {
            id: true,
            name: true,
            image: true,
            bio: true,
            providerType: true,
            hourlyRate: true,
            currency: true,
            verificationStatus: true,
            verificationLevel: true,
            lastKnownRegion: true,
            isActive: true,
            createdAt: true,
          },
        }),
        prisma.user.count({ where }),
      ]);

      results = providers;
      total = count;
    }

   
    else if (user.accountType === "PROVIDER") {
      const where: Prisma.AnnouncementWhereInput = {
        type: "OFFER",
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
          { city: { contains: query, mode: "insensitive" } },
          { location: { contains: query, mode: "insensitive" } },
          {
            jobType: {
              name: { contains: query, mode: "insensitive" },
            },
          },
          {
            jobType: {
              category: { contains: query, mode: "insensitive" },
            },
          },
          {
            region: {
              name: { contains: query, mode: "insensitive" },
            },
          },
        ],
      };

      const [announcements, count] = await Promise.all([
        prisma.announcement.findMany({
          where,
          take: limit,
          skip,
          orderBy: [
            { isFeatured: "desc" },
            { isUrgent: "desc" },
            { postedAt: "desc" },
          ],
          select: {
            id: true,
            type: true,
            title: true,
            description: true,
            city: true,
            location: true,
            isUrgent: true,
            isVerified: true,
            isFeatured: true,
            postedAt: true,
            salaryMin: true,
            salaryMax: true,
            salaryPeriod: true,
            salaryRaw: true,
            workArrangement: true,
            shift: true,
            contractDuration: true,
            workDays: true,
            workStartTime: true,
            workEndTime: true,
            experienceYearsRequired: true,
            transportAllowance: true,
            createdAt: true,
            jobType: {
              select: {
                id: true,
                name: true,
                slug: true,
                category: true,
              },
            },
            region: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        }),
        prisma.announcement.count({ where }),
      ]);

      results = announcements;
      total = count;
    }

    // === RECHERCHE POUR LES ADMIN ===
    else if (user.accountType === "ADMIN") {
      const announcementWhere: Prisma.AnnouncementWhereInput = {
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
          { city: { contains: query, mode: "insensitive" } },
          {
            jobType: {
              name: { contains: query, mode: "insensitive" },
            },
          },
        ],
      };

      const userWhere: Prisma.UserWhereInput = {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
          { companyName: { contains: query, mode: "insensitive" } },
        ],
      };

      const [announcements, providers, announcementCount, providerCount] = await Promise.all([
        prisma.announcement.findMany({
          where: announcementWhere,
          take: Math.ceil(limit / 2),
          orderBy: { postedAt: "desc" },
          select: {
            id: true,
            type: true,
            title: true,
            description: true,
            city: true,
            isUrgent: true,
            isVerified: true,
            postedAt: true,
            jobType: {
              select: { id: true, name: true },
            },
          },
        }),
        prisma.user.findMany({
          where: userWhere,
          take: Math.ceil(limit / 2),
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            name: true,
            email: true,
            accountType: true,
            providerType: true,
            companyName: true,
            isActive: true,
          },
        }),
        prisma.announcement.count({ where: announcementWhere }),
        prisma.user.count({ where: userWhere }),
      ]);

      results = [
        ...announcements.map((a) => ({ ...a, resultType: "announcement" as const })),
        ...providers.map((p) => ({ ...p, resultType: "user" as const })),
      ];
      total = announcementCount + providerCount;
    }

    const totalPages = Math.ceil(total / limit);
    const hasMore = page < totalPages;

    return NextResponse.json({
      results,
      total,
      query: query || "",
      searchType,
      pagination: {
        page,
        limit,
        totalPages,
        hasMore,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la recherche:", error);
    return NextResponse.json(
      {
        error: "Erreur serveur",
        results: [],
        total: 0,
      },
      { status: 500 }
    );
  }
}