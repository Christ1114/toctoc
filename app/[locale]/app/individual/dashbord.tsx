import type { User } from "@/app/lib/auth-client";

export default async function IndividualDashboard({ user }: { user: User }) {
  return (
    <div>
      <h1>Dashboard Particulier</h1>
      <p>Bienvenue {user.name}</p>
    </div>
  );
}