

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

const normalizeKey = (s: string) => s.trim().toUpperCase().replace(/[\s-]+/g, "_");

export function getCategoryConfig(category: string | null | undefined): CategoryConfig {
  if (!category) return DEFAULT_CATEGORY;
  const key = normalizeKey(category);
  return CATEGORY_CONFIG[key] ?? { ...DEFAULT_CATEGORY, label: category };
}

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