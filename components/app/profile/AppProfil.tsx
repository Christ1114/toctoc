"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  UserIcon,
  CameraIcon,
  GearSixIcon,
  ShareNetworkIcon,
  CheckCircleIcon,
  BriefcaseIcon,
  BuildingsIcon,
  ArrowLeftIcon,
  CalendarCheckIcon,
  StarIcon,
  HeartIcon,
  XIcon,
  CheckIcon,
} from "@phosphor-icons/react";
import { orbitron } from "@/fonts/font";
import { getSession, updateUser } from "@/app/lib/auth-client";
import { createClient } from "@supabase/supabase-js";
import SettingsPopover from "@/components/app/utils/settingsPopover";

type AccountType = "CLIENT" | "PROVIDER" | "ADMIN";
type ClientType = "INDIVIDUAL" | "AGENCY";
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

type ProfileUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  emailVerified?: boolean;
  phone?: string | null;
  phoneVerified?: boolean;
  image?: string | null;
  bio?: string | null;
  accountType?: AccountType;
  clientType?: ClientType | null;
  companyName?: string | null;
  rccmNumber?: string | null;
  providerType?: ProviderType | null;
  hourlyRate?: number | null;
  currency?: string | null;
  createdAt?: Date | string;
};

type Stats = {
  bookingsCount: number;
  reviewsCount: number;
  favoritesCount: number;
  averageRating: number | null;
};

type TabKey = "bookings" | "reviews" | "favorites";

async function getAuthedSupabaseClient() {
  const res = await fetch("/api/notifications/realtime-token");
  const { token } = await res.json();
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
}

