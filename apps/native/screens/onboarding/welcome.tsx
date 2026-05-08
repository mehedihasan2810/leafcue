import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useThemeColor } from "heroui-native";
import { Text, View } from "react-native";
import { OnboardingIllustration } from "@/screens/onboarding/_components/onboarding-illustration";
import { OnboardingShell } from "@/screens/onboarding/_components/onboarding-shell";

export function OnboardingWelcomeScreen() {
  const accent = useThemeColor("accent");

  return (
    <OnboardingShell
      step={1}
      title="Welcome to LeafCue"
      subtitle="A calm, private place to keep your plants thriving — no accounts, no clouds, just gentle reminders."
      illustration={<OnboardingIllustration variant="welcome" />}
      primaryLabel="Get started"
      primaryIcon="arrow-forward-outline"
      onPressPrimary={() => router.push("/onboarding/privacy")}
    >
      <View className="gap-4 rounded-3xl border border-border/40 bg-surface p-5">
        <View className="flex-row items-start gap-3">
          <Ionicons name="sunny-outline" size={20} color={accent} />
          <View className="flex-1 gap-0.5">
            <Text className="font-semibold text-base text-foreground">
              Daily care made simple
            </Text>
            <Text className="text-muted text-sm leading-5">
              Open the app and instantly see what each plant needs today.
            </Text>
          </View>
        </View>
        <View className="flex-row items-start gap-3">
          <Ionicons name="sparkles-outline" size={20} color={accent} />
          <View className="flex-1 gap-0.5">
            <Text className="font-semibold text-base text-foreground">
              A premium feel, none of the noise
            </Text>
            <Text className="text-muted text-sm leading-5">
              Hand-picked watering, fertilizing, and grooming cues — without ads
              or AI gimmicks.
            </Text>
          </View>
        </View>
      </View>
    </OnboardingShell>
  );
}
