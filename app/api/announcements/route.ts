import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const limit = Math.min(Number(params.get("limit") ?? 30), 50);
  const announcements = await prisma.announcement.findMany({
    include: {
      jobType: true,
      region: true,
      source: true,
    },
    orderBy: [{ isFeatured: "desc" }, { postedAt: "desc" }],
    take: limit,
  });

  return NextResponse.json({ announcements });
}