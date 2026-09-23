"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  UserIcon,
  ShareNetworkIcon,
  BriefcaseIcon,
  ArrowLeftIcon,
  StarIcon,
  HeartIcon,
  VideoCameraIcon,
  GlobeIcon,
  InstagramLogoIcon,
  FacebookLogoIcon,
  TiktokLogoIcon,
  LinkedinLogoIcon,
  YoutubeLogoIcon,
  XLogoIcon,
} from "@phosphor-icons/react";
import { orbitron } from "@/fonts/font";
import { isSafeUrl } from "@/app/lib/security/url-validation";
import VideoGrid from "@/components/app/VideoGrid";

type ProviderType =
  | "BABYSITTER"
  | "GARDE_PERISCOLAIRE"
  | "MENAGE"
  | "AIDE_PERSONNES_AGEES"
  | "RESIDENTIEL"
  | "COURT_TERME";

type SocialKey =
  | "website"
  | "instagram"
  | "facebook"
  | "tiktok"
  | "linkedin"
  | "youtube"
  | "twitter";

type PublicProvider = {
  id: string;
  name: string | null;
  image: string | null;
  bio: string | null;
  providerType: ProviderType | null;
  hourlyRate: number | null;
  currency: string | null;
  website?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  tiktok?: string | null;
  linkedin?: string | null;
  youtube?: string | null;
  twitter?: string | null;
};

type PublicStats = {
  reviewsCount: number;
  averageRating: number | null;
  bookingsCount: number;
};

type TabKey = "videos" | "reviews" | "favorites";

