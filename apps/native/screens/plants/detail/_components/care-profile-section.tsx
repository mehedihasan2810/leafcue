import { Ionicons } from "@expo/vector-icons";
import { useThemeColor } from "heroui-native";
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

const DIFFICULTY_LABEL: Record<NonNullable<Plant["careDifficulty"]>, string> = {
  easy: "Easy",
  moderate: "Moderate",
  hard: "Hard",
};

export function CareProfileSection({ plant, preset }: CareProfileSectionProps) {
  const difficulty = plant.careDifficulty
    ? DIFFICULTY_LABEL[plant.careDifficulty]
    : null;
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

  const hasAnyPill = Boolean(
    difficulty || light || water || toxicity || drainage || pot,
  );

  return (
    <View className="gap-3">
      <SectionHeader title="Care profile" />
      {hasAnyPill ? (
        <View className="flex-row flex-wrap gap-2">
          {difficulty ? (
            <StatPill
              label="Difficulty"
              value={difficulty}
              icon="barbell-outline"
              tone={
                plant.careDifficulty === "easy"
                  ? "success"
                  : plant.careDifficulty === "hard"
                    ? "danger"
                    : "warning"
              }
            />
          ) : null}
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

      <CareDetailRows plant={plant} preset={preset} />

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

type DetailRow = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
};

function CareDetailRows({
  plant,
  preset,
}: {
  plant: Plant;
  preset: PlantPreset | null;
}) {
  const accent = useThemeColor("accent");
  const soil = plant.soilType ?? preset?.soil ?? null;

  const rows: ReadonlyArray<DetailRow> = [
    soil ? { icon: "leaf-outline", label: "Soil", value: soil } : null,
    preset?.humidity
      ? { icon: "rainy-outline", label: "Humidity", value: preset.humidity }
      : null,
    preset?.temperature
      ? {
          icon: "thermometer-outline",
          label: "Temperature",
          value: preset.temperature,
        }
      : null,
    preset?.fertilizer
      ? { icon: "flask-outline", label: "Fertilizer", value: preset.fertilizer }
      : null,
  ].filter((row): row is DetailRow => row !== null);

  if (rows.length === 0) return null;

  return (
    <View className="gap-2.5 rounded-2xl border border-border/30 bg-surface p-4">
      <Text className="font-medium text-foreground text-sm">Care details</Text>
      {rows.map((row) => (
        <View key={row.label} className="flex-row items-start gap-2.5">
          <Ionicons name={row.icon} size={15} color={accent} />
          <View className="flex-1 gap-0.5">
            <Text className="font-medium text-foreground text-xs">
              {row.label}
            </Text>
            <Text className="text-muted text-xs leading-4">{row.value}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}
