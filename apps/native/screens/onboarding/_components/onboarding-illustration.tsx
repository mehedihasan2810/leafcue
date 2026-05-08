import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { cn, useThemeColor } from "heroui-native";
import { View } from "react-native";

export type OnboardingIllustrationVariant =
  | "welcome"
  | "privacy"
  | "track"
  | "room"
  | "finish";

const TRACK_ICONS: ReadonlyArray<keyof typeof Ionicons.glyphMap> = [
  "water-outline",
  "flask-outline",
  "camera-outline",
  "document-text-outline",
];

type OnboardingIllustrationProps = {
  variant: OnboardingIllustrationVariant;
};

export function OnboardingIllustration({
  variant,
}: OnboardingIllustrationProps) {
  const accent = useThemeColor("accent");
  const success = useThemeColor("success");

  if (variant === "welcome" || variant === "finish") {
    return (
      <View className="items-center justify-center">
        <View
          className={cn(
            "relative items-center justify-center rounded-[2.75rem] border border-border/30 bg-surface/80 p-6 shadow-sm",
            variant === "finish" && "border-success/25",
          )}
        >
          <Image
            source={require("@/assets/images/plant.png")}
            style={{ width: 220, height: 220 }}
            contentFit="contain"
          />
          {variant === "finish" ? (
            <View className="absolute -top-2 -right-2 rounded-full border border-border/40 bg-surface p-2 shadow-sm">
              <Ionicons name="checkmark-circle" size={28} color={success} />
            </View>
          ) : null}
        </View>
      </View>
    );
  }

  if (variant === "privacy") {
    return (
      <View className="h-56 w-64 items-center justify-center">
        <View className="absolute size-44 rounded-full bg-accent-soft/60" />
        <View className="absolute size-28 translate-x-8 translate-y-6 rounded-full bg-accent-soft/35" />
        <View className="rounded-3xl border border-border/40 bg-surface/90 p-7 shadow-sm">
          <Ionicons name="shield-checkmark-outline" size={88} color={accent} />
        </View>
      </View>
    );
  }

  if (variant === "track") {
    return (
      <View className="h-56 w-64 items-center justify-center">
        <View className="flex-row flex-wrap justify-center gap-3">
          {TRACK_ICONS.map((name) => (
            <View
              key={name}
              className="size-[4.5rem] items-center justify-center rounded-2xl border border-border/40 bg-surface/90 shadow-sm"
            >
              <Ionicons name={name} size={30} color={accent} />
            </View>
          ))}
        </View>
      </View>
    );
  }

  // room
  return (
    <View className="h-56 w-64 items-center justify-center">
      <View className="absolute size-40 rounded-full bg-accent-soft/50" />
      <View className="flex-row items-end gap-2">
        <View className="rounded-3xl border border-border/40 bg-surface/90 p-6 shadow-sm">
          <Ionicons name="home-outline" size={72} color={accent} />
        </View>
        <View className="-mb-1 rounded-2xl border border-border/40 bg-surface/90 p-3 shadow-sm">
          <Ionicons name="leaf-outline" size={32} color={accent} />
        </View>
      </View>
    </View>
  );
}
