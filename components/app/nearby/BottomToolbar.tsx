"use client";

import {
  memo,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { orbitron } from "@/fonts/font";
import type { ToolbarCategory } from "@/app/lib/jobs/category-colors";
import { getCategoryIcon, CATEGORY_ICONS } from "@/app/lib/jobs/category-icons";

// ✅ Type dérivé automatiquement des clés de CATEGORY_ICONS
type CategoryIconName = keyof typeof CATEGORY_ICONS;


/* ═══════════════════════════════════════════════════════════
   CACHE + FETCH
   ═══════════════════════════════════════════════════════════ */

let categoriesCache: ToolbarCategory[] | null = null;
let inflightPromise: Promise<ToolbarCategory[]> | null = null;

async function fetchCategories(): Promise<ToolbarCategory[]> {
  if (process.env.NODE_ENV === "development") {
    categoriesCache = null;
  }
  if (categoriesCache) return categoriesCache;
  if (inflightPromise) return inflightPromise;

  inflightPromise = fetch("/api/job-categories")
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
    .then((data) => {
      const list: ToolbarCategory[] = Array.isArray(data?.categories)
        ? data.categories
        : [];
      categoriesCache = list;
      return list;
    })
    .catch(() => {
      if (process.env.NODE_ENV === "development") {
        console.warn("[BottomToolbar] fetch failed");
      }
      return [];
    })
    .finally(() => {
      inflightPromise = null;
    });

  return inflightPromise;
}

/* ═══════════════════════════════════════════════════════════
   PROPS
   ═══════════════════════════════════════════════════════════ */

type BottomToolbarProps = {
  activeSlug: string | null;
  onSelect: (slug: string | null) => void;
  categories?: ToolbarCategory[];
};

/* ═══════════════════════════════════════════════════════════
   HOOK — Chargement des catégories
   ═══════════════════════════════════════════════════════════ */

function useCategories(external?: ToolbarCategory[]) {
  const [categories, setCategories] = useState<ToolbarCategory[]>(
    external ?? categoriesCache ?? [],
  );
  const [loading, setLoading] = useState(!external && !categoriesCache);

  useEffect(() => {
    if (external) {
      setCategories(external);
      setLoading(false);
      return;
    }
    if (categoriesCache) {
      setCategories(categoriesCache);
      setLoading(false);
      return;
    }

    let mounted = true;
    setLoading(true);
    fetchCategories().then((list) => {
      if (mounted) {
        setCategories(list);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, [external]);

  return { categories, loading };
}

/* ═══════════════════════════════════════════════════════════
   SOUS-COMPOSANT — Pastille icône
   ═══════════════════════════════════════════════════════════ */

function CategoryIcon({
  color,
  iconKey,
  isActive,
  size = 13,
}: {
  color: string;
 iconKey: CategoryIconName;
  isActive: boolean;
  size?: number;
}) {
  const IconComponent = getCategoryIcon(iconKey);

  return (
    <span
      className="
        relative flex items-center justify-center
        h-5 w-5 md:h-6 md:w-6
        rounded-full
        backdrop-blur-md
        border border-white/25
        transition-all duration-200
        shrink-0
      "
      style={{
        backgroundColor: `${color}22`,
        borderColor: isActive ? `${color}80` : `${color}40`,
        boxShadow: isActive
          ? `0 0 10px ${color}80, 0 0 20px ${color}40, inset 0 0 8px ${color}40, inset 0 1px 1px rgba(255,255,255,0.2)`
          : `0 0 4px ${color}40, inset 0 0 6px ${color}20, inset 0 1px 1px rgba(255,255,255,0.15)`,
      }}
    >
      <span
        aria-hidden="true"
        className="
          absolute top-0 left-0 right-0 h-1/2
          rounded-t-full
          bg-linear-to-b from-white/25 to-transparent
          pointer-events-none
        "
      />
      <IconComponent
        size={size}
        weight={isActive ? "fill" : "regular"}
        style={{
          color,
          filter: isActive ? `drop-shadow(0 0 2px ${color})` : "none",
        }}
        aria-hidden="true"
      />
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
   ═══════════════════════════════════════════════════════════ */

function BottomToolbarInner({
  activeSlug,
  onSelect,
  categories: external,
}: BottomToolbarProps) {
  const t = useTranslations("BottomToolbar");
  const { categories, loading } = useCategories(external);

  /* ─── État sidebar mobile ─── */
  const [drawerOpen, setDrawerOpen] = useState(false);

  /* ─── Ferme le drawer quand on sélectionne une catégorie ─── */
  const handleSelect = useCallback(
    (slug: string | null) => {
      onSelect(slug);
      setDrawerOpen(false);
    },
    [onSelect],
  );

  /* ─── Escape pour fermer + lock scroll body ─── */
  useEffect(() => {
    if (!drawerOpen) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    document.addEventListener("keydown", onKey);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [drawerOpen]);

  /* ═══════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════ */

  return (
    <>
      {/* ═══════════════════════════════════════════════════
         DESKTOP (md+) — Barre horizontale classique
         ═══════════════════════════════════════════════════ */}
      <div
        className="
          hidden md:block
          pointer-events-auto
          mx-4 mb-4 lg:mx-5 lg:mb-5
        "
      >
        <div
          role="tablist"
          aria-label={t("filterByCategory")}
          className="
            mx-auto
            flex flex-nowrap items-center
            gap-1.5 lg:gap-2
            overflow-x-auto
            min-w-0 max-w-full
            snap-x snap-mandatory scroll-smooth
            rounded-2xl
            bg-black/55 backdrop-blur-xl
            border border-white/15
            px-2.5 py-2
            shadow-2xl shadow-black/40
            no-scrollbar overscroll-x-contain
            contain-[paint]
          "
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {/* Bouton "Tous" */}
          <button
            type="button"
            role="tab"
            aria-selected={activeSlug === null}
            onClick={() => handleSelect(null)}
            className={`
              shrink-0 snap-start
              flex items-center gap-2
              pl-1 pr-2.5
              h-8 lg:h-9
              rounded-full
              text-xs
              transition-all duration-200 cursor-pointer
              touch-manipulation
              ${activeSlug === null
                ? "bg-white/15 text-white font-medium"
                : "text-white/60 hover:text-white/90 hover:bg-white/10 active:bg-white/15"}
              ${orbitron.className}
            `}
          >
            <span className="flex items-center justify-center h-5 w-5 lg:h-6 lg:w-6 rounded-full bg-white/15 backdrop-blur-md border border-white/20 shadow-[inset_0_0_6px_rgba(255,255,255,0.15)]">
              <span className="h-1.5 w-1.5 rounded-full bg-white/80" />
            </span>
            <span className="whitespace-nowrap">{t("all")}</span>
          </button>

          {/* Catégories */}
          {categories.map((cat) => {
            const isActive = activeSlug === cat.slug;
            return (
              <button
                key={cat.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => handleSelect(isActive ? null : cat.slug)}
                title={cat.label}
                className={`
                  shrink-0 snap-start
                  flex items-center gap-2
                  pl-1 pr-2.5
                  h-8 lg:h-9
                  rounded-full
                  text-xs
                  transition-all duration-200 cursor-pointer
                  touch-manipulation
                  ${isActive
                    ? "bg-white/15 text-white font-medium scale-[1.03]"
                    : "text-white/60 hover:text-white/90 hover:bg-white/10 active:bg-white/15"}
                  ${orbitron.className}
                `}
              >
                <CategoryIcon
                  color={cat.color}
                  iconKey={cat.icon}
                  isActive={isActive}
                />
                <span className="whitespace-nowrap">{cat.label}</span>
              </button>
            );
          })}

          {loading &&
            Array.from({ length: 3 }).map((_, i) => (
              <div
                key={`sk-${i}`}
                className="shrink-0 h-8 lg:h-9 w-16 rounded-full bg-white/10 animate-pulse"
              />
            ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
         MOBILE (< md) — Bouton flottant + Sidebar drawer
         ═══════════════════════════════════════════════════ */}

      {/* Bouton flottant pour ouvrir la sidebar */}
      <button
        type="button"
        aria-label={t("filterByCategory")}
        aria-expanded={drawerOpen}
        onClick={() => setDrawerOpen(true)}
        className={`
          md:hidden
          pointer-events-auto
          fixed z-40
          left-1/2 -translate-x-1/2
          bottom-[calc(16px+env(safe-area-inset-bottom,0px))]
          flex items-center gap-2
          px-4 h-11
          rounded-full
          bg-black/70 backdrop-blur-xl
          border border-white/20
          text-white text-xs
          shadow-2xl shadow-black/50
          active:scale-95
          transition-transform duration-150
          touch-manipulation select-none
          ${orbitron.className}
        `}
      >
        {/* Icône filtre */}
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>
        <span className="font-medium">
          {activeSlug
            ? categories.find((c) => c.slug === activeSlug)?.label ?? t("all")
            : t("all")}
        </span>
        {/* Badge actif */}
        {activeSlug && (
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{
              backgroundColor:
                categories.find((c) => c.slug === activeSlug)?.color ?? "#fff",
            }}
          />
        )}
      </button>

      {/* Drawer — rendu via portal pour éviter les conflits de stacking */}
      {typeof window !== "undefined" &&
        createPortal(
          <MobileDrawer
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            categories={categories}
            loading={loading}
            activeSlug={activeSlug}
            onSelect={handleSelect}
            allLabel={t("all")}
            titleLabel={t("filterByCategory")}
          />,
          document.body,
        )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════
   DRAWER MOBILE
   ═══════════════════════════════════════════════════════════ */

type MobileDrawerProps = {
  open: boolean;
  onClose: () => void;
  categories: ToolbarCategory[];
  loading: boolean;
  activeSlug: string | null;
  onSelect: (slug: string | null) => void;
  allLabel: string;
  titleLabel: string;
};

function MobileDrawer({
  open,
  onClose,
  categories,
  loading,
  activeSlug,
  onSelect,
  allLabel,
  titleLabel,
}: MobileDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  return (
    <div
      aria-hidden={!open}
      className={`
        md:hidden fixed inset-0 z-50
        transition-opacity duration-300
        ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
      `}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-hidden="true"
      />

      {/* Panneau qui slide depuis la droite */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={titleLabel}
        className={`
          absolute top-0 right-0 bottom-0
          w-[85vw] max-w-xs sm:max-w-sm
          bg-neutral-950/95 backdrop-blur-2xl
          border-l border-white/15
          shadow-2xl
          flex flex-col
          transition-transform duration-300 ease-out
          ${open ? "translate-x-0" : "translate-x-full"}
        `}
        style={{
          paddingTop: "env(safe-area-inset-top, 0px)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
          paddingRight: "env(safe-area-inset-right, 0px)",
        }}
      >
        {/* Header du drawer */}
        <div className="flex items-center justify-between px-4 h-14 border-b border-white/10 shrink-0">
          <span
            className={`text-white text-sm font-medium tracking-wide ${orbitron.className}`}
          >
            {titleLabel}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="
              flex items-center justify-center
              h-9 w-9 rounded-full
              text-white/70 hover:text-white
              bg-white/5 hover:bg-white/15
              active:bg-white/20
              transition-colors touch-manipulation
            "
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Liste des catégories — scroll vertical */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-3">
          {/* Bouton "Tous" */}
          <button
            type="button"
            onClick={() => onSelect(null)}
            aria-pressed={activeSlug === null}
            className={`
              w-full flex items-center gap-3
              px-3 h-12 mb-1
              rounded-xl
              text-sm
              transition-colors touch-manipulation
              ${activeSlug === null
                ? "bg-white/15 text-white font-medium"
                : "text-white/70 hover:text-white hover:bg-white/10 active:bg-white/15"}
              ${orbitron.className}
            `}
          >
            <span className="flex items-center justify-center h-7 w-7 rounded-full bg-white/15 border border-white/20">
              <span className="h-2 w-2 rounded-full bg-white/80" />
            </span>
            <span className="flex-1 text-left">{allLabel}</span>
            {activeSlug === null && (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </button>

          {/* Catégories */}
          {categories.map((cat) => {
            const isActive = activeSlug === cat.slug;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => onSelect(isActive ? null : cat.slug)}
                aria-pressed={isActive}
                className={`
                  w-full flex items-center gap-3
                  px-3 h-12 mb-1
                  rounded-xl
                  text-sm
                  transition-colors touch-manipulation
                  ${isActive
                    ? "bg-white/15 text-white font-medium"
                    : "text-white/70 hover:text-white hover:bg-white/10 active:bg-white/15"}
                  ${orbitron.className}
                `}
              >
                <CategoryIcon
                  color={cat.color}
                  iconKey={cat.icon}
                  isActive={isActive}
                  size={14}
                />
                <span className="flex-1 text-left">{cat.label}</span>
                {isActive && (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ color: cat.color }}
                    aria-hidden="true"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            );
          })}

          {/* Skeleton pendant le chargement */}
          {loading &&
            Array.from({ length: 4 }).map((_, i) => (
              <div
                key={`sk-${i}`}
                className="h-12 mb-1 rounded-xl bg-white/5 animate-pulse"
              />
            ))}

          {/* État vide */}
          {!loading && categories.length === 0 && (
            <p className="text-xs text-white/40 italic px-3 py-4 text-center">
              {allLabel}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

const BottomToolbar = memo(BottomToolbarInner);
BottomToolbar.displayName = "BottomToolbar";

export default BottomToolbar;