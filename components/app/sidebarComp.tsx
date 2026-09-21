"use client";

import { useState, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  HouseIcon,
  MagnifyingGlassIcon,
  VideoIcon,
  ChatTeardropDotsIcon,
  PhoneIcon,
  VirtualRealityIcon,
  CaretDoubleRightIcon,
  CaretDoubleLeftIcon,
  GearSixIcon,
} from "@phosphor-icons/react";
import { orbitron } from "@/fonts/font";
import Image from "next/image";
import SearchPopover from "@/components/app/utils/SearchPopover";
import VrConfirmPopover from "@/components/app/utils/VrConfirmPopover";
import SettingsPopover from "@/components/app/utils/settingsPopover";
import { useSession } from "@/app/context/SessionContext";

type NavKey = "home" | "search" | "video" | "chat" | "phone" | "vr";

type NavItem = {
  key: NavKey;
  icon: React.ComponentType<{ size?: number; weight?: "regular" | "bold" | "fill" }>;
};

const NAV_ITEMS: NavItem[] = [
  { key: "home", icon: HouseIcon },
  { key: "search", icon: MagnifyingGlassIcon },
  { key: "video", icon: VideoIcon },
  { key: "chat", icon: ChatTeardropDotsIcon },
  { key: "phone", icon: PhoneIcon },
  { key: "vr", icon: VirtualRealityIcon },
];

const POPOVER_KEYS: (NavKey | "settings")[] = ["search", "vr", "settings"];

const RTL_LOCALES = ["ar"];

type Breakpoint = "mobile" | "tablet" | "desktop";

