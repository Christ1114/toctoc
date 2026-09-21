"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  MagnifyingGlassIcon,
  UserIcon,
  MapPinIcon,
  SparkleIcon,
} from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { orbitron } from "@/fonts/font";
import { useSession } from "@/app/context/SessionContext";
import ProfilePopover from "../utils/profilsPopover";

export type CityResult = {
  id: string;
  name: string;
  slug: string;
  latitude: number | null;
  longitude: number | null;
  count: number;
  hasOffers: boolean;
};

type TopToolbarProps = {
  onOpenAiSearch: () => void;
  onSelectCity: (city: CityResult) => void;
  searchMessage?: string | null;
};

type UserAvatar = {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  accountType?: string | null;
};

export default function TopToolbar({
  onOpenAiSearch,
  onSelectCity,
  searchMessage,
}: TopToolbarProps) {
  const t = useTranslations("TopToolbar");
  const [profileOpen, setProfileOpen] = useState(false);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CityResult[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const { user: sessionUser } = useSession();
  const user: UserAvatar | null = sessionUser
    ? {
        id: (sessionUser as any).id,
        name: sessionUser.name,
        email: sessionUser.email,
        image: sessionUser.image,
        accountType: (sessionUser as any).accountType,
      }
    : null;

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setDropdownOpen(false);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/regions/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.results ?? []);
      setDropdownOpen(true);
    } catch (err) {
      console.error("Erreur recherche ville:", err);
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleInputChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(value), 300);
  };

  const handleSelect = (city: CityResult) => {
    setQuery(city.name);
    setDropdownOpen(false);
    onSelectCity(city);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
    
    
      <div className="absolute top-2 left-2 right-2 z-10 flex items-center gap-1.5
                      sm:top-3 sm:left-3 sm:right-3 sm:gap-2
                      lg:top-4 lg:left-4 lg:right-4 lg:px-20">
        <div
          ref={wrapperRef}
          className="relative flex-1 min-w-0
                     sm:max-w-sm
                     md:max-w-md
                     lg:max-w-lg lg:mx-auto"
        >
          <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm border border-white/10 rounded-lg
                          px-2.5 h-9
                          sm:px-3 sm:h-10">
            <MagnifyingGlassIcon
              size={16}
              className="text-white/40 shrink-0"
            />
            <input
              value={query}
              onChange={(e) => handleInputChange(e.target.value)}
              onFocus={() => results.length > 0 && setDropdownOpen(true)}
              placeholder={t("quickSearchPlaceholder")}
              className={`flex-1 bg-transparent text-white/90 placeholder:text-white/30 focus:outline-none min-w-0
                          text-xs sm:text-sm ${orbitron.className}`}
            />
          </div>

          {dropdownOpen && (
            <div className="absolute top-full mt-1 w-full bg-black/90 backdrop-blur-sm border border-white/10 rounded-lg overflow-hidden shadow-xl overflow-y-auto
                            max-h-56 sm:max-h-64 lg:max-h-80">
              {searching ? (
                <div className={`px-3 py-3 text-xs text-white/40 ${orbitron.className}`}>
                  {t("searching")}
                </div>
              ) : results.length === 0 ? (
                <div className={`px-3 py-3 text-xs text-white/40 ${orbitron.className}`}>
                  {t("noCityFound")}
                </div>
              ) : (
                results.map((city) => (
                  <button
                    key={city.id}
                    onClick={() => handleSelect(city)}
                    className="w-full flex items-center justify-between gap-2 px-3 text-left hover:bg-white/10 cursor-pointer transition-colors
                               py-2 sm:py-2.5"
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <MapPinIcon
                        size={14}
                        className="text-white/40 shrink-0"
                      />
                      <span
                        className={`text-white/90 truncate text-xs sm:text-sm ${orbitron.className}`}
                      >
                        {city.name}
                      </span>
                    </span>
                    <span
                      className={`shrink-0 text-[10px] sm:text-[11px] ${orbitron.className} ${
                        city.hasOffers ? "text-[#8b7ff5]" : "text-white/30"
                      }`}
                    >
                      {city.hasOffers
                        ? t("offersCount", { count: city.count })
                        : t("noOffers")}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}

          {searchMessage && !dropdownOpen && (
            <div className="absolute top-full mt-1 w-full bg-black/80 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-2">
              <p className={`text-[11px] sm:text-xs text-white/60 ${orbitron.className}`}>
                {searchMessage}
              </p>
            </div>
          )}
        </div>

       
        <button
          onClick={onOpenAiSearch}
          aria-label={t("searchByAi")}
          className={`flex items-center justify-center gap-2 rounded-lg bg-[#432dd7] hover:bg-[#432dd7]/90 text-white cursor-pointer transition-colors shrink-0
                      h-9 w-9
                      sm:h-10 sm:w-10
                      lg:w-auto lg:px-3 lg:h-10
                      text-xs sm:text-sm ${orbitron.className}`}
        >
          <SparkleIcon size={16} weight="bold" className="lg:hidden shrink-0" />
          <span className="hidden lg:inline">{t("searchByAi")}</span>
        </button>

        {/* Bouton profil — même taille que le bouton IA sur chaque breakpoint */}
        <button
          onClick={() => setProfileOpen(true)}
          aria-label={t("profile")}
          className="shrink-0  rounded-full overflow-hidden border border-white/10 bg-black/60 backdrop-blur-sm flex items-center justify-center cursor-pointer hover:border-[#432dd7]/60 transition-colors
                     h-9 w-9
                     sm:h-10 sm:w-10"
        >
          {user?.image ? (
            <img
              src={user.image}
              alt={user.name || "Avatar"}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className={`text-xs font-semibold text-white/80 ${orbitron.className}`}>
              {user?.name ? (
                user.name.charAt(0).toUpperCase()
              ) : (
                <UserIcon size={16} className="text-white/50" />
              )}
            </span>
          )}
        </button>
      </div>

      <ProfilePopover
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        user={user}
      />
    </>
  );
}