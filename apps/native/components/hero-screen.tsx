import { LinearGradient } from "expo-linear-gradient";
import { cn, useThemeColor } from "heroui-native";
import type { PropsWithChildren, ReactNode } from "react";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { selectIsLightTheme, useThemeStore } from "@/stores/use-theme-store";

type HeroScreenProps = PropsWithChildren<{
  title?: string;
  subtitle?: string;
  eyebrow?: ReactNode;
  illustration?: ReactNode;
  footer?: ReactNode;
  className?: string;
  contentClassName?: string;
  isScrollable?: boolean;
}>;

export function HeroScreen({
  title,
  subtitle,
  eyebrow,
  illustration,
  footer,
  className,
  contentClassName,
  isScrollable = true,
  children,
}: HeroScreenProps) {
  const insets = useSafeAreaInsets();
  const isLight = useThemeStore(selectIsLightTheme);
  const [accentSoft, surface, background] = useThemeColor([
    "accent-soft",
    "surface",
    "background",
  ]);

  const gradientColors: readonly [string, string, string] = isLight
    ? [accentSoft, surface, background]
    : [background, surface, accentSoft];

  const containerPadding = {
    paddingTop: insets.top + 16,
    paddingBottom: footer ? 16 : insets.bottom + 24,
  };

  const inner = (
    <View className={cn("flex-1 gap-6 px-6", contentClassName)}>
      {illustration ? (
        <View className="items-center justify-center pt-2">{illustration}</View>
      ) : null}

      {eyebrow || title || subtitle ? (
        <View className="gap-3">
          {eyebrow ? <View className="self-start">{eyebrow}</View> : null}
          {title ? (
            <Text className="font-display text-4xl text-foreground leading-tight">
              {title}
            </Text>
          ) : null}
          {subtitle ? (
            <Text className="text-base text-muted leading-6">{subtitle}</Text>
          ) : null}
        </View>
      ) : null}

      {children}
    </View>
  );

  return (
    <View className={cn("flex-1 bg-background", className)}>
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: "absolute", inset: 0 }}
        pointerEvents="none"
      />

      {isScrollable ? (
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, ...containerPadding }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {inner}
        </ScrollView>
      ) : (
        <View style={{ flex: 1, ...containerPadding }}>{inner}</View>
      )}

      {footer ? (
        <View
          className="border-border/40 border-t bg-background/95 px-6 pt-3"
          style={{ paddingBottom: insets.bottom + 12 }}
        >
          {footer}
        </View>
      ) : null}
    </View>
  );
}
