import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useThemeColor } from "heroui-native";
import { useState } from "react";
import { Text, View } from "react-native";

import { useDatabase } from "@/lib/db";
import { OnboardingShell } from "@/screens/onboarding/_components/onboarding-shell";
import { useReminderStore } from "@/stores/use-reminder-store";

const SAMPLES: ReadonlyArray<{
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
}> = [
  {
    icon: "water-outline",
    title: "Right on time",
    body: "A gentle nudge the day each plant is due — never a moment sooner.",
  },
  {
    icon: "moon-outline",
    title: "Quiet hours respected",
    body: "Nothing buzzes overnight; reminders land when you're around.",
  },
  {
    icon: "options-outline",
    title: "Always optional",
    body: "Adjust the timing or turn reminders off anytime in Settings.",
  },
];

export function OnboardingNotifyScreen() {
  const db = useDatabase();
  const accent = useThemeColor("accent");
  const setEnabled = useReminderStore((state) => state.setEnabled);
  const [submitting, setSubmitting] = useState(false);

  const handleEnable = async () => {
    setSubmitting(true);
    try {
      // Surfacing value first, then this triggers the OS permission prompt.
      await setEnabled(db, true);
    } finally {
      setSubmitting(false);
      router.push("/onboarding/finish");
    }
  };

  return (
    <OnboardingShell
      step={7}
      title="Want a gentle nudge?"
      subtitle="LeafCue can remind you the day a plant needs care — so nothing slips through the cracks."
      primaryLabel={submitting ? "One sec…" : "Turn on reminders"}
      primaryIcon="notifications-outline"
      primaryDisabled={submitting}
      onPressPrimary={handleEnable}
      secondaryLabel="Maybe later"
      onPressSecondary={() => router.push("/onboarding/finish")}
    >
      <View className="gap-3">
        {SAMPLES.map((sample) => (
          <View
            key={sample.title}
            className="flex-row items-start gap-3 rounded-2xl border border-border/40 bg-surface p-4"
          >
            <View className="size-10 items-center justify-center rounded-xl bg-accent-soft">
              <Ionicons name={sample.icon} size={20} color={accent} />
            </View>
            <View className="flex-1 gap-0.5">
              <Text className="font-semibold text-base text-foreground">
                {sample.title}
              </Text>
              <Text className="text-muted text-sm leading-5">
                {sample.body}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </OnboardingShell>
  );
}
