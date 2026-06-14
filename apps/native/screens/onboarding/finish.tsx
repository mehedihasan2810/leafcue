import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useThemeColor } from "heroui-native";
import { Text, View } from "react-native";

import { useDatabase } from "@/lib/db";
import { OnboardingIllustration } from "@/screens/onboarding/_components/onboarding-illustration";
import { OnboardingShell } from "@/screens/onboarding/_components/onboarding-shell";
import { useOnboardingStore } from "@/stores/use-onboarding-store";

export function OnboardingFinishScreen() {
  const accent = useThemeColor("accent");
  const db = useDatabase();
  const completeOnboarding = useOnboardingStore((state) => state.complete);
  const activated = useOnboardingStore(
    (state) => state.profile.completedActivation,
  );

  const handleDone = () => {
    completeOnboarding(db);
    router.replace("/(tabs)");
  };

  return (
    <OnboardingShell
      step={8}
      title="You're all set"
      subtitle={
        activated
          ? "Your first plant is in and its care plan is ready. Open Today to see what's next."
          : "LeafCue is ready whenever you are — add a plant anytime from the Today screen."
      }
      illustration={<OnboardingIllustration variant="finish" />}
      primaryLabel="Start using LeafCue"
      primaryIcon="arrow-forward-outline"
      onPressPrimary={handleDone}
      showSkip={false}
    >
      <View className="gap-3 rounded-3xl border border-border/40 bg-surface p-5">
        <View className="flex-row items-start gap-3">
          <Ionicons name="ribbon-outline" size={20} color={accent} />
          <Text className="flex-1 text-foreground leading-5">
            Tip: tap any plant to fine-tune its watering rhythm, log photos, or
            track growth over time.
          </Text>
        </View>
      </View>
    </OnboardingShell>
  );
}
