"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  UserIcon,
  CameraIcon,
  GearSixIcon,
  ShareNetworkIcon,
  BriefcaseIcon,
  ArrowLeftIcon,
  CalendarCheckIcon,
  StarIcon,
  VideoCameraIcon,
  XIcon,
  CheckIcon,
  LinkIcon,
  GlobeIcon,
  InstagramLogoIcon,
  FacebookLogoIcon,
  TiktokLogoIcon,
  LinkedinLogoIcon,
  YoutubeLogoIcon,
  XLogoIcon,
  EyeIcon,
  PlusIcon,
  PencilSimpleIcon,
  TrashIcon,
  MegaphoneIcon,
  MapPinIcon,
} from "@phosphor-icons/react";
import { orbitron } from "@/fonts/font";
import { updateUser } from "@/app/lib/auth-client";
import { useSession } from "@/app/context/SessionContext";
import SettingsPopover from "@/components/app/utils/settingsPopover";
import ImageCropModal from "@/components/app/profile/ImageCropModal";
import ProviderPublishServiceForm from "@/components/app/ProviderPublishServiceForm";
import { isSafeUrl } from "@/app/lib/security/url-validation";

type ProviderType =
  | "BABYSITTER"
  | "GARDE_PERISCOLAIRE"
  | "MENAGE"
  | "AIDE_PERSONNES_AGEES"
  | "RESIDENTIEL"
  | "COURT_TERME";

const PROVIDER_TYPES: ProviderType[] = [
  "BABYSITTER",
  "GARDE_PERISCOLAIRE",
  "MENAGE",
  "AIDE_PERSONNES_AGEES",
  "RESIDENTIEL",
  "COURT_TERME",
];

const CURRENCIES = ["XOF", "USD", "EUR"];

type SocialKey =
  | "website"
  | "instagram"
  | "facebook"
  | "tiktok"
  | "linkedin"
  | "youtube"
  | "twitter";

type ProviderUser = {
  id: string;
  name?: string | null;
  image?: string | null;
  bio?: string | null;
  accountType?: "PROVIDER" | "CLIENT" | "ADMIN";
  providerType?: ProviderType | null;
  hourlyRate?: number | null;
  currency?: string | null;
  website?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  tiktok?: string | null;
  linkedin?: string | null;
  youtube?: string | null;
  twitter?: string | null;
};

type Stats = {
  bookingsCount: number;
  reviewsCount: number;
  videosCount: number;
  averageRating: number | null;
};

type TabKey = "bookings" | "reviews" | "videos" | "announcements";

type MyAnnouncement = {
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
  updatedAt: string;
  jobType: { id: string; name: string; slug: string } | null;
  region: { id: string; name: string; slug: string } | null;
};

type AnnouncementsQuota = {
  used: number;
  max: number;
  remaining: number;
};

