import type { Prisma } from "@/generated/prisma/client";

type User = Prisma.UserGetPayload<{}>;


export default async function AgencyDashboard({ user }: { user: User }) {
  return (
    <div>
      <h1>Dashboard Agence</h1>
      <p>Bienvenue {user.name}</p>
    </div>
  );
}