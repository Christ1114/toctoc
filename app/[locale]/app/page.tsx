"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession, type User } from "@/app/lib/auth-client";
import AgencyDashboard from "./agency/dashbord";
import IndividualDashboard from "./individual/dashbord";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const { session } = await getSession();

      if (!session?.user) {
        router.push("/login");
        return;
      }

      setUser(session.user as unknown as User); // 👈 Double cast
      setLoading(false);
    };

    loadUser();
  }, [router]);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center h-screen bg-white dark:bg-zinc-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#432dd7]" />
      </div>
    );
  }

  if (user.clientType === "AGENCY") {
    return <AgencyDashboard user={user} />;
  }

  return <IndividualDashboard user={user} />;
}