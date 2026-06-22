import { Ionicons } from "@expo/vector-icons";
import { cn, useThemeColor } from "heroui-native";
import { Text, View } from "react-native";

import type { PlantMoodInfo, PlantMoodTone } from "@/lib/care/plant-mood";

const TONE_BG: Record<PlantMoodTone, string> = {
  neutral: "bg-background/90",
  accent: "bg-accent-soft",
  success: "bg-success-soft",
  warning: "bg-warning-soft",
};

const TONE_TEXT: Record<PlantMoodTone, string> = {
  neutral: "text-muted",
  accent: "text-accent-soft-foreground",
  success: "text-success-soft-foreground",
  warning: "text-warning-soft-foreground",
};

const TONE_COLOR: Record<
  PlantMoodTone,
  "muted" | "accent" | "success" | "warning"
> = {
  neutral: "muted",
  accent: "accent",
  success: "success",
  warning: "warning",
};

export function PlantMoodChip({
  mood,
  className,
}: {
  mood: PlantMoodInfo;
  className?: string;
}) {
  const iconColor = useThemeColor(TONE_COLOR[mood.tone]);
  return (
    <View
      className={cn(
        "flex-row items-center gap-1 rounded-full px-2 py-1",
        TONE_BG[mood.tone],
        className,
      )}
    >
      <Ionicons name={mood.icon} size={11} color={iconColor} />
      <Text className={cn("font-medium text-[10px]", TONE_TEXT[mood.tone])}>
        {mood.label}
      </Text>
    </View>
  );
}
