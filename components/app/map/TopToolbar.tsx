"use client";

import { useEffect, useState } from "react";
import { MagnifyingGlassIcon, SparkleIcon, UserIcon } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { orbitron } from "@/fonts/font";
import { getSession } from "@/app/lib/auth-client";

type TopToolbarProps = {
  onOpenAiSearch: () => void;
  onOpenProfile?: () => void;
};

type UserAvatar = {
  name?: string | null;
  image?: string | null;
};

export default function TopToolbar({ onOpenAiSearch, onOpenProfile }: TopToolbarProps) {
  const t = useTranslations("TopToolbar");
  const [user, setUser] = useState<UserAvatar | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const { session } = await getSession();
      if (session?.user) {
        setUser({ name: session.user.name, image: session.user.image });
      }
    };
    loadUser();
  }, []);

  return (
    <>
      {/* Barre principale : recherche centrée + bouton IA à droite */}
      <div className="absolute top-4 left-4 right-40 z-10 flex items-center gap-2">
        <div className="flex-1 max-w-md mx-auto flex items-center gap-2 bg-black/60 backdrop-blur-sm border border-white/10 rounded-lg px-3 h-10">
          <MagnifyingGlassIcon size={16} className="text-white/40" />
          <input
            placeholder={t("quickSearchPlaceholder")}
            className={`flex-1 bg-transparent text-sm text-white/90 placeholder:text-white/30 focus:outline-none ${orbitron.className}`}
          />
        </div>

        <button
          onClick={onOpenAiSearch}
          className={`flex items-center gap-2 h-10 px-3 rounded-lg bg-[#432dd7] hover:bg-[#432dd7]/90 text-white text-sm cursor-pointer transition-colors shrink-0 ${orbitron.className}`}
        >
          <span className="hidden sm:inline">{t("searchByAi")}</span>
        </button>
      </div>

     
      <button
        onClick={onOpenProfile}
        className="absolute top-4 right-15 z-10 h-10 w-10 shrink-0 rounded-full overflow-hidden border border-white/10 bg-black/60 backdrop-blur-sm flex items-center justify-center cursor-pointer hover:border-[#432dd7]/60 transition-colors"
        aria-label={t("profile")}
      >
        {user?.image ? (
          <img src={user.image} alt={user.name || "Avatar"} className="w-full h-full object-cover" />
        ) : (
          <span className="text-xs font-semibold text-white/80">
            {user?.name ? user.name.charAt(0).toUpperCase() : <UserIcon size={16} className="text-white/50" />}
          </span>
        )}
      </button>
    </>
  );
}