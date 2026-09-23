"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  UserIcon,
  ShareNetworkIcon,
  BuildingsIcon,
  ArrowLeftIcon,
  StarIcon,
  GlobeIcon,
  InstagramLogoIcon,
  FacebookLogoIcon,
  TiktokLogoIcon,
  LinkedinLogoIcon,
  YoutubeLogoIcon,
  XLogoIcon,
  InfoIcon,
  MegaphoneIcon,
  MapPinIcon,
  EyeIcon,
} from "@phosphor-icons/react";
import { orbitron } from "@/fonts/font";
import { isSafeUrl } from "@/app/lib/security/url-validation";

/* ═══════════════════════════════════════════════════════════
   ⚙️ CONFIGURATION
   ═══════════════════════════════════════════════════════════ */

/**
 * Route vers le détail d'une annonce.
 * ⚠️ À VÉRIFIER : adapte selon ton arborescence réelle
 *    (ex. "/app/offer/[id]", "/app/listing/[id]", "/announcement/[id]")
 */
const announcementDetailPath = (id: string) => `/app/announcement/${id}`;

/* ═══════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════ */

type ClientType = "INDIVIDUAL" | "AGENCY";

type SocialKey =
  | "website"
  | "instagram"
  | "facebook"
  | "tiktok"
  | "linkedin"
  | "youtube"
  | "twitter";

type PublicClient = {
  id: string;
  name: string | null;
  image: string | null;
  bio: string | null;
  clientType: ClientType | null;
  companyName: string | null;
  rccmNumber: string | null;
  createdAt: string | null;
  website?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  tiktok?: string | null;
  linkedin?: string | null;
  youtube?: string | null;
  twitter?: string | null;
};

type PublicStats = {
  bookingsCount: number;
  reviewsCount: number;
  averageRating: number | null;
};

type PublicAnnouncement = {
  id: string;
  type: "OFFER" | "PROFILE";
  title: string;
  description: string | null;
  salaryMin: number | null;
  salaryPeriod: string | null;
  city: string | null;
  isUrgent: boolean;
  viewCount: number;
  postedAt: string | null;
  createdAt: string;
  jobType: { id: string; name: string; slug: string } | null;
  region: { id: string; name: string; slug: string } | null;
};

type TabKey = "about" | "announcements" | "reviews";

/* ═══════════════════════════════════════════════════════════
   COMPOSANT
   ═══════════════════════════════════════════════════════════ */

