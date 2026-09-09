"use client";

import type { User } from "@/app/lib/auth-client";

interface AgencyDashboardProps {
  user: User;
}

export default function AgencyDashboard({ user }: AgencyDashboardProps) {
  return (
    <div>
      <h1>Dashboard Agence</h1>
      <p>Bienvenue {user.name}</p>
    </div>
  );
}