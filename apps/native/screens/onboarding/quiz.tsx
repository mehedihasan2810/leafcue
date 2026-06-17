import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { cn, PressableFeedback, useThemeColor } from "heroui-native";
import { useState } from "react";
import { Text, View } from "react-native";

import { useDatabase } from "@/lib/db";
import type { OnboardingExperience, OnboardingLight } from "@/lib/db/zod";
import { OnboardingShell } from "@/screens/onboarding/_components/onboarding-shell";
import { useOnboardingStore } from "@/stores/use-onboarding-store";

type Option<T extends string> = {
  value: T;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const EXPERIENCE_OPTIONS: ReadonlyArray<Option<OnboardingExperience>> = [
  { value: "new", label: "New to plants", icon: "leaf-outline" },
  { value: "some", label: "A few already", icon: "flower-outline" },
  { value: "expert", label: "Seasoned grower", icon: "ribbon-outline" },
];

const LIGHT_OPTIONS: ReadonlyArray<Option<OnboardingLight>> = [
  { value: "low", label: "Mostly shaded", icon: "moon-outline" },
  { value: "medium", label: "Some daylight", icon: "partly-sunny-outline" },
  { value: "bright", label: "Bright & sunny", icon: "sunny-outline" },
];

const GOAL_OPTIONS: ReadonlyArray<Option<string>> = [
  { value: "remember", label: "Remember to water", icon: "water-outline" },
  { value: "thrive", label: "Help them thrive", icon: "sparkles-outline" },
  { value: "track", label: "Track growth & photos", icon: "camera-outline" },
  { value: "organize", label: "Organize my collection", icon: "grid-outline" },
  { value: "rescue", label: "Revive a struggler", icon: "medkit-outline" },
];

export function OnboardingQuizScreen() {
  const db = useDatabase();
  const profile = useOnboardingStore((state) => state.profile);
  const setProfile = useOnboardingStore((state) => state.setProfile);

  const [experience, setExperience] = useState<OnboardingExperience | null>(
    profile.experience,
  );
  const [homeLight, setHomeLight] = useState<OnboardingLight | null>(
    profile.homeLight,
  );
  const [goals, setGoals] = useState<string[]>(profile.goals);

  const toggleGoal = (value: string) => {
    setGoals((prev) =>
      prev.includes(value)
        ? prev.filter((goal) => goal !== value)
        : [...prev, value],
    );
  };

  const handleContinue = () => {
    setProfile(db, { experience, homeLight, goals });
    router.push("/onboarding/room");
  };

  return (
    <OnboardingShell
      step={3}
      title="Let's make it yours"
      subtitle="A few quick taps so LeafCue can tailor your care plan. No wrong answers."
      primaryLabel="Continue"
      primaryIcon="arrow-forward-outline"
      onPressPrimary={handleContinue}
      secondaryLabel="Back"
      onPressSecondary={() => router.back()}
    >
      <View className="gap-6">
        <QuizSection title="How would you describe yourself?">
          {EXPERIENCE_OPTIONS.map((option) => (
            <ChoiceChip
              key={option.value}
              option={option}
              selected={experience === option.value}
              onPress={() => setExperience(option.value)}
            />
          ))}
        </QuizSection>

        <QuizSection title="How much light does your home get?">
          {LIGHT_OPTIONS.map((option) => (
            <ChoiceChip
              key={option.value}
              option={option}
              selected={homeLight === option.value}
              onPress={() => setHomeLight(option.value)}
            />
          ))}
        </QuizSection>

        <QuizSection title="What do you want help with? (pick any)">
          {GOAL_OPTIONS.map((option) => (
            <ChoiceChip
              key={option.value}
              option={option}
              selected={goals.includes(option.value)}
              onPress={() => toggleGoal(option.value)}
            />
          ))}
        </QuizSection>
      </View>
    </OnboardingShell>
  );
}

function QuizSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View className="gap-2.5">
      <Text className="font-semibold text-base text-foreground">{title}</Text>
      <View className="flex-row flex-wrap gap-2">{children}</View>
    </View>
  );
}

function ChoiceChip({
  option,
  selected,
  onPress,
}: {
  option: Option<string>;
  selected: boolean;
  onPress: () => void;
}) {
  const accent = useThemeColor("accent");
  const muted = useThemeColor("muted");

  return (
    <PressableFeedback
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      className={cn(
        "flex-row items-center gap-2 rounded-2xl border px-4 py-3",
        selected
          ? "border-accent bg-accent-soft"
          : "border-border/50 bg-surface",
      )}
    >
      <Ionicons
        name={option.icon}
        size={17}
        color={selected ? accent : muted}
      />
      <Text
        className={cn(
          "font-medium text-sm",
          selected ? "text-accent" : "text-foreground",
        )}
      >
        {option.label}
      </Text>
    </PressableFeedback>
  );
}
