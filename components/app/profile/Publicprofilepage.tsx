"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  UserIcon,
  ShareNetworkIcon,
  BriefcaseIcon,
  BuildingsIcon,
  ArrowLeftIcon,
  CalendarCheckIcon,
  StarIcon,
  HeartIcon,
  LinkIcon,
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

type AccountType = "CLIENT" | "PROVIDER" | "ADMIN";
type ClientType = "INDIVIDUAL" | "AGENCY";
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

type PublicUser = {
  id: string;
  name: string | null;
  image: string | null;
  bio: string | null;
  accountType: AccountType | null;
  clientType: ClientType | null;
  companyName: string | null;
  rccmNumber: string | null;
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

export default function PublicProfilePage() {
  const t = useTranslations("ProfilePage");
  const locale = useLocale();
  const router = useRouter();
  const params = useParams();
  const userId = params.userId as string;
  const isRTL = locale === "ar";

  const [user, setUser] = useState<PublicUser | null>(null);
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState<"reviews" | "favorites">("reviews");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setNotFound(false);
      try {
        const res = await fetch(`/api/profils/${userId}`);
        if (res.status === 404) {
          setNotFound(true);
          return;
        }
        if (!res.ok) throw new Error("Erreur chargement profil");
        const data = await res.json();
        setUser(data.user);
        setStats(data.stats);
      } catch (err) {
        console.error("Erreur chargement profil public:", err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    if (userId) load();
  }, [userId]);

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ url });
      } else {
        await navigator.clipboard.writeText(url);
      }
    } catch {
      /* silent */
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-zinc-900">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black/30 dark:border-white/30" />
      </div>
    );
  }

  if (notFound || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-zinc-900 px-4">
        <p className={`text-sm text-gray-500 dark:text-white/50 text-center ${orbitron.className}`}>
          {t("notFound")}
        </p>
      </div>
    );
  }

  const isAgencyClient = user.accountType === "CLIENT" && user.clientType === "AGENCY";
  const isProvider = user.accountType === "PROVIDER";

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
    href: user[f.key] ?? null,
  })).filter((l) => isSafeUrl(l.href));

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

        {/* ═══════════════ EN-TÊTE (identique, sans édition) ═══════════════ */}
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 md:gap-8">
          <div className="relative shrink-0 mx-auto sm:mx-0">
            <div className="h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28 lg:h-32 lg:w-32 rounded-full overflow-hidden bg-[#432dd7]/10 flex items-center justify-center border border-black/5 dark:border-white/10">
              {user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.image}
                  alt={user.name || t("unnamed")}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl sm:text-3xl font-semibold text-[#432dd7]">
                  {user.name ? (
                    user.name.charAt(0).toUpperCase()
                  ) : (
                    <UserIcon size={32} />
                  )}
                </span>
              )}
            </div>
            {/* Pas de bouton caméra ici : on ne peut pas éditer le profil d'un autre */}
          </div>

          <div className="flex-1 min-w-0 text-center sm:text-start">
            <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
              <h1
                className={`text-base sm:text-lg font-semibold text-gray-900 dark:text-white/90 truncate max-w-full ${orbitron.className}`}
              >
                {user.name || t("unnamed")}
              </h1>
              {user.accountType && (
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-md bg-[#432dd7]/10 text-[#432dd7] text-[10px] sm:text-xs font-medium ${orbitron.className}`}
                >
                  {t(`accountType.${user.accountType}`)}
                </span>
              )}
            </div>

            <div className="flex items-center justify-center sm:justify-start gap-3 sm:gap-5 mt-2.5 sm:mt-3 flex-wrap">
              {isProvider && (
                <div className="flex items-baseline gap-1">
                  <span className={`text-sm font-semibold text-gray-900 dark:text-white/90 ${orbitron.className}`}>
                    {stats?.bookingsCount ?? 0}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-white/50">
                    {t("tabs.bookings")}
                  </span>
                </div>
              )}
              <button
                onClick={() => setActiveTab("reviews")}
                className="flex items-baseline gap-1 cursor-pointer group"
              >
                <span className={`text-sm font-semibold text-gray-900 dark:text-white/90 ${orbitron.className}`}>
                  {stats?.reviewsCount ?? 0}
                </span>
                <span className="text-xs text-gray-500 dark:text-white/50 group-hover:text-gray-900 dark:group-hover:text-white/80 transition-colors">
                  {t("tabs.reviews")}
                </span>
              </button>
              {isProvider && stats?.averageRating != null && (
                <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-white/50">
                  <StarIcon size={12} weight="fill" className="text-yellow-500" />
                  {stats.averageRating.toFixed(1)}
                </span>
              )}
            </div>

            {/* Actions : uniquement partager, pas d'édition, pas de paramètres */}
            <div className="flex items-center justify-center sm:justify-start gap-2 mt-3 sm:mt-4 flex-wrap">
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
                {user.bio || t("noBio")}
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

        {/* ═══════════════ SECTION AGENCE (lecture seule) ═══════════════ */}
        {isAgencyClient && (user.companyName || user.rccmNumber) && (
          <section className="border-t border-gray-100 dark:border-white/5 mt-5 sm:mt-6 pt-4 sm:pt-5">
            <h2
              className={`flex items-center gap-1.5 text-[10px] sm:text-xs uppercase tracking-wide text-gray-400 dark:text-white/40 mb-3 ${orbitron.className}`}
            >
              <BuildingsIcon size={16} />
              {t("agencyInfo")}
            </h2>
            <div className="flex flex-col gap-3">
              <ReadField label={t("companyName")} value={user.companyName} />
              <ReadField label={t("rccmNumber")} value={user.rccmNumber} />
            </div>
          </section>
        )}

        {/* ═══════════════ SECTION PROVIDER (lecture seule) ═══════════════ */}
        {isProvider && (
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
                value={user.providerType ? t(`providerTypes.${user.providerType}`) : null}
              />
              <ReadField
                label={t("hourlyRate")}
                value={user.hourlyRate ? `${user.hourlyRate} ${user.currency || "XOF"} / h` : null}
              />
            </div>
          </section>
        )}

        {/* ═══════════════ TABS (avis / favoris, pas de réservations privées) ═══════════════ */}
        <div className="flex items-center border-t border-gray-100 dark:border-white/5 mt-5 sm:mt-6">
          <button
            onClick={() => setActiveTab("reviews")}
            className={`flex-1 flex items-center justify-center gap-1.5 h-11 sm:h-12 text-xs sm:text-sm cursor-pointer border-b-2 transition-colors ${
              activeTab === "reviews"
                ? "border-gray-900 dark:border-white text-gray-900 dark:text-white"
                : "border-transparent text-gray-400 dark:text-white/40 hover:text-gray-700 dark:hover:text-white/70"
            } ${orbitron.className}`}
          >
            <StarIcon size={16} weight={activeTab === "reviews" ? "fill" : "regular"} />
            <span className="hidden sm:inline">{t("tabs.reviews")}</span>
          </button>
          <button
            onClick={() => setActiveTab("favorites")}
            className={`flex-1 flex items-center justify-center gap-1.5 h-11 sm:h-12 text-xs sm:text-sm cursor-pointer border-b-2 transition-colors ${
              activeTab === "favorites"
                ? "border-gray-900 dark:border-white text-gray-900 dark:text-white"
                : "border-transparent text-gray-400 dark:text-white/40 hover:text-gray-700 dark:hover:text-white/70"
            } ${orbitron.className}`}
          >
            <HeartIcon size={16} weight={activeTab === "favorites" ? "fill" : "regular"} />
            <span className="hidden sm:inline">{t("tabs.favorites")}</span>
          </button>
        </div>

        {/* ═══════════════ ÉTAT VIDE ═══════════════ */}
        <div className="py-10 sm:py-14 flex flex-col items-center justify-center text-center px-4">
          {activeTab === "reviews" && (
            <>
              <StarIcon size={32} className="text-gray-300 dark:text-white/20 mb-2" />
              <p className={`text-xs sm:text-sm text-gray-400 dark:text-white/40 ${orbitron.className}`}>
                {t("empty.reviews")}
              </p>
            </>
          )}
          {activeTab === "favorites" && (
            <>
              <HeartIcon size={32} className="text-gray-300 dark:text-white/20 mb-2" />
              <p className={`text-xs sm:text-sm text-gray-400 dark:text-white/40 ${orbitron.className}`}>
                {t("empty.favorites")}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ReadField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
      <span className="text-xs sm:text-sm text-gray-500 dark:text-white/50 shrink-0">{label}</span>
      <span className="text-sm text-gray-900 dark:text-white/90 truncate">{value || "—"}</span>
    </div>
  );
}