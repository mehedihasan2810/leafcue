import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useThemeColor } from "heroui-native";
import { Text, View } from "react-native";
import { OnboardingIllustration } from "@/screens/onboarding/_components/onboarding-illustration";
import { OnboardingShell } from "@/screens/onboarding/_components/onboarding-shell";

const CAPABILITIES: ReadonlyArray<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description: string;
}> = [
  {
    icon: "water-outline",
    label: "Watering",
    description: "Per-plant cadence",
  },
  {
    icon: "flask-outline",
    label: "Fertilizing",
    description: "Smart reminders",
  },
  {
    icon: "camera-outline",
    label: "Photos",
    description: "Track growth",
  },
  {
    icon: "document-text-outline",
    label: "Notes",
    description: "Journal ideas",
  },
  {
    icon: "resize-outline",
    label: "Growth",
    description: "Height & spread",
  },
  {
    icon: "medkit-outline",
    label: "Health",
    description: "Issues & wins",
  },
];

export function OnboardingTrackScreen() {
  const accent = useThemeColor("accent");

  return (
    <OnboardingShell
      step={3}
      title="Track everything that matters"
      subtitle="Build a clear picture of every plant — without the chore-list feel."
      illustration={<OnboardingIllustration variant="track" />}
      primaryLabel="Sounds good"
      primaryIcon="arrow-forward-outline"
      onPressPrimary={() => router.push("/onboarding/room")}
      secondaryLabel="Back"
      onPressSecondary={() => router.back()}
    >
      <View className="flex-row flex-wrap gap-3">
        {CAPABILITIES.map((capability) => (
          <View
            key={capability.label}
            className="flex-1 basis-[44%] gap-2 rounded-2xl border border-border/40 bg-surface p-4"
          >
            <View className="size-10 items-center justify-center rounded-xl bg-accent-soft">
              <Ionicons name={capability.icon} size={20} color={accent} />
            </View>
            <View className="gap-0.5">
              <Text className="font-semibold text-base text-foreground">
                {capability.label}
              </Text>
              <Text className="text-muted text-xs leading-4">
                {capability.description}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </OnboardingShell>
  );
}
