import type { Ionicons } from "@expo/vector-icons";

export const CARE_TEMPLATE_ICONS: Record<
  string,
  keyof typeof Ionicons.glyphMap
> = {
  water: "water-outline",
  fertilize: "flask-outline",
  mist: "rainy-outline",
  prune: "cut-outline",
  repot: "swap-vertical-outline",
  rotate: "refresh-outline",
  clean_leaves: "leaf-outline",
  inspect_pests: "search-outline",
  treat_pests: "bug-outline",
  quarantine: "shield-half-outline",
  measure_growth: "resize-outline",
  photo_update: "camera-outline",
  custom_note: "document-text-outline",
};

export function getCareTaskIcon(
  templateKey: string | null | undefined,
): keyof typeof Ionicons.glyphMap {
  if (templateKey && CARE_TEMPLATE_ICONS[templateKey]) {
    return CARE_TEMPLATE_ICONS[templateKey];
  }
  return "leaf-outline";
}
