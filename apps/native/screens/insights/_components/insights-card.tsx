import type { ReactNode } from "react";
import { Text, View } from "react-native";

type InsightsCardProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export function InsightsCard({
  title,
  description,
  children,
}: InsightsCardProps) {
  return (
    <View className="gap-3 rounded-3xl border border-border/30 bg-surface p-5">
      <View className="gap-1">
        <Text className="font-semibold text-base text-foreground">{title}</Text>
        {description ? (
          <Text className="text-muted text-xs">{description}</Text>
        ) : null}
      </View>
      <View className="gap-2">{children}</View>
    </View>
  );
}
