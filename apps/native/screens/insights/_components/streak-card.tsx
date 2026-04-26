import { Ionicons } from "@expo/vector-icons";
import { useThemeColor } from "heroui-native";
import { Text, View } from "react-native";

type StreakCardProps = {
  days: number;
};

export function StreakCard({ days }: StreakCardProps) {
  const accent = useThemeColor("accent");

  return (
    <View className="gap-2 rounded-3xl border border-border/30 bg-accent-soft/40 p-5">
      <View className="flex-row items-center gap-2">
        <Ionicons name="flame-outline" size={18} color={accent} />
        <Text className="font-semibold text-foreground">Care streak</Text>
      </View>
      <Text className="font-bold text-3xl text-foreground">
        {days} {days === 1 ? "day" : "days"}
      </Text>
      <Text className="text-muted text-sm leading-5">
        {days === 0
          ? "Log a care action today to start a streak."
          : days < 3
            ? "Nice start — a little daily care goes a long way."
            : "You're showing up consistently. Plants love that."}
      </Text>
    </View>
  );
}
