"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSession } from "@/app/context/SessionContext";
import Appclient from "@/components/app/appClient";

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading } = useSession();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center h-screen bg-white dark:bg-zinc-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#432dd7]" />
      </div>
    );
  }

  return <Appclient user={user} />;
}