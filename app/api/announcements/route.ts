import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const limit = Math.min(Number(params.get("limit") ?? 30), 50);

  const announcements = await prisma.announcement.findMany({
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
      jobType: {
        select: {
          name: true,
          slug: true,
          category: true,
        },
      },
      region: {
        select: {
          name: true,
          slug: true,
          latitude: true,
          longitude: true,
        },
      },
      // ❌ "source" retiré entièrement : baseUrl, active, lastScraped
      //     n'ont aucune utilité côté client et exposent ton infra de scraping
    },
    orderBy: [{ isFeatured: "desc" }, { postedAt: "desc" }],
    take: limit,
  });

  return NextResponse.json({ announcements });
}