const Sidebar = () => {
  const locale = useLocale();
  const t = useTranslations("Sidebar");
  const router = useRouter();

  const [collapsed, setCollapsed] = useState(true);
  const [active, setActive] = useState<NavKey | "settings">("home");
  const [breakpoint, setBreakpoint] = useState<Breakpoint>("desktop");

  const [searchOpen, setSearchOpen] = useState(false);
  const [vrOpen, setVrOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { user } = useSession();

  const isRTL = RTL_LOCALES.includes(locale);

  // Détecte le breakpoint (resize + init)
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setBreakpoint("mobile");
      } else if (width < 1024) {
        setBreakpoint("tablet");
        setCollapsed(true);
      } else {
        setBreakpoint("desktop");
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleNavClick = (key: NavKey | "settings") => {
    if (key === "home") {
      setActive(key);
      router.push(`/${locale}/app`);
      return;
    }
    if (key === "search") {
      setActive(key);
      setSearchOpen(true);
      return;
    }
    if (key === "vr") {
      setActive(key);
      setVrOpen(true);
      return;
    }
    if (key === "settings") {
      setActive(key);
      setSettingsOpen(true);
      return;
    }
    setActive(key);
  };

  const handleSearch = (query: string) => {
    console.log("Recherche :", query);
  };

  const handleVrConfirm = () => {
    console.log("Casque VR confirmé, lancement de l'entretien virtuel");
  };

  const popovers = (
    <>
      <SearchPopover
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSearch={handleSearch}
        userType={user?.clientType}
      />
      <VrConfirmPopover open={vrOpen} onClose={() => setVrOpen(false)} onConfirm={handleVrConfirm} />
      <SettingsPopover open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );

  // =========================================================
  //  BOUTON DE NAV (réutilisable sidebar verticale)
  // =========================================================
  const NavButton = ({
    navKey,
    icon: Icon,
    showLabel,
    justifyCenter = false,
  }: {
    navKey: NavKey | "settings";
    icon: React.ComponentType<{ size?: number; weight?: "regular" | "bold" | "fill" }>;
    showLabel: boolean;
    justifyCenter?: boolean;
  }) => {
    const isActive = active === navKey;
    const label = navKey === "settings" ? t("settings") : t(navKey);
    const hasPopover = POPOVER_KEYS.includes(navKey);

    return (
      <button
        onClick={() => handleNavClick(navKey)}
        aria-haspopup={hasPopover ? "dialog" : undefined}
        className={`group relative flex items-center h-11 rounded-lg transition-colors cursor-pointer w-full ${
          justifyCenter ? "justify-center" : "gap-3 px-3"
        } ${
          isActive
            ? "bg-[#432dd7]/10 text-[#432dd7]"
            : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-900/5 dark:text-white/80 dark:hover:text-white/90 dark:hover:bg-white/5"
        }`}
        title={label}
        aria-label={label}
        aria-current={isActive ? "page" : undefined}
      >
        <span className="shrink-0">
          <Icon size={20} weight={isActive ? "fill" : "regular"} />
        </span>
        {showLabel && (
          <span className="text-sm whitespace-nowrap opacity-100 transition-opacity duration-200">
            {label}
          </span>
        )}
        {isActive && (
          <span
            className={`absolute top-1/2 -translate-y-1/2 h-5 w-0.75 bg-[#432dd7] ${
              isRTL ? "right-0 rounded-l" : "left-0 rounded-r"
            }`}
          />
        )}
      </button>
    );
  };

  const renderSidebarItems = (showLabel: boolean, justifyCenter = false) => (
    <nav className="mt-2 flex flex-col gap-1 px-3" aria-label={t("navLabel")}>
      {NAV_ITEMS.map(({ key, icon }) => (
        <NavButton
          key={key}
          navKey={key}
          icon={icon}
          showLabel={showLabel}
          justifyCenter={justifyCenter}
        />
      ))}
    </nav>
  );

  const LogoDisplay = () => {
    const [imgError, setImgError] = useState(false);

    if (imgError) {
      return (
        <span className="text-sm font-medium tracking-tight text-zinc-900 dark:text-white/90">
          Toctoc
        </span>
      );
    }

    return collapsed ? (
      <div className="flex items-center justify-center w-full">
        <Image
          src="/icons/icon.png"
          alt="Logo"
          width={40}
          height={40}
          priority
          className="dark:invert"
          onError={() => setImgError(true)}
        />
      </div>
    ) : (
      <div className="flex items-center justify-start w-full">
        <Image
          src="/assets/logo/logo.svg"
          alt="Logo"
          width={80}
          height={40}
          priority
          className="dark:invert"
          onError={() => setImgError(true)}
        />
      </div>
    );
  };

  // =========================================================
  //  MOBILE → Bottom Navigation Bar
  // =========================================================
  if (breakpoint === "mobile") {
    return (
      <>
        {/* Bottom navbar fixe */}
        <nav
          dir={isRTL ? "rtl" : "ltr"}
          aria-label={t("navLabel")}
          className={`fixed bottom-0 left-0 right-0 z-50 h-16 flex items-center justify-around
                      bg-white/95 dark:bg-neutral-950/95 backdrop-blur-md
                      border-t border-black/5 dark:border-white/5
                      pb-[env(safe-area-inset-bottom)] ${orbitron.className}`}
        >
          {NAV_ITEMS.map(({ key, icon: Icon }) => {
            const isActive = active === key;
            const label = t(key);
            return (
              <button
                key={key}
                onClick={() => handleNavClick(key)}
                aria-label={label}
                aria-current={isActive ? "page" : undefined}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 h-full
                            transition-colors cursor-pointer
                            ${
                              isActive
                                ? "text-[#432dd7]"
                                : "text-zinc-500 dark:text-white/60"
                            }`}
              >
                <Icon size={22} weight={isActive ? "fill" : "regular"} />
                <span className="text-[10px] leading-none">{label}</span>
              </button>
            );
          })}

          {/* Settings */}
          <button
            onClick={() => handleNavClick("settings")}
            aria-label={t("settings")}
            aria-current={active === "settings" ? "page" : undefined}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 h-full
                        transition-colors cursor-pointer
                        ${
                          active === "settings"
                            ? "text-[#432dd7]"
                            : "text-zinc-500 dark:text-white/60"
                        }`}
          >
            <GearSixIcon size={22} weight={active === "settings" ? "fill" : "regular"} />
            <span className="text-[10px] leading-none">{t("settings")}</span>
          </button>
        </nav>

        {popovers}
      </>
    );
  }

  // =========================================================
  //  TABLETTE → Sidebar collapsée (icônes seules)
  // =========================================================
  if (breakpoint === "tablet") {
    return (
      <>
        <div
          dir={isRTL ? "rtl" : "ltr"}
          className={`h-screen flex flex-col font-bold justify-between bg-zinc-50 dark:bg-black border-r border-black/5 dark:border-white/5 w-20 ${orbitron.className}`}
        >
          <div>
            <div className="flex items-center justify-center px-4 h-16 overflow-hidden">
              <LogoDisplay />
            </div>
            {renderSidebarItems(false, true)}
          </div>
          <div className="pb-4 px-3">
            <NavButton navKey="settings" icon={GearSixIcon} showLabel={false} justifyCenter />
          </div>
        </div>
        {popovers}
      </>
    );
  }

  // =========================================================
  //  DESKTOP → Sidebar complète avec toggle
  // =========================================================
  return (
    <>
      <div
        dir={isRTL ? "rtl" : "ltr"}
        className={`h-screen flex flex-col font-bold justify-between bg-zinc-50 dark:bg-black border-r border-black/5 dark:border-white/5 transition-all duration-300 ${
          collapsed ? "w-20" : "w-64"
        } ${orbitron.className}`}
      >
        <div>
          <div className="flex items-center justify-center px-4 h-16 overflow-hidden">
            <LogoDisplay />
          </div>
          <div className="overflow-hidden">{renderSidebarItems(!collapsed)}</div>
        </div>

        <div className="flex flex-col gap-3 pb-4">
          <div className="px-3">
            <NavButton navKey="settings" icon={GearSixIcon} showLabel={!collapsed} />
          </div>

          <div className="border-t border-black/5 dark:border-white/5 pt-3 mx-3">
            <button
              onClick={() => setCollapsed((c) => !c)}
              className="w-full flex items-center justify-center gap-2 h-10 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-900/5 dark:text-white/60 dark:hover:text-white/90 dark:hover:bg-white/5 transition-colors cursor-pointer"
              aria-label={collapsed ? t("expand") : t("collapse")}
              title={collapsed ? t("expand") : t("collapse")}
            >
              {collapsed !== isRTL ? (
                <CaretDoubleRightIcon size={18} className="shrink-0" />
              ) : (
                <CaretDoubleLeftIcon size={18} className="shrink-0" />
              )}
              {!collapsed && <span className="text-xs whitespace-nowrap">{t("collapse")}</span>}
            </button>
          </div>
        </div>
      </div>
      {popovers}
    </>
  );
};

export default Sidebar;