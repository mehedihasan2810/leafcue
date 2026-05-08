import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Button, cn, PressableFeedback, useThemeColor } from "heroui-native";
import type { PropsWithChildren, ReactNode } from "react";
import { Text, View } from "react-native";

import { HeroScreen } from "@/components/hero-screen";
import { useDatabase } from "@/lib/db";
import { useOnboardingStore } from "@/stores/use-onboarding-store";

export const ONBOARDING_STEPS = 5;

type OnboardingShellProps = PropsWithChildren<{
  step: number;
  title: string;
  subtitle?: string;
  illustration?: ReactNode;
  primaryLabel: string;
  primaryIcon?: keyof typeof Ionicons.glyphMap;
  onPressPrimary: () => void;
  primaryDisabled?: boolean;
  secondaryLabel?: string;
  onPressSecondary?: () => void;
  showSkip?: boolean;
}>;

export function OnboardingShell({
  step,
  title,
  subtitle,
  illustration,
  primaryLabel,
  primaryIcon,
  onPressPrimary,
  primaryDisabled,
  secondaryLabel,
  onPressSecondary,
  showSkip = true,
  children,
}: OnboardingShellProps) {
  const accent = useThemeColor("accent");
  const db = useDatabase();
  const completeOnboarding = useOnboardingStore((state) => state.complete);

  const skipLabel = step <= 3 ? "Skip intro" : "Skip setup";

  const handleSkip = () => {
    if (step <= 3) {
      router.replace("/onboarding/room");
      return;
    }
    if (step === 4) {
      completeOnboarding(db);
      router.replace("/(tabs)");
    }
  };

  const eyebrow = (
    <View className="w-full flex-row items-center justify-between">
      <ProgressDots step={step} totalSteps={ONBOARDING_STEPS} />
      {showSkip ? (
        <PressableFeedback onPress={handleSkip}>
          <Text className="font-medium text-muted text-sm">{skipLabel}</Text>
        </PressableFeedback>
      ) : null}
    </View>
  );

  const footer = (
    <View className="gap-2">
      <Button onPress={onPressPrimary} isDisabled={primaryDisabled}>
        {primaryIcon ? (
          <Ionicons name={primaryIcon} size={16} color={accent} />
        ) : null}
        <Button.Label>{primaryLabel}</Button.Label>
      </Button>
      {secondaryLabel ? (
        <Button variant="ghost" onPress={onPressSecondary}>
          <Button.Label>{secondaryLabel}</Button.Label>
        </Button>
      ) : null}
    </View>
  );

  return (
    <HeroScreen
      eyebrow={eyebrow}
      title={title}
      subtitle={subtitle}
      illustration={illustration}
      footer={footer}
    >
      {children}
    </HeroScreen>
  );
}

type ProgressDotsProps = {
  step: number;
  totalSteps: number;
};

function ProgressDots({ step, totalSteps }: ProgressDotsProps) {
  const dots = Array.from({ length: totalSteps }, (_, index) => ({
    id: `progress-dot-${index + 1}-of-${totalSteps}`,
    isActive: index < step,
  }));
  return (
    <View className="flex-row items-center gap-1.5">
      {dots.map((dot) => (
        <View
          key={dot.id}
          className={cn(
            "h-1.5 rounded-full",
            dot.isActive ? "w-6 bg-accent" : "w-1.5 bg-muted/40",
          )}
        />
      ))}
    </View>
  );
}