export default function ProviderPrivateProfilePage() {
  const t = useTranslations("ProfilePage");
  const locale = useLocale();
  const router = useRouter();
  const isRTL = locale === "ar";
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { user: sessionUser, loading: sessionLoading } = useSession();

  const [user, setUser] = useState<ProviderUser | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("bookings");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<ProviderUser>>({});

  // ─── Annonces / services publiés ───
  const [myAnnouncements, setMyAnnouncements] = useState<MyAnnouncement[]>([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(false);
  const [announcementsError, setAnnouncementsError] = useState<string | null>(null);
  const [announcementsQuota, setAnnouncementsQuota] = useState<AnnouncementsQuota | null>(null);
  const [publishServiceModalOpen, setPublishServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<MyAnnouncement | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ─── Hydratation depuis la session ───
  useEffect(() => {
    if (sessionLoading) return;
    setUser(sessionUser ? (sessionUser as unknown as ProviderUser) : null);
  }, [sessionUser, sessionLoading]);

  // ─── Sécurité : redirige les non-providers ───
  useEffect(() => {
    if (sessionLoading || !user) return;
    if (user.accountType !== "PROVIDER") {
      router.replace("/profile");
    }
  }, [user, sessionLoading, router]);

  // ─── Stats ───
  useEffect(() => {
    fetch("/api/profils/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setStats(d))
      .catch(() => {});
  }, []);

  // ─── Charger les annonces ───
  const loadMyAnnouncements = async () => {
    if (!user) return;
    setAnnouncementsLoading(true);
    setAnnouncementsError(null);
    try {
      const res = await fetch("/api/announcements/mine?limit=50");
      if (!res.ok) throw new Error("load failed");
      const data = await res.json();
      setMyAnnouncements(data.announcements || []);
      setAnnouncementsQuota(data.quota || null);
    } catch (err) {
      console.error("Erreur chargement annonces:", err);
      setAnnouncementsError(t("errors.announcementsLoadFailed"));
    } finally {
      setAnnouncementsLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    if (user.accountType === "PROVIDER") {
      loadMyAnnouncements();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleDeleteAnnouncement = async (id: string) => {
    if (!window.confirm(t("announcements.deleteConfirm"))) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/announcements/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("delete failed");
      setMyAnnouncements((prev) => prev.filter((a) => a.id !== id));
      loadMyAnnouncements();
    } catch (err) {
      console.error(err);
      setAnnouncementsError(t("errors.announcementDeleteFailed"));
    } finally {
      setDeletingId(null);
    }
  };

  const handleOpenPublishService = () => {
    setEditingService(null);
    setPublishServiceModalOpen(true);
  };

  const handleOpenEdit = (announcement: MyAnnouncement) => {
    setEditingService(announcement);
    setPublishServiceModalOpen(true);
  };

  const handleClosePublishServiceModal = () => {
    setPublishServiceModalOpen(false);
    setEditingService(null);
  };

  const startEditing = () => {
    if (!user) return;
    setForm({
      name: user.name,
      bio: user.bio,
      providerType: user.providerType,
      hourlyRate: user.hourlyRate,
      currency: user.currency ?? "XOF",
      website: user.website,
      instagram: user.instagram,
      facebook: user.facebook,
      tiktok: user.tiktok,
      linkedin: user.linkedin,
      youtube: user.youtube,
      twitter: user.twitter,
    });
    setError(null);
    setSuccess(null);
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setError(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const { error: err } = await updateUser({
        name: form.name || undefined,
        bio: form.bio ?? undefined,
        providerType: form.providerType ?? undefined,
        hourlyRate: form.hourlyRate ?? undefined,
        currency: form.currency ?? undefined,
        website: form.website || null,
        instagram: form.instagram || null,
        facebook: form.facebook || null,
        tiktok: form.tiktok || null,
        linkedin: form.linkedin || null,
        youtube: form.youtube || null,
        twitter: form.twitter || null,
      });

      if (err) {
        setError(err.message || t("errors.saveFailed"));
        return;
      }

      setUser((prev) => (prev ? ({ ...prev, ...form } as ProviderUser) : prev));
      setEditing(false);
      setSuccess(t("saved"));
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError(t("errors.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  // ─── Photo ───
  const handlePhotoClick = () => fileInputRef.current?.click();

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError(t("errors.invalidImage"));
    if (file.size > 5 * 1024 * 1024) return setError(t("errors.imageTooLarge"));

    setError(null);
    const reader = new FileReader();
    reader.onload = () => setCropImageSrc(reader.result as string);
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCropConfirm = async (blob: Blob) => {
    if (!user) return;
    setUploadingPhoto(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", blob, "avatar.jpg");

      const up = await fetch("/api/profils/avatar", { method: "POST", body: fd });
      if (!up.ok) return setError(t("errors.uploadFailed"));
      const { url } = await up.json();

      const { error: e2 } = await updateUser({ image: url });
      if (e2) return setError(t("errors.saveFailed"));

      setUser((prev) => (prev ? { ...prev, image: url } : prev));
      setCropImageSrc(null);
    } catch {
      setError(t("errors.uploadFailed"));
    } finally {
      setUploadingPhoto(false);
    }
  };

  // ─── Partage du profil PUBLIC ───
  const handleSharePublic = async () => {
    if (!user) return;
    const url = `${window.location.origin}/provider/${user.id}`;
    try {
      if (navigator.share) await navigator.share({ url });
      else await navigator.clipboard.writeText(url);
      setSuccess(t("linkCopied"));
      setTimeout(() => setSuccess(null), 2000);
    } catch {}
  };

  // ─── Loading / erreurs ───
  if (sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-zinc-900">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black/30 dark:border-white/30" />
      </div>
    );
  }

  if (!user || user.accountType !== "PROVIDER") {
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
    labelKey: string;
    placeholder: string;
    displayLabel: string;
  }[] = [
    { key: "website", icon: <GlobeIcon size={16} />, labelKey: "social.website", placeholder: "https://exemple.com", displayLabel: t("social.website") },
    { key: "instagram", icon: <InstagramLogoIcon size={16} />, labelKey: "social.instagram", placeholder: "https://instagram.com/...", displayLabel: t("social.instagram") },
    { key: "facebook", icon: <FacebookLogoIcon size={16} />, labelKey: "social.facebook", placeholder: "https://facebook.com/...", displayLabel: t("social.facebook") },
    { key: "tiktok", icon: <TiktokLogoIcon size={16} />, labelKey: "social.tiktok", placeholder: "https://tiktok.com/@...", displayLabel: t("social.tiktok") },
    { key: "linkedin", icon: <LinkedinLogoIcon size={16} />, labelKey: "social.linkedin", placeholder: "https://linkedin.com/in/...", displayLabel: t("social.linkedin") },
    { key: "youtube", icon: <YoutubeLogoIcon size={16} />, labelKey: "social.youtube", placeholder: "https://youtube.com/@...", displayLabel: t("social.youtube") },
    { key: "twitter", icon: <XLogoIcon size={16} />, labelKey: "social.twitter", placeholder: "https://x.com/...", displayLabel: t("social.twitter") },
  ];

  const socialLinks = SOCIAL_FIELDS.map((f) => ({ ...f, href: user[f.key] ?? null }))
    .filter((l) => isSafeUrl(l.href));

  const TABS: { key: TabKey; icon: typeof CalendarCheckIcon; label: string; count: number }[] = [
    { key: "bookings", icon: CalendarCheckIcon, label: t("tabs.bookings"), count: stats?.bookingsCount ?? 0 },
    { key: "reviews", icon: StarIcon, label: t("tabs.reviews"), count: stats?.reviewsCount ?? 0 },
    { key: "videos", icon: VideoCameraIcon, label: t("tabs.videos"), count: stats?.videosCount ?? 0 },
    {
      key: "announcements",
      icon: MegaphoneIcon,
      label: t("tabs.announcements"),
      count: myAnnouncements.length,
    },
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

        {/* ═══ EN-TÊTE ═══ */}
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 md:gap-8">
          <div className="relative shrink-0 mx-auto sm:mx-0">
            <div className="h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28 lg:h-32 lg:w-32 rounded-full overflow-hidden bg-[#432dd7]/10 flex items-center justify-center border border-black/5 dark:border-white/10">
              {user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.image} alt={user.name || t("unnamed")} className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl sm:text-3xl font-semibold text-[#432dd7]">
                  {user.name ? user.name.charAt(0).toUpperCase() : <UserIcon size={32} />}
                </span>
              )}
            </div>
            <button
              onClick={handlePhotoClick}
              disabled={uploadingPhoto}
              className="absolute bottom-0.5 right-0.5 sm:bottom-1 sm:right-1 h-7 w-7 sm:h-9 sm:w-9 rounded-full bg-[#432dd7] hover:bg-[#432dd7]/90 flex items-center justify-center text-white cursor-pointer disabled:opacity-50 transition-colors border-2 border-white dark:border-black"
              aria-label={t("changePhoto")}
            >
              {uploadingPhoto ? (
                <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white" />
              ) : (
                <CameraIcon size={16} weight="bold" />
              )}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
          </div>

          <div className="flex-1 min-w-0 text-center sm:text-start">
            <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
              {editing ? (
                <input
                  value={form.name || ""}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder={t("namePlaceholder")}
                  className={`text-base sm:text-lg font-semibold bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-3 h-10 text-gray-900 dark:text-white/90 focus:outline-none focus:border-[#432dd7] w-full sm:w-auto sm:max-w-xs ${orbitron.className}`}
                />
              ) : (
                <h1 className={`text-base sm:text-lg font-semibold text-gray-900 dark:text-white/90 truncate max-w-full ${orbitron.className}`}>
                  {user.name || t("unnamed")}
                </h1>
              )}
              <span className={`inline-flex items-center px-2 py-0.5 rounded-md bg-[#432dd7]/10 text-[#432dd7] text-[10px] sm:text-xs font-medium ${orbitron.className}`}>
                {t("accountType.PROVIDER")}
              </span>
            </div>

            {/* Stats */}
            <div className="flex items-center justify-center sm:justify-start gap-3 sm:gap-5 mt-2.5 sm:mt-3 flex-wrap">
              {TABS.map(({ key, count, label }) => (
                <button key={key} onClick={() => setActiveTab(key)} className="flex items-baseline gap-1 cursor-pointer group">
                  <span className={`text-sm font-semibold text-gray-900 dark:text-white/90 ${orbitron.className}`}>{count}</span>
                  <span className="text-xs text-gray-500 dark:text-white/50 group-hover:text-gray-900 dark:group-hover:text-white/80 transition-colors">{label}</span>
                </button>
              ))}
              {stats?.averageRating != null && (
                <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-white/50">
                  <StarIcon size={12} weight="fill" className="text-yellow-500" />
                  {stats.averageRating.toFixed(1)}
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-center sm:justify-start gap-2 mt-3 sm:mt-4 flex-wrap">
              {!editing ? (
                <>
                  {/* ✅ Bouton Publier un service */}
                  <button
                    onClick={handleOpenPublishService}
                    disabled={announcementsQuota?.remaining === 0}
                    className={`flex items-center gap-1.5 h-9 sm:h-10 px-4 rounded-lg bg-[#432dd7] hover:bg-[#432dd7]/90 text-xs sm:text-sm text-white cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${orbitron.className}`}
                  >
                    <PlusIcon size={14} weight="bold" />
                    <span className="hidden sm:inline">{t("publishService")}</span>
                    <span className="sm:hidden">{t("publishServiceShort")}</span>
                  </button>

                  <button
                    onClick={startEditing}
                    className={`h-9 sm:h-10 px-4 rounded-lg bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 text-xs sm:text-sm text-gray-900 dark:text-white/90 cursor-pointer transition-colors ${orbitron.className}`}
                  >
                    {t("editProfile")}
                  </button>

                  <button
                    onClick={() => router.push(`/provider/${user.id}`)}
                    className={`flex items-center gap-1.5 h-9 sm:h-10 px-3 rounded-lg bg-[#432dd7]/10 text-[#432dd7] hover:bg-[#432dd7]/20 text-xs sm:text-sm cursor-pointer transition-colors ${orbitron.className}`}
                  >
                    <EyeIcon size={16} />
                    <span className="hidden sm:inline">{t("viewPublicProfile")}</span>
                  </button>

                  <button
                    onClick={() => setSettingsOpen(true)}
                    className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 flex items-center justify-center text-gray-900 dark:text-white/90 cursor-pointer transition-colors"
                    aria-label={t("settings")}
                  >
                    <GearSixIcon size={18} />
                  </button>
                  <button
                    onClick={handleSharePublic}
                    className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 flex items-center justify-center text-gray-900 dark:text-white/90 cursor-pointer transition-colors"
                    aria-label={t("share")}
                  >
                    <ShareNetworkIcon size={18} />
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={cancelEditing}
                    disabled={saving}
                    className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 h-9 sm:h-10 px-3 sm:px-4 rounded-lg border border-gray-200 dark:border-white/10 text-xs sm:text-sm text-gray-600 dark:text-white/60 hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer disabled:opacity-40 transition-colors ${orbitron.className}`}
                  >
                    <XIcon size={16} /> {t("cancel")}
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 h-9 sm:h-10 px-3 sm:px-4 rounded-lg bg-[#432dd7] hover:bg-[#432dd7]/90 text-xs sm:text-sm text-white cursor-pointer disabled:opacity-50 transition-colors ${orbitron.className}`}
                  >
                    <CheckIcon size={16} weight="bold" />
                    {saving ? t("saving") : t("save")}
                  </button>
                </div>
              )}
            </div>

            {/* Bio */}
            <div className="mt-3 sm:mt-4">
              {editing ? (
                <textarea
                  value={form.bio || ""}
                  onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                  placeholder={t("bioPlaceholder")}
                  rows={3}
                  maxLength={500}
                  className={`w-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg p-3 text-xs sm:text-sm text-gray-900 dark:text-white/90 placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-[#432dd7] resize-none ${orbitron.className}`}
                />
              ) : (
                <p className={`text-xs sm:text-sm text-gray-600 dark:text-white/50 wrap-break-words ${orbitron.className}`}>
                  {user.bio || t("noBio")}
                </p>
              )}
            </div>

            {/* Réseaux sociaux (affichage) */}
            {!editing && socialLinks.length > 0 && (
              <div className={`flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3 ${orbitron.className}`}>
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

        {/* Erreur / succès */}
        {error && <p className={`text-xs sm:text-sm text-red-500 dark:text-red-400 mt-3 sm:mt-4 ${orbitron.className}`}>{error}</p>}
        {success && <p className={`text-xs sm:text-sm text-green-600 dark:text-green-400 mt-3 sm:mt-4 ${orbitron.className}`}>{success}</p>}

        {/* ═══ SECTION PROVIDER (édition) ═══ */}
        {editing && (
          <section className="border-t border-gray-100 dark:border-white/5 mt-5 sm:mt-6 pt-4 sm:pt-5">
            <h2 className={`flex items-center gap-1.5 text-[10px] sm:text-xs uppercase tracking-wide text-gray-400 dark:text-white/40 mb-3 ${orbitron.className}`}>
              <BriefcaseIcon size={16} /> {t("providerInfo")}
            </h2>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <span className="text-xs sm:text-sm text-gray-500 dark:text-white/50 shrink-0">{t("providerType")}</span>
                <select
                  value={form.providerType || ""}
                  onChange={(e) => setForm((f) => ({ ...f, providerType: e.target.value as ProviderType }))}
                  className="h-10 px-3 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs sm:text-sm text-gray-900 dark:text-white/90 focus:outline-none focus:border-[#432dd7] w-full sm:w-auto sm:min-w-48"
                >
                  <option value="">{t("select")}</option>
                  {PROVIDER_TYPES.map((pt) => (
                    <option key={pt} value={pt}>{t(`providerTypes.${pt}`)}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <span className="text-xs sm:text-sm text-gray-500 dark:text-white/50 shrink-0">{t("hourlyRate")}</span>
                <div className="flex gap-2 w-full sm:w-auto">
                  <input
                    type="number"
                    min={0}
                    value={form.hourlyRate ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, hourlyRate: e.target.value ? Number(e.target.value) : undefined }))}
                    placeholder="0"
                    className="flex-1 sm:flex-none sm:w-28 h-10 px-3 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs sm:text-sm text-gray-900 dark:text-white/90 focus:outline-none focus:border-[#432dd7]"
                  />
                  <select
                    value={form.currency || "XOF"}
                    onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                    className="h-10 px-2 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs sm:text-sm text-gray-900 dark:text-white/90 focus:outline-none focus:border-[#432dd7]"
                  >
                    {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ═══ RÉSEAUX SOCIAUX (édition) ═══ */}
        {editing && (
          <section className="border-t border-gray-100 dark:border-white/5 mt-5 sm:mt-6 pt-4 sm:pt-5">
            <h2 className={`flex items-center gap-1.5 text-[10px] sm:text-xs uppercase tracking-wide text-gray-400 dark:text-white/40 mb-3 ${orbitron.className}`}>
              <LinkIcon size={16} /> {t("socialNetworks")}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SOCIAL_FIELDS.map(({ key, icon, labelKey, placeholder }) => (
                <div key={key} className="flex items-center gap-2">
                  <span className="text-gray-400 dark:text-white/40 shrink-0">{icon}</span>
                  <div className="flex-1">
                    <label className="block text-[10px] sm:text-xs text-gray-500 dark:text-white/50 mb-1">{t(labelKey)}</label>
                    <input
                      type="url"
                      value={form[key] || ""}
                      onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                      placeholder={placeholder}
                      className="w-full h-9 px-3 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs text-gray-900 dark:text-white/90 placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-[#432dd7]"
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ═══ TABS ═══ */}
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

        {/* ═══ CONTENU DES ONGLETS ═══ */}
        {activeTab === "announcements" ? (
          <div className="pt-4 sm:pt-5">
            {announcementsQuota && (
              <div className="flex items-center justify-between mb-4 px-1">
                <p className={`text-xs text-gray-500 dark:text-white/40 ${orbitron.className}`}>
                  {t("announcements.quota", {
                    used: announcementsQuota.used,
                    max: announcementsQuota.max,
                  })}
                </p>
                {announcementsQuota.remaining === 0 && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-md bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400 ${orbitron.className}`}>
                    {t("announcements.quotaFull")}
                  </span>
                )}
              </div>
            )}

            {announcementsLoading && (
              <div className="flex items-center justify-center py-10">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black/30 dark:border-white/30" />
              </div>
            )}

            {!announcementsLoading && announcementsError && (
              <p className={`text-sm text-red-500 dark:text-red-400/80 text-center py-8 ${orbitron.className}`}>
                {announcementsError}
              </p>
            )}

            {!announcementsLoading && !announcementsError && myAnnouncements.length === 0 && (
              <div className="py-10 sm:py-14 flex flex-col items-center justify-center text-center px-4">
                <MegaphoneIcon size={32} className="text-gray-300 dark:text-white/20 mb-2" />
                <p className={`text-xs sm:text-sm text-gray-400 dark:text-white/40 mb-4 ${orbitron.className}`}>
                  {t("empty.announcements")}
                </p>
                <button
                  onClick={handleOpenPublishService}
                  className={`flex items-center gap-1.5 h-10 px-4 rounded-lg bg-[#432dd7] hover:bg-[#432dd7]/90 text-sm text-white cursor-pointer transition-colors ${orbitron.className}`}
                >
                  <PlusIcon size={14} weight="bold" />
                  {t("empty.announcementsCta")}
                </button>
              </div>
            )}

            {!announcementsLoading && !announcementsError && myAnnouncements.length > 0 && (
              <ul className="flex flex-col gap-3">
                {myAnnouncements.map((a) => (
                  <li
                    key={a.id}
                    className="rounded-xl border border-gray-100 dark:border-white/5 p-4 hover:border-gray-200 dark:hover:border-white/10 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className={`text-sm sm:text-base font-semibold text-gray-900 dark:text-white/90 truncate ${orbitron.className}`}>
                          {a.title}
                        </h3>
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                          {a.jobType && (
                            <span className={`text-xs text-gray-500 dark:text-white/40 ${orbitron.className}`}>
                              {a.jobType.name}
                            </span>
                          )}
                          {a.city && (
                            <span className={`flex items-center gap-1 text-xs text-gray-500 dark:text-white/40 ${orbitron.className}`}>
                              <MapPinIcon size={12} />
                              {a.city}
                            </span>
                          )}
                          {a.salaryMin != null && (
                            <span className={`text-xs text-[#432dd7] dark:text-[#432dd7]/90 font-medium ${orbitron.className}`}>
                              {a.salaryMin.toLocaleString()} FCFA
                              {a.salaryPeriod === "HEURE" && "/h"}
                              {a.salaryPeriod === "JOUR" && "/j"}
                              {a.salaryPeriod === "SEMAINE" && "/sem"}
                              {a.salaryPeriod === "MOIS" && "/mois"}
                            </span>
                          )}
                          <span className={`flex items-center gap-1 text-xs text-gray-400 dark:text-white/30 ${orbitron.className}`}>
                            <EyeIcon size={12} />
                            {t("announcements.views", { count: a.viewCount })}
                          </span>
                        </div>
                        {a.description && (
                          <p className={`text-xs text-gray-500 dark:text-white/40 mt-2 line-clamp-2 ${orbitron.className}`}>
                            {a.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleOpenEdit(a)}
                          className="h-8 w-8 rounded-lg bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 flex items-center justify-center text-gray-700 dark:text-white/70 cursor-pointer transition-colors"
                          aria-label={t("announcements.edit")}
                          title={t("announcements.edit")}
                        >
                          <PencilSimpleIcon size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteAnnouncement(a.id)}
                          disabled={deletingId === a.id}
                          className="h-8 w-8 rounded-lg bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 flex items-center justify-center text-red-500 cursor-pointer transition-colors disabled:opacity-40"
                          aria-label={t("announcements.delete")}
                          title={t("announcements.delete")}
                        >
                          {deletingId === a.id ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-500" />
                          ) : (
                            <TrashIcon size={14} />
                          )}
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <div className="py-10 sm:py-14 flex flex-col items-center justify-center text-center px-4">
            {activeTab === "bookings" && (
              <>
                <CalendarCheckIcon size={32} className="text-gray-300 dark:text-white/20 mb-2" />
                <p className={`text-xs sm:text-sm text-gray-400 dark:text-white/40 ${orbitron.className}`}>{t("empty.bookings")}</p>
              </>
            )}
            {activeTab === "reviews" && (
              <>
                <StarIcon size={32} className="text-gray-300 dark:text-white/20 mb-2" />
                <p className={`text-xs sm:text-sm text-gray-400 dark:text-white/40 ${orbitron.className}`}>{t("empty.reviews")}</p>
              </>
            )}
            {activeTab === "videos" && (
              <>
                <VideoCameraIcon size={32} className="text-gray-300 dark:text-white/20 mb-2" />
                <p className={`text-xs sm:text-sm text-gray-400 dark:text-white/40 ${orbitron.className}`}>{t("empty.videos")}</p>
              </>
            )}
          </div>
        )}
      </div>

      {/* ═══ MODALES ═══ */}
      <ProviderPublishServiceForm
        open={publishServiceModalOpen}
        onClose={handleClosePublishServiceModal}
        onSuccess={loadMyAnnouncements}
        service={editingService}
      />

      <SettingsPopover open={settingsOpen} onClose={() => setSettingsOpen(false)} />

      {cropImageSrc && (
        <ImageCropModal
          imageSrc={cropImageSrc}
          onCancel={() => setCropImageSrc(null)}
          onConfirm={handleCropConfirm}
          processing={uploadingPhoto}
        />
      )}
    </div>
  );
}