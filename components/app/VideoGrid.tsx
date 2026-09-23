"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { PlayIcon, XIcon, EyeIcon } from "@phosphor-icons/react";
import { orbitron } from "@/fonts/font";

export type ProviderVideo = {
  id: string;
  thumbnailUrl: string | null;
  videoUrl: string;
  viewCount?: number | null;
  createdAt?: string;
};

const PAGE_SIZE = 12;

/* ═══════════════════════════════════════════════════════════
   Props
   - emptyText      : texte à afficher quand il n'y a aucune vidéo
                      (fallback : t("videos.empty"))
   - emptyClassName : classe CSS additionnelle sur le <p> de l'empty
                      (permet d'appliquer orbitron.className depuis le parent)
   ═══════════════════════════════════════════════════════════ */
type VideoGridProps = {
  providerId: string;
  emptyText?: string;
  emptyClassName?: string;
};

export default function VideoGrid({
  providerId,
  emptyText,
  emptyClassName,
}: VideoGridProps) {
  const t = useTranslations("ProfilePage");
  const [videos, setVideos] = useState<ProviderVideo[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [activeVideo, setActiveVideo] = useState<ProviderVideo | null>(null);

  const loadPage = useCallback(
    async (pageToLoad: number, replace: boolean) => {
      if (pageToLoad === 0) setLoading(true);
      else setLoadingMore(true);
      setError(false);

      try {
        const res = await fetch(
          `/api/providers/${providerId}/videos?page=${pageToLoad}&pageSize=${PAGE_SIZE}`
        );
        if (res.status === 429) {
          setError(true);
          return;
        }
        if (!res.ok) throw new Error("Erreur chargement vidéos");

        const data = await res.json();
        const newVideos: ProviderVideo[] = data.videos ?? [];

        setVideos((prev) => (replace ? newVideos : [...prev, ...newVideos]));
        setHasMore(
          typeof data.hasMore === "boolean"
            ? data.hasMore
            : newVideos.length === PAGE_SIZE
        );
      } catch (err) {
        console.error("Erreur chargement vidéos prestataire:", err);
        setError(true);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [providerId]
  );

  useEffect(() => {
    setVideos([]);
    setPage(0);
    setHasMore(true);
    loadPage(0, true);
  }, [providerId, loadPage]);

  const handleLoadMore = () => {
    const next = page + 1;
    setPage(next);
    loadPage(next, false);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-1 sm:gap-2">
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className="aspect-9/16 rounded-md bg-gray-100 dark:bg-white/5 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (error && videos.length === 0) {
    return (
      <div className="py-10 flex flex-col items-center text-center">
        <p
          className={`text-sm text-gray-400 dark:text-white/40 ${orbitron.className}`}
        >
          {t("videos.loadError")}
        </p>
        <button
          onClick={() => loadPage(0, true)}
          className={`mt-3 text-xs text-[#432dd7] hover:underline cursor-pointer ${orbitron.className}`}
        >
          {t("videos.retry")}
        </button>
      </div>
    );
  }

  // ─── Empty state (accepte une surcharge depuis le parent) ───
  if (videos.length === 0) {
    return (
      <div className="py-10 flex flex-col items-center text-center">
        <PlayIcon size={32} className="text-gray-300 dark:text-white/20 mb-2" />
        <p
          className={`text-sm text-gray-400 dark:text-white/40 ${emptyClassName ?? orbitron.className}`}
        >
          {emptyText ?? t("videos.empty")}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-1 sm:gap-2">
        {videos.map((video) => (
          <button
            key={video.id}
            onClick={() => setActiveVideo(video)}
            className="relative aspect-9/16 rounded-md overflow-hidden bg-gray-100 dark:bg-white/5 group cursor-pointer"
          >
            {video.thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={video.thumbnailUrl}
                alt=""
                loading="lazy"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <PlayIcon size={24} className="text-gray-300 dark:text-white/20" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <PlayIcon
                size={28}
                weight="fill"
                className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow"
              />
            </div>
            {video.viewCount != null && (
              <span className="absolute bottom-1 left-1 flex items-center gap-1 text-[10px] text-white bg-black/50 rounded px-1.5 py-0.5">
                <EyeIcon size={10} weight="fill" />
                {video.viewCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center mt-4">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className={`text-xs px-4 py-2 rounded-lg border border-gray-200 dark:border-white/10 text-gray-600 dark:text-white/60 hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer disabled:opacity-40 transition-colors ${orbitron.className}`}
          >
            {loadingMore ? t("videos.loadingMore") : t("videos.loadMore")}
          </button>
        </div>
      )}

      {/* Lecteur en overlay */}
      {activeVideo && (
        <div
          className="fixed inset-0 z-100 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setActiveVideo(null)}
        >
          <button
            onClick={() => setActiveVideo(null)}
            className="absolute top-4 right-4 text-white/70 hover:text-white cursor-pointer"
            aria-label={t("cancel")}
          >
            <XIcon size={24} />
          </button>
          <video
            src={activeVideo.videoUrl}
            controls
            autoPlay
            playsInline
            className="max-h-full max-w-full rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}