"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MagnifyingGlassIcon, UserIcon, MapPinIcon } from "@phosphor-icons/react";
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

export default function TopToolbar({ onOpenAiSearch, onSelectCity, searchMessage }: TopToolbarProps) {
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

  // Ferme le dropdown si on clique ailleurs
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
      {/* Barre principale : recherche centrée + bouton IA à droite */}
      <div className="absolute top-4 left-4 right-40 z-10 flex items-center gap-2">
        <div ref={wrapperRef} className="relative flex-1 max-w-md mx-auto">
          <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm border border-white/10 rounded-lg px-3 h-10">
            <MagnifyingGlassIcon size={16} className="text-white/40 shrink-0" />
            <input
              value={query}
              onChange={(e) => handleInputChange(e.target.value)}
              onFocus={() => results.length > 0 && setDropdownOpen(true)}
              placeholder={t("quickSearchPlaceholder")}
              className={`flex-1 bg-transparent text-sm text-white/90 placeholder:text-white/30 focus:outline-none min-w-0 ${orbitron.className}`}
            />
          </div>

          {/* Dropdown des résultats */}
          {dropdownOpen && (
            <div className="absolute top-full mt-1 w-full bg-black/90 backdrop-blur-sm border border-white/10 rounded-lg overflow-hidden shadow-xl max-h-64 overflow-y-auto">
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
                    className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left hover:bg-white/10 cursor-pointer transition-colors"
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <MapPinIcon size={14} className="text-white/40 shrink-0" />
                      <span className={`text-sm text-white/90 truncate ${orbitron.className}`}>
                        {city.name}
                      </span>
                    </span>
                    <span
                      className={`text-[11px] shrink-0 ${orbitron.className} ${
                        city.hasOffers ? "text-[#8b7ff5]" : "text-white/30"
                      }`}
                    >
                      {city.hasOffers ? t("offersCount", { count: city.count }) : t("noOffers")}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
          {searchMessage && !dropdownOpen && (
            <div className="absolute top-full mt-1 w-full bg-black/80 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-2">
              <p className={`text-xs text-white/60 ${orbitron.className}`}>{searchMessage}</p>
            </div>
          )}
        </div>

        <button
          onClick={onOpenAiSearch}
          className={`flex items-center gap-2 h-10 px-3 rounded-lg bg-[#432dd7] hover:bg-[#432dd7]/90 text-white text-sm cursor-pointer transition-colors shrink-0 ${orbitron.className}`}
        >
          <span className="hidden sm:inline">{t("searchByAi")}</span>
        </button>
      </div>
      <button
        onClick={() => setProfileOpen(true)}
        className="absolute top-4 right-15 z-10 h-10 w-10 shrink-0 rounded-full overflow-hidden border border-white/10 bg-black/60 backdrop-blur-sm flex items-center justify-center cursor-pointer hover:border-[#432dd7]/60 transition-colors"
        aria-label={t("profile")}
      >
        {user?.image ? (
          <img src={user.image} alt={user.name || "Avatar"} className="w-full h-full object-cover" />
        ) : (
          <span className={`text-xs font-semibold text-white/80 ${orbitron.className}`}>
            {user?.name ? user.name.charAt(0).toUpperCase() : <UserIcon size={16} className="text-white/50" />}
          </span>
        )}
      </button>

      <ProfilePopover open={profileOpen} onClose={() => setProfileOpen(false)} user={user} />
    </>
  );
}