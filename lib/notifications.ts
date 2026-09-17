// Emplacement: lib/notifications.ts

import { prisma } from "@/lib/prisma";
import type { NotificationType } from "@/generated/prisma/enums";

export async function createNotification(params: {
  userId: string;
  type: NotificationType;
  data?: Record<string, unknown>;
  link?: string;
  announcementId?: string;
  bookingId?: string;
}) {
  return prisma.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      data: (params.data ?? undefined) as any,
      link: params.link,
      announcementId: params.announcementId,
      bookingId: params.bookingId,
    },
  });
}

// Exemples d'utilisation, avec les vrais types de ton enum :
//
// await createNotification({
//   userId: provider.id,
//   type: "BOOKING_UPDATE",
//   data: { clientName: client.name },
//   link: `/app/bookings/${booking.id}`,
//   bookingId: booking.id,
// });
//
// await createNotification({
//   userId: user.id,
//   type: "PROFILE_VERIFIED",
// });