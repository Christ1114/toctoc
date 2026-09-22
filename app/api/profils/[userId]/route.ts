

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/app/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { userId } = await params;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      image: true,
      bio: true,
      accountType: true,
      clientType: true,
      companyName: true,
      rccmNumber: true,
      providerType: true,
      hourlyRate: true,
      currency: true,
      createdAt: true,
      website: true,
      instagram: true,
      facebook: true,
      tiktok: true,
      linkedin: true,
      youtube: true,
      twitter: true,
      // ⚠️ email et phone volontairement exclus : pas exposés publiquement,
      // le contact passe par le flux de réservation de la plateforme.
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  }

  const isProvider = user.accountType === "PROVIDER";

  const [reviewsCount, ratingAgg, bookingsCount] = await Promise.all([
    prisma.review.count({ where: { receiverId: userId } }),
    prisma.review.aggregate({
      where: { receiverId: userId },
      _avg: { rating: true },
    }),
    isProvider
      ? prisma.booking.count({ where: { providerId: userId, status: "COMPLETED" } })
      : Promise.resolve(0),
  ]);

  return NextResponse.json({
    user,
    stats: {
      reviewsCount,
      averageRating: ratingAgg._avg.rating ?? null,
      bookingsCount,
    },
  });
}