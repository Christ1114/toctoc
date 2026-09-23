"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { PlayIcon, VideoCameraIcon } from "@phosphor-icons/react";
import { orbitron } from "@/fonts/font";
import type { ProviderVideoPublic } from "@/app/lib/queries/providers";
import VideoModal from "./VideoModal";
export default function VideoGallery({
  videos,
}: {
  videos: ProviderVideoPublic[];
}) {
  const t = useTranslations("ProviderProfile");
  const [active, setActive] = useState<ProviderVideoPublic | null>(null);
  if (videos.length === 0) {
    return (
      <div className="py-10 flex flex-col items-center text-center">
        <VideoCameraIcon
          size={32}
          className="text-gray-300 dark:text-white/20 mb-2"
        />
        <p
          className={`text-sm text-gray-400 dark:text-white/40 ${orbitron.className}`}
        >
          {t("noVideos")}
        </p>
      </div>
    );
  }
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {videos.map((v) => {
          const dur =
            v.duration && v.duration > 0
              ? `${Math.floor(v.duration / 60)}:${(v.duration % 60)
                  .toString()
                  .padStart(2, "0")}`
              : null;
          return (
            <button
              key={v.id}
              type="button"
              onClick={() => setActive(v)}
              aria-label={v.title ?? t("videoFallbackTitle")}
              className="group relative aspect-video rounded-xl overflow-hidden bg-gray-100 dark:bg-white/5 cursor-pointer border border-gray-200 dark:border-white/10 hover:border-[#432dd7] transition-colors focus:outline-none focus:ring-2 focus:ring-[#432dd7]"
            >
              {v.thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={v.thumbnail}
                  alt={v.title ?? ""}
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#432dd7]/20 to-[#432dd7]/5">
                  <VideoCameraIcon size={32} className="text-[#432dd7]/60" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/35 transition-colors flex items-center justify-center">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-white/90 group-hover:bg-white flex items-center justify-center transition-transform group-hover:scale-110">
                  <PlayIcon
                    size={20}
                    weight="fill"
                    className="text-[#432dd7] ml-0.5"
                  />
                </div>
              </div>
              {dur && (
                <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/70 text-white text-[10px] font-medium">
                  {dur}
                </span>
              )}
              {v.title && (
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                  <p className="text-white text-[11px] sm:text-xs font-medium line-clamp-1 text-left">
                    {v.title}
                  </p>
                </div>
              )}
            </button>
          );
        })}
      </div>
      {active && <VideoModal video={active} onClose={() => setActive(null)} />}
    </>
  );
}