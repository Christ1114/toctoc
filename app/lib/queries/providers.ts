
import { prisma } from "@/lib/prisma";

export async function getProviderById(id: string) {
  const [provider, reviewStats] = await Promise.all([
    prisma.user.findFirst({
      where: {
        id,
        accountType: "PROVIDER",
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        image: true,
        bio: true,
        accountType: true,
        providerType: true,
        hourlyRate: true,
        currency: true,
        verificationStatus: true,
        verificationLevel: true,
        lastKnownRegion: true,
        lastLatitude: true,
        lastLongitude: true,
        lastLocationUpdatedAt: true,
        createdAt: true,
        website: true,
        instagram: true,
        facebook: true,
        tiktok: true,
        linkedin: true,
        youtube: true,
        twitter: true,
        _count: {
          select: { bookingsAsProvider: true },
        },
      },
    }),
    prisma.review.aggregate({
      where: { receiverId: id },
      _avg: { rating: true },
      _count: { _all: true },
    }),
  ]);

  if (!provider) return null;

  const { _count, hourlyRate, ...rest } = provider;

  return {
    ...rest,
    hourlyRate: hourlyRate ? Number(hourlyRate) : null,
    stats: {
      averageRating: reviewStats._avg.rating,
      reviewsCount: reviewStats._count._all,
      bookingsCount: _count.bookingsAsProvider,
    },
  };
}

export type PublicProvider = NonNullable<
  Awaited<ReturnType<typeof getProviderById>>
>;

export async function getProviderVideos(
  providerId: string,
  page: number = 0,
  pageSize: number = 20
) {
  const safePage = Math.max(0, page);
  const safeSize = Math.min(50, Math.max(1, pageSize));
  const skip = safePage * safeSize;

  const [videos, total] = await Promise.all([
    prisma.providerVideo.findMany({
      where: { providerId, isVisible: true },
      orderBy: [{ position: "asc" }, { createdAt: "desc" }],
      take: safeSize,
      skip,
      select: {
        id: true,
        url: true,
        platform: true,
        externalId: true,
        thumbnail: true,
        title: true,
        description: true,
        duration: true,
        position: true,
      },
    }),
    prisma.providerVideo.count({
      where: { providerId, isVisible: true },
    }),
  ]);

  return {
    videos,
    total,
    page: safePage,
    pageSize: safeSize,
    hasMore: skip + videos.length < total,
  };
}

export type ProviderVideoPublic = Awaited<
  ReturnType<typeof getProviderVideos>
>["videos"][number];