export default function PublicProviderProfilePage() {
  const t = useTranslations("ProfilePage");
  const locale = useLocale();
  const router = useRouter();
  const params = useParams();
  // ✅ Le dossier de route est [id], pas [userId]
  const providerId = params.id as string;
  const isRTL = locale === "ar";

  const [provider, setProvider] = useState<PublicProvider | null>(null);
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("videos");

  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [favoritePending, setFavoritePending] = useState(false);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setNotFound(false);
    setLoadError(false);
    try {
      const res = await fetch(`/api/profils/${providerId}`);
      if (res.status === 404) {
        setNotFound(true);
        return;
      }
      if (!res.ok) throw new Error("Erreur chargement profil");

      const data = await res.json();

      // ✅ Sécurité : on n'affiche QUE les prestataires
      if (data?.user?.accountType !== "PROVIDER") {
        setNotFound(true);
        return;
      }

      setProvider(data.user);
      setStats(data.stats);
    } catch (err) {
      console.error("Erreur chargement profil prestataire:", err);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [providerId]);

  // ✅ Garde-fou : si providerId est absent, on sort du loading
  // au lieu de laisser le spinner tourner indéfiniment
  useEffect(() => {
    if (!providerId) {
      console.warn(
        "[PublicProviderProfilePage] providerId manquant — vérifier le nom du segment de route"
      );
      setLoading(false);
      setNotFound(true);
      return;
    }
    loadProfile();
  }, [providerId, loadProfile]);

  // État initial du favori, chargé séparément (n'empêche pas le reste
  // du profil de s'afficher si ça échoue)
  useEffect(() => {
    if (!providerId) return;
    setFavoriteLoading(true);
    fetch(`/api/providers/${providerId}/favorite`)
      .then((res) => (res.ok ? res.json() : { favorite: false }))
      .then((data) => setIsFavorite(!!data.favorite))
      .catch(() => setIsFavorite(false))
      .finally(() => setFavoriteLoading(false));
  }, [providerId]);

  const handleToggleFavorite = async () => {
    if (favoritePending) return; // évite le double-clic pendant une requête en cours

    const next = !isFavorite;
    setIsFavorite(next); // mise à jour optimiste
    setFavoritePending(true);

    try {
      const res = await fetch(`/api/providers/${providerId}/favorite`, {
        method: next ? "POST" : "DELETE",
      });
      if (!res.ok) {
        setIsFavorite(!next); // annule si échec
      }
    } catch (err) {
      console.error("Erreur toggle favori:", err);
      setIsFavorite(!next);
    } finally {
      setFavoritePending(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ url });
      } else {
        await navigator.clipboard.writeText(url);
      }
    } catch {
      /* annulation du partage par l'utilisateur, rien à faire */
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-zinc-900">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black/30 dark:border-white/30" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-zinc-900 px-4 gap-3">
        <p className={`text-sm text-gray-500 dark:text-white/50 text-center ${orbitron.className}`}>
          {t("errors.saveFailed")}
        </p>
        <button
          onClick={loadProfile}
          className={`text-sm text-[#432dd7] hover:underline cursor-pointer ${orbitron.className}`}
        >
          {t("videos.retry")}
        </button>
      </div>
    );
  }

  if (notFound || !provider) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-zinc-900 px-4">
        <p className={`text-sm text-gray-500 dark:text-white/50 text-center ${orbitron.className}`}>
          {t("notFound")}
        </p>
      </div>
    );
  }

  const SOCIAL_FIELDS: {
    key: SocialKey;
    icon: React.ReactNode;
    displayLabel: string;
  }[] = [
    { key: "website", icon: <GlobeIcon size={16} />, displayLabel: t("social.website") },
    { key: "instagram", icon: <InstagramLogoIcon size={16} />, displayLabel: t("social.instagram") },
    { key: "facebook", icon: <FacebookLogoIcon size={16} />, displayLabel: t("social.facebook") },
    { key: "tiktok", icon: <TiktokLogoIcon size={16} />, displayLabel: t("social.tiktok") },
    { key: "linkedin", icon: <LinkedinLogoIcon size={16} />, displayLabel: t("social.linkedin") },
    { key: "youtube", icon: <YoutubeLogoIcon size={16} />, displayLabel: t("social.youtube") },
    { key: "twitter", icon: <XLogoIcon size={16} />, displayLabel: t("social.twitter") },
  ];

  const socialLinks = SOCIAL_FIELDS.map((f) => ({
    ...f,
    href: provider[f.key] ?? null,
  })).filter((l) => isSafeUrl(l.href));

  const TABS: { key: TabKey; icon: typeof VideoCameraIcon; label: string }[] = [
    { key: "videos", icon: VideoCameraIcon, label: t("tabs.videos") },
    { key: "reviews", icon: StarIcon, label: t("tabs.reviews") },
    { key: "favorites", icon: HeartIcon, label: t("tabs.favorites") },
  ];

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="min-h-screen bg-white dark:bg-zinc-900">
      <div className="max-w-5xl mx-auto px-3 sm:px-6 pb-24 md:pb-6 py-4 sm:py-6">
        <button
          onClick={() => router.back()}
          className={`flex items-center gap-1.5 text-xs sm:text-sm text-gray-500 dark:text-white/50 hover:text-gray-900 dark:hover:text-white/90 cursor-pointer mb-4 sm:mb-6 transition-colors ${orbitron.className}`}
        >
          <ArrowLeftIcon size={16} className={isRTL ? "rotate-180" : ""} />
          {t("back")}
        </button>

        {/* ═══════════════ EN-TÊTE ═══════════════ */}
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 md:gap-8">
          <div className="relative shrink-0 mx-auto sm:mx-0">
            <div className="h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28 lg:h-32 lg:w-32 rounded-full overflow-hidden bg-[#432dd7]/10 flex items-center justify-center border border-black/5 dark:border-white/10">
              {provider.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={provider.image}
                  alt={provider.name || t("unnamed")}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <span className={`text-2xl sm:text-3xl font-semibold text-[#432dd7] ${orbitron.className}`}>
                  {provider.name ? (
                    provider.name.charAt(0).toUpperCase()
                  ) : (
                    <UserIcon size={32} />
                  )}
                </span>
              )}
            </div>
          </div>

          <div className="flex-1 min-w-0 text-center sm:text-start">
            <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
              <h1
                className={`text-base sm:text-lg font-semibold text-gray-900 dark:text-white/90 truncate max-w-full ${orbitron.className}`}
              >
                {provider.name || t("unnamed")}
              </h1>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-md bg-[#432dd7]/10 text-[#432dd7] text-[10px] sm:text-xs font-medium ${orbitron.className}`}
              >
                {t("accountType.PROVIDER")}
              </span>
            </div>

            <div className="flex items-center justify-center sm:justify-start gap-3 sm:gap-5 mt-2.5 sm:mt-3 flex-wrap">
              <div className="flex items-baseline gap-1">
                <span className={`text-sm font-semibold text-gray-900 dark:text-white/90 ${orbitron.className}`}>
                  {stats?.bookingsCount ?? 0}
                </span>
                <span className={`text-xs text-gray-500 dark:text-white/50 ${orbitron.className}`}>
                  {t("tabs.bookings")}
                </span>
              </div>
              <button
                onClick={() => setActiveTab("reviews")}
                className="flex items-baseline gap-1 cursor-pointer group"
              >
                <span className={`text-sm font-semibold text-gray-900 dark:text-white/90 ${orbitron.className}`}>
                  {stats?.reviewsCount ?? 0}
                </span>
                <span
                  className={`text-xs text-gray-500 dark:text-white/50 group-hover:text-gray-900 dark:group-hover:text-white/80 transition-colors ${orbitron.className}`}
                >
                  {t("tabs.reviews")}
                </span>
              </button>
              {stats?.averageRating != null && (
                <span className={`flex items-center gap-1 text-xs text-gray-500 dark:text-white/50 ${orbitron.className}`}>
                  <StarIcon size={12} weight="fill" className="text-yellow-500" />
                  {stats.averageRating.toFixed(1)}
                </span>
              )}
            </div>

            {/* Actions : favori + partager */}
            <div className="flex items-center justify-center sm:justify-start gap-2 mt-3 sm:mt-4 flex-wrap">
              <button
                onClick={handleToggleFavorite}
                disabled={favoriteLoading || favoritePending}
                aria-pressed={isFavorite}
                className={`flex items-center gap-1.5 h-9 sm:h-10 px-4 rounded-lg text-xs sm:text-sm cursor-pointer transition-colors disabled:opacity-50 ${orbitron.className} ${
                  isFavorite
                    ? "bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20"
                    : "bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 text-gray-900 dark:text-white/90"
                }`}
                aria-label={isFavorite ? t("removeFavorite") : t("addFavorite")}
              >
                <HeartIcon size={16} weight={isFavorite ? "fill" : "regular"} />
                <span className="hidden sm:inline">
                  {isFavorite ? t("removeFavorite") : t("addFavorite")}
                </span>
              </button>
              <button
                onClick={handleShare}
                className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 flex items-center justify-center text-gray-900 dark:text-white/90 cursor-pointer transition-colors"
                aria-label={t("share")}
              >
                <ShareNetworkIcon size={18} />
              </button>
            </div>

            {/* Bio */}
            <div className="mt-3 sm:mt-4">
              <p className={`text-xs sm:text-sm text-gray-600 dark:text-white/50 wrap-break-words ${orbitron.className}`}>
                {provider.bio || t("noBio")}
              </p>
            </div>

            {/* Réseaux sociaux */}
            {socialLinks.length > 0 && (
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
                {socialLinks.map(({ key, href, icon, displayLabel }) => (
                  <a
                    key={key}
                    href={href!}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    aria-label={displayLabel}
                    title={displayLabel}
                    className="h-8 w-8 rounded-full bg-gray-100 dark:bg-white/10 hover:bg-[#432dd7]/10 hover:text-[#432dd7] dark:hover:bg-[#432dd7]/20 flex items-center justify-center text-gray-700 dark:text-white/70 transition-colors"
                  >
                    {icon}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ═══════════════ SECTION PRESTATAIRE ═══════════════ */}
        <section className="border-t border-gray-100 dark:border-white/5 mt-5 sm:mt-6 pt-4 sm:pt-5">
          <h2
            className={`flex items-center gap-1.5 text-[10px] sm:text-xs uppercase tracking-wide text-gray-400 dark:text-white/40 mb-3 ${orbitron.className}`}
          >
            <BriefcaseIcon size={16} />
            {t("providerInfo")}
          </h2>
          <div className="flex flex-col gap-3">
            <ReadField
              label={t("providerType")}
              value={provider.providerType ? t(`providerTypes.${provider.providerType}`) : null}
            />
            <ReadField
              label={t("hourlyRate")}
              value={
                provider.hourlyRate ? `${provider.hourlyRate} ${provider.currency || "XOF"} / h` : null
              }
            />
          </div>
        </section>

        {/* ═══════════════ TABS : vidéos / avis / favoris ═══════════════ */}
        <div className="flex items-center border-t border-gray-100 dark:border-white/5 mt-5 sm:mt-6">
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

        {/* ═══════════════ CONTENU DES ONGLETS ═══════════════ */}
        <div className="pt-4 sm:pt-5">
          {activeTab === "videos" && <VideoGrid providerId={providerId} />}

          {activeTab === "reviews" && (
            <div className="py-10 sm:py-14 flex flex-col items-center justify-center text-center px-4">
              <StarIcon size={32} className="text-gray-300 dark:text-white/20 mb-2" />
              <p className={`text-xs sm:text-sm text-gray-400 dark:text-white/40 ${orbitron.className}`}>
                {t("empty.reviews")}
              </p>
            </div>
          )}

          {activeTab === "favorites" && (
            <div className="py-10 sm:py-14 flex flex-col items-center justify-center text-center px-4">
              <HeartIcon size={32} className="text-gray-300 dark:text-white/20 mb-2" />
              <p className={`text-xs sm:text-sm text-gray-400 dark:text-white/40 ${orbitron.className}`}>
                {t("empty.favorites")}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════ ReadField ═══════════════ */
function ReadField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
      <span className={`text-xs sm:text-sm text-gray-500 dark:text-white/50 shrink-0 ${orbitron.className}`}>
        {label}
      </span>
      <span className={`text-sm text-gray-900 dark:text-white/90 truncate ${orbitron.className}`}>
        {value || "—"}
      </span>
    </div>
  );
}