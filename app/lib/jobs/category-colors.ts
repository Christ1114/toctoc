/* ═══════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════ */

export type CategoryIconName =
  | "baby"
  | "broom"
  | "cooking-pot"
  | "car"
  | "plant"
  | "shield"
  | "person-arms-spread"
  | "crown"
  | "sparkle";

export type CategoryConfig = {
  color: string;
  label: string;
  icon: CategoryIconName;
  position: number;
};

/* ═══════════════════════════════════════════════════════════
   CONFIG UI (source de vérité pour l'affichage)
   ═══════════════════════════════════════════════════════════ */

export const CATEGORY_CONFIG: Record<string, CategoryConfig> = {
  GARDE_ENFANTS: { color: "#F5C542", label: "Garde d'enfants", icon: "baby",               position: 1 },
  MENAGE:        { color: "#2F7A4F", label: "Ménage",          icon: "broom",              position: 2 },
  CUISINE:       { color: "#C1502E", label: "Cuisine",         icon: "cooking-pot",        position: 3 },
  CHAUFFEUR:     { color: "#3E7CB1", label: "Chauffeur",       icon: "car",                position: 4 },
  JARDINAGE:     { color: "#6B8E23", label: "Jardinage",       icon: "plant",              position: 5 },
  GARDIENNAGE:   { color: "#8B5FBF", label: "Gardiennage",     icon: "shield",             position: 6 },
  AIDE_PERSONNE: { color: "#D1637A", label: "Aide personne",   icon: "person-arms-spread", position: 7 },
  MAJORDOME:     { color: "#C9A227", label: "Majordome",       icon: "crown",              position: 8 },
} as const;

export const DEFAULT_CATEGORY = {
  color: "#432dd7",
  label: "Autre",
  icon: "sparkle",
  position: 999,
} as const satisfies CategoryConfig;

/* ═══════════════════════════════════════════════════════════
   MAPPING DB → TOOLBAR
   ─────────────────────────────────────────────────────────
   Les valeurs à gauche viennent de l'enum Prisma `ProviderType`.
   Les valeurs à droite sont les clés de CATEGORY_CONFIG (UI).
   ═══════════════════════════════════════════════════════════ */

export const DB_TO_TOOLBAR: Record<string, string> = {
  // Enum DB                     → Clé toolbar
  BABYSITTER:                    "GARDE_ENFANTS",
  GARDE_PERISCOLAIRE:            "GARDE_ENFANTS",
  MENAGE:                        "MENAGE",
  AIDE_PERSONNES_AGEES:          "AIDE_PERSONNE",
  RESIDENTIEL:                   "GARDIENNAGE",
  COURT_TERME:                   "MAJORDOME",

  // Optionnel : si la DB contient aussi des valeurs "toolbar" brutes
  GARDE_ENFANTS:                 "GARDE_ENFANTS",
  AIDE_PERSONNE:                 "AIDE_PERSONNE",
  CUISINE:                       "CUISINE",
  CHAUFFEUR:                     "CHAUFFEUR",
  JARDINAGE:                     "JARDINAGE",
  GARDIENNAGE:                   "GARDIENNAGE",
  MAJORDOME:                     "MAJORDOME",
};

/* ═══════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════ */

const normalizeKey = (s: string) =>
  s.trim().toUpperCase().replace(/[\s-]+/g, "_");

/**
 * Convertit une valeur DB (enum) en clé toolbar.
 * Fallback : la valeur normalisée elle-même.
 */
export function getToolbarKeyFromDbCategory(
  dbCategory: string | null | undefined,
): string | null {
  if (!dbCategory) return null;
  const key = normalizeKey(dbCategory);
  return DB_TO_TOOLBAR[key] ?? key;
}

/**
 * Récupère la config d'affichage (couleur, label, icône).
 * Accepte indifféremment une valeur DB ou une clé toolbar.
 */
export function getCategoryConfig(
  category: string | null | undefined,
): CategoryConfig {
  if (!category) return DEFAULT_CATEGORY;
  const toolbarKey = getToolbarKeyFromDbCategory(category);
  if (!toolbarKey) return DEFAULT_CATEGORY;
  return (
    CATEGORY_CONFIG[toolbarKey] ?? { ...DEFAULT_CATEGORY, label: category }
  );
}

/* ═══════════════════════════════════════════════════════════
   EXPORTS POUR LE TOOLBAR
   ═══════════════════════════════════════════════════════════ */

export type ToolbarCategory = CategoryConfig & { key: string; slug: string };

const ALL_CATEGORIES: readonly ToolbarCategory[] = Object.freeze(
  Object.entries(CATEGORY_CONFIG)
    .map(([key, config]) => ({
      key,
      slug: key.toLowerCase().replace(/_/g, "-"),
      ...config,
    }))
    .sort((a, b) => a.position - b.position),
);

export function getAllCategoryConfigs(): readonly ToolbarCategory[] {
  return ALL_CATEGORIES;
}