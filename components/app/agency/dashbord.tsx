"use client";

import type { User } from "@/app/lib/auth-client";
import { useTranslations } from "next-intl";
type AgencyDashboardProps = {
  user: User;
};

export default function AgencyDashboard({ user }: AgencyDashboardProps) {
  const t = useTranslations("AgencyDashboard");

  return (
    <div className="w-full h-full flex flex-col p-6">
      <h1 className="text-xl font-semibold text-black dark:text-white/90 mb-1">
        {t("welcome", { name: user.name || "" })}
      </h1>
      <p className="text-sm text-black/50 dark:text-white/50 mb-6">
        {t("subtitle")}
      </p>

      {/* TODO: contenu spécifique agence (gestion multi-profils, statistiques, etc.) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5">
          <p className="text-xs text-black/50 dark:text-white/50 mb-1">{t("companyName")}</p>
          <p className="text-sm font-medium text-black dark:text-white/90">
            {user.companyName || "-"}
          </p>
        </div>

        <div className="p-4 rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5">
          <p className="text-xs text-black/50 dark:text-white/50 mb-1">{t("rccm")}</p>
          <p className="text-sm font-medium text-black dark:text-white/90">
            {user.rccmNumber || "-"}
          </p>
        </div>

        <div className="p-4 rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5">
          <p className="text-xs text-black/50 dark:text-white/50 mb-1">{t("verificationStatus")}</p>
          <p className="text-sm font-medium text-black dark:text-white/90">
            {user.verificationStatus || "-"}
          </p>
        </div>
      </div>
    </div>
  );
}