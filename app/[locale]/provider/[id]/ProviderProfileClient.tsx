"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import {
  ArrowLeftIcon,
  StarIcon,
  HeartIcon,
  ShareNetworkIcon,
  MapPinIcon,
  ClockIcon,
  BriefcaseIcon,
  ShieldCheckIcon,
  CalendarCheckIcon,
  InfoIcon,
  VideoCameraIcon,
  ChatCircleIcon,
} from "@phosphor-icons/react";
import { orbitron } from "@/fonts/font";
import { useSession } from "@/app/context/SessionContext";
import type {
  PublicProvider,
  ProviderVideoPublic,
} from "@/app/lib/queries/providers";
import SocialLinks from "@/components/provider/SocialLinks";
import VideoGallery from "@/components/provider/VideoGallery";

type TabKey = "about" | "videos" | "reviews" | "availability";

type Translations = {
  back: string;
  bookNow: string;
  contact: string;
  favorite: string;
  share: string;
  online: string;
  offline: string;
  verified: string;
  unnamed: string;
  memberSince: string;
  perHour: string;
  bio: string;
  details: string;
  providerType: string;
  hourlyRate: string;
  verificationLevel: string;
  region: string;
  noVideos: string;
  noReviews: string;
  noAvailability: string;
  videoFallbackTitle: string;
  tabs: {
    about: string;
    videos: string;
    reviews: string;
    availability: string;
  };
  providerTypes: Record<string, string>;
  levels: Record<string, string>;
};

