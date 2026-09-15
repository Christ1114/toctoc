"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import {
  UserIcon,
  BellIcon,
  CaretRightIcon,
  CheckCircleIcon,
  CalendarBlankIcon,
  BriefcaseIcon,
  StarIcon,
  ChatCircleIcon,
  type Icon as PhosphorIcon,
} from "@phosphor-icons/react";
import Popover from "../utils/Popover";
import { orbitron } from "@/fonts/font";
import { useNotifications, type AppNotification, type NotificationType } from "@/app/hooks/useNotifications";

type ProfileUser = {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  accountType?: string | null;
};

type ProfilePopoverProps = {
  open: boolean;
  onClose: () => void;
  user?: ProfileUser | null;
};

type TabKey = "profile" | "notifications";

const NOTIFICATION_ICONS: Record<NotificationType, PhosphorIcon> = {
  OFFER: BriefcaseIcon,
  VERIFIED: CheckCircleIcon,
  REMINDER: CalendarBlankIcon,
  BOOKING_UPDATE: CalendarBlankIcon,
  REVIEW_RECEIVED: StarIcon,
  MESSAGE: ChatCircleIcon,
};

export default function ProfilePopover({ open, onClose, user }: ProfilePopoverProps) {
  const t = useTranslations("ProfilePopover");
  const format = useFormatter();
  const locale = useLocale();
  const router = useRouter();
  const isRTL = locale === "ar";

  const [activeTab, setActiveTab] = useState<TabKey>("profile");

  const { notifications, loading, unreadCount, markAsRead, markAllAsRead } = useNotifications(
    user?.id
  );

  const goToFullProfile = () => {
    router.push(`/${locale}/app/profile`);
    onClose();
  };

  return (
    <Popover open={open} onClose={onClose} title={t("title")}>
      <div dir={isRTL ? "rtl" : "ltr"} className="w-full flex flex-col">
        <div role="tablist" aria-label={t("title")} className="flex items-center gap-1 mb-3 px-2 sm:px-0">
          <TabButton
            tab="profile"
            icon={UserIcon}
            label={t("profileTab")}
            isActive={activeTab === "profile"}
            onSelect={setActiveTab}
          />
          <TabButton
            tab="notifications"
            icon={BellIcon}
            label={t("notificationsTab")}
            badge={unreadCount}
            isActive={activeTab === "notifications"}
            onSelect={setActiveTab}
          />
        </div>

        <div role="tabpanel" hidden={activeTab !== "profile"}>
          {activeTab === "profile" && (
            <ProfileTab t={t} user={user} isRTL={isRTL} onViewFullProfile={goToFullProfile} />
          )}
        </div>

        <div role="tabpanel" hidden={activeTab !== "notifications"}>
          {activeTab === "notifications" && (
            <NotificationsTab
              t={t}
              format={format}
              notifications={notifications}
              loading={loading}
              onMarkAsRead={markAsRead}
              onMarkAllAsRead={markAllAsRead}
            />
          )}
        </div>
      </div>
    </Popover>
  );
}



function TabButton({
  tab,
  icon: Icon,
  label,
  badge,
  isActive,
  onSelect,
}: {
  tab: TabKey;
  icon: PhosphorIcon;
  label: string;
  badge?: number;
  isActive: boolean;
  onSelect: (tab: TabKey) => void;
}) {
  return (
    <button
      role="tab"
      aria-selected={isActive}
      onClick={() => onSelect(tab)}
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
}



function ProfileTab({
  t,
  user,
  isRTL,
  onViewFullProfile,
}: {
  t: ReturnType<typeof useTranslations>;
  user?: ProfileUser | null;
  isRTL: boolean;
  onViewFullProfile: () => void;
}) {
  return (
    <div className="flex flex-col px-2 sm:px-0">
      <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-100 dark:bg-white/5">
        <div className="h-12 w-12 shrink-0 rounded-full overflow-hidden bg-[#432dd7]/10 flex items-center justify-center">
          {user?.image ? (
            <img src={user.image} alt={user.name || t("unnamed")} className="w-full h-full object-cover" />
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
          <p className="text-xs text-gray-500 dark:text-white/40 truncate">{user?.email || "—"}</p>
        </div>
      </div>

      {user?.accountType && (
        <span className="mt-3 inline-flex self-start items-center px-2 py-1 rounded-md bg-[#432dd7]/10 text-[#432dd7] text-xs font-medium">
          {user.accountType}
        </span>
      )}

      <button
        onClick={onViewFullProfile}
        className="mt-4 w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-gray-700 dark:text-white/80 hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer transition-colors"
      >
        <span className={orbitron.className}>{t("viewFullProfile")}</span>
        <CaretRightIcon size={14} className={isRTL ? "rotate-180" : ""} />
      </button>
    </div>
  );
}


function NotificationsTab({
  t,
  format,
  notifications,
  loading,
  onMarkAsRead,
  onMarkAllAsRead,
}: {
  t: ReturnType<typeof useTranslations>;
  format: ReturnType<typeof useFormatter>;
  notifications: AppNotification[];
  loading: boolean;
  onMarkAsRead: (ids: string[]) => void;
  onMarkAllAsRead: () => void;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black/30 dark:border-white/30" />
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="text-center py-8">
        <BellIcon size={32} className="mx-auto mb-2 text-gray-300 dark:text-white/20" />
        <p className="text-sm text-gray-500 dark:text-white/40">{t("noNotifications")}</p>
      </div>
    );
  }

  const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);

  return (
    <div className="flex flex-col gap-2">
      {unreadIds.length > 0 && (
        <button
          onClick={onMarkAllAsRead}
          className={`self-end text-xs text-[#432dd7] hover:underline cursor-pointer px-2 ${orbitron.className}`}
        >
          {t("markAllAsRead")}
        </button>
      )}
      <ul className="flex flex-col gap-1 px-2 sm:px-0 max-h-72 overflow-y-auto">
        {notifications.map((notif) => {
          const Icon = NOTIFICATION_ICONS[notif.type] ?? BellIcon;
          const kind = notif.type.toLowerCase();

          return (
            <li key={notif.id}>
              <button
                onClick={() => !notif.read && onMarkAsRead([notif.id])}
                className={`w-full flex items-start gap-3 px-2 py-2.5 rounded-lg text-left hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer transition-colors ${
                  !notif.read ? "bg-[#432dd7]/5" : ""
                }`}
              >
                <span className="shrink-0 h-8 w-8 rounded-full bg-[#432dd7]/10 text-[#432dd7] flex items-center justify-center mt-0.5">
                  <Icon size={15} />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-gray-900 dark:text-white/90 truncate">
                      {t(`mock.${kind}.title`, notif.data as Record<string, string | number | Date> | undefined)}
                    </span>
                    {!notif.read && <span className="h-1.5 w-1.5 rounded-full bg-[#432dd7] shrink-0" />}
                  </span>
                  <span className="block text-xs text-gray-500 dark:text-white/40 truncate">
                    {t(`mock.${kind}.description`, notif.data as Record<string, string | number | Date> | undefined)}
                  </span>
                  <span className="block text-[11px] text-gray-400 dark:text-white/30 mt-0.5">
                    {format.relativeTime(new Date(notif.createdAt), new Date())}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}