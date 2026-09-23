"use client";
import { useCallback, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { XIcon } from "@phosphor-icons/react";
import type { ProviderVideoPublic } from "@/app/lib/queries/providers";
import { isSafeUrl } from "@/app/lib/security/url-validation";
export default function VideoModal({
  video,
  onClose,
}: {
  video: ProviderVideoPublic;
  onClose: () => void;
}) {
  const t = useTranslations("ProviderProfile.videoModal");
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  // ─── Stabilise onClose pour éviter les re-renders inutiles ───
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);
  // ─── Escape + scroll lock + restauration du focus ───
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
      // Restaure le focus à l'élément qui avait le focus avant l'ouverture
      previouslyFocused?.focus();
    };
  }, [handleClose]);
  // ─── Focus trap : le focus reste dans le modal ───
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    // Focus initial sur le bouton fermer
    closeButtonRef.current?.focus();
    const onTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const focusables = dialog.querySelectorAll<HTMLElement>(
        'button, [href], iframe, video, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    dialog.addEventListener("keydown", onTab);
    return () => dialog.removeEventListener("keydown", onTab);
  }, []);
  const safeUrl = isSafeUrl(video.url) ? video.url : null;
  const renderPlayer = () => {
    if (!safeUrl) {
      return (
        <div className="w-full h-full flex items-center justify-center text-white/70 text-sm">
          {t("invalidUrl")}
        </div>
      );
    }
    // ─── YouTube ───
    if (video.platform === "youtube" && video.externalId) {
      if (!/^[A-Za-z0-9_-]{11}$/.test(video.externalId)) {
        return (
          <div className="w-full h-full flex items-center justify-center text-white/70 text-sm">
            {t("invalidYoutubeId")}
          </div>
        );
      }
      return (
        <iframe
          src={`https://www.youtube.com/embed/${video.externalId}?rel=0&modestbranding=1`}
          title={video.title ?? t("videoFallbackTitle")}
          allow="clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
          className="w-full h-full"
        />
      );
    }
    // ─── Vimeo ───
    if (video.platform === "vimeo" && video.externalId) {
      if (!/^\d{6,12}$/.test(video.externalId)) {
        return (
          <div className="w-full h-full flex items-center justify-center text-white/70 text-sm">
            {t("invalidVimeoId")}
          </div>
        );
      }
      return (
        <iframe
          src={`https://player.vimeo.com/video/${video.externalId}`}
          title={video.title ?? t("videoFallbackTitle")}
          allow="fullscreen; picture-in-picture"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
          className="w-full h-full"
        />
      );
    }
    // ─── Vidéo directe ───
    if (video.platform === "direct") {
      return (
        <video
          src={safeUrl}
          controls
          playsInline
          preload="metadata"
          className="w-full h-full"
        />
      );
    }
    // ─── Fallback ───
    return (
      <div className="w-full h-full flex items-center justify-center text-white/70 text-sm">
        {t("unsupportedFormat")}
      </div>
    );
  };
  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-3 sm:p-6"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label={video.title ?? t("dialogLabel")}
    >
      <div
        ref={dialogRef}
        className="w-full max-w-4xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          ref={closeButtonRef}
          onClick={handleClose}
          aria-label={t("close")}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-white/60"
        >
          <XIcon size={20} />
        </button>
        <div className="aspect-video w-full rounded-xl overflow-hidden bg-black">
          {renderPlayer()}
        </div>
        {video.title && (
          <h3 className="mt-3 text-white text-base sm:text-lg font-semibold">
            {video.title}
          </h3>
        )}
        {video.description && (
          <p className="mt-1 text-white/70 text-xs sm:text-sm whitespace-pre-wrap">
            {video.description}
          </p>
        )}
      </div>
    </div>
  );
}