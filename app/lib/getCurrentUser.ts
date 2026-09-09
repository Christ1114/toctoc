import { auth } from "@/app/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

type User = Prisma.UserGetPayload<{}>;


export async function getCurrentUser(): Promise<User | null> {
  if (process.env.NODE_ENV === "development" && process.env.MOCK_USER === "true") {
    return await prisma.user.findFirst({
      where: { clientType: "AGENCY" },
    });
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  return user;
}