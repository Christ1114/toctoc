"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession, type User } from "@/app/lib/auth-client";
import Appclient from "@/components/app/appClient"; 

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const { session } = await getSession();

      if (! session?.user) {
        router.push("/app/profile");
        return;
      }

      setUser(session.user as unknown as User);
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

  return <Appclient user={user as User }/>;
}