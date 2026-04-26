import { Text, View } from "react-native";

import { SectionHeader } from "@/components/section-header";
import { StatPill } from "@/components/stat-pill";
import type { Plant, PlantPreset } from "@/lib/db/types";

type CareProfileSectionProps = {
  plant: Plant;
  preset: PlantPreset | null;
};

const LIGHT_LABEL: Record<NonNullable<Plant["lightPreference"]>, string> = {
  low: "Low light",
  medium: "Medium light",
  "bright-indirect": "Bright indirect",
  "direct-sun": "Direct sun",
};

const WATER_LABEL: Record<NonNullable<Plant["wateringPreference"]>, string> = {
  low: "Low water",
  moderate: "Moderate water",
  high: "Heavy water",
  "let-dry-between": "Let dry between",
  "keep-moist": "Keep moist",
};

const TOXICITY_LABEL: Record<NonNullable<Plant["toxicity"]>, string> = {
  "non-toxic": "Non-toxic",
  "toxic-pets": "Toxic to pets",
  "toxic-children": "Toxic to children",
  "toxic-all": "Toxic to all",
  unknown: "Toxicity unknown",
};

export function CareProfileSection({ plant, preset }: CareProfileSectionProps) {
  const light = plant.lightPreference
    ? LIGHT_LABEL[plant.lightPreference]
    : null;
  const water = plant.wateringPreference
    ? WATER_LABEL[plant.wateringPreference]
    : null;
  const toxicity = plant.toxicity ? TOXICITY_LABEL[plant.toxicity] : null;
  const drainage =
    plant.hasDrainage === null
      ? null
      : plant.hasDrainage
        ? "Has drainage"
        : "No drainage";
  const pot =
    [plant.potType, plant.potSize].filter(Boolean).join(" · ") || null;

  const hasAnyPill = Boolean(light || water || toxicity || drainage || pot);

  return (
    <View className="gap-3">
      <SectionHeader title="Care profile" />
      {hasAnyPill ? (
        <View className="flex-row flex-wrap gap-2">
          {light ? (
            <StatPill label="Light" value={light} icon="sunny-outline" />
          ) : null}
          {water ? (
            <StatPill label="Water" value={water} icon="water-outline" />
          ) : null}
          {toxicity ? (
            <StatPill
              label="Toxicity"
              value={toxicity}
              icon="warning-outline"
              tone={
                plant.toxicity === "non-toxic"
                  ? "success"
                  : plant.toxicity === "unknown"
                    ? "neutral"
                    : "warning"
              }
            />
          ) : null}
          {pot ? (
            <StatPill label="Pot" value={pot} icon="ellipse-outline" />
          ) : null}
          {drainage ? (
            <StatPill
              label="Drainage"
              value={drainage}
              icon="water-outline"
              tone={plant.hasDrainage ? "success" : "warning"}
            />
          ) : null}
        </View>
      ) : (
        <View className="rounded-2xl border border-border/30 bg-surface p-4">
          <Text className="text-muted text-sm">
            No care preferences yet. Tap Edit to add light, water, and pot
            details.
          </Text>
        </View>
      )}
      {preset?.careSummary ? (
        <View className="gap-1 rounded-2xl border border-border/30 bg-surface p-4">
          <Text className="font-medium text-foreground text-sm">
            Preset hints · {preset.commonName}
          </Text>
          <Text className="text-muted text-xs leading-5">
            {preset.careSummary}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
