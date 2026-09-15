import { prisma } from "@/lib/prisma";
import type { NotificationType } from "@/generated/prisma/enums";

export async function createNotification(params: {
  userId: string;
  type: NotificationType;
  data?: Record<string, unknown>;
}) {
  return prisma.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      data: (params.data ?? undefined) as any,
    },
  });
}