import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const limit = Math.min(Number(params.get("limit") ?? 30), 50);
  
  const profiles = await prisma.announcement.findMany({
    where: {
      type: "PROFILE",
    },
    include: {
      jobType: true,
      region: true,
      source: true,
    },
    orderBy: [{ isFeatured: "desc" }, { postedAt: "desc" }],
    take: limit,
  });

  return NextResponse.json({ profiles });
}