export default function PublicClientProfilePage() {
  const t = useTranslations("ProfilePage");
  const locale = useLocale();
  const router = useRouter();
  const params = useParams();
  // ✅ Le dossier de route est [id], pas [userId]
  const clientId = (params?.id as string) || "";
  const isRTL = locale === "ar";

  const [client, setClient] = useState<PublicClient | null>(null);
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("about");

  // ─── Annonces du client ───
  const [announcements, setAnnouncements] = useState<PublicAnnouncement[]>([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(false);
  const [announcementsError, setAnnouncementsError] = useState(false);
  const [announcementsLoaded, setAnnouncementsLoaded] = useState(false);

  // ─── Charger le profil ───
  const loadProfile = useCallback(async () => {
    if (!clientId) {
      setLoading(false);
      setNotFound(true);
      return;
    }

    setLoading(true);
    setNotFound(false);
    setLoadError(false);

    try {
      const res = await fetch(`/api/profils/${clientId}`);
      if (res.status === 404) {
        setNotFound(true);
        return;
      }
      if (!res.ok) throw new Error("Erreur chargement profil");

      const data = await res.json();

      // ✅ Sécurité : on n'affiche QUE les clients sur cette page
      if (data?.user?.accountType !== "CLIENT") {
        setNotFound(true);
        return;
      }

      setClient(data.user);
      setStats(data.stats);
    } catch (err) {
      console.error("Erreur chargement profil client:", err);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // ─── Charger les annonces (lazy, à l'ouverture de l'onglet) ───
  useEffect(() => {
    if (activeTab !== "announcements") return;
    if (!clientId) return;
    if (announcementsLoaded) return;

    const controller = new AbortController();
    let cancelled = false;

    setAnnouncementsLoading(true);
    setAnnouncementsError(false);

    fetch(`/api/profils/${clientId}/announcements?limit=20`, {
      signal: controller.signal,
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("fetch failed"))))
      .then((data) => {
        if (cancelled) return;
        setAnnouncements(data.announcements || []);
        setAnnouncementsLoaded(true);
      })
      .catch((err) => {
        if (err.name === "AbortError" || cancelled) return;
        setAnnouncementsError(true);
      })
      .finally(() => {
        if (cancelled) return;
        setAnnouncementsLoading(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [activeTab, clientId, announcementsLoaded]);

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ url });
      else await navigator.clipboard.writeText(url);
    } catch {
      /* annulation du partage, rien à faire */
    }
  };

  /* ─── Loading ─── */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-zinc-900">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black/30 dark:border-white/30" />
      </div>
    );
  }

  /* ─── Erreur réseau ─── */
  if (loadError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-zinc-900 px-4 gap-3">
        <p
          className={`text-sm text-gray-500 dark:text-white/50 text-center ${orbitron.className}`}
        >
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

  /* ─── 404 / mauvais type ─── */
  if (notFound || !client) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-zinc-900 px-4">
        <p
          className={`text-sm text-gray-500 dark:text-white/50 text-center ${orbitron.className}`}
        >
          {t("notFound")}
        </p>
      </div>
    );
  }

  const isAgency = client.clientType === "AGENCY";

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
    href: client[f.key] ?? null,
  })).filter((l) => isSafeUrl(l.href));

  const TABS: {
    key: TabKey;
    icon: typeof InfoIcon;
    label: string;
    // count = undefined tant que la donnée n'est pas prête (pas de badge trompeur)
    count?: number;
  }[] = [
    { key: "about", icon: InfoIcon, label: t("tabs.about") },
    {
      key: "announcements",
      icon: MegaphoneIcon,
      label: t("tabs.announcementsPublic"),
      count:
        announcementsLoaded && announcements.length > 0
          ? announcements.length
          : undefined,
    },
    { key: "reviews", icon: StarIcon, label: t("tabs.reviews") },
  ];

  const salarySuffix = (period: string | null) => {
    if (period === "HEURE") return " /h";
    if (period === "JOUR") return " /j";
    if (period === "SEMAINE") return " /sem";
    if (period === "MOIS") return " /mois";
    return "";
  };

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className="min-h-screen bg-white dark:bg-zinc-900"
    >
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
              {client.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={client.image}
                  alt={client.name || t("unnamed")}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <span
                  className={`text-2xl sm:text-3xl font-semibold text-[#432dd7] ${orbitron.className}`}
                >
                  {client.name ? (
                    client.name.charAt(0).toUpperCase()
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
                {isAgency && client.companyName
                  ? client.companyName
                  : client.name || t("unnamed")}
              </h1>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-md bg-[#432dd7]/10 text-[#432dd7] text-[10px] sm:text-xs font-medium ${orbitron.className}`}
              >
                {isAgency ? t("clientTypes.AGENCY") : t("accountType.CLIENT")}
              </span>
            </div>

            <div className="flex items-center justify-center sm:justify-start gap-3 sm:gap-5 mt-2.5 sm:mt-3 flex-wrap">
              <div className="flex items-baseline gap-1">
                <span
                  className={`text-sm font-semibold text-gray-900 dark:text-white/90 ${orbitron.className}`}
                >
                  {stats?.bookingsCount ?? 0}
                </span>
                <span
                  className={`text-xs text-gray-500 dark:text-white/50 ${orbitron.className}`}
                >
                  {t("tabs.bookings")}
                </span>
              </div>
              <button
                onClick={() => setActiveTab("reviews")}
                className="flex items-baseline gap-1 cursor-pointer group"
              >
                <span
                  className={`text-sm font-semibold text-gray-900 dark:text-white/90 ${orbitron.className}`}
                >
                  {stats?.reviewsCount ?? 0}
                </span>
                <span
                  className={`text-xs text-gray-500 dark:text-white/50 group-hover:text-gray-900 dark:group-hover:text-white/80 transition-colors ${orbitron.className}`}
                >
                  {t("tabs.reviews")}
                </span>
              </button>
              {stats?.averageRating != null && (
                <span
                  className={`flex items-center gap-1 text-xs text-gray-500 dark:text-white/50 ${orbitron.className}`}
                >
                  <StarIcon size={12} weight="fill" className="text-yellow-500" />
                  {stats.averageRating.toFixed(1)}
                </span>
              )}
            </div>

            <div className="flex items-center justify-center sm:justify-start gap-2 mt-3 sm:mt-4 flex-wrap">
              <button
                onClick={handleShare}
                className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 flex items-center justify-center text-gray-900 dark:text-white/90 cursor-pointer transition-colors"
                aria-label={t("share")}
              >
                <ShareNetworkIcon size={18} />
              </button>
            </div>

            <div className="mt-3 sm:mt-4">
              <p
                className={`text-xs sm:text-sm text-gray-600 dark:text-white/50 wrap-break-words ${orbitron.className}`}
              >
                {client.bio || t("noBio")}
              </p>
            </div>

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

        {/* ═══════════════ SECTION AGENCE ═══════════════ */}
        {isAgency && (client.companyName || client.rccmNumber) && (
          <section className="border-t border-gray-100 dark:border-white/5 mt-5 sm:mt-6 pt-4 sm:pt-5">
            <h2
              className={`flex items-center gap-1.5 text-[10px] sm:text-xs uppercase tracking-wide text-gray-400 dark:text-white/40 mb-3 ${orbitron.className}`}
            >
              <BuildingsIcon size={16} />
              {t("agencyInfo")}
            </h2>
            <div className="flex flex-col gap-3">
              <ReadField label={t("companyName")} value={client.companyName} />
              <ReadField label={t("rccmNumber")} value={client.rccmNumber} />
            </div>
          </section>
        )}

        {/* ═══════════════ TABS ═══════════════ */}
        <div
          role="tablist"
          className="flex items-center border-t border-gray-100 dark:border-white/5 mt-5 sm:mt-6"
        >
          {TABS.map(({ key, icon: Icon, label, count }) => (
            <button
              key={key}
              role="tab"
              aria-selected={activeTab === key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 flex items-center justify-center gap-1.5 h-11 sm:h-12 text-xs sm:text-sm cursor-pointer border-b-2 transition-colors ${
                activeTab === key
                  ? "border-gray-900 dark:border-white text-gray-900 dark:text-white"
                  : "border-transparent text-gray-400 dark:text-white/40 hover:text-gray-700 dark:hover:text-white/70"
              } ${orbitron.className}`}
            >
              <Icon size={16} weight={activeTab === key ? "fill" : "regular"} />
              <span className="hidden sm:inline">{label}</span>
              {count !== undefined && count > 0 && (
                <span
                  className={`text-[10px] sm:text-xs ${
                    activeTab === key
                      ? "text-[#432dd7]"
                      : "text-gray-400 dark:text-white/30"
                  }`}
                >
                  ({count})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ═══════════════ CONTENU ═══════════════ */}
        <div className="pt-4 sm:pt-5">
          {/* ─── À PROPOS ─── */}
          {activeTab === "about" && (
            <div className="flex flex-col gap-5">
              {client.bio && (
                <section>
                  <h3
                    className={`text-xs uppercase tracking-wide text-gray-400 dark:text-white/40 mb-2 ${orbitron.className}`}
                  >
                    {t("bio")}
                  </h3>
                  <p
                    className={`text-sm text-gray-700 dark:text-white/70 leading-relaxed whitespace-pre-wrap ${orbitron.className}`}
                  >
                    {client.bio}
                  </p>
                </section>
              )}

              <section>
                <h3
                  className={`text-xs uppercase tracking-wide text-gray-400 dark:text-white/40 mb-2 ${orbitron.className}`}
                >
                  {t("details")}
                </h3>
                <div className="flex flex-col gap-3">
                  <ReadField
                    label={t("clientType")}
                    value={
                      client.clientType
                        ? t(`clientTypes.${client.clientType}`)
                        : null
                    }
                  />
                  {isAgency && (
                    <ReadField
                      label={t("companyName")}
                      value={client.companyName}
                    />
                  )}
                </div>
              </section>
            </div>
          )}

          {/* ─── ANNONCES ─── */}
          {activeTab === "announcements" && (
            <div>
              {/* Skeleton loader */}
              {announcementsLoading && (
                <ul className="flex flex-col gap-3">
                  {[0, 1, 2].map((i) => (
                    <li
                      key={i}
                      className="rounded-xl border border-gray-100 dark:border-white/5 p-4 animate-pulse"
                    >
                      <div className="h-4 w-1/3 rounded bg-gray-200 dark:bg-white/10 mb-2" />
                      <div className="h-3 w-1/2 rounded bg-gray-100 dark:bg-white/5 mb-2" />
                      <div className="h-3 w-3/4 rounded bg-gray-100 dark:bg-white/5" />
                    </li>
                  ))}
                </ul>
              )}

              {!announcementsLoading && announcementsError && (
                <div className="py-10 sm:py-14 flex flex-col items-center justify-center text-center px-4">
                  <MegaphoneIcon
                    size={32}
                    className="text-gray-300 dark:text-white/20 mb-2"
                  />
                  <p
                    className={`text-xs sm:text-sm text-red-500 dark:text-red-400/80 mb-3 ${orbitron.className}`}
                  >
                    {t("errors.announcementsLoadFailed")}
                  </p>
                  <button
                    onClick={() => {
                      setAnnouncementsLoaded(false);
                      setAnnouncementsError(false);
                      // force un re-render du useEffect
                      setActiveTab("about");
                      requestAnimationFrame(() => setActiveTab("announcements"));
                    }}
                    className={`text-sm text-[#432dd7] hover:underline cursor-pointer ${orbitron.className}`}
                  >
                    {t("videos.retry")}
                  </button>
                </div>
              )}

              {!announcementsLoading &&
                !announcementsError &&
                announcements.length === 0 && (
                  <div className="py-10 sm:py-14 flex flex-col items-center justify-center text-center px-4">
                    <MegaphoneIcon
                      size={32}
                      className="text-gray-300 dark:text-white/20 mb-2"
                    />
                    <p
                      className={`text-xs sm:text-sm text-gray-400 dark:text-white/40 ${orbitron.className}`}
                    >
                      {t("empty.announcementsPublic")}
                    </p>
                  </div>
                )}

              {!announcementsLoading &&
                !announcementsError &&
                announcements.length > 0 && (
                  <ul className="flex flex-col gap-3">
                    {announcements.map((a) => (
                      <li key={a.id}>
                        {/* ✅ <button> au lieu de <li onClick> : accessible au clavier */}
                        <button
                          type="button"
                          onClick={() =>
                            router.push(announcementDetailPath(a.id))
                          }
                          className={`w-full text-left rounded-xl border border-gray-100 dark:border-white/5 p-4 hover:border-gray-200 dark:hover:border-white/10 hover:bg-gray-50/50 dark:hover:bg-white/2 transition-colors cursor-pointer ${orbitron.className}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3
                                  className={`text-sm sm:text-base font-semibold text-gray-900 dark:text-white/90 truncate ${orbitron.className}`}
                                >
                                  {a.title}
                                </h3>
                                {a.isUrgent && (
                                  <span
                                    className={`text-[10px] px-1.5 py-0.5 rounded bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400 font-medium ${orbitron.className}`}
                                  >
                                    {t("urgent")}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                {a.jobType && (
                                  <span
                                    className={`text-xs text-gray-500 dark:text-white/40 ${orbitron.className}`}
                                  >
                                    {a.jobType.name}
                                  </span>
                                )}
                                {a.city && (
                                  <span
                                    className={`flex items-center gap-1 text-xs text-gray-500 dark:text-white/40 ${orbitron.className}`}
                                  >
                                    <MapPinIcon size={12} />
                                    {a.city}
                                  </span>
                                )}
                                {a.salaryMin != null && (
                                  <span
                                    className={`text-xs text-[#432dd7] dark:text-[#432dd7]/90 font-medium ${orbitron.className}`}
                                  >
                                    {a.salaryMin.toLocaleString()} FCFA
                                    {salarySuffix(a.salaryPeriod)}
                                  </span>
                                )}
                                <span
                                  className={`flex items-center gap-1 text-xs text-gray-400 dark:text-white/30 ${orbitron.className}`}
                                >
                                  <EyeIcon size={12} />
                                  {t("announcements.views", {
                                    count: a.viewCount,
                                  })}
                                </span>
                              </div>
                              {a.description && (
                                <p
                                  className={`text-xs text-gray-500 dark:text-white/40 mt-2 line-clamp-2 ${orbitron.className}`}
                                >
                                  {a.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
            </div>
          )}

          {/* ─── AVIS ─── */}
          {activeTab === "reviews" && (
            <div className="py-10 sm:py-14 flex flex-col items-center justify-center text-center px-4">
              <StarIcon
                size={32}
                className="text-gray-300 dark:text-white/20 mb-2"
              />
              <p
                className={`text-xs sm:text-sm text-gray-400 dark:text-white/40 ${orbitron.className}`}
              >
                {t("empty.reviews")}
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
      <span className="text-xs sm:text-sm text-gray-500 dark:text-white/50 shrink-0">
        {label}
      </span>
      <span className="text-sm text-gray-900 dark:text-white/90 truncate">
        {value || "—"}
      </span>
    </div>
  );
}