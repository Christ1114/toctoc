"use client";

import type { User } from "@/app/lib/auth-client";
import { useTranslations } from "next-intl";
import NearbyMap from "@/components/app/map/NearbyMap";

type IndividualDashboardProps = {
  user: User;
};

export default function IndividualDashboard({ user }: IndividualDashboardProps) {
  const t = useTranslations("IndividualDashboard");

  return (
    <div className="w-full h-full flex flex-col">
      <div className="px-6 pt-6 pb-2">
        <h1 className="text-xl font-semibold text-black dark:text-white/90 mb-1">
          {t("welcome", { name: user.name || "" })}
        </h1>
        <p className="text-sm text-black/50 dark:text-white/50">
          {t("subtitle")}
        </p>
      </div>

      <div className="flex-1 px-6 pb-6">
        <NearbyMap />
      </div>
    </div>
  );
}