import { Ionicons } from "@expo/vector-icons";
import { useThemeColor } from "heroui-native";
import { Text, View } from "react-native";

import type { WateringConsistency } from "@/lib/db/repositories";

type ConsistencyCardProps = {
  consistency: WateringConsistency | null;
};

const LABEL: Record<WateringConsistency, string> = {
  steady: "Steady",
  mostly_steady: "Mostly steady",
  catching_up: "Catching up",
};

const COPY: Record<WateringConsistency, string> = {
  steady: "Watering gaps are very even across your plants.",
  mostly_steady:
    "Watering rhythm is solid, with a few catch-ups here and there.",
  catching_up: "Some plants are watered in bursts. Setting reminders may help.",
};

export function ConsistencyCard({ consistency }: ConsistencyCardProps) {
  const accent = useThemeColor("accent");

  return (
    <View className="gap-2 rounded-3xl border border-border/30 bg-surface p-5">
      <View className="flex-row items-center gap-2">
        <Ionicons name="water-outline" size={18} color={accent} />
        <Text className="font-semibold text-foreground">
          Watering consistency
        </Text>
      </View>
      <Text className="font-bold text-foreground text-xl">
        {consistency ? LABEL[consistency] : "Not enough data yet"}
      </Text>
      <Text className="text-muted text-sm leading-5">
        {consistency
          ? COPY[consistency]
          : "Log a few more waterings to see your rhythm."}
      </Text>
    </View>
  );
}
