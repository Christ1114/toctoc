"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  MagnifyingGlassIcon,
  ClockCounterClockwiseIcon,
  XIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import Popover from "../utils/Popover";
import { orbitron } from "@/fonts/font";
import { useTranslations, useLocale } from "next-intl";

type SearchHistory = {
  id: string;
  query: string;
  createdAt: string;
};

type SearchResultType = "JOB" | "PROFILE";

type SearchResult = {
  id: string;
  resultType: SearchResultType;
  title?: string;
  city?: string;
  jobType?: { name: string };
  name?: string;
  providerType?: string;
  [key: string]: unknown;
};

type SearchApiResponse = {
  results: SearchResult[];
  total: number;
  query: string;
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  };
  message?: string;
  error?: string;
};

type SearchPopoverProps = {
  open: boolean;
  onClose: () => void;
  onSearch: (query: string) => void;
  userType?: string | null;
};

const DEBOUNCE_MS = 400;
const MIN_QUERY_LENGTH = 2;
const MAX_HISTORY_CLIENT = 10;

export default function SearchPopover({
  open,
  onClose,
  onSearch,
  userType,
}: SearchPopoverProps) {
  const t = useTranslations("SearchPopover");
  const locale = useLocale();
  const router = useRouter();
  const isRTL = locale === "ar";
  const isAgency = userType === "AGENCY";

  const [query, setQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<SearchHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchData, setSearchData] = useState<SearchApiResponse | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);

  // Refs : debounce, abort, cache, dernière requête sauvegardée, mounted
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const cacheRef = useRef<Map<string, SearchApiResponse>>(new Map());
  const lastSavedRef = useRef<{ q: string; at: number } | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  /* ─── Historique ─── */

  const loadSearches = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/user/searches");
      if (!res.ok) throw new Error("loadFailed");
      const data = await res.json();
      if (!mountedRef.current) return;
      setRecentSearches((data.searches || []).slice(0, MAX_HISTORY_CLIENT));
    } catch {
      if (!mountedRef.current) return;
      setError(t("errors.loadFailed"));
      setRecentSearches([]);
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, [t]);

  const saveSearch = useCallback(
    async (searchQuery: string) => {
      const normalized = searchQuery.trim();
      if (!normalized) return;

      // Anti-spam : ne pas re-poster la même requête dans les 3s
      const last = lastSavedRef.current;
      if (last && last.q === normalized && Date.now() - last.at < 3000) {
        return;
      }
      lastSavedRef.current = { q: normalized, at: Date.now() };

      try {
        const res = await fetch("/api/user/searches", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: normalized }),
        });
        if (!res.ok) throw new Error("saveFailed");
        if (mountedRef.current) await loadSearches();
      } catch {
        // Silencieux : l'historique n'est pas critique pour l'UX
      }
    },
    [loadSearches]
  );

  const deleteSearch = useCallback(async (id: string) => {
    // Optimistic update
    setRecentSearches((prev) => prev.filter((s) => s.id !== id));
    try {
      const res = await fetch(`/api/user/searches/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("deleteFailed");
    } catch {
      // Rollback si erreur : on recharge
      if (mountedRef.current) loadSearches();
    }
  }, [loadSearches]);

  const clearAllSearches = useCallback(async () => {
    const previous = recentSearches;
    setRecentSearches([]);
    try {
      const res = await fetch("/api/user/searches", { method: "DELETE" });
      if (!res.ok) throw new Error("clearFailed");
    } catch {
      if (mountedRef.current) setRecentSearches(previous);
    }
  }, [recentSearches]);

  /* ─── Live search avec cache + abort ─── */

  const runSearch = useCallback(async (searchQuery: string) => {
    const q = searchQuery.trim();
    if (q.length < MIN_QUERY_LENGTH) {
      setSearchData(null);
      setSearchError(null);
      return;
    }

    // Cache hit
    const cached = cacheRef.current.get(q);
    if (cached) {
      setSearchData(cached);
      setSearchError(null);
      return;
    }

    // Abort la requête précédente
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsSearching(true);
    setSearchError(null);

    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(q)}&limit=8&page=1`,
        { signal: controller.signal }
      );

      if (res.status === 429) {
        throw new Error("rateLimited");
      }
      if (!res.ok) throw new Error("searchFailed");

      const json: SearchApiResponse = await res.json();
      if (!mountedRef.current || controller.signal.aborted) return;

      // Cap du cache pour éviter la croissance infinie
      if (cacheRef.current.size > 30) cacheRef.current.clear();
      cacheRef.current.set(q, json);

      setSearchData(json);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      if (!mountedRef.current) return;
      setSearchError(
        err instanceof Error && err.message === "rateLimited"
          ? t("errors.rateLimited")
          : t("errors.searchFailed")
      );
      setSearchData(null);
    } finally {
      if (mountedRef.current && !controller.signal.aborted) {
        setIsSearching(false);
      }
    }
  }, [t]);

  /* ─── Debounce ─── */

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setSearchData(null);
      setActiveIndex(-1);
      return;
    }

    debounceRef.current = setTimeout(() => runSearch(query), DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, runSearch]);

  /* ─── Reset à l'ouverture ─── */

  useEffect(() => {
    if (!open) return;
    loadSearches();
    setQuery("");
    setSearchData(null);
    setSearchError(null);
    setActiveIndex(-1);
  }, [open, loadSearches]);

  /* ─── Navigation vers un résultat ─── */

  const navigateToResult = useCallback(
    (item: SearchResult) => {
      onClose();
      if (item.resultType === "JOB") {
        router.push(`/app/announcement/${item.id}`);
      } else {
        router.push(`/app/profile/${item.id}`);
      }
    },
    [onClose, router]
  );

  /* ─── Submit form ─── */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalQuery = query.trim();
    if (!finalQuery) return;

    onSearch(finalQuery);
    await saveSearch(finalQuery);
    onClose();
  };

  /* ─── Pick depuis l'historique ─── */

  const handlePick = useCallback(
    async (item: string) => {
      setQuery(item);
      onSearch(item);
      await saveSearch(item);
    },
    [onSearch, saveSearch]
  );

  /* ─── Navigation clavier ─── */

  const flatResults: SearchResult[] = searchData?.results ?? [];

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (flatResults.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % flatResults.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? flatResults.length - 1 : i - 1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      navigateToResult(flatResults[activeIndex]);
    }
  };

  /* ─── Filtres ─── */

  const jobResults = flatResults.filter((r) => r.resultType === "JOB");
  const profileResults = flatResults.filter((r) => r.resultType === "PROFILE");

  const renderResultItem = (item: SearchResult) => {
    const isActive = flatResults.indexOf(item) === activeIndex;
    return (
      <li key={item.id}>
        <button
          type="button"
          onClick={() => navigateToResult(item)}
          onMouseEnter={() => setActiveIndex(flatResults.indexOf(item))}
          className={`w-full text-left px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg text-sm transition-colors cursor-pointer ${
            isActive
              ? "bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white/95"
              : "text-gray-700 dark:text-white/80 hover:bg-gray-100 dark:hover:bg-white/5"
          } ${orbitron.className}`}
        >
          {item.resultType === "PROFILE" ? (
            <div>
              <p className={`font-medium truncate ${orbitron.className}`}>{item.name}</p>
              <p className={`text-xs text-gray-500 dark:text-white/40 truncate ${orbitron.className}`}>
                {item.providerType}
              </p>
            </div>
          ) : (
            <div>
              <p className={`font-medium truncate ${orbitron.className}`}>{item.title}</p>
              <p className={`text-xs text-gray-500 dark:text-white/40 truncate ${orbitron.className}`}>
                {item.jobType?.name} · {item.city}
              </p>
            </div>
          )}
        </button>
      </li>
    );
  };

  return (
    <Popover open={open} onClose={onClose} title={t("title")}>
      <div
        dir={isRTL ? "rtl" : "ltr"}
        className={`w-full max-h-[80vh] sm:max-h-[70vh] overflow-y-auto ${orbitron.className}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4 px-2 sm:px-0">
          <h2 className={`text-sm sm:text-base font-medium text-gray-900 dark:text-white/90 ${orbitron.className}`}>
            {t("title")}
          </h2>
          <button
            onClick={onClose}
            className={`text-gray-400 hover:text-gray-700 dark:text-white/50 dark:hover:text-white/90 cursor-pointer p-1 -mr-1 sm:p-0 sm:mr-0 ${orbitron.className}`}
            aria-label={t("close")}
          >
            <XIcon size={18} className="sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className={`relative mb-4 px-2 sm:px-0 ${orbitron.className}`}>
          <MagnifyingGlassIcon
            size={16}
            className={`absolute top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/40 pointer-events-none ${
              isRTL ? "right-3 sm:right-3" : "left-3 sm:left-3"
            }`}
          />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("placeholder")}
            aria-autocomplete="list"
            aria-controls="search-results"
            className={`w-full h-10 sm:h-11 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 text-sm sm:text-base text-gray-900 dark:text-white/90 placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-[#432dd7]/60 transition-colors ${
              isRTL ? "pr-9 pl-3 text-right" : "pl-9 pr-3 text-left"
            } ${orbitron.className}`}
          />
        </form>

        {/* Résultats live */}
        {query.trim().length >= MIN_QUERY_LENGTH && (
          <div id="search-results" className="mb-4 px-2 sm:px-0" role="listbox">
            {isSearching && (
              <div className="flex items-center justify-center py-6 sm:py-8">
                <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-gray-300 dark:border-white/30" />
              </div>
            )}

            {searchError && (
              <p className={`text-sm text-red-500 dark:text-red-400/70 px-2 py-2 ${orbitron.className}`}>
                {searchError}
              </p>
            )}

            {!isSearching && searchData && searchData.results.length === 0 && (
              <div className="text-center py-6 sm:py-8">
                <p className={`text-sm text-gray-500 dark:text-white/40 ${orbitron.className}`}>
                  {t("noResults")}
                </p>
                <p className={`text-xs text-gray-400 dark:text-white/30 mt-1 ${orbitron.className}`}>
                  {t("noResultsHint")}
                </p>
              </div>
            )}

            {!isSearching && searchData && searchData.results.length > 0 && (
              isAgency ? (
                <div className="flex flex-col gap-4">
                  {jobResults.length > 0 && (
                    <div>
                      <p className={`text-xs font-medium text-gray-400 dark:text-white/30 px-2 sm:px-3 mb-1 uppercase tracking-wide ${orbitron.className}`}>
                        {t("sections.jobs")}
                      </p>
                      <ul className="flex flex-col gap-1 max-h-40 overflow-y-auto">
                        {jobResults.map(renderResultItem)}
                      </ul>
                    </div>
                  )}
                  {profileResults.length > 0 && (
                    <div>
                      <p className={`text-xs font-medium text-gray-400 dark:text-white/30 px-2 sm:px-3 mb-1 uppercase tracking-wide ${orbitron.className}`}>
                        {t("sections.profiles")}
                      </p>
                      <ul className="flex flex-col gap-1 max-h-40 overflow-y-auto">
                        {profileResults.map(renderResultItem)}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <ul className="flex flex-col gap-1 max-h-48 sm:max-h-64 overflow-y-auto">
                  {jobResults.map(renderResultItem)}
                </ul>
              )
            )}
          </div>
        )}

        {/* Historique */}
        {query.trim().length < MIN_QUERY_LENGTH && (
          <div className="px-2 sm:px-0">
            <div className="flex items-center justify-between mb-2">
              <p className={`text-xs sm:text-sm text-gray-500 dark:text-white/40 ${orbitron.className}`}>
                {t("recentSearches")}
              </p>
              {recentSearches.length > 0 && !isLoading && (
                <button
                  onClick={clearAllSearches}
                  className={`text-xs text-gray-400 hover:text-gray-700 dark:text-white/30 dark:hover:text-white/60 cursor-pointer transition-colors ${orbitron.className}`}
                >
                  {t("clearAll")}
                </button>
              )}
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-6 sm:py-8">
                <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-gray-300 dark:border-white/30" />
              </div>
            ) : error ? (
              <p className={`text-sm text-red-500 dark:text-red-400/70 px-2 py-3 ${orbitron.className}`}>
                {error}
              </p>
            ) : recentSearches.length === 0 ? (
              <div className="text-center py-8 sm:py-10">
                <ClockCounterClockwiseIcon size={32} className="mx-auto mb-2 text-gray-300 dark:text-white/20" />
                <p className={`text-sm text-gray-500 dark:text-white/40 ${orbitron.className}`}>
                  {t("noSearches")}
                </p>
                <p className={`text-xs text-gray-400 dark:text-white/30 mt-1 px-4 ${orbitron.className}`}>
                  {t("noSearchesHint")}
                </p>
              </div>
            ) : (
              <ul className="flex flex-col">
                {recentSearches.map((item) => (
                  <li key={item.id} className="group relative">
                    <button
                      onClick={() => handlePick(item.query)}
                      className={`w-full flex items-center gap-2 px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg text-sm text-gray-600 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white/90 cursor-pointer transition-colors ${
                        isRTL ? "text-right flex-row-reverse" : "text-left"
                      } ${orbitron.className}`}
                    >
                      <ClockCounterClockwiseIcon size={16} className="text-gray-400 dark:text-white/30 shrink-0" />
                      <span className={`flex-1 truncate ${orbitron.className}`}>{item.query}</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSearch(item.id);
                      }}
                      className={`absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 focus:opacity-100 text-gray-400 hover:text-gray-700 dark:text-white/30 dark:hover:text-white/60 cursor-pointer transition-all p-1 ${
                        isRTL ? "left-1 sm:left-2" : "right-1 sm:right-2"
                      } ${orbitron.className}`}
                      aria-label={`${t("deleteSearch")} ${item.query}`}
                    >
                      <TrashIcon size={14} className="sm:w-4 sm:h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </Popover>
  );
}