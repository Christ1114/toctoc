"use client";

import type { Icon } from "@phosphor-icons/react";
import {
  BabyIcon,
  BroomIcon,
  CookingPotIcon,
  CarIcon,
  PlantIcon,
  ShieldIcon,
  PersonArmsSpreadIcon,
  CrownIcon,
  SparkleIcon,
} from "@phosphor-icons/react";
import type { CategoryIconName } from "./category-colors";

/**
 * Mapping nom (string) → composant Phosphor.
 * ✅ Tree-shakeable : seules ces 9 icônes sont bundlées
 * ✅ Exhaustif : TS erreur si une clé manque (grâce à CategoryIconName)
 */
export const CATEGORY_ICONS: Record<CategoryIconName, Icon> = {
  "baby":               BabyIcon,
  "broom":              BroomIcon,
  "cooking-pot":        CookingPotIcon,
  "car":                CarIcon,
  "plant":              PlantIcon,
  "shield":             ShieldIcon,
  "person-arms-spread": PersonArmsSpreadIcon,
  "crown":              CrownIcon,
  "sparkle":            SparkleIcon,
};

/** Fallback safe si nom inconnu */
export function getCategoryIcon(name: CategoryIconName): Icon {
  return CATEGORY_ICONS[name] ?? SparkleIcon;
}