"use client";

import { memo, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { orbitron } from "@/fonts/font";
import type { ToolbarCategory } from "@/app/lib/jobs/category-colors";
import { getCategoryIcon } from "@/app/lib/jobs/category-icons";

/* ═══════════════════════════════════════════════════════════
   CACHE MODULE-LEVEL
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
   COMPOSANT
   ═══════════════════════════════════════════════════════════ */

function BottomToolbarInner({
  activeSlug,
  onSelect,
  categories: external,
}: BottomToolbarProps) {
  const t = useTranslations("BottomToolbar");
  const [categories, setCategories] = useState<ToolbarCategory[]>(
    external ?? categoriesCache ?? [],
  );

  useEffect(() => {
    if (external) {
      setCategories(external);
      return;
    }
    if (categoriesCache) {
      setCategories(categoriesCache);
      return;
    }

    let mounted = true;
    fetchCategories().then((list) => {
      if (mounted) setCategories(list);
    });
    return () => {
      mounted = false;
    };
  }, [external]);

  if (categories.length === 0) return null;

  return (
    <div
      className="
        absolute z-20 pointer-events-none
        left-2 right-2
        bottom-[calc(10px+env(safe-area-inset-bottom,0px))]
        sm:left-3 sm:right-3 sm:bottom-[calc(12px+env(safe-area-inset-bottom,0px))]
        md:left-4 md:right-4 md:bottom-4
      "
    >
      <div
        role="tablist"
        aria-label={t("filterByCategory")}
        className="
          pointer-events-auto mx-auto
          flex flex-nowrap items-center
          gap-2 sm:gap-1.5
          overflow-x-auto
          min-w-0 max-w-full
          snap-x snap-mandatory scroll-smooth
          rounded-2xl
          bg-black/55 backdrop-blur-md
          sm:backdrop-blur-xl
          border border-white/15
          px-2 py-2 sm:px-2.5
          shadow-2xl shadow-black/40
          no-scrollbar overscroll-x-contain
          contain-[paint]
        "
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeSlug === null}
          onClick={() => onSelect(null)}
          className={`
            shrink-0 snap-start
            flex items-center gap-2
            pl-1 pr-2.5
            h-9 sm:h-8
            rounded-full
            text-[11px] sm:text-xs
            transition-all duration-200 cursor-pointer
            touch-manipulation
            ${activeSlug === null
              ? "bg-white/15 text-white font-medium"
              : "text-white/60 hover:text-white/90 hover:bg-white/10 active:bg-white/15"}
            ${orbitron.className}
          `}
        >
          <span
            className="
              flex items-center justify-center
              h-6 w-6 sm:h-5 sm:w-5
              rounded-full
              bg-white/15 backdrop-blur-md
              border border-white/20
              shadow-[inset_0_0_6px_rgba(255,255,255,0.15)]
            "
          >
            <span className="h-1.5 w-1.5 rounded-full bg-white/80" />
          </span>
          <span className="whitespace-nowrap">{t("all")}</span>
        </button>

        {/* ─── Catégories ─── */}
        {categories.map((cat) => {
          const isActive = activeSlug === cat.slug;
          const IconComponent = getCategoryIcon(cat.icon);

          return (
            <button
              key={cat.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onSelect(isActive ? null : cat.slug)}
              title={cat.label}
              className={`
                shrink-0 snap-start
                flex items-center gap-2
                pl-1 pr-2.5
                h-9 sm:h-8
                rounded-full
                text-[11px] sm:text-xs
                transition-all duration-200 cursor-pointer
                touch-manipulation
                ${isActive
                  ? "bg-white/15 text-white font-medium scale-[1.03]"
                  : "text-white/60 hover:text-white/90 hover:bg-white/10 active:bg-white/15"}
                ${orbitron.className}
              `}
            >
              {/* Pastille glassmorphism */}
              <span
                className="
                  relative flex items-center justify-center
                  h-6 w-6 sm:h-5 sm:w-5
                  rounded-full
                  backdrop-blur-md
                  border border-white/25
                  transition-all duration-200
                "
                style={{
                  backgroundColor: `${cat.color}22`,
                  borderColor: isActive ? `${cat.color}80` : `${cat.color}40`,
                  boxShadow: isActive
                    ? `
                        0 0 10px ${cat.color}80,
                        0 0 20px ${cat.color}40,
                        inset 0 0 8px ${cat.color}40,
                        inset 0 1px 1px rgba(255,255,255,0.2)
                      `
                    : `
                        0 0 4px ${cat.color}40,
                        inset 0 0 6px ${cat.color}20,
                        inset 0 1px 1px rgba(255,255,255,0.15)
                      `,
                }}
              >
                <span
                  aria-hidden="true"
                  className="
                    absolute top-0 left-0 right-0 h-1/2
                    rounded-t-full
                    bg-gradient-to-b from-white/25 to-transparent
                    pointer-events-none
                  "
                />

                <IconComponent
                  size={13}
                  weight={isActive ? "fill" : "regular"}
                  style={{
                    color: cat.color,
                    filter: isActive ? `drop-shadow(0 0 2px ${cat.color})` : "none",
                  }}
                  aria-hidden="true"
                />
              </span>

              {/* Label — toujours visible */}
              <span className="whitespace-nowrap">{cat.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

const BottomToolbar = memo(BottomToolbarInner);
BottomToolbar.displayName = "BottomToolbar";

export default BottomToolbar;