import { Ionicons } from "@expo/vector-icons";
import { cn, useThemeColor } from "heroui-native";
import { Text, View } from "react-native";

type StatTone = "neutral" | "accent" | "success" | "warning" | "danger";

type StatPillProps = {
  icon?: keyof typeof Ionicons.glyphMap;
  label: string;
  value: number | string;
  tone?: StatTone;
  className?: string;
};

const toneToBg: Record<StatTone, string> = {
  neutral: "bg-surface",
  accent: "bg-accent-soft",
  success: "bg-success-soft",
  warning: "bg-warning-soft",
  danger: "bg-danger-soft",
};

const toneToText: Record<StatTone, string> = {
  neutral: "text-foreground",
  accent: "text-accent-soft-foreground",
  success: "text-success-soft-foreground",
  warning: "text-warning-soft-foreground",
  danger: "text-danger-soft-foreground",
};

const toneToColor: Record<
  StatTone,
  "foreground" | "accent" | "success" | "warning" | "danger"
> = {
  neutral: "foreground",
  accent: "accent",
  success: "success",
  warning: "warning",
  danger: "danger",
};

export function StatPill({
  icon,
  label,
  value,
  tone = "neutral",
  className,
}: StatPillProps) {
  const iconColor = useThemeColor(toneToColor[tone]);

  return (
    <View
      className={cn(
        "min-w-[88px] flex-1 gap-1 rounded-2xl border border-border/40 px-3 py-3",
        toneToBg[tone],
        className,
      )}
    >
      <View className="flex-row items-center gap-1.5">
        {icon ? <Ionicons name={icon} size={14} color={iconColor} /> : null}
        <Text className="font-medium text-muted text-xs uppercase tracking-wide">
          {label}
        </Text>
      </View>
      <Text
        className={cn("font-bold text-2xl", toneToText[tone])}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.6}
      >
        {value}
      </Text>
    </View>
  );
}
