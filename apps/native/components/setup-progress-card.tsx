import { Ionicons } from "@expo/vector-icons";
import { Button, PressableFeedback, useThemeColor } from "heroui-native";
import { Text, View } from "react-native";

import type {
  PlantSetupAction,
  PlantSetupProgress,
} from "@/lib/care/setup-progress";

type SetupProgressCardProps = {
  plantName: string;
  progress: PlantSetupProgress;
  onPressAction: (action: PlantSetupAction) => void;
  compact?: boolean;
};

export function SetupProgressCard({
  plantName,
  progress,
  onPressAction,
  compact,
}: SetupProgressCardProps) {
  const accent = useThemeColor("accent");
  const muted = useThemeColor("muted");

  if (progress.isComplete) return null;

  const nextItems = progress.missingItems.slice(0, compact ? 2 : 3);
  const primary = nextItems[0] ?? null;

  return (
    <View className="gap-3 rounded-3xl border border-accent/30 bg-accent-soft/30 p-4">
      <View className="flex-row items-start gap-3">
        <View className="size-10 items-center justify-center rounded-2xl bg-accent-soft">
          <Ionicons name="sparkles-outline" size={18} color={accent} />
        </View>
        <View className="flex-1 gap-1">
          <Text className="font-semibold text-base text-foreground">
            Finish personalizing care
          </Text>
          <Text className="text-muted text-xs leading-4">
            {progress.completed} of {progress.total} care details added for{" "}
            {plantName}.
          </Text>
        </View>
        <Text className="font-medium text-accent text-xs">
          {progress.percent}%
        </Text>
      </View>

      <View className="gap-2">
        {nextItems.map((item) => (
          <PressableFeedback
            key={item.key}
            onPress={() => onPressAction(item.key)}
            className="flex-row items-center gap-2 rounded-2xl bg-surface/80 px-3 py-2.5"
            accessibilityLabel={item.label}
          >
            <Ionicons name="ellipse-outline" size={12} color={muted} />
            <Text className="flex-1 text-foreground text-sm">{item.label}</Text>
            <Ionicons name="chevron-forward" size={14} color={muted} />
          </PressableFeedback>
        ))}
      </View>

      {primary ? (
        <Button
          size="sm"
          variant="secondary"
          onPress={() => onPressAction(primary.key)}
        >
          <Button.Label>{primary.label}</Button.Label>
        </Button>
      ) : null}
    </View>
  );
}
