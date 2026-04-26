import { Ionicons } from "@expo/vector-icons";
import { differenceInCalendarDays } from "date-fns";
import { useThemeColor } from "heroui-native";
import { Text, View } from "react-native";

import { StatPill } from "@/components/stat-pill";
import type { GrowthMeasurement, Plant } from "@/lib/db/types";

type GrowthProgressCardProps = {
  plant: Plant;
  measurements: ReadonlyArray<GrowthMeasurement>;
};

export function GrowthProgressCard({
  plant,
  measurements,
}: GrowthProgressCardProps) {
  const accent = useThemeColor("accent");
  const muted = useThemeColor("muted");

  const sorted = [...measurements].sort(
    (a, b) => a.measuredAt.getTime() - b.measuredAt.getTime(),
  );

  const earliest = sorted[0];
  const latest = sorted[sorted.length - 1];

  const heightDelta =
    latest && earliest && earliest.id !== latest.id
      ? formatDelta(latest.heightCm, earliest.heightCm)
      : null;
  const leafDelta =
    latest && earliest && earliest.id !== latest.id
      ? formatIntDelta(latest.leafCount, earliest.leafCount)
      : null;
  const bloomDelta =
    latest && earliest && earliest.id !== latest.id
      ? formatIntDelta(latest.bloomCount, earliest.bloomCount)
      : null;

  const days = plant.acquiredAt
    ? differenceInCalendarDays(new Date(), plant.acquiredAt)
    : null;

  return (
    <View className="gap-3 rounded-3xl border border-border/40 bg-surface p-4">
      <View className="flex-row items-center gap-2">
        <View className="size-10 items-center justify-center rounded-2xl bg-accent-soft">
          <Ionicons name="trending-up-outline" size={18} color={accent} />
        </View>
        <View className="flex-1">
          <Text className="font-semibold text-foreground">
            Growth at a glance
          </Text>
          <Text className="text-muted text-xs">
            {sorted.length === 0
              ? "No measurements yet"
              : `${sorted.length} reading${sorted.length === 1 ? "" : "s"}`}
          </Text>
        </View>
      </View>

      <View className="flex-row flex-wrap gap-2">
        <StatPill
          label="Latest height"
          value={
            latest?.heightCm !== undefined && latest?.heightCm !== null
              ? `${latest.heightCm} cm`
              : "—"
          }
          icon="resize-outline"
        />
        <StatPill
          label="Δ height"
          value={heightDelta ?? "—"}
          icon="arrow-up-outline"
          tone={
            heightDelta && !heightDelta.startsWith("-") ? "success" : "neutral"
          }
        />
        <StatPill
          label="Leaves"
          value={
            latest?.leafCount !== undefined && latest?.leafCount !== null
              ? String(latest.leafCount)
              : "—"
          }
          icon="leaf-outline"
        />
        <StatPill
          label="Δ leaves"
          value={leafDelta ?? "—"}
          icon="leaf-outline"
          tone={leafDelta && !leafDelta.startsWith("-") ? "success" : "neutral"}
        />
        <StatPill
          label="Blooms"
          value={
            latest?.bloomCount !== undefined && latest?.bloomCount !== null
              ? String(latest.bloomCount)
              : "—"
          }
          icon="flower-outline"
        />
        <StatPill
          label="Δ blooms"
          value={bloomDelta ?? "—"}
          icon="flower-outline"
          tone={
            bloomDelta && !bloomDelta.startsWith("-") ? "success" : "neutral"
          }
        />
        <StatPill
          label="With you"
          value={days !== null ? `${days} d` : "—"}
          icon="calendar-outline"
          tone="accent"
        />
      </View>
      {sorted.length === 0 ? (
        <Text className="text-muted text-xs" style={{ color: muted }}>
          Tap "Log measurement" to start tracking growth.
        </Text>
      ) : null}
    </View>
  );
}

function formatDelta(
  latest: number | null,
  earliest: number | null,
): string | null {
  if (latest === null || earliest === null) return null;
  const diff = latest - earliest;
  const sign = diff > 0 ? "+" : "";
  return `${sign}${diff.toFixed(1)} cm`;
}

function formatIntDelta(
  latest: number | null,
  earliest: number | null,
): string | null {
  if (latest === null || earliest === null) return null;
  const diff = latest - earliest;
  const sign = diff > 0 ? "+" : "";
  return `${sign}${diff}`;
}
