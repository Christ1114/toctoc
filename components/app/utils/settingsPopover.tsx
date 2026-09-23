"use client";

import { useState, useEffect, useCallback } from "react";
import {
  GearSixIcon,
  UserIcon,
  XIcon,
  SunIcon,
  MoonIcon,
  DesktopIcon,
  CheckCircleIcon,
  DeviceMobileIcon,
  GooglePlayLogo,
  AppleLogo,
  DownloadSimpleIcon,
  SignOutIcon,
  TrashIcon,
  WarningCircleIcon,
  ClockIcon,
} from "@phosphor-icons/react";
import Popover from "../utils/Popover";
import { orbitron } from "@/fonts/font";
import { useTranslations, useLocale } from "next-intl";
import { useTheme } from "next-themes";
import { useRouter } from "@/i18n/navigation";   // ✅ i18n router
import QRCode from "qrcode";
import { signOut, authClient } from "@/app/lib/auth-client";
import { useSession } from "@/app/context/SessionContext";

/* ═══════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════ */

type SettingsTab = "general" | "profile" | "download";

type SettingsPopoverProps = {
  open: boolean;
  onClose: () => void;
};

type UserData = {
  id: string;
  name?: string | null;
  email?: string | null;
  emailVerified?: boolean;
  phone?: string | null;
  phoneVerified?: boolean;
};

const PHONE_VERIFICATION_ENABLED = false;

const THEMES = [
  { key: "light", icon: SunIcon },
  { key: "dark", icon: MoonIcon },
  { key: "system", icon: DesktopIcon },
] as const;

/* ═══════════════════════════════════════════════════════════
   COMPOSANT
   ═══════════════════════════════════════════════════════════ */