export default function ProviderProfileClient({
  provider,
  videos,
  translations: t,
}: {
  provider: PublicProvider;
  videos: ProviderVideoPublic[];
  hasMoreVideos: boolean;
  translations: Translations;
}) {
  const router = useRouter();
  const { user: sessionUser } = useSession();
  const [activeTab, setActiveTab] = useState<TabKey>("about");
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  const isOnline =
    provider.lastLocationUpdatedAt !== null &&
    Date.now() - new Date(provider.lastLocationUpdatedAt).getTime() < 5 * 60 * 1000;

  const isVerified = provider.verificationStatus === "VERIFIED";

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ url: window.location.href });
      } else {
        await navigator.clipboard.writeText(window.location.href);
      }
    } catch {
      /* silent */
    }
  };

  const handleFavorite = async () => {
    if (!sessionUser) {
      router.push(`/login?callbackUrl=/provider/${provider.id}`);
      return;
    }
    if (favoriteLoading) return;

    setFavoriteLoading(true);
    const previous = isFavorite;
    setIsFavorite(!previous); // optimistic

    try {
      const res = await fetch(`/api/providers/${provider.id}/favorite`, {
        method: previous ? "DELETE" : "POST",
      });
      if (!res.ok) throw new Error("Échec");
    } catch {
      setIsFavorite(previous); // rollback
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleBooking = () => {
    if (!sessionUser) {
      router.push(`/login?callbackUrl=/provider/${provider.id}`);
      return;
    }
    router.push(`/booking/new?providerId=${provider.id}`);
  };

  const handleMessage = () => {
    if (!sessionUser) {
      router.push(`/login?callbackUrl=/provider/${provider.id}`);
      return;
    }
    router.push(`/messages/new?to=${provider.id}`);
  };

  const TABS: { key: TabKey; icon: typeof InfoIcon; label: string }[] = [
    { key: "about", icon: InfoIcon, label: t.tabs.about },
    { key: "videos", icon: VideoCameraIcon, label: t.tabs.videos },
    { key: "reviews", icon: StarIcon, label: t.tabs.reviews },
    { key: "availability", icon: CalendarCheckIcon, label: t.tabs.availability },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900">
      <div className="max-w-5xl mx-auto px-3 sm:px-6 pb-24 md:pb-6 py-4 sm:py-6">
        {/* Retour */}
        <button
          onClick={() => router.back()}
          className={`flex items-center gap-1.5 text-xs sm:text-sm text-gray-500 dark:text-white/50 hover:text-gray-900 dark:hover:text-white/90 cursor-pointer mb-4 sm:mb-6 transition-colors ${orbitron.className}`}
        >
          <ArrowLeftIcon size={16} />
          {t.back}
        </button>

        {/* ═══════════════ EN-TÊTE ═══════════════ */}
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
          <div className="relative shrink-0 mx-auto sm:mx-0">
            <div className="h-24 w-24 sm:h-28 sm:w-28 md:h-32 md:w-32 rounded-full overflow-hidden bg-[#432dd7]/10 flex items-center justify-center border border-black/5 dark:border-white/10">
              {provider.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={provider.image}
                  alt={provider.name ?? "Provider"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl font-semibold text-[#432dd7]">
                  {provider.name?.charAt(0).toUpperCase() ?? "?"}
                </span>
              )}
            </div>
            <span
              className="absolute bottom-1 right-1 h-5 w-5 rounded-full border-2 border-white dark:border-zinc-900"
              style={{ background: isOnline ? "#22c55e" : "#ef4444" }}
              aria-label={isOnline ? t.online : t.offline}
            />
          </div>

          <div className="flex-1 min-w-0 text-center sm:text-start">
            <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
              <h1
                className={`text-lg sm:text-xl font-semibold text-gray-900 dark:text-white/90 truncate ${orbitron.className}`}
              >
                {provider.name ?? t.unnamed}
              </h1>
              {isVerified && (
                <ShieldCheckIcon
                  size={18}
                  weight="fill"
                  className="text-[#432dd7] shrink-0"
                  aria-label={t.verified}
                />
              )}
              {provider.providerType && (
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-md bg-[#432dd7]/10 text-[#432dd7] text-[10px] sm:text-xs font-medium ${orbitron.className}`}
                >
                  {t.providerTypes[provider.providerType] ?? provider.providerType}
                </span>
              )}
            </div>

            <div className="flex items-center justify-center sm:justify-start gap-4 mt-2 text-xs sm:text-sm text-gray-500 dark:text-white/50 flex-wrap">
              {provider.stats.averageRating !== null && (
                <span className="flex items-center gap-1">
                  <StarIcon size={14} weight="fill" className="text-yellow-500" />
                  <span className="font-semibold text-gray-900 dark:text-white/90">
                    {provider.stats.averageRating.toFixed(1)}
                  </span>
                  <span>({provider.stats.reviewsCount})</span>
                </span>
              )}
              {provider.lastKnownRegion && (
                <span className="flex items-center gap-1">
                  <MapPinIcon size={14} />
                  {provider.lastKnownRegion}
                </span>
              )}
              <span className="flex items-center gap-1">
                <ClockIcon size={14} />
                {t.memberSince}
              </span>
            </div>

            {provider.hourlyRate !== null && (
              <p
                className={`mt-2 text-base sm:text-lg font-bold text-[#432dd7] ${orbitron.className}`}
              >
                {provider.hourlyRate} {provider.currency}
                <span className="text-xs sm:text-sm font-normal text-gray-500 dark:text-white/50 ml-1">
                  / {t.perHour}
                </span>
              </p>
            )}

            <SocialLinks provider={provider} />
          </div>
        </div>

        {/* ═══════════════ ACTIONS ═══════════════ */}
        <div className="flex flex-wrap items-center gap-2 mt-5 sm:mt-6">
          <button
            onClick={handleBooking}
            className={`flex-1 sm:flex-none min-w-40 flex items-center justify-center gap-2 h-11 px-5 rounded-lg bg-[#432dd7] hover:bg-[#432dd7]/90 text-white text-sm font-medium cursor-pointer transition-colors ${orbitron.className}`}
          >
            <BriefcaseIcon size={16} weight="bold" />
            {t.bookNow}
          </button>

          <button
            onClick={handleMessage}
            className={`flex-1 sm:flex-none min-w-32 flex items-center justify-center gap-2 h-11 px-4 rounded-lg bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 text-gray-900 dark:text-white/90 text-sm cursor-pointer transition-colors ${orbitron.className}`}
          >
            <ChatCircleIcon size={16} />
            {t.contact}
          </button>

          <button
            onClick={handleFavorite}
            disabled={favoriteLoading}
            aria-label={t.favorite}
            aria-pressed={isFavorite}
            className={`h-11 w-11 rounded-lg flex items-center justify-center cursor-pointer transition-colors disabled:opacity-50 ${
              isFavorite
                ? "bg-red-500/10 text-red-500"
                : "bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-white/70 hover:bg-gray-200 dark:hover:bg-white/15"
            }`}
          >
            <HeartIcon size={18} weight={isFavorite ? "fill" : "regular"} />
          </button>

          <button
            onClick={handleShare}
            aria-label={t.share}
            className="h-11 w-11 rounded-lg bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 flex items-center justify-center text-gray-700 dark:text-white/70 cursor-pointer transition-colors"
          >
            <ShareNetworkIcon size={18} />
          </button>
        </div>

        {/* ═══════════════ TABS ═══════════════ */}
        <div className="flex items-center border-t border-gray-100 dark:border-white/5 mt-6">
          {TABS.map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 flex items-center justify-center gap-1.5 h-11 sm:h-12 text-xs sm:text-sm cursor-pointer border-b-2 transition-colors ${
                activeTab === key
                  ? "border-gray-900 dark:border-white text-gray-900 dark:text-white"
                  : "border-transparent text-gray-400 dark:text-white/40 hover:text-gray-700 dark:hover:text-white/70"
              } ${orbitron.className}`}
            >
              <Icon size={16} weight={activeTab === key ? "fill" : "regular"} />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* ═══════════════ CONTENU ═══════════════ */}
        <div className="mt-5 sm:mt-6">
          {activeTab === "about" && <AboutTab provider={provider} t={t} />}
          {activeTab === "videos" && <VideoGallery videos={videos} />}
          {activeTab === "reviews" && (
            <EmptyTab icon={StarIcon} label={t.noReviews} />
          )}
          {activeTab === "availability" && (
            <EmptyTab icon={CalendarCheckIcon} label={t.noAvailability} />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Sous-composants ───

function AboutTab({
  provider,
  t,
}: {
  provider: PublicProvider;
  t: Translations;
}) {
  return (
    <div className="flex flex-col gap-5">
      {provider.bio && (
        <section>
          <h3
            className={`text-xs uppercase tracking-wide text-gray-400 dark:text-white/40 mb-2 ${orbitron.className}`}
          >
            {t.bio}
          </h3>
          <p
            className={`text-sm text-gray-700 dark:text-white/70 leading-relaxed whitespace-pre-wrap ${orbitron.className}`}
          >
            {provider.bio}
          </p>
        </section>
      )}

      <section>
        <h3
          className={`text-xs uppercase tracking-wide text-gray-400 dark:text-white/40 mb-2 ${orbitron.className}`}
        >
          {t.details}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {provider.providerType && (
            <DetailRow
              label={t.providerType}
              value={t.providerTypes[provider.providerType] ?? provider.providerType}
            />
          )}
          {provider.hourlyRate !== null && (
            <DetailRow
              label={t.hourlyRate}
              value={`${provider.hourlyRate} ${provider.currency}`}
            />
          )}
          {provider.verificationLevel && (
            <DetailRow
              label={t.verificationLevel}
              value={t.levels[provider.verificationLevel] ?? provider.verificationLevel}
            />
          )}
          {provider.lastKnownRegion && (
            <DetailRow label={t.region} value={provider.lastKnownRegion} />
          )}
        </div>
      </section>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-white/5">
      <span className="text-xs text-gray-500 dark:text-white/50">{label}</span>
      <span className="text-sm text-gray-900 dark:text-white/90 font-medium">
        {value}
      </span>
    </div>
  );
}

function EmptyTab({
  icon: Icon,
  label,
}: {
  icon: typeof StarIcon;
  label: string;
}) {
  return (
    <div className="py-10 flex flex-col items-center text-center">
      <Icon size={32} className="text-gray-300 dark:text-white/20 mb-2" />
      <p
        className={`text-sm text-gray-400 dark:text-white/40 ${orbitron.className}`}
      >
        {label}
      </p>
    </div>
  );
}