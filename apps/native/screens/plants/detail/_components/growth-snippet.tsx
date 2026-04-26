import { Ionicons } from "@expo/vector-icons";
import { useThemeColor } from "heroui-native";
import { Pressable, Text, View } from "react-native";

import { SectionHeader } from "@/components/section-header";
import type { GrowthMeasurement } from "@/lib/db/types";

type GrowthSnippetProps = {
  measurements: ReadonlyArray<GrowthMeasurement>;
  onPressSeeAll: () => void;
};

export function GrowthSnippet({
  measurements,
  onPressSeeAll,
}: GrowthSnippetProps) {
  const accent = useThemeColor("accent");
  const muted = useThemeColor("muted");

  const latest = measurements[0] ?? null;

  return (
    <View className="gap-3">
      <SectionHeader
        title="Growth"
        count={measurements.length}
        actionLabel={measurements.length > 0 ? "See all" : "Track"}
        onPressAction={onPressSeeAll}
      />
      {!latest ? (
        <Pressable
          onPress={onPressSeeAll}
          className="flex-row items-center gap-3 rounded-2xl border border-border/40 border-dashed bg-surface p-4"
        >
          <View className="size-10 items-center justify-center rounded-xl bg-accent-soft">
            <Ionicons name="resize-outline" size={18} color={accent} />
          </View>
          <View className="flex-1">
            <Text className="font-medium text-foreground text-sm">
              Track growth
            </Text>
            <Text className="text-muted text-xs">
              Height, leaves, blooms over time.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={muted} />
        </Pressable>
      ) : (
        <Pressable
          onPress={onPressSeeAll}
          className="flex-row items-center gap-3 rounded-2xl border border-border/30 bg-surface p-4"
        >
          <View className="size-10 items-center justify-center rounded-xl bg-accent-soft">
            <Ionicons name="resize-outline" size={18} color={accent} />
          </View>
          <View className="flex-1 gap-1">
            <Text className="font-medium text-foreground text-sm">
              {latest.heightCm !== null
                ? `${latest.heightCm} cm`
                : "Latest reading"}
            </Text>
            <Text className="text-muted text-xs" numberOfLines={1}>
              {[
                latest.leafCount !== null ? `${latest.leafCount} leaves` : null,
                latest.bloomCount !== null
                  ? `${latest.bloomCount} blooms`
                  : null,
                latest.notes,
              ]
                .filter(Boolean)
                .join(" · ") || "Logged"}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={muted} />
        </Pressable>
      )}
    </View>
  );
}
