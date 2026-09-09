"use client";

import type { User } from "@/app/lib/auth-client";

interface IndividualDashboardProps {
  user: User;
}

export default function IndividualDashboard({ user }: IndividualDashboardProps) {
  return (
    <div>
      <h1>Dashboard Individuel</h1>
      <p>Bienvenue {user.name}</p>
    </div>
  );
}