import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useThemeColor } from "heroui-native";
import { Text, View } from "react-native";

import { useDatabase } from "@/lib/db";
import { OnboardingShell } from "@/screens/onboarding/_components/onboarding-shell";
import { useOnboardingStore } from "@/stores/use-onboarding-store";

export function OnboardingFinishScreen() {
  const accent = useThemeColor("accent");
  const success = useThemeColor("success");
  const db = useDatabase();
  const completeOnboarding = useOnboardingStore((state) => state.complete);

  const handleAddFirstPlant = () => {
    completeOnboarding(db);
    router.replace("/(tabs)");
    router.push("/plants/new");
  };

  const handleDone = () => {
    completeOnboarding(db);
    router.replace("/(tabs)");
  };

  return (
    <OnboardingShell
      step={5}
      title="You're all set"
      subtitle="LeafCue is ready. Add your first plant now or explore the app first — you can always come back."
      illustration={
        <View className="size-32 items-center justify-center rounded-3xl bg-success-soft">
          <Ionicons name="happy-outline" size={64} color={success} />
        </View>
      }
      primaryLabel="Add my first plant"
      primaryIcon="add-circle-outline"
      onPressPrimary={handleAddFirstPlant}
      secondaryLabel="I'll explore first"
      onPressSecondary={handleDone}
      showSkip={false}
    >
      <View className="gap-3 rounded-3xl border border-border/40 bg-surface p-5">
        <View className="flex-row items-start gap-3">
          <Ionicons name="ribbon-outline" size={20} color={accent} />
          <Text className="flex-1 text-foreground leading-5">
            Pro tip: each plant comes with sensible default care schedules. Tap
            a plant later to fine-tune its watering rhythm.
          </Text>
        </View>
      </View>
    </OnboardingShell>
  );
}
