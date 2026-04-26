import { Ionicons } from "@expo/vector-icons";
import { Button, cn, useThemeColor } from "heroui-native";
import type { ReactNode } from "react";
import { Text, View } from "react-native";

type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  illustration?: ReactNode;
  ctaLabel?: string;
  onPressCta?: () => void;
  secondaryLabel?: string;
  onPressSecondary?: () => void;
  className?: string;
};

export function EmptyState({
  title,
  description,
  icon = "leaf-outline",
  illustration,
  ctaLabel,
  onPressCta,
  secondaryLabel,
  onPressSecondary,
  className,
}: EmptyStateProps) {
  const accent = useThemeColor("accent");

  return (
    <View
      className={cn(
        "items-center justify-center gap-4 rounded-3xl border border-border/40 bg-surface px-6 py-10",
        className,
      )}
    >
      {illustration ? (
        illustration
      ) : (
        <View className="size-16 items-center justify-center rounded-full bg-accent-soft">
          <Ionicons name={icon} size={28} color={accent} />
        </View>
      )}
      <View className="items-center gap-2">
        <Text className="text-center font-semibold text-foreground text-xl">
          {title}
        </Text>
        {description ? (
          <Text className="max-w-xs text-center text-base text-muted leading-6">
            {description}
          </Text>
        ) : null}
      </View>

      {ctaLabel || secondaryLabel ? (
        <View className="w-full gap-2 pt-2">
          {ctaLabel ? (
            <Button onPress={onPressCta}>
              <Button.Label>{ctaLabel}</Button.Label>
            </Button>
          ) : null}
          {secondaryLabel ? (
            <Button variant="ghost" onPress={onPressSecondary}>
              <Button.Label>{secondaryLabel}</Button.Label>
            </Button>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