export default function SettingsPopover({ open, onClose }: SettingsPopoverProps) {
  const t = useTranslations("SettingsPopover");
  const locale = useLocale();
  const isRTL = locale === "ar";
  const router = useRouter();

  const [tab, setTab] = useState<SettingsTab>("general");
  const { theme, setTheme } = useTheme();

  const { user: sessionUser, loading: sessionLoading, refresh } = useSession();

  const user: UserData | null = sessionUser
    ? (sessionUser as unknown as UserData)
    : null;

  const loadingUser = sessionLoading;

  const [emailOtpStep, setEmailOtpStep] = useState<"idle" | "sent">("idle");
  const [emailOtpCode, setEmailOtpCode] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [emailVerifying, setEmailVerifying] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const TABS = [
    { key: "general" as const, icon: GearSixIcon, label: t("general") },
    { key: "profile" as const, icon: UserIcon, label: t("profile") },
    { key: "download" as const, icon: DeviceMobileIcon, label: t("download") },
  ];

  /* ─── Reset des états à l'ouverture ─── */
  useEffect(() => {
    if (!open) return;
    setEmailOtpStep("idle");
    setEmailOtpCode("");
    setEmailError(null);
    setLogoutError(null);
    setDeleteError(null);
    setShowDeleteConfirm(false);
  }, [open]);

  /* ─── Génération du QR code (une seule fois) ─── */
  useEffect(() => {
    if (!open || qrDataUrl) return;

    const placeholderData = `https://toctoc.app/download?ref=${Math.random()
      .toString(36)
      .slice(2, 10)}`;

    QRCode.toDataURL(placeholderData, {
      width: 256,
      margin: 1,
      color: { dark: "#432dd7", light: "#ffffff" },
    })
      .then(setQrDataUrl)
      .catch((err) => {
        if (process.env.NODE_ENV === "development") {
          console.error("[QRCode]", err);
        }
      });
  }, [open, qrDataUrl]);

  /* ═══════════════════════════════════════════════════════
     EMAIL OTP
     ═══════════════════════════════════════════════════════ */

  const handleSendEmailOtp = useCallback(async () => {
    if (!user?.email) return;
    setEmailSending(true);
    setEmailError(null);
    try {
      const { error } = await authClient.emailOtp.sendVerificationOtp({
        email: user.email,
        type: "email-verification",
      });
      if (error) {
        setEmailError(error.message || t("errors.emailSendFailed"));
      } else {
        setEmailOtpStep("sent");
      }
    } catch {
      setEmailError(t("errors.emailSendFailed"));
    } finally {
      setEmailSending(false);
    }
  }, [user?.email, t]);

  const handleVerifyEmailOtp = useCallback(async () => {
    if (!user?.email || !emailOtpCode.trim()) return;
    setEmailVerifying(true);
    setEmailError(null);
    try {
      const { error } = await authClient.emailOtp.verifyEmail({
        email: user.email,
        otp: emailOtpCode.trim(),
      });
      if (error) {
        setEmailError(error.message || t("errors.emailVerifyFailed"));
      } else {
        await refresh();
        setEmailOtpStep("idle");
        setEmailOtpCode("");
      }
    } catch {
      setEmailError(t("errors.emailVerifyFailed"));
    } finally {
      setEmailVerifying(false);
    }
  }, [user?.email, emailOtpCode, refresh, t]);

  /* ═══════════════════════════════════════════════════════
     LOGOUT
     ═══════════════════════════════════════════════════════ */

  const handleLogout = useCallback(async () => {
    setLoggingOut(true);
    setLogoutError(null);
    try {
      const { error } = await signOut();
      if (error) {
        setLogoutError(error.message || t("errors.logoutFailed"));
        return;
      }
      await refresh();
      onClose();
      router.push("/login");
    } catch {
      setLogoutError(t("errors.logoutFailed"));
    } finally {
      setLoggingOut(false);
    }
  }, [refresh, onClose, router, t]);

  /* ═══════════════════════════════════════════════════════
     DELETE ACCOUNT — VERSION CORRIGÉE
     ═══════════════════════════════════════════════════════ */

  const handleDeleteAccount = useCallback(async () => {
    if (deleting) return;
    setDeleting(true);
    setDeleteError(null);

    try {
      // 1. Suppression via better-auth
      const { error } = await authClient.deleteUser();

      if (error) {
        // 🔍 Log pour diagnostiquer (404 = enabled manquant, etc.)
        if (process.env.NODE_ENV === "development") {
          console.error("[deleteUser:error]", error);
        }
        setDeleteError(error.message || t("errors.deleteFailed"));
        setShowDeleteConfirm(false);
        return;
      }

      // 2. ✅ Force un signOut pour purger le cookie de session
      //    (better-auth supprime la session DB mais pas toujours le cookie)
      await signOut().catch(() => {
        /* déjà déconnecté, on ignore */
      });

      // 3. ✅ Refresh le contexte pour vider le user
      await refresh();

      // 4. Ferme + redirige
      onClose();
      router.push("/");
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.error("[deleteUser:catch]", err);
      }
      setDeleteError(t("errors.deleteFailed"));
      setShowDeleteConfirm(false);
    } finally {
      setDeleting(false);
    }
  }, [deleting, refresh, onClose, router, t]);

  /* ═══════════════════════════════════════════════════════
     DOWNLOAD QR
     ═══════════════════════════════════════════════════════ */

  const handleDownloadQr = useCallback(async () => {
    if (!qrDataUrl) return;
    setDownloading(true);
    try {
      const link = document.createElement("a");
      link.href = qrDataUrl;
      link.download = "toctoc-app-qrcode.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setTimeout(() => setDownloading(false), 800);
    }
  }, [qrDataUrl]);

  /* ═══════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════ */

  return (
    <Popover
      open={open}
      onClose={onClose}
      title={t("title")}
      widthClassName="w-[95vw] max-w-[560px] sm:w-[560px]"
    >
      <div dir={isRTL ? "rtl" : "ltr"} className="max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-5">
          <h2 className={`text-sm sm:text-base font-medium text-black dark:text-white/90 ${orbitron.className}`}>
            {t("title")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className={`text-black/50 hover:text-black dark:text-white/50 dark:hover:text-white/90 cursor-pointer p-1 ${orbitron.className}`}
            aria-label={t("close")}
          >
            <XIcon size={18} />
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-6">
          {/* Tabs */}
          <nav className="w-full sm:w-36 shrink-0 flex sm:flex-col gap-1 overflow-x-auto pb-1 sm:pb-0 -mx-1 px-1">
            {TABS.map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                aria-current={tab === key ? "page" : undefined}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
                  tab === key
                    ? "bg-black/10 text-black dark:bg-white/10 dark:text-white/95"
                    : "text-black/60 hover:bg-black/5 hover:text-black dark:text-white/60 dark:hover:bg-white/5 dark:hover:text-white/90"
                } ${orbitron.className}`}
              >
                <Icon size={16} />
                <span className={orbitron.className}>{label}</span>
              </button>
            ))}
          </nav>

          <div className="flex-1 min-w-0">
            {/* ═══ GENERAL ═══ */}
            {tab === "general" && (
              <div>
                <p className={`text-xs text-black/40 dark:text-white/40 mb-2 ${orbitron.className}`}>
                  {t("theme")}
                </p>
                <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-5">
                  {THEMES.map(({ key, icon: Icon }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setTheme(key)}
                      aria-pressed={theme === key}
                      className={`flex flex-col items-center gap-1 py-2.5 sm:py-3 px-1 rounded-lg border text-[11px] sm:text-xs cursor-pointer transition-colors ${
                        theme === key
                          ? "border-[#432dd7]/60 bg-[#432dd7]/10 text-black dark:text-white/95"
                          : "border-black/10 text-black/60 hover:bg-black/5 dark:border-white/10 dark:text-white/60 dark:hover:bg-white/5"
                      } ${orbitron.className}`}
                    >
                      <Icon size={16} />
                      <span className={`text-center leading-tight ${orbitron.className}`}>
                        {t(`themes.${key}`)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ═══ PROFILE ═══ */}
            {tab === "profile" && (
              <div className="flex flex-col gap-3 sm:gap-4">
                {loadingUser ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black/30 dark:border-white/30" />
                  </div>
                ) : (
                  <>
                    {/* Name */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-black/5 dark:border-white/5 pb-2.5 sm:pb-3 gap-1">
                      <span className={`text-xs sm:text-sm text-black/50 dark:text-white/50 ${orbitron.className}`}>
                        {t("name")}
                      </span>
                      <span className={`text-sm text-black dark:text-white/90 ${orbitron.className}`}>
                        {user?.name || "-"}
                      </span>
                    </div>

                    {/* Email */}
                    <div className="border-b border-black/5 dark:border-white/5 pb-2.5 sm:pb-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-3">
                        <span className={`text-xs sm:text-sm text-black/50 dark:text-white/50 shrink-0 ${orbitron.className}`}>
                          {t("email")}
                        </span>
                        <div className="flex items-center gap-2 min-w-0 justify-between sm:justify-end w-full sm:w-auto">
                          <span className={`text-sm text-black dark:text-white/90 truncate max-w-40 sm:max-w-none ${orbitron.className}`}>
                            {user?.email || "-"}
                          </span>
                          {user?.email && (
                            user.emailVerified ? (
                              <span className={`flex items-center gap-1 text-xs text-green-600 dark:text-green-400 shrink-0 ${orbitron.className}`}>
                                <CheckCircleIcon size={14} weight="fill" />
                                {t("verified")}
                              </span>
                            ) : emailOtpStep === "idle" ? (
                              <button
                                type="button"
                                onClick={handleSendEmailOtp}
                                disabled={emailSending}
                                className={`text-xs px-2.5 py-1 rounded-lg border border-[#432dd7]/40 text-[#432dd7] hover:bg-[#432dd7]/10 cursor-pointer disabled:opacity-40 shrink-0 transition-colors ${orbitron.className}`}
                              >
                                {emailSending ? t("sending") : t("verify")}
                              </button>
                            ) : null
                          )}
                        </div>
                      </div>

                      {/* OTP input */}
                      {user?.email && !user.emailVerified && emailOtpStep === "sent" && (
                        <div className="mt-2 flex flex-col gap-2">
                          <div className="flex flex-col sm:flex-row gap-2">
                            <input
                              value={emailOtpCode}
                              onChange={(e) => setEmailOtpCode(e.target.value)}
                              placeholder={t("otpPlaceholder")}
                              maxLength={6}
                              inputMode="numeric"
                              autoComplete="one-time-code"
                              className={`flex-1 h-9 px-3 rounded-lg bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-sm text-black dark:text-white/90 placeholder:text-black/30 dark:placeholder:text-white/30 focus:outline-none focus:border-[#432dd7] w-full ${orbitron.className}`}
                            />
                            <button
                              type="button"
                              onClick={handleVerifyEmailOtp}
                              disabled={emailVerifying || !emailOtpCode.trim()}
                              className={`text-xs px-3 py-1.5 rounded-lg border border-[#432dd7]/40 text-[#432dd7] hover:bg-[#432dd7]/10 cursor-pointer disabled:opacity-40 transition-colors sm:shrink-0 ${orbitron.className}`}
                            >
                              {emailVerifying ? t("verifying") : t("confirm")}
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={handleSendEmailOtp}
                            disabled={emailSending}
                            className={`self-start text-[11px] text-[#432dd7] hover:underline cursor-pointer disabled:opacity-40 ${orbitron.className}`}
                          >
                            {emailSending ? t("sending") : t("resendCode")}
                          </button>
                        </div>
                      )}
                    </div>

                    {emailError && (
                      <p
                        role="alert"
                        className={`text-xs text-red-500 dark:text-red-400 -mt-2 ${orbitron.className}`}
                      >
                        {emailError}
                      </p>
                    )}

                    {/* Phone */}
                    <div className="border-b border-black/5 dark:border-white/5 pb-2.5 sm:pb-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-3">
                        <span className={`text-xs sm:text-sm text-black/50 dark:text-white/50 shrink-0 ${orbitron.className}`}>
                          {t("phone")}
                        </span>
                        <div className="flex items-center gap-2 min-w-0 justify-between sm:justify-end w-full sm:w-auto">
                          <span className={`text-sm text-black dark:text-white/90 truncate max-w-40 sm:max-w-none ${orbitron.className}`}>
                            {user?.phone || "-"}
                          </span>
                          {user?.phone && user.phoneVerified && (
                            <span className={`flex items-center gap-1 text-xs text-green-600 dark:text-green-400 shrink-0 ${orbitron.className}`}>
                              <CheckCircleIcon size={14} weight="fill" />
                              {t("verified")}
                            </span>
                          )}
                          {!user?.phoneVerified && !PHONE_VERIFICATION_ENABLED && (
                            <span
                              className={`flex items-center gap-1 text-xs text-black/40 dark:text-white/40 shrink-0 ${orbitron.className}`}
                              title={t("phoneComingSoonHint")}
                            >
                              <ClockIcon size={14} />
                              {t("comingSoon")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Logout */}
                    <div className="pt-1">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs sm:text-sm text-black/50 dark:text-white/50 ${orbitron.className}`}>
                          {t("logout")}
                        </span>
                        <button
                          type="button"
                          onClick={handleLogout}
                          disabled={loggingOut}
                          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-red-500/40 text-red-500 dark:text-red-400 hover:bg-red-500/10 cursor-pointer disabled:opacity-40 transition-colors ${orbitron.className}`}
                        >
                          <SignOutIcon size={14} weight="bold" />
                          {loggingOut ? t("loggingOut") : t("logoutButton")}
                        </button>
                      </div>
                      {logoutError && (
                        <p
                          role="alert"
                          className={`text-xs text-red-500 dark:text-red-400 mt-1 ${orbitron.className}`}
                        >
                          {logoutError}
                        </p>
                      )}
                    </div>

                    {/* Delete account */}
                    <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
                      {!showDeleteConfirm ? (
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex flex-col">
                            <span className={`text-xs sm:text-sm text-black/70 dark:text-white/70 ${orbitron.className}`}>
                              {t("deleteAccount")}
                            </span>
                            <span className={`text-[11px] text-black/40 dark:text-white/40 ${orbitron.className}`}>
                              {t("deleteAccountHint")}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowDeleteConfirm(true)}
                            disabled={deleting}
                            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-red-500/40 text-red-500 dark:text-red-400 hover:bg-red-500/10 cursor-pointer disabled:opacity-40 transition-colors shrink-0 ${orbitron.className}`}
                          >
                            <TrashIcon size={14} weight="bold" />
                            {t("deleteButton")}
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2.5">
                          <div className="flex items-start gap-2">
                            <WarningCircleIcon size={16} weight="fill" className="text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
                            <p className={`text-xs text-black/70 dark:text-white/70 leading-relaxed ${orbitron.className}`}>
                              {t("confirmDelete")}
                            </p>
                          </div>
                          <div className="flex gap-2 justify-end">
                            <button
                              type="button"
                              onClick={() => setShowDeleteConfirm(false)}
                              disabled={deleting}
                              className={`text-xs px-3 py-1.5 rounded-lg border border-black/10 dark:border-white/10 text-black/60 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer disabled:opacity-40 transition-colors ${orbitron.className}`}
                            >
                              {t("cancel")}
                            </button>
                            <button
                              type="button"
                              onClick={handleDeleteAccount}
                              disabled={deleting}
                              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 cursor-pointer disabled:opacity-40 transition-colors ${orbitron.className}`}
                            >
                              <TrashIcon size={14} weight="bold" />
                              {deleting ? t("deleting") : t("deleteConfirmButton")}
                            </button>
                          </div>
                        </div>
                      )}
                      {deleteError && (
                        <p
                          role="alert"
                          aria-live="polite"
                          className={`text-xs text-red-500 dark:text-red-400 mt-2 ${orbitron.className}`}
                        >
                          {deleteError}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ═══ DOWNLOAD ═══ */}
            {tab === "download" && (
              <div className="w-full max-w-full overflow-hidden">
                <div className="flex items-center gap-2 mb-3">
                  <DeviceMobileIcon size={18} className="text-[#432dd7] shrink-0" />
                  <span className={`text-sm font-medium text-black dark:text-white/90 ${orbitron.className}`}>
                    {t("downloadApp")}
                  </span>
                </div>

                {qrDataUrl && (
                  <div className="flex flex-col items-center gap-4 w-full">
                    <div className="bg-white p-3 sm:p-4 rounded-lg max-w-full">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={qrDataUrl}
                        alt="QR Code"
                        className="w-40 h-40 sm:w-48 sm:h-48 max-w-full"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 w-full max-w-full">
                      <button
                        type="button"
                        onClick={handleDownloadQr}
                        disabled={downloading}
                        className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#432dd7] text-white hover:bg-[#432dd7]/90 cursor-pointer disabled:opacity-40 transition-colors w-full sm:w-auto ${orbitron.className}`}
                      >
                        <DownloadSimpleIcon size={16} className="shrink-0" />
                        <span className="truncate">
                          {downloading ? t("downloading") : t("downloadQr")}
                        </span>
                      </button>

                      <div className="flex gap-2 w-full sm:w-auto">
                        <button
                          type="button"
                          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-black text-white hover:bg-black/90 cursor-pointer transition-colors ${orbitron.className}`}
                          aria-label="Google Play"
                        >
                          <GooglePlayLogo size={16} className="shrink-0" />
                        </button>
                        <button
                          type="button"
                          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-black text-white hover:bg-black/90 cursor-pointer transition-colors ${orbitron.className}`}
                          aria-label="App Store"
                        >
                          <AppleLogo size={16} className="shrink-0" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Popover>
  );
}