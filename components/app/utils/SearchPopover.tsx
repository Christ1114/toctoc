"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { 
  MagnifyingGlassIcon, 
  ClockCounterClockwiseIcon, 
  XIcon,
  TrashIcon 
} from "@phosphor-icons/react";
import Popover from "../utils/Popover";
import { orbitron } from "@/fonts/font";
import { useTranslations, useLocale } from 'next-intl';

type SearchHistory = {
  id: string;
  query: string;
  createdAt: string;
};

type SearchResult = {
  id: string;
  [key: string]: any;
};

type SearchApiResponse = {
  results: SearchResult[];
  total: number;
  query: string;
  searchType: string;
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
};

export default function SearchPopover({ open, onClose, onSearch }: SearchPopoverProps) {
  const t = useTranslations('SearchPopover');
  const locale = useLocale();
  const isRTL = locale === 'ar';
  
  const [query, setQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<SearchHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- États pour la recherche en direct ---
  const [searchData, setSearchData] = useState<SearchApiResponse | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const loadSearches = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/user/searches");
      
      if (!response.ok) {
        throw new Error(t('errors.loadFailed'));
      }
      
      const data = await response.json();
      setRecentSearches(data.searches || []);
    } catch (err) {
      console.error("Erreur:", err);
      setError(t('errors.loadFailed'));
      setRecentSearches([]);
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  const saveSearch = async (searchQuery: string) => {
    try {
      const response = await fetch("/api/user/searches", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: searchQuery }),
      });
      
      if (!response.ok) {
        throw new Error(t('errors.saveFailed'));
      }
      await loadSearches();
    } catch (error) {
      console.error("Erreur lors de la sauvegarde de la recherche:", error);
    }
  };

  const deleteSearch = async (id: string) => {
    try {
      const response = await fetch(`/api/user/searches/${id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error(t('errors.deleteFailed'));
      }
      setRecentSearches(prev => prev.filter(search => search.id !== id));
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
    }
  };

  const clearAllSearches = async () => {
    try {
      const response = await fetch("/api/user/searches", {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error(t('errors.clearFailed'));
      }
      
      setRecentSearches([]);
    } catch (error) {
      console.error("Erreur lors de la suppression de l'historique:", error);
    }
  };

  // --- Appel à /api/search ---
  const runSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchData(null);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&limit=8&page=1`);
      if (!res.ok) throw new Error("Erreur lors de la recherche");
      const json: SearchApiResponse = await res.json();
      setSearchData(json);
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : "Erreur lors de la recherche");
      setSearchData(null);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // --- Debounce sur la saisie ---
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setSearchData(null);
      return;
    }

    debounceRef.current = setTimeout(() => {
      runSearch(query);
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, runSearch]);

  useEffect(() => {
    if (open) {
      loadSearches();
      setQuery("");
      setSearchData(null);
    }
  }, [open, loadSearches]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) return;
    
    const finalQuery = query.trim();
    onSearch(finalQuery);
    await saveSearch(finalQuery);
    // onClose() retiré pour laisser voir les résultats
  };

  const handlePick = async (item: string) => {
    setQuery(item);
    onSearch(item);
    await saveSearch(item);
    // onClose() retiré pour laisser voir les résultats
  };

  return (
    <Popover open={open} onClose={onClose} title={t('title')}>
      <div dir={isRTL ? 'rtl' : 'ltr'} className="w-full max-h-[80vh] sm:max-h-[70vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4 px-2 sm:px-0">
          <h2 className={`text-sm sm:text-base font-medium text-gray-900 dark:text-white/90 ${isRTL ? '' : orbitron.className}`}>
            {t('title')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 dark:text-white/50 dark:hover:text-white/90 cursor-pointer p-1 -mr-1 sm:p-0 sm:mr-0"
            aria-label={t('close')}
          >
            <XIcon size={18} className="sm:w-5 sm:h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={`relative mb-4 px-2 sm:px-0 ${isRTL ? '' : orbitron.className}`}>
          <MagnifyingGlassIcon 
            size={16} 
            className={`absolute top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/40 pointer-events-none ${
              isRTL ? 'right-3 sm:right-3' : 'left-3 sm:left-3'
            }`}
          />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('placeholder')}
            className={`w-full h-10 sm:h-11 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 text-sm sm:text-base text-gray-900 dark:text-white/90 placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-[#432dd7]/60 transition-colors ${
              isRTL ? 'pr-9 pl-3 text-right' : 'pl-9 pr-3 text-left'
            }`}
          />
        </form>

        {/* --- Résultats de recherche en direct (dès 2 caractères) --- */}
        {query.trim().length >= 2 && (
          <div className="mb-4 px-2 sm:px-0">
            {isSearching && (
              <div className="flex items-center justify-center py-6 sm:py-8">
                <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-gray-300 dark:border-white/30" />
              </div>
            )}

            {searchError && (
              <p className="text-sm text-red-500 dark:text-red-400/70 px-2 py-2">{searchError}</p>
            )}

            {!isSearching && searchData && searchData.results.length === 0 && (
              <div className="text-center py-6 sm:py-8">
                <p className="text-sm text-gray-500 dark:text-white/40">Aucun résultat</p>
                <p className="text-xs text-gray-400 dark:text-white/30 mt-1">
                  Essayez avec d&apos;autres mots-clés
                </p>
              </div>
            )}

            {!isSearching && searchData && searchData.results.length > 0 && (
              <ul className="flex flex-col gap-1 max-h-48 sm:max-h-64 overflow-y-auto">
                {searchData.results.map((item) => (
                  <li key={item.id}>
                    <button
                      onClick={() => {
                        // TODO: brancher la navigation vers le profil/l'annonce
                        console.log("Résultat sélectionné :", item);
                      }}
                      className="w-full text-left px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg text-sm text-gray-700 dark:text-white/80 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white/95 cursor-pointer transition-colors"
                    >
                      {searchData.searchType === "CLIENT" ? (
                        <div>
                          <p className="font-medium truncate">{item.name}</p>
                          <p className="text-xs text-gray-500 dark:text-white/40 truncate">{item.providerType}</p>
                        </div>
                      ) : (
                        <div>
                          <p className="font-medium truncate">{item.title}</p>
                          <p className="text-xs text-gray-500 dark:text-white/40 truncate">
                            {item.jobType?.name} · {item.city}
                          </p>
                        </div>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* --- Historique (affiché seulement si pas de recherche en cours) --- */}
        {query.trim().length < 2 && (
          <div className="px-2 sm:px-0">
            <div className="flex items-center justify-between mb-2">
              <p className={`text-xs sm:text-sm text-gray-500 dark:text-white/40 ${isRTL ? '' : orbitron.className}`}>
                {t('recentSearches')}
              </p>
              {recentSearches.length > 0 && !isLoading && (
                <button
                  onClick={clearAllSearches}
                  className="text-xs text-gray-400 hover:text-gray-700 dark:text-white/30 dark:hover:text-white/60 cursor-pointer transition-colors"
                >
                  {t('clearAll')}
                </button>
              )}
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-6 sm:py-8">
                <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-gray-300 dark:border-white/30" />
              </div>
            ) : error ? (
              <p className="text-sm text-red-500 dark:text-red-400/70 px-2 py-3">
                {error}
              </p>
            ) : recentSearches.length === 0 ? (
              <div className="text-center py-8 sm:py-10">
                <ClockCounterClockwiseIcon 
                  size={32} 
                  className="mx-auto mb-2 text-gray-300 dark:text-white/20" 
                />
                <p className="text-sm text-gray-500 dark:text-white/40">
                  {t('noSearches')}
                </p>
                <p className="text-xs text-gray-400 dark:text-white/30 mt-1 px-4">
                  {t('noSearchesHint')}
                </p>
              </div>
            ) : (
              <ul className="flex flex-col">
                {recentSearches.map((item) => (
                  <li key={item.id} className="group relative">
                    <button
                      onClick={() => handlePick(item.query)}
                      className={`w-full flex items-center gap-2 px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg text-sm text-gray-600 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white/90 cursor-pointer transition-colors ${
                        isRTL ? 'text-right flex-row-reverse' : 'text-left'
                      } ${isRTL ? '' : orbitron.className}`}
                    >
                      <ClockCounterClockwiseIcon 
                        size={16} 
                        className="text-gray-400 dark:text-white/30 shrink-0" 
                      />
                      <span className="flex-1 truncate">{item.query}</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSearch(item.id);
                      }}
                      className={`absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 focus:opacity-100 text-gray-400 hover:text-gray-700 dark:text-white/30 dark:hover:text-white/60 cursor-pointer transition-all p-1 ${
                        isRTL ? 'left-1 sm:left-2' : 'right-1 sm:right-2'
                      }`}
                      aria-label={`${t('deleteSearch')} ${item.query}`}
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