import type { User } from "@/app/lib/auth-client";




export default async function AgencyDashboard({ user }: { user: User }) {
  return (
    <div>
      <h1>Dashboard Agence</h1>
      <p>Bienvenue {user.name}</p>
    </div>
  );
}