export default function ProfilePage() {
  const t = useTranslations("ProfilePage");
  const locale = useLocale();
  const router = useRouter();
  const isRTL = locale === "ar";
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [user, setUser] = useState<ProfileUser | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("bookings");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<ProfileUser>>({});

  const loadUser = async () => {
    setLoadingUser(true);
    try {
      const { session } = await getSession();
      if (session?.user) {
        setUser(session.user as unknown as ProfileUser);
      }
    } catch (err) {
      console.error("Erreur chargement profil:", err);
    } finally {
      setLoadingUser(false);
    }
  };

  const loadStats = async () => {
    try {
      const res = await fetch("/api/profile/stats");
      if (res.ok) {
        setStats(await res.json());
      }
    } catch (err) {
      console.error("Erreur chargement stats:", err);
    }
  };

  useEffect(() => {
    loadUser();
    loadStats();
  }, []);

  const startEditing = () => {
    if (!user) return;
    setForm({
      name: user.name,
      bio: user.bio,
      clientType: user.clientType,
      companyName: user.companyName,
      rccmNumber: user.rccmNumber,
      providerType: user.providerType,
      hourlyRate: user.hourlyRate,
      currency: user.currency ?? "XOF",
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
        companyName: form.companyName ?? undefined,
        rccmNumber: form.rccmNumber ?? undefined,
        clientType: form.clientType ?? undefined,
        providerType: form.providerType ?? undefined,
        hourlyRate: form.hourlyRate ?? undefined,
        currency: form.currency ?? undefined,
      });

      if (err) {
        setError(err.message || t("errors.saveFailed"));
        return;
      }

      await loadUser();
      setEditing(false);
      setSuccess(t("saved"));
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(t("errors.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoClick = () => fileInputRef.current?.click();

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      setError(t("errors.invalidImage"));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError(t("errors.imageTooLarge"));
      return;
    }

    setUploadingPhoto(true);
    setError(null);
    try {
      const authedSupabase = await getAuthedSupabaseClient();
      const ext = file.name.split(".").pop();
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;

      const { error: uploadError } = await authedSupabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });

      if (uploadError) {
        setError(t("errors.uploadFailed"));
        return;
      }

      const { data: publicUrlData } = authedSupabase.storage.from("avatars").getPublicUrl(path);

      const { error: updateError } = await updateUser({ image: publicUrlData.publicUrl });
      if (updateError) {
        setError(t("errors.saveFailed"));
        return;
      }

      await loadUser();
    } catch (err) {
      console.error("Erreur upload photo:", err);
      setError(t("errors.uploadFailed"));
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ url });
      } else {
        await navigator.clipboard.writeText(url);
        setSuccess(t("linkCopied"));
        setTimeout(() => setSuccess(null), 2000);
      }
    } catch {
     
    }
  };

  if (loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-zinc-900">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black/30 dark:border-white/30" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-zinc-900">
        <p className={`text-sm text-gray-500 dark:text-white/50 ${orbitron.className}`}>{t("notFound")}</p>
      </div>
    );
  }

  const isAgencyClient = user.accountType === "CLIENT" && user.clientType === "AGENCY";
  const isProvider = user.accountType === "PROVIDER";

  const TABS: { key: TabKey; icon: typeof CalendarCheckIcon; label: string; count: number }[] = [
    { key: "bookings", icon: CalendarCheckIcon, label: t("tabs.bookings"), count: stats?.bookingsCount ?? 0 },
    { key: "reviews", icon: StarIcon, label: t("tabs.reviews"), count: stats?.reviewsCount ?? 0 },
    { key: "favorites", icon: HeartIcon, label: t("tabs.favorites"), count: stats?.favoritesCount ?? 0 },
  ];

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="min-h-screen bg-white dark:bg-zinc-900">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        {/* Retour */}
        <button
          onClick={() => router.back()}
          className={`flex items-center gap-1.5 text-sm text-gray-500 dark:text-white/50 hover:text-gray-900 dark:hover:text-white/90 cursor-pointer mb-6 transition-colors ${orbitron.className}`}
        >
          <ArrowLeftIcon size={16} className={isRTL ? "rotate-180" : ""} />
          {t("back")}
        </button>

        {/* En-tête façon TikTok : avatar large à gauche, identité + stats + actions à droite */}
        <div className="flex flex-col sm:flex-row gap-5 sm:gap-8">
          <div className="relative shrink-0 mx-auto sm:mx-0">
            <div className="h-28 w-28 sm:h-32 sm:w-32 rounded-full overflow-hidden bg-[#432dd7]/10 flex items-center justify-center border border-black/5 dark:border-white/10">
              {user.image ? (
                <img src={user.image} alt={user.name || t("unnamed")} className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-semibold text-[#432dd7]">
                  {user.name ? user.name.charAt(0).toUpperCase() : <UserIcon size={36} />}
                </span>
              )}
            </div>
            <button
              onClick={handlePhotoClick}
              disabled={uploadingPhoto}
              className="absolute bottom-1 right-1 h-8 w-8 rounded-full bg-[#432dd7] hover:bg-[#432dd7]/90 flex items-center justify-center text-white cursor-pointer disabled:opacity-50 transition-colors border-2 border-white dark:border-black"
              aria-label={t("changePhoto")}
            >
              {uploadingPhoto ? (
                <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white" />
              ) : (
                <CameraIcon size={14} weight="bold" />
              )}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
          </div>

          <div className="flex-1 min-w-0 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
              {editing ? (
                <input
                  value={form.name || ""}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder={t("namePlaceholder")}
                  className={`text-lg font-semibold bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-3 h-10 text-gray-900 dark:text-white/90 focus:outline-none focus:border-[#432dd7] ${orbitron.className}`}
                />
              ) : (
                <h1 className={`text-lg font-semibold text-gray-900 dark:text-white/90 ${orbitron.className}`}>
                  {user.name || t("unnamed")}
                </h1>
              )}
              {user.accountType && (
                <span className={`inline-flex items-center px-2 py-0.5 rounded-md bg-[#432dd7]/10 text-[#432dd7] text-xs font-medium ${orbitron.className}`}>
                  {t(`accountType.${user.accountType}`)}
                </span>
              )}
            </div>

            {/* Ligne de stats, façon "173 Suivis  4 Followers  0 J'aime" */}
            <div className="flex items-center justify-center sm:justify-start gap-4 sm:gap-5 mt-3">
              {TABS.map(({ key, count, label }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className="flex items-baseline gap-1 cursor-pointer group"
                >
                  <span className={`text-sm font-semibold text-gray-900 dark:text-white/90 ${orbitron.className}`}>
                    {count}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-white/50 group-hover:text-gray-900 dark:group-hover:text-white/80 transition-colors">
                    {label}
                  </span>
                </button>
              ))}
              {isProvider && stats?.averageRating != null && (
                <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-white/50">
                  <StarIcon size={12} weight="fill" className="text-yellow-500" />
                  {stats.averageRating.toFixed(1)}
                </span>
              )}
            </div>

            {/* Boutons d'action, façon "Modifier le profil" + engrenage + partage */}
            <div className="flex items-center justify-center sm:justify-start gap-2 mt-4">
              {!editing ? (
                <>
                  <button
                    onClick={startEditing}
                    className={`h-9 px-4 rounded-lg bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 text-sm text-gray-900 dark:text-white/90 cursor-pointer transition-colors ${orbitron.className}`}
                  >
                    {t("editProfile")}
                  </button>
                  <button
                    onClick={() => setSettingsOpen(true)}
                    className="h-9 w-9 rounded-full bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 flex items-center justify-center text-gray-900 dark:text-white/90 cursor-pointer transition-colors"
                    aria-label={t("settings")}
                  >
                    <GearSixIcon size={16} />
                  </button>
                  <button
                    onClick={handleShare}
                    className="h-9 w-9 rounded-full bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 flex items-center justify-center text-gray-900 dark:text-white/90 cursor-pointer transition-colors"
                    aria-label={t("share")}
                  >
                    <ShareNetworkIcon size={16} />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={cancelEditing}
                    disabled={saving}
                    className={`flex items-center gap-1.5 h-9 px-3 rounded-lg border border-gray-200 dark:border-white/10 text-sm text-gray-600 dark:text-white/60 hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer disabled:opacity-40 transition-colors ${orbitron.className}`}
                  >
                    <XIcon size={14} />
                    {t("cancel")}
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className={`flex items-center gap-1.5 h-9 px-3 rounded-lg bg-[#432dd7] hover:bg-[#432dd7]/90 text-sm text-white cursor-pointer disabled:opacity-50 transition-colors ${orbitron.className}`}
                  >
                    <CheckIcon size={14} weight="bold" />
                    {saving ? t("saving") : t("save")}
                  </button>
                </>
              )}
            </div>

            {/* Bio */}
            <div className="mt-4">
              {editing ? (
                <textarea
                  value={form.bio || ""}
                  onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                  placeholder={t("bioPlaceholder")}
                  rows={3}
                  maxLength={500}
                  className="w-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg p-3 text-sm text-gray-900 dark:text-white/90 placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-[#432dd7] resize-none"
                />
              ) : (
                <p className="text-sm text-gray-600 dark:text-white/50">
                  {user.bio || t("noBio")}
                </p>
              )}
            </div>
          </div>
        </div>

        {error && <p className={`text-sm text-red-500 dark:text-red-400 mt-4 ${orbitron.className}`}>{error}</p>}
        {success && <p className={`text-sm text-green-600 dark:text-green-400 mt-4 ${orbitron.className}`}>{success}</p>}

        {/* Champs spécifiques (uniquement visibles en édition ou si déjà remplis) */}
        {editing && (isAgencyClient || form.clientType === "AGENCY") && (
          <section className="border-t border-gray-100 dark:border-white/5 mt-6 pt-5">
            <h2 className={`flex items-center gap-1.5 text-xs uppercase tracking-wide text-gray-400 dark:text-white/40 mb-3 ${orbitron.className}`}>
              <BuildingsIcon size={14} />
              {t("agencyInfo")}
            </h2>
            <div className="flex flex-col gap-3">
              <Field
                label={t("companyName")}
                editing
                value={form.companyName || ""}
                onChange={(v) => setForm((f) => ({ ...f, companyName: v }))}
                placeholder={t("companyNamePlaceholder")}
              />
              <Field
                label={t("rccmNumber")}
                editing
                value={form.rccmNumber || ""}
                onChange={(v) => setForm((f) => ({ ...f, rccmNumber: v }))}
                placeholder={t("rccmPlaceholder")}
              />
            </div>
          </section>
        )}

        {editing && isProvider && (
          <section className="border-t border-gray-100 dark:border-white/5 mt-6 pt-5">
            <h2 className={`flex items-center gap-1.5 text-xs uppercase tracking-wide text-gray-400 dark:text-white/40 mb-3 ${orbitron.className}`}>
              <BriefcaseIcon size={14} />
              {t("providerInfo")}
            </h2>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <span className="text-xs sm:text-sm text-gray-500 dark:text-white/50 shrink-0">{t("providerType")}</span>
                <select
                  value={form.providerType || ""}
                  onChange={(e) => setForm((f) => ({ ...f, providerType: e.target.value as ProviderType }))}
                  className="h-9 px-3 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white/90 focus:outline-none focus:border-[#432dd7]"
                >
                  <option value="">{t("select")}</option>
                  {PROVIDER_TYPES.map((pt) => (
                    <option key={pt} value={pt}>
                      {t(`providerTypes.${pt}`)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <span className="text-xs sm:text-sm text-gray-500 dark:text-white/50 shrink-0">{t("hourlyRate")}</span>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={0}
                    value={form.hourlyRate ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, hourlyRate: e.target.value ? Number(e.target.value) : undefined }))
                    }
                    placeholder="0"
                    className="w-28 h-9 px-3 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white/90 focus:outline-none focus:border-[#432dd7]"
                  />
                  <select
                    value={form.currency || "XOF"}
                    onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                    className="h-9 px-2 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white/90 focus:outline-none focus:border-[#432dd7]"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Onglets façon "Vidéos / Favoris / Aimé" */}
        <div className="flex items-center border-t border-gray-100 dark:border-white/5 mt-6">
          {TABS.map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 flex items-center justify-center gap-1.5 h-12 text-sm cursor-pointer border-b-2 transition-colors ${
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

        {/* Contenu de l'onglet actif — état vide pour l'instant, à brancher plus tard */}
        <div className="py-14 flex flex-col items-center justify-center text-center">
          {activeTab === "bookings" && (
            <>
              <CalendarCheckIcon size={32} className="text-gray-300 dark:text-white/20 mb-2" />
              <p className={`text-sm text-gray-400 dark:text-white/40 ${orbitron.className}`}>{t("empty.bookings")}</p>
            </>
          )}
          {activeTab === "reviews" && (
            <>
              <StarIcon size={32} className="text-gray-300 dark:text-white/20 mb-2" />
              <p className={`text-sm text-gray-400 dark:text-white/40 ${orbitron.className}`}>{t("empty.reviews")}</p>
            </>
          )}
          {activeTab === "favorites" && (
            <>
              <HeartIcon size={32} className="text-gray-300 dark:text-white/20 mb-2" />
              <p className={`text-sm text-gray-400 dark:text-white/40 ${orbitron.className}`}>{t("empty.favorites")}</p>
            </>
          )}
        </div>

        {/* Contact, lecture seule — la vérification se gère dans les paramètres */}
        <section className="border-t border-gray-100 dark:border-white/5 pt-5">
          <h2 className={`text-xs uppercase tracking-wide text-gray-400 dark:text-white/40 mb-3 ${orbitron.className}`}>
            {t("contact")}
          </h2>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-gray-900 dark:text-white/90 truncate">{user.email || "—"}</span>
              {user.email && user.emailVerified && (
                <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 shrink-0">
                  <CheckCircleIcon size={14} weight="fill" />
                  {t("verified")}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-gray-900 dark:text-white/90 truncate">{user.phone || "—"}</span>
              {user.phone && user.phoneVerified && (
                <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 shrink-0">
                  <CheckCircleIcon size={14} weight="fill" />
                  {t("verified")}
                </span>
              )}
            </div>
          </div>
        </section>
      </div>

      <SettingsPopover open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}

function Field({
  label,
  editing,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  editing: boolean;
  value?: string | null;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
      <span className="text-xs sm:text-sm text-gray-500 dark:text-white/50 shrink-0">{label}</span>
      {editing ? (
        <input
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="h-9 px-3 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white/90 placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-[#432dd7] w-full sm:w-56"
        />
      ) : (
        <span className="text-sm text-gray-900 dark:text-white/90 truncate">{value || "—"}</span>
      )}
    </div>
  );
}