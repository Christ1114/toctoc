"use client";

import { useState, useEffect } from "react";
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
} from "@phosphor-icons/react";
import Popover from "../utils/Popover";
import { orbitron } from "@/fonts/font";
import { useTranslations, useLocale } from "next-intl";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import {
  getSession,
  sendVerificationEmail,
  sendPhoneOTP,
  verifyPhoneOTP,
  updateUser,
  signOut,
  authClient,
} from "@/app/lib/auth-client";

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

const THEMES = [
  { key: "light", icon: SunIcon },
  { key: "dark", icon: MoonIcon },
  { key: "system", icon: DesktopIcon },
] as const;

export default function SettingsPopover({ open, onClose }: SettingsPopoverProps) {
  const t = useTranslations("SettingsPopover");
  const locale = useLocale();
  const isRTL = locale === "ar";
  const router = useRouter();

  const [tab, setTab] = useState<SettingsTab>("general");
  const { theme, setTheme } = useTheme();

  const [user, setUser] = useState<UserData | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const [phoneInput, setPhoneInput] = useState("");
  const [otpStep, setOtpStep] = useState<"idle" | "sent">("idle");
  const [otpCode, setOtpCode] = useState("");
  const [phoneSending, setPhoneSending] = useState(false);
  const [phoneVerifying, setPhoneVerifying] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const TABS: { key: SettingsTab; icon: React.ComponentType<{ size?: number }>; label: string }[] = [
    { key: "general", icon: GearSixIcon, label: t("general") },
    { key: "profile", icon: UserIcon, label: t("profile") },
    { key: "download", icon: DeviceMobileIcon, label: t("download") },
  ];

  const loadUser = async () => {
    setLoadingUser(true);
    try {
      const { session } = await getSession();
      if (session?.user) {
        setUser(session.user as UserData);
        setPhoneInput(session.user.phone || "");
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error("Erreur chargement utilisateur:", err);
      setUser(null);
    } finally {
      setLoadingUser(false);
    }
  };

  // Réinitialisation complète à chaque ouverture du popover
  useEffect(() => {
    if (open) {
      loadUser();
      setEmailSent(false);
      setEmailError(null);
      setOtpStep("idle");
      setOtpCode("");
      setPhoneError(null);
      setLogoutError(null);
      setDeleteError(null);
      setShowDeleteConfirm(false);
    }
  }, [open]);

  // Si l'utilisateur ferme le popover pendant qu'une confirmation de suppression
  // est ouverte, on la réinitialise pour éviter un état "collé" à la prochaine ouverture.
  useEffect(() => {
    if (!open) {
      setShowDeleteConfirm(false);
    }
  }, [open]);

  useEffect(() => {
    if (open && !qrDataUrl) {
      const placeholderData = `https://toctoc.app/download?ref=${Math.random().toString(36).slice(2, 10)}`;

      QRCode.toDataURL(placeholderData, {
        width: 256,
        margin: 1,
        color: {
          dark: "#432dd7",
          light: "#ffffff",
        },
      })
        .then(setQrDataUrl)
        .catch((err) => console.error("Erreur génération QR:", err));
    }
  }, [open, qrDataUrl]);

  const handleVerifyEmail = async () => {
    if (!user?.email) return;
    setEmailSending(true);
    setEmailError(null);
    try {
      const { error } = await sendVerificationEmail(user.email);
      if (error) {
        setEmailError(error.message || t("errors.emailSendFailed"));
      } else {
        setEmailSent(true);
      }
    } catch (err) {
      setEmailError(t("errors.emailSendFailed"));
    } finally {
      setEmailSending(false);
    }
  };

  const handleSendPhoneOtp = async () => {
    if (!phoneInput.trim()) return;
    setPhoneSending(true);
    setPhoneError(null);
    try {
      const { error } = await sendPhoneOTP(phoneInput.trim());
      if (error) {
        setPhoneError(error.message || t("errors.phoneSendFailed"));
      } else {
        setOtpStep("sent");
      }
    } catch (err) {
      setPhoneError(t("errors.phoneSendFailed"));
    } finally {
      setPhoneSending(false);
    }
  };

  const handleVerifyPhoneOtp = async () => {
    if (!otpCode.trim()) return;
    setPhoneVerifying(true);
    setPhoneError(null);
    try {
      const { error } = await verifyPhoneOTP({
        phoneNumber: phoneInput.trim(),
        code: otpCode.trim(),
      });
      if (error) {
        setPhoneError(error.message || t("errors.phoneVerifyFailed"));
      } else {
        await loadUser();
        setOtpStep("idle");
        setOtpCode("");
      }
    } catch (err) {
      setPhoneError(t("errors.phoneVerifyFailed"));
    } finally {
      setPhoneVerifying(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    setLogoutError(null);
    try {
      const { error } = await signOut();
      if (error) {
        setLogoutError(error.message || t("errors.logoutFailed"));
        setLoggingOut(false);
        return;
      }
      onClose();
      router.push("/sign-in");
      router.refresh();
    } catch (err) {
      setLogoutError(t("errors.logoutFailed"));
      setLoggingOut(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      const { error } = await authClient.deleteUser();
      if (error) {
        setDeleteError(error.message || t("errors.deleteFailed"));
        setShowDeleteConfirm(false);
        setDeleting(false);
        return;
      }
      onClose();
      router.push("/");
      router.refresh();
    } catch (err) {
      setDeleteError(t("errors.deleteFailed"));
      setShowDeleteConfirm(false);
      setDeleting(false);
    }
  };

  const handleDownloadQr = async () => {
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
  };

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
            onClick={onClose}
            className="text-black/50 hover:text-black dark:text-white/50 dark:hover:text-white/90 cursor-pointer p-1"
            aria-label={t("close")}
          >
            <XIcon size={18} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-6">
          {/* Tab Navigation */}
          <nav className="w-full sm:w-36 shrink-0 flex sm:flex-col gap-1 overflow-x-auto pb-1 sm:pb-0 -mx-1 px-1">
            {TABS.map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex items-center gap-2 px-3 sm:px-3 py-2 rounded-lg text-xs sm:text-sm cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
                  tab === key
                    ? "bg-black/10 text-black dark:bg-white/10 dark:text-white/95"
                    : "text-black/60 hover:bg-black/5 hover:text-black dark:text-white/60 dark:hover:bg-white/5 dark:hover:text-white/90"
                } ${orbitron.className}`}
              >
                <Icon size={16} />
                <span>{label}</span>
              </button>
            ))}
          </nav>

          {/* Content Area */}
          <div className="flex-1 min-w-0">
            {/* General Tab */}
            {tab === "general" && (
              <div>
                <p className="text-xs text-black/40 dark:text-white/40 mb-2">{t("theme")}</p>
                <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-5">
                  {THEMES.map(({ key, icon: Icon }) => (
                    <button
                      key={key}
                      onClick={() => setTheme(key)}
                      className={`flex flex-col items-center gap-1 py-2.5 sm:py-3 px-1 rounded-lg border text-[11px] sm:text-xs cursor-pointer transition-colors ${
                        theme === key
                          ? "border-[#432dd7]/60 bg-[#432dd7]/10 text-black dark:text-white/95"
                          : "border-black/10 text-black/60 hover:bg-black/5 dark:border-white/10 dark:text-white/60 dark:hover:bg-white/5"
                      } ${orbitron.className}`}
                    >
                      <Icon size={16} className="sm:w-4.5 sm:h-4.5" />
                      <span className="text-center leading-tight">{t(`themes.${key}`)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Profile Tab */}
            {tab === "profile" && (
              <div className="flex flex-col gap-3 sm:gap-4">
                {loadingUser ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black/30 dark:border-white/30" />
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-black/5 dark:border-white/5 pb-2.5 sm:pb-3 gap-1">
                      <span className="text-xs sm:text-sm text-black/50 dark:text-white/50">{t("name")}</span>
                      <span className="text-sm text-black dark:text-white/90">{user?.name || "-"}</span>
                    </div>

                    <div className="border-b border-black/5 dark:border-white/5 pb-2.5 sm:pb-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-3">
                        <span className="text-xs sm:text-sm text-black/50 dark:text-white/50 shrink-0">{t("email")}</span>
                        <div className="flex items-center gap-2 min-w-0 justify-between sm:justify-end w-full sm:w-auto">
                          <span className="text-sm text-black dark:text-white/90 truncate max-w-40 sm:max-w-none">{user?.email || "-"}</span>
                          {user?.email && (
                            user.emailVerified ? (
                              <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 shrink-0">
                                <CheckCircleIcon size={14} weight="fill" />
                                {t("verified")}
                              </span>
                            ) : emailSent ? (
                              <span className="text-xs text-black/40 dark:text-white/40 shrink-0">{t("emailSentHint")}</span>
                            ) : (
                              <button
                                onClick={handleVerifyEmail}
                                disabled={emailSending}
                                className={`text-xs px-2.5 py-1 rounded-lg border border-[#432dd7]/40 text-[#432dd7] hover:bg-[#432dd7]/10 cursor-pointer disabled:opacity-40 shrink-0 transition-colors ${orbitron.className}`}
                              >
                                {emailSending ? t("sending") : t("verify")}
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                    {emailError && <p className="text-xs text-red-500 dark:text-red-400 -mt-2">{emailError}</p>}

                    <div className="border-b border-black/5 dark:border-white/5 pb-2.5 sm:pb-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-3">
                        <span className="text-xs sm:text-sm text-black/50 dark:text-white/50 shrink-0">{t("phone")}</span>
                        <div className="flex items-center gap-2 min-w-0 justify-between sm:justify-end w-full sm:w-auto">
                          <span className="text-sm text-black dark:text-white/90 truncate max-w-40 sm:max-w-none">{user?.phone || "-"}</span>
                          {user?.phone && user.phoneVerified && (
                            <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 shrink-0">
                              <CheckCircleIcon size={14} weight="fill" />
                              {t("verified")}
                            </span>
                          )}
                        </div>
                      </div>

                      {!user?.phoneVerified && (
                        <div className="mt-2 flex flex-col gap-2">
                          {otpStep === "idle" ? (
                            <div className="flex flex-col sm:flex-row gap-2">
                              <input
                                value={phoneInput}
                                onChange={(e) => setPhoneInput(e.target.value)}
                                placeholder={t("phonePlaceholder")}
                                className="flex-1 h-9 px-3 rounded-lg bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-sm text-black dark:text-white/90 placeholder:text-black/30 dark:placeholder:text-white/30 focus:outline-none focus:border-[#432dd7] w-full"
                              />
                              <button
                                onClick={handleSendPhoneOtp}
                                disabled={phoneSending || !phoneInput.trim()}
                                className={`text-xs px-3 py-1.5 rounded-lg border border-[#432dd7]/40 text-[#432dd7] hover:bg-[#432dd7]/10 cursor-pointer disabled:opacity-40 transition-colors sm:shrink-0 ${orbitron.className}`}
                              >
                                {phoneSending ? t("sending") : t("verify")}
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-col sm:flex-row gap-2">
                              <input
                                value={otpCode}
                                onChange={(e) => setOtpCode(e.target.value)}
                                placeholder={t("otpPlaceholder")}
                                maxLength={6}
                                className="flex-1 h-9 px-3 rounded-lg bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-sm text-black dark:text-white/90 placeholder:text-black/30 dark:placeholder:text-white/30 focus:outline-none focus:border-[#432dd7] w-full"
                              />
                              <button
                                onClick={handleVerifyPhoneOtp}
                                disabled={phoneVerifying || !otpCode.trim()}
                                className="text-xs px-3 py-1.5 rounded-lg border border-[#432dd7]/40 text-[#432dd7] hover:bg-[#432dd7]/10 cursor-pointer disabled:opacity-40 transition-colors sm:shrink-0"
                              >
                                {phoneVerifying ? t("verifying") : t("confirm")}
                              </button>
                            </div>
                          )}
                          {phoneError && <p className="text-xs text-red-500 dark:text-red-400">{phoneError}</p>}
                        </div>
                      )}
                    </div>

                    {/* Déconnexion */}
                    <div className="pt-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm text-black/50 dark:text-white/50">{t("logout")}</span>
                        <button
                          onClick={handleLogout}
                          disabled={loggingOut}
                          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-red-500/40 text-red-500 dark:text-red-400 hover:bg-red-500/10 cursor-pointer disabled:opacity-40 transition-colors ${orbitron.className}`}
                        >
                          <SignOutIcon size={14} weight="bold" />
                          {loggingOut ? t("loggingOut") : t("logoutButton")}
                        </button>
                      </div>
                      {logoutError && <p className="text-xs text-red-500 dark:text-red-400 mt-1">{logoutError}</p>}
                    </div>

                    {/* Suppression du compte */}
                    <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
                      {!showDeleteConfirm ? (
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-xs sm:text-sm text-black/70 dark:text-white/70">{t("deleteAccount")}</span>
                            <span className="text-[11px] text-black/40 dark:text-white/40">{t("deleteAccountHint")}</span>
                          </div>
                          <button
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
                            <p className="text-xs text-black/70 dark:text-white/70 leading-relaxed">
                              {t("confirmDelete")}
                            </p>
                          </div>
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => setShowDeleteConfirm(false)}
                              disabled={deleting}
                              className={`text-xs px-3 py-1.5 rounded-lg border border-black/10 dark:border-white/10 text-black/60 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer disabled:opacity-40 transition-colors ${orbitron.className}`}
                            >
                              {t("cancel")}
                            </button>
                            <button
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
                      {deleteError && <p className="text-xs text-red-500 dark:text-red-400 mt-2">{deleteError}</p>}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Download Tab */}
            {tab === "download" && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <DeviceMobileIcon size={18} className="text-[#432dd7]" />
                  <span className={`text-sm font-medium text-black dark:text-white/90 ${orbitron.className}`}>
                    {t("downloadApp")}
                  </span>
                </div>

                {qrDataUrl && (
                  <div className="flex flex-col items-center gap-4">
                    <div className="bg-white p-4 rounded-lg">
                      <img src={qrDataUrl} alt="QR Code" className="w-48 h-48" />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={handleDownloadQr}
                        disabled={downloading}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#432dd7] text-white hover:bg-[#432dd7]/90 cursor-pointer disabled:opacity-40 transition-colors"
                      >
                        <DownloadSimpleIcon size={16} />
                        {downloading ? t("downloading") : t("downloadQr")}
                      </button>

                      <div className="flex gap-2">
                        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-black text-white hover:bg-black/90 cursor-pointer transition-colors">
                          <GooglePlayLogo size={16} />
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-black text-white hover:bg-black/90 cursor-pointer transition-colors">
                          <AppleLogo size={16} />
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