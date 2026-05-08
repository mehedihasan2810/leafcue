import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useThemeColor } from "heroui-native";
import { Text, View } from "react-native";
import { OnboardingShell } from "@/screens/onboarding/_components/onboarding-shell";

const PROMISES: ReadonlyArray<{
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}> = [
  {
    icon: "phone-portrait-outline",
    title: "On-device only",
    description:
      "Plants, photos, and journals live in this device's local database — nothing is uploaded.",
  },
  {
    icon: "lock-closed-outline",
    title: "No account required",
    description:
      "Skip sign-ups, passwords, and emails. LeafCue works offline from the very first launch.",
  },
  {
    icon: "eye-off-outline",
    title: "Zero tracking",
    description:
      "No analytics, no ads, no third-party SDKs watching what you do.",
  },
  {
    icon: "cloud-offline-outline",
    title: "Bring your own backup",
    description:
      "Export and re-import your library on your terms when sync arrives later.",
  },
];

export function OnboardingPrivacyScreen() {
  const accent = useThemeColor("accent");

  return (
    <OnboardingShell
      step={2}
      title="Private by design"
      subtitle="LeafCue protects your plant care notes the same way it protects you."
      illustration={
        <View className="">
          <Image
            source={require("@/assets/images/plant.png")}
            style={{ width: 256, height: 256 }}
            contentFit="contain"
          />
        </View>
      }
      primaryLabel="That sounds great"
      primaryIcon="arrow-forward-outline"
      onPressPrimary={() => router.push("/onboarding/track")}
      secondaryLabel="Back"
      onPressSecondary={() => router.back()}
    >
      <View className="gap-3">
        {PROMISES.map((promise) => (
          <View
            key={promise.title}
            className="flex-row items-start gap-3 rounded-2xl border border-border/40 bg-surface p-4"
          >
            <View className="size-10 items-center justify-center rounded-xl bg-accent-soft">
              <Ionicons name={promise.icon} size={20} color={accent} />
            </View>
            <View className="flex-1 gap-0.5">
              <Text className="font-semibold text-base text-foreground">
                {promise.title}
              </Text>
              <Text className="text-muted text-sm leading-5">
                {promise.description}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </OnboardingShell>
  );
}
