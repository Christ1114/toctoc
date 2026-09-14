"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  UserIcon,
  BellIcon,
  CaretRightIcon,
  CheckCircleIcon,
  CalendarBlankIcon,
  BriefcaseIcon,
} from "@phosphor-icons/react";
import Popover from "../utils/Popover";
import { orbitron } from "@/fonts/font";

type ProfilePopoverProps = {
  open: boolean;
  onClose: () => void;
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    accountType?: string | null;
  } | null;
};

type TabKey = "profile" | "notifications";

// --- Données mockées, en attendant le branchement backend ---
type MockNotification = {
  id: string;
  icon: React.ComponentType<{ size?: number }>;
  title: string;
  description: string;
  time: string;
  read: boolean;
};

const MOCK_NOTIFICATIONS: MockNotification[] = [
  {
    id: "1",
    icon: BriefcaseIcon,
    title: "Nouvelle offre disponible",
    description: "Une mission correspond à votre profil à Cocody.",
    time: "Il y a 2h",
    read: false,
  },
  {
    id: "2",
    icon: CheckCircleIcon,
    title: "Profil vérifié",
    description: "Votre compte a été vérifié avec succès.",
    time: "Hier",
    read: false,
  },
  {
    id: "3",
    icon: CalendarBlankIcon,
    title: "Rappel d'entretien",
    description: "Entretien virtuel prévu demain à 10h00.",
    time: "Il y a 2 jours",
    read: true,
  },
];

export default function ProfilePopover({ open, onClose, user }: ProfilePopoverProps) {
  const t = useTranslations("ProfilePopover");
  const locale = useLocale();
  const router = useRouter();
  const isRTL = locale === "ar";

  const [activeTab, setActiveTab] = useState<TabKey>("profile");

  const unreadCount = MOCK_NOTIFICATIONS.filter((n) => !n.read).length;

  const goToFullProfile = () => {
    router.push(`/${locale}/app/profile`);
    onClose();
  };

  const TabButton = ({
    tab,
    icon: Icon,
    label,
    badge,
  }: {
    tab: TabKey;
    icon: React.ComponentType<{ size?: number }>;
    label: string;
    badge?: number;
  }) => {
    const isActive = activeTab === tab;
    return (
      <button
        onClick={() => setActiveTab(tab)}
        className={`relative flex-1 flex items-center justify-center gap-1.5 h-10 rounded-lg text-sm cursor-pointer transition-colors ${
          orbitron.className
        } ${
          isActive
            ? "bg-[#432dd7]/10 text-[#432dd7]"
            : "text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-white/40 dark:hover:text-white/80 dark:hover:bg-white/5"
        }`}
      >
        <Icon size={16} />
        <span>{label}</span>
        {!!badge && badge > 0 && (
          <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold flex items-center justify-center">
            {badge > 9 ? "9+" : badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <Popover open={open} onClose={onClose} title={t("title")}>
      <div dir={isRTL ? "rtl" : "ltr"} className="w-full flex flex-col">
        {/* --- Switch d'onglets --- */}
        <div className="flex items-center gap-1 mb-3 px-2 sm:px-0">
          <TabButton tab="profile" icon={UserIcon} label={t("profileTab")} />
          <TabButton tab="notifications" icon={BellIcon} label={t("notificationsTab")} badge={unreadCount} />
        </div>

        {/* --- Contenu : onglet Profil --- */}
        {activeTab === "profile" && (
          <div className="flex flex-col px-2 sm:px-0">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-100 dark:bg-white/5">
              <div className="h-12 w-12 shrink-0 rounded-full overflow-hidden bg-[#432dd7]/10 flex items-center justify-center">
                {user?.image ? (
                  <img src={user.image} alt={user.name || "Avatar"} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm font-semibold text-[#432dd7]">
                    {user?.name ? user.name.charAt(0).toUpperCase() : <UserIcon size={20} />}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium text-gray-900 dark:text-white/90 truncate ${orbitron.className}`}>
                  {user?.name || t("unnamed")}
                </p>
                <p className="text-xs text-gray-500 dark:text-white/40 truncate">
                  {user?.email || "—"}
                </p>
              </div>
            </div>

            {user?.accountType && (
              <span className="mt-3 inline-flex self-start items-center px-2 py-1 rounded-md bg-[#432dd7]/10 text-[#432dd7] text-xs font-medium">
                {user.accountType}
              </span>
            )}

            <button
              onClick={goToFullProfile}
              className="mt-4 w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-gray-700 dark:text-white/80 hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer transition-colors"
            >
              <span className={orbitron.className}>{t("viewFullProfile")}</span>
              <CaretRightIcon size={14} className={isRTL ? "rotate-180" : ""} />
            </button>
          </div>
        )}

        {/* --- Contenu : onglet Notifications --- */}
        {activeTab === "notifications" && (
          <div className="flex flex-col px-2 sm:px-0">
            {MOCK_NOTIFICATIONS.length === 0 ? (
              <div className="text-center py-8">
                <BellIcon size={32} className="mx-auto mb-2 text-gray-300 dark:text-white/20" />
                <p className="text-sm text-gray-500 dark:text-white/40">{t("noNotifications")}</p>
              </div>
            ) : (
              <ul className="flex flex-col gap-1 max-h-72 overflow-y-auto">
                {MOCK_NOTIFICATIONS.map((notif) => (
                  <li key={notif.id}>
                    <button
                      className={`w-full flex items-start gap-3 px-2 py-2.5 rounded-lg text-left hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer transition-colors ${
                        !notif.read ? "bg-[#432dd7]/5" : ""
                      }`}
                    >
                      <span className="shrink-0 h-8 w-8 rounded-full bg-[#432dd7]/10 text-[#432dd7] flex items-center justify-center mt-0.5">
                        <notif.icon size={15} />
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="flex items-center gap-1.5">
                          <span className="text-sm font-medium text-gray-900 dark:text-white/90 truncate">
                            {notif.title}
                          </span>
                          {!notif.read && (
                            <span className="h-1.5 w-1.5 rounded-full bg-[#432dd7] shrink-0" />
                          )}
                        </span>
                        <span className="block text-xs text-gray-500 dark:text-white/40 truncate">
                          {notif.description}
                        </span>
                        <span className="block text-[11px] text-gray-400 dark:text-white/30 mt-0.5">
                          {notif.time}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </Popover>
